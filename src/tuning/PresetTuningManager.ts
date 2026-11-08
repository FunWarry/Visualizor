import { VisualizerPreset, ParameterDefinition } from '../types';

export interface RandomizeBounds {
  minPercent: number;
  maxPercent: number;
}

export interface ValueBounds {
  minVal: number;
  maxVal: number;
}

const STORAGE_PREFIX_TUNING = 'visualizor_tuning_';
const STORAGE_PREFIX_PARAM_LOCKS = 'visualizor_param_locks_';
const STORAGE_KEY_LOCKED_PRESETS = 'visualizor_locked_presets';
const STORAGE_PREFIX_BOUNDS = 'visualizor_random_bounds_';
const STORAGE_PREFIX_PARAM_BOUNDS = 'visualizor_param_bounds_';
const STORAGE_KEY_AUTO_RANDOMIZE = 'visualizor_auto_randomize_enabled';
const STORAGE_PREFIX_FX_LOCKS = 'visualizor_fx_locks_';
const STORAGE_PREFIX_FX_BOUNDS = 'visualizor_fx_bounds_';

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
 * Gets the independent randomization bounds for a specific parameter.
 */
export function getParamRandomizeBounds(presetId: string, paramId: string): RandomizeBounds {
  const raw = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${presetId}_${paramId}`);
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
      // Fallback
    }
  }
  return getRandomizeBounds(presetId);
}

/**
 * Sets the independent randomization bounds for a specific parameter (percentage compatibility).
 */
export function setParamRandomizeBounds(presetId: string, paramId: string, minPercent: number, maxPercent: number): void {
  const boundedMin = Math.max(0, Math.min(100, Math.min(minPercent, maxPercent)));
  const boundedMax = Math.max(0, Math.min(100, Math.max(minPercent, maxPercent)));
  setStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${presetId}_${paramId}`, JSON.stringify({ minPercent: boundedMin, maxPercent: boundedMax }));
}

/**
 * Gets the independent randomization bounds in raw parameter values.
 */
export function getParamValueBounds(presetId: string, p: ParameterDefinition): ValueBounds {
  const raw = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${presetId}_${p.id}`);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.minVal === 'number' && typeof parsed?.maxVal === 'number') {
        return {
          minVal: Math.max(p.min, Math.min(p.max, parsed.minVal)),
          maxVal: Math.max(p.min, Math.min(p.max, parsed.maxVal))
        };
      }
      if (typeof parsed?.minPercent === 'number' && typeof parsed?.maxPercent === 'number') {
        const range = p.max - p.min;
        return {
          minVal: Number((p.min + (parsed.minPercent / 100) * range).toFixed(4)),
          maxVal: Number((p.min + (parsed.maxPercent / 100) * range).toFixed(4))
        };
      }
    } catch {
      // Fallback
    }
  }
  return { minVal: p.min, maxVal: p.max };
}

/**
 * Sets the independent randomization bounds in raw parameter values.
 */
export function setParamValueBounds(presetId: string, paramId: string, minVal: number, maxVal: number): void {
  const boundedMin = Math.min(minVal, maxVal);
  const boundedMax = Math.max(minVal, maxVal);
  setStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${presetId}_${paramId}`, JSON.stringify({ minVal: boundedMin, maxVal: boundedMax }));
}

/**
 * Checks if a post-processing shader parameter is locked.
 */
export function isFxParamLocked(fxId: string): boolean {
  return getStorageItem(STORAGE_PREFIX_FX_LOCKS + fxId) === 'true';
}

/**
 * Sets lock state for a post-processing shader parameter.
 */
export function setFxParamLocked(fxId: string, locked: boolean): void {
  setStorageItem(STORAGE_PREFIX_FX_LOCKS + fxId, String(locked));
}

/**
 * Gets the independent randomization bounds for a shader or camera parameter (percentage compatibility).
 */
export function getFxParamRandomizeBounds(paramId: string): RandomizeBounds {
  const raw = getStorageItem(STORAGE_PREFIX_FX_BOUNDS + paramId);
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
      // Fallback
    }
  }
  return { minPercent: 0, maxPercent: 100 };
}

/**
 * Sets the independent randomization bounds for a shader or camera parameter (percentage compatibility).
 */
export function setFxParamRandomizeBounds(paramId: string, minPercent: number, maxPercent: number): void {
  const boundedMin = Math.max(0, Math.min(100, Math.min(minPercent, maxPercent)));
  const boundedMax = Math.max(0, Math.min(100, Math.max(minPercent, maxPercent)));
  setStorageItem(`${STORAGE_PREFIX_FX_BOUNDS}${paramId}`, JSON.stringify({ minPercent: boundedMin, maxPercent: boundedMax }));
}

/**
 * Gets the independent randomization bounds in raw slider values for a shader or camera parameter.
 */
export function getFxParamValueBounds(paramId: string, min: number, max: number): ValueBounds {
  const raw = getStorageItem(STORAGE_PREFIX_FX_BOUNDS + paramId);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.minVal === 'number' && typeof parsed?.maxVal === 'number') {
        return {
          minVal: Math.max(min, Math.min(max, parsed.minVal)),
          maxVal: Math.max(min, Math.min(max, parsed.maxVal))
        };
      }
      if (typeof parsed?.minPercent === 'number' && typeof parsed?.maxPercent === 'number') {
        const range = max - min;
        return {
          minVal: Number((min + (parsed.minPercent / 100) * range).toFixed(2)),
          maxVal: Number((min + (parsed.maxPercent / 100) * range).toFixed(2))
        };
      }
    } catch {
      // Fallback
    }
  }
  return { minVal: min, maxVal: max };
}

/**
 * Sets the independent randomization bounds in raw slider values for a shader or camera parameter.
 */
export function setFxParamValueBounds(paramId: string, minVal: number, maxVal: number): void {
  const boundedMin = Math.min(minVal, maxVal);
  const boundedMax = Math.max(minVal, maxVal);
  setStorageItem(`${STORAGE_PREFIX_FX_BOUNDS}${paramId}`, JSON.stringify({ minVal: boundedMin, maxVal: boundedMax }));
}

/**
 * Computes a random parameter value within configured raw value bounds.
 */
export function computeRandomFxValue(min: number, max: number, step: number, minVal: number, maxVal: number): number {
  const boundedMin = Math.max(min, Math.min(max, Math.min(minVal, maxVal)));
  const boundedMax = Math.max(min, Math.min(max, Math.max(minVal, maxVal)));
  const range = boundedMax - boundedMin;
  const randVal = boundedMin + Math.random() * range;
  const snapped = Math.round((randVal - min) / step) * step + min;
  return Math.max(min, Math.min(max, Number(snapped.toFixed(2))));
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

function computeRandomParamValue(p: ParameterDefinition, minVal: number, maxVal: number): number {
  const boundedMin = Math.max(p.min, Math.min(p.max, Math.min(minVal, maxVal)));
  const boundedMax = Math.max(p.min, Math.min(p.max, Math.max(minVal, maxVal)));
  const range = boundedMax - boundedMin;
  const randVal = boundedMin + Math.random() * range;
  const snapped = Math.round((randVal - p.min) / p.step) * p.step + p.min;
  return Math.max(p.min, Math.min(p.max, Number(snapped.toFixed(4))));
}

/**
 * Randomizes a single parameter independently using its own configured bounds.
 */
export function randomizeSingleParameter(
  preset: VisualizerPreset,
  paramId: string,
  overrideMin?: number,
  overrideMax?: number
): number | undefined {
  if (!preset || typeof preset.getCustomParameters !== 'function') return undefined;
  const params = preset.getCustomParameters();
  const p = params?.find(item => item.id === paramId);
  if (!p) return undefined;
  if (isParamLocked(preset.id, paramId)) {
    return typeof preset.getCustomParameterValue === 'function'
      ? (preset.getCustomParameterValue(paramId) ?? p.defaultValue)
      : p.defaultValue;
  }
  const hasCustom = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${preset.id}_${p.id}`) !== null;
  let minVal: number;
  let maxVal: number;
  if (hasCustom) {
    const bounds = getParamValueBounds(preset.id, p);
    minVal = overrideMin ?? bounds.minVal;
    maxVal = overrideMax ?? bounds.maxVal;
  } else {
    const globalBounds = getRandomizeBounds(preset.id);
    const pRange = p.max - p.min;
    minVal = overrideMin ?? (p.min + (globalBounds.minPercent / 100) * pRange);
    maxVal = overrideMax ?? (p.min + (globalBounds.maxPercent / 100) * pRange);
  }
  const newVal = computeRandomParamValue(p, minVal, maxVal);
  preset.setCustomParameter?.(paramId, newVal);
  return newVal;
}

/**
 * Randomizes unlocked parameters of a preset using their independent bounds.
 * Locked parameters are preserved as-is.
 */
export function randomizePreset(
  preset: VisualizerPreset,
  overrideMinPercent?: number,
  overrideMaxPercent?: number
): Record<string, number> {
  const result: Record<string, number> = {};
  if (!preset || typeof preset.getCustomParameters !== 'function') return result;

  const params = preset.getCustomParameters();
  if (!params || params.length === 0) return result;

  const globalBounds = getRandomizeBounds(preset.id);
  const minP = typeof overrideMinPercent === 'number' ? overrideMinPercent : globalBounds.minPercent;
  const maxP = typeof overrideMaxPercent === 'number' ? overrideMaxPercent : globalBounds.maxPercent;

  for (const p of params) {
    if (isParamLocked(preset.id, p.id)) {
      const current = typeof preset.getCustomParameterValue === 'function'
        ? (preset.getCustomParameterValue(p.id) ?? p.defaultValue)
        : p.defaultValue;
      result[p.id] = current;
    } else {
      const hasCustom = getStorageItem(`${STORAGE_PREFIX_PARAM_BOUNDS}${preset.id}_${p.id}`) !== null;
      let minVal: number;
      let maxVal: number;

      if (hasCustom) {
        const bounds = getParamValueBounds(preset.id, p);
        minVal = bounds.minVal;
        maxVal = bounds.maxVal;
      } else {
        const pRange = p.max - p.min;
        minVal = p.min + (Math.min(minP, maxP) / 100) * pRange;
        maxVal = p.min + (Math.max(minP, maxP) / 100) * pRange;
      }

      const newVal = computeRandomParamValue(p, minVal, maxVal);
      preset.setCustomParameter?.(p.id, newVal);
      result[p.id] = newVal;
    }
  }

  return result;
}

