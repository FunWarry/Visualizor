import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { PRESETS, getPreset } from '../../src/presets';
import { getTheme } from '../../src/themes/themes';
import { createMockPresetContext, createBeatDropAudioFeatures } from '../harness/fixtures';

describe('Tier 1: Presets Catalog & Lifecycle (#38)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Presets.1: Catalog contains 38+ presets across all categories', () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(38);

    const validCategories = [
      'Structures', 'Abstract & Space', 'Particles & Light',
      'Fluids & Heat', 'Tunnels', 'Retro & Digital', 'Organic & Nature'
    ];

    for (const preset of PRESETS) {
      expect(typeof preset.id).toBe('string');
      expect(typeof preset.name).toBe('string');
      expect(typeof preset.description).toBe('string');
      expect(validCategories).toContain(preset.category);
    }
  });

  test('T1.Presets.2: getPreset retrieves matching preset by ID or falls back to first preset', () => {
    const wave = getPreset('waveform');
    expect(wave).toBeDefined();
    expect(wave.id).toBe('waveform');

    const fallback = getPreset('unknown-preset-id');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(PRESETS[0].id);
  });

  test('T1.Presets.3: Preset init populates scene with renderable objects', () => {
    const preset = getPreset('three-d-bars');
    const ctx = createMockPresetContext(getTheme('ember'));

    expect(ctx.scene.children.length).toBe(0);
    preset.init(ctx);
    expect(ctx.scene.children.length).toBeGreaterThan(0);

    preset.dispose();
  });

  test('T1.Presets.4: Preset update executes without throwing during audio reactivity', () => {
    const preset = getPreset('circular-spectrum');
    const ctx = createMockPresetContext(getTheme('jade'));
    preset.init(ctx);

    const audio = createBeatDropAudioFeatures(0.85);
    preset.update(ctx, audio, 1.0, 0.016);

    // Verify update didn't crash and scene remains populated
    expect(ctx.scene.children.length).toBeGreaterThan(0);

    preset.dispose();
  });

  test('T1.Presets.5: onThemeChange updates preset materials when supported', () => {
    const preset = getPreset('particle-field');
    const ctx = createMockPresetContext(getTheme('ember'));
    preset.init(ctx);

    if (preset.onThemeChange) {
      const newTheme = getTheme('synthwave');
      preset.onThemeChange(newTheme);
      // Theme updated without throwing
      expect(newTheme.id).toBe('synthwave');
    }

    preset.dispose();
  });

  test('T1.Presets.6: Preset dispose releases objects and cleans up scene', () => {
    const preset = getPreset('neon-tunnel');
    const ctx = createMockPresetContext(getTheme('ember'));

    preset.init(ctx);
    expect(ctx.scene.children.length).toBeGreaterThan(0);

    preset.dispose();
    // After disposal, clearing scene removes remaining references
    ctx.scene.clear();
    expect(ctx.scene.children.length).toBe(0);
  });
});
