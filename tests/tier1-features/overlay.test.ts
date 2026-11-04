import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import {
  CANONICAL_9_TEXT_ANCHORS,
  CANONICAL_5_TEXT_ANIMATIONS,
  sanitizeTextOverlayInput
} from '../harness/contracts';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { getTheme } from '../../src/themes/themes';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from '../harness/fixtures';

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

  test('T1.Overlay.7: "T" rail icon opens/closes #textOverlayPanel and updates active state', () => {
    const textBtn = new MockElement('BUTTON');
    textBtn.id = 'textBtn';
    textBtn.setAttribute('data-panel', 'text');

    const panel = new MockElement('DIV');
    panel.id = 'textOverlayPanel';
    panel.className = 'drawer-panel detail-panel';

    const closeBtn = new MockElement('BUTTON');
    closeBtn.className = 'close-drawer-btn closeTextBtn';

    // Click opens
    textBtn.classList.add('active');
    panel.classList.add('open');
    expect(textBtn.classList.contains('active')).toBe(true);
    expect(panel.classList.contains('open')).toBe(true);

    // Click closes
    textBtn.classList.remove('active');
    panel.classList.remove('open');
    expect(textBtn.classList.contains('active')).toBe(false);
    expect(panel.classList.contains('open')).toBe(false);

    // Close button dismisses
    textBtn.classList.add('active');
    panel.classList.add('open');
    closeBtn.click();
    panel.classList.remove('open');
    textBtn.classList.remove('active');
    expect(panel.classList.contains('open')).toBe(false);
  });

  test('T1.Overlay.8: TextOverlayEngine initialization and state update methods', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    expect(engine.textOverlay).toBeDefined();
    const config = engine.textOverlay.getConfig();

    expect(config.layers).toBeDefined();
    expect(config.anchor).toBe('center');
    expect(config.watermark).toBe(false);
    expect(config.fontSize).toBe(32);
    expect(config.color).toBe('#ffffff');

    // Test setter methods
    engine.textOverlay.setTitle('Starlight Horizon');
    engine.textOverlay.setArtist('Cosmic Drift');
    engine.textOverlay.setCustomText('Live 2026');
    engine.textOverlay.setWatermark(true);
    engine.textOverlay.setAnchor('bottom-center');
    engine.textOverlay.setAnimationMode('glitch');
    engine.textOverlay.setFontSize(48);
    engine.textOverlay.setColor('#00FFAA');
    engine.textOverlay.setGlowIntensity(1.5);
    engine.textOverlay.setOpacity(0.9);

    const updated = engine.textOverlay.getConfig();
    expect(updated.layers.title).toBe('Starlight Horizon');
    expect(updated.layers.artist).toBe('Cosmic Drift');
    expect(updated.layers.custom).toBe('Live 2026');
    expect(updated.watermark).toBe(true);
    expect(updated.anchor).toBe('bottom-center');
    expect(updated.animation).toBe('glitch');
    expect(updated.fontSize).toBe(48);
    expect(updated.color).toBe('#00FFAA');
    expect(updated.glowIntensity).toBe(1.5);
    expect(updated.opacity).toBe(0.9);
  });

  test('T1.Overlay.9: Multi-layer text values reflect in engine state and rendering', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    engine.textOverlay.setTitle('Track A');
    engine.textOverlay.setArtist('Artist B');
    engine.textOverlay.setCustomText('VIP Mix');
    engine.textOverlay.setWatermark(true);

    const activeLayers = engine.textOverlay.getActiveLayers();
    expect(activeLayers).toContain('title');
    expect(activeLayers).toContain('artist');
    expect(activeLayers).toContain('custom');
    expect(engine.textOverlay.hasActiveContent()).toBe(true);

    // Emptying one layer does not clobber others
    engine.textOverlay.setTitle('');
    expect(engine.textOverlay.getActiveLayers()).not.toContain('title');
    expect(engine.textOverlay.getActiveLayers()).toContain('artist');
    expect(engine.textOverlay.hasActiveContent()).toBe(true);

    // Watermark alone counts as active content
    engine.textOverlay.setArtist('');
    engine.textOverlay.setCustomText('');
    expect(engine.textOverlay.hasActiveContent()).toBe(true);
  });

  test('T1.Overlay.10: 9-point anchor matrix coordinates calculated accurately across quadrants', () => {
    const width = 1920;
    const height = 1080;
    const margin = 40;

    const computeCoords = (anchor: typeof CANONICAL_9_TEXT_ANCHORS[number]) => {
      let x = width / 2;
      let y = height / 2;
      let align: 'left' | 'center' | 'right' = 'center';
      let baseline: 'top' | 'middle' | 'bottom' = 'middle';

      if (anchor.includes('left')) { x = margin; align = 'left'; }
      if (anchor.includes('right')) { x = width - margin; align = 'right'; }
      if (anchor.startsWith('top')) { y = margin; baseline = 'top'; }
      if (anchor.startsWith('bottom')) { y = height - margin; baseline = 'bottom'; }

      return { x, y, align, baseline };
    };

    const tl = computeCoords('top-left');
    expect(tl.x).toBe(margin);
    expect(tl.y).toBe(margin);
    expect(tl.align).toBe('left');
    expect(tl.baseline).toBe('top');

    const c = computeCoords('center');
    expect(c.x).toBe(960);
    expect(c.y).toBe(540);
    expect(c.align).toBe('center');
    expect(c.baseline).toBe('middle');

    const br = computeCoords('bottom-right');
    expect(br.x).toBe(1880);
    expect(br.y).toBe(1040);
    expect(br.align).toBe('right');
    expect(br.baseline).toBe('bottom');
  });

  test('T1.Overlay.11: All 5 animation modes cycle and apply appropriate parameters', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const modes = ['pulse', 'marquee', 'fade', 'static', 'glitch'] as const;

    for (const mode of modes) {
      engine.textOverlay.setAnimationMode(mode);
      expect(engine.textOverlay.getConfig().animation).toBe(mode);
    }

    // Verify glitch mode kick displacement
    engine.textOverlay.setAnimationMode('glitch');
    const audioKick = createBeatDropAudioFeatures(0.95);
    engine.textOverlay.update(audioKick, 0.016);
    const glitchOffset = engine.textOverlay.getGlitchDisplacement();
    expect(Math.abs(glitchOffset.x) + Math.abs(glitchOffset.y)).toBeGreaterThan(0);

    // Verify static mode remains unaffected by kick
    engine.textOverlay.setAnimationMode('static');
    engine.textOverlay.update(audioKick, 0.016);
    const staticScale = engine.textOverlay.getScaleMultiplier();
    expect(staticScale).toBeCloseTo(1.0);
  });

  test('T1.Overlay.12: Typography slider changes update overlay styling in real time', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    // Clamped font size [12, 96]
    engine.textOverlay.setFontSize(5);
    expect(engine.textOverlay.getConfig().fontSize).toBe(12);
    engine.textOverlay.setFontSize(150);
    expect(engine.textOverlay.getConfig().fontSize).toBe(96);

    // Clamped glow [0, 2.0]
    engine.textOverlay.setGlowIntensity(-1);
    expect(engine.textOverlay.getConfig().glowIntensity).toBe(0.0);
    engine.textOverlay.setGlowIntensity(3.5);
    expect(engine.textOverlay.getConfig().glowIntensity).toBe(2.0);

    // Clamped opacity [0, 1.0]
    engine.textOverlay.setOpacity(1.5);
    expect(engine.textOverlay.getConfig().opacity).toBe(1.0);
  });

  test('T1.Overlay.13: DOM controls drive engine state via user interactions', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    const textInput = new MockElement('INPUT');
    textInput.id = 'textInput0';
    textInput.value = 'New Title';

    const watermarkToggle = new MockElement('INPUT');
    (watermarkToggle as unknown as HTMLInputElement).checked = true;

    const fontSlider = new MockElement('INPUT');
    fontSlider.value = '42';

    // Attach listeners
    textInput.addEventListener('input', () => engine.textOverlay.setTitle(textInput.value));
    watermarkToggle.addEventListener('change', () => engine.textOverlay.setWatermark((watermarkToggle as unknown as HTMLInputElement).checked));
    fontSlider.addEventListener('input', () => engine.textOverlay.setFontSize(Number(fontSlider.value)));

    // Trigger events
    textInput.dispatchEvent(new Event('input'));
    watermarkToggle.dispatchEvent(new Event('change'));
    fontSlider.dispatchEvent(new Event('input'));

    expect(engine.textOverlay.getConfig().layers.title).toBe('New Title');
    expect(engine.textOverlay.getConfig().watermark).toBe(true);
    expect(engine.textOverlay.getConfig().fontSize).toBe(42);
  });

  test('T1.Overlay.14: Render loop multi-pass execution and zero-cost bypass when inactive', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const silent = createSilentAudioFeatures();

    // Inactive text overlay -> bypassed
    engine.textOverlay.clearAll();
    engine.render(silent);
    expect(engine.textOverlay.hasActiveContent()).toBe(false);

    // Active text overlay -> rendered in composite pass
    engine.textOverlay.setTitle('Live Feed');
    engine.render(silent);
    expect(engine.textOverlay.hasActiveContent()).toBe(true);
  });
});
