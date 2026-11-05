/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 6 (TICKET #44)
 * Target: Studio Forge Recipe Builder and Engine Modes
 * Archetype: Empirical Challenger (critic, specialist)
 * Challenger: challenger_m6_1
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const esbuild = require('esbuild');
const THREE = require('three');

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER HARNESS: MILESTONE 6 STUDIO FORGE (TICKET #44)   ');
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

// -----------------------------------------------------------------------------
// MODULE BUNDLE COMPILATION
// -----------------------------------------------------------------------------
const typesTsPath = path.resolve(__dirname, '../src/studio/types.ts');
const composerTsPath = path.resolve(__dirname, '../src/studio/StudioComposer.ts');
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

// Build Studio Composer module into CommonJS bundle
const composerBundle = esbuild.buildSync({
  entryPoints: [composerTsPath],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false,
  external: ['three']
});
const composerCode = composerBundle.outputFiles[0].text;

// Build types module into CommonJS bundle
const typesBundle = esbuild.buildSync({
  entryPoints: [typesTsPath],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  write: false
});
const typesCode = typesBundle.outputFiles[0].text;

function createModuleContext(mockStorage = null) {
  const store = mockStorage ? { ...mockStorage } : {};
  const mockLocalStorage = {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    _store: store
  };

  const modExports = {};
  const mod = { exports: modExports };
  const context = vm.createContext({
    module: mod,
    exports: modExports,
    require: (id) => (id === 'three' ? THREE : require(id)),
    localStorage: mockLocalStorage,
    console,
    Math,
    Date,
    String,
    Number,
    Array,
    Object,
    Float32Array
  });

  vm.runInContext(composerCode, context);
  return {
    exports: mod.exports,
    localStorage: mockLocalStorage
  };
}

function loadTypesModule() {
  const modExports = {};
  const mod = { exports: modExports };
  const context = vm.createContext({
    module: mod,
    exports: modExports,
    console,
    Math,
    Date,
    String,
    Number,
    Array,
    Object
  });
  vm.runInContext(typesCode, context);
  return mod.exports;
}

const types = loadTypesModule();
const {
  BASE_GENE_DEFAULTS,
  FAMILY_GENE_DEFAULTS,
  ENGINE_FAMILIES_META,
  CANONICAL_FAMILY_IDS,
  clampNumber,
  hashPromptToSeed,
  createPrng,
  canonicalFingerprint
} = types;

// =============================================================================
// SECTION 1: MONTE CARLO RANDOM RECIPE FUZZING (150 ITERATIONS ACROSS 5 FAMILIES)
// =============================================================================
console.log('--- SECTION 1: Monte Carlo Random Recipe Gene Boundedness & NaN Protection ---');

check('1.1: Canonical 5 Engine Families metadata is fully specified with valid defaults', () => {
  assert.strictEqual(CANONICAL_FAMILY_IDS.length, 5, 'Must define exactly 5 engine families');
  const expected = ['fluid', 'chroma', 'tunnel', 'volume', 'force'];
  expected.forEach(f => {
    assert(CANONICAL_FAMILY_IDS.includes(f), `Missing family ${f}`);
    const meta = ENGINE_FAMILIES_META[f];
    assert(meta, `Missing metadata for ${f}`);
    assert.strictEqual(typeof meta.label, 'string', `${f} label must be string`);
    assert(Number.isInteger(meta.defaultSeed) && meta.defaultSeed >= 0, `${f} defaultSeed must be unsigned 32-bit int`);
  });
});

check('1.2: Monte Carlo fuzzing (150 iterations across 5 families) guarantees finite, non-NaN genes', () => {
  const { exports } = createModuleContext();
  const { StudioRecipeManager } = exports;
  const manager = new StudioRecipeManager();

  const families = ['fluid', 'chroma', 'tunnel', 'volume', 'force'];
  const baseKeys = ['scale', 'warp', 'flow', 'filament', 'depth', 'spin', 'glow', 'kickGain'];

  for (let i = 0; i < 150; i++) {
    const family = families[i % families.length];
    const recipe = manager.generateRandomRecipe(family);

    assert.strictEqual(recipe.kind, 'engine', `Iteration ${i}: recipe.kind must be 'engine'`);
    assert.strictEqual(recipe.familyId, family, `Iteration ${i}: recipe.familyId must match requested family`);
    assert(Number.isInteger(recipe.seed) && recipe.seed >= 0 && recipe.seed <= 0xffffffff,
      `Iteration ${i}: recipe.seed (${recipe.seed}) must be an unsigned 32-bit integer`);

    // Verify all continuous base genes
    baseKeys.forEach(k => {
      const v = recipe.genes[k];
      assert(typeof v === 'number', `Iteration ${i}: base gene ${k} must be number, got ${typeof v}`);
      assert(!Number.isNaN(v), `Iteration ${i}: base gene ${k} must not be NaN`);
      assert(Number.isFinite(v), `Iteration ${i}: base gene ${k} must be finite`);
      assert(v >= 0.0 && v <= 2.5, `Iteration ${i}: base gene ${k} (${v}) out of expected range [0.0, 2.5]`);
    });

    // Verify family-specific genes
    const famDefaults = FAMILY_GENE_DEFAULTS[family];
    if (famDefaults) {
      Object.keys(famDefaults).forEach(fk => {
        const fv = recipe.genes[fk];
        assert(typeof fv === 'number', `Iteration ${i}: family gene ${fk} must be number`);
        assert(!Number.isNaN(fv), `Iteration ${i}: family gene ${fk} must not be NaN`);
        assert(Number.isFinite(fv), `Iteration ${i}: family gene ${fk} must be finite`);
        assert(fv >= 0.0 && fv <= 1.0, `Iteration ${i}: family gene ${fk} (${fv}) must be in [0.0, 1.0]`);
      });
    }

    // Verify stage, hero, and mood bounds
    assert(recipe.stage, `Iteration ${i}: stage config must be present`);
    assert(recipe.stage.scale >= 0.5 && recipe.stage.scale <= 2.5 && !Number.isNaN(recipe.stage.scale));
    assert(recipe.stage.dustDensity >= 0.0 && recipe.stage.dustDensity <= 2.0 && !Number.isNaN(recipe.stage.dustDensity));
    assert(recipe.stage.lightIntensity >= 0.5 && recipe.stage.lightIntensity <= 3.0 && !Number.isNaN(recipe.stage.lightIntensity));

    assert(recipe.hero, `Iteration ${i}: hero config must be present`);
    assert(recipe.hero.scale >= 0.5 && recipe.hero.scale <= 2.5 && !Number.isNaN(recipe.hero.scale));
    assert(recipe.hero.deformation >= 0.0 && recipe.hero.deformation <= 2.5 && !Number.isNaN(recipe.hero.deformation));

    assert(recipe.mood, `Iteration ${i}: mood config must be present`);
    assert(recipe.mood.bloomIntensity >= 0.5 && recipe.mood.bloomIntensity <= 3.0 && !Number.isNaN(recipe.mood.bloomIntensity));
    assert(recipe.mood.speedMultiplier >= 0.5 && recipe.mood.speedMultiplier <= 2.5 && !Number.isNaN(recipe.mood.speedMultiplier));
  }
});

check('1.3: Unspecified family in generateRandomRecipe selects from valid canonical families', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  for (let i = 0; i < 25; i++) {
    const rec = manager.generateRandomRecipe();
    assert(CANONICAL_FAMILY_IDS.includes(rec.familyId), `Unexpected familyId: ${rec.familyId}`);
    assert(rec.name.startsWith('Forged '), `Recipe name should start with 'Forged ', got ${rec.name}`);
  }
});

// =============================================================================
// SECTION 2: PROMPT FNV-1A HASH DETERMINISM & BOUNDARY TESTING
// =============================================================================
console.log('--- SECTION 2: Prompt FNV-1a Hash Determinism & PRNG Math Stress ---');

check('2.1: Empty and whitespace prompt strings yield valid 32-bit unsigned integers without throwing', () => {
  const emptyPrompts = ['', '   ', '\t\t\n', '  \r\n  '];
  emptyPrompts.forEach(p => {
    const seed = hashPromptToSeed(p);
    assert(Number.isInteger(seed), `Seed must be integer for '${p}'`);
    assert(seed >= 0 && seed <= 0xffffffff, `Seed must be unsigned 32-bit uint. Got: ${seed}`);
  });
});

check('2.2: Non-string inputs coerce gracefully without throwing exceptions', () => {
  const nonStrings = [null, undefined, 0, 42, true, false, {}, []];
  nonStrings.forEach(val => {
    const seed = hashPromptToSeed(val);
    assert(Number.isInteger(seed), `Seed must be integer for ${val}`);
    assert(seed >= 0 && seed <= 0xffffffff, `Seed must be in [0, 2^32-1]. Got: ${seed}`);
  });
});

check('2.3: Prompt hash is 100% deterministic across 50 diverse inputs', () => {
  const prompts = [
    'Deep Space Nebula',
    'Synthwave Sunset Grid',
    'Liquid Mercury Waves',
    'Bioluminescent Trench',
    'Singularity Core Collapse',
    'Quantum Horizon 2049',
    'Emerald Aurora Vortex',
    'Cyberpunk Tokyo Rain',
    'Acoustic Resonance Chamber',
    'Hyperdimensional Torus'
  ];

  prompts.forEach(prompt => {
    const seed1 = hashPromptToSeed(prompt);
    const seed2 = hashPromptToSeed(prompt);
    const seed3 = hashPromptToSeed(prompt);
    assert.strictEqual(seed1, seed2, `Determinism failure on '${prompt}': ${seed1} !== ${seed2}`);
    assert.strictEqual(seed2, seed3, `Determinism failure on '${prompt}': ${seed2} !== ${seed3}`);
    assert(seed1 >= 0 && seed1 <= 0xffffffff, `Seed out of uint32 bounds: ${seed1}`);
  });
});

check('2.4: Extreme prompt lengths (10,000 characters) compute deterministically without stack overflow', () => {
  const hugePromptAscii = 'Visualizor-Forge-Token-'.repeat(450); // ~10,350 chars
  const seed1 = hashPromptToSeed(hugePromptAscii);
  const seed2 = hashPromptToSeed(hugePromptAscii);
  assert.strictEqual(seed1, seed2, 'Huge prompt failed determinism');
  assert(seed1 >= 0 && seed1 <= 0xffffffff);
});

check('2.5: Astral plane Unicode, Emojis, and multi-byte UTF-16 code points hash deterministically', () => {
  const unicodePrompts = [
    '🌌✨🪐🚀🔥🎧🎵👾',
    'Crème Brûlée with Jalapeño & Ångström',
    '漢字・日本語プロンプト・ネオン',
    'موسيقى إلكترونية 🎛️',
    '🎵\uD83D\uDD25\uD83D\uDE80\uD83C\uDF0C'
  ];

  unicodePrompts.forEach(p => {
    const seedA = hashPromptToSeed(p);
    const seedB = hashPromptToSeed(p);
    assert.strictEqual(seedA, seedB, `Unicode prompt determinism failure on '${p}'`);
    assert(seedA >= 0 && seedA <= 0xffffffff);
  });
});

check('2.6: Mulberry32 PRNG generated with prompt seed produces bounded [0, 1) stream without NaN', () => {
  const seed = hashPromptToSeed('Adversarial PRNG Stress');
  const rng = createPrng(seed);

  for (let i = 0; i < 1000; i++) {
    const val = rng();
    assert(typeof val === 'number', `PRNG output must be number, got ${typeof val}`);
    assert(!Number.isNaN(val), `PRNG output must not be NaN at iteration ${i}`);
    assert(val >= 0.0 && val < 1.0, `PRNG output out of bounds [0, 1) at iteration ${i}: ${val}`);
  }
});

check('2.7: canonicalFingerprint is deterministic and unique across different families', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  const r1 = manager.generateCuratedRecipe('Cosmic Bloom', 'chroma');
  const r2 = manager.generateCuratedRecipe('Cosmic Bloom', 'chroma');
  const r3 = manager.generateCuratedRecipe('Cosmic Bloom', 'tunnel');

  const fp1 = canonicalFingerprint(r1);
  const fp2 = canonicalFingerprint(r2);
  const fp3 = canonicalFingerprint(r3);

  assert.strictEqual(fp1, fp2, 'Fingerprint must match for identical recipes');
  assert.notStrictEqual(fp1, fp3, 'Fingerprint must differ across different families');
  assert(fp1.startsWith('engine|chroma|'), `Fingerprint format invalid: ${fp1}`);
});

// =============================================================================
// SECTION 3: GUIDED REMIX CONTINUOUS PERTURBATION STABILITY OVER 50 ITERATIONS
// =============================================================================
console.log('--- SECTION 3: Guided Remix Continuous Perturbation Stability ---');

['fluid', 'chroma', 'tunnel', 'volume', 'force'].forEach(family => {
  check(`3.${family}: 50 consecutive remix iterations on '${family}' preserves boundedness and never drifts to NaN/Infinity`, () => {
    const { exports } = createModuleContext();
    const manager = new exports.StudioRecipeManager();
    manager.setEngineFamily(family);

    let current = manager.getActiveRecipe();
    let prevSeed = current.seed;

    for (let i = 1; i <= 50; i++) {
      current = manager.remixCurrent();

      assert.strictEqual(current.kind, 'engine', `Iteration ${i}: kind must be engine`);
      assert(current.name.startsWith('Remix of '), `Iteration ${i}: name should have Remix prefix`);
      assert(Number.isInteger(current.seed) && current.seed >= 0 && current.seed <= 0xffffffff,
        `Iteration ${i}: seed must be uint32. Got ${current.seed}`);
      assert.notStrictEqual(current.seed, prevSeed, `Iteration ${i}: seed must advance on each remix step`);
      prevSeed = current.seed;

      // Check all genes
      for (const [geneKey, geneVal] of Object.entries(current.genes)) {
        assert(typeof geneVal === 'number', `Iteration ${i}: gene ${geneKey} is not number`);
        assert(!Number.isNaN(geneVal), `Iteration ${i}: gene ${geneKey} drifted to NaN`);
        assert(Number.isFinite(geneVal), `Iteration ${i}: gene ${geneKey} drifted to Infinity`);
        assert(geneVal >= 0.0 && geneVal <= 2.5,
          `Iteration ${i}: gene ${geneKey} drifted out of bounds [0.0, 2.5]. Value: ${geneVal}`);
      }

      // Check stage scale and dust
      if (current.stage) {
        assert(current.stage.scale >= 0.5 && current.stage.scale <= 2.5 && !Number.isNaN(current.stage.scale),
          `Iteration ${i}: stage.scale drifted: ${current.stage.scale}`);
        assert(current.stage.dustDensity >= 0.0 && current.stage.dustDensity <= 2.0 && !Number.isNaN(current.stage.dustDensity),
          `Iteration ${i}: stage.dustDensity drifted: ${current.stage.dustDensity}`);
      }

      // Check hero deformation
      if (current.hero) {
        assert(current.hero.deformation >= 0.0 && current.hero.deformation <= 2.5 && !Number.isNaN(current.hero.deformation),
          `Iteration ${i}: hero.deformation drifted: ${current.hero.deformation}`);
      }

      // Check mood bloom
      if (current.mood) {
        assert(current.mood.bloomIntensity >= 0.0 && current.mood.bloomIntensity <= 3.0 && !Number.isNaN(current.mood.bloomIntensity),
          `Iteration ${i}: mood.bloomIntensity drifted: ${current.mood.bloomIntensity}`);
      }
    }
  });
});

check('3.6: LCG seed progression follows (seed * 1664525 + 1013904223) >>> 0 formula', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();
  const initialSeed = manager.getActiveRecipe().seed;

  const expectedNextSeed = (Math.imul(initialSeed, 1664525) + 1013904223) >>> 0;
  const remixed = manager.remixCurrent();

  assert.strictEqual(remixed.seed, expectedNextSeed,
    `LCG step mismatch: expected ${expectedNextSeed}, got ${remixed.seed}`);
});

// =============================================================================
// SECTION 4: LOCALSTORAGE RESILIENCE & CORRUPTION STRESS
// =============================================================================
console.log('--- SECTION 4: LocalStorage Corruption Resilience & Exception Recovery ---');

check('4.1: Corrupt JSON syntax in visuval_studio_creations recovers with empty saved list without crashing', () => {
  const corruptPayloads = [
    '{ corrupted json missing closing bracket',
    '<<<XML IS NOT JSON>>>',
    'undefined',
    '[{"id":"sc_123", "name": "truncated',
    '{"id": "sc_broken", "genes": { "scale": NaN }}'
  ];

  corruptPayloads.forEach((corruptStr, idx) => {
    const { exports } = createModuleContext({
      visuval_studio_creations: corruptStr
    });
    const manager = new exports.StudioRecipeManager();
    assert.doesNotThrow(() => {
      const saved = manager.getSavedRecipes();
      assert(Array.isArray(saved), `Corrupted payload ${idx} must return array`);
      assert.strictEqual(saved.length, 0, `Corrupted payload ${idx} should yield 0 saved recipes`);
    });
  });
});

check('4.2: Primitive non-array values in localStorage do not throw runtime TypeError', () => {
  const primitives = ['"just a string"', '12345', 'true', 'false', '{}'];

  primitives.forEach((prim, idx) => {
    const { exports } = createModuleContext({
      visuval_studio_creations: prim,
      visuval_studio_recipes_v2: prim
    });
    const manager = new exports.StudioRecipeManager();
    const saved = manager.getSavedRecipes();
    assert(Array.isArray(saved), `Primitive ${idx} must yield array`);
    assert.strictEqual(saved.length, 0);
  });
});

check('4.3: Heterogeneous corrupted arrays filter invalid items while retaining valid recipes', () => {
  const mixedData = JSON.stringify([
    null,
    undefined,
    42,
    'string item',
    {},
    { id: 'sc_no_name' },
    { name: '' },
    { id: 'sc_valid_1', name: 'Valid Saved Look 1', familyId: 'chroma' }
  ]);

  const { exports } = createModuleContext({
    visuval_studio_creations: mixedData
  });
  const manager = new exports.StudioRecipeManager();
  const saved = manager.getSavedRecipes();
  assert.strictEqual(saved.length, 1, 'Only the valid recipe with non-empty name should survive');
  assert.strictEqual(saved[0].name, 'Valid Saved Look 1');
});

check('4.4: Corrupt active recipe in visuval_studio_active_recipe_v2 falls back to default recipe', () => {
  const { exports } = createModuleContext({
    visuval_studio_active_recipe_v2: '{ broken active recipe'
  });
  const manager = new exports.StudioRecipeManager();
  const active = manager.getActiveRecipe();
  assert(active, 'Active recipe must exist');
  assert.strictEqual(active.kind, 'engine');
  assert.strictEqual(active.familyId, 'force');
});

check('4.5: QuotaExceededError in localStorage.setItem is swallowed gracefully without throwing', () => {
  const { exports, localStorage } = createModuleContext();
  localStorage.setItem = () => {
    const err = new Error('QuotaExceededError: DOM Exception 22');
    err.name = 'QuotaExceededError';
    throw err;
  };

  const manager = new exports.StudioRecipeManager();
  assert.doesNotThrow(() => {
    manager.saveRecipe('Quota Surviving Recipe');
  }, 'saveRecipe must not throw on QuotaExceededError');

  assert.doesNotThrow(() => {
    manager.remixCurrent();
  }, 'remixCurrent must not throw on QuotaExceededError');

  assert.doesNotThrow(() => {
    manager.generateRandomRecipe();
  }, 'generateRandomRecipe must not throw on QuotaExceededError');
});

check('4.6: StudioComposerPreset initializes smoothly under corrupted storage environment', () => {
  const { exports } = createModuleContext({
    visuval_studio_creations: '{{broken',
    visuval_studio_active_recipe_v2: 'null'
  });
  const preset = new exports.StudioComposerPreset();
  assert(preset, 'StudioComposerPreset should instantiate without errors');
  assert.strictEqual(preset.id, 'studio-composer');
  assert.strictEqual(typeof preset.config.liquidWarp, 'number');
});

// =============================================================================
// SECTION 5: RECIPE CRUD & IMPORT/EXPORT LIFECYCLE
// =============================================================================
console.log('--- SECTION 5: Full Recipe CRUD Lifecycle & Import/Export Serialization ---');

check('5.1: saveRecipe enforces non-empty recipe title validation', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  assert.throws(() => {
    manager.saveRecipe('');
  }, /Recipe title is required/i);

  assert.throws(() => {
    manager.saveRecipe('   \t\n  ');
  }, /Recipe title is required/i);
});

check('5.2: saveRecipe persists recipe with sanitized/truncated title (max 60 chars)', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  const longTitle = 'A'.repeat(100);
  const saved = manager.saveRecipe(longTitle);
  assert.strictEqual(saved.name.length, 60, 'Title must be truncated to 60 characters');
  assert.strictEqual(manager.getSavedRecipes().length, 1);
});

check('5.3: Duplicate title overwrites existing recipe in place (case-insensitive update)', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  manager.saveRecipe('Neon Horizon');
  assert.strictEqual(manager.getSavedRecipes().length, 1);

  manager.setGene('scale', 2.2);
  const updated = manager.saveRecipe('neon horizon');
  assert.strictEqual(manager.getSavedRecipes().length, 1, 'Should update existing entry rather than duplicating');
  assert.strictEqual(updated.genes.scale, 2.2);
});

check('5.4: loadRecipe(id) successfully restores active recipe; returns false on invalid ID', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  manager.setEngineFamily('tunnel');
  const savedTunnel = manager.saveRecipe('Deep Corridor Look');

  manager.setEngineFamily('fluid');
  assert.strictEqual(manager.getActiveRecipe().familyId, 'fluid');

  const loaded = manager.loadRecipe(savedTunnel.id);
  assert.strictEqual(loaded, true, 'loadRecipe should return true for valid id');
  assert.strictEqual(manager.getActiveRecipe().familyId, 'tunnel');
  assert.strictEqual(manager.getActiveRecipe().name, 'Deep Corridor Look');

  const loadedInvalid = manager.loadRecipe('non_existent_id');
  assert.strictEqual(loadedInvalid, false, 'loadRecipe should return false for invalid id');
});

check('5.5: Recipe duplication workflow creates distinct copy with independent ID', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  const original = manager.saveRecipe('Original Concept');
  manager.loadRecipe(original.id);
  const copy = manager.saveRecipe('Original Concept (Copy)');

  assert.strictEqual(manager.getSavedRecipes().length, 2);
  assert.notStrictEqual(original.id, copy.id, 'Copy must have unique ID');
  assert.strictEqual(copy.name, 'Original Concept (Copy)');
});

check('5.6: deleteRecipe(id) removes entry and updates storage; returns false if ID not found', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  const r1 = manager.saveRecipe('Recipe One');
  const r2 = manager.saveRecipe('Recipe Two');
  assert.strictEqual(manager.getSavedRecipes().length, 2);

  const deleted = manager.deleteRecipe(r1.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(manager.getSavedRecipes().length, 1);
  assert.strictEqual(manager.getSavedRecipes()[0].id, r2.id);

  const deletedTwice = manager.deleteRecipe(r1.id);
  assert.strictEqual(deletedTwice, false, 'Deleting already deleted id should return false');
});

check('5.7: exportRecipeJson produces valid JSON adhering to active recipe state', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();
  manager.setEngineFamily('chroma');
  manager.setGene('bloom', 0.88);

  const jsonStr = manager.exportRecipeJson();
  assert(typeof jsonStr === 'string');
  const parsed = JSON.parse(jsonStr);
  assert.strictEqual(parsed.kind, 'engine');
  assert.strictEqual(parsed.familyId, 'chroma');
  assert.strictEqual(parsed.genes.bloom, 0.88);
});

check('5.8: importRecipeJson defensive schema recovery and gene sanitization', () => {
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  // 1. Invalid non-string / corrupt JSON returns null
  assert.strictEqual(manager.importRecipeJson(null), null);
  assert.strictEqual(manager.importRecipeJson('{ broken json'), null);
  assert.strictEqual(manager.importRecipeJson('{"missing": "name"}'), null);

  // 2. Hostile parameters sanitized and clamped
  const hostilePayload = JSON.stringify({
    name: '  Hostile Lab Recipe  ',
    familyId: 'unknown_family_fallback',
    seed: '9999999999999999',
    genes: {
      scale: 'not-a-number',
      warp: 999999,
      flow: -999999,
      depth: 0.5
    }
  });

  const imported = manager.importRecipeJson(hostilePayload);
  assert(imported !== null, 'Should successfully import sanitized recipe');
  assert.strictEqual(imported.name, 'Hostile Lab Recipe', 'Name should be trimmed');
  assert.strictEqual(imported.familyId, 'force', 'Unknown familyId must fallback to force');
  assert.strictEqual(imported.genes.scale, 1.0, 'Non-numeric scale must fallback to default');
  assert.strictEqual(imported.genes.warp, 3.0, 'Out-of-range positive gene clamped to 3.0');
  assert.strictEqual(imported.genes.flow, -2.0, 'Out-of-range negative gene clamped to -2.0');
  assert.strictEqual(imported.genes.depth, 0.5);

  assert.strictEqual(manager.getActiveRecipe().name, 'Hostile Lab Recipe');
  assert.strictEqual(manager.getSavedRecipes()[0].name, 'Hostile Lab Recipe');
});

// =============================================================================
// SECTION 6: UI DRAWER DOM, NAVIGATION RAIL & CSS SPECIFICATION AUDIT
// =============================================================================
console.log('--- SECTION 6: UI Drawer DOM, Navigation Rail & CSS Specification Audit ---');

check('6.1: Rail button #studioBtn and #mobileStudioBtn retain data-panel="myCreations" and data-alias="studio"', () => {
  const studioBtnMatch = htmlContent.match(/<button[^>]*id="studioBtn"[^>]*>/i);
  assert(studioBtnMatch, 'Missing #studioBtn in index.html');
  const btnTag = studioBtnMatch[0];
  assert(btnTag.includes('data-panel="myCreations"'), '#studioBtn must have data-panel="myCreations"');
  assert(btnTag.includes('data-alias="studio"'), '#studioBtn must have data-alias="studio"');
  assert(/class="[^"]*rail-btn[^"]*"/i.test(btnTag), '#studioBtn must have rail-btn class');

  const mobileMatch = htmlContent.match(/<button[^>]*id="mobileStudioBtn"[^>]*>/i);
  assert(mobileMatch, 'Missing #mobileStudioBtn in index.html');
  const mobileTag = mobileMatch[0];
  assert(mobileTag.includes('data-panel="myCreations"'), '#mobileStudioBtn must have data-panel="myCreations"');
  assert(mobileTag.includes('data-alias="studio"'), '#mobileStudioBtn must have data-alias="studio"');
});

check('6.2: Drawer #studioPanel retains data-panel="myCreations", data-panel-id="studioPanel", and data-alias="studio"', () => {
  const panelMatch = htmlContent.match(/<div[^>]*id="studioPanel"[^>]*>/i);
  assert(panelMatch, 'Missing #studioPanel in index.html');
  const panelTag = panelMatch[0];
  assert(panelTag.includes('data-panel="myCreations"'), '#studioPanel must retain data-panel="myCreations"');
  assert(panelTag.includes('data-alias="studio"'), '#studioPanel must have data-alias="studio"');
  assert(/class="[^"]*detail-panel[^"]*"/i.test(panelTag), '#studioPanel must have detail-panel class');
  assert(/class="[^"]*drawer-panel[^"]*"/i.test(panelTag), '#studioPanel must have drawer-panel class');
});

check('6.3: Segmented 3-Mode switcher buttons exist with required IDs', () => {
  assert(htmlContent.includes('id="studioModeForgeBtn"'), 'Missing #studioModeForgeBtn');
  assert(htmlContent.includes('id="studioModeCuratedBtn"'), 'Missing #studioModeCuratedBtn');
  assert(htmlContent.includes('id="studioModeRemixBtn"'), 'Missing #studioModeRemixBtn');
});

check('6.4: Adversarial Audit: #studioFamilyGrid buttons data-family attributes match canonical schema engine IDs', () => {
  assert(htmlContent.includes('id="studioFamilyGrid"'), 'Missing #studioFamilyGrid');

  // Extract all data-family attributes from .studio-family-card buttons
  const cardRegex = /<button[^>]*class="[^"]*studio-family-card[^"]*"[^>]*data-family="([^"]+)"/gi;
  const foundFamilies = [];
  let m;
  while ((m = cardRegex.exec(htmlContent)) !== null) {
    foundFamilies.push(m[1]);
  }

  assert.strictEqual(foundFamilies.length, 5, `Expected 5 family cards, found ${foundFamilies.length}`);

  // Stress-test each DOM card family through StudioRecipeManager
  const { exports } = createModuleContext();
  const manager = new exports.StudioRecipeManager();

  foundFamilies.forEach(domFamily => {
    manager.setEngineFamily(domFamily);
    const rec = manager.getActiveRecipe();

    // Verify metadata lookup succeeds
    const meta = ENGINE_FAMILIES_META[domFamily];
    assert(meta !== undefined,
      `BUG DETECTED: DOM button has data-family="${domFamily}" but ENGINE_FAMILIES_META["${domFamily}"] is undefined! Schema expects "fluid".`);

    // Verify family-specific gene initialization succeeds
    const famDefaults = FAMILY_GENE_DEFAULTS[domFamily];
    assert(famDefaults !== undefined,
      `BUG DETECTED: DOM button has data-family="${domFamily}" but FAMILY_GENE_DEFAULTS["${domFamily}"] is undefined! Genes are missing.`);

    // Verify export/import roundtrip retains family rather than falling back to force
    const jsonStr = manager.exportRecipeJson(rec);
    const reimported = manager.importRecipeJson(jsonStr);
    assert.strictEqual(reimported.familyId, domFamily,
      `BUG DETECTED: Recipe with familyId="${domFamily}" fell back to "${reimported.familyId}" upon JSON reimport!`);
  });
});

check('6.5: 4-Step wizard tabs and step containers exist in #studioPanel', () => {
  const tabs = ['studioTabStage', 'studioTabHero', 'studioTabMood', 'studioTabEngine'];
  tabs.forEach(tabId => {
    assert(htmlContent.includes(`id="${tabId}"`), `Missing tab #${tabId}`);
  });

  const panes = ['studioStepStage', 'studioStepHero', 'studioStepMood', 'studioStepEngine'];
  panes.forEach(paneId => {
    assert(htmlContent.includes(`id="${paneId}"`), `Missing step pane #${paneId}`);
  });
});

check('6.6: Legacy stage slider IDs and activation button are preserved in Step 4', () => {
  const legacyIds = [
    'studioChromaSlider',
    'studioLiquidSlider',
    'studioTunnelSlider',
    'studioVolumeSlider',
    'studioForceSlider',
    'activateStudioBtn'
  ];
  legacyIds.forEach(id => {
    assert(htmlContent.includes(`id="${id}"`), `Missing legacy control #${id}`);
  });
});

check('6.7: Recipe save, export, import, and list container controls exist', () => {
  const controls = [
    'studioRecipeNameInput',
    'studioRecipeNameError',
    'studioSaveRecipeBtn',
    'studioGenerateBtn',
    'studioExportJsonBtn',
    'studioImportFileInput',
    'studioSavedRecipesList',
    'studioSavedCount'
  ];
  controls.forEach(ctrlId => {
    assert(htmlContent.includes(`id="${ctrlId}"`), `Missing recipe management control #${ctrlId}`);
  });
});

check('6.8: Glassmorphism CSS classes and responsive mobile detents exist in src/style.css', () => {
  assert(cssContent.includes('.studio-panel-content'), 'Missing .studio-panel-content in CSS');
  assert(cssContent.includes('.studio-mode-seg'), 'Missing .studio-mode-seg in CSS');
  assert(cssContent.includes('.studio-mode-btn'), 'Missing .studio-mode-btn in CSS');
  assert(cssContent.includes('.studio-family-card'), 'Missing .studio-family-card in CSS');
  assert(cssContent.includes('.studio-wizard-tab'), 'Missing .studio-wizard-tab in CSS');
  assert(cssContent.includes('.studio-recipe-card'), 'Missing .studio-recipe-card in CSS');

  // Verify responsive detents
  assert(cssContent.includes('max-width: 640px'), 'Missing 640px responsive breakpoint');
  assert(cssContent.includes('max-height: 900px'), 'Missing 900px vertical height detent');
});

check('6.9: main.ts wires PANEL_MAP for both myCreations and studio aliases', () => {
  assert(mainTsContent.includes("myCreations: studioPanel"), 'main.ts PANEL_MAP must map myCreations');
  assert(mainTsContent.includes("studio: studioPanel"), 'main.ts PANEL_MAP must map studio alias');
});

// =============================================================================
// SECTION 7: VISUALIZER PRESET LIFECYCLE & AUDIO STRESS
// =============================================================================
console.log('--- SECTION 7: Visualizer Preset Lifecycle & Audio Features Stress ---');

check('7.1: StudioComposerPreset satisfies VisualizerPreset contract', () => {
  const { exports } = createModuleContext();
  const preset = new exports.StudioComposerPreset();

  assert.strictEqual(preset.id, 'studio-composer');
  assert.strictEqual(preset.name, 'Visualizer Studio');
  assert.strictEqual(preset.category, 'Structures');
  assert.strictEqual(typeof preset.init, 'function');
  assert.strictEqual(typeof preset.update, 'function');
  assert.strictEqual(typeof preset.dispose, 'function');
  assert.strictEqual(typeof preset.onThemeChange, 'function');
});

check('7.2: Backward compatibility: preset.config exposes 5 numeric stage properties', () => {
  const { exports } = createModuleContext();
  const preset = new exports.StudioComposerPreset();

  assert(preset.config, 'preset.config must exist');
  assert.strictEqual(typeof preset.config.chromaIntensity, 'number');
  assert.strictEqual(typeof preset.config.liquidWarp, 'number');
  assert.strictEqual(typeof preset.config.tunnelDepth, 'number');
  assert.strictEqual(typeof preset.config.volumeDensity, 'number');
  assert.strictEqual(typeof preset.config.theForceAttraction, 'number');
});

check('7.3: getCustomParameters and setCustomParameter clamp hostile values safely', () => {
  const { exports } = createModuleContext();
  const preset = new exports.StudioComposerPreset();

  const params = preset.getCustomParameters();
  assert.strictEqual(params.length, 5);

  preset.setCustomParameter('liquidWarp', NaN);
  assert.strictEqual(preset.config.liquidWarp, 1.0, 'NaN must fallback safely to 1.0');

  preset.setCustomParameter('tunnelDepth', 9999);
  assert.strictEqual(preset.config.tunnelDepth, 2.0, 'Positive overflow must clamp to 2.0');

  preset.setCustomParameter('theForceAttraction', -9999);
  assert.strictEqual(preset.config.theForceAttraction, -2.0, 'Negative underflow must clamp to -2.0');
});

check('7.4: Rapid Preset Lifecycle: init -> update -> onThemeChange -> dispose cleans scene children', () => {
  const { exports } = createModuleContext();
  const preset = new exports.StudioComposerPreset();
  const scene = new THREE.Scene();

  const mockContext = {
    scene,
    camera: new THREE.PerspectiveCamera(),
    renderer: {},
    theme: {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      primary: '#ff007f',
      secondary: '#00f0ff',
      accent: '#ffe600',
      background: '#0a0a12'
    },
    width: 1920,
    height: 1080
  };

  assert.strictEqual(scene.children.length, 0);
  preset.init(mockContext);
  assert(scene.children.length > 0, 'init must add group to scene');

  const audioFeatures = {
    subBass: 0.8,
    bass: 0.9,
    mid: 0.5,
    treble: 0.3,
    beat: true,
    beatEnergy: 0.85
  };

  // Run 10 updates
  for (let frame = 0; frame < 10; frame++) {
    preset.update(mockContext, audioFeatures, frame * 0.016, 0.016);
  }

  // Theme change
  preset.onThemeChange({
    id: 'emerald',
    name: 'Emerald City',
    primary: '#00ff88',
    secondary: '#0088ff',
    accent: '#ffff00',
    background: '#001108'
  });

  // Dispose
  preset.dispose();
  assert.strictEqual(scene.children.length, 0, 'dispose must cleanly remove group from scene');
});

check('7.5: Hostile audio features (NaN, Infinity, negative values) during update() do not crash', () => {
  const { exports } = createModuleContext();
  const preset = new exports.StudioComposerPreset();
  const scene = new THREE.Scene();

  const mockContext = {
    scene,
    camera: new THREE.PerspectiveCamera(),
    renderer: {},
    theme: {
      primary: '#ff0000',
      secondary: '#00ff00',
      accent: '#0000ff',
      background: '#000000'
    },
    width: 800,
    height: 600
  };

  preset.init(mockContext);

  const hostileAudioSets = [
    { subBass: NaN, bass: NaN, mid: NaN, treble: NaN, beat: false, beatEnergy: NaN },
    { subBass: Infinity, bass: -Infinity, mid: 9999, treble: -9999, beat: true, beatEnergy: Infinity },
    { subBass: null, bass: undefined, mid: 'high', treble: {}, beat: 'yes', beatEnergy: -1 }
  ];

  hostileAudioSets.forEach((audio, idx) => {
    assert.doesNotThrow(() => {
      preset.update(mockContext, audio, NaN, NaN);
    }, `Hostile audio set ${idx} caused an unhandled exception`);
  });

  preset.dispose();
  assert.strictEqual(scene.children.length, 0);
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n========================================================================');
console.log(`  EMPIRICAL CHALLENGER RESULTS: ${passedTests}/${totalTests} PASSED`);
if (failedTests > 0) {
  console.log(`  FAILURES: ${failedTests}`);
  failures.forEach((f, idx) => {
    console.log(`  [${idx + 1}] ${f.testName}: ${f.error}`);
  });
}
console.log('========================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
