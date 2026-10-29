import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { THEMES, getTheme } from '../../src/themes/themes';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { CANONICAL_28_THEME_IDS, isValidHexColor } from '../harness/contracts';
import { SpyVisualizerPreset } from '../harness/fixtures';

describe('Tier 1: Color Themes (#39)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Themes.1: Complete 28-theme catalog contains all required canonical themes', () => {
    expect(THEMES).toHaveLength(28);

    const themeIds = THEMES.map(t => t.id);
    for (const expectedId of CANONICAL_28_THEME_IDS) {
      expect(themeIds).toContain(expectedId);
    }
  });

  test('T1.Themes.2: Every theme satisfies the VisualizerTheme interface contract with valid hex colors', () => {
    for (const theme of THEMES) {
      expect(typeof theme.id).toBe('string');
      expect(typeof theme.name).toBe('string');
      expect(isValidHexColor(theme.primary)).toBe(true);
      expect(isValidHexColor(theme.secondary)).toBe(true);
      expect(isValidHexColor(theme.accent)).toBe(true);
      expect(isValidHexColor(theme.background)).toBe(true);
      expect(isValidHexColor(theme.glow)).toBe(true);
    }
  });

  test('T1.Themes.3: getTheme retrieves matching theme for all 28 IDs', () => {
    for (const id of CANONICAL_28_THEME_IDS) {
      const theme = getTheme(id);
      expect(theme).toBeDefined();
      expect(theme.id).toBe(id);
    }
  });

  test('T1.Themes.4: getTheme falls back safely to Ember for unknown IDs', () => {
    const fallback1 = getTheme('non-existent-theme-xyz');
    expect(fallback1.id).toBe('ember');

    const fallback2 = getTheme('');
    expect(fallback2.id).toBe('ember');
  });

  test('T1.Themes.5: RenderEngine.setTheme updates scene background color to theme background', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    const jadeTheme = getTheme('jade');
    engine.setTheme(jadeTheme);

    expect(engine.currentTheme.id).toBe('jade');
    expect(engine.scene.background).toBeDefined();
  });

  test('T1.Themes.6: RenderEngine.setTheme invokes onThemeChange on active preset', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const spyPreset = new SpyVisualizerPreset();

    engine.setPreset(spyPreset);
    const synthwave = getTheme('synthwave');
    engine.setTheme(synthwave);

    expect(spyPreset.themeChangeCalls).toBe(1);
    expect(spyPreset.lastTheme?.id).toBe('synthwave');
  });
});
