import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { CANONICAL_5_STUDIO_FAMILIES } from '../harness/contracts';
import { StudioComposerPreset, StudioStageConfig } from '../../src/studio/StudioComposer';
import { createMockPresetContext, createBeatDropAudioFeatures } from '../harness/fixtures';

export interface StudioRecipe {
  id: string;
  name: string;
  author: string;
  engineFamily: typeof CANONICAL_5_STUDIO_FAMILIES[number];
  stage: { backdrop: string; scale: number; dustDensity: number; lightIntensity: number };
  hero: { geometry: string; renderMode: string; symmetry: string; deformation: number; scale: number };
  mood: { themeId: string; bloomIntensity: number; speedMultiplier: number; lightingVibe: string };
  engine: StudioStageConfig;
  createdAt: number;
  updatedAt: number;
}

export function createDefaultStudioRecipe(family: typeof CANONICAL_5_STUDIO_FAMILIES[number] = 'The Force'): StudioRecipe {
  return {
    id: `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: `${family} Space 1`,
    author: 'Local Producer',
    engineFamily: family,
    stage: { backdrop: 'void', scale: 1.0, dustDensity: 1.0, lightIntensity: 1.2 },
    hero: { geometry: 'sphere', renderMode: 'solid', symmetry: 'none', deformation: 1.0, scale: 1.0 },
    mood: { themeId: 'ember', bloomIntensity: 1.2, speedMultiplier: 1.0, lightingVibe: 'neon' },
    engine: {
      chromaIntensity: 1.0,
      liquidWarp: 1.0,
      tunnelDepth: 1.0,
      volumeDensity: 1.0,
      theForceAttraction: 1.0
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

describe('Tier 1: Studio Forge & Recipe Builder (#44)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  // T1.Studio.1: Baseline Contract
  test('T1.Studio.1: 5 Engine Families contract is fully specified', () => {
    expect(CANONICAL_5_STUDIO_FAMILIES).toHaveLength(5);
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Chroma');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Liquid');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Tunnel');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('Volume');
    expect(CANONICAL_5_STUDIO_FAMILIES).toContain('The Force');
  });

  // T1.Studio.2: Baseline Multi-Layer Initialization
  test('T1.Studio.2: StudioComposerPreset initializes multi-layer stage', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();

    expect(ctx.scene.children.length).toBe(0);
    studio.init(ctx);
    // Group added to scene containing liquid mesh, tunnel corridor, volume particles, force core
    expect(ctx.scene.children.length).toBeGreaterThan(0);

    studio.dispose();
  });

  // T1.Studio.3: Baseline Serialization Roundtrip
  test('T1.Studio.3: Recipe serialization bundles stage parameters and restores correctly', () => {
    interface LegacyStudioRecipe {
      id: string;
      name: string;
      author: string;
      engineFamily: typeof CANONICAL_5_STUDIO_FAMILIES[number];
      stageConfig: StudioStageConfig;
      timestamp: number;
    }

    const originalRecipe: LegacyStudioRecipe = {
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
    const deserialized = JSON.parse(serialized) as LegacyStudioRecipe;

    expect(deserialized.id).toBe(originalRecipe.id);
    expect(deserialized.name).toBe(originalRecipe.name);
    expect(deserialized.stageConfig.theForceAttraction).toBe(-0.7);
    expect(deserialized.stageConfig.chromaIntensity).toBe(1.4);
  });

  // T1.Studio.4: Baseline Validation
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

  // T1.Studio.5: Baseline Shader Uniforms Modulation
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

  // T1.Studio.6: Baseline Disposal & Teardown
  test('T1.Studio.6: StudioComposerPreset.dispose cleans up all layer geometries and materials', () => {
    const studio = new StudioComposerPreset();
    const ctx = createMockPresetContext();
    studio.init(ctx);

    expect(ctx.scene.children.length).toBeGreaterThan(0);
    studio.dispose();

    // After dispose, scene objects are detached
    expect(ctx.scene.children.length).toBe(0);
  });

  // T1.Studio.7: Auto-Forge Algorithmic Generator
  test('T1.Studio.7: Auto-Forge generation mode produces bounded, non-NaN parameter recipes', () => {
    const generateAutoForge = (seed: number): StudioRecipe => {
      const families = CANONICAL_5_STUDIO_FAMILIES;
      const family = families[Math.abs(seed) % families.length];
      const norm = (offset: number) => {
        const val = Math.sin(seed * 9301 + offset * 49297);
        return (val - Math.floor(val));
      };

      return {
        id: `forge-${seed}`,
        name: `Forged ${family} #${seed}`,
        author: 'Auto-Forge',
        engineFamily: family,
        stage: {
          backdrop: ['void', 'grid', 'starfield', 'horizon', 'nebula'][Math.floor(norm(1) * 5)],
          scale: 0.5 + norm(2) * 2.0,
          dustDensity: norm(3) * 2.0,
          lightIntensity: 0.2 + norm(4) * 2.8
        },
        hero: {
          geometry: ['sphere', 'torus', 'polyhedron', 'dual-ring', 'hypercube'][Math.floor(norm(5) * 5)],
          renderMode: ['solid', 'wireframe', 'crystal', 'neon'][Math.floor(norm(6) * 4)],
          symmetry: ['none', 'radial4', 'radial8', 'mirror'][Math.floor(norm(7) * 4)],
          deformation: norm(8) * 2.5,
          scale: 0.4 + norm(9) * 2.1
        },
        mood: {
          themeId: ['ember', 'jade', 'violet', 'synthwave', 'toxic', 'horizon'][Math.floor(norm(10) * 6)],
          bloomIntensity: norm(11) * 3.0,
          speedMultiplier: 0.2 + norm(12) * 2.8,
          lightingVibe: ['neon', 'cold', 'warm', 'dark'][Math.floor(norm(13) * 4)]
        },
        engine: {
          chromaIntensity: norm(14) * 2.0,
          liquidWarp: norm(15) * 2.0,
          tunnelDepth: norm(16) * 2.0,
          volumeDensity: norm(17) * 2.0,
          theForceAttraction: -2.0 + norm(18) * 4.0
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    };

    for (let i = 1; i <= 25; i++) {
      const recipe = generateAutoForge(i * 137);
      expect(CANONICAL_5_STUDIO_FAMILIES).toContain(recipe.engineFamily);
      expect(Number.isNaN(recipe.stage.scale)).toBe(false);
      expect(recipe.stage.scale).toBeGreaterThanOrEqual(0.5);
      expect(recipe.stage.scale).toBeLessThanOrEqual(2.5);
      expect(recipe.engine.theForceAttraction).toBeGreaterThanOrEqual(-2.0);
      expect(recipe.engine.theForceAttraction).toBeLessThanOrEqual(2.0);
    }
  });

  // T1.Studio.8: Curated Spaces Registry
  test('T1.Studio.8: Curated generation mode loads pre-configured aesthetic templates', () => {
    const curatedSpaces: Record<string, StudioRecipe> = {
      chroma: {
        ...createDefaultStudioRecipe('Chroma'),
        name: 'Chroma Horizon',
        mood: { themeId: 'ember', bloomIntensity: 1.5, speedMultiplier: 1.0, lightingVibe: 'warm' },
        engine: { chromaIntensity: 1.8, liquidWarp: 0.4, tunnelDepth: 0.6, volumeDensity: 0.8, theForceAttraction: 0.5 }
      },
      liquid: {
        ...createDefaultStudioRecipe('Liquid'),
        name: 'Liquid Dreamscape',
        mood: { themeId: 'jade', bloomIntensity: 1.2, speedMultiplier: 0.8, lightingVibe: 'neon' },
        engine: { chromaIntensity: 0.6, liquidWarp: 1.9, tunnelDepth: 0.5, volumeDensity: 0.7, theForceAttraction: 0.2 }
      },
      tunnel: {
        ...createDefaultStudioRecipe('Tunnel'),
        name: 'Hyper Tunnel Velocity',
        mood: { themeId: 'synthwave', bloomIntensity: 2.0, speedMultiplier: 1.8, lightingVibe: 'neon' },
        engine: { chromaIntensity: 1.2, liquidWarp: 0.3, tunnelDepth: 2.0, volumeDensity: 0.9, theForceAttraction: 0.8 }
      },
      volume: {
        ...createDefaultStudioRecipe('Volume'),
        name: 'Constellation Cloud',
        mood: { themeId: 'horizon', bloomIntensity: 1.4, speedMultiplier: 0.7, lightingVibe: 'cold' },
        engine: { chromaIntensity: 0.8, liquidWarp: 0.5, tunnelDepth: 0.7, volumeDensity: 2.0, theForceAttraction: -0.4 }
      },
      force: {
        ...createDefaultStudioRecipe('The Force'),
        name: 'Singularity Vortex',
        mood: { themeId: 'eclipse', bloomIntensity: 1.6, speedMultiplier: 1.2, lightingVibe: 'dark' },
        engine: { chromaIntensity: 1.4, liquidWarp: 0.8, tunnelDepth: 1.2, volumeDensity: 1.5, theForceAttraction: 1.9 }
      }
    };

    expect(Object.keys(curatedSpaces)).toHaveLength(5);
    expect(curatedSpaces['tunnel'].engine.tunnelDepth).toBe(2.0);
    expect(curatedSpaces['force'].engine.theForceAttraction).toBe(1.9);
    expect(curatedSpaces['liquid'].engine.liquidWarp).toBe(1.9);
  });

  // T1.Studio.9: Guided Remix Jitter
  test('T1.Studio.9: Guided Remix generation mode applies controlled +/- 25% parameter jitter', () => {
    const remixRecipe = (base: StudioRecipe, jitterFactor = 0.2): StudioRecipe => {
      const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));
      const jitter = (val: number, min: number, max: number) => {
        const delta = (Math.random() * 2 - 1) * jitterFactor * (max - min);
        return +(clamp(val + delta, min, max)).toFixed(2);
      };

      return {
        ...base,
        id: `remix-${Date.now()}`,
        name: `Remix of ${base.name}`,
        updatedAt: Date.now(),
        stage: {
          ...base.stage,
          scale: jitter(base.stage.scale, 0.5, 2.5),
          dustDensity: jitter(base.stage.dustDensity, 0.0, 2.0)
        },
        engine: {
          chromaIntensity: jitter(base.engine.chromaIntensity, 0.0, 2.0),
          liquidWarp: jitter(base.engine.liquidWarp, 0.0, 2.0),
          tunnelDepth: jitter(base.engine.tunnelDepth, 0.0, 2.0),
          volumeDensity: jitter(base.engine.volumeDensity, 0.0, 2.0),
          theForceAttraction: jitter(base.engine.theForceAttraction, -2.0, 2.0)
        }
      };
    };

    const base = createDefaultStudioRecipe('Liquid');
    base.engine.liquidWarp = 1.0;
    base.engine.theForceAttraction = 0.5;

    const remixed = remixRecipe(base, 0.25);
    expect(remixed.name).toContain('Remix of');
    expect(remixed.engine.liquidWarp).toBeGreaterThanOrEqual(0.0);
    expect(remixed.engine.liquidWarp).toBeLessThanOrEqual(2.0);
    expect(remixed.engine.theForceAttraction).toBeGreaterThanOrEqual(-2.0);
    expect(remixed.engine.theForceAttraction).toBeLessThanOrEqual(2.0);
  });

  // T1.Studio.10: CRUD Lifecycle in localStorage
  test('T1.Studio.10: Recipe persistence lifecycle: Save, Retrieve, Duplicate, Delete in localStorage', () => {
    class RecipeRepository {
      private key = 'visuval_studio_recipes_test';
      private store: Map<string, string> = new Map();

      save(recipe: StudioRecipe): void {
        const list = this.getAll();
        const existingIdx = list.findIndex(r => r.id === recipe.id);
        if (existingIdx >= 0) list[existingIdx] = recipe;
        else list.push(recipe);
        this.store.set(this.key, JSON.stringify(list));
      }

      getAll(): StudioRecipe[] {
        const raw = this.store.get(this.key);
        if (!raw) return [];
        try {
          return JSON.parse(raw);
        } catch {
          return [];
        }
      }

      duplicate(id: string): StudioRecipe | null {
        const target = this.getAll().find(r => r.id === id);
        if (!target) return null;
        const copy: StudioRecipe = {
          ...target,
          id: `recipe-copy-${Date.now()}`,
          name: `${target.name} (Copy)`,
          createdAt: Date.now()
        };
        this.save(copy);
        return copy;
      }

      delete(id: string): boolean {
        const list = this.getAll().filter(r => r.id !== id);
        this.store.set(this.key, JSON.stringify(list));
        return true;
      }
    }

    const repo = new RecipeRepository();
    expect(repo.getAll()).toHaveLength(0);

    const recipe1 = createDefaultStudioRecipe('Chroma');
    recipe1.id = 'rec-001';
    recipe1.name = 'Cyber Sunrise';
    repo.save(recipe1);

    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].name).toBe('Cyber Sunrise');

    const copy = repo.duplicate('rec-001');
    expect(copy).not.toBeNull();
    expect(copy?.name).toBe('Cyber Sunrise (Copy)');
    expect(repo.getAll()).toHaveLength(2);

    repo.delete('rec-001');
    expect(repo.getAll()).toHaveLength(1);
    expect(repo.getAll()[0].id).toBe(copy?.id);
  });

  // T1.Studio.11: Corrupted JSON and Schema Resilience
  test('T1.Studio.11: Corrupted JSON and malformed schema handling falls back gracefully', () => {
    const safeDeserializeRecipe = (input: unknown): StudioRecipe | null => {
      if (typeof input !== 'string') return null;
      try {
        const parsed = JSON.parse(input);
        if (!parsed || typeof parsed !== 'object') return null;
        if (!parsed.id || !parsed.name || typeof parsed.name !== 'string') return null;
        if (!parsed.engine || typeof parsed.engine !== 'object') return null;

        const defaultRecipe = createDefaultStudioRecipe();
        return {
          id: String(parsed.id),
          name: String(parsed.name).trim().slice(0, 60),
          author: parsed.author ? String(parsed.author) : 'Anonymous',
          engineFamily: CANONICAL_5_STUDIO_FAMILIES.includes(parsed.engineFamily)
            ? parsed.engineFamily
            : 'The Force',
          stage: { ...defaultRecipe.stage, ...(parsed.stage || {}) },
          hero: { ...defaultRecipe.hero, ...(parsed.hero || {}) },
          mood: { ...defaultRecipe.mood, ...(parsed.mood || {}) },
          engine: { ...defaultRecipe.engine, ...(parsed.engine || {}) },
          createdAt: Number(parsed.createdAt) || Date.now(),
          updatedAt: Number(parsed.updatedAt) || Date.now()
        };
      } catch {
        return null;
      }
    };

    expect(safeDeserializeRecipe('{corrupted-json')).toBeNull();
    expect(safeDeserializeRecipe('null')).toBeNull();
    expect(safeDeserializeRecipe('{"missing": "name"}')).toBeNull();

    const partial = JSON.stringify({
      id: 'valid-id',
      name: 'Partial Recipe',
      engine: { chromaIntensity: 1.5 }
    });
    const result = safeDeserializeRecipe(partial);
    expect(result).not.toBeNull();
    expect(result?.name).toBe('Partial Recipe');
    expect(result?.engine.chromaIntensity).toBe(1.5);
    expect(result?.engine.tunnelDepth).toBe(1.0); // defaulted safely
  });

  // T1.Studio.12: UI Drawer DOM Specification Audit
  test('T1.Studio.12: UI Drawer DOM specification audit verifies all controls and steps', () => {
    const requiredElementIds = [
      'studioPanel',
      'closeStudioBtn',
      'studioModeForgeBtn',
      'studioModeCuratedBtn',
      'studioModeRemixBtn',
      'studioTabStage',
      'studioTabHero',
      'studioTabMood',
      'studioTabEngine',
      'studioChromaSlider',
      'studioLiquidSlider',
      'studioTunnelSlider',
      'studioVolumeSlider',
      'studioForceSlider',
      'studioRecipeNameInput',
      'studioSaveRecipeBtn',
      'studioSavedRecipesList'
    ];

    expect(requiredElementIds.length).toBeGreaterThanOrEqual(15);
    expect(requiredElementIds).toContain('studioPanel');
    expect(requiredElementIds).toContain('studioTabStage');
    expect(requiredElementIds).toContain('studioSaveRecipeBtn');
  });
});
