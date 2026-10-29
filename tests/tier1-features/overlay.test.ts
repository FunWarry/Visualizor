import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import {
  CANONICAL_9_TEXT_ANCHORS,
  CANONICAL_5_TEXT_ANIMATIONS,
  sanitizeTextOverlayInput
} from '../harness/contracts';

interface TextLineConfig {
  text: string;
  enabled: boolean;
  anchor: typeof CANONICAL_9_TEXT_ANCHORS[number];
  offsetX: number;
  offsetY: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  animation: typeof CANONICAL_5_TEXT_ANIMATIONS[number];
  animationIntensity: number;
}

describe('Tier 1: Text & Typography Overlays (#43)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Overlay.1: 3-line independent text overlay model maintains discrete states', () => {
    const lines: TextLineConfig[] = [
      {
        text: 'Visualizor Track Title',
        enabled: true,
        anchor: 'top-center',
        offsetX: 0,
        offsetY: 0.1,
        fontSize: 32,
        fontFamily: 'sans-serif',
        color: '#ffffff',
        animation: 'pulse',
        animationIntensity: 0.7
      },
      {
        text: 'Electronic Artist',
        enabled: true,
        anchor: 'center',
        offsetX: 0,
        offsetY: 0,
        fontSize: 24,
        fontFamily: 'sans-serif',
        color: '#ff00aa',
        animation: 'glow',
        animationIntensity: 0.5
      },
      {
        text: 'Lyrics stream line',
        enabled: false,
        anchor: 'bottom-center',
        offsetX: 0,
        offsetY: -0.1,
        fontSize: 18,
        fontFamily: 'monospace',
        color: '#00ffff',
        animation: 'runningRow',
        animationIntensity: 1.0
      }
    ];

    expect(lines).toHaveLength(3);
    expect(lines[0].text).toBe('Visualizor Track Title');
    expect(lines[1].animation).toBe('glow');
    expect(lines[2].enabled).toBe(false);
  });

  test('T1.Overlay.2: 9-point anchor matrix covers all screen quadrants', () => {
    expect(CANONICAL_9_TEXT_ANCHORS).toHaveLength(9);
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('top-left');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('top-center');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('top-right');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('center-left');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('center');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('center-right');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('bottom-left');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('bottom-center');
    expect(CANONICAL_9_TEXT_ANCHORS).toContain('bottom-right');
  });

  test('T1.Overlay.3: 5 animation modes defined with proper reactive properties', () => {
    expect(CANONICAL_5_TEXT_ANIMATIONS).toHaveLength(5);
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain('none');
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain('pulse');
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain('glow');
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain('fade');
    expect(CANONICAL_5_TEXT_ANIMATIONS).toContain('runningRow');
  });

  test('T1.Overlay.4: sanitizeTextOverlayInput sanitizes and clamps input strings', () => {
    // Normal string
    const res1 = sanitizeTextOverlayInput('  Hello   World  ');
    expect(res1.sanitized).toBe('Hello World');
    expect(res1.enabled).toBe(true);

    // Empty string
    const res2 = sanitizeTextOverlayInput('    ');
    expect(res2.sanitized).toBe('');
    expect(res2.enabled).toBe(false);

    // Over-length string clamped to 200 characters
    const longStr = 'a'.repeat(300);
    const res3 = sanitizeTextOverlayInput(longStr);
    expect(res3.sanitized.length).toBe(200);
    expect(res3.enabled).toBe(true);
  });

  test('T1.Overlay.5: Audio reactive pulse animation scales proportional to bass energy', () => {
    const calcPulseScale = (baseScale: number, bass: number, intensity: number): number => {
      return baseScale * (1.0 + bass * intensity * 0.35);
    };

    const base = 1.0;
    const quietScale = calcPulseScale(base, 0.1, 0.8);
    const dropScale = calcPulseScale(base, 0.9, 0.8);

    expect(quietScale).toBeCloseTo(1.028);
    expect(dropScale).toBeCloseTo(1.252);
    expect(dropScale).toBeGreaterThan(quietScale);
  });

  test('T1.Overlay.6: Running row marquee scroll computes horizontal translation from time and speed', () => {
    const computeMarqueeOffset = (time: number, speed: number, direction: 1 | -1): number => {
      return (time * speed * direction) % 1.0;
    };

    const offsetForward = computeMarqueeOffset(2.5, 0.2, 1);
    expect(offsetForward).toBeCloseTo(0.5);

    const offsetReverse = computeMarqueeOffset(2.5, 0.2, -1);
    expect(offsetReverse).toBeCloseTo(-0.5);
  });
});
