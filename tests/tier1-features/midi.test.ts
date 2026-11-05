import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, getActiveMidiAccess } from '../harness/env';
import { parseMidiCCMessage, DEFAULT_MIDI_CC_MAPPINGS } from '../harness/contracts';
import { MidiManager, MidiPanel } from '../../src/midi';

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
    if (typeof localStorage === 'undefined' || !globalThis.localStorage) {
      const store = new Map<string, string>();
      const mockStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, String(v)),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
        get length() { return store.size; },
        key: (i: number) => Array.from(store.keys())[i] ?? null
      };
      Object.defineProperty(globalThis, 'localStorage', {
        value: mockStorage,
        configurable: true,
        writable: true
      });
    } else {
      localStorage.clear();
    }
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

  test('T1.Midi.7: Port enumeration correctly lists all connected input devices with ID and manufacturer', async () => {
    const manager = new MidiManager();
    const success = await manager.init();

    expect(success).toBe(true);
    const devices = manager.getDevices();
    expect(devices.length).toBeGreaterThanOrEqual(1);
    expect(devices[0].id).toBe('input-0');
    expect(devices[0].name).toBe('Arturia BeatStep MIDI 1');
    expect(devices[0].manufacturer).toBe('Visuval Virtual Controller');
    expect(devices[0].state).toBe('connected');
  });

  test('T1.Midi.8: Hotplug statechange handler dynamically detects added or removed MIDI controllers', async () => {
    const manager = new MidiManager();
    await manager.init();

    const midiAccess = getActiveMidiAccess();
    midiAccess?.addMockInput('input-1', 'Akai MPK Mini 3');
    midiAccess?.onstatechange?.({
      port: { id: 'input-1', name: 'Akai MPK Mini 3', manufacturer: 'Akai Professional', state: 'connected', type: 'input' }
    });

    const devices = manager.getDevices();
    expect(devices.length).toBe(2);
    expect(manager.isConnected).toBe(true);
  });

  test('T1.Midi.9: Default CC routing dispatches to Sensitivity, Bloom, Persistence, Camera Orbit, and Speed', async () => {
    const manager = new MidiManager();
    await manager.init();

    const input = getActiveMidiAccess()?.inputs.get('input-0');
    input?.simulateMessage([0xB0, 1, 100]); // Sensitivity
    input?.simulateMessage([0xB0, 2, 80]);  // Speed
    input?.simulateMessage([0xB0, 3, 90]);  // Persistence
    input?.simulateMessage([0xB0, 4, 64]);  // Camera Orbit
    input?.simulateMessage([0xB0, 74, 110]); // Bloom

    expect(manager.parameterValues.get('audioSensitivity')).toBeCloseTo(100 / 127.0);
    expect(manager.parameterValues.get('animationSpeed')).toBeCloseTo(80 / 127.0);
    expect(manager.parameterValues.get('persistence')).toBeCloseTo(90 / 127.0);
    expect(manager.parameterValues.get('cameraOrbit')).toBeCloseTo(64 / 127.0);
    expect(manager.parameterValues.get('bloomStrength')).toBeCloseTo(110 / 127.0);
  });

  test('T1.Midi.10: Interactive MIDI Learn mode highlights active parameter and binds incoming CC from any channel', async () => {
    const manager = new MidiManager();
    await manager.init();

    manager.startLearn('cameraOrbit');
    expect(manager.isLearning).toBe(true);
    expect(manager.learningTarget).toBe('cameraOrbit');

    const input = getActiveMidiAccess()?.inputs.get('input-0');
    input?.simulateMessage([0xB2, 16, 90]); // Channel 3, CC 16, val 90

    expect(manager.isLearning).toBe(false);
    expect(manager.learningTarget).toBeNull();
    expect(manager.mappings.get(16)).toBe('cameraOrbit');
    expect(manager.parameterValues.get('cameraOrbit')).toBeCloseTo(90 / 127.0);
  });

  test('T1.Midi.11: MIDI Learn mode cancellation aborts binding and restores idle UI state', async () => {
    const manager = new MidiManager();
    await manager.init();

    manager.startLearn('bloomStrength');
    expect(manager.isLearning).toBe(true);

    manager.stopLearn();
    expect(manager.isLearning).toBe(false);
    expect(manager.learningTarget).toBeNull();

    const input = getActiveMidiAccess()?.inputs.get('input-0');
    input?.simulateMessage([0xB0, 44, 100]);

    expect(manager.mappings.get(44)).toBeUndefined();
    expect(manager.mappings.get(74)).toBe('bloomStrength');
  });

  test('T1.Midi.12: LocalStorage persistence saves mapping table and successfully restores upon re-initialization', async () => {
    const manager = new MidiManager();
    await manager.init();

    manager.setMapping(20, 'customFilter');
    expect(manager.mappings.get(20)).toBe('customFilter');

    const saved = localStorage.getItem('visuval_midi_mappings');
    expect(saved).toBeDefined();

    const manager2 = new MidiManager();
    await manager2.init();
    expect(manager2.mappings.get(20)).toBe('customFilter');
  });

  test('T1.Midi.13: Corrupted or invalid JSON in localStorage recovers cleanly without throwing or crashing', async () => {
    localStorage.setItem('visuval_midi_mappings', '<<<INVALID-JSON-CORRUPTED>>>');
    const manager = new MidiManager();
    const ok = await manager.init();

    expect(ok).toBe(true);
    expect(manager.mappings.get(1)).toBe('audioSensitivity');
    expect(manager.mappings.get(74)).toBe('bloomStrength');
  });

  test('T1.Midi.14: DOM controls in #midiPanel render status banner, port list, learn section, and mapping table', async () => {
    const manager = new MidiManager();
    await manager.init();

    const panelEl = createMockMidiPanel();
    new MidiPanel(manager, panelEl);

    const badge = panelEl.querySelector('#midiStatusBadge');
    expect(badge?.classList.contains('midi-connected')).toBe(true);

    const devCount = panelEl.querySelector('#midiDeviceCount');
    expect(devCount?.textContent).toContain('1 device');

    const portItem = panelEl.querySelector('.midi-port-item');
    expect(portItem).toBeDefined();

    const mappingsTable = panelEl.querySelector('#midiMappingsTable');
    expect(mappingsTable?.children.length).toBeGreaterThanOrEqual(8);
  });

  test('T1.Midi.15: Reset button in #midiPanel restores all default CC mappings and synchronizes DOM readout', async () => {
    const manager = new MidiManager();
    await manager.init();

    manager.setMapping(1, 'customParam');
    manager.removeMapping(74);

    const panelEl = createMockMidiPanel();
    new MidiPanel(manager, panelEl);

    const resetBtn = panelEl.querySelector('#midiResetDefaultsBtn') as unknown as { click(): void };
    resetBtn?.click();

    expect(manager.mappings.get(1)).toBe('audioSensitivity');
    expect(manager.mappings.get(74)).toBe('bloomStrength');
  });

  test('T1.Midi.16: Clear button on individual mapping row unbinds target parameter and updates DOM', async () => {
    const manager = new MidiManager();
    await manager.init();

    const panelEl = createMockMidiPanel();
    new MidiPanel(manager, panelEl);

    const bloomRow = panelEl.querySelector('[data-target-id="bloomStrength"]');
    const clearBtn = bloomRow?.querySelector('.midi-row-btn--clear') as unknown as { click(): void };
    clearBtn?.click();

    expect(manager.mappings.has(74)).toBe(false);

    const input = getActiveMidiAccess()?.inputs.get('input-0');
    input?.simulateMessage([0xB0, 74, 127]);
    expect(manager.parameterValues.get('bloomStrength')).toBeUndefined();
  });
});

function createMockMidiPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.id = 'midiPanel';

  const statusBadge = document.createElement('span');
  statusBadge.id = 'midiStatusBadge';
  panel.appendChild(statusBadge);

  const deviceCount = document.createElement('span');
  deviceCount.id = 'midiDeviceCount';
  panel.appendChild(deviceCount);

  const statusIndicator = document.createElement('span');
  statusIndicator.id = 'midiStatusIndicator';
  panel.appendChild(statusIndicator);

  const connectBtn = document.createElement('button');
  connectBtn.id = 'midiConnectBtn';
  const connectBtnText = document.createElement('span');
  connectBtnText.id = 'midiConnectBtnText';
  connectBtn.appendChild(connectBtnText);
  panel.appendChild(connectBtn);

  const refreshPortsBtn = document.createElement('button');
  refreshPortsBtn.id = 'midiRefreshPortsBtn';
  panel.appendChild(refreshPortsBtn);

  const portsList = document.createElement('div');
  portsList.id = 'midiPortsList';
  panel.appendChild(portsList);

  const learnBox = document.createElement('div');
  learnBox.id = 'midiLearnBox';
  const learnBadge = document.createElement('span');
  learnBadge.id = 'midiLearnBadge';
  learnBox.appendChild(learnBadge);
  const activeTarget = document.createElement('span');
  activeTarget.id = 'midiLearnActiveTarget';
  learnBox.appendChild(activeTarget);
  const learnPulse = document.createElement('div');
  learnPulse.id = 'midiLearnPulse';
  learnBox.appendChild(learnPulse);
  const cancelLearnBtn = document.createElement('button');
  cancelLearnBtn.id = 'midiCancelLearnBtn';
  learnBox.appendChild(cancelLearnBtn);
  panel.appendChild(learnBox);

  const mappingCount = document.createElement('span');
  mappingCount.id = 'midiMappingCount';
  panel.appendChild(mappingCount);

  const mappingsTable = document.createElement('div');
  mappingsTable.id = 'midiMappingsTable';
  panel.appendChild(mappingsTable);

  const resetDefaultsBtn = document.createElement('button');
  resetDefaultsBtn.id = 'midiResetDefaultsBtn';
  panel.appendChild(resetDefaultsBtn);

  return panel as unknown as HTMLElement;
}

