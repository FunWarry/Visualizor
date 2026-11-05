export interface MidiDevice {
  id: string;
  name: string;
  manufacturer: string;
  state: 'connected' | 'disconnected';
}

export interface MidiCCMessage {
  isCC: boolean;
  channel: number;
  cc: number;
  normalizedValue: number;
}

export interface MidiNoteMessage {
  type: 'noteOn' | 'noteOff';
  note: number;
  velocity: number;
  channel: number;
}

export interface MidiMapping {
  target: string;
  label: string;
}

export type MidiMappings = Record<number, MidiMapping>;

export interface MidiState {
  isSupported: boolean;
  isConnected: boolean;
  isLearning: boolean;
  learningTarget: string | null;
}

export type MidiEventHandler<T = unknown> = (data: T) => void;

export interface MidiEventMap {
  cc: { target: string; value: number; cc: number; channel: number };
  noteOn: { note: number; velocity: number; channel: number };
  noteOff: { note: number; channel: number };
  deviceChange: MidiDevice[];
  learn: { cc: number; target: string };
  learnStart: { target: string };
  learnCancel: void;
  stateChange: MidiState;
}
