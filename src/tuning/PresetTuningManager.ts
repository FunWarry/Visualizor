import { VisualizerPreset, ParameterDefinition } from '../types';

export interface RandomizeBounds {
  minPercent: number;
  maxPercent: number;
}

const STORAGE_PREFIX_TUNING = 'visualizor_tuning_';
const STORAGE_PREFIX_PARAM_LOCKS = 'visualizor_param_locks_';
const STORAGE_KEY_LOCKED_PRESETS = 'visualizor_locked_presets';
const STORAGE_PREFIX_BOUNDS = 'visualizor_random_bounds_';
const STORAGE_KEY_AUTO_RANDOMIZE = 'visualizor_auto_randomize_enabled';

// Safe localStorage helper
function getStorageItem(key: string): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // Storage full or unavailable
  }
}

function removeStorageItem(key: string): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore
  }
}

/**
 * Retrieves saved parameter values for a preset from persistent storage.
 */
export function getSavedTuning(presetId: string): Record<string, number> | null {
  const raw = getStorageItem(STORAGE_PREFIX_TUNING + presetId);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Saves parameter values for a preset into persistent storage.
 */
export function saveTuning(presetId: string, values: Record<string, number>): void {
  setStorageItem(STORAGE_PREFIX_TUNING + presetId, JSON.stringify(values));
}

/**
 * Clears saved parameter values for a preset.
 */
export function clearSavedTuning(presetId: string): void {
  removeStorageItem(STORAGE_PREFIX_TUNING + presetId);
}

/**
 * Checks if a preset has customized saved tuning.
 */
export function hasSavedTuning(presetId: string): boolean {
  return getSavedTuning(presetId) !== null;
}

/**
 * Applies saved parameter values to a preset instance if available.
 */
export function applySavedTuning(preset: VisualizerPreset): boolean {
  if (!preset || typeof preset.setCustomParameter !== 'function') return false;
  const saved = getSavedTuning(preset.id);
  if (!saved) return false;

  for (const [paramId, val] of Object.entries(saved)) {
    if (typeof val === 'number') {
      preset.setCustomParameter(paramId, val);
    }
  }
  return true;
}

/**
 * Checks if a preset is locked from auto-cycle switching.
 */
export function isPresetLocked(presetId: string): boolean {
  const raw = getStorageItem(STORAGE_KEY_LOCKED_PRESETS);
  if (!raw) return false;
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(presetId);
  } catch {
    return false;
  }
}

/**
 * Locks or unlocks a preset to prevent auto-cycle from switching away.
 */
export function setPresetLocked(presetId: string, locked: boolean): void {
  let list: string[] = [];
  const raw = getStorageItem(STORAGE_KEY_LOCKED_PRESETS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }

  if (locked) {
    if (!list.includes(presetId)) list.push(presetId);
  } else {
    list = list.filter(id => id !== presetId);
  }

  setStorageItem(STORAGE_KEY_LOCKED_PRESETS, JSON.stringify(list));
}

/**
 * Checks if a specific parameter of a preset is locked from randomization.
 */
export function isParamLocked(presetId: string, paramId: string): boolean {
  const raw = getStorageItem(STORAGE_PREFIX_PARAM_LOCKS + presetId);
  if (!raw) return false;
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(paramId);
  } catch {
    return false;
  }
}

/**
 * Locks or unlocks a specific parameter of a preset against randomization.
 */
export function setParamLocked(presetId: string, paramId: string, locked: boolean): void {
  let list: string[] = [];
  const raw = getStorageItem(STORAGE_PREFIX_PARAM_LOCKS + presetId);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    } catch {
      list = [];
    }
  }

  if (locked) {
    if (!list.includes(paramId)) list.push(paramId);
  } else {
    list = list.filter(id => id !== paramId);
  }

  setStorageItem(STORAGE_PREFIX_PARAM_LOCKS + presetId, JSON.stringify(list));
}

/**
 * Gets the randomization margin / range bounds (between two values in %) for a preset.
 * Defaults to 20% - 80% for natural, controlled musical variation.
 */
export function getRandomizeBounds(presetId: string): RandomizeBounds {
  const raw = getStorageItem(STORAGE_PREFIX_BOUNDS + presetId);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.minPercent === 'number' && typeof parsed?.maxPercent === 'number') {
        return {
          minPercent: Math.max(0, Math.min(100, parsed.minPercent)),
          maxPercent: Math.max(0, Math.min(100, parsed.maxPercent))
        };
      }
    } catch {
      // Use defaults
    }
  }
  return { minPercent: 20, maxPercent: 80 };
}

/**
 * Saves the randomization bounds for a preset.
 */
export function setRandomizeBounds(presetId: string, minPercent: number, maxPercent: number): void {
  const boundedMin = Math.max(0, Math.min(100, Math.min(minPercent, maxPercent)));
  const boundedMax = Math.max(0, Math.min(100, Math.max(minPercent, maxPercent)));
  setStorageItem(STORAGE_PREFIX_BOUNDS + presetId, JSON.stringify({ minPercent: boundedMin, maxPercent: boundedMax }));
}

/**
 * Checks if auto-randomize during auto-cycle is enabled globally.
 */
export function isAutoRandomizeEnabled(): boolean {
  const val = getStorageItem(STORAGE_KEY_AUTO_RANDOMIZE);
  return val === null ? true : val === 'true'; // Enabled by default
}

/**
 * Toggles auto-randomize during auto-cycle.
 */
export function setAutoRandomizeEnabled(enabled: boolean): void {
  setStorageItem(STORAGE_KEY_AUTO_RANDOMIZE, String(enabled));
}

function computeRandomParamValue(p: ParameterDefinition, minPercent: number, maxPercent: number): number {
  const normMin = minPercent / 100;
  const normMax = maxPercent / 100;
  const range = p.max - p.min;
  const randFactor = normMin + Math.random() * (normMax - normMin);
  const rawVal = p.min + randFactor * range;
  const snapped = Math.round((rawVal - p.min) / p.step) * p.step + p.min;
  return Math.max(p.min, Math.min(p.max, Number(snapped.toFixed(4))));
}

/**
 * Randomizes unlocked parameters of a preset between two values (minPercent & maxPercent).
 * Locked parameters are preserved as-is.
 */
export function randomizePreset(
  preset: VisualizerPreset,
  overrideMin?: number,
  overrideMax?: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!preset || typeof preset.getCustomParameters !== 'function') return result;

  const params = preset.getCustomParameters();
  if (!params || params.length === 0) return result;

  const bounds = getRandomizeBounds(preset.id);
  const minP = overrideMin ?? bounds.minPercent;
  const maxP = overrideMax ?? bounds.maxPercent;

  for (const p of params) {
    if (isParamLocked(preset.id, p.id)) {
      // Keep existing value
      const current = typeof preset.getCustomParameterValue === 'function'
        ? (preset.getCustomParameterValue(p.id) ?? p.defaultValue)
        : p.defaultValue;
      result[p.id] = current;
    } else {
      const newVal = computeRandomParamValue(p, minP, maxP);
      preset.setCustomParameter?.(p.id, newVal);
      result[p.id] = newVal;
    }
  }

  return result;
}
