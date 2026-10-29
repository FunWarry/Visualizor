export const CANONICAL_28_THEME_IDS = [
  'ember', 'jade', 'violet', 'rose', 'azure', 'amber',
  'crimson', 'teal', 'slate', 'indigo', 'coral', 'lime',
  'earthy', 'terracotta', 'sand', 'lavender', 'sunset', 'synthwave',
  'toxic', 'coral-reef', 'firefly', 'horizon', 'arctic', 'eclipse',
  'vapor', 'nebula', 'glacier', 'prism'
] as const;

export const CANONICAL_15_RAIL_TOOLS = [
  { id: 'presets', panel: 'presetsPanel', label: 'Presets' },
  { id: 'presetSettings', panel: 'tuningPanel', label: 'Preset Tuning' },
  { id: 'colors', panel: 'themesPanel', label: 'Themes' },
  { id: 'effects', panel: 'fxPanel', label: 'Effects' },
  { id: 'camera', panel: 'cameraPanel', label: 'Camera & Views' },
  { id: 'audio', panel: 'audioPanel', label: 'Audio DSP' },
  { id: 'overlay', panel: 'overlayPanel', label: 'Image Overlays' },
  { id: 'text', panel: 'textOverlayPanel', label: 'Text & Typography' },
  { id: 'subtitles', panel: 'subtitlesPanel', label: 'Subtitles' },
  { id: 'tracks', panel: 'queuePanel', label: 'Playback Queue' },
  { id: 'library', panel: 'libraryPanel', label: 'Library' },
  { id: 'myCreations', panel: 'studioPanel', label: 'Studio Composer' },
  { id: 'more', panel: 'moreMenu', label: 'More Extras' },
  { id: 'shortcuts', panel: 'shortcutsModal', label: 'Shortcuts' },
  { id: 'hideUi', panel: 'none', label: 'Hide UI' }
] as const;

export const CANONICAL_5_STUDIO_FAMILIES = [
  'Chroma', 'Liquid', 'Tunnel', 'Volume', 'The Force'
] as const;

export const CANONICAL_9_TEXT_ANCHORS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right'
] as const;

export const CANONICAL_5_TEXT_ANIMATIONS = [
  'none', 'pulse', 'glow', 'fade', 'runningRow'
] as const;

export const DEFAULT_MIDI_CC_MAPPINGS: Record<number, string> = {
  1: 'audioSensitivity',
  2: 'animationSpeed',
  7: 'audioVolume',
  10: 'colorSaturation',
  71: 'resonance',
  74: 'bloomStrength'
};

export interface ParameterDefinition {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export function isValidHexColor(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex);
}

export function computeZoomDistance(normalizedZoom: number): number {
  if (typeof normalizedZoom !== 'number' || isNaN(normalizedZoom)) return 0.7;
  const clamped = Math.max(0, Math.min(1, normalizedZoom));
  return 0.7 + (2.5 - 0.7) * clamped;
}

export function computeAutoRotateAngle(currentAngle: number, speed: number, direction: 1 | -1): number {
  const clampedSpeed = Math.max(0, Math.min(1, speed));
  const delta = (0.0005 + (0.0055 - 0.0005) * clampedSpeed) * direction;
  return currentAngle + delta;
}

export function parseMidiCCMessage(bytes: Uint8Array | number[]): { isCC: boolean; channel: number; cc: number; normalizedValue: number } | null {
  if (bytes.length < 3) return null;
  const status = bytes[0];
  if ((status & 0xF0) !== 0xB0) return null;
  const channel = status & 0x0F;
  const cc = bytes[1];
  const rawVal = bytes[2];
  const normalizedValue = Math.max(0, Math.min(127, rawVal)) / 127.0;
  return { isCC: true, channel, cc, normalizedValue };
}

export function sanitizeTextOverlayInput(raw: string): { sanitized: string; enabled: boolean } {
  const sanitized = String(raw)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
  return {
    sanitized,
    enabled: sanitized.length > 0
  };
}
