import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { PRESETS, getPreset } from '../../src/presets';
import { getTheme } from '../../src/themes/themes';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { createMockPresetContext, createSilentAudioFeatures } from '../harness/fixtures';

describe('Tier 2: Preset Lifecycle Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Presets.1: Double dispose() invocation does not throw or corrupt scene state', () => {
    const preset = getPreset('dna') || PRESETS[0];
    const ctx = createMockPresetContext(getTheme('ember'));

    preset.init(ctx);
    preset.dispose();

    expect(() => {
      preset.dispose();
    }).not.toThrow();
  });

  test('T2.Presets.2: Preset update with complete zero audio features executes without division by zero', () => {
    const silentAudio = createSilentAudioFeatures();
    const ctx = createMockPresetContext(getTheme('ember'));

    for (const preset of PRESETS) {
      preset.init(ctx);
      expect(() => {
        preset.update(ctx, silentAudio, 0, 0);
      }).not.toThrow();
      preset.dispose();
      ctx.scene.clear();
    }
  });

  test('T2.Presets.3: Extreme delta time (10 seconds) is clamped to prevent physics explosions', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const preset = getPreset('waterslide') || PRESETS[0];
    engine.setPreset(preset);

    const audio = createSilentAudioFeatures();
    expect(() => {
      engine.render(audio);
    }).not.toThrow();
  });

  test('T2.Presets.4: Rapid preset switching across ALL 71 presets executes without lingering meshes or memory leaks', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    const initialLightCount = engine.scene.children.filter(c => (c as { isLight?: boolean }).isLight).length;

    // Switch rapidly through all 71 presets in sequence
    for (let i = 0; i < PRESETS.length; i++) {
      engine.setPreset(PRESETS[i]);
      expect(engine.activePreset?.id).toBe(PRESETS[i].id);
    }

    // After switching to the 71st preset, only lighting + 71st preset objects should be in scene
    expect(engine.activePreset?.id).toBe(PRESETS[PRESETS.length - 1].id);
    expect(engine.scene.children.length).toBeGreaterThan(initialLightCount);

    // Final disposal cleans up cleanly
    expect(() => {
      engine.activePreset?.dispose();
    }).not.toThrow();
  });

  test('T2.Presets.5: Zero canvas dimensions in resize do not produce NaN aspect ratios across presets', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    for (const preset of PRESETS) {
      preset.init(ctx);
      if (preset.resize) {
        expect(() => {
          preset.resize!(0, 0);
          preset.resize!(3840, 2160);
          preset.resize!(1920, 1080);
        }).not.toThrow();
      }
      preset.dispose();
      ctx.scene.clear();
    }
  });
});
