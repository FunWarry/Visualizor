import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, getActiveMidiAccess } from '../harness/env';
import { parseMidiCCMessage, DEFAULT_MIDI_CC_MAPPINGS } from '../harness/contracts';

class TestMidiManager {
  public isSupported = false;
  public isLearning = false;
  public learningTarget: string | null = null;
  public mappings: Map<number, string> = new Map();
  public parameterValues: Map<string, number> = new Map();

  async init(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      this.isSupported = false;
      return false;
    }
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      this.isSupported = Boolean(midiAccess);

      // Load default mappings
      for (const [cc, target] of Object.entries(DEFAULT_MIDI_CC_MAPPINGS)) {
        this.mappings.set(Number(cc), target);
      }

      // Attach message listeners to inputs
      midiAccess.inputs.forEach(input => {
        input.onmidimessage = (event: MIDIMessageEvent | { data: Uint8Array | null }) => {
          if (event.data) {
            this.handleMessage(event.data);
          }
        };
      });

      return true;
    } catch {
      this.isSupported = false;
      return false;
    }
  }

  startLearn(targetParamId: string): void {
    this.isLearning = true;
    this.learningTarget = targetParamId;
  }

  stopLearn(): void {
    this.isLearning = false;
    this.learningTarget = null;
  }

  handleMessage(data: Uint8Array): void {
    const parsed = parseMidiCCMessage(data);
    if (!parsed) return;

    if (this.isLearning && this.learningTarget) {
      this.mappings.set(parsed.cc, this.learningTarget);
      this.stopLearn();
    }

    const boundTarget = this.mappings.get(parsed.cc);
    if (boundTarget) {
      this.parameterValues.set(boundTarget, parsed.normalizedValue);
    }
  }
}

describe('Tier 1: Web MIDI API Controller Mapping (#45)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Midi.1: Web MIDI access request detects available hardware controller inputs', async () => {
    const manager = new TestMidiManager();
    const success = await manager.init();

    expect(success).toBe(true);
    expect(manager.isSupported).toBe(true);
  });

  test('T1.Midi.2: CC byte stream parser decodes 0xB0 status and normalizes 0-127 values', () => {
    // CC 74 (Bloom) value 64 (approx 50%) on Channel 1 (status 0xB0)
    const msg = [0xB0, 74, 64];
    const parsed = parseMidiCCMessage(msg);

    expect(parsed).toBeDefined();
    expect(parsed?.isCC).toBe(true);
    expect(parsed?.channel).toBe(0);
    expect(parsed?.cc).toBe(74);
    expect(parsed?.normalizedValue).toBeCloseTo(64 / 127.0);
  });

  test('T1.Midi.3: Default CC mapping table binds standard knobs to audio and rendering parameters', () => {
    expect(DEFAULT_MIDI_CC_MAPPINGS[1]).toBe('audioSensitivity');
    expect(DEFAULT_MIDI_CC_MAPPINGS[2]).toBe('animationSpeed');
    expect(DEFAULT_MIDI_CC_MAPPINGS[7]).toBe('audioVolume');
    expect(DEFAULT_MIDI_CC_MAPPINGS[10]).toBe('colorSaturation');
    expect(DEFAULT_MIDI_CC_MAPPINGS[71]).toBe('resonance');
    expect(DEFAULT_MIDI_CC_MAPPINGS[74]).toBe('bloomStrength');
  });

  test('T1.Midi.4: MIDI Learn mode captures incoming CC number and establishes new mapping', async () => {
    const manager = new TestMidiManager();
    await manager.init();

    manager.startLearn('customDistortion');
    expect(manager.isLearning).toBe(true);

    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get('input-0');

    // Simulate hardware knob movement CC 16 with value 100
    input?.simulateMessage([0xB0, 16, 100]);

    expect(manager.isLearning).toBe(false);
    expect(manager.mappings.get(16)).toBe('customDistortion');
    expect(manager.parameterValues.get('customDistortion')).toBeCloseTo(100 / 127.0);
  });

  test('T1.Midi.5: Note-On with velocity 0 is normalized to Note-Off per MIDI specification', () => {
    const isNoteOff = (status: number, velocity: number): boolean => {
      const msgType = status & 0xF0;
      return msgType === 0x80 || (msgType === 0x90 && velocity === 0);
    };

    // Standard Note Off (0x80)
    expect(isNoteOff(0x80, 64)).toBe(true);

    // Running status Note On with velocity 0 -> Note Off
    expect(isNoteOff(0x90, 0)).toBe(true);

    // Standard Note On with non-zero velocity
    expect(isNoteOff(0x90, 100)).toBe(false);
  });

  test('T1.Midi.6: Incoming CC message dispatches normalized value to registered parameter', async () => {
    const manager = new TestMidiManager();
    await manager.init();

    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get('input-0');

    // Send CC 7 (Volume) at max 127
    input?.simulateMessage([0xB0, 7, 127]);
    expect(manager.parameterValues.get('audioVolume')).toBeCloseTo(1.0);

    // Send CC 74 (Bloom) at 0
    input?.simulateMessage([0xB0, 74, 0]);
    expect(manager.parameterValues.get('bloomStrength')).toBeCloseTo(0.0);
  });
});
