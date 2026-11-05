/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 7 (TICKET #45)
 * Target: Web MIDI API Controller Mapping & Byte Stream Parsing
 * Archetype: Empirical Challenger (critic, specialist)
 * Challenger: challenger_m7_1
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const esbuild = require('esbuild');
const { performance } = require('perf_hooks');

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER HARNESS: MILESTONE 7 WEB MIDI API (TICKET #45)  ');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Details: ${err.message}`);
    failures.push({ testName, error: err.message, stack: err.stack });
  }
}

// -----------------------------------------------------------------------------
// MODULE COMPILATION AND VM SANDBOXING
// -----------------------------------------------------------------------------
const midiIndexPath = path.resolve(__dirname, '../src/midi/index.ts');

const midiBundle = esbuild.buildSync({
  entryPoints: [midiIndexPath],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false
});
const midiBundleCode = midiBundle.outputFiles[0].text;

function createMidiContext(customStorage = null, customNavigator = null) {
  const store = customStorage ? { ...customStorage } : {};
  const mockLocalStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    _store: store
  };

  const mockNav = customNavigator || {
    requestMIDIAccess: async () => ({
      inputs: new Map(),
      outputs: new Map(),
      onstatechange: null
    })
  };

  const modExports = {};
  const mod = { exports: modExports };
  const context = vm.createContext({
    module: mod,
    exports: modExports,
    navigator: mockNav,
    localStorage: mockLocalStorage,
    console,
    Math,
    Date,
    String,
    Number,
    Array,
    Object,
    Uint8Array,
    Float32Array,
    performance,
    setTimeout,
    clearTimeout
  });

  vm.runInContext(midiBundleCode, context);
  return {
    exports: mod.exports,
    localStorage: mockLocalStorage,
    context
  };
}

// Default loaded instance for pure functions
const defaultModule = createMidiContext();
const {
  MidiManager,
  parseMidiCCMessage,
  parseMidiNoteMessage,
  normalizeCCValue,
  isNoteOff,
  CANONICAL_DEFAULT_MAPPINGS,
  MIDI_STORAGE_KEY
} = defaultModule.exports;

// =============================================================================
// SUITE 1: HIGH-THROUGHPUT BURST STRESS
// =============================================================================
console.log('\n--- Suite 1: High-Throughput Burst Stress ---');

check('Burst-1: 1,000 rapid CC messages in < 10ms without dropped state or error', () => {
  const mgr = new MidiManager();
  let receivedCount = 0;
  let lastValue = -1;

  mgr.on('cc', (ev) => {
    receivedCount++;
    lastValue = ev.value;
  });

  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    const rawVal = i % 128;
    mgr.handleMessage([0xB0, 1, rawVal]); // CC 1 -> audioSensitivity
  }
  const elapsedMs = performance.now() - startTime;

  assert.strictEqual(receivedCount, 1000, `Expected 1000 received events, got ${receivedCount}`);
  assert.strictEqual(mgr.parameterValues.get('audioSensitivity'), (999 % 128) / 127.0);
  assert.strictEqual(lastValue, (999 % 128) / 127.0);
  assert.ok(elapsedMs < 10.0, `Burst elapsed time must be < 10ms, actual: ${elapsedMs.toFixed(3)}ms`);
  console.log(`    Throughput benchmark: 1,000 messages processed in ${elapsedMs.toFixed(3)}ms (${Math.round(1000 / (elapsedMs / 1000))} msgs/sec)`);
});

check('Burst-2: 1,000 interleaved CC messages cycling across 8 canonical parameters in < 10ms', () => {
  const mgr = new MidiManager();
  const canonicalCCs = [1, 2, 3, 4, 7, 10, 71, 74];
  const canonicalTargets = [
    'audioSensitivity',
    'animationSpeed',
    'persistence',
    'cameraOrbit',
    'audioVolume',
    'colorSaturation',
    'resonance',
    'bloomStrength'
  ];

  let receivedTotal = 0;
  mgr.on('cc', () => { receivedTotal++; });

  const startTime = performance.now();
  for (let i = 0; i < 1000; i++) {
    const ccIndex = i % canonicalCCs.length;
    const ccNum = canonicalCCs[ccIndex];
    const rawVal = (i * 7) % 128;
    mgr.handleMessage([0xB0, ccNum, rawVal]);
  }
  const elapsedMs = performance.now() - startTime;

  assert.strictEqual(receivedTotal, 1000, `Expected 1000 received events, got ${receivedTotal}`);
  assert.ok(elapsedMs < 10.0, `Interleaved burst elapsed time must be < 10ms, actual: ${elapsedMs.toFixed(3)}ms`);

  // Verify all 8 parameters are populated with valid normalized values
  for (const target of canonicalTargets) {
    const val = mgr.parameterValues.get(target);
    assert.ok(val !== undefined, `Target ${target} was not updated`);
    assert.ok(val >= 0.0 && val <= 1.0, `Target ${target} value out of [0, 1]: ${val}`);
  }
});

check('Burst-3: High-throughput stress exceeds minimum 100,000 msgs/sec throughput', () => {
  const mgr = new MidiManager();
  const iterations = 5000;
  const startTime = performance.now();
  for (let i = 0; i < iterations; i++) {
    mgr.handleMessage([0xB0, 1, i % 128]);
  }
  const elapsedMs = performance.now() - startTime;
  const rate = Math.round(iterations / (elapsedMs / 1000));
  assert.ok(rate > 100000, `Expected throughput > 100,000 msgs/sec, got ${rate} msgs/sec`);
});

check('Burst-4: Memory stability: 20,000 rapid messages without runaway memory allocation', () => {
  const mgr = new MidiManager();
  let ccCount = 0;
  mgr.on('cc', () => { ccCount++; });

  if (global.gc) global.gc();
  const memBefore = process.memoryUsage().heapUsed;

  for (let i = 0; i < 20000; i++) {
    mgr.handleMessage([0xB0, (i % 8) === 0 ? 1 : 2, i % 128]);
  }

  const memAfter = process.memoryUsage().heapUsed;
  const heapDeltaMB = (memAfter - memBefore) / (1024 * 1024);

  assert.strictEqual(ccCount, 20000);
  assert.ok(heapDeltaMB < 5.0, `Heap memory growth exceeds 5MB: ${heapDeltaMB.toFixed(2)}MB`);
});

check('Burst-5: Dispatch order and value fidelity preserved under 1,000-message burst', () => {
  const mgr = new MidiManager();
  const log = [];
  mgr.on('cc', (ev) => {
    log.push({ cc: ev.cc, val: ev.value });
  });

  for (let i = 0; i < 1000; i++) {
    mgr.handleMessage([0xB0, 2, i % 128]);
  }

  assert.strictEqual(log.length, 1000);
  for (let i = 0; i < 1000; i++) {
    assert.strictEqual(log[i].cc, 2);
    assert.strictEqual(log[i].val, (i % 128) / 127.0);
  }
});

// =============================================================================
// SUITE 2: BYTE STREAM FUZZING & MALFORMED INPUTS
// =============================================================================
console.log('\n--- Suite 2: Byte Stream Fuzzing & Malformed Inputs ---');

check('Fuzz-1: Truncated byte streams and empty arrays return null without throwing', () => {
  assert.strictEqual(parseMidiCCMessage(null), null);
  assert.strictEqual(parseMidiCCMessage(undefined), null);
  assert.strictEqual(parseMidiCCMessage([]), null);
  assert.strictEqual(parseMidiCCMessage(new Uint8Array(0)), null);
  assert.strictEqual(parseMidiCCMessage([0xB0]), null);
  assert.strictEqual(parseMidiCCMessage(new Uint8Array([0xB0])), null);
  assert.strictEqual(parseMidiCCMessage([0xB0, 1]), null);
  assert.strictEqual(parseMidiCCMessage(new Uint8Array([0xB0, 1])), null);
});

check('Fuzz-2: Oversized byte arrays safely parse first 3 bytes without throwing', () => {
  const fourBytes = parseMidiCCMessage([0xB0, 1, 64, 0x00]);
  assert.ok(fourBytes !== null);
  assert.strictEqual(fourBytes.channel, 0);
  assert.strictEqual(fourBytes.cc, 1);
  assert.strictEqual(fourBytes.normalizedValue, 64 / 127.0);

  const tenBytes = parseMidiCCMessage(new Uint8Array([0xB3, 10, 127, 1, 2, 3, 4, 5, 6, 7]));
  assert.ok(tenBytes !== null);
  assert.strictEqual(tenBytes.channel, 3);
  assert.strictEqual(tenBytes.cc, 10);
  assert.strictEqual(tenBytes.normalizedValue, 1.0);
});

check('Fuzz-3: Non-CC MIDI status bytes (0x80 to 0xF0) are rejected by parseMidiCCMessage', () => {
  const nonCCStatuses = [
    0x80, // Note Off
    0x90, // Note On
    0xA0, // Polyphonic Aftertouch
    0xC0, // Program Change
    0xD0, // Channel Aftertouch
    0xE0, // Pitch Bend
    0xF0, // SysEx Start
    0xF7, // SysEx End
    0xF8, // Timing Clock
    0xFA, // Start
    0xFC, // Stop
    0xFE, // Active Sensing
    0xFF  // System Reset
  ];

  for (const status of nonCCStatuses) {
    const res = parseMidiCCMessage([status, 1, 64]);
    assert.strictEqual(res, null, `Status 0x${status.toString(16)} should return null in parseMidiCCMessage`);
  }
});

check('Fuzz-4: Garbage and non-standard status bytes return null in parseMidiCCMessage', () => {
  const garbageStatuses = [0x00, 0x01, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x7F];
  for (const status of garbageStatuses) {
    const res = parseMidiCCMessage([status, 1, 64]);
    assert.strictEqual(res, null, `Garbage status 0x${status.toString(16)} should return null`);
  }
});

check('Fuzz-5: Negative byte values in raw data are clamped cleanly to 0.0', () => {
  assert.strictEqual(normalizeCCValue(-1), 0.0);
  assert.strictEqual(normalizeCCValue(-50), 0.0);
  assert.strictEqual(normalizeCCValue(-128), 0.0);
  assert.strictEqual(normalizeCCValue(-99999), 0.0);

  const parsed = parseMidiCCMessage([0xB0, 1, -25]);
  assert.ok(parsed !== null);
  assert.strictEqual(parsed.normalizedValue, 0.0);
});

check('Fuzz-6: Out-of-bounds byte values (> 127) are clamped cleanly to 1.0', () => {
  assert.strictEqual(normalizeCCValue(128), 1.0);
  assert.strictEqual(normalizeCCValue(200), 1.0);
  assert.strictEqual(normalizeCCValue(255), 1.0);
  assert.strictEqual(normalizeCCValue(99999), 1.0);

  const parsed = parseMidiCCMessage([0xB0, 1, 300]);
  assert.ok(parsed !== null);
  assert.strictEqual(parsed.normalizedValue, 1.0);
});

check('Fuzz-7: Pseudo-random adversarial fuzz stream (1,000 arbitrary byte payloads) causes zero exceptions', () => {
  const mgr = new MidiManager();
  let ccEvents = 0;
  mgr.on('cc', () => { ccEvents++; });

  for (let i = 0; i < 1000; i++) {
    // Generate randomized length between 0 and 15
    const len = Math.floor(Math.random() * 16);
    const bytes = [];
    for (let j = 0; j < len; j++) {
      // Generate randomized byte values, including negative, >255, and standard bytes
      const mode = Math.random();
      if (mode < 0.2) {
        bytes.push(Math.floor(Math.random() * 256));
      } else if (mode < 0.4) {
        bytes.push(Math.floor(Math.random() * -100));
      } else if (mode < 0.6) {
        bytes.push(Math.floor(Math.random() * 500) + 128);
      } else {
        // Legitimate MIDI CC byte sequence
        bytes.push(0xB0 | (j === 0 ? Math.floor(Math.random() * 16) : 0));
      }
    }

    // Must not throw under any generated byte permutation
    assert.doesNotThrow(() => {
      mgr.handleMessage(bytes);
      mgr.handleMessage(new Uint8Array(bytes.map(b => (b < 0 ? 0 : b > 255 ? 255 : b))));
    });
  }
});

check('Fuzz-8: Non-array or malformed data types in handleMessage do not crash manager', () => {
  const mgr = new MidiManager();
  const malformedInputs = [
    null,
    undefined,
    'garbage-string',
    12345,
    true,
    {},
    { length: 2 },
    { length: 3, 0: 0xB0, 1: 1, 2: 64 }, // ArrayLike
    Symbol('midi')
  ];

  for (const input of malformedInputs) {
    assert.doesNotThrow(() => {
      mgr.handleMessage(input);
    });
  }
});

// =============================================================================
// SUITE 3: CHANNEL ISOLATION (0xB0 TO 0xBF)
// =============================================================================
console.log('\n--- Suite 3: Channel Isolation (0xB0 to 0xBF) ---');

check('Channel-1: parseMidiCCMessage extracts channel nibble 0 to 15 accurately across all 16 channels', () => {
  for (let ch = 0; ch < 16; ch++) {
    const statusByte = 0xB0 | ch;
    const parsed = parseMidiCCMessage([statusByte, 7, 100]);

    assert.ok(parsed !== null, `Failed to parse status byte 0x${statusByte.toString(16)}`);
    assert.strictEqual(parsed.channel, ch, `Expected channel ${ch}, got ${parsed.channel}`);
    assert.strictEqual(parsed.cc, 7);
    assert.strictEqual(parsed.isCC, true);
    assert.strictEqual(parsed.normalizedValue, 100 / 127.0);
  }
});

check('Channel-2: MidiManager.handleMessage preserves and dispatches correct channel tag to listeners', () => {
  const mgr = new MidiManager();
  const channelEvents = [];

  mgr.on('cc', (ev) => {
    channelEvents.push({ ch: ev.channel, cc: ev.cc, val: ev.value });
  });

  for (let ch = 0; ch < 16; ch++) {
    const status = 0xB0 | ch;
    mgr.handleMessage([status, 1, ch * 8]); // CC 1 is mapped to audioSensitivity
  }

  assert.strictEqual(channelEvents.length, 16);
  for (let ch = 0; ch < 16; ch++) {
    assert.strictEqual(channelEvents[ch].ch, ch, `Event ${ch} channel mismatch`);
    assert.strictEqual(channelEvents[ch].cc, 1);
    assert.strictEqual(channelEvents[ch].val, (ch * 8) / 127.0);
  }
});

check('Channel-3: Interleaved rapid stream across all 16 channels maintains strict channel identity', () => {
  const mgr = new MidiManager();
  const receivedByChannel = new Map();
  for (let i = 0; i < 16; i++) receivedByChannel.set(i, 0);

  mgr.on('cc', (ev) => {
    receivedByChannel.set(ev.channel, receivedByChannel.get(ev.channel) + 1);
  });

  // Send 160 messages (10 per channel in round-robin sequence)
  for (let round = 0; round < 10; round++) {
    for (let ch = 0; ch < 16; ch++) {
      mgr.handleMessage([0xB0 | ch, 4, 64]); // CC 4 -> cameraOrbit
    }
  }

  for (let ch = 0; ch < 16; ch++) {
    assert.strictEqual(receivedByChannel.get(ch), 10, `Channel ${ch} expected 10 events, got ${receivedByChannel.get(ch)}`);
  }
});

check('Channel-4: Channel isolation in Note-On and Note-Off events across all 16 channels', () => {
  const mgr = new MidiManager();
  const noteEvents = [];

  mgr.on('noteOn', (ev) => { noteEvents.push({ type: 'on', ...ev }); });
  mgr.on('noteOff', (ev) => { noteEvents.push({ type: 'off', ...ev }); });

  for (let ch = 0; ch < 16; ch++) {
    // Note On
    mgr.handleMessage([0x90 | ch, 60 + ch, 100]);
    // Note Off via 0x80
    mgr.handleMessage([0x80 | ch, 60 + ch, 0]);
    // Note Off via 0x90 with velocity 0
    mgr.handleMessage([0x90 | ch, 60 + ch, 0]);
  }

  assert.strictEqual(noteEvents.length, 48);
  for (let ch = 0; ch < 16; ch++) {
    const onEv = noteEvents[ch * 3];
    const offEv1 = noteEvents[ch * 3 + 1];
    const offEv2 = noteEvents[ch * 3 + 2];

    assert.strictEqual(onEv.channel, ch);
    assert.strictEqual(onEv.note, 60 + ch);
    assert.strictEqual(onEv.velocity, 100);

    assert.strictEqual(offEv1.channel, ch);
    assert.strictEqual(offEv1.note, 60 + ch);

    assert.strictEqual(offEv2.channel, ch);
    assert.strictEqual(offEv2.note, 60 + ch);
  }
});

// =============================================================================
// SUITE 4: NORMALIZATION ACCURACY & FLOAT PRECISION STABILITY
// =============================================================================
console.log('\n--- Suite 4: Normalization Accuracy & Float Precision Stability ---');

check('Norm-1: Canonical boundary normalization: 0 -> 0.0, 127 -> 1.0', () => {
  assert.strictEqual(normalizeCCValue(0), 0.0);
  assert.strictEqual(normalizeCCValue(127), 1.0);
});

check('Norm-2: Exact midpoint normalization: 64 -> 64 / 127.0', () => {
  const expected = 64 / 127.0;
  const actual = normalizeCCValue(64);
  assert.strictEqual(actual, expected);
  assert.ok(Math.abs(actual - 0.5039370078740157) < 1e-15);
});

check('Norm-3: Exhaustive 128-step sweep (0..127) strictly strictly monotonic', () => {
  let prev = -1;
  for (let i = 0; i <= 127; i++) {
    const val = normalizeCCValue(i);
    assert.ok(val >= 0.0 && val <= 1.0, `Value ${val} for raw ${i} out of bounds`);
    assert.ok(val > prev, `Monotonicity violated at raw ${i}: ${val} <= ${prev}`);
    prev = val;
  }
});

check('Norm-4: Step delta linearity is uniform 1/127 across all steps', () => {
  const expectedStep = 1.0 / 127.0;
  for (let i = 0; i < 127; i++) {
    const step = normalizeCCValue(i + 1) - normalizeCCValue(i);
    assert.ok(Math.abs(step - expectedStep) < 1e-15, `Non-uniform step at ${i}: delta ${step}`);
  }
});

check('Norm-5: Invertibility and precision: |norm * 127 - raw| < 1e-12 for all 128 values', () => {
  for (let i = 0; i <= 127; i++) {
    const norm = normalizeCCValue(i);
    const recovered = norm * 127.0;
    assert.ok(Math.abs(recovered - i) < 1e-12, `Inversion error at ${i}: recovered ${recovered}`);
  }
});

check('Norm-6: Clamping stability: negative numbers clamp to 0.0, > 127 clamp to 1.0', () => {
  const extremeValues = [-1000000, -100, -1, -0.0001, 127.0001, 128, 255, 1000000];
  for (const v of extremeValues) {
    const res = normalizeCCValue(v);
    if (v < 0) {
      assert.strictEqual(res, 0.0, `Expected 0.0 for ${v}, got ${res}`);
    } else {
      assert.strictEqual(res, 1.0, `Expected 1.0 for ${v}, got ${res}`);
    }
  }
});

check('Norm-7: Non-finite inputs (NaN, Infinity, -Infinity) produce predictable clamped numbers', () => {
  const nanVal = normalizeCCValue(NaN);
  assert.ok(Number.isNaN(nanVal), 'NaN input returns NaN');

  const infVal = normalizeCCValue(Infinity);
  assert.strictEqual(infVal, 1.0, 'Infinity input clamps to 1.0');

  const negInfVal = normalizeCCValue(-Infinity);
  assert.strictEqual(negInfVal, 0.0, '-Infinity input clamps to 0.0');
});

// =============================================================================
// SUITE 5: MIDI LEARN STRESS, CONFLICT DE-DUPLICATION & LIFECYCLE
// =============================================================================
console.log('\n--- Suite 5: MIDI Learn Stress, Conflict De-Duplication & Lifecycle ---');

check('Learn-1: 50 rapid sequential learn-bind-overwrite cycles execute cleanly', () => {
  const mgr = new MidiManager();

  for (let cycle = 0; cycle < 50; cycle++) {
    const targetParam = `customParam_${cycle}`;
    const targetCC = 20 + (cycle % 40);

    mgr.startLearn(targetParam);
    assert.strictEqual(mgr.isLearning, true);
    assert.strictEqual(mgr.learningTarget, targetParam);

    // Incoming CC triggers binding
    mgr.handleMessage([0xB0, targetCC, 75]);

    assert.strictEqual(mgr.isLearning, false);
    assert.strictEqual(mgr.learningTarget, null);
    assert.strictEqual(mgr.mappings.get(targetCC), targetParam);
    assert.strictEqual(mgr.parameterValues.get(targetParam), 75 / 127.0);
  }
});

check('Learn-2: Conflict de-duplication: binding Target A to new CC automatically unbinds previous CC for Target A', () => {
  const mgr = new MidiManager();
  mgr.setMapping(15, 'bloomStrength');
  assert.strictEqual(mgr.mappings.get(15), 'bloomStrength');

  // Re-bind bloomStrength to CC 25
  mgr.setMapping(25, 'bloomStrength');
  assert.strictEqual(mgr.mappings.get(25), 'bloomStrength');
  assert.strictEqual(mgr.mappings.has(15), false, 'Old CC 15 should have been de-duplicated and removed');

  // Verify CC 15 no longer updates bloomStrength
  mgr.handleMessage([0xB0, 15, 127]);
  assert.notStrictEqual(mgr.parameterValues.get('bloomStrength'), 1.0);

  // CC 25 updates bloomStrength
  mgr.handleMessage([0xB0, 25, 127]);
  assert.strictEqual(mgr.parameterValues.get('bloomStrength'), 1.0);
});

check('Learn-3: Overwrite de-duplication: binding new Target B to existing CC replaces previous Target A', () => {
  const mgr = new MidiManager();
  mgr.setMapping(30, 'cameraOrbit');
  assert.strictEqual(mgr.mappings.get(30), 'cameraOrbit');

  // Overwrite CC 30 with animationSpeed
  mgr.setMapping(30, 'animationSpeed');
  assert.strictEqual(mgr.mappings.get(30), 'animationSpeed');

  // Verify CC 30 updates animationSpeed, not cameraOrbit
  mgr.handleMessage([0xB0, 30, 64]);
  assert.strictEqual(mgr.parameterValues.get('animationSpeed'), 64 / 127.0);
});

check('Learn-4: Explicit unbind removes mapping and halts parameter updates', () => {
  const mgr = new MidiManager();
  mgr.setMapping(45, 'audioSensitivity');
  assert.strictEqual(mgr.mappings.has(45), true);

  mgr.unbind(45);
  assert.strictEqual(mgr.mappings.has(45), false);

  mgr.handleMessage([0xB0, 45, 127]);
  assert.notStrictEqual(mgr.parameterValues.get('audioSensitivity'), 1.0);
});

check('Learn-5: Learn cancellation aborts learn state without binding incoming CCs', () => {
  const mgr = new MidiManager();
  mgr.startLearn('persistence');
  assert.strictEqual(mgr.isLearning, true);

  mgr.cancelLearn();
  assert.strictEqual(mgr.isLearning, false);
  assert.strictEqual(mgr.learningTarget, null);

  // Send CC 55
  mgr.handleMessage([0xB0, 55, 64]);
  assert.strictEqual(mgr.mappings.has(55), false, 'CC 55 should not be bound after cancellation');
});

check('Learn-6: 50 rapid startLearn / cancelLearn toggle cycles preserve state cleanly', () => {
  const mgr = new MidiManager();
  let cancelEvents = 0;
  mgr.on('learnCancel', () => { cancelEvents++; });

  for (let i = 0; i < 50; i++) {
    mgr.startLearn(`param_${i}`);
    assert.strictEqual(mgr.isLearning, true);
    mgr.cancelLearn();
    assert.strictEqual(mgr.isLearning, false);
    assert.strictEqual(mgr.learningTarget, null);
  }

  assert.strictEqual(cancelEvents, 50);
});

check('Learn-7: Non-CC messages (Note, PitchBend) during Learn mode are rejected and do not bind', () => {
  const mgr = new MidiManager();
  mgr.startLearn('audioSensitivity');

  // Send Note On
  mgr.handleMessage([0x90, 60, 100]);
  assert.strictEqual(mgr.isLearning, true, 'Note On must not trigger CC learn binding');

  // Send Pitch Bend (0xE0)
  mgr.handleMessage([0xE0, 0, 64]);
  assert.strictEqual(mgr.isLearning, true, 'Pitch Bend must not trigger CC learn binding');

  // Cancel learn
  mgr.cancelLearn();
  assert.strictEqual(mgr.isLearning, false);
});

// =============================================================================
// SUITE 6: LOCALSTORAGE ROBUSTNESS & FAILURE INJECTION
// =============================================================================
console.log('\n--- Suite 6: LocalStorage Robustness & Failure Injection ---');

check('Storage-1: Corrupted JSON strings in localStorage safely recover to canonical defaults', () => {
  const corruptedPayloads = [
    '{broken:json',
    '{"1": "audioSensitivity", broken',
    '<html><body>Not JSON</body></html>',
    'undefined',
    'NaN',
    '{{{{',
    'true',
    '42'
  ];

  for (const payload of corruptedPayloads) {
    const sandbox = createMidiContext({ [MIDI_STORAGE_KEY]: payload });
    const mgr = new sandbox.exports.MidiManager();

    // Must not throw during load
    assert.doesNotThrow(() => {
      mgr.loadMappings();
    }, `Failed to handle corrupted payload: ${payload}`);

    // Must retain canonical default mappings
    assert.strictEqual(mgr.mappings.get(1), 'audioSensitivity');
    assert.strictEqual(mgr.mappings.get(74), 'bloomStrength');
  }
});

check('Storage-2: Empty strings and whitespace in localStorage cleanly fall back to defaults', () => {
  const emptyPayloads = ['', '   ', '\n\t'];
  for (const empty of emptyPayloads) {
    const sandbox = createMidiContext({ [MIDI_STORAGE_KEY]: empty });
    const mgr = new sandbox.exports.MidiManager();

    assert.doesNotThrow(() => {
      mgr.loadMappings();
    });

    assert.strictEqual(mgr.mappings.get(1), 'audioSensitivity');
    assert.strictEqual(mgr.mappings.get(2), 'animationSpeed');
  }
});

check('Storage-3: Malformed objects, arrays, and null in localStorage do not throw and preserve defaults', () => {
  const strangePayloads = ['null', '[]', '[1, 2, 3]', '"just-a-string"'];
  for (const strange of strangePayloads) {
    const sandbox = createMidiContext({ [MIDI_STORAGE_KEY]: strange });
    const mgr = new sandbox.exports.MidiManager();

    assert.doesNotThrow(() => {
      mgr.loadMappings();
    });

    assert.strictEqual(mgr.mappings.get(1), 'audioSensitivity');
  }
});

check('Storage-4: Partial corrupted mappings filter invalid keys and extract valid ones', () => {
  const mixedPayload = JSON.stringify({
    'NaN': 'brokenKey',
    'invalid': 'badCC',
    '50': 'customTarget',
    '51': null,
    '52': 12345,
    '53': { target: 'nestedTarget' }
  });

  const sandbox = createMidiContext({ [MIDI_STORAGE_KEY]: mixedPayload });
  const mgr = new sandbox.exports.MidiManager();
  mgr.loadMappings();

  assert.strictEqual(mgr.mappings.get(50), 'customTarget');
  assert.strictEqual(mgr.mappings.get(53), 'nestedTarget');
  assert.strictEqual(mgr.mappings.has(51), false);
  assert.strictEqual(mgr.mappings.has(52), false);
});

check('Storage-5: QuotaExceededError in localStorage.setItem is safely caught without throwing', () => {
  const failingStorage = {
    getItem: () => null,
    setItem: () => {
      const err = new Error('The quota has been exceeded');
      err.name = 'QuotaExceededError';
      throw err;
    },
    removeItem: () => {},
    clear: () => {}
  };

  const sandbox = createMidiContext();
  sandbox.context.localStorage = failingStorage;

  const mgr = new sandbox.exports.MidiManager();

  assert.doesNotThrow(() => {
    mgr.setMapping(99, 'audioSensitivity');
  }, 'QuotaExceededError should be caught inside saveMappings');

  // In-memory mapping should still succeed
  assert.strictEqual(mgr.mappings.get(99), 'audioSensitivity');
});

check('Storage-6: SecurityError / AccessDenied in localStorage.getItem is safely handled', () => {
  const restrictedStorage = {
    getItem: () => {
      const err = new Error('Access is denied for this document');
      err.name = 'SecurityError';
      throw err;
    },
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };

  const sandbox = createMidiContext();
  sandbox.context.localStorage = restrictedStorage;

  const mgr = new sandbox.exports.MidiManager();

  assert.doesNotThrow(() => {
    mgr.loadMappings();
  });

  // Default mappings should still be active
  assert.strictEqual(mgr.mappings.get(1), 'audioSensitivity');
});

check('Storage-7: Undefined localStorage environment operates safely with zero exceptions', () => {
  const sandbox = createMidiContext();
  delete sandbox.context.localStorage;

  const mgr = new sandbox.exports.MidiManager();

  assert.doesNotThrow(() => {
    mgr.loadMappings();
    mgr.setMapping(12, 'animationSpeed');
    mgr.saveMappings();
  });

  assert.strictEqual(mgr.mappings.get(12), 'animationSpeed');
});

check('Storage-8: Full round-trip persistence: save custom overrides and new mappings, restore with 100% fidelity', () => {
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };

  const sandbox1 = createMidiContext(store);
  sandbox1.context.localStorage = mockLocalStorage;
  const mgr1 = new sandbox1.exports.MidiManager();

  // Override canonical default CC 1 and CC 74
  mgr1.setMapping(1, 'customSensitivity');
  mgr1.setMapping(74, 'customBloom');
  // Add new custom CCs
  mgr1.setMapping(21, 'customParamA');
  mgr1.setMapping(22, 'customParamB');

  // Verify stored JSON
  const storedJson = mockLocalStorage.getItem(MIDI_STORAGE_KEY);
  assert.ok(storedJson !== null, 'localStorage should have stored JSON');
  const parsed = JSON.parse(storedJson);
  assert.strictEqual(parsed['1'], 'customSensitivity');
  assert.strictEqual(parsed['74'], 'customBloom');
  assert.strictEqual(parsed['21'], 'customParamA');
  assert.strictEqual(parsed['22'], 'customParamB');

  // Instantiate second manager sharing same localStorage and load mappings
  const sandbox2 = createMidiContext(store);
  sandbox2.context.localStorage = mockLocalStorage;
  const mgr2 = new sandbox2.exports.MidiManager();
  mgr2.loadMappings();

  assert.strictEqual(mgr2.mappings.get(1), 'customSensitivity');
  assert.strictEqual(mgr2.mappings.get(74), 'customBloom');
  assert.strictEqual(mgr2.mappings.get(21), 'customParamA');
  assert.strictEqual(mgr2.mappings.get(22), 'customParamB');
  // Untouched default CC 2 should remain as fallback
  assert.strictEqual(mgr2.mappings.get(2), 'animationSpeed');

  // Test resetToDefaults() restores canonical defaults and updates storage
  mgr2.resetToDefaults();
  assert.strictEqual(mgr2.mappings.get(1), 'audioSensitivity');
  assert.strictEqual(mgr2.mappings.get(74), 'bloomStrength');
  assert.strictEqual(mgr2.mappings.has(21), false);
  assert.strictEqual(mgr2.mappings.has(22), false);

  const resetJson = JSON.parse(mockLocalStorage.getItem(MIDI_STORAGE_KEY));
  assert.strictEqual(resetJson['1'], 'audioSensitivity');
  assert.strictEqual(resetJson['74'], 'bloomStrength');
  assert.strictEqual(resetJson['21'], undefined);
});

// =============================================================================
// SUITE 7: NOTE PARSING, EVENT DISPATCHER RESILIENCE & LIFECYCLE
// =============================================================================
console.log('\n--- Suite 7: Note Parsing, Event Dispatcher Resilience & Lifecycle ---');

check('Note-1: parseMidiNoteMessage parses Note-On events accurately', () => {
  const noteOn = parseMidiNoteMessage([0x90, 60, 100]);
  assert.ok(noteOn !== null);
  assert.strictEqual(noteOn.type, 'noteOn');
  assert.strictEqual(noteOn.note, 60);
  assert.strictEqual(noteOn.velocity, 100);
  assert.strictEqual(noteOn.channel, 0);
});

check('Note-2: parseMidiNoteMessage parses 0x80 Note-Off events accurately', () => {
  const noteOff = parseMidiNoteMessage([0x80, 62, 40]);
  assert.ok(noteOff !== null);
  assert.strictEqual(noteOff.type, 'noteOff');
  assert.strictEqual(noteOff.note, 62);
  assert.strictEqual(noteOff.velocity, 0);
  assert.strictEqual(noteOff.channel, 0);
});

check('Note-3: MIDI standard Note-On with velocity 0 is treated as Note-Off', () => {
  const noteZero = parseMidiNoteMessage([0x90, 64, 0]);
  assert.ok(noteZero !== null);
  assert.strictEqual(noteZero.type, 'noteOff');
  assert.strictEqual(noteZero.note, 64);
  assert.strictEqual(noteZero.velocity, 0);
});

check('Event-1: Event dispatcher isolates subscriber errors without halting other listeners', () => {
  const mgr = new MidiManager();
  let cleanListenerCalled = false;

  // Failing listener
  mgr.on('cc', () => {
    throw new Error('Subscriber internal failure');
  });

  // Clean listener
  mgr.on('cc', () => {
    cleanListenerCalled = true;
  });

  // Must not throw when emitting to failing subscriber
  assert.doesNotThrow(() => {
    mgr.handleMessage([0xB0, 1, 64]);
  });

  assert.strictEqual(cleanListenerCalled, true, 'Subsequent clean listeners must execute despite error in previous listener');
});

check('Event-2: MidiManager.off correctly unregisters specific event handlers', () => {
  const mgr = new MidiManager();
  let callCount = 0;
  const handler = () => { callCount++; };

  mgr.on('cc', handler);
  mgr.handleMessage([0xB0, 1, 64]);
  assert.strictEqual(callCount, 1);

  mgr.off('cc', handler);
  mgr.handleMessage([0xB0, 1, 64]);
  assert.strictEqual(callCount, 1, 'Handler must not be called after off()');
});

check('Lifecycle-1: destroy() cleanly clears all inputs, listeners, and resets state', () => {
  const mockPort = { onmidimessage: () => {} };
  const mgr = new MidiManager();
  mgr.inputs.set('test-port', mockPort);
  mgr.on('cc', () => {});
  mgr.startLearn('bloomStrength');

  mgr.destroy();

  assert.strictEqual(mockPort.onmidimessage, null, 'Input onmidimessage must be nulled');
  assert.strictEqual(mgr.inputs.size, 0, 'Inputs map must be cleared');
  assert.strictEqual(mgr.isConnected, false);
  assert.strictEqual(mgr.isLearning, false);
  assert.strictEqual(mgr.learningTarget, null);

  // Calling handleMessage after destroy does not emit or throw
  assert.doesNotThrow(() => {
    mgr.handleMessage([0xB0, 1, 64]);
  });
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n========================================================================');
console.log(`  EMPIRICAL CHALLENGE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log('========================================================================\n');

if (failedTests > 0) {
  console.error(`FAILED (${failedTests} tests failed):\n`);
  failures.forEach(f => {
    console.error(`- ${f.testName}: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL CHALLENGES PASSED WITH ZERO FAILURES.\n');
  process.exit(0);
}
