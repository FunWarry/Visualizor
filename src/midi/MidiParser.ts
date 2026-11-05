import { MidiCCMessage, MidiNoteMessage } from './types';

export function normalizeCCValue(rawVal: number): number {
  const clamped = Math.max(0, Math.min(127, rawVal));
  return clamped / 127.0;
}

export function isNoteOff(status: number, velocity: number): boolean {
  const msgType = status & 0xF0;
  return msgType === 0x80 || (msgType === 0x90 && velocity === 0);
}

export function parseMidiCCMessage(bytes: Uint8Array | number[] | ArrayLike<number>): MidiCCMessage | null {
  if (!bytes || bytes.length < 3) {
    return null;
  }

  const status = bytes[0];
  if ((status & 0xF0) !== 0xB0) {
    return null;
  }

  const channel = status & 0x0F;
  const cc = bytes[1];
  const rawVal = bytes[2];
  const normalizedValue = normalizeCCValue(rawVal);

  return {
    isCC: true,
    channel,
    cc,
    normalizedValue
  };
}

export function parseMidiNoteMessage(bytes: Uint8Array | number[] | ArrayLike<number>): MidiNoteMessage | null {
  if (!bytes || bytes.length < 3) {
    return null;
  }

  const status = bytes[0];
  const cmd = status & 0xF0;
  const channel = status & 0x0F;
  const note = bytes[1];
  const velocity = bytes[2];

  if (cmd === 0x90 && velocity > 0) {
    return { type: 'noteOn', note, velocity, channel };
  }

  if (isNoteOff(status, velocity)) {
    return { type: 'noteOff', note, velocity: 0, channel };
  }

  return null;
}
