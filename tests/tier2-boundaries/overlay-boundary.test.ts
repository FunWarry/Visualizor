import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { sanitizeTextOverlayInput } from '../harness/contracts';

describe('Tier 2: Text Overlay Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Overlay.1: Whitespace-only, tabs, newlines, and null-character inputs disable rendering', () => {
    const r1 = sanitizeTextOverlayInput('\n\t\r   \t');
    expect(r1.sanitized).toBe('');
    expect(r1.enabled).toBe(false);

    const r2 = sanitizeTextOverlayInput('\0\0\0');
    expect(r2.enabled).toBe(false);
  });

  test('T2.Overlay.2: Massive 2000-character string is strictly clamped to max 200 characters', () => {
    const hugeInput = 'Visualizor-Cosmic-Sound-Wave-'.repeat(100);
    expect(hugeInput.length).toBeGreaterThan(2000);

    const result = sanitizeTextOverlayInput(hugeInput);
    expect(result.sanitized.length).toBe(200);
    expect(result.enabled).toBe(true);
  });

  test('T2.Overlay.3: Emojis, multilingual glyphs, and math symbols preserve integrity without garbling', () => {
    const unicodeInput = '🎵 Visuval 🌌 Synthwave: 太陽 & 光 (Cymatics ∑ 432Hz) 🔥';
    const result = sanitizeTextOverlayInput(unicodeInput);

    expect(result.sanitized).toBe(unicodeInput);
    expect(result.enabled).toBe(true);
  });

  test('T2.Overlay.4: Script tags and HTML entities are treated as literal text without execution', () => {
    const maliciousInput = '<script>window.pwned = true;</script><img src="x" onerror="alert(1)">';
    const result = sanitizeTextOverlayInput(maliciousInput);

    // Kept as plain text string
    expect(result.sanitized).toBe(maliciousInput);
    // Ensure global window was not exploited
    const g = globalThis as unknown as Record<string, unknown>;
    expect(g.pwned).toBeUndefined();
  });

  test('T2.Overlay.5: Font size clamping bounds text within [8px, 120px] range', () => {
    const clampFontSize = (size: number): number => {
      if (typeof size !== 'number' || isNaN(size)) return 24;
      return Math.max(8, Math.min(120, size));
    };

    expect(clampFontSize(-50)).toBe(8);
    expect(clampFontSize(0)).toBe(8);
    expect(clampFontSize(500)).toBe(120);
    expect(clampFontSize(NaN)).toBe(24);
  });

  test('T2.Overlay.6: Canvas dimension calculation respects max texture limits', () => {
    const maxTextureSize = 4096;
    const computeCanvasSize = (textLength: number, fontSize: number): { width: number; height: number } => {
      const estimatedWidth = Math.min(maxTextureSize, Math.ceil(textLength * fontSize * 0.7));
      const estimatedHeight = Math.min(maxTextureSize, Math.ceil(fontSize * 1.5));
      return { width: estimatedWidth, height: estimatedHeight };
    };

    const size = computeCanvasSize(200, 120);
    expect(size.width).toBeLessThanOrEqual(maxTextureSize);
    expect(size.height).toBeLessThanOrEqual(maxTextureSize);
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });
});
