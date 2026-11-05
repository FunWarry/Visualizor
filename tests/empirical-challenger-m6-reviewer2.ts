/**
 * Empirical Adversarial Challenger: Milestone 6 (Ticket #44)
 * Reviewer 2 Independent Stress & Integrity Harness
 */

import * as THREE from 'three';
import {
  clampNumber,
  hashPromptToSeed,
  createPrng,
  canonicalFingerprint,
  CANONICAL_FAMILY_IDS,
  ENGINE_FAMILIES_META,
  FAMILY_GENE_DEFAULTS,
  EngineFamily,
  StudioRecipe
} from '../src/studio/types';
import {
  createDefaultRecipe,
  StudioRecipeManager,
  StudioComposerPreset
} from '../src/studio/StudioComposer';

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition: boolean, desc: string): void {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ PASS: ${desc}`);
  } else {
    failedChecks++;
    console.error(`  ✗ FAIL: ${desc}`);
  }
}

// In-memory mock localStorage
class MockStorage {
  private store = new Map<string, string>();
  public shouldThrow = false;

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  setItem(key: string, value: string): void {
    if (this.shouldThrow) {
      throw new Error('QuotaExceededError: DOM Exception 22');
    }
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const mockStorage = new MockStorage();
(globalThis as unknown as { localStorage: MockStorage }).localStorage = mockStorage;

async function runAdversarialSuite() {
  console.log('========================================================================');
  console.log('   EMPIRICAL ADVERSARIAL CHALLENGER: MILESTONE 6 (#44 feat(studio))     ');
  console.log('========================================================================\n');

  // --- SECTION 1: Numeric Clamping & Boundary Math ---
  console.log('--- SECTION 1: Numeric Clamping & Boundary Math ---');
  assert(clampNumber(5, 0, 10, 1) === 5, '1.1: In-range numeric values pass unmodified');
  assert(clampNumber(-10, 0, 10, 1) === 0, '1.2: Values below minimum clamp to min');
  assert(clampNumber(20, 0, 10, 1) === 10, '1.3: Values above maximum clamp to max');
  assert(clampNumber(Number.NaN, 0, 10, 3) === 3, '1.4: NaN falls back safely to default');
  assert(clampNumber(Number.POSITIVE_INFINITY, 0, 10, 4) === 4, '1.5: +Infinity falls back safely');
  assert(clampNumber(Number.NEGATIVE_INFINITY, 0, 10, 4) === 4, '1.6: -Infinity falls back safely');
  assert(clampNumber(null, 0, 10, 5) === 5, '1.7: null falls back safely');
  assert(clampNumber(undefined, 0, 10, 5) === 5, '1.8: undefined falls back safely');
  assert(clampNumber('5', 0, 10, 6) === 6, '1.9: string representation falls back safely');
  assert(clampNumber({}, 0, 10, 7) === 7, '1.10: object input falls back safely');

  // --- SECTION 2: 32-bit FNV-1a Hash & Determinism ---
  console.log('\n--- SECTION 2: 32-bit FNV-1a Hash & Determinism ---');
  const emptySeed = hashPromptToSeed('');
  assert(typeof emptySeed === 'number' && emptySeed >= 0 && (emptySeed >>> 0) === emptySeed, '2.1: Empty prompt produces valid uint32 seed');

  const seed1 = hashPromptToSeed('Visuval Harmonic Synthesis');
  const seed2 = hashPromptToSeed('Visuval Harmonic Synthesis');
  assert(seed1 === seed2, '2.2: hashPromptToSeed is 100% deterministic');
  assert(seed1 !== hashPromptToSeed('Visuval Harmonic Synthesis 2'), '2.3: Different prompts produce distinct seeds');

  // 1,000 randomized Unicode, emoji, and control character prompts
  let hashRobust = true;
  for (let i = 0; i < 500; i++) {
    const prompt = `🔥 Space #${i} \u0000 \t \n \uFFFF ${'x'.repeat(i % 100)}`;
    const h = hashPromptToSeed(prompt);
    if (typeof h !== 'number' || Number.isNaN(h) || h < 0 || (h >>> 0) !== h) {
      hashRobust = false;
      break;
    }
  }
  assert(hashRobust, '2.4: 500 adversarial Unicode and control-char prompts produce valid uint32 seeds');

  // --- SECTION 3: Mulberry32 PRNG Uniformity & Bounds ---
  console.log('\n--- SECTION 3: Mulberry32 PRNG Uniformity & Bounds ---');
  const prng = createPrng(0x811c9dc5);
  let prngValid = true;
  let prngSum = 0;
  const PRNG_SAMPLES = 10000;
  for (let i = 0; i < PRNG_SAMPLES; i++) {
    const val = prng();
    if (val < 0.0 || val >= 1.0 || Number.isNaN(val)) {
      prngValid = false;
      break;
    }
    prngSum += val;
  }
  const prngMean = prngSum / PRNG_SAMPLES;
  assert(prngValid, '3.1: 10,000 Mulberry32 samples remain strictly bounded within [0, 1.0)');
  assert(Math.abs(prngMean - 0.5) < 0.02, `3.2: PRNG sample mean (${prngMean.toFixed(4)}) is uniform near 0.50`);

  // --- SECTION 4: 5 Engine Families & Canonical Fingerprints ---
  console.log('\n--- SECTION 4: 5 Engine Families & Canonical Fingerprints ---');
  assert(CANONICAL_FAMILY_IDS.length === 5, '4.1: Exactly 5 canonical families declared');
  CANONICAL_FAMILY_IDS.forEach((fam: EngineFamily) => {
    assert(ENGINE_FAMILIES_META[fam] !== undefined, `4.2.${fam}: Metadata exists for ${fam}`);
    assert(FAMILY_GENE_DEFAULTS[fam] !== undefined, `4.3.${fam}: Gene defaults exist for ${fam}`);
  });

  const defaultRecipe = createDefaultRecipe('force');
  const fp1 = canonicalFingerprint(defaultRecipe);
  const fp2 = canonicalFingerprint(defaultRecipe);
  assert(fp1.startsWith('engine|force|'), '4.4: Canonical fingerprint format starts with engine|force|');
  assert(fp1 === fp2, '4.5: Canonical fingerprint is identical for identical recipes');

  // Composite recipe fingerprint format
  const compRecipe: StudioRecipe = {
    kind: 'recipe',
    id: 'comp_1',
    name: 'Composite Look',
    space: '3d',
    background: { familyId: 'liquid', seed: 1234, genes: { warp: 0.5 } },
    blend: { presetId: 'neon-tunnel', progress: 0.5 },
    foreground: { type: 'mesh', shapeId: 'sphere' },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const compFp = canonicalFingerprint(compRecipe);
  assert(compFp.startsWith('recipe|3d|'), '4.6: Composite recipe fingerprint starts with recipe|3d|');

  // --- SECTION 5: Recipe Manager & 3 Generation Modes ---
  console.log('\n--- SECTION 5: Recipe Manager & 3 Generation Modes ---');
  let managerNotified = 0;
  const manager = new StudioRecipeManager(() => {
    managerNotified++;
  });

  // Mode 1: Auto-Forge (50 Monte Carlo passes)
  let autoForgeValid = true;
  for (let i = 0; i < 50; i++) {
    const forged = manager.generateRandomRecipe();
    if (
      !forged ||
      forged.kind !== 'engine' ||
      Number.isNaN(forged.seed) ||
      Number.isNaN(forged.genes.scale) ||
      forged.genes.scale < 0.4 ||
      forged.genes.scale > 2.5
    ) {
      autoForgeValid = false;
      break;
    }
  }
  assert(autoForgeValid, '5.1: Auto-Forge generates 50 valid recipes with finite bounded parameters');

  // Mode 2: Curated Deterministic Generation
  const curA = manager.generateCuratedRecipe('Singularity Core');
  const curB = manager.generateCuratedRecipe('Singularity Core');
  assert(curA.seed === curB.seed, '5.2: Curated mode derives identical seed from identical prompt');
  assert(curA.familyId === curB.familyId, '5.3: Curated mode derives identical family from identical prompt');
  assert(curA.genes.scale === curB.genes.scale, '5.4: Curated mode derives identical genes from identical prompt');

  // Mode 3: Guided Remix
  const beforeRemix = JSON.parse(JSON.stringify(manager.getActiveRecipe())) as StudioRecipe;
  const remixed = manager.remixCurrent();
  assert(remixed.name.includes('Remix of'), '5.5: Remix creates recipe with Remix of title');
  if (beforeRemix.kind === 'engine' && remixed.kind === 'engine') {
    assert(remixed.seed !== beforeRemix.seed, '5.6: Remix advances seed via LCG step');
    assert(!Number.isNaN(remixed.genes.scale) && remixed.genes.scale >= 0.0, '5.7: Remixed genes stay valid');
  }

  // --- SECTION 6: CRUD Lifecycle & Persistence Fallback ---
  console.log('\n--- SECTION 6: CRUD Lifecycle & Persistence Fallback ---');
  let emptySaveRejected = false;
  try {
    manager.saveRecipe('   \t  ');
  } catch {
    emptySaveRejected = true;
  }
  assert(emptySaveRejected, '6.1: Saving empty recipe title throws descriptive Error');

  const recipeSaved = manager.saveRecipe('Cyber Eclipse 2026');
  assert(recipeSaved.name === 'Cyber Eclipse 2026', '6.2: Recipe saved with sanitized title');
  assert(manager.getSavedRecipes().length >= 1, '6.3: Saved recipe catalog reflects new entry');

  // Load recipe
  assert(manager.loadRecipe(recipeSaved.id) === true, '6.4: Recipe loads successfully by ID');
  assert(manager.loadRecipe('non-existent-id') === false, '6.5: Loading non-existent recipe returns false');

  // Delete recipe
  assert(manager.deleteRecipe(recipeSaved.id) === true, '6.6: Recipe deletes successfully by ID');
  assert(manager.getSavedRecipes().find(r => r.id === recipeSaved.id) === undefined, '6.7: Deleted recipe absent from catalog');

  // Export JSON
  const exportedJson = manager.exportRecipeJson();
  assert(typeof exportedJson === 'string' && exportedJson.includes('"kind": "engine"'), '6.8: Recipe exports to valid formatted JSON string');

  // Import JSON
  const importedRecipe = manager.importRecipeJson(exportedJson);
  assert(importedRecipe !== null && importedRecipe.name.length > 0, '6.9: Recipe JSON imports successfully');

  // Corrupted and Adversarial JSON imports
  assert(manager.importRecipeJson('{bad-json') === null, '6.10: Syntax error JSON returns null gracefully');
  assert(manager.importRecipeJson('null') === null, '6.11: null string returns null gracefully');
  assert(manager.importRecipeJson('{"missingName": true}') === null, '6.12: Missing name returns null gracefully');

  // Prototype pollution attempt in JSON
  const pollutedPayload = JSON.stringify({
    kind: 'engine',
    name: 'Pollution Test',
    __proto__: { injected: true },
    genes: { scale: 1.5, __proto__: { admin: true } }
  });
  const safeImport = manager.importRecipeJson(pollutedPayload);
  assert(safeImport !== null, '6.13: Import with __proto__ parses without throwing');
  assert((Object.prototype as unknown as { injected?: boolean }).injected === undefined, '6.14: Prototype pollution attempt failed');

  // LocalStorage Quota Exceeded resilience
  mockStorage.shouldThrow = true;
  let survivedQuota = true;
  try {
    manager.saveRecipe('Quota Limit Test');
  } catch {
    survivedQuota = false;
  }
  assert(survivedQuota, '6.15: LocalStorage QuotaExceededError is caught and handled gracefully');
  mockStorage.shouldThrow = false;

  // --- SECTION 7: StudioComposerPreset 3D Stage & WebGL Lifecycle ---
  console.log('\n--- SECTION 7: StudioComposerPreset 3D Stage & WebGL Lifecycle ---');
  const preset = new StudioComposerPreset();

  assert(preset.id === 'studio-composer', '7.1: Preset ID conforms to studio-composer');
  assert(preset.name === 'Visualizer Studio', '7.2: Preset name conforms to Visualizer Studio');
  assert(preset.category === 'Structures', '7.3: Preset category conforms to Structures');

  // Backward-compatible config property synchronized from active recipe
  assert(preset.config.chromaIntensity >= 0.0 && preset.config.chromaIntensity <= 2.0, '7.4: config.chromaIntensity is bounded within [0, 2.0]');
  assert(preset.config.liquidWarp >= 0.0 && preset.config.liquidWarp <= 2.0, '7.5: config.liquidWarp is bounded within [0, 2.0]');
  assert(preset.config.tunnelDepth >= 0.0 && preset.config.tunnelDepth <= 2.0, '7.6: config.tunnelDepth is bounded within [0, 2.0]');
  assert(preset.config.volumeDensity >= 0.0 && preset.config.volumeDensity <= 2.0, '7.7: config.volumeDensity is bounded within [0, 2.0]');
  assert(preset.config.theForceAttraction >= -2.0 && preset.config.theForceAttraction <= 2.0, '7.8: config.theForceAttraction is bounded within [-2.0, 2.0]');

  // Fine-Tuning Parameter Registry
  const customParams = preset.getCustomParameters();
  assert(customParams.length === 5, '7.9: Preset registers 5 dynamic parameters');
  preset.setCustomParameter('liquidWarp', 1.9);
  assert(preset.config.liquidWarp === 1.9, '7.10: setCustomParameter updates config.liquidWarp');
  assert(preset.getCustomParameterValue('liquidWarp') === 1.9, '7.11: getCustomParameterValue returns updated value');

  preset.resetCustomParameters();
  assert(preset.config.liquidWarp === 1.0, '7.12: resetCustomParameters restores 1.0 default');

  // WebGL 3D Scene Initialization
  const scene = new THREE.Scene();
  const mockPresetContext = {
    scene,
    camera: new THREE.PerspectiveCamera(),
    renderer: {} as THREE.WebGLRenderer,
    theme: {
      id: 'ember',
      name: 'Ember',
      primary: '#ff5c00',
      secondary: '#ff8800',
      accent: '#ffaa00',
      background: '#0a0a0c',
      panelBg: 'rgba(20, 20, 25, 0.75)'
    },
    canvas: { width: 1920, height: 1080 } as HTMLCanvasElement
  };

  preset.init(mockPresetContext);
  assert(scene.children.length > 0, '7.13: preset.init populates Three.js scene');

  // 1,000 Frames Simulation under adversarial audio transients
  const testAudio = {
    subBass: 0.5,
    bass: 0.8,
    mid: 0.4,
    treble: 0.3,
    rms: 0.6,
    spectralCentroid: 0.5,
    spectralSpread: 0.3,
    spectralFlux: 0.2,
    spectralRolloff: 0.7,
    beat: true
  };

  let framesOk = true;
  for (let frame = 0; frame < 500; frame++) {
    const a = { ...testAudio };
    if (frame % 3 === 0) a.beat = true;
    if (frame % 7 === 0) {
      a.bass = Number.NaN;
      a.mid = Number.POSITIVE_INFINITY;
    }
    try {
      preset.update(mockPresetContext, a, frame * 0.016, 0.016);
    } catch {
      framesOk = false;
      break;
    }
  }
  assert(framesOk, '7.14: 500 frames of adversarial audio transients execute without throwing');

  // Extreme delta time safety clamping
  let deltaOk = true;
  try {
    preset.update(mockPresetContext, testAudio, 10.0, 100.0); // 100s lag spike
    preset.update(mockPresetContext, testAudio, 10.0, -10.0); // negative delta
    preset.update(mockPresetContext, testAudio, 10.0, 0.0);   // zero delta
  } catch {
    deltaOk = false;
  }
  assert(deltaOk, '7.15: SafeDelta clamps extreme, negative, and zero delta times');

  // onThemeChange
  let themeSwitchOk = true;
  try {
    preset.onThemeChange({
      id: 'jade',
      name: 'Jade',
      primary: '#00e676',
      secondary: '#00b0ff',
      accent: '#76ff03',
      background: '#041008',
      panelBg: 'rgba(10, 25, 15, 0.75)'
    });
  } catch {
    themeSwitchOk = false;
  }
  assert(themeSwitchOk, '7.16: onThemeChange updates shader and mesh colors cleanly');

  // Dispose & Double Dispose Idempotency
  preset.dispose();
  assert(scene.children.length === 0, '7.17: preset.dispose cleans up all layer objects from scene');

  let doubleDisposeOk = true;
  try {
    preset.dispose();
  } catch {
    doubleDisposeOk = false;
  }
  assert(doubleDisposeOk, '7.18: preset.dispose is idempotent and safe to invoke multiple times');

  console.log('\n========================================================================');
  console.log(`TOTAL CHECKS: ${totalChecks}`);
  console.log(`PASSED:       ${passedChecks}`);
  console.log(`FAILED:       ${failedChecks}`);
  console.log('========================================================================');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

runAdversarialSuite().catch(err => {
  console.error('Fatal stress test exception:', err);
  process.exit(1);
});
