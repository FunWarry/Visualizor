import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { ParameterDefinition } from '../harness/contracts';

class RobustPresetTuner {
  public schema: ParameterDefinition[] = [
    { id: 'warp', name: 'Warp', min: 0.0, max: 2.0, step: 0.1, defaultValue: 1.0 },
    { id: 'speed', name: 'Speed', min: 0.1, max: 3.0, step: 0.05, defaultValue: 0.6 }
  ];

  public values: Record<string, number> = {
    warp: 1.0,
    speed: 0.6
  };

  setParameter(id: string, rawVal: number): void {
    const def = this.schema.find(p => p.id === id);
    if (!def) return;

    // Handle NaN / Infinity
    if (typeof rawVal !== 'number' || isNaN(rawVal) || !isFinite(rawVal)) {
      this.values[id] = def.defaultValue;
      return;
    }

    // Step snapping
    const snapped = Math.round((rawVal - def.min) / def.step) * def.step + def.min;
    // Clamping
    const clamped = Math.max(def.min, Math.min(def.max, snapped));
    this.values[id] = Number(clamped.toFixed(4));
  }

  resetAll(): void {
    for (const def of this.schema) {
      this.values[def.id] = def.defaultValue;
    }
  }
}

describe('Tier 2: Preset Fine-Tuning Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Tuning.1: NaN and Infinite inputs safely fallback to parameter default values', () => {
    const tuner = new RobustPresetTuner();

    tuner.setParameter('warp', NaN);
    expect(tuner.values.warp).toBe(1.0);

    tuner.setParameter('speed', Infinity);
    expect(tuner.values.speed).toBe(0.6);

    tuner.setParameter('speed', -Infinity);
    expect(tuner.values.speed).toBe(0.6);
  });

  test('T2.Tuning.2: Extreme values (-100000, +100000) are strictly clamped within min and max', () => {
    const tuner = new RobustPresetTuner();

    tuner.setParameter('warp', -100000);
    expect(tuner.values.warp).toBe(0.0);

    tuner.setParameter('warp', 100000);
    expect(tuner.values.warp).toBe(2.0);
  });

  test('T2.Tuning.3: Step resolution snapping aligns raw float values to discrete intervals', () => {
    const tuner = new RobustPresetTuner();

    // Step is 0.1 for warp
    tuner.setParameter('warp', 0.83);
    expect(tuner.values.warp).toBe(0.8);

    tuner.setParameter('warp', 0.87);
    expect(tuner.values.warp).toBe(0.9);
  });

  test('T2.Tuning.4: Setting parameter with empty or unknown ID is safely ignored', () => {
    const tuner = new RobustPresetTuner();
    const initial = { ...tuner.values };

    tuner.setParameter('', 1.5);
    tuner.setParameter('nonExistentKey', 1.5);
    tuner.setParameter('__proto__', 1.5);

    expect(tuner.values).toEqual(initial);
  });

  test('T2.Tuning.5: Resetting all parameters restores default schema values precisely', () => {
    const tuner = new RobustPresetTuner();

    tuner.setParameter('warp', 1.8);
    tuner.setParameter('speed', 2.5);

    expect(tuner.values.warp).toBe(1.8);
    expect(tuner.values.speed).toBe(2.5);

    tuner.resetAll();
    expect(tuner.values.warp).toBe(1.0);
    expect(tuner.values.speed).toBe(0.6);
  });
});
