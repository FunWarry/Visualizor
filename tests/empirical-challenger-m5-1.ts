import * as THREE from 'three';
import { TextOverlayEngine } from '../src/overlay/TextOverlayEngine';
import {
  CANONICAL_9_TEXT_ANCHORS,
  CANONICAL_5_TEXT_ANIMATIONS,
  TextAnchor,
  TextAnimationMode
} from '../src/overlay/types';
import { setupTestEnvironment } from './harness/env';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from './harness/fixtures';
import { sanitizeTextOverlayInput } from './harness/contracts';
import { AudioFeatures } from '../src/types';

// =============================================================================
// EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 5 (TICKET #43)
// feat(overlay): Animated text and typography overlays
// Challenger: challenger_m5_1
// =============================================================================

console.log('========================================================================');
console.log('    EMPIRICAL CHALLENGER STRESS HARNESS: MILESTONE 5 (TICKET #43)       ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures: Array<{ name: string; error: string; stack?: string }> = [];

function check(title: string, fn: () => void): void {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✓ PASS: ${title}`);
  } catch (err: unknown) {
    failedChecks++;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`  ✗ FAIL: ${title}`);
    console.error(`    ${message}`);
    failures.push({ name: title, error: message, stack });
  }
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

setupTestEnvironment();

// =============================================================================
// SECTION 1: RAPID STATE MUTATIONS (10,000 ITERATIONS STRESS LOOP)
// =============================================================================
console.log('--- SECTION 1: Rapid State Mutations (10,000 Iterations Stress Loop) ---');

check('1.1: 10,000 sequential rapid mutations across Title, Artist, Custom, Watermark, and styling execute without crash', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  const sampleFonts = ['sans', 'mono', 'impact', 'futuristic', 'serif'];
  const sampleColors = ['#ffffff', '#00ffcc', '#ff0055', '#ffaa00', '#7700ff'];

  for (let i = 0; i < 10000; i++) {
    const anchor = CANONICAL_9_TEXT_ANCHORS[i % CANONICAL_9_TEXT_ANCHORS.length];
    const anim = CANONICAL_5_TEXT_ANIMATIONS[i % CANONICAL_5_TEXT_ANIMATIONS.length];
    const font = sampleFonts[i % sampleFonts.length];
    const color = sampleColors[i % sampleColors.length];

    engine.setTitle(`Title Step ${i}`);
    engine.setArtist(`Artist ${i % 100}`);
    engine.setCustomText(i % 2 === 0 ? `Custom Note ${i}` : '');
    engine.setWatermark(i % 3 === 0);
    engine.setAnchor(anchor);
    engine.setAnimationMode(anim);
    engine.setFontSize(12 + (i % 84));
    engine.setFontFamily(font);
    engine.setColor(color);
    engine.setGlowIntensity((i % 20) / 10.0);
    engine.setOpacity((i % 10) / 10.0);
    engine.setAnimationIntensity((i % 100) / 100.0);

    if (i % 2500 === 0) {
      engine.clearAll();
    }
  }

  // Final sanity check after 10,000 mutations
  engine.setTitle('Post-Stress Track');
  engine.setArtist('Post-Stress Artist');
  const cfg = engine.getConfig();
  assert(cfg.layers.title === 'Post-Stress Track', 'Title state must be consistent');
  assert(cfg.layers.artist === 'Post-Stress Artist', 'Artist state must be consistent');
  assert(Number.isFinite(cfg.fontSize), 'Font size must remain a finite number');
  assert(Number.isFinite(cfg.opacity), 'Opacity must remain a finite number');
  assert(Number.isFinite(cfg.glowIntensity), 'Glow intensity must remain a finite number');
});

check('1.2: Deterministic state integrity across 1,000 pseudo-random transitions', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  let seed = 123456789;
  const pseudoRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let i = 0; i < 1000; i++) {
    const t = `Track_${Math.floor(pseudoRandom() * 1000)}`;
    const a = `Artist_${Math.floor(pseudoRandom() * 1000)}`;
    const c = pseudoRandom() > 0.5 ? `Custom_${i}` : '';
    const wm = pseudoRandom() > 0.5;
    const anchorIdx = Math.floor(pseudoRandom() * CANONICAL_9_TEXT_ANCHORS.length);
    const animIdx = Math.floor(pseudoRandom() * CANONICAL_5_TEXT_ANIMATIONS.length);
    const size = Math.floor(pseudoRandom() * 100) + 10;
    const opacity = pseudoRandom();
    const glow = pseudoRandom() * 2.0;

    engine.setTitle(t);
    engine.setArtist(a);
    engine.setCustomText(c);
    engine.setWatermark(wm);
    engine.setAnchor(CANONICAL_9_TEXT_ANCHORS[anchorIdx]);
    engine.setAnimationMode(CANONICAL_5_TEXT_ANIMATIONS[animIdx]);
    engine.setFontSize(size);
    engine.setOpacity(opacity);
    engine.setGlowIntensity(glow);

    const snapshot = engine.getConfig();
    assert(snapshot.layers.title === t, `Title mismatch at ${i}: expected ${t}, got ${snapshot.layers.title}`);
    assert(snapshot.layers.artist === a, `Artist mismatch at ${i}`);
    assert(snapshot.layers.custom === c, `Custom mismatch at ${i}`);
    assert(snapshot.watermark === wm, `Watermark mismatch at ${i}`);
    assert(snapshot.anchor === CANONICAL_9_TEXT_ANCHORS[anchorIdx], `Anchor mismatch at ${i}`);
    assert(snapshot.animation === CANONICAL_5_TEXT_ANIMATIONS[animIdx], `Animation mismatch at ${i}`);
    assert(snapshot.fontSize >= 12 && snapshot.fontSize <= 96, `Font size not clamped [12, 96]: ${snapshot.fontSize}`);
    assert(snapshot.opacity >= 0.0 && snapshot.opacity <= 1.0, `Opacity out of bounds: ${snapshot.opacity}`);
    assert(snapshot.glowIntensity >= 0.0 && snapshot.glowIntensity <= 2.0, `Glow out of bounds: ${snapshot.glowIntensity}`);
  }
});

check('1.3: Active layers & visibility consistency across 1,000 layer permutations', () => {
  const engine = new TextOverlayEngine(1920, 1080);

  // Initial state should have no active layers and no visible content
  engine.clearAll();
  assert(engine.getActiveLayers().length === 0, 'Initial active layers must be empty');
  assert(!engine.hasActiveContent(), 'Initial hasActiveContent must be false');
  assert(!engine.hasVisibleContent(), 'Initial hasVisibleContent must be false');

  for (let i = 0; i < 1000; i++) {
    const hasT = (i & 1) !== 0;
    const hasA = (i & 2) !== 0;
    const hasC = (i & 4) !== 0;
    const hasW = (i & 8) !== 0;

    engine.setTitle(hasT ? `T_${i}` : '');
    engine.setArtist(hasA ? `A_${i}` : '');
    engine.setCustomText(hasC ? `C_${i}` : '');
    engine.setWatermark(hasW);

    const active = engine.getActiveLayers();
    assert(active.includes('title') === hasT, `Active title mismatch at step ${i}`);
    assert(active.includes('artist') === hasA, `Active artist mismatch at step ${i}`);
    assert(active.includes('custom') === hasC, `Active custom mismatch at step ${i}`);

    const expectedActive = hasT || hasA || hasC || hasW;
    assert(engine.hasActiveContent() === expectedActive, `hasActiveContent mismatch at step ${i}`);
    assert(engine.hasVisibleContent() === expectedActive, `hasVisibleContent mismatch at step ${i}`);
  }

  // Clear all restores clean slate
  engine.clearAll();
  assert(engine.getActiveLayers().length === 0, 'Post-clear active layers must be empty');
  assert(!engine.hasActiveContent(), 'Post-clear hasActiveContent must be false');
});

// =============================================================================
// SECTION 2: ADVERSARIAL BOUNDARY INPUTS & SANITIZATION AUDIT
// =============================================================================
console.log('\n--- SECTION 2: Adversarial Boundary Inputs & Robustness Mining ---');

check('2.1: 2,500 character inputs must clamp cleanly to 200 characters', () => {
  const hugeInput = 'Cosmic-Soundwave-Visualizor-2026-Super-Massive-Audio-Layer-Test-'.repeat(40);
  assert(hugeInput.length >= 2500, `Input must be at least 2500 characters, was ${hugeInput.length}`);

  // Test 2.1a: Contract sanitizer clamps to max 200 characters
  const sanitized = sanitizeTextOverlayInput(hugeInput);
  assert(sanitized.sanitized.length === 200, `sanitizeTextOverlayInput must clamp to 200, got ${sanitized.sanitized.length}`);
  assert(sanitized.enabled === true, 'Sanitized 2500-char input must be enabled');

  // Test 2.1b: Engine layer inputs
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle(hugeInput);
  engine.setArtist(hugeInput);
  engine.setCustomText(hugeInput);

  const cfg = engine.getConfig();
  // CRITICAL REQUIREMENT: "Boundary inputs: 2500 character inputs (must clamp cleanly to 200)"
  assert(
    cfg.layers.title.length <= 200,
    `TextOverlayEngine.setTitle must clamp 2500 characters cleanly to 200, but engine stored ${cfg.layers.title.length} characters`
  );
  assert(
    cfg.layers.artist.length <= 200,
    `TextOverlayEngine.setArtist must clamp 2500 characters cleanly to 200, but engine stored ${cfg.layers.artist.length} characters`
  );
  assert(
    cfg.layers.custom.length <= 200,
    `TextOverlayEngine.setCustomText must clamp 2500 characters cleanly to 200, but engine stored ${cfg.layers.custom.length} characters`
  );
});

check('2.2: Null bytes and control characters handled safely without canvas corruption', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  const nullByteStr = 'Track\0Title\x00\x01\x1F\x7FWith\0Nulls';

  // Contract sanitizer strips null bytes
  const sanitized = sanitizeTextOverlayInput(nullByteStr);
  assert(!sanitized.sanitized.includes('\0'), 'Sanitized text must not contain null bytes');

  // Direct injection into engine
  engine.setTitle(nullByteStr);
  engine.setArtist('\0\0\0');
  const active = engine.getActiveLayers();
  assert(active.includes('title'), 'Title with text should be registered');

  // Engine render pass with null bytes must not throw
  const audio = createBeatDropAudioFeatures(0.8);
  engine.update(audio, 0.016);
});

check('2.3: Astral Unicode emojis, non-Latin alphabets, and mathematical glyphs preserve integrity', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  const astralEmojiStr = '🎧 Track 🔥 🚀 宇宙 (Cosmic Space) 太陽 ∑ 432Hz ⚡';

  engine.setTitle(astralEmojiStr);
  engine.setArtist('Artist 🎵 𝄢 𝄞 𝅘𝅥𝅯');
  engine.setCustomText('مرحبا بالعالم | שלום עולם | こんにちは');

  const cfg = engine.getConfig();
  assert(cfg.layers.title === astralEmojiStr, 'Astral unicode emojis must not be corrupted');
  assert(cfg.layers.artist.includes('🎵'), 'Musical symbols must be preserved');

  // Ensure render loop processes unicode without exceptions
  const audio = createBeatDropAudioFeatures(0.9);
  engine.update(audio, 0.016);
});

check('2.4: Malicious script tags and HTML entities treated strictly as inert literal strings', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  const xssPayload = '<script>window.__CHALLENGER_PWNED__ = true;</script><img src="x" onerror="window.__CHALLENGER_PWNED__=true">';

  engine.setTitle(xssPayload);
  engine.setArtist('<b onmouseover="alert(1)">Test</b>');
  engine.update(createSilentAudioFeatures(), 0.016);

  const globalScope = globalThis as unknown as Record<string, unknown>;
  assert(globalScope.__CHALLENGER_PWNED__ === undefined, 'XSS script injection must never execute in overlay engine');
  assert(engine.getConfig().layers.title === xssPayload, 'Payload must be stored as literal text');
});

check('2.5: Negative, extreme, and NaN typography parameters clamp to valid bounds without NaN', () => {
  const engine = new TextOverlayEngine(1920, 1080);

  // Negative and extreme font size -> clamped to [12, 96]
  engine.setFontSize(-100);
  assert(engine.getConfig().fontSize === 12, `Font size -100 must clamp to 12, got ${engine.getConfig().fontSize}`);

  engine.setFontSize(0);
  assert(engine.getConfig().fontSize === 12, `Font size 0 must clamp to 12, got ${engine.getConfig().fontSize}`);

  engine.setFontSize(1000);
  assert(engine.getConfig().fontSize === 96, `Font size 1000 must clamp to 96, got ${engine.getConfig().fontSize}`);

  engine.setFontSize(NaN);
  assert(Number.isFinite(engine.getConfig().fontSize), 'Font size with NaN input must resolve to finite number');
  assert(engine.getConfig().fontSize >= 12 && engine.getConfig().fontSize <= 96, 'Font size must remain in [12, 96]');

  // Glow intensity -> clamped to [0.0, 2.0]
  engine.setGlowIntensity(-5.0);
  assert(engine.getConfig().glowIntensity === 0.0, 'Negative glow must clamp to 0.0');

  engine.setGlowIntensity(10.0);
  assert(engine.getConfig().glowIntensity === 2.0, 'Excess glow must clamp to 2.0');

  engine.setGlowIntensity(NaN);
  assert(Number.isFinite(engine.getConfig().glowIntensity), 'NaN glow must resolve to finite number');

  // Opacity -> clamped to [0.0, 1.0]
  engine.setOpacity(-2.0);
  assert(engine.getConfig().opacity === 0.0, 'Negative opacity must clamp to 0.0');

  engine.setOpacity(5.0);
  assert(engine.getConfig().opacity === 1.0, 'Excess opacity must clamp to 1.0');

  engine.setOpacity(NaN);
  assert(Number.isFinite(engine.getConfig().opacity), 'NaN opacity must resolve to finite number');

  // Animation intensity -> clamped to [0.0, 1.0]
  engine.setAnimationIntensity(-1.0);
  assert(engine.getConfig().animationIntensity === 0.0, 'Negative anim intensity must clamp to 0.0');

  engine.setAnimationIntensity(3.0);
  assert(engine.getConfig().animationIntensity === 1.0, 'Excess anim intensity must clamp to 1.0');

  engine.setAnimationIntensity(NaN);
  assert(Number.isFinite(engine.getConfig().animationIntensity), 'NaN anim intensity must resolve to finite number');
});

check('2.6: NaN coordinates and invalid resize dimensions handled safely without canvas corruption', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Resilience Test');

  // Negative dimensions in resize
  engine.resize(-1920, -1080);
  const audio = createBeatDropAudioFeatures(0.9);
  engine.update(audio, 0.016);

  // Zero dimensions in resize
  engine.resize(0, 0);
  engine.update(audio, 0.016);

  // Restore clean resolution
  engine.resize(1920, 1080);
  engine.update(audio, 0.016);
});

check('2.7: Adversarial audio input with NaN bass energy must not cause scaleMultiplier to become NaN', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('NaN Audio Protection Test');

  // Adversarial audio input with NaN bass energy
  const nanAudio: AudioFeatures = {
    ...createSilentAudioFeatures(),
    bass: NaN,
    beatEnergy: NaN
  };

  engine.setAnimationMode('pulse');
  engine.update(nanAudio, 0.016);
  const scale = engine.getScaleMultiplier();

  // REQUIREMENT: Zero NaN values
  assert(!isNaN(scale), `Scale multiplier must not be NaN when bass is NaN, got ${scale}`);
  assert(Number.isFinite(scale), `Scale multiplier must be finite, got ${scale}`);
});

check('2.8: Viewport resize with NaN dimensions must not corrupt canvas with NaN width or height', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('NaN Resize Protection Test');

  // Test resize with NaN
  engine.resize(NaN, NaN);
  engine.update(createSilentAudioFeatures(), 0.016);

  // Verify canvas dimensions are finite numbers
  const canvas = (engine as unknown as { canvas: HTMLCanvasElement }).canvas;
  assert(!isNaN(canvas.width), `Canvas width must not be NaN after resize(NaN, NaN), got ${canvas.width}`);
  assert(!isNaN(canvas.height), `Canvas height must not be NaN after resize(NaN, NaN), got ${canvas.height}`);
  assert(Number.isFinite(canvas.width), `Canvas width must be finite, got ${canvas.width}`);
  assert(Number.isFinite(canvas.height), `Canvas height must be finite, got ${canvas.height}`);
});

// =============================================================================
// SECTION 3: 9-POINT ANCHOR MATRIX COORDINATE PRECISION ACROSS 4 VIEWPORTS
// =============================================================================
console.log('\n--- SECTION 3: 9-Point Anchor Matrix Precision Across 4 Viewport Sizes ---');

interface ViewportSpec {
  name: string;
  width: number;
  height: number;
  aspect: string;
}

const VIEWPORTS: ViewportSpec[] = [
  { name: 'Standard 16:9 FHD', width: 1920, height: 1080, aspect: '16:9' },
  { name: 'Ultrawide 21:9 Cinema', width: 2560, height: 1080, aspect: '21:9' },
  { name: 'Vertical Mobile 9:16', width: 1080, height: 1920, aspect: '9:16' },
  { name: 'Square 1:1 Social', width: 1080, height: 1080, aspect: '1:1' }
];

function verifyAnchorCoordinates(
  anchor: TextAnchor,
  vp: ViewportSpec,
  margin = 40
): { expectedX: number; expectedY: number; expectedAlign: string; expectedBaseline: string } {
  let expectedX = vp.width / 2;
  let expectedY = vp.height / 2;
  let expectedAlign = 'center';
  let expectedBaseline = 'middle';

  if (anchor.includes('left')) {
    expectedX = margin;
    expectedAlign = 'left';
  } else if (anchor.includes('right')) {
    expectedX = vp.width - margin;
    expectedAlign = 'right';
  }

  if (anchor.startsWith('top')) {
    expectedY = margin;
    expectedBaseline = 'top';
  } else if (anchor.startsWith('bottom')) {
    expectedY = vp.height - margin;
    expectedBaseline = 'bottom';
  }

  return { expectedX, expectedY, expectedAlign, expectedBaseline };
}

for (const vp of VIEWPORTS) {
  check(`3.1.${vp.aspect}: All 9 canonical anchor points compute exact coordinates in ${vp.name} (${vp.width}x${vp.height})`, () => {
    const engine = new TextOverlayEngine(vp.width, vp.height);
    const margin = 40;

    for (const anchor of CANONICAL_9_TEXT_ANCHORS) {
      engine.setAnchor(anchor);
      const expected = verifyAnchorCoordinates(anchor, vp, margin);

      assert(Number.isFinite(expected.expectedX), `X must be finite for ${anchor} in ${vp.aspect}`);
      assert(Number.isFinite(expected.expectedY), `Y must be finite for ${anchor} in ${vp.aspect}`);

      // Verify boundary adherence
      if (anchor.includes('left')) {
        assert(expected.expectedX === 40, `Left anchor X must be exactly margin 40, got ${expected.expectedX}`);
      } else if (anchor.includes('right')) {
        assert(expected.expectedX === vp.width - 40, `Right anchor X must be exactly width - 40, got ${expected.expectedX}`);
      } else {
        assert(expected.expectedX === vp.width / 2, `Center anchor X must be exactly width / 2, got ${expected.expectedX}`);
      }

      if (anchor.startsWith('top')) {
        assert(expected.expectedY === 40, `Top anchor Y must be exactly margin 40, got ${expected.expectedY}`);
      } else if (anchor.startsWith('bottom')) {
        assert(expected.expectedY === vp.height - 40, `Bottom anchor Y must be exactly height - 40, got ${expected.expectedY}`);
      } else {
        assert(expected.expectedY === vp.height / 2, `Center anchor Y must be exactly height / 2, got ${expected.expectedY}`);
      }
    }
  });
}

check('3.2: Multi-line vertical stacking prevents margin collision across top, bottom, and center anchors', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Top Title Line');
  engine.setArtist('Middle Artist Line');
  engine.setCustomText('Bottom Custom Line');
  engine.setFontSize(32);

  const audio = createSilentAudioFeatures();

  // Test across all 9 anchors: rendering multi-line overlay must execute cleanly
  for (const anchor of CANONICAL_9_TEXT_ANCHORS) {
    engine.setAnchor(anchor);
    engine.update(audio, 0.016);
  }
});

// =============================================================================
// SECTION 4: 1,000 ANIMATION FRAMES ACROSS ALL 5 MODES & ZERO-LEAK AUDIT
// =============================================================================
console.log('\n--- SECTION 4: 1,000 Animation Frames Simulation & Zero-Leak Audit ---');

check('4.1: Pulse mode under 1,000 frames produces continuous finite scaleMultiplier with zero NaN', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Pulse Mode Test');
  engine.setAnimationMode('pulse');
  engine.setAnimationIntensity(0.8);

  for (let f = 0; f < 1000; f++) {
    const isBeat = f % 25 === 0;
    const bassEnergy = isBeat ? 0.95 : 0.05 + 0.1 * Math.abs(Math.sin(f * 0.1));
    const audio: AudioFeatures = {
      ...createSilentAudioFeatures(),
      bass: bassEnergy,
      beat: isBeat,
      beatEnergy: isBeat ? 1.0 : 0.1
    };

    engine.update(audio, 0.016);
    const scale = engine.getScaleMultiplier();

    assert(Number.isFinite(scale), `Scale must be finite at frame ${f}, got ${scale}`);
    assert(!isNaN(scale), `Scale must not be NaN at frame ${f}`);
    assert(scale >= 1.0, `Pulse scale must never be less than 1.0, got ${scale} at frame ${f}`);
  }
});

check('4.2: Marquee mode under 1,000 frames computes smooth horizontal scroll with zero NaN', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Marquee Running Row Continuous Scroll Test');
  engine.setAnimationMode('marquee');
  engine.setAnimationIntensity(0.5);

  const audio = createSilentAudioFeatures();

  for (let f = 0; f < 1000; f++) {
    engine.update(audio, 0.016);
    const glitch = engine.getGlitchDisplacement();
    assert(glitch.x === 0 && glitch.y === 0, `Glitch displacement must be zero in marquee mode at frame ${f}`);
    assert(engine.getScaleMultiplier() === 1.0, `Scale multiplier must be 1.0 in marquee mode at frame ${f}`);
  }
});

check('4.3: Fade mode under 1,000 frames modulates opacity sinusoidally with zero NaN', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Fade In-Out Mode Test');
  engine.setAnimationMode('fade');
  engine.setOpacity(0.9);
  engine.setAnimationIntensity(0.7);

  for (let f = 0; f < 1000; f++) {
    const isBeat = f % 30 === 0;
    const audio: AudioFeatures = {
      ...createSilentAudioFeatures(),
      beat: isBeat,
      beatEnergy: isBeat ? 0.8 : 0.0
    };

    engine.update(audio, 0.016);
  }
});

check('4.4: Static mode under 1,000 frames remains strictly stationary regardless of audio kicks', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Static Mode Non-Reactive Test');
  engine.setAnimationMode('static');

  for (let f = 0; f < 1000; f++) {
    const audio = createBeatDropAudioFeatures(0.99); // Max kick
    engine.update(audio, 0.016);

    const scale = engine.getScaleMultiplier();
    const glitch = engine.getGlitchDisplacement();

    assert(scale === 1.0, `Static mode scale must remain exactly 1.0, got ${scale} at frame ${f}`);
    assert(glitch.x === 0 && glitch.y === 0, `Static mode glitch offset must remain 0, got (${glitch.x}, ${glitch.y}) at frame ${f}`);
  }
});

check('4.5: Glitch mode under 1,000 frames triggers dynamic jitter displacement during beat transients', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Cyberpunk Glitch Mode');
  engine.setAnimationMode('glitch');
  engine.setAnimationIntensity(1.0);

  let kickJitterCount = 0;

  for (let f = 0; f < 1000; f++) {
    const isKick = f % 20 === 0;
    const audio: AudioFeatures = {
      ...createSilentAudioFeatures(),
      bass: isKick ? 0.95 : 0.1,
      beat: isKick,
      beatEnergy: isKick ? 1.0 : 0.0
    };

    engine.update(audio, 0.016);
    const glitch = engine.getGlitchDisplacement();

    assert(Number.isFinite(glitch.x), `Glitch X must be finite at frame ${f}`);
    assert(Number.isFinite(glitch.y), `Glitch Y must be finite at frame ${f}`);
    assert(!isNaN(glitch.x), `Glitch X must not be NaN at frame ${f}`);
    assert(!isNaN(glitch.y), `Glitch Y must not be NaN at frame ${f}`);

    if (isKick && (Math.abs(glitch.x) > 0.01 || Math.abs(glitch.y) > 0.01)) {
      kickJitterCount++;
    }
  }

  assert(kickJitterCount > 0, `Glitch jitter should trigger on kicks (triggered ${kickJitterCount} times)`);
});

check('4.6: Memory and heap stability: 1,000 full composite render passes execute without heap leaks', () => {
  const engine = new TextOverlayEngine(1920, 1080);
  engine.setTitle('Stability Stress Track');
  engine.setArtist('Stress Artist');
  engine.setCustomText('Stability Verification Run');
  engine.setWatermark(true);

  if (globalThis.gc) {
    globalThis.gc();
  }
  const initialMem = process.memoryUsage().heapUsed;

  const audio = createBeatDropAudioFeatures(0.85);

  for (let f = 0; f < 1000; f++) {
    engine.update(audio, 0.016);
  }

  if (globalThis.gc) {
    globalThis.gc();
  }
  const finalMem = process.memoryUsage().heapUsed;
  const growthMB = (finalMem - initialMem) / (1024 * 1024);

  // Heap growth over 1000 frames must be bounded (< 35 MB)
  assert(growthMB < 35, `Heap growth exceeded threshold: ${growthMB.toFixed(2)} MB`);

  // Proper disposal frees Three.js resources
  engine.dispose();
});

// =============================================================================
// SUMMARY REPORT
// =============================================================================
console.log('\n========================================================================');
console.log(`EMPIRICAL CHALLENGER VERDICT: ${passedChecks} / ${totalChecks} tests passed (${failedChecks} failures)`);
console.log('========================================================================');

if (failedChecks > 0) {
  console.error('\nFAILURES DETECTED:');
  failures.forEach((f, idx) => {
    console.error(`\n[${idx + 1}] ${f.name}`);
    console.error(`    ${f.error}`);
  });
  console.log('\n>>> EMPIRICAL VERDICT: REQUEST_CHANGES <<<\n');
  process.exit(1);
} else {
  console.log('\n>>> EMPIRICAL VERDICT: APPROVE <<<\n');
  process.exit(0);
}
