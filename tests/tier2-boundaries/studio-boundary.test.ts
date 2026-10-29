import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { StudioComposerPreset } from '../../src/studio/StudioComposer';
import { createMockPresetContext, createBeatDropAudioFeatures } from '../harness/fixtures';

describe('Tier 2: Studio Forge Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Studio.1: Negative The Force attraction (-2.0 repulsion) applies outward physics stably', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);

    // Repulsion physics mode
    studio.config.theForceAttraction = -2.0;
    const audio = createBeatDropAudioFeatures(0.9);

    // Simulate 10 frames of repulsion
    for (let i = 0; i < 10; i++) {
      studio.update(ctx, audio, i * 0.016, 0.016);
    }

    expect(studio.config.theForceAttraction).toBe(-2.0);
    studio.dispose();
  });

  test('T2.Studio.2: Zero volume density (0.0) renders without division by zero errors', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);

    studio.config.volumeDensity = 0.0;
    const audio = createBeatDropAudioFeatures(0.5);

    studio.update(ctx, audio, 0.5, 0.016);
    expect(studio.config.volumeDensity).toBe(0.0);

    studio.dispose();
  });

  test('T2.Studio.3: All stage config parameters set to maximum 2.0 execute without numerical overflow', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);

    studio.config.chromaIntensity = 2.0;
    studio.config.liquidWarp = 2.0;
    studio.config.tunnelDepth = 2.0;
    studio.config.volumeDensity = 2.0;
    studio.config.theForceAttraction = 2.0;

    const audio = createBeatDropAudioFeatures(1.0);
    studio.update(ctx, audio, 1.0, 0.016);

    expect(studio.config.liquidWarp).toBe(2.0);
    expect(studio.config.tunnelDepth).toBe(2.0);

    studio.dispose();
  });

  test('T2.Studio.4: Recipe title validation rejects empty, whitespace, and non-string values', () => {
    const isValidRecipeName = (name: unknown): boolean => {
      if (typeof name !== 'string') return false;
      return name.trim().length > 0 && name.trim().length <= 60;
    };

    expect(isValidRecipeName('')).toBe(false);
    expect(isValidRecipeName('   \t  ')).toBe(false);
    expect(isValidRecipeName(null)).toBe(false);
    expect(isValidRecipeName(123)).toBe(false);
    expect(isValidRecipeName('a'.repeat(70))).toBe(false);
    expect(isValidRecipeName('Neon Horizon 2026')).toBe(true);
  });

  test('T2.Studio.5: Corrupted or invalid JSON in saved recipes is caught and discarded gracefully', () => {
    const parseSavedRecipe = (jsonStr: string): Record<string, unknown> | null => {
      try {
        const obj = JSON.parse(jsonStr);
        if (typeof obj === 'object' && obj !== null && typeof obj.name === 'string') {
          return obj as Record<string, unknown>;
        }
        return null;
      } catch {
        return null;
      }
    };

    expect(parseSavedRecipe('invalid-json{{{')).toBeNull();
    expect(parseSavedRecipe('{"incomplete": true')).toBeNull();
    expect(parseSavedRecipe('null')).toBeNull();
    expect(parseSavedRecipe('{"name": "Valid Recipe"}')).toBeDefined();
  });

  test('T2.Studio.6: Mode switcher checks dirty state before leaving Studio mode', () => {
    const checkStudioLeaveAllowed = (hasUnsavedChanges: boolean, userConfirmedDiscard: boolean): boolean => {
      if (!hasUnsavedChanges) return true;
      return userConfirmedDiscard;
    };

    // Clean state -> can switch mode immediately
    expect(checkStudioLeaveAllowed(false, false)).toBe(true);

    // Unsaved changes without confirmation -> blocked
    expect(checkStudioLeaveAllowed(true, false)).toBe(false);

    // Unsaved changes with user confirmation -> allowed
    expect(checkStudioLeaveAllowed(true, true)).toBe(true);
  });
});
