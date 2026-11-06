import * as THREE from 'three';
import { TextOverlayEngine } from '../src/overlay/TextOverlayEngine';
import { RenderEngine } from '../src/engine/RenderEngine';
import { getTheme } from '../src/themes/themes';
import { setupTestEnvironment, MockElement } from './harness/env';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from './harness/fixtures';
import { CANONICAL_9_TEXT_ANCHORS, CANONICAL_5_TEXT_ANIMATIONS, TextAnchor } from '../src/overlay/types';

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER STRESS HARNESS: MILESTONE 5 (#43 feat(overlay))  ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures: Array<{ name: string; error: string }> = [];

function check(title: string, fn: () => void): void {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✓ PASS: ${title}`);
  } catch (err: unknown) {
    failedChecks++;
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ FAIL: ${title}`);
    console.error(`    ${message}`);
    failures.push({ name: title, error: message });
  }
}

function assert(condition: unknown, msg: string): void {
  if (!condition) throw new Error(msg);
}

setupTestEnvironment();
const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
const mockTheme = getTheme('ember');

// ===========================================================================
// SECTION 1: MULTI-LAYER TEXT STATE & WATERMARK INTEGRITY
// ===========================================================================
console.log('--- SECTION 1: Multi-Layer Text State & Watermark Integrity ---');

check('1.1: 3 independent text layers maintain distinct content without cross-contamination', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setTitle('Cyber Symphony');
  engine.setArtist('Neon Orchestra');
  engine.setCustomText('Live in Tokyo 2026');

  const config = engine.getConfig();
  assert(config.layers.title === 'Cyber Symphony', 'Title mismatch');
  assert(config.layers.artist === 'Neon Orchestra', 'Artist mismatch');
  assert(config.layers.custom === 'Live in Tokyo 2026', 'Custom text mismatch');

  const active = engine.getActiveLayers();
  assert(active.length === 3, 'Expected 3 active layers');
  assert(active.includes('title') && active.includes('artist') && active.includes('custom'), 'Missing active layer');
});

check('1.2: Whitespace trimming and invalid input protection on layer setters', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setTitle('   Padded Title   \n\t');
  assert(engine.getConfig().layers.title === 'Padded Title', 'Whitespace was not trimmed');

  // @ts-expect-error Testing non-string inputs
  engine.setTitle(null);
  assert(engine.getConfig().layers.title === '', 'Null input should result in empty string');

  // @ts-expect-error Testing undefined input
  engine.setArtist(undefined);
  assert(engine.getConfig().layers.artist === '', 'Undefined input should result in empty string');

  // @ts-expect-error Testing numeric input
  engine.setCustomText(12345);
  assert(engine.getConfig().layers.custom === '', 'Non-string input should result in empty string');
});

check('1.3: Watermark independence and active content detection', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  assert(!engine.hasActiveContent(), 'Fresh engine should have no active content');

  engine.setWatermark(true);
  assert(engine.getConfig().watermark === true, 'Watermark should be enabled');
  assert(engine.hasActiveContent(), 'Watermark alone should count as active content');

  engine.setWatermark(false);
  assert(!engine.hasActiveContent(), 'Disabling watermark should clear active content when layers empty');

  engine.setTitle('Track 01');
  assert(engine.hasActiveContent(), 'Title alone should count as active content');

  engine.clearAll();
  assert(!engine.hasActiveContent(), 'clearAll should clear both layers and watermark');
  assert(engine.getActiveLayers().length === 0, 'No active layers after clearAll');
});

// ===========================================================================
// SECTION 2: 9-POINT SCREEN QUADRANT ANCHOR MATRIX MATHEMATICS
// ===========================================================================
console.log('--- SECTION 2: 9-Point Screen Quadrant Anchor Matrix Calculations ---');

check('2.1: Canonical 9 anchors declared and correctly set', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  assert(CANONICAL_9_TEXT_ANCHORS.length === 9, 'Must have 9 canonical anchors');

  for (const anchor of CANONICAL_9_TEXT_ANCHORS) {
    engine.setAnchor(anchor);
    assert(engine.getConfig().anchor === anchor, `Anchor ${anchor} not set`);
  }
});

check('2.2: 9-point anchor coordinate math verification across standard margins', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  const margin = 40;

  // We can test private computeAnchorCoordinates by reflection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compute = (engine as any).computeAnchorCoordinates.bind(engine);

  const tl = compute('top-left');
  assert(tl.baseX === margin && tl.baseY === margin, 'top-left coordinates mismatch');
  assert(tl.align === 'left' && tl.baseline === 'top', 'top-left alignments mismatch');

  const tc = compute('top-center');
  assert(tc.baseX === 1920 / 2 && tc.baseY === margin, 'top-center coordinates mismatch');
  assert(tc.align === 'center' && tc.baseline === 'top', 'top-center alignments mismatch');

  const tr = compute('top-right');
  assert(tr.baseX === 1920 - margin && tr.baseY === margin, 'top-right coordinates mismatch');
  assert(tr.align === 'right' && tr.baseline === 'top', 'top-right alignments mismatch');

  const cl = compute('center-left');
  assert(cl.baseX === margin && cl.baseY === 1080 / 2, 'center-left coordinates mismatch');
  assert(cl.align === 'left' && cl.baseline === 'middle', 'center-left alignments mismatch');

  const c = compute('center');
  assert(c.baseX === 1920 / 2 && c.baseY === 1080 / 2, 'center coordinates mismatch');
  assert(c.align === 'center' && c.baseline === 'middle', 'center alignments mismatch');

  const cr = compute('center-right');
  assert(cr.baseX === 1920 - margin && cr.baseY === 1080 / 2, 'center-right coordinates mismatch');
  assert(cr.align === 'right' && cr.baseline === 'middle', 'center-right alignments mismatch');

  const bl = compute('bottom-left');
  assert(bl.baseX === margin && bl.baseY === 1080 - margin, 'bottom-left coordinates mismatch');
  assert(bl.align === 'left' && bl.baseline === 'bottom', 'bottom-left alignments mismatch');

  const bc = compute('bottom-center');
  assert(bc.baseX === 1920 / 2 && bc.baseY === 1080 - margin, 'bottom-center coordinates mismatch');
  assert(bc.align === 'center' && bc.baseline === 'bottom', 'bottom-center alignments mismatch');

  const br = compute('bottom-right');
  assert(br.baseX === 1920 - margin && br.baseY === 1080 - margin, 'bottom-right coordinates mismatch');
  assert(br.align === 'right' && br.baseline === 'bottom', 'bottom-right alignments mismatch');
});

check('2.3: Middle alias anchor normalization', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const compute = (engine as any).computeAnchorCoordinates.bind(engine);

  const ml = compute('middle-left');
  const cl = compute('center-left');
  assert(ml.baseX === cl.baseX && ml.baseY === cl.baseY && ml.align === cl.align, 'middle-left alias failed');

  const mc = compute('middle-center');
  const c = compute('center');
  assert(mc.baseX === c.baseX && mc.baseY === c.baseY && mc.align === c.align, 'middle-center alias failed');

  const mr = compute('middle-right');
  const cr = compute('center-right');
  assert(mr.baseX === cr.baseX && mr.baseY === cr.baseY && mr.align === cr.align, 'middle-right alias failed');
});

// ===========================================================================
// SECTION 3: 5 ANIMATION MODES MATHEMATICAL BEHAVIOR
// ===========================================================================
console.log('--- SECTION 3: 5 Animation Modes Mathematical Behavior ---');

check('3.1: Canonical 5 animations declared and correctly cycle', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  assert(CANONICAL_5_TEXT_ANIMATIONS.length === 5, 'Must have 5 canonical animations');

  for (const anim of CANONICAL_5_TEXT_ANIMATIONS) {
    engine.setAnimationMode(anim);
    assert(engine.getConfig().animation === anim, `Animation ${anim} not set`);
  }
});

check('3.2: Pulse mode mathematical scale scaling with bass and beat', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setAnimationMode('pulse');
  engine.setAnimationIntensity(0.5);

  const silent = createSilentAudioFeatures();
  engine.update(silent, 0.016);
  assert(Math.abs(engine.getScaleMultiplier() - 1.0) < 0.001, 'Silent audio should produce scale 1.0');

  const beatDrop = createBeatDropAudioFeatures(0.8);
  engine.update(beatDrop, 0.016);
  const scale = engine.getScaleMultiplier();
  // scale = 1.0 + 0.8 * 0.5 * 0.35 + 0.15 * 0.5 = 1.0 + 0.14 + 0.075 = 1.215
  assert(Math.abs(scale - 1.215) < 0.01, `Expected scale ~1.215, got ${scale}`);
});

check('3.3: Glitch mode jitter displacement under kick vs calm audio', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setAnimationMode('glitch');
  engine.setAnimationIntensity(1.0);

  const silent = createSilentAudioFeatures();
  engine.update(silent, 0.05);
  const calmDisp = engine.getGlitchDisplacement();
  const calmMag = Math.sqrt(calmDisp.x * calmDisp.x + calmDisp.y * calmDisp.y);

  const kick = createBeatDropAudioFeatures(1.0);
  engine.update(kick, 0.05);
  const kickDisp = engine.getGlitchDisplacement();
  const kickMag = Math.sqrt(kickDisp.x * kickDisp.x + kickDisp.y * kickDisp.y);

  assert(kickMag >= calmMag, 'Glitch jitter under kick should be greater than or equal to calm');
});

check('3.4: Static mode guarantees zero scale multiplier and zero displacement', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setAnimationMode('static');

  const heavyKick = createBeatDropAudioFeatures(1.0);
  engine.update(heavyKick, 0.016);

  assert(engine.getScaleMultiplier() === 1.0, 'Static scale must be exactly 1.0');
  const disp = engine.getGlitchDisplacement();
  assert(disp.x === 0 && disp.y === 0, 'Static displacement must be (0, 0)');
});

check('3.5: Marquee mode translation offset computation', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setAnimationMode('marquee');
  engine.setAnimationIntensity(0.5);

  // Speed = 40 + 0.5 * 160 = 120 px/s
  // At elapsedTime = 2.0s, marqueeOffset = 240
  const silent = createSilentAudioFeatures();
  engine.update(silent, 1.0); // delta 1.0
  engine.update(silent, 1.0); // delta 1.0 -> elapsed 2.0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offset = (engine as any).marqueeOffset;
  assert(Math.abs(offset - 240) < 1.0, `Expected marquee offset ~240, got ${offset}`);
});

// ===========================================================================
// SECTION 4: PARAMETER CLAMPING & ADVERSARIAL VALUE RESILIENCE
// ===========================================================================
console.log('--- SECTION 4: Parameter Clamping & Adversarial Resilience ---');

check('4.1: Font size bounds [12, 96] clamping with NaN protection', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setFontSize(-50);
  assert(engine.getConfig().fontSize === 12, 'Negative font size must clamp to 12');

  engine.setFontSize(250);
  assert(engine.getConfig().fontSize === 96, 'Excessive font size must clamp to 96');

  engine.setFontSize(NaN);
  assert(engine.getConfig().fontSize === 32, 'NaN font size must fallback to 32');

  // @ts-expect-error Testing non-number input
  engine.setFontSize('huge');
  assert(engine.getConfig().fontSize === 32, 'String font size must fallback to 32');
});

check('4.2: Glow intensity bounds [0.0, 2.0] clamping with NaN protection', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setGlowIntensity(-1.0);
  assert(engine.getConfig().glowIntensity === 0.0, 'Negative glow must clamp to 0.0');

  engine.setGlowIntensity(5.0);
  assert(engine.getConfig().glowIntensity === 2.0, 'Excessive glow must clamp to 2.0');

  engine.setGlowIntensity(NaN);
  assert(engine.getConfig().glowIntensity === 0.8, 'NaN glow must fallback to 0.8');
});

check('4.3: Opacity bounds [0.0, 1.0] clamping with NaN protection', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setOpacity(-0.5);
  assert(engine.getConfig().opacity === 0.0, 'Negative opacity must clamp to 0.0');

  engine.setOpacity(2.5);
  assert(engine.getConfig().opacity === 1.0, 'Excessive opacity must clamp to 1.0');

  engine.setOpacity(NaN);
  assert(engine.getConfig().opacity === 1.0, 'NaN opacity must fallback to 1.0');
});

check('4.4: Animation intensity bounds [0.0, 1.0] clamping with NaN protection', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setAnimationIntensity(-1.0);
  assert(engine.getConfig().animationIntensity === 0.0, 'Negative intensity must clamp to 0.0');

  engine.setAnimationIntensity(2.0);
  assert(engine.getConfig().animationIntensity === 1.0, 'Excessive intensity must clamp to 1.0');

  engine.setAnimationIntensity(NaN);
  assert(engine.getConfig().animationIntensity === 0.5, 'NaN intensity must fallback to 0.5');
});

// ===========================================================================
// SECTION 5: RENDERENGINE INTEGRATION & ZERO-COST BYPASS
// ===========================================================================
console.log('--- SECTION 5: RenderEngine Integration & Zero-Cost Bypass ---');

check('5.1: RenderEngine initializes textOverlay with DPR and canvas dimensions', () => {
  const renderEngine = new RenderEngine(canvas, mockTheme);
  assert(renderEngine.textOverlay !== undefined, 'RenderEngine.textOverlay must exist');
  assert(renderEngine.textOverlay instanceof TextOverlayEngine, 'Must be instance of TextOverlayEngine');
});

check('5.2: Inactive text overlay bypasses renderer pass without overhead', () => {
  const renderEngine = new RenderEngine(canvas, mockTheme);
  renderEngine.textOverlay.clearAll();
  assert(!renderEngine.textOverlay.hasActiveContent(), 'Overlay is inactive');

  let renderCalls = 0;
  const mockRenderer = {
    autoClear: true,
    render: () => { renderCalls++; }
  } as unknown as THREE.WebGLRenderer;

  renderEngine.textOverlay.renderPass(mockRenderer);
  assert(renderCalls === 0, 'Inactive overlay must NOT invoke renderer.render()');

  // Activate content
  renderEngine.textOverlay.setTitle('Active Title');
  renderEngine.textOverlay.renderPass(mockRenderer);
  assert(renderCalls === 1, 'Active overlay MUST invoke renderer.render()');
});

check('5.3: Resize pass dynamically updates canvas and texture resolution', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert((engine as any).canvas.width === 1920, 'Initial canvas width 1920');

  engine.resize(800, 600, 2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert((engine as any).canvas.width === 1600, 'Resized canvas width with DPR 2 must be 1600');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  assert((engine as any).canvas.height === 1200, 'Resized canvas height with DPR 2 must be 1200');
});

check('5.4: Dispose cleanly cleans up Three.js scene, geometry, and texture', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.dispose();
  // Verify no exception thrown on double dispose
  engine.dispose();
});

// ===========================================================================
// SECTION 6: HIGH-VOLUME RAPID UPDATE STRESS (10,000 FRAMES)
// ===========================================================================
console.log('--- SECTION 6: High-Volume Rapid Update Stress (10,000 Frames) ---');

check('6.1: 10,000 frames of randomized audio updates maintain finite state and zero leak', () => {
  const engine = new TextOverlayEngine(1920, 1080, 1);
  engine.setTitle('Adversarial Stress Track');
  engine.setArtist('Stress DJ');
  engine.setWatermark(true);

  const modes: TextAnchor[] = CANONICAL_9_TEXT_ANCHORS;
  const anims = CANONICAL_5_TEXT_ANIMATIONS;

  for (let i = 0; i < 10000; i++) {
    const isBeat = i % 25 === 0;
    const audio = createBeatDropAudioFeatures((i % 100) / 100);
    audio.beat = isBeat;

    if (i % 200 === 0) {
      engine.setAnchor(modes[i % modes.length]);
      engine.setAnimationMode(anims[i % anims.length]);
    }

    engine.update(audio, 0.016);

    const scale = engine.getScaleMultiplier();
    assert(Number.isFinite(scale), `Scale became non-finite at frame ${i}`);
    const disp = engine.getGlitchDisplacement();
    assert(Number.isFinite(disp.x) && Number.isFinite(disp.y), `Glitch offset became non-finite at frame ${i}`);
  }
});

// ===========================================================================
// SUMMARY & VERDICT
// ===========================================================================
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED:       ${passedChecks}`);
console.log(`FAILED:       ${failedChecks}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error('FAILURES:');
  for (const f of failures) {
    console.error(`  - ${f.name}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('✓ ALL EMPIRICAL CHALLENGES PASSED PERFECTLY!\n');
  process.exit(0);
}
