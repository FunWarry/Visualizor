import esbuild from 'esbuild';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themesSourcePath = path.resolve(__dirname, '../src/themes/themes.ts');
const tempBundlePath = path.resolve(__dirname, '.temp_challenger_bundle.mjs');

esbuild.buildSync({
  entryPoints: [themesSourcePath],
  bundle: true,
  format: 'esm',
  outfile: tempBundlePath,
  platform: 'node',
  logLevel: 'error'
});

const themesModule = await import(pathToFileURL(tempBundlePath).href);
try {
  fs.unlinkSync(tempBundlePath);
} catch {}

const { THEMES, getTheme, THEME_VECTORS, getThemeVectors } = themesModule;

console.log('=============================================================');
console.log('   CHALLENGER ADVERSARIAL EDGE CASE HARNESS (Ticket #39)     ');
console.log('=============================================================\n');

let total = 0;
let passed = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    Error: ${err.message}`);
    throw err;
  }
}

const defaultTheme = THEMES[0];
assert(defaultTheme && defaultTheme.id === 'ember', 'Default theme must be ember');

// --- 1. NUMERIC INPUTS ---
console.log('--- 1. Numeric Inputs ---');
const numericInputs = [
  0, 1, -1, 42, 999999, -999999,
  0.0, 3.14159, -0.0001,
  NaN, Infinity, -Infinity,
  BigInt(0), BigInt(123456789)
];

for (const num of numericInputs) {
  test(`Numeric input ${String(num)} (${typeof num}) returns ember fallback safely`, () => {
    const res = getTheme(num);
    assert.strictEqual(res.id, 'ember');
    const vec = getThemeVectors(num);
    assert.deepStrictEqual(vec, THEME_VECTORS.ember);
  });
}

// --- 2. OBJECT INPUTS ---
console.log('\n--- 2. Object Inputs ---');
const objectInputs = [
  { name: 'Plain empty object', val: {} },
  { name: 'Object with theme properties', val: { id: 'coral-reef', name: 'Coral Reef' } },
  { name: 'Object with getter throwing error', val: { get id() { throw new Error('getter bomb'); } } },
  { name: 'Object with custom toString', val: { toString() { return 'toxic'; } } },
  { name: 'Object with custom valueOf', val: { valueOf() { return 'synthwave'; } } },
  { name: 'Object.create(null)', val: Object.create(null) },
  { name: 'Frozen object', val: Object.freeze({ theme: 'amber' }) },
  { name: 'Date instance', val: new Date() },
  { name: 'RegExp instance', val: /coral-reef/ },
  { name: 'Error instance', val: new Error('synthetic error') },
  { name: 'Function instance', val: () => 'coral-reef' }
];

for (const { name, val } of objectInputs) {
  test(`Object input: ${name} returns ember fallback safely`, () => {
    const res = getTheme(val);
    assert.strictEqual(res.id, 'ember');
    const vec = getThemeVectors(val);
    assert.deepStrictEqual(vec, THEME_VECTORS.ember);
  });
}

// --- 3. ARRAY INPUTS ---
console.log('\n--- 3. Array Inputs ---');
const arrayInputs = [
  { name: 'Empty array', val: [] },
  { name: 'Single string element', val: ['ember'] },
  { name: 'Valid theme name element', val: ['coral-reef'] },
  { name: 'Multiple elements', val: ['toxic', 'synthwave'] },
  { name: 'Nested array', val: [['glacier']] },
  { name: 'Sparse array', val: new Array(10) }
];

for (const { name, val } of arrayInputs) {
  test(`Array input: ${name} returns ember fallback safely`, () => {
    const res = getTheme(val);
    assert.strictEqual(res.id, 'ember');
    const vec = getThemeVectors(val);
    assert.deepStrictEqual(vec, THEME_VECTORS.ember);
  });
}

// --- 4. PRIMITIVES & FALSY INPUTS ---
console.log('\n--- 4. Primitives, Falsy & Symbols ---');
const primitiveInputs = [
  { name: 'null', val: null },
  { name: 'undefined', val: undefined },
  { name: 'void 0', val: void 0 },
  { name: 'boolean false', val: false },
  { name: 'boolean true', val: true },
  { name: 'Symbol()', val: Symbol('ember') },
  { name: 'Symbol.for("coral-reef")', val: Symbol.for('coral-reef') }
];

for (const { name, val } of primitiveInputs) {
  test(`Primitive input: ${name} returns ember fallback safely`, () => {
    const res = getTheme(val);
    assert.strictEqual(res.id, 'ember');
    const vec = getThemeVectors(val);
    assert.deepStrictEqual(vec, THEME_VECTORS.ember);
  });
}

// --- 5. WHITESPACE & DELIMITER RESILIENCE ---
console.log('\n--- 5. Whitespace & Multi-Word Display Names ---');
const whitespaceCases = [
  { input: '', expected: 'ember', desc: 'Empty string' },
  { input: ' ', expected: 'ember', desc: 'Single space' },
  { input: '   ', expected: 'ember', desc: 'Multiple spaces' },
  { input: '\t', expected: 'ember', desc: 'Single tab' },
  { input: '\n', expected: 'ember', desc: 'Single newline' },
  { input: '\r\n', expected: 'ember', desc: 'CRLF' },
  { input: ' \t\r\n ', expected: 'ember', desc: 'Mixed whitespace' },
  { input: '  ember  ', expected: 'ember', desc: 'Padded ember' },
  { input: '\tsynthwave\n', expected: 'synthwave', desc: 'Tab & newline padded synthwave' },
  { input: '  toxic  ', expected: 'toxic', desc: 'Padded toxic' },
  { input: '  glacier  ', expected: 'glacier', desc: 'Padded glacier' },
  { input: '  forest  ', expected: 'earthy', desc: 'Padded alias forest -> earthy' },
  { input: '\tcopper\t', expected: 'glacier', desc: 'Padded alias copper -> glacier' },
  // Multi-word 'Coral Reef' variations
  { input: 'Coral Reef', expected: 'coral-reef', desc: 'Title Case "Coral Reef"' },
  { input: 'coral reef', expected: 'coral-reef', desc: 'Lowercase "coral reef"' },
  { input: 'CORAL REEF', expected: 'coral-reef', desc: 'Uppercase "CORAL REEF"' },
  { input: '  Coral Reef  ', expected: 'coral-reef', desc: 'Padded "  Coral Reef  "' },
  { input: 'Coral   Reef', expected: 'coral-reef', desc: 'Multiple internal spaces "Coral   Reef"' },
  { input: 'coral\t\nreef', expected: 'coral-reef', desc: 'Tab/newline internal separator "coral\\t\\nreef"' },
  { input: 'coral-reef', expected: 'coral-reef', desc: 'Standard kebab "coral-reef"' },
  { input: 'coral_reef', expected: 'coral-reef', desc: 'Standard snake "coral_reef"' },
  { input: 'coral--reef', expected: 'coral-reef', desc: 'Double dash "coral--reef"' },
  { input: 'coral__reef', expected: 'coral-reef', desc: 'Double underscore "coral__reef"' },
  { input: 'coral - reef', expected: 'coral-reef', desc: 'Mixed spaces and dash "coral - reef"' },
  { input: 'coral _ reef', expected: 'coral-reef', desc: 'Mixed spaces and underscore "coral _ reef"' }
];

for (const c of whitespaceCases) {
  test(`Whitespace case: [${c.desc}] '${c.input}' -> '${c.expected}'`, () => {
    const res = getTheme(c.input);
    assert.strictEqual(res.id, c.expected);
  });
}

// Test ALL 28 themes by their exact .name property
console.log('\n--- 6. All 28 Theme Display Names Lookup ---');
for (const theme of THEMES) {
  test(`getTheme('${theme.name}') resolves to theme '${theme.id}'`, () => {
    const res = getTheme(theme.name);
    assert.strictEqual(res.id, theme.id, `Theme name '${theme.name}' should resolve to '${theme.id}'`);
  });
}

// --- 7. BUILT-IN OBJECT PROTOTYPE ATTACK STRINGS ---
console.log('\n--- 7. Object Prototype Attack Strings ---');
const prototypeKeys = [
  'constructor', 'toString', 'valueOf', '__proto__',
  'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
  'toLocaleString', '__defineGetter__', '__defineSetter__'
];

for (const key of prototypeKeys) {
  test(`Prototype key lookup '${key}' safely falls back to ember`, () => {
    const res = getTheme(key);
    assert.strictEqual(res.id, 'ember');
    const vec = getThemeVectors(key);
    assert.deepStrictEqual(vec, THEME_VECTORS.ember);
  });
}

// --- 8. RAPID FUZZ COMBINATION STRESS TEST ---
console.log('\n--- 8. Rapid Fuzz Stress Test (100,000 iterations) ---');
test('100,000 mixed randomized queries execute safely under 100ms', () => {
  const fuzzPool = [
    null, undefined, 0, 123, NaN, {}, [], ['ember'],
    'coral-reef', 'Coral Reef', '  CORAL REEF  ', 'coral_reef',
    'ember', ' EMBER ', 'synthwave', 'forest', 'copper',
    'nonexistent-theme', '', '   ', '\t\n', 'constructor', '__proto__'
  ];
  
  const startTime = performance.now();
  for (let i = 0; i < 100000; i++) {
    const query = fuzzPool[i % fuzzPool.length];
    const theme = getTheme(query);
    assert(theme && typeof theme.id === 'string');
  }
  const duration = performance.now() - startTime;
  console.log(`    Executed 100,000 calls in ${duration.toFixed(2)}ms (${(duration / 100).toFixed(2)}µs/call)`);
  assert(duration < 250, `100,000 calls took too long: ${duration}ms`);
});

console.log('\n=============================================================');
console.log(`CHALLENGER RESULTS: ${passed}/${total} PASSED (0 FAILED)`);
console.log('=============================================================');
