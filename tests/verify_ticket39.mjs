import esbuild from 'esbuild';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesSourcePath = path.resolve(__dirname, '../src/themes/themes.ts');
const tempBundlePath = path.resolve(__dirname, '.temp_themes_bundle.mjs');

// 1. Compile themes.ts into standalone ESM bundle
esbuild.buildSync({
  entryPoints: [themesSourcePath],
  bundle: true,
  format: 'esm',
  outfile: tempBundlePath,
  platform: 'node',
  logLevel: 'error'
});

const themesModule = await import(pathToFileURL(tempBundlePath).href);
fs.unlinkSync(tempBundlePath);

const {
  THEMES,
  getTheme,
  THEME_VECTORS,
  getThemeVectors,
  SINGLE_COLOR_THEMES,
  EARTHY_THEMES,
  DUO_TONE_THEMES
} = themesModule;

console.log('=============================================================');
console.log('       EMPIRICAL CHALLENGER TEST SUITE: TICKET #39           ');
console.log('=============================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`\x1b[32m✓ PASS\x1b[0m ${name}`);
  } catch (err) {
    console.error(`\x1b[31m✗ FAIL\x1b[0m ${name}`);
    console.error(`   ${err.message}`);
    throw err;
  }
}

// --------------------------------------------------------------------------
// SUITE 1: CANONICAL 28 THEMES & IDENTIFIER INTEGRITY
// --------------------------------------------------------------------------
console.log('\x1b[1m--- Suite 1: Canonical 28 Themes & Identifier Integrity ---\x1b[0m');

const EXPECTED_28_THEME_IDS = [
  'ember', 'jade', 'violet', 'rose', 'azure', 'amber',
  'crimson', 'teal', 'slate', 'indigo', 'coral', 'lime',
  'earthy', 'terracotta', 'sand', 'lavender', 'sunset', 'synthwave',
  'toxic', 'coral-reef', 'firefly', 'horizon', 'arctic', 'eclipse',
  'vapor', 'nebula', 'glacier', 'prism'
];

runTest('THEMES array length is exactly 28', () => {
  assert.strictEqual(THEMES.length, 28, `Expected 28 themes, found ${THEMES.length}`);
});

runTest('THEMES contains no duplicate IDs', () => {
  const ids = THEMES.map(t => t.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(uniqueIds.size, 28, `Found duplicate theme IDs: ${ids.length - uniqueIds.size} duplicates`);
});

runTest('THEMES contains all 28 expected canonical theme IDs', () => {
  const themeIds = new Set(THEMES.map(t => t.id));
  for (const expectedId of EXPECTED_28_THEME_IDS) {
    assert.ok(themeIds.has(expectedId), `Missing expected theme ID: "${expectedId}"`);
  }
});

runTest('Every theme in THEMES has a valid non-empty display name', () => {
  for (const t of THEMES) {
    assert.strictEqual(typeof t.name, 'string');
    assert.ok(t.name.trim().length > 0, `Theme "${t.id}" has empty name`);
  }
});

// --------------------------------------------------------------------------
// SUITE 2: HEX COLOR FORMAT COMPLIANCE
// --------------------------------------------------------------------------
console.log('\n\x1b[1m--- Suite 2: Hex Color Format Compliance ---\x1b[0m');

const HEX_6_REGEX = /^#[0-9a-fA-F]{6}$/;

runTest('All 28 themes have valid 6-character hex colors for primary, secondary, accent, background, glow', () => {
  const colorProps = ['primary', 'secondary', 'accent', 'background', 'glow'];
  for (const t of THEMES) {
    for (const prop of colorProps) {
      assert.ok(
        HEX_6_REGEX.test(t[prop]),
        `Theme "${t.id}" property "${prop}" has invalid hex: "${t[prop]}"`
      );
    }
  }
});

// --------------------------------------------------------------------------
// SUITE 3: getTheme() RESOLUTION & ALIASES
// --------------------------------------------------------------------------
console.log('\n\x1b[1m--- Suite 3: getTheme() Resolution & Aliases ---\x1b[0m');

runTest('getTheme(id) cleanly resolves each of the 28 canonical IDs', () => {
  for (const id of EXPECTED_28_THEME_IDS) {
    const resolved = getTheme(id);
    assert.ok(resolved, `Failed to resolve theme for "${id}"`);
    assert.strictEqual(resolved.id, id, `Resolved theme id mismatch: expected "${id}", got "${resolved.id}"`);
  }
});

runTest('getTheme(alias) resolves all known legacy and shorthand aliases', () => {
  const aliases = {
    forest: 'earthy',
    copper: 'glacier',
    orange: 'ember',
    green: 'jade',
    purple: 'violet',
    pink: 'rose',
    blue: 'azure',
    yellow: 'amber',
    coralreef: 'coral-reef',
    coralReef: 'coral-reef',
    coral_reef: 'coral-reef'
  };

  for (const [alias, expectedCanonical] of Object.entries(aliases)) {
    const resolved = getTheme(alias);
    assert.ok(resolved, `Failed to resolve alias "${alias}"`);
    assert.strictEqual(
      resolved.id,
      expectedCanonical,
      `Alias "${alias}" resolved to "${resolved.id}", expected "${expectedCanonical}"`
    );
  }
});

runTest('getTheme(id) is case-insensitive for canonical IDs and aliases', () => {
  const testCases = [
    ['EMBER', 'ember'],
    ['Jade', 'jade'],
    ['tErRaCoTtA', 'terracotta'],
    ['FOREST', 'earthy'],
    ['cOpPeR', 'glacier'],
    ['CORAL-REEF', 'coral-reef'],
    ['CoralReef', 'coral-reef'],
    ['SYNTHWAVE', 'synthwave'],
    ['PrIsM', 'prism']
  ];

  for (const [input, expected] of testCases) {
    const resolved = getTheme(input);
    assert.strictEqual(resolved.id, expected, `Case-insensitive test failed for "${input}"`);
  }
});

runTest('getTheme() gracefully falls back to Ember for unknown, falsy, or malformed inputs', () => {
  const fallbackInputs = [
    '',
    null,
    undefined,
    'non-existent-theme-xyz',
    '123456',
    '   ',
    '__proto__',
    'toString',
    'constructor',
    'valueOf',
    '🔥',
    'a'.repeat(1000)
  ];

  for (const input of fallbackInputs) {
    const resolved = getTheme(input);
    assert.ok(resolved, `getTheme(${JSON.stringify(input)}) returned falsy`);
    assert.strictEqual(
      resolved.id,
      'ember',
      `getTheme(${JSON.stringify(input)}) should fallback to 'ember', got '${resolved.id}'`
    );
  }
});

// --------------------------------------------------------------------------
// SUITE 4: THEME_VECTORS & getThemeVectors() NORMALIZATION
// --------------------------------------------------------------------------
console.log('\n\x1b[1m--- Suite 4: THEME_VECTORS & getThemeVectors() Normalization ---\x1b[0m');

runTest('All vectors in THEME_VECTORS are normalized floats in range [0.0, 1.0]', () => {
  for (const [key, vectorPair] of Object.entries(THEME_VECTORS)) {
    assert.ok(vectorPair, `Vector for "${key}" is missing`);
    assert.ok(Array.isArray(vectorPair.primary), `Vector "${key}".primary is not an array`);
    assert.ok(Array.isArray(vectorPair.secondary), `Vector "${key}".secondary is not an array`);
    assert.strictEqual(vectorPair.primary.length, 3, `Vector "${key}".primary must have length 3`);
    assert.strictEqual(vectorPair.secondary.length, 3, `Vector "${key}".secondary must have length 3`);

    for (let i = 0; i < 3; i++) {
      const p = vectorPair.primary[i];
      const s = vectorPair.secondary[i];
      assert.strictEqual(typeof p, 'number', `Vector "${key}".primary[${i}] is not a number`);
      assert.strictEqual(typeof s, 'number', `Vector "${key}".secondary[${i}] is not a number`);
      assert.ok(!isNaN(p) && isFinite(p), `Vector "${key}".primary[${i}] is NaN or non-finite`);
      assert.ok(!isNaN(s) && isFinite(s), `Vector "${key}".secondary[${i}] is NaN or non-finite`);
      assert.ok(p >= 0.0 && p <= 1.0, `Vector "${key}".primary[${i}] out of bounds [0, 1]: ${p}`);
      assert.ok(s >= 0.0 && s <= 1.0, `Vector "${key}".secondary[${i}] out of bounds [0, 1]: ${s}`);
    }
  }
});

runTest('getThemeVectors() cleanly returns valid vectors for all 28 canonical themes and aliases', () => {
  for (const id of EXPECTED_28_THEME_IDS) {
    const v = getThemeVectors(id);
    assert.ok(v && v.primary && v.secondary, `Missing vectors for "${id}"`);
    assert.strictEqual(v.primary.length, 3);
    assert.strictEqual(v.secondary.length, 3);
  }

  // Aliases
  for (const alias of ['forest', 'copper', 'coralReef', 'orange', 'green']) {
    const v = getThemeVectors(alias);
    assert.ok(v && v.primary && v.secondary, `Missing vectors for alias "${alias}"`);
  }

  // Fallback for unknown
  const fallback = getThemeVectors('completely-unknown-id');
  assert.deepStrictEqual(fallback, THEME_VECTORS.ember, 'Unknown vector id should fallback to ember');
});

// --------------------------------------------------------------------------
// SUITE 5: THEME CATEGORY GROUPINGS & EXACT PARTITION
// --------------------------------------------------------------------------
console.log('\n\x1b[1m--- Suite 5: Theme Category Groupings & Exact Partition ---\x1b[0m');

runTest('SINGLE_COLOR_THEMES, EARTHY_THEMES, DUO_TONE_THEMES are arrays of lengths 12, 4, 12', () => {
  assert.strictEqual(SINGLE_COLOR_THEMES.length, 12, `SINGLE_COLOR_THEMES expected 12, got ${SINGLE_COLOR_THEMES.length}`);
  assert.strictEqual(EARTHY_THEMES.length, 4, `EARTHY_THEMES expected 4, got ${EARTHY_THEMES.length}`);
  assert.strictEqual(DUO_TONE_THEMES.length, 12, `DUO_TONE_THEMES expected 12, got ${DUO_TONE_THEMES.length}`);
  assert.strictEqual(
    SINGLE_COLOR_THEMES.length + EARTHY_THEMES.length + DUO_TONE_THEMES.length,
    28,
    'Sum of group lengths must equal 28'
  );
});

runTest('Theme groups partition the 28 themes without duplicates or overlaps', () => {
  const setSingle = new Set(SINGLE_COLOR_THEMES);
  const setEarthy = new Set(EARTHY_THEMES);
  const setDuo = new Set(DUO_TONE_THEMES);

  // Check intra-group uniqueness
  assert.strictEqual(setSingle.size, 12, 'SINGLE_COLOR_THEMES contains internal duplicates');
  assert.strictEqual(setEarthy.size, 4, 'EARTHY_THEMES contains internal duplicates');
  assert.strictEqual(setDuo.size, 12, 'DUO_TONE_THEMES contains internal duplicates');

  // Check inter-group disjointness
  for (const id of setSingle) {
    assert.ok(!setEarthy.has(id), `Theme "${id}" found in both SINGLE and EARTHY`);
    assert.ok(!setDuo.has(id), `Theme "${id}" found in both SINGLE and DUO`);
  }
  for (const id of setEarthy) {
    assert.ok(!setDuo.has(id), `Theme "${id}" found in both EARTHY and DUO`);
  }

  // Check union equals full 28 themes
  const union = new Set([...setSingle, ...setEarthy, ...setDuo]);
  assert.strictEqual(union.size, 28, `Union size is ${union.size}, expected 28`);

  const allThemeIds = new Set(THEMES.map(t => t.id));
  assert.deepStrictEqual(union, allThemeIds, 'Union of categories does not match THEMES catalog');
});

// --------------------------------------------------------------------------
// SUITE 6: GROUND TRUTH PARITY VS chunk.CVA3S22A.js
// --------------------------------------------------------------------------
console.log('\n\x1b[1m--- Suite 6: Ground Truth Parity vs chunk.CVA3S22A.js ---\x1b[0m');

const refDumpPath = 'file:///C:/Users/Warry/.gemini/antigravity/brain/4ca1a6c9-edab-4084-ab0c-3d318baf865b/ref_dump/chunk.CVA3S22A.js';
const refModule = await import(refDumpPath);
const refThemes = refModule.a;

runTest('Every theme primary/secondary hex and vectors match chunk.CVA3S22A.js ground truth', () => {
  // Mapping between visuval theme IDs and chunk.CVA3S22A.js keys
  const idMap = {
    ember: 'orange',
    jade: 'green',
    violet: 'purple',
    rose: 'pink',
    azure: 'blue',
    amber: 'yellow',
    crimson: 'crimson',
    teal: 'teal',
    slate: 'slate',
    indigo: 'indigo',
    coral: 'coral',
    lime: 'lime',
    earthy: 'forest',
    terracotta: 'terracotta',
    sand: 'sand',
    lavender: 'lavender',
    sunset: 'sunset',
    synthwave: 'synthwave',
    toxic: 'toxic',
    'coral-reef': 'coralReef',
    firefly: 'firefly',
    horizon: 'horizon',
    arctic: 'arctic',
    eclipse: 'eclipse',
    vapor: 'vapor',
    nebula: 'nebula',
    glacier: 'copper',
    prism: 'prism'
  };

  for (const [visuvalId, refKey] of Object.entries(idMap)) {
    const visuvalTheme = THEMES.find(t => t.id === visuvalId);
    assert.ok(visuvalTheme, `Missing theme "${visuvalId}"`);
    const refData = refThemes[refKey];
    assert.ok(refData, `Missing ref data for "${refKey}"`);

    // Verify hex equality (case-insensitive)
    assert.strictEqual(
      visuvalTheme.primary.toLowerCase(),
      refData.hex.toLowerCase(),
      `Primary hex mismatch for ${visuvalId}: got ${visuvalTheme.primary}, ref ${refData.hex}`
    );
    assert.strictEqual(
      visuvalTheme.secondary.toLowerCase(),
      refData.hexEnd.toLowerCase(),
      `Secondary hex mismatch for ${visuvalId}: got ${visuvalTheme.secondary}, ref ${refData.hexEnd}`
    );

    // Verify vector equality
    const vec = THEME_VECTORS[visuvalId];
    assert.ok(vec, `Missing vector for ${visuvalId}`);
    assert.deepStrictEqual(
      vec.primary,
      refData.primary,
      `Primary vector mismatch for ${visuvalId}: got ${JSON.stringify(vec.primary)}, ref ${JSON.stringify(refData.primary)}`
    );
    assert.deepStrictEqual(
      vec.secondary,
      refData.secondary,
      `Secondary vector mismatch for ${visuvalId}: got ${JSON.stringify(vec.secondary)}, ref ${JSON.stringify(refData.secondary)}`
    );
  }
});

// --------------------------------------------------------------------------
// SUITE 7: ADVERSARIAL STRESS HARNESS
// --------------------------------------------------------------------------
console.log('\n\x1b[1m--- Suite 7: Adversarial Stress Harness ---\x1b[0m');

runTest('Stress Test: 10,000 rapid getTheme() calls under pseudo-random fuzz inputs', () => {
  const fuzzInputs = [
    ...EXPECTED_28_THEME_IDS,
    'forest', 'copper', 'orange', 'green', 'coralreef', 'coralReef',
    '', '   ', 'null', 'undefined', '0', '1', 'NaN', 'false', 'true',
    'Object.prototype', '__proto__', 'constructor', 'hasOwnProperty',
    '#ff5c00', 'rgb(255,0,0)', 'hsl(0, 100%, 50%)',
    'theme_1', 'theme_2', 'custom', 'default',
    'a'.repeat(200), '🚀🎶✨', 'DROP TABLE themes;'
  ];

  const startTime = Date.now();
  for (let i = 0; i < 10000; i++) {
    const input = fuzzInputs[Math.floor(Math.random() * fuzzInputs.length)];
    const res = getTheme(input);
    assert.ok(res !== null && typeof res === 'object', 'getTheme returned non-object');
    assert.ok(typeof res.id === 'string' && res.id.length > 0, 'Returned theme missing valid id');
    assert.ok(HEX_6_REGEX.test(res.primary), 'Returned theme missing valid primary hex');
  }
  const duration = Date.now() - startTime;
  console.log(`   10,000 fuzz queries resolved in ${duration}ms (${(duration / 10).toFixed(2)}µs/call)`);
});

console.log('\n=============================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed successfully.`);
console.log('=============================================================\n');
