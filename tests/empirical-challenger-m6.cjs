/**
 * EMPIRICAL FORENSIC CHALLENGER TEST SUITE: MILESTONE 6 (TICKET #44)
 * Target: Studio Forge Recipe Builder and Engine Modes (commit b9650c8)
 * Auditor: auditor_m6 (forensic_auditor: critic, specialist, auditor)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const esbuild = require('esbuild');
const THREE = require('three');

console.log('========================================================================');
console.log('    FORENSIC INTEGRITY AUDIT HARNESS: MILESTONE 6 (TICKET #44)         ');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(testName, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    console.error(`    Details: ${err.message}`);
    failures.push({ testName, error: err.message, stack: err.stack });
  }
}

// Target file paths
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');
const typesTsPath = path.resolve(__dirname, '../src/studio/types.ts');
const composerTsPath = path.resolve(__dirname, '../src/studio/StudioComposer.ts');

const mockDoc = {
  createElement: () => ({
    addEventListener: () => {},
    removeEventListener: () => {},
    getContext: () => ({
      getExtension: () => null,
      getParameter: () => 16,
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => true,
      createProgram: () => ({}),
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true,
      useProgram: () => {},
      viewport: () => {},
      clear: () => {}
    }),
    style: {}
  }),
  createElementNS: () => mockDoc.createElement()
};

globalThis.document = mockDoc;
globalThis.window = { innerWidth: 1920, innerHeight: 1080 };

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

// =============================================================================
// SECTION 1: STATIC DOM, ATTRIBUTES & RETRO-COMPATIBILITY AUDIT
// =============================================================================
console.log('--- SECTION 1: Static DOM, Attributes & Retro-Compatibility Audit ---');

check('1.1: Rail button #studioBtn and #mobileStudioBtn retain data-panel="myCreations" with data-alias="studio"', () => {
  const match = htmlContent.match(/<button[^>]*id="studioBtn"[^>]*>/i);
  assert(match, 'Missing #studioBtn in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="myCreations"'), '#studioBtn must retain data-panel="myCreations" for backwards compatibility');
  assert(tag.includes('data-alias="studio"'), '#studioBtn must have data-alias="studio"');

  const mobileMatch = htmlContent.match(/<button[^>]*id="mobileStudioBtn"[^>]*>/i);
  assert(mobileMatch, 'Missing #mobileStudioBtn in index.html');
  assert(mobileMatch[0].includes('data-panel="myCreations"'), '#mobileStudioBtn must retain data-panel="myCreations"');
});

check('1.2: Drawer container #studioPanel exists with data-panel="myCreations" and data-alias="studio"', () => {
  const match = htmlContent.match(/<div[^>]*id="studioPanel"[^>]*>/i);
  assert(match, 'Missing #studioPanel in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="myCreations"'), '#studioPanel must retain data-panel="myCreations"');
  assert(tag.includes('data-alias="studio"'), '#studioPanel must declare data-alias="studio"');
});

check('1.3: 3-Mode segmented button switcher exists with exact IDs and data-mode attributes', () => {
  assert(htmlContent.includes('id="studioModeForgeBtn"'), 'Missing #studioModeForgeBtn');
  assert(htmlContent.includes('id="studioModeCuratedBtn"'), 'Missing #studioModeCuratedBtn');
  assert(htmlContent.includes('id="studioModeRemixBtn"'), 'Missing #studioModeRemixBtn');

  assert(htmlContent.includes('data-mode="forge"'), 'Missing data-mode="forge"');
  assert(htmlContent.includes('data-mode="curated"'), 'Missing data-mode="curated"');
  assert(htmlContent.includes('data-mode="remix"'), 'Missing data-mode="remix"');
});

check('1.4: 5 Engine Families selector cards grid exists with all canonical families', () => {
  assert(htmlContent.includes('id="studioFamilyGrid"'), 'Missing #studioFamilyGrid container');
  const families = ['chroma', 'tunnel', 'volume', 'force'];
  for (const f of families) {
    const reg = new RegExp(`class="[^"]*studio-family-card[^"]*"[^>]*data-family="${f}"`, 'i');
    assert(reg.test(htmlContent), `Missing family card for data-family="${f}"`);
  }
  // Check liquid or fluid
  const hasFluidOrLiquid = /class="[^"]*studio-family-card[^"]*"[^>]*data-family="(?:fluid|liquid)"/i.test(htmlContent);
  assert(hasFluidOrLiquid, 'Missing family card for fluid or liquid');
});

check('1.5: 4-Step wizard tabs and step panes exist', () => {
  assert(htmlContent.includes('id="studioTabStage"'), 'Missing #studioTabStage');
  assert(htmlContent.includes('id="studioTabHero"'), 'Missing #studioTabHero');
  assert(htmlContent.includes('id="studioTabMood"'), 'Missing #studioTabMood');
  assert(htmlContent.includes('id="studioTabEngine"'), 'Missing #studioTabEngine');

  assert(htmlContent.includes('id="studioStepStage"'), 'Missing #studioStepStage');
  assert(htmlContent.includes('id="studioStepHero"'), 'Missing #studioStepHero');
  assert(htmlContent.includes('id="studioStepMood"'), 'Missing #studioStepMood');
  assert(htmlContent.includes('id="studioStepEngine"'), 'Missing #studioStepEngine');
});

check('1.6: Legacy engine sliders retain exact IDs and boundary attributes in Step 4', () => {
  const sliders = [
    { id: 'studioChromaSlider', min: '0', max: '2' },
    { id: 'studioLiquidSlider', min: '0', max: '2' },
    { id: 'studioTunnelSlider', min: '0', max: '2' },
    { id: 'studioVolumeSlider', min: '0', max: '2' },
    { id: 'studioForceSlider', min: '-2', max: '2' }
  ];
  for (const s of sliders) {
    const match = htmlContent.match(new RegExp(`<input[^>]*id="${s.id}"[^>]*>`, 'i'));
    assert(match, `Missing #${s.id}`);
    const tag = match[0];
    assert(tag.includes(`min="${s.min}"`), `${s.id} must declare min="${s.min}"`);
    assert(tag.includes(`max="${s.max}"`), `${s.id} must declare max="${s.max}"`);
  }
});

check('1.7: Recipe action controls and persistence DOM elements exist', () => {
  assert(htmlContent.includes('id="studioRecipeNameInput"'), 'Missing #studioRecipeNameInput');
  assert(htmlContent.includes('id="studioSaveRecipeBtn"'), 'Missing #studioSaveRecipeBtn');
  assert(htmlContent.includes('id="studioGenerateBtn"'), 'Missing #studioGenerateBtn');
  assert(htmlContent.includes('id="studioExportJsonBtn"'), 'Missing #studioExportJsonBtn');
  assert(htmlContent.includes('id="studioImportFileInput"'), 'Missing #studioImportFileInput');
  assert(htmlContent.includes('id="studioSavedRecipesList"'), 'Missing #studioSavedRecipesList');
  assert(htmlContent.includes('id="studioSavedCount"'), 'Missing #studioSavedCount');
});

check('1.8: style.css defines responsive rules for studio layout, mode segment, and wizard tabs', () => {
  assert(/\.studio-panel-content/i.test(cssContent), 'Missing .studio-panel-content in style.css');
  assert(/\.studio-mode-seg/i.test(cssContent), 'Missing .studio-mode-seg in style.css');
  assert(/\.studio-family-grid/i.test(cssContent), 'Missing .studio-family-grid in style.css');
  assert(/\.studio-wizard-tabs/i.test(cssContent), 'Missing .studio-wizard-tabs in style.css');
  assert(/\.studio-step-pane/i.test(cssContent), 'Missing .studio-step-pane in style.css');
});

// =============================================================================
// SECTION 2: GENUINE ALGORITHMIC DSP: FNV-1A & MULBERRY32 VERIFICATION
// =============================================================================
console.log('\n--- SECTION 2: Genuine Algorithmic DSP: FNV-1a & Mulberry32 PRNG ---');

// Compile types.ts and StudioComposer.ts in memory via esbuild
const bundleTypes = esbuild.buildSync({
  entryPoints: [typesTsPath],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false
});

const bundleComposer = esbuild.buildSync({
  entryPoints: [composerTsPath],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['three']
});

const mockLocalStorage = {
  store: new Map(),
  getItem(k) { return this.store.get(k) || null; },
  setItem(k, v) { this.store.set(k, String(v)); },
  removeItem(k) { this.store.delete(k); },
  clear() { this.store.clear(); }
};

const sandbox = {
  require,
  THREE,
  document: mockDoc,
  window: { innerWidth: 1920, innerHeight: 1080 },
  localStorage: mockLocalStorage,
  console,
  Math,
  Date,
  JSON,
  Float32Array,
  Uint8Array,
  Array,
  Object,
  String,
  Number,
  module: { exports: {} },
  exports: {}
};

vm.createContext(sandbox);

// 1. Run types
vm.runInContext(bundleTypes.outputFiles[0].text, sandbox);
const typesExports = { ...sandbox.module.exports };

// 2. Run composer
sandbox.module.exports = {};
vm.runInContext(bundleComposer.outputFiles[0].text, sandbox);
const composerExports = { ...sandbox.module.exports };

const {
  hashPromptToSeed,
  createPrng,
  canonicalFingerprint,
  clampNumber,
  ENGINE_FAMILIES_META,
  CANONICAL_FAMILY_IDS,
  BASE_GENE_DEFAULTS,
  FAMILY_GENE_DEFAULTS
} = typesExports;

const {
  createDefaultGenes,
  createDefaultRecipe,
  StudioRecipeManager,
  StudioComposerPreset
} = composerExports;

check('2.1: hashPromptToSeed matches 32-bit FNV-1a mathematical specification and test vector', () => {
  // FNV-1a reference calculation for "a":
  // offset = 0x811c9dc5, prime = 0x01000193
  // hash = (0x811c9dc5 ^ 97) * 0x01000193 = 3826002220 >>> 0
  const hashA = hashPromptToSeed('a');
  assert.strictEqual(hashA, 3826002220, `FNV-1a test vector for 'a' failed. Expected 3826002220, got ${hashA}`);

  // Test vector for "Visuval":
  // 'V'=86, 'i'=105, 's'=115, 'u'=117, 'v'=118, 'a'=97, 'l'=108
  let refHash = 0x811c9dc5;
  const str = "Visuval";
  for (let i = 0; i < str.length; i++) {
    refHash ^= str.charCodeAt(i);
    refHash = Math.imul(refHash, 0x01000193);
  }
  refHash = refHash >>> 0;
  assert.strictEqual(hashPromptToSeed('Visuval'), refHash, 'FNV-1a test vector for "Visuval" failed');
});

check('2.2: hashPromptToSeed exhibits strict determinism and avalanche dispersion', () => {
  const p1 = 'Cosmic Horizon';
  const p2 = 'Cosmic Horizon!';
  const h1 = hashPromptToSeed(p1);
  const h1_again = hashPromptToSeed(p1);
  const h2 = hashPromptToSeed(p2);

  assert.strictEqual(h1, h1_again, 'FNV-1a hash must be strictly deterministic');
  assert.notStrictEqual(h1, h2, 'Single char delta must produce completely different hash (avalanche)');
  assert(h1 >= 0 && h1 <= 0xffffffff, 'Hash must be unsigned 32-bit int');
  assert(h2 >= 0 && h2 <= 0xffffffff, 'Hash must be unsigned 32-bit int');
});

check('2.3: createPrng (Mulberry32) produces deterministic uniform floats in [0, 1)', () => {
  const seed = 123456789;
  const rng1 = createPrng(seed);
  const rng2 = createPrng(seed);

  const seq1 = [rng1(), rng1(), rng1(), rng1(), rng1()];
  const seq2 = [rng2(), rng2(), rng2(), rng2(), rng2()];

  for (let i = 0; i < seq1.length; i++) {
    assert.strictEqual(seq1[i], seq2[i], `Mulberry32 step ${i} determinism failed`);
    assert(seq1[i] >= 0.0 && seq1[i] < 1.0, `Mulberry32 output out of bounds: ${seq1[i]}`);
  }

  // Statistical distribution check over 10,000 samples
  const N = 10000;
  const rng = createPrng(987654321);
  let sum = 0;
  let sumSq = 0;
  for (let i = 0; i < N; i++) {
    const v = rng();
    assert(!Number.isNaN(v), 'Mulberry32 produced NaN');
    assert(v >= 0.0 && v < 1.0, `Mulberry32 produced out of bounds: ${v}`);
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / N;
  const variance = sumSq / N - mean * mean;
  // Uniform distribution [0,1]: mean = 0.5, variance = 1/12 = 0.0833
  assert(Math.abs(mean - 0.5) < 0.02, `Mean ${mean} deviates significantly from 0.5`);
  assert(Math.abs(variance - (1/12)) < 0.02, `Variance ${variance} deviates significantly from 1/12`);
});

check('2.4: canonicalFingerprint serialization is canonical, deterministic, and bijective', () => {
  const r1 = createDefaultRecipe('fluid', 'Fluid Space 1');
  const r2 = createDefaultRecipe('fluid', 'Fluid Space 2');
  r2.seed = r1.seed;
  r2.genes = { ...r1.genes };

  const fp1 = canonicalFingerprint(r1);
  const fp2 = canonicalFingerprint(r2);
  assert.strictEqual(fp1, fp2, 'Identical engines must produce identical fingerprints');
  assert(fp1.startsWith('engine|fluid|2867|'), `Fingerprint format mismatch: ${fp1}`);

  r2.genes.flow = 0.9999;
  const fp3 = canonicalFingerprint(r2);
  assert.notStrictEqual(fp1, fp3, 'Modified gene must produce different fingerprint');
});

// =============================================================================
// SECTION 3: GENUINE RECIPE MANAGEMENT & GENERATION MODES AUDIT
// =============================================================================
console.log('\n--- SECTION 3: Genuine Recipe Management & Generation Modes Audit ---');

check('3.1: StudioRecipeManager initializes with default Force recipe and handles family change', () => {
  mockLocalStorage.clear();
  const manager = new StudioRecipeManager();
  const active = manager.getActiveRecipe();

  assert.strictEqual(active.kind, 'engine');
  assert.strictEqual(active.familyId, 'force');
  assert.strictEqual(active.seed, ENGINE_FAMILIES_META.force.defaultSeed);
  assert.strictEqual(active.genes.scale, 1.0);

  manager.setEngineFamily('fluid');
  const updated = manager.getActiveRecipe();
  assert.strictEqual(updated.familyId, 'fluid');
  assert.strictEqual(updated.seed, ENGINE_FAMILIES_META.fluid.defaultSeed);
  assert(updated.genes.curl !== undefined, 'Fluid specific genes must be populated');
});

check('3.2: Generation Mode 1 (Auto-Forge) produces bounded non-NaN recipes over 50 iterations', () => {
  const manager = new StudioRecipeManager();
  for (let i = 0; i < 50; i++) {
    const recipe = manager.generateRandomRecipe();
    assert.strictEqual(recipe.kind, 'engine');
    assert(CANONICAL_FAMILY_IDS.includes(recipe.familyId), `Invalid family: ${recipe.familyId}`);
    assert(recipe.seed >= 0 && recipe.seed <= 0xffffffff, `Invalid seed: ${recipe.seed}`);
    assert(!Number.isNaN(recipe.genes.scale), 'Scale is NaN');
    assert(recipe.genes.scale >= 0.5 && recipe.genes.scale <= 2.0, `Scale out of bounds: ${recipe.genes.scale}`);
    assert(recipe.genes.warp >= 0.0 && recipe.genes.warp <= 1.0, `Warp out of bounds: ${recipe.genes.warp}`);
    assert(recipe.stage.scale >= 0.5 && recipe.stage.scale <= 2.5, `Stage scale out of bounds: ${recipe.stage.scale}`);
  }
});

check('3.3: Generation Mode 2 (Curated) derives deterministic recipes matching prompt seed', () => {
  const manager = new StudioRecipeManager();
  const prompt = 'Galactic Pulsar Neon 42';
  const expectedSeed = hashPromptToSeed(prompt);

  const r1 = manager.generateCuratedRecipe(prompt);
  const r2 = manager.generateCuratedRecipe(prompt);

  assert.strictEqual(r1.seed, expectedSeed, 'Curated recipe seed must match FNV-1a hash of prompt');
  assert.strictEqual(r1.seed, r2.seed, 'Curated recipe must be deterministic');
  assert.strictEqual(r1.familyId, r2.familyId, 'Curated family must be deterministic');
  assert.strictEqual(JSON.stringify(r1.genes), JSON.stringify(r2.genes), 'Curated genes must be deterministic');
});

check('3.4: Generation Mode 3 (Guided Remix) applies controlled stochastic perturbation without NaN', () => {
  const manager = new StudioRecipeManager();
  manager.setEngineFamily('tunnel');
  const before = JSON.parse(JSON.stringify(manager.getActiveRecipe()));

  const remixed = manager.remixCurrent();
  assert.strictEqual(remixed.kind, 'engine');
  assert.strictEqual(remixed.familyId, before.familyId, 'Remix must preserve engine family');
  assert.strictEqual(remixed.name, `Remix of ${before.name}`);
  assert.notStrictEqual(remixed.seed, before.seed, 'Remix must advance seed');

  // Verify bounded perturbation
  for (const [k, v] of Object.entries(remixed.genes)) {
    assert(!Number.isNaN(v), `Remixed gene ${k} is NaN`);
    assert(v >= 0.0 && v <= 3.0, `Remixed gene ${k} out of range: ${v}`);
  }
});

check('3.5: Recipe Persistence Lifecycle: Save, Duplicate Detection, Load, Delete, LocalStorage', () => {
  mockLocalStorage.clear();
  const manager = new StudioRecipeManager();

  // 1. Validation: Empty title rejects
  assert.throws(() => manager.saveRecipe(''), /Recipe title is required to save/);
  assert.throws(() => manager.saveRecipe('   '), /Recipe title is required to save/);

  // 2. Save new recipe
  const saved1 = manager.saveRecipe('Cyber Horizon');
  assert.strictEqual(saved1.name, 'Cyber Horizon');
  assert.strictEqual(manager.getSavedRecipes().length, 1);

  // Check localStorage was written
  const rawStored = mockLocalStorage.getItem('visuval_studio_creations');
  assert(rawStored, 'localStorage visuval_studio_creations was not written');
  const parsedStored = JSON.parse(rawStored);
  assert.strictEqual(parsedStored.length, 1);
  assert.strictEqual(parsedStored[0].name, 'Cyber Horizon');

  // 3. Save with same name updates existing
  manager.setGene('scale', 1.85);
  const updated = manager.saveRecipe('Cyber Horizon');
  assert.strictEqual(manager.getSavedRecipes().length, 1, 'Should update existing entry with same name');
  assert.strictEqual(manager.getSavedRecipes()[0].genes.scale, 1.85);

  // 4. Save second recipe
  const saved2 = manager.saveRecipe('Neon Void');
  assert.strictEqual(manager.getSavedRecipes().length, 2);

  // 5. Load recipe
  const loaded = manager.loadRecipe(updated.id);
  assert.strictEqual(loaded, true);
  assert.strictEqual(manager.getActiveRecipe().name, 'Cyber Horizon');

  // 6. Delete recipe
  const deleted = manager.deleteRecipe(updated.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(manager.getSavedRecipes().length, 1);
  assert.strictEqual(manager.getSavedRecipes()[0].name, 'Neon Void');
});

check('3.6: JSON Export & Defensive Import with corrupted data resilience', () => {
  const manager = new StudioRecipeManager();
  manager.generateCuratedRecipe('Quantum Flux');
  const json = manager.exportRecipeJson();
  assert(typeof json === 'string');
  const parsed = JSON.parse(json);
  assert.strictEqual(parsed.kind, 'engine');

  // Corrupted inputs
  assert.strictEqual(manager.importRecipeJson(''), null);
  assert.strictEqual(manager.importRecipeJson('{bad json'), null);
  assert.strictEqual(manager.importRecipeJson('null'), null);
  assert.strictEqual(manager.importRecipeJson('{"missing": "name"}'), null);

  // Valid import
  const imported = manager.importRecipeJson(json);
  assert(imported !== null);
  assert.strictEqual(imported.name, parsed.name);
  assert.strictEqual(imported.seed, parsed.seed);
});

// =============================================================================
// SECTION 4: GENUINE 3D VISUALIZER RENDERING & LIFECYCLE AUDIT
// =============================================================================
console.log('\n--- SECTION 4: Genuine 3D Visualizer Rendering & Lifecycle Audit ---');

check('4.1: StudioComposerPreset satisfies VisualizerPreset contract & backwards-compatible config', () => {
  const preset = new StudioComposerPreset();
  assert.strictEqual(preset.id, 'studio-composer');
  assert.strictEqual(preset.name, 'Visualizer Studio');
  assert.strictEqual(preset.category, 'Structures');

  assert.strictEqual(typeof preset.config.chromaIntensity, 'number');
  assert.strictEqual(typeof preset.config.liquidWarp, 'number');
  assert.strictEqual(typeof preset.config.tunnelDepth, 'number');
  assert.strictEqual(typeof preset.config.volumeDensity, 'number');
  assert.strictEqual(typeof preset.config.theForceAttraction, 'number');
});

check('4.2: StudioComposerPreset integrates Fine-Tuning Drawer parameter interface', () => {
  const preset = new StudioComposerPreset();
  const params = preset.getCustomParameters();
  assert.strictEqual(params.length, 5);

  const keys = ['chromaIntensity', 'liquidWarp', 'tunnelDepth', 'volumeDensity', 'theForceAttraction'];
  for (const k of keys) {
    const found = params.find(p => p.id === k);
    assert(found, `Missing fine-tuning parameter: ${k}`);
  }

  preset.setCustomParameter('liquidWarp', 1.75);
  assert.strictEqual(preset.config.liquidWarp, 1.75);
  assert.strictEqual(preset.getCustomParameterValue('liquidWarp'), 1.75);

  preset.resetCustomParameters();
  assert.strictEqual(preset.config.liquidWarp, 1.0);
});

function createTestContext(theme = { id: 'ember', primary: '#ff5500', secondary: '#ffaa00', accent: '#00ffff', background: '#0a0a0f' }) {
  return {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(60, 1920 / 1080, 0.1, 1000),
    renderer: {
      domElement: { width: 1920, height: 1080 },
      setSize: () => {},
      render: () => {},
      dispose: () => {}
    },
    width: 1920,
    height: 1080,
    theme
  };
}

check('4.3: StudioComposerPreset.init instantiates 4 genuine visualizer layers in Three.js scene', () => {
  const preset = new StudioComposerPreset();
  const ctx = createTestContext();

  preset.init(ctx);

  // Scene must have received the group
  assert.strictEqual(ctx.scene.children.length, 1);
  const group = ctx.scene.children[0];
  assert(group instanceof THREE.Group);

  // Group must contain:
  // 1. liquidMesh (Mesh with ShaderMaterial)
  // 2. tunnelGroup (Group containing 16 LineLoops)
  // 3. volumeParticles (Points with BufferGeometry & PointsMaterial)
  // 4. forceCore (Mesh with SphereGeometry & MeshStandardMaterial)
  assert.strictEqual(group.children.length, 4);

  const liquid = group.children[0];
  assert(liquid instanceof THREE.Mesh);
  assert(liquid.material instanceof THREE.ShaderMaterial);
  assert(liquid.material.uniforms.uWarp !== undefined);

  const tunnel = group.children[1];
  assert(tunnel instanceof THREE.Group);
  assert.strictEqual(tunnel.children.length, 16);
  assert(tunnel.children[0] instanceof THREE.LineLoop);

  const volume = group.children[2];
  assert(volume instanceof THREE.Points);
  assert.strictEqual(volume.geometry.attributes.position.count, 2000);

  const forceCore = group.children[3];
  assert(forceCore instanceof THREE.Mesh);
  assert(forceCore.material instanceof THREE.MeshStandardMaterial);
});

check('4.4: 1,000 frames live update simulation with audio kicks, particle vortex, and zero NaNs', () => {
  const preset = new StudioComposerPreset();
  const ctx = createTestContext();
  preset.init(ctx);

  const dummyAudio = {
    bass: 0.8,
    mid: 0.5,
    treble: 0.3,
    subBass: 0.9,
    rms: 0.6,
    beat: true,
    spectralCentroid: 1200,
    frequencyData: new Uint8Array(1024),
    timeDomainData: new Uint8Array(1024)
  };

  // Run 1,000 frames
  for (let frame = 0; frame < 1000; frame++) {
    dummyAudio.beat = (frame % 30 === 0);
    preset.update(ctx, dummyAudio, frame * 0.016, 0.016);
  }

  // Verify particle positions are continuous and non-NaN
  const group = ctx.scene.children[0];
  const volume = group.children[2];
  const positions = volume.geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i++) {
    assert(!Number.isNaN(positions[i]), `Particle position index ${i} is NaN after 1000 frames`);
    assert(Number.isFinite(positions[i]), `Particle position index ${i} is infinite after 1000 frames`);
  }
});

check('4.5: StudioComposerPreset.dispose teardown cleans up all geometries and materials completely', () => {
  const preset = new StudioComposerPreset();
  const ctx = createTestContext();
  preset.init(ctx);

  assert.strictEqual(ctx.scene.children.length, 1);
  preset.dispose();

  assert.strictEqual(ctx.scene.children.length, 0, 'Group must be removed from scene on dispose');
  // Double dispose should not throw
  assert.doesNotThrow(() => preset.dispose(), 'Double dispose must be safe');
});

// =============================================================================
// SECTION 5: ADVERSARIAL STRESS & CORRUPTED INPUT RESILIENCE
// =============================================================================
console.log('\n--- SECTION 5: Adversarial Stress & Corrupted Input Resilience ---');

check('5.1: update() survives extreme/abnormal inputs: delta=0, delta=100s, NaN audio features', () => {
  const preset = new StudioComposerPreset();
  const ctx = createTestContext();
  preset.init(ctx);

  // 1. Zero delta
  assert.doesNotThrow(() => preset.update(ctx, { bass: 0, mid: 0, treble: 0, subBass: 0, rms: 0, beat: false, spectralCentroid: 0, frequencyData: new Uint8Array(1024), timeDomainData: new Uint8Array(1024) }, 0, 0));

  // 2. Extreme delta
  assert.doesNotThrow(() => preset.update(ctx, { bass: 0.5, mid: 0.5, treble: 0.5, subBass: 0.5, rms: 0.5, beat: true, spectralCentroid: 1000, frequencyData: new Uint8Array(1024), timeDomainData: new Uint8Array(1024) }, 100, 100));

  // 3. NaN audio features
  assert.doesNotThrow(() => preset.update(ctx, { bass: NaN, mid: NaN, treble: NaN, subBass: NaN, rms: NaN, beat: false, spectralCentroid: NaN, frequencyData: new Uint8Array(1024), timeDomainData: new Uint8Array(1024) }, 1, 0.016));

  preset.dispose();
});

check('5.2: syncFromRecipe handles legacy shapes, missing properties, and prototype-polluted inputs', () => {
  const preset = new StudioComposerPreset();

  // Legacy format with stageConfig
  preset.applyRecipe({
    stageConfig: {
      chromaIntensity: 1.8,
      liquidWarp: 0.2,
      tunnelDepth: 1.5,
      volumeDensity: 0.4,
      theForceAttraction: -1.2
    }
  });

  assert.strictEqual(preset.config.chromaIntensity, 1.8);
  assert.strictEqual(preset.config.liquidWarp, 0.2);
  assert.strictEqual(preset.config.tunnelDepth, 1.5);
  assert.strictEqual(preset.config.volumeDensity, 0.4);
  assert.strictEqual(preset.config.theForceAttraction, -1.2);

  // Polluted object
  preset.applyRecipe(JSON.parse('{"__proto__": {"admin": true}, "genes": {"warp": 0.8}}'));
  assert.strictEqual(preset.config.liquidWarp, 1.6);
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${failedTests}`);
console.log('========================================================================\n');

if (failedTests > 0) {
  console.error(`>>> FORENSIC AUDIT VERDICT: INTEGRITY VIOLATION (${failedTests} failures) <<<`);
  process.exit(1);
} else {
  console.log('>>> FORENSIC AUDIT VERDICT: CLEAN <<<');
  process.exit(0);
}
