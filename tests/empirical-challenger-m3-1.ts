/**
 * EMPIRICAL CHALLENGER TEST SUITE: TICKET #41
 * feat(tuning): Implement Preset Fine-Tuning drawer with live parameter controls
 * Challenger: challenger_m3_1
 */

import { setupTestEnvironment, MockElement } from './harness/env';
import { createMockPresetContext, createBeatDropAudioFeatures, createMockTheme } from './harness/fixtures';
import { renderTuningPanel, updateTuningButtonState, formatParamValue } from '../src/tuning/TuningPanel';
import { ParameterStore } from '../src/tuning/ParameterStore';
import { VisualizerPreset, ParameterDefinition } from '../src/types';

import { CircularSpectrumPreset } from '../src/presets/CircularSpectrum';
import { WaveFormPreset } from '../src/presets/WaveForm';
import { ThreeDBarsPreset } from '../src/presets/ThreeDBars';
import { ObsidianPolyPreset } from '../src/presets/ObsidianPoly';
import { FerrofluidPreset } from '../src/presets/Ferrofluid';
import { NeonTunnelPreset } from '../src/presets/NeonTunnel';
import { StarfieldPreset } from '../src/presets/Starfield';
import { ParticleFieldPreset } from '../src/presets/ParticleField';
import { SynthwaveTerrainPreset } from '../src/presets/SynthwaveTerrain';
import { MilkDropPreset } from '../src/presets/MilkDrop';
import { DNAHelixPreset } from '../src/presets/DNAHelix';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: Array<{ testName: string; error: string; stack?: string }> = [];

function check(testName: string, fn: () => void): void {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err: unknown) {
    failedTests++;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Details: ${message}`);
    failures.push({ testName, error: message, stack });
  }
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function getTunablePresets(): VisualizerPreset[] {
  return [
    new WaveFormPreset(),
    new ParticleFieldPreset(),
    new CircularSpectrumPreset(),
    new FerrofluidPreset(),
    new ObsidianPolyPreset(),
    new NeonTunnelPreset(),
    new StarfieldPreset(),
    new ThreeDBarsPreset(),
    new SynthwaveTerrainPreset()
  ];
}

console.log('========================================================================');
console.log('       EMPIRICAL CHALLENGER VERIFICATION HARNESS: TICKET #41           ');
console.log('========================================================================\n');

setupTestEnvironment();

// =============================================================================
// SECTION 1: EMPIRICAL BOUNDARY STRESS ON ALL TUNABLE PRESETS
// =============================================================================
console.log('--- SECTION 1: Empirical Boundary Stress Across Presets ---');

check('1.1: ParameterStore core boundary handling (NaN, Infinity, extremes, types)', () => {
  const schema: ParameterDefinition[] = [
    { id: 'p1', name: 'Param 1', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
    { id: 'p2', name: 'Param 2', min: -5.0, max: 5.0, step: 0.5, defaultValue: 0.0 },
    { id: 'p3', name: 'Param 3', min: 10, max: 100, step: 5, defaultValue: 50 }
  ];
  const store = new ParameterStore(schema);

  // Initial defaults
  assert(store.getValue('p1') === 1.0, 'p1 default value mismatch');
  assert(store.getValue('p2') === 0.0, 'p2 default value mismatch');
  assert(store.getValue('p3') === 50, 'p3 default value mismatch');

  // Negative extreme (-1e9)
  store.setValue('p1', -1e9);
  assert(store.getValue('p1') === 0.1, `Expected p1 clamped to min 0.1, got ${store.getValue('p1')}`);
  store.setValue('p2', -1e9);
  assert(store.getValue('p2') === -5.0, `Expected p2 clamped to min -5.0, got ${store.getValue('p2')}`);

  // Positive extreme (+1e9)
  store.setValue('p1', 1e9);
  assert(store.getValue('p1') === 2.5, `Expected p1 clamped to max 2.5, got ${store.getValue('p1')}`);
  store.setValue('p2', 1e9);
  assert(store.getValue('p2') === 5.0, `Expected p2 clamped to max 5.0, got ${store.getValue('p2')}`);

  // NaN fallback
  store.setValue('p1', NaN);
  assert(store.getValue('p1') === 1.0, `Expected p1 fallback to defaultValue 1.0 on NaN, got ${store.getValue('p1')}`);

  // Infinity and -Infinity fallback
  store.setValue('p2', Infinity);
  assert(store.getValue('p2') === 0.0, `Expected p2 fallback to defaultValue 0.0 on Infinity, got ${store.getValue('p2')}`);
  store.setValue('p2', -Infinity);
  assert(store.getValue('p2') === 0.0, `Expected p2 fallback to defaultValue 0.0 on -Infinity, got ${store.getValue('p2')}`);

  // Negative zero (-0)
  store.setValue('p2', -0);
  assert(store.getValue('p2') === 0, `Expected p2 to be 0 for -0, got ${store.getValue('p2')}`);

  // Non-number types (undefined, strings, null, objects)
  store.setValue('p1', undefined as unknown as number);
  assert(store.getValue('p1') === 1.0, `Expected p1 fallback to default on undefined, got ${store.getValue('p1')}`);
  store.setValue('p1', '999' as unknown as number);
  assert(store.getValue('p1') === 1.0, `Expected p1 fallback to default on string "999", got ${store.getValue('p1')}`);
  store.setValue('p1', null as unknown as number);
  assert(store.getValue('p1') === 1.0, `Expected p1 fallback to default on null, got ${store.getValue('p1')}`);
  store.setValue('p1', {} as unknown as number);
  assert(store.getValue('p1') === 1.0, `Expected p1 fallback to default on object, got ${store.getValue('p1')}`);

  // Unknown IDs
  store.setValue('unknown_id', 99.0);
  assert(store.getValue('unknown_id') === 0, 'Unknown ID should return 0 fallback');
  store.setValue('__proto__', 99.0);
  assert(store.getValue('__proto__') === 0, '__proto__ key injection should be ignored');
});

check('1.2: Extreme boundary values (-1e9, 1e9, NaN, Infinity, -0, undefined, strings) on all 9 presets', () => {
  const presets = getTunablePresets();
  assert(presets.length === 9, `Expected 9 tunable presets, found ${presets.length}`);

  for (const p of presets) {
    const params = p.getCustomParameters?.();
    assert(params && params.length >= 3, `Preset ${p.id} must expose at least 3 parameters`);

    for (const def of params) {
      // 1. Minimum clamping
      p.setCustomParameter!(def.id, -1e9);
      const valMin = p.getCustomParameterValue!(def.id);
      assert(valMin === def.min, `Preset ${p.id} param ${def.id}: expected clamped min ${def.min}, got ${valMin}`);

      // 2. Maximum clamping
      p.setCustomParameter!(def.id, 1e9);
      const valMax = p.getCustomParameterValue!(def.id);
      assert(valMax === def.max, `Preset ${p.id} param ${def.id}: expected clamped max ${def.max}, got ${valMax}`);

      // 3. NaN fallback
      p.setCustomParameter!(def.id, NaN);
      const valNaN = p.getCustomParameterValue!(def.id);
      assert(valNaN === def.defaultValue, `Preset ${p.id} param ${def.id}: expected defaultValue on NaN, got ${valNaN}`);

      // 4. Infinity fallback
      p.setCustomParameter!(def.id, Infinity);
      const valInf = p.getCustomParameterValue!(def.id);
      assert(valInf === def.defaultValue, `Preset ${p.id} param ${def.id}: expected defaultValue on Infinity, got ${valInf}`);

      // 5. -Infinity fallback
      p.setCustomParameter!(def.id, -Infinity);
      const valNInf = p.getCustomParameterValue!(def.id);
      assert(valNInf === def.defaultValue, `Preset ${p.id} param ${def.id}: expected defaultValue on -Infinity, got ${valNInf}`);

      // 6. Negative zero (-0)
      p.setCustomParameter!(def.id, -0);
      const valNegZero = p.getCustomParameterValue!(def.id)!;
      assert(Number.isFinite(valNegZero) && valNegZero >= def.min && valNegZero <= def.max, `Preset ${p.id} param ${def.id}: -0 produced out-of-range value ${valNegZero}`);

      // 7. undefined fallback
      p.setCustomParameter!(def.id, undefined as unknown as number);
      const valUndef = p.getCustomParameterValue!(def.id);
      assert(valUndef === def.defaultValue, `Preset ${p.id} param ${def.id}: expected defaultValue on undefined, got ${valUndef}`);

      // 8. string fallback
      p.setCustomParameter!(def.id, 'randomString' as unknown as number);
      const valStr = p.getCustomParameterValue!(def.id);
      assert(valStr === def.defaultValue, `Preset ${p.id} param ${def.id}: expected defaultValue on string, got ${valStr}`);

      // 9. Unknown parameter ID
      p.setCustomParameter!('nonExistentParam', 42.0);
      assert(p.getCustomParameterValue!('nonExistentParam') === 0 || p.getCustomParameterValue!('nonExistentParam') === undefined, `Unknown param returned unexpected value`);
    }
  }
});

check('1.3: Step resolution snapping generator across random floats', () => {
  const presets = getTunablePresets();

  for (const p of presets) {
    const params = p.getCustomParameters?.() || [];
    for (const def of params) {
      // Test 10 pseudo-random values between min and max
      for (let i = 1; i <= 10; i++) {
        const factor = i / 11;
        const testVal = def.min + factor * (def.max - def.min);
        p.setCustomParameter!(def.id, testVal);

        const storedVal = p.getCustomParameterValue!(def.id)!;
        assert(storedVal >= def.min && storedVal <= def.max, `Value ${storedVal} out of [${def.min}, ${def.max}]`);

        // Check snapping: (storedVal - def.min) / def.step should be an integer
        const stepsCount = (storedVal - def.min) / def.step;
        const roundDiff = Math.abs(stepsCount - Math.round(stepsCount));
        assert(roundDiff < 1e-4, `Preset ${p.id} param ${def.id}: value ${storedVal} not snapped to step ${def.step} (diff ${roundDiff})`);
      }
    }
  }
});

// =============================================================================
// SECTION 2: HIGH-FREQUENCY MUTATIONS, GC OVERHEAD & 60FPS STABILITY
// =============================================================================
console.log('--- SECTION 2: Rapid Mutations, Zero GC Overhead & 60FPS Stability ---');

check('2.1: 10,000 rapid parameter mutations per second throughput and heap stability', () => {
  const presets = getTunablePresets();
  const iterations = 10000;

  // Measure initial heap
  if (globalThis.gc) globalThis.gc();
  const startHeap = process.memoryUsage().heapUsed;
  const startTime = performance.now();

  for (let i = 0; i < iterations; i++) {
    const preset = presets[i % presets.length];
    const params = preset.getCustomParameters!();
    const param = params[i % params.length];
    const val = param.min + ((i % 100) / 100) * (param.max - param.min);
    preset.setCustomParameter!(param.id, val);
  }

  const durationMs = performance.now() - startTime;
  const endHeap = process.memoryUsage().heapUsed;
  const heapDeltaMB = (endHeap - startHeap) / (1024 * 1024);
  const throughputOpsPerSec = Math.round((iterations / durationMs) * 1000);

  console.log(`    Throughput: ${throughputOpsPerSec.toLocaleString()} updates/sec (${iterations} ops in ${durationMs.toFixed(2)}ms)`);
  console.log(`    Heap Delta: ${heapDeltaMB.toFixed(3)} MB`);

  assert(durationMs < 500, `10,000 parameter updates took too long: ${durationMs.toFixed(2)}ms`);
  assert(throughputOpsPerSec >= 20000, `Throughput ${throughputOpsPerSec} ops/sec below 20,000 ops/sec threshold`);
  assert(heapDeltaMB < 10, `Heap growth exceeded 10 MB: ${heapDeltaMB.toFixed(2)} MB`);
});

check('2.2: 60 FPS live frame modulation stability across all 9 presets', () => {
  const presets = getTunablePresets();
  const audio = createBeatDropAudioFeatures();
  const theme = createMockTheme();

  for (const preset of presets) {
    const ctx = createMockPresetContext(theme);
    preset.init(ctx);

    // Simulate 60 frames (1 second at 60 FPS) with rapid parameter mutations every frame
    const params = preset.getCustomParameters!();
    for (let frame = 0; frame < 60; frame++) {
      const time = frame * (1 / 60);
      const delta = 1 / 60;

      // Modulate parameters dynamically on each frame
      for (const p of params) {
        const val = p.min + Math.sin(frame * 0.2 + 1) * 0.5 * (p.max - p.min) + 0.5 * (p.max - p.min);
        preset.setCustomParameter!(p.id, val);
      }

      // Audio feature variation
      audio.bass = 0.5 + 0.5 * Math.sin(frame * 0.1);
      audio.beat = frame % 15 === 0;

      // Execute frame update
      preset.update(ctx, audio, time, delta);
    }

    preset.dispose();
  }
});

// =============================================================================
// SECTION 3: DOM LIFECYCLE STRESS (50 RAPID MOUNT/UNMOUNT CYCLES)
// =============================================================================
console.log('--- SECTION 3: DOM Lifecycle Stress (50 Rapid Mount/Unmount Cycles) ---');

check('3.1: Mount and unmount #tuningPanel 50 times in rapid succession with diverse presets', () => {
  const railBtn = new MockElement('BUTTON');
  railBtn.id = 'presetSettingsRailBtn';
  railBtn.className = 'rail-btn preset-settings-link is-collapsed';
  document.body.appendChild(railBtn as unknown as HTMLElement);

  const tuningPanel = new MockElement('DIV');
  tuningPanel.id = 'tuningPanel';
  tuningPanel.className = 'drawer-panel detail-panel';
  document.body.appendChild(tuningPanel as unknown as HTMLElement);

  const content = new MockElement('DIV');
  content.id = 'presetSettingsContent';
  tuningPanel.appendChild(content);

  const testCatalog: Array<VisualizerPreset | null> = [
    new WaveFormPreset(),
    new ParticleFieldPreset(),
    new MilkDropPreset(), // non-tunable
    new CircularSpectrumPreset(),
    null,                 // null preset
    new FerrofluidPreset(),
    new DNAHelixPreset(), // non-tunable
    new ObsidianPolyPreset(),
    new NeonTunnelPreset(),
    new StarfieldPreset(),
    new ThreeDBarsPreset(),
    new SynthwaveTerrainPreset()
  ];

  for (let cycle = 1; cycle <= 50; cycle++) {
    const preset = testCatalog[cycle % testCatalog.length];
    const isTunable = Boolean(
      preset &&
      typeof preset.getCustomParameters === 'function' &&
      (preset.getCustomParameters()?.length ?? 0) > 0
    );

    updateTuningButtonState(preset, railBtn, tuningPanel);
    renderTuningPanel(preset, content);

    if (isTunable) {
      assert(!railBtn.classList.contains('is-collapsed'), `Cycle ${cycle}: railBtn should not be collapsed for tunable ${preset!.id}`);

      const params = preset!.getCustomParameters!();
      const sliders = content.querySelectorAll('.tuning-slider');
      assert(sliders.length === params.length, `Cycle ${cycle}: Expected ${params.length} sliders, got ${sliders.length}`);

      const readouts = content.querySelectorAll('.tuning-val-readout');
      assert(readouts.length === params.length, `Cycle ${cycle}: Expected ${params.length} readouts, got ${readouts.length}`);

      const resetBtn = content.querySelector('#resetTuningBtn');
      assert(resetBtn !== null, `Cycle ${cycle}: Reset button missing for tunable preset`);

      // Verify each slider configuration
      for (const p of params) {
        const slider = content.querySelector(`#tuning_${p.id}_slider`) as MockElement;
        const readout = content.querySelector(`#tuning_${p.id}_val`) as MockElement;
        assert(slider !== null, `Cycle ${cycle}: Slider #tuning_${p.id}_slider not found`);
        assert(readout !== null, `Cycle ${cycle}: Readout #tuning_${p.id}_val not found`);

        const currentVal = preset!.getCustomParameterValue!(p.id) ?? p.defaultValue;
        assert(Number(slider.value) === currentVal, `Cycle ${cycle}: Slider value ${slider.value} !== ${currentVal}`);
        assert(readout.textContent === formatParamValue(currentVal, p.step), `Cycle ${cycle}: Readout ${readout.textContent} mismatch`);
      }
    } else {
      assert(railBtn.classList.contains('is-collapsed'), `Cycle ${cycle}: railBtn should be collapsed for non-tunable`);
      assert(!tuningPanel.classList.contains('open'), `Cycle ${cycle}: tuningPanel should be closed for non-tunable`);

      const notice = content.querySelector('.tuning-fallback-notice');
      assert(notice !== null, `Cycle ${cycle}: Fallback notice missing for non-tunable`);
      assert(notice.textContent === 'No settings for this preset', `Cycle ${cycle}: Fallback text mismatch`);

      const sliders = content.querySelectorAll('.tuning-slider');
      assert(sliders.length === 0, `Cycle ${cycle}: Sliders should not exist for non-tunable`);
    }
  }
});

check('3.2: Event listener leak check and slider recreation verification', () => {
  const content = new MockElement('DIV');
  content.id = 'presetSettingsContent';
  document.body.appendChild(content as unknown as HTMLElement);

  const wavePreset = new WaveFormPreset();
  renderTuningPanel(wavePreset, content);

  const initialSpeedSlider = content.querySelector('#tuning_speed_slider') as MockElement;
  assert(initialSpeedSlider !== null, 'WaveForm speed slider missing');

  // Trigger input event on initial slider
  initialSpeedSlider.value = '2.3';
  initialSpeedSlider.dispatchEvent(new Event('input'));
  assert(wavePreset.getCustomParameterValue('speed') === 2.3, 'WaveForm speed not updated to 2.3');

  // Now re-render with ParticleFieldPreset (WaveForm slider is destroyed)
  const particlePreset = new ParticleFieldPreset();
  renderTuningPanel(particlePreset, content);

  const particleSpeedSlider = content.querySelector('#tuning_speed_slider') as MockElement;
  assert(particleSpeedSlider !== null, 'ParticleField speed slider missing');
  assert(particleSpeedSlider !== initialSpeedSlider, 'Slider DOM element was not recreated cleanly');

  // Dispatch event on the DETACHED old slider: should NOT modify ParticleField or crash
  initialSpeedSlider.value = '0.4';
  initialSpeedSlider.dispatchEvent(new Event('input'));
  assert(particlePreset.getCustomParameterValue('speed') === 1.0, 'Detached slider leaked into ParticleFieldPreset!');

  // Dispatch event on the newly attached slider
  particleSpeedSlider.value = '1.7';
  particleSpeedSlider.dispatchEvent(new Event('input'));
  assert(particlePreset.getCustomParameterValue('speed') === 1.7, 'Active slider failed to update ParticleFieldPreset');

  const particleReadout = content.querySelector('#tuning_speed_val') as MockElement;
  assert(particleReadout.textContent === '1.7', 'Readout text did not update');
});

check('3.3: Reset to defaults restores exact initial values in preset and DOM across all 9 presets', () => {
  const content = new MockElement('DIV');
  content.id = 'presetSettingsContent';
  document.body.appendChild(content as unknown as HTMLElement);

  const presets = getTunablePresets();

  for (const p of presets) {
    const params = p.getCustomParameters!();

    // 1. Mutate all parameters to non-default values
    for (const def of params) {
      const nonDefaultVal = def.max;
      p.setCustomParameter!(def.id, nonDefaultVal);
      assert(p.getCustomParameterValue!(def.id) === nonDefaultVal, `Failed to mutate ${def.id}`);
    }

    // 2. Direct resetCustomParameters() verification
    p.resetCustomParameters!();
    for (const def of params) {
      assert(p.getCustomParameterValue!(def.id) === def.defaultValue, `Direct reset failed for ${p.id} ${def.id}: expected ${def.defaultValue}, got ${p.getCustomParameterValue!(def.id)}`);
    }

    // 3. Mutate again and test via DOM Reset Button
    for (const def of params) {
      p.setCustomParameter!(def.id, def.min);
    }

    renderTuningPanel(p, content);

    // Verify DOM reflects mutated state before reset
    for (const def of params) {
      const slider = content.querySelector(`#tuning_${def.id}_slider`) as MockElement;
      assert(Number(slider.value) === def.min, `Pre-reset slider value incorrect for ${def.id}`);
    }

    // Click Reset to Defaults button
    const resetBtn = content.querySelector('#resetTuningBtn') as MockElement;
    assert(resetBtn !== null, `Reset button missing for ${p.id}`);
    resetBtn.click();

    // Verify preset values, slider inputs, and text readouts all match schema defaultValue
    for (const def of params) {
      const presetVal = p.getCustomParameterValue!(def.id);
      assert(presetVal === def.defaultValue, `Preset ${p.id} param ${def.id} not reset to defaultValue: ${presetVal}`);

      const slider = content.querySelector(`#tuning_${def.id}_slider`) as MockElement;
      assert(Number(slider.value) === def.defaultValue, `Slider ${def.id} not reset to defaultValue: ${slider.value}`);

      const readout = content.querySelector(`#tuning_${def.id}_val`) as MockElement;
      assert(readout.textContent === formatParamValue(def.defaultValue, def.step), `Readout ${def.id} text mismatch: ${readout.textContent}`);
    }
  }
});

// =============================================================================
// SUMMARY & EXIT
// =============================================================================
console.log('\n========================================================================');
console.log(`TOTAL TESTS:   ${totalTests}`);
console.log(`PASSED:        ${passedTests}`);
console.log(`FAILED:        ${failedTests}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  console.error(`✗ ${failedTests} CHALLENGE ASSERTIONS FAILED!`);
  for (const f of failures) {
    console.error(`  - ${f.testName}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('✓ ALL EMPIRICAL CHALLENGES PASSED EMPIRICALLY!');
  process.exit(0);
}
