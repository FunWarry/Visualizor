/**
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE
 * Milestone m1_2: Ticket #39 getTheme Hardening Verification
 * Challenger Agent: challenger_m1_2_2
 */

const esbuild = require('esbuild');
const path = require('path');
const assert = require('assert');

// 1. Bundle src/themes/themes.ts
const themesBundle = esbuild.buildSync({
  entryPoints: [path.resolve(__dirname, '../src/themes/themes.ts')],
  bundle: true,
  format: 'cjs',
  write: false,
  target: 'node18'
});
const themesMod = { exports: {} };
new Function('module', 'exports', themesBundle.outputFiles[0].text)(themesMod, themesMod.exports);
const {
  THEMES,
  getTheme,
  getThemeVectors,
  THEME_VECTORS,
  SINGLE_COLOR_THEMES,
  EARTHY_THEMES,
  DUO_TONE_THEMES
} = themesMod.exports;

console.log('========================================================================');
console.log('       EMPIRICAL CHALLENGER STRESS HARNESS: TICKET #39 HARDENING       ');
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

const DEFAULT_THEME = THEMES[0]; // Ember
const DEFAULT_VECTORS = THEME_VECTORS.ember;

// =============================================================================
// TEST SUITE 1: NON-STRING TYPE ATTACK VECTORS
// =============================================================================
console.log('--- TEST SUITE 1: Non-String & Malformed Type Attack Vectors ---');

const nonStringInputs = [
  // Falsy & nullish
  { name: 'null', val: null },
  { name: 'undefined', val: undefined },
  { name: 'void 0', val: void 0 },
  // Booleans
  { name: 'boolean true', val: true },
  { name: 'boolean false', val: false },
  // Numbers
  { name: 'number 0', val: 0 },
  { name: 'number -0', val: -0 },
  { name: 'number 1', val: 1 },
  { name: 'number -1', val: -1 },
  { name: 'number 12345', val: 12345 },
  { name: 'number 3.14159', val: 3.14159 },
  { name: 'NaN', val: NaN },
  { name: 'Infinity', val: Infinity },
  { name: '-Infinity', val: -Infinity },
  { name: 'MAX_SAFE_INTEGER', val: Number.MAX_SAFE_INTEGER },
  { name: 'MIN_VALUE', val: Number.MIN_VALUE },
  // BigInt
  { name: 'bigint 0n', val: 0n },
  { name: 'bigint 42n', val: 42n },
  { name: 'bigint 9999999999999999999n', val: 9999999999999999999n },
  // Symbols
  { name: 'Symbol()', val: Symbol() },
  { name: 'Symbol("ember")', val: Symbol('ember') },
  { name: 'Symbol("coral-reef")', val: Symbol('coral-reef') },
  { name: 'Symbol.iterator', val: Symbol.iterator },
  { name: 'Symbol.toPrimitive', val: Symbol.toPrimitive },
  // Functions
  { name: 'anonymous function', val: function() {} },
  { name: 'arrow function returning ember', val: () => 'ember' },
  { name: 'async function', val: async () => {} },
  { name: 'generator function', val: function*() {} },
  // Plain & prototype-less objects
  { name: 'empty object {}', val: {} },
  { name: 'object with id property { id: "ember" }', val: { id: 'ember' } },
  { name: 'object with toString { toString: () => "ember" }', val: { toString: () => 'ember' } },
  { name: 'object with valueOf { valueOf: () => "ember" }', val: { valueOf: () => 'ember' } },
  { name: 'Object.create(null)', val: Object.create(null) },
  // Hostile / throwing getters
  {
    name: 'hostile object throwing on toString & id',
    val: Object.defineProperty({}, 'toString', {
      get: () => { throw new Error('trap toString!'); }
    })
  },
  {
    name: 'hostile object throwing on Symbol.toPrimitive',
    val: {
      [Symbol.toPrimitive]: () => { throw new Error('trap toPrimitive!'); }
    }
  },
  // Circular references
  {
    name: 'circular object reference',
    val: (() => {
      const circ = {};
      circ.self = circ;
      return circ;
    })()
  },
  // Arrays & Sparsity
  { name: 'empty array []', val: [] },
  { name: 'array with string ["ember"]', val: ['ember'] },
  { name: 'array with multiple entries ["ember", "toxic"]', val: ['ember', 'toxic'] },
  { name: 'array with null/undefined [null, undefined]', val: [null, undefined] },
  { name: 'sparse array Array(100)', val: new Array(100) },
  // Buffers & TypedArrays
  { name: 'Uint8Array', val: new Uint8Array([1, 2, 3]) },
  { name: 'Buffer with "ember"', val: Buffer.from('ember') },
  // Built-in standard library instances
  { name: 'Date instance', val: new Date() },
  { name: 'RegExp /ember/', val: /ember/ },
  { name: 'RegExp /coral-reef/gi', val: /coral-reef/gi },
  { name: 'Map instance', val: new Map() },
  { name: 'Set instance', val: new Set(['ember']) },
  { name: 'WeakMap instance', val: new WeakMap() },
  { name: 'WeakSet instance', val: new WeakSet() },
  { name: 'Promise instance', val: Promise.resolve('ember') },
  { name: 'Error instance', val: new Error('ember') }
];

for (const { name, val } of nonStringInputs) {
  check(`Non-string: getTheme(${name}) falls back cleanly to Ember without exception`, () => {
    const res = getTheme(val);
    assert.strictEqual(res, DEFAULT_THEME, `Expected strict fallback to DEFAULT_THEME, got ${res?.id}`);
    assert.strictEqual(res.id, 'ember');
  });

  check(`Non-string: getThemeVectors(${name}) falls back cleanly to Ember vectors without exception`, () => {
    const vec = getThemeVectors(val);
    assert.deepStrictEqual(vec, DEFAULT_VECTORS, `Expected ember vectors, got ${JSON.stringify(vec)}`);
  });
}

// =============================================================================
// TEST SUITE 2: PROTOTYPE PROPERTY & RESERVED IDENTIFIERS
// =============================================================================
console.log('\n--- TEST SUITE 2: Prototype Property & Reserved Identifiers ---');

const prototypeKeywords = [
  'constructor',
  '__proto__',
  'prototype',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__'
];

for (const prop of prototypeKeywords) {
  check(`Prototype immunity: getTheme("${prop}") falls back to Ember without prototype pollution`, () => {
    const res = getTheme(prop);
    assert.strictEqual(res, DEFAULT_THEME);
    assert.strictEqual(res.id, 'ember');
  });

  check(`Prototype immunity: getThemeVectors("${prop}") falls back to Ember vector`, () => {
    const vec = getThemeVectors(prop);
    assert.deepStrictEqual(vec, DEFAULT_VECTORS);
  });
}

// =============================================================================
// TEST SUITE 3: EXTREME WHITESPACE & CONTROL CHARACTERS
// =============================================================================
console.log('\n--- TEST SUITE 3: Extreme Whitespace, Tabs, Newlines & Control Chars ---');

const whitespaceTestCases = [
  { name: 'Empty string', input: '', expectFallback: true },
  { name: 'Single space', input: ' ', expectFallback: true },
  { name: 'Multiple spaces', input: '          ', expectFallback: true },
  { name: 'Tabs only', input: '\t\t\t\t', expectFallback: true },
  { name: 'Newlines and carriage returns', input: '\r\n\r\n\n\r', expectFallback: true },
  { name: 'Mixed whitespace & vertical tabs', input: ' \t \v \f \r \n ', expectFallback: true },
  { name: 'Non-breaking spaces NBSP (\\u00A0)', input: '\u00A0\u00A0\u00A0', expectFallback: true },
  { name: 'Zero-width space (\\u200B)', input: '\u200B\u200B', expectFallback: true },
  { name: 'BOM character (\\uFEFF)', input: '\uFEFF\uFEFF', expectFallback: true },
  // Padded legitimate themes
  { name: 'Tabs + newlines around ember', input: '\t\r\n  ember  \r\n\t', expectedId: 'ember' },
  { name: 'Mixed tabs + spaces around jade', input: '   \t  jade   \t  ', expectedId: 'jade' },
  { name: 'Newlines around coral-reef', input: '\n\ncoral-reef\n\n', expectedId: 'coral-reef' },
  { name: 'Padded display name "  Coral Reef  "', input: '  Coral Reef  ', expectedId: 'coral-reef' },
  { name: 'Padded alias "  forest  "', input: '  forest  ', expectedId: 'earthy' },
  { name: 'Padded alias " \t copper \n "', input: ' \t copper \n ', expectedId: 'glacier' },
  // Whitespace separating multi-word names
  { name: 'Multiple spaces inside display name "Coral     Reef"', input: 'Coral     Reef', expectedId: 'coral-reef' },
  { name: 'Tab inside display name "Coral\\tReef"', input: 'Coral\tReef', expectedId: 'coral-reef' },
  { name: 'Newline inside display name "Coral\\nReef"', input: 'Coral\nReef', expectedId: 'coral-reef' },
  { name: 'Excessive hyphens and underscores "coral----____reef"', input: 'coral----____reef', expectedId: 'coral-reef' },
  { name: 'Mixed hyphens, spaces, tabs "coral - _ \\t reef"', input: 'coral - _ \t reef', expectedId: 'coral-reef' },
  // Control characters
  { name: 'Null byte in string "ember\\0"', input: 'ember\0', expectFallback: true },
  { name: 'Null byte prefix "\\0ember"', input: '\0ember', expectFallback: true },
  { name: 'Only null byte "\\0"', input: '\0', expectFallback: true },
  { name: 'Bell / Backspace control chars "\\x07\\x08"', input: '\x07\x08', expectFallback: true },
  { name: 'ANSI escape codes "\\x1b[31member\\x1b[0m"', input: '\x1b[31member\x1b[0m', expectFallback: true }
];

for (const tc of whitespaceTestCases) {
  check(`Whitespace: ${tc.name}`, () => {
    const res = getTheme(tc.input);
    const vec = getThemeVectors(tc.input);
    if (tc.expectFallback) {
      assert.strictEqual(res.id, 'ember', `Expected fallback to ember, got '${res.id}'`);
      assert.deepStrictEqual(vec, DEFAULT_VECTORS);
    } else {
      assert.strictEqual(res.id, tc.expectedId, `Expected theme '${tc.expectedId}', got '${res.id}'`);
      assert.deepStrictEqual(vec, THEME_VECTORS[tc.expectedId]);
    }
  });
}

// =============================================================================
// TEST SUITE 4: UNICODE, EMOJIS, DIACRITICS & SCRIPTS
// =============================================================================
console.log('\n--- TEST SUITE 4: Unicode, Emojis, Diacritics & Multilingual Scripts ---');

const unicodeTestCases = [
  // Emojis
  { name: 'Fire emoji 🔥', input: '🔥' },
  { name: 'Wave emoji 🌊', input: '🌊' },
  { name: 'Rocket emoji 🚀', input: '🚀' },
  { name: 'Rainbow emoji 🌈', input: '🌈' },
  { name: 'Compound emoji family 👨‍👩‍👧‍👦', input: '👨‍👩‍👧‍👦' },
  { name: 'Flag rainbow 🏳️‍🌈', input: '🏳️‍🌈' },
  // Non-Latin scripts
  { name: 'Cyrillic: эмбер', input: 'эмбер' },
  { name: 'Greek: έμβερ', input: 'έμβερ' },
  { name: 'Arabic: عنبر', input: 'عنبر' },
  { name: 'Hebrew: ענבר', input: 'ענבר' },
  { name: 'Japanese Katakana: エバー', input: 'エバー' },
  { name: 'Chinese Simplified: 珊瑚礁', input: '珊瑚礁' },
  { name: 'Hindi: कोरल', input: 'कोरल' },
  // Diacritics and accented characters
  { name: 'Accented émber', input: 'émber' },
  { name: 'Accented cöral-rëëf', input: 'cöral-rëëf' },
  { name: 'Combining diacritic e\\u0301mber', input: 'e\u0301mber' },
  // Tricky casings
  { name: 'Turkish dotless i: EMBER with dotless', input: 'ımber' },
  { name: 'German eszett: straße', input: 'straße' },
  // Fullwidth characters
  { name: 'Fullwidth latin: ｅｍｂｅｒ', input: 'ｅｍｂｅｒ' },
  // Bidirectional & control formatting
  { name: 'RTL override mark \\u202Eember\\u202C', input: '\u202Eember\u202C' }
];

for (const tc of unicodeTestCases) {
  check(`Unicode: ${tc.name} safely returns Ember fallback`, () => {
    const res = getTheme(tc.input);
    const vec = getThemeVectors(tc.input);
    assert.strictEqual(res, DEFAULT_THEME);
    assert.strictEqual(res.id, 'ember');
    assert.deepStrictEqual(vec, DEFAULT_VECTORS);
  });
}

// =============================================================================
// TEST SUITE 5: INJECTION, CODE INJECTION & SYSTEM PAYLOADS
// =============================================================================
console.log('\n--- TEST SUITE 5: Injection, Code Payloads & SQL/Shell Strings ---');

const injectionPayloads = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  '../../../../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\cmd.exe',
  "'; DROP TABLE themes; --",
  "1' OR '1'='1",
  '${process.env.PATH}',
  '${7*7}',
  '{{constructor.constructor("return process")()}}',
  '%s%s%s%s%s%n',
  'javascript:alert(1)',
  'file:///etc/hosts',
  'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
];

for (const payload of injectionPayloads) {
  check(`Injection resilience: "${payload.substring(0, 30)}..." returns Ember`, () => {
    const res = getTheme(payload);
    const vec = getThemeVectors(payload);
    assert.strictEqual(res, DEFAULT_THEME);
    assert.strictEqual(res.id, 'ember');
    assert.deepStrictEqual(vec, DEFAULT_VECTORS);
  });
}

// =============================================================================
// TEST SUITE 6: MASSIVE STRINGS & REDOS VULNERABILITY AUDIT
// =============================================================================
console.log('\n--- TEST SUITE 6: Massive Strings & ReDoS / Memory Audit ---');

const stringLengths = [1000, 10000, 100000, 1000000];

for (const len of stringLengths) {
  check(`Massive string: ${len.toLocaleString()} chars processed without ReDoS or crash`, () => {
    const longString = 'a- _ \t\n'.repeat(Math.ceil(len / 8)).slice(0, len);
    const start = process.hrtime.bigint();
    const res = getTheme(longString);
    const vec = getThemeVectors(longString);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;

    assert.strictEqual(res.id, 'ember');
    assert.deepStrictEqual(vec, DEFAULT_VECTORS);
    // Regex replace on 1,000,000 characters should complete in < 150ms in Node V8
    assert.ok(elapsedMs < 250, `Processing took too long: ${elapsedMs.toFixed(2)}ms for ${len} chars`);
    console.log(`      (${len.toLocaleString()} chars parsed in ${elapsedMs.toFixed(2)}ms)`);
  });
}

// =============================================================================
// TEST SUITE 7: ALL 28 CANONICAL THEMES COMPREHENSIVE CONTRACT INTEGRITY
// =============================================================================
console.log('\n--- TEST SUITE 7: Canonical 28 Themes Contract Integrity ---');

const expected28Ids = [
  'ember', 'jade', 'violet', 'rose', 'azure', 'amber',
  'crimson', 'teal', 'slate', 'indigo', 'coral', 'lime',
  'terracotta', 'earthy', 'sand', 'lavender',
  'sunset', 'synthwave', 'toxic', 'coral-reef', 'firefly', 'horizon',
  'arctic', 'eclipse', 'vapor', 'nebula', 'glacier', 'prism'
];

check('Exactly 28 themes exist in THEMES array', () => {
  assert.strictEqual(THEMES.length, 28);
});

for (const id of expected28Ids) {
  check(`Contract: Theme "${id}" resolves via ID, uppercase ID, name, vectors`, () => {
    const theme = getTheme(id);
    assert.ok(theme, `Theme not resolved for "${id}"`);
    assert.strictEqual(theme.id, id);

    // Uppercase lookup
    const upperTheme = getTheme(id.toUpperCase());
    assert.strictEqual(upperTheme.id, id);

    // Name lookup
    const nameTheme = getTheme(theme.name);
    assert.strictEqual(nameTheme.id, id);

    // Color properties check
    const hexRegex = /^#[0-9a-fA-F]{6}$/;
    assert.ok(hexRegex.test(theme.primary), `Invalid primary hex in ${id}`);
    assert.ok(hexRegex.test(theme.secondary), `Invalid secondary hex in ${id}`);
    assert.ok(hexRegex.test(theme.accent), `Invalid accent hex in ${id}`);
    assert.ok(hexRegex.test(theme.background), `Invalid background hex in ${id}`);
    assert.ok(hexRegex.test(theme.glow), `Invalid glow hex in ${id}`);

    // Vectors check
    const vectors = getThemeVectors(id);
    assert.ok(vectors && Array.isArray(vectors.primary) && Array.isArray(vectors.secondary));
    assert.strictEqual(vectors.primary.length, 3);
    assert.strictEqual(vectors.secondary.length, 3);
    for (let i = 0; i < 3; i++) {
      assert.ok(vectors.primary[i] >= 0 && vectors.primary[i] <= 1, `Primary[${i}] out of range in ${id}`);
      assert.ok(vectors.secondary[i] >= 0 && vectors.secondary[i] <= 1, `Secondary[${i}] out of range in ${id}`);
    }
  });
}

// =============================================================================
// TEST SUITE 8: HIGH-CONCURRENCY FUZZING & MEMORY STABILITY
// =============================================================================
console.log('\n--- TEST SUITE 8: High-Concurrency Fuzzing & Memory Stability ---');

check('Fuzzing & Memory: 250,000 rapid randomized calls with bounded memory', () => {
  const fuzzBank = [
    // Valid canonical
    ...expected28Ids,
    // Valid aliases
    'forest', 'copper', 'orange', 'green', 'purple', 'pink', 'blue', 'yellow', 'coralreef', 'coralReef', 'coral_reef',
    // Padded valid
    '  ember  ', '\t\tjade\n\n', '  Coral Reef  ',
    // Invalid strings
    '', '   ', 'does-not-exist', 'xyz123', 'constructor', '__proto__', '🔥', 'a'.repeat(200),
    // Non-string values
    null, undefined, 0, 12345, true, false, NaN, {}, [], ['ember'], { id: 'toxic' }, () => 'ember'
  ];

  if (global.gc) global.gc();
  const memBefore = process.memoryUsage().heapUsed;
  const startFuzz = process.hrtime.bigint();

  const ITERATIONS = 250000;
  for (let i = 0; i < ITERATIONS; i++) {
    const item = fuzzBank[i % fuzzBank.length];
    const t = getTheme(item);
    const v = getThemeVectors(item);
    // Sanity checks
    if (!t || !t.id || !v || !v.primary) {
      throw new Error(`Invalid theme/vector returned for input index ${i}`);
    }
  }

  const durationMs = Number(process.hrtime.bigint() - startFuzz) / 1e6;
  if (global.gc) global.gc();
  const memAfter = process.memoryUsage().heapUsed;
  const memDeltaMB = (memAfter - memBefore) / (1024 * 1024);

  console.log(`      Executed ${ITERATIONS.toLocaleString()} fuzz queries in ${durationMs.toFixed(2)}ms`);
  console.log(`      Average query speed: ${(durationMs / ITERATIONS * 1000).toFixed(4)}µs`);
  console.log(`      Heap delta: ${memDeltaMB.toFixed(2)} MB`);

  assert.ok(durationMs < 1000, `Execution too slow: took ${durationMs.toFixed(2)}ms (expected < 1000ms)`);
  // Memory growth should remain tiny (under 15MB for 250k calls)
  assert.ok(memDeltaMB < 15, `Suspected memory leak: heap grew by ${memDeltaMB.toFixed(2)} MB`);
});

// =============================================================================
// VERDICT & SUMMARY
// =============================================================================
console.log('\n========================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('========================================================================');

if (failedTests > 0) {
  console.error('\nFAILURES SUMMARY:');
  for (const f of failures) {
    console.error(`- ${f.testName}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('\n>>> EMPIRICAL VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED CLEANLY <<<');
  process.exit(0);
}
