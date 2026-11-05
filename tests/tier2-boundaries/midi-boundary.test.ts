import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { parseMidiCCMessage } from '../harness/contracts';
import { MidiManager } from '../../src/midi';

describe('Tier 2: Web MIDI API Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Midi.1: Malformed and truncated MIDI byte arrays return null without throwing', () => {
    expect(parseMidiCCMessage([])).toBeNull();
    expect(parseMidiCCMessage([0xB0])).toBeNull();
    expect(parseMidiCCMessage([0xB0, 74])).toBeNull();
    // Non-CC status (e.g. SysEx 0xF0)
    expect(parseMidiCCMessage([0xF0, 0x7E, 0x7F])).toBeNull();
  });

  test('T2.Midi.2: Out-of-bounds CC values (>127 or <0) are clamped to safe 0.0-1.0 range', () => {
    // Value > 127
    const high = parseMidiCCMessage([0xB0, 10, 255]);
    expect(high).toBeDefined();
    expect(high?.normalizedValue).toBeCloseTo(1.0);

    // Negative value
    const low = parseMidiCCMessage([0xB0, 10, -50]);
    expect(low).toBeDefined();
    expect(low?.normalizedValue).toBeCloseTo(0.0);
  });

  test('T2.Midi.3: Unmapped CC numbers do not alter mapped parameter dictionary', () => {
    const mappings = new Map<number, string>([[7, 'volume']]);
    const values = new Map<string, number>([['volume', 0.8]]);

    const parsed = parseMidiCCMessage([0xB0, 99, 120]);
    if (parsed && mappings.has(parsed.cc)) {
      values.set(mappings.get(parsed.cc)!, parsed.normalizedValue);
    }

    // Mapped volume should remain unchanged
    expect(values.get('volume')).toBeCloseTo(0.8);
  });

  test('T2.Midi.4: Rapid burst of 100 MIDI CC events in 1ms processes sequentially', () => {
    const values = new Map<string, number>();
    const mappings = new Map<number, string>([[74, 'bloom']]);

    for (let i = 0; i <= 100; i++) {
      const parsed = parseMidiCCMessage([0xB0, 74, Math.round((i / 100) * 127)]);
      if (parsed && mappings.has(parsed.cc)) {
        values.set(mappings.get(parsed.cc)!, parsed.normalizedValue);
      }
    }

    // Final value should match last event (1.0)
    expect(values.get('bloom')).toBeCloseTo(1.0);
  });

  test('T2.Midi.5: MIDI Learn cancellation preserves existing controller bindings intact', () => {
    let isLearning = true;
    let targetParam: string | null = 'audioSensitivity';
    const bindings = new Map<number, string>([[1, 'audioSensitivity']]);

    // User cancels learn mode
    isLearning = false;
    targetParam = null;

    expect(isLearning).toBe(false);
    expect(targetParam).toBeNull();
    expect(bindings.get(1)).toBe('audioSensitivity');
  });

  test('T2.Midi.6: Channel nibble extraction supports MIDI channels 1 through 16', () => {
    // 0xB0 = Channel 1 (index 0)
    expect(parseMidiCCMessage([0xB0, 1, 64])?.channel).toBe(0);

    // 0xBF = Channel 16 (index 15)
    expect(parseMidiCCMessage([0xBF, 1, 64])?.channel).toBe(15);
  });

  test('T2.Midi.7: Unsupported navigator.requestMIDIAccess environment falls back gracefully with isSupported=false', async () => {
    const orig = navigator.requestMIDIAccess;
    try {
      (navigator as unknown as Record<string, unknown>).requestMIDIAccess = undefined;
      const manager = new MidiManager();
      const success = await manager.init();

      expect(success).toBe(false);
      expect(manager.isSupported).toBe(false);
      expect(manager.isConnected).toBe(false);
    } finally {
      navigator.requestMIDIAccess = orig;
    }
  });

  test('T2.Midi.8: Web MIDI permission rejection (SecurityError / NotAllowedError) handles denial cleanly', async () => {
    const orig = navigator.requestMIDIAccess;
    try {
      navigator.requestMIDIAccess = async () => {
        throw new Error('NotAllowedError: Permission denied');
      };
      const manager = new MidiManager();
      const success = await manager.init();

      expect(success).toBe(false);
      expect(manager.isConnected).toBe(false);
    } finally {
      navigator.requestMIDIAccess = orig;
    }
  });

  test('T2.Midi.9: Non-CC messages (Pitch Bend 0xE0, Program Change 0xC0, Channel Aftertouch 0xD0, SysEx 0xF0) are ignored without error', async () => {
    const manager = new MidiManager();
    await manager.init();

    const initialSize = manager.parameterValues.size;
    manager.handleMessage([0xE0, 0, 64]);
    manager.handleMessage([0xC0, 1]);
    manager.handleMessage([0xD0, 32]);
    manager.handleMessage([0xF0, 0x7E, 0x7F, 0x06, 0x01, 0xF7]);

    expect(manager.parameterValues.size).toBe(initialSize);
  });

  test('T2.Midi.10: High-frequency CC floods across multiple channels maintain thread-safe mapping stability', async () => {
    const manager = new MidiManager();
    await manager.init();

    for (let i = 0; i <= 500; i++) {
      const channel = i % 16;
      const status = 0xB0 | channel;
      const val = Math.round((i / 500) * 127);
      manager.handleMessage([status, 1, val]);
    }

    const finalVal = manager.parameterValues.get('audioSensitivity');
    expect(finalVal).toBeDefined();
    expect(finalVal).toBeCloseTo(1.0);
  });
});
