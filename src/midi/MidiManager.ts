import { MidiDevice, MidiMapping, MidiState, MidiEventHandler, MidiEventMap } from './types';
import { parseMidiCCMessage, parseMidiNoteMessage } from './MidiParser';

export const MIDI_STORAGE_KEY = 'visuval_midi_mappings';

export const CANONICAL_DEFAULT_MAPPINGS: Record<number, { target: string; label: string }> = {
  1: { target: 'audioSensitivity', label: 'Sensitivity' },
  2: { target: 'animationSpeed', label: 'Speed' },
  3: { target: 'persistence', label: 'Persistence' },
  4: { target: 'cameraOrbit', label: 'Camera Orbit' },
  7: { target: 'audioVolume', label: 'Volume' },
  10: { target: 'colorSaturation', label: 'Saturation' },
  71: { target: 'resonance', label: 'Resonance' },
  74: { target: 'bloomStrength', label: 'Bloom' }
};

export class MidiManager {
  public isSupported: boolean;
  public isConnected = false;
  public isLearning = false;
  public learningTarget: string | null = null;
  public mappings: Map<number, string> = new Map();
  public parameterValues: Map<string, number> = new Map();
  public inputs: Map<string, MIDIInput> = new Map();
  public midiAccess: MIDIAccess | null = null;

  private handlers: Record<string, MidiEventHandler[]> = {};

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';
    this.loadDefaultMappings();
  }

  get learnMode(): boolean {
    return this.isLearning;
  }

  set learnMode(val: boolean) {
    this.isLearning = val;
  }

  get _learnTarget(): string | null {
    return this.learningTarget;
  }

  set _learnTarget(val: string | null) {
    this.learningTarget = val;
  }

  get ccMap(): Record<number, MidiMapping> {
    return this.getMappings();
  }

  public getState(): MidiState {
    return {
      isSupported: this.isSupported,
      isConnected: this.isConnected,
      isLearning: this.isLearning,
      learningTarget: this.learningTarget
    };
  }

  public on<K extends keyof MidiEventMap>(event: K, handler: MidiEventHandler<MidiEventMap[K]>): void {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(handler as MidiEventHandler);
  }

  public off<K extends keyof MidiEventMap>(event: K, handler: MidiEventHandler<MidiEventMap[K]>): void {
    const list = this.handlers[event];
    if (list) {
      this.handlers[event] = list.filter(h => h !== handler);
    }
  }

  public _emit<K extends keyof MidiEventMap>(event: K, payload?: MidiEventMap[K]): void {
    const list = this.handlers[event];
    if (list) {
      for (const handler of list) {
        try {
          handler(payload);
        } catch {
          // Guard against subscriber failures
        }
      }
    }
  }

  public async init(): Promise<boolean> {
    if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
      this.isSupported = false;
      this.isConnected = false;
      this._emit('stateChange', this.getState());
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false, software: true });
      this.isSupported = true;
      this.midiAccess.onstatechange = (event: unknown) => {
        this.handleStateChange(event);
      };

      this.bindInputs();
      this.loadMappings();
      this.isConnected = this.inputs.size > 0;

      this._emit('stateChange', this.getState());
      this._emit('deviceChange', this.getDevices());
      return true;
    } catch {
      this.isSupported = true;
      this.isConnected = false;
      this._emit('stateChange', this.getState());
      return false;
    }
  }

  public getDevices(): MidiDevice[] {
    const devices: MidiDevice[] = [];
    for (const [id, port] of this.inputs.entries()) {
      const rawPort = port as unknown as { name?: string; manufacturer?: string; state?: string };
      devices.push({
        id,
        name: rawPort.name || 'Unknown Controller',
        manufacturer: rawPort.manufacturer || 'Generic MIDI Device',
        state: rawPort.state === 'disconnected' ? 'disconnected' : 'connected'
      });
    }
    return devices;
  }

  public getParamLabel(target: string): string {
    switch (target) {
      case 'audioSensitivity':
      case 'sensitivity':
        return 'Sensitivity';
      case 'animationSpeed':
      case 'speed':
        return 'Speed';
      case 'persistence':
        return 'Persistence';
      case 'cameraOrbit':
      case 'rotateSpeed':
      case 'orbit':
        return 'Camera Orbit';
      case 'audioVolume':
      case 'volume':
        return 'Volume';
      case 'colorSaturation':
      case 'saturation':
        return 'Saturation';
      case 'resonance':
      case 'brightness':
        return 'Resonance';
      case 'bloomStrength':
      case 'bloom':
        return 'Bloom';
      default:
        return target.charAt(0).toUpperCase() + target.slice(1);
    }
  }

  public getMappings(): Record<number, MidiMapping> {
    const result: Record<number, MidiMapping> = {};
    for (const [cc, target] of this.mappings.entries()) {
      result[cc] = { target, label: this.getParamLabel(target) };
    }
    return result;
  }

  public startLearn(targetParamId: string): void {
    this.isLearning = true;
    this.learningTarget = targetParamId;
    this._emit('learnStart', { target: targetParamId });
    this._emit('stateChange', this.getState());
  }

  public stopLearn(): void {
    this.isLearning = false;
    this.learningTarget = null;
    this._emit('learnCancel');
    this._emit('stateChange', this.getState());
  }

  public cancelLearn(): void {
    this.stopLearn();
  }

  public setMapping(cc: number, target: string, _label?: string): void {
    this.removeTargetDuplicates(target);
    this.mappings.set(cc, target);
    this.saveMappings();
    this._emit('learn', { cc, target });
    this._emit('stateChange', this.getState());
  }

  public removeMapping(cc: number): void {
    if (this.mappings.delete(cc)) {
      this.saveMappings();
      this._emit('stateChange', this.getState());
    }
  }

  public unbind(cc: number): void {
    this.removeMapping(cc);
  }

  public clearAllMappings(): void {
    this.mappings.clear();
    this.saveMappings();
    this._emit('stateChange', this.getState());
  }

  public resetToDefaults(): void {
    this.mappings.clear();
    this.loadDefaultMappings();
    this.saveMappings();
    this._emit('stateChange', this.getState());
  }

  public handleMessage(data: Uint8Array | number[]): void {
    const parsed = parseMidiCCMessage(data);
    if (parsed) {
      this.handleCC(parsed.cc, parsed.normalizedValue, parsed.channel);
      return;
    }

    const note = parseMidiNoteMessage(data);
    if (note) {
      if (note.type === 'noteOn') {
        this._emit('noteOn', { note: note.note, velocity: note.velocity, channel: note.channel });
      } else {
        this._emit('noteOff', { note: note.note, channel: note.channel });
      }
    }
  }

  public saveMappings(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const serializable: Record<string, string> = {};
        for (const [cc, target] of this.mappings.entries()) {
          serializable[cc.toString()] = target;
        }
        localStorage.setItem(MIDI_STORAGE_KEY, JSON.stringify(serializable));
      }
    } catch {
      // Storage access or quota exception safe fallback
    }
  }

  public loadMappings(): void {
    this.loadDefaultMappings();
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(MIDI_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.applyDeserializedMappings(parsed);
        }
      }
    } catch {
      // Corrupted JSON falls back cleanly to default mappings
    }
  }

  public destroy(): void {
    for (const [, input] of this.inputs) {
      input.onmidimessage = null;
    }
    this.inputs.clear();
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.isConnected = false;
    this.isLearning = false;
    this.learningTarget = null;
    this.handlers = {};
  }

  private loadDefaultMappings(): void {
    for (const [cc, entry] of Object.entries(CANONICAL_DEFAULT_MAPPINGS)) {
      this.mappings.set(Number(cc), entry.target);
    }
  }

  private removeTargetDuplicates(target: string): void {
    for (const [existingCc, existingTarget] of this.mappings.entries()) {
      if (existingTarget === target) {
        this.mappings.delete(existingCc);
      }
    }
  }

  private bindInputs(): void {
    if (!this.midiAccess) return;
    this.inputs.clear();

    for (const [id, input] of this.midiAccess.inputs.entries()) {
      input.onmidimessage = (event: { data: Uint8Array | null }) => {
        if (event.data) {
          this.handleMessage(event.data);
        }
      };
      this.inputs.set(id, input as unknown as MIDIInput);
    }
  }

  private syncInputsFromAccess(): void {
    if (!this.midiAccess) return;
    for (const [id, input] of this.midiAccess.inputs.entries()) {
      if (!this.inputs.has(id)) {
        input.onmidimessage = (msgEvent: { data: Uint8Array | null }) => {
          if (msgEvent.data) {
            this.handleMessage(msgEvent.data);
          }
        };
        this.inputs.set(id, input as unknown as MIDIInput);
      }
    }

    for (const id of Array.from(this.inputs.keys())) {
      if (!this.midiAccess.inputs.has(id)) {
        const port = this.inputs.get(id);
        if (port) port.onmidimessage = null;
        this.inputs.delete(id);
      }
    }
  }

  private syncDisconnectedPort(event?: unknown): void {
    const ev = event as { port?: { id?: string; state?: string } } | undefined;
    if (ev?.port?.state === 'disconnected' && ev.port.id) {
      this.inputs.delete(ev.port.id);
    }
  }

  private handleStateChange(event?: unknown): void {
    this.syncInputsFromAccess();
    this.syncDisconnectedPort(event);

    this.isConnected = this.inputs.size > 0;
    this._emit('deviceChange', this.getDevices());
    this._emit('stateChange', this.getState());
  }

  private handleCC(cc: number, normalizedValue: number, channel: number): void {
    if (this.isLearning && this.learningTarget) {
      const target = this.learningTarget;
      this.setMapping(cc, target);
      this.stopLearn();
    }

    const boundTarget = this.mappings.get(cc);
    if (boundTarget) {
      this.parameterValues.set(boundTarget, normalizedValue);
      this._emit('cc', {
        target: boundTarget,
        value: normalizedValue,
        cc,
        channel
      });
    }
  }

  private extractTarget(val: unknown): string | null {
    if (typeof val === 'string') {
      return val;
    }
    if (val && typeof val === 'object' && 'target' in val && typeof (val as { target: unknown }).target === 'string') {
      return (val as { target: string }).target;
    }
    return null;
  }

  private applyDeserializedMappings(parsed: unknown): void {
    if (!parsed || typeof parsed !== 'object') return;
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      const ccNum = Number(key);
      const target = this.extractTarget(val);
      if (!Number.isNaN(ccNum) && target !== null) {
        this.mappings.set(ccNum, target);
      }
    }
  }
}
