import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { THEMES, getTheme } from '../../src/themes/themes';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { SpyVisualizerPreset } from '../harness/fixtures';

describe('Tier 2: Themes Boundary & Corner Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Themes.1: Rapid switching across 50 themes preserves engine stability and active preset', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const spy = new SpyVisualizerPreset();
    engine.setPreset(spy);

    // Rapidly switch through themes 50 times
    for (let i = 0; i < 50; i++) {
      const theme = THEMES[i % THEMES.length];
      engine.setTheme(theme);
      expect(engine.currentTheme.id).toBe(theme.id);
    }

    expect(spy.themeChangeCalls).toBe(50);
    expect(engine.currentTheme.id).toBe(THEMES[49 % THEMES.length].id);
  });

  test('T2.Themes.2: Null, undefined, empty, and numeric theme IDs fallback gracefully without crashing', () => {
    expect(getTheme(null as unknown as string).id).toBe('ember');
    expect(getTheme(undefined as unknown as string).id).toBe('ember');
    expect(getTheme('').id).toBe('ember');
    expect(getTheme('   \t\n  ').id).toBe('ember');
    expect(getTheme('12345').id).toBe('ember');
  });

  test('T2.Themes.3: Hex color parser handles 3-digit and 6-digit hex formats with or without leading hash', () => {
    const parseHexToRgb = (hex: string): [number, number, number] | null => {
      const clean = hex.replace(/^#/, '').trim();
      if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16) / 255;
        const g = parseInt(clean[1] + clean[1], 16) / 255;
        const b = parseInt(clean[2] + clean[2], 16) / 255;
        return [r, g, b];
      }
      if (clean.length === 6) {
        const r = parseInt(clean.slice(0, 2), 16) / 255;
        const g = parseInt(clean.slice(2, 4), 16) / 255;
        const b = parseInt(clean.slice(4, 6), 16) / 255;
        return [r, g, b];
      }
      return null;
    };

    // 6-digit with hash
    const rgb1 = parseHexToRgb('#ff0055');
    expect(rgb1).toEqual([1.0, 0.0, 85 / 255]);

    // 6-digit without hash
    const rgb2 = parseHexToRgb('00e599');
    expect(rgb2).toEqual([0.0, 229 / 255, 153 / 255]);

    // 3-digit shorthand #f05 -> #ff0055
    const rgb3 = parseHexToRgb('#f05');
    expect(rgb3).toEqual([1.0, 0.0, 85 / 255]);

    // Malformed hex returns null without throwing
    expect(parseHexToRgb('invalid-hex')).toBeNull();
  });

  test('T2.Themes.4: Pure black (#000000) and pure white (#ffffff) theme boundary colors', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    const extremeTheme = {
      id: 'high-contrast',
      name: 'High Contrast',
      primary: '#ffffff',
      secondary: '#000000',
      accent: '#ffffff',
      background: '#000000',
      glow: '#ffffff'
    };

    engine.setTheme(extremeTheme);
    expect(engine.currentTheme.primary).toBe('#ffffff');
    expect(engine.currentTheme.background).toBe('#000000');
  });

  test('T2.Themes.5: Saturation adjustment modulation bounds colors at 0.0 (grayscale) and 1.0 (gamut)', () => {
    const applySaturation = (rgb: [number, number, number], sat: number): [number, number, number] => {
      const [r, g, b] = rgb;
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const clampedSat = Math.max(0, Math.min(1, sat));
      return [
        luma + (r - luma) * clampedSat,
        luma + (g - luma) * clampedSat,
        luma + (b - luma) * clampedSat
      ];
    };

    const red: [number, number, number] = [1.0, 0.0, 0.0];
    const grayscale = applySaturation(red, 0.0);
    // At sat 0, all components equal luma (0.299)
    expect(grayscale[0]).toBeCloseTo(0.299);
    expect(grayscale[1]).toBeCloseTo(0.299);
    expect(grayscale[2]).toBeCloseTo(0.299);

    const fullSat = applySaturation(red, 1.0);
    expect(fullSat[0]).toBeCloseTo(1.0);
    expect(fullSat[1]).toBeCloseTo(0.0);
    expect(fullSat[2]).toBeCloseTo(0.0);
  });
});
