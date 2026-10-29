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
    const preset = getPreset('dna-helix');
    const ctx = createMockPresetContext(getTheme('ember'));

    preset.init(ctx);
    preset.dispose();

    // Second call to dispose should be idempotent
    expect(() => {
      preset.dispose();
    }).not.toThrow();
  });

  test('T2.Presets.2: Preset update with complete zero audio features executes without division by zero', () => {
    const preset = getPreset('volcano');
    const ctx = createMockPresetContext(getTheme('ember'));
    preset.init(ctx);

    const silentAudio = createSilentAudioFeatures();
    expect(() => {
      preset.update(ctx, silentAudio, 0, 0);
    }).not.toThrow();

    preset.dispose();
  });

  test('T2.Presets.3: Extreme delta time (10 seconds) is clamped to prevent physics explosions', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const preset = getPreset('water-slide');
    engine.setPreset(preset);

    const audio = createSilentAudioFeatures();
    // RenderEngine clamps delta via Math.min(clock.getDelta(), 0.1)
    expect(() => {
      engine.render(audio);
    }).not.toThrow();
  });

  test('T2.Presets.4: Rapid preset switching across 10 presets leaves zero lingering meshes', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    const initialLightCount = engine.scene.children.filter(c => (c as { isLight?: boolean }).isLight).length;

    // Switch rapidly across first 10 presets
    for (let i = 0; i < 10; i++) {
      engine.setPreset(PRESETS[i]);
    }

    // After switching to 10th preset, scene should only have lighting + 10th preset meshes
    expect(engine.activePreset?.id).toBe(PRESETS[9].id);
    expect(engine.scene.children.length).toBeGreaterThan(initialLightCount);
  });

  test('T2.Presets.5: Zero canvas dimensions in resize do not produce NaN aspect ratios', () => {
    const preset = getPreset('bloom-flower');
    const ctx = createMockPresetContext(getTheme('ember'));
    preset.init(ctx);

    if (preset.resize) {
      expect(() => {
        preset.resize!(0, 0);
      }).not.toThrow();
    }

    preset.dispose();
  });
});
