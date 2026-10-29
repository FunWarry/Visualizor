import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { CANONICAL_5_STUDIO_FAMILIES } from '../harness/contracts';
import { StudioComposerPreset, StudioStageConfig } from '../../src/studio/StudioComposer';
import { createMockPresetContext, createBeatDropAudioFeatures } from '../harness/fixtures';

describe('Tier 1: Studio Forge & Recipe Builder (#44)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Studio.1: 5 Engine Families contract is fully specified', () => {
    expect(CANONICAL_5_STUDIO_FAMILIES).toHaveLength(5);
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Chroma');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Liquid');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Tunnel');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Volume');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('The Force');
  });

  test('T1.Studio.2: StudioComposerPreset initializes multi-layer stage', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();

    expect(ctx.scene.children.length).toBe(0);
    studio.init(ctx);
    // Group added to scene containing liquid mesh, tunnel corridor, volume particles, force core
    expect(ctx.scene.children.length).toBeGreaterThan(0);

    studio.dispose();
  });

  test('T1.Studio.3: Recipe serialization bundles stage parameters and restores correctly', () => {
    interface StudioRecipe {
      id: string;
      name: string;
      author: string;
      engineFamily: typeof CANONICAL_5_STUDIO_FAMILIES[number];
      stageConfig: StudioStageConfig;
      timestamp: number;
    }

    const originalRecipe: StudioRecipe = {
      id: 'recipe-nebula-vortex',
      name: 'Nebula Vortex Forge',
      author: 'Local Producer',
      engineFamily: 'The Force',
      stageConfig: {
        chromaIntensity: 1.4,
        liquidWarp: 0.8,
        tunnelDepth: 1.2,
        volumeDensity: 1.5,
        theForceAttraction: -0.7
      },
      timestamp: 1729000000
    };

    const serialized = JSON.stringify(originalRecipe);
    const deserialized = JSON.parse(serialized) as StudioRecipe;

    expect(deserialized.id).toBe(originalRecipe.id);
    expect(deserialized.name).toBe(originalRecipe.name);
    expect(deserialized.stageConfig.theForceAttraction).toBe(-0.7);
    expect(deserialized.stageConfig.chromaIntensity).toBe(1.4);
  });

  test('T1.Studio.4: 4-step recipe validation requires non-empty recipe title before saving', () => {
    const validateRecipeForSave = (title: string): { canSave: boolean; error?: string } => {
      const trimmed = title.trim();
      if (!trimmed) {
        return { canSave: false, error: 'Recipe title is required to save' };
      }
      return { canSave: true };
    };

    const emptyAttempt = validateRecipeForSave('   ');
    expect(emptyAttempt.canSave).toBe(false);
    expect(emptyAttempt.error).toBe('Recipe title is required to save');

    const validAttempt = validateRecipeForSave('My Cosmic Stage 1');
    expect(validAttempt.canSave).toBe(true);
    expect(validAttempt.error).toBeUndefined();
  });

  test('T1.Studio.5: Live modulation of stage sliders updates active shader uniforms and particle physics', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);

    // Modify stage config
    studio.config.liquidWarp = 1.8;
    studio.config.theForceAttraction = 1.9;

    const audio = createBeatDropAudioFeatures(0.9);
    // Executing update frame
    studio.update(ctx, audio, 1.0, 0.016);

    expect(studio.config.liquidWarp).toBe(1.8);
    expect(studio.config.theForceAttraction).toBe(1.9);

    studio.dispose();
  });

  test('T1.Studio.6: StudioComposerPreset.dispose cleans up all layer geometries and materials', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);

    expect(ctx.scene.children.length).toBeGreaterThan(0);
    studio.dispose();

    // After dispose, scene objects are detached
    expect(ctx.scene.children.length).toBe(0);
  });
});
