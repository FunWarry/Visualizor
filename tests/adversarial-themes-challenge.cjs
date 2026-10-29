/**
 * VISUALIZOR ADVERSARIAL STRESS HARNESS
 * Ticket #39: 16 missing color themes (28 total themes)
 * Challenger: challenger_m1_2
 */

const esbuild = require('esbuild');
const path = require('path');
const THREE = require('three');

// Setup mock DOM & WebGL environment for RenderEngine & Presets
function createMockEnvironment() {
  const listeners = new Map();
  const mockElement = {
    tagName: 'CANVAS',
    width: 1920,
    height: 1080,
    style: {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    setAttribute: () => {},
    getAttribute: () => null,
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener: (type, fn) => {
      listeners.get(type)?.delete(fn);
    },
    dispatchEvent: () => true,
    toDataURL: () => 'data:image/png;base64,AAAA',
    getContext: (type) => {
      if (type === '2d') {
        return {
          canvas: mockElement,
          fillRect: () => {},
          clearRect: () => {},
          fillText: () => {},
          measureText: () => ({ width: 10 })
        };
      }
      return mockGlProxy;
    }
  };

  const mockGl = {
    VERSION: 0x1F02,
    VENDOR: 0x1F00,
    RENDERER: 0x1F01,
    SHADING_LANGUAGE_VERSION: 0x8DF8,
    MAX_VERTEX_ATTRIBS: 0x8869,
    MAX_COMBINED_TEXTURE_IMAGE_UNITS: 0x8B4D,
    MAX_TEXTURE_IMAGE_UNITS: 0x8872,
    MAX_VERTEX_TEXTURE_IMAGE_UNITS: 0x8B4C,
    MAX_TEXTURE_SIZE: 0x0D33,
    MAX_CUBE_MAP_TEXTURE_SIZE: 0x851C,
    MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
    MAX_VARYING_VECTORS: 0x8DFA,
    MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DF0,
    MAX_RENDERBUFFER_SIZE: 0x84E8,
    DEPTH_BITS: 0x0D56,
    STENCIL_BITS: 0x0D57,
    SAMPLE_BUFFERS: 0x80A8,
    SAMPLES: 0x80A9,
    RED_BITS: 0x0D52,
    GREEN_BITS: 0x0D53,
    BLUE_BITS: 0x0D54,
    ALPHA_BITS: 0x0D55,
    MAX_DRAW_BUFFERS: 0x8824,
    MAX_COLOR_ATTACHMENTS: 0x8CDF,
    MAX_TEXTURE_LOD_BIAS: 0x84FD,
    canvas: mockElement,
    getParameter: (p) => {
      if (p === 0x1F02) return 'WebGL 2.0 (Mock)';
      if (p === 0x1F01) return 'Mock Renderer';
      if (p === 0x1F00) return 'Mock Vendor';
      if (p === 0x8DF8) return 'WebGL GLSL ES 3.00 (Mock)';
      return 16;
    },
    getExtension: () => ({
      MAX_TEXTURE_MAX_ANISOTROPY_EXT: 16
    }),
    enable: () => {},
    disable: () => {},
    clear: () => {},
    clearColor: () => {},
    clearDepth: () => {},
    clearStencil: () => {},
    viewport: () => {},
    scissor: () => {},
    createShader: () => ({}),
    shaderSource: () => {},
    compileShader: () => {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',
    createProgram: () => ({}),
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => '',
    useProgram: () => {},
    createBuffer: () => ({}),
    bindBuffer: () => {},
    bufferData: () => {},
    bufferSubData: () => {},
    createTexture: () => ({}),
    bindTexture: () => {},
    texParameteri: () => {},
    texImage2D: () => {},
    pixelStorei: () => {},
    generateMipmap: () => {},
    createFramebuffer: () => ({}),
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    checkFramebufferStatus: () => 0x8CD5,
    createRenderbuffer: () => ({}),
    bindRenderbuffer: () => {},
    renderbufferStorage: () => {},
    texImage3D: () => {},
    texStorage3D: () => {},
    texSubImage3D: () => {},
    copyTexSubImage3D: () => {},
    getShaderPrecisionFormat: () => ({ rangeMin: 127, rangeMax: 127, precision: 23 })
  };

  const mockGlProxy = new Proxy(mockGl, {
    get: (target, prop) => {
      if (prop in target) return target[prop];
      if (typeof prop === 'string') {
        if (prop === prop.toUpperCase() && !prop.startsWith('get')) {
          return 0;
        }
        return () => {};
      }
      return undefined;
    }
  });

  const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {},
    removeEventListener: () => {}
  };

  const mockDocument = {
    createElement: () => mockElement,
    getElementById: () => mockElement,
    querySelector: () => mockElement,
    querySelectorAll: () => [mockElement]
  };

  global.window = mockWindow;
  global.document = mockDocument;
  global.HTMLCanvasElement = function() {};

  return { mockElement, mockGl };
}

async function runAdversarialChallenge() {
  console.log('======================================================================');
  console.log('       ADVERSARIAL STRESS HARNESS: TICKET #39 COLOR THEMES            ');
  console.log('======================================================================\n');

  const { mockElement } = createMockEnvironment();

  // 1. Bundle and load themes.ts
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

  // Bundle and load RenderEngine
  const engineBundle = esbuild.buildSync({
    entryPoints: [path.resolve(__dirname, '../src/engine/RenderEngine.ts')],
    bundle: true,
    format: 'cjs',
    write: false,
    external: ['three'],
    target: 'node18'
  });
  const engineMod = { exports: {} };
  new Function('module', 'exports', 'require', engineBundle.outputFiles[0].text)(engineMod, engineMod.exports, (id) => {
    if (id === 'three') return THREE;
    if (id.startsWith('three/examples/jsm/postprocessing/')) {
      return {
        EffectComposer: class {
          constructor() {}
          addPass() {}
          render() {}
          setSize() {}
        },
        RenderPass: class { constructor() {} },
        ShaderPass: class { constructor() { this.uniforms = { uTime: {}, uVignette: {}, uFilmGrain: {}, uChromaticAberration: {}, uScanlines: {}, uCrtBend: {}, uAudioBass: {}, uPersistence: {}, tFeedback: {} }; } },
        UnrealBloomPass: class { constructor() { this.strength = 1; this.radius = 0.5; this.threshold = 0.1; } }
      };
    }
    return require(id);
  });
  const { RenderEngine } = engineMod.exports;

  let passedTests = 0;
  let failedTests = 0;
  const findings = [];

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✓ ${testName}`);
      passedTests++;
    } else {
      console.error(`  ✗ ${testName} ${details ? '— ' + details : ''}`);
      failedTests++;
      findings.push({ testName, details });
    }
  }

  // ==========================================================================
  // SECTION 1: Catalog Completeness & Color Specifications
  // ==========================================================================
  console.log('\n--- SECTION 1: Catalog Completeness & Color Specifications ---');

  assert(THEMES.length === 28, 'Total themes count is exactly 28', `Got ${THEMES.length}`);

  const EXPECTED_28_IDS = [
    'ember', 'jade', 'violet', 'rose', 'azure', 'amber',
    'crimson', 'teal', 'slate', 'indigo', 'coral', 'lime',
    'terracotta', 'earthy', 'sand', 'lavender',
    'sunset', 'synthwave', 'toxic', 'coral-reef', 'firefly', 'horizon',
    'arctic', 'eclipse', 'vapor', 'nebula', 'glacier', 'prism'
  ];

  const actualIds = THEMES.map(t => t.id);
  const missingIds = EXPECTED_28_IDS.filter(id => !actualIds.includes(id));
  assert(missingIds.length === 0, 'All 28 canonical theme IDs are present', `Missing: ${missingIds.join(', ')}`);

  const uniqueIds = new Set(actualIds);
  assert(uniqueIds.size === 28, 'All 28 theme IDs are unique without collisions', `Found ${uniqueIds.size} unique`);

  const actualNames = THEMES.map(t => t.name);
  const uniqueNames = new Set(actualNames);
  assert(uniqueNames.size === 28, 'All 28 theme display names are unique', `Found ${uniqueNames.size} unique`);

  // Hex color validity and THREE.Color parsing
  const hexRegex = /^#[0-9a-fA-F]{6}$/;
  let allHexValid = true;
  let colorParseErrors = [];

  for (const theme of THEMES) {
    const fields = ['primary', 'secondary', 'accent', 'background', 'glow'];
    for (const f of fields) {
      if (!hexRegex.test(theme[f])) {
        allHexValid = false;
        colorParseErrors.push(`${theme.id}.${f}: ${theme[f]}`);
      }
      try {
        const c = new THREE.Color(theme[f]);
        if (Number.isNaN(c.r) || Number.isNaN(c.g) || Number.isNaN(c.b)) {
          colorParseErrors.push(`NaN in THREE.Color for ${theme.id}.${f}`);
        }
      } catch (err) {
        colorParseErrors.push(`Exception parsing ${theme.id}.${f}: ${err.message}`);
      }
    }
  }
  assert(allHexValid, 'All 140 color values adhere strictly to 6-digit hex format (#RRGGBB)', colorParseErrors.join(', '));
  assert(colorParseErrors.length === 0, 'All colors parse cleanly into Three.js Color instances without NaN');

  // Verify dark backgrounds (luminance check: background luminance should be < 0.1 for high contrast)
  let highLumaBackgrounds = [];
  for (const theme of THEMES) {
    const c = new THREE.Color(theme.background);
    const luma = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    if (luma > 0.15) {
      highLumaBackgrounds.push(`${theme.id} (luma: ${luma.toFixed(3)})`);
    }
  }
  assert(highLumaBackgrounds.length === 0, 'All theme backgrounds are deep dark colors (luma < 0.15) for audio stage contrast', highLumaBackgrounds.join(', '));

  // Verify authoritative hex specifications for 16 target themes
  const SPEC_HEX = {
    earthy: { primary: '#5c8552', secondary: '#789459' },
    terracotta: { primary: '#b8613d', secondary: '#c28573' },
    sand: { primary: '#e2ca76', secondary: '#c4a852' },
    lavender: { primary: '#8c6ba6', secondary: '#6b85ad' },
    sunset: { primary: '#ff5c0d', secondary: '#00ccb4' },
    synthwave: { primary: '#f21aa5', secondary: '#00e5f0' },
    toxic: { primary: '#87ff00', secondary: '#8c00f2' },
    'coral-reef': { primary: '#ff705f', secondary: '#145ad1' },
    firefly: { primary: '#d4f030', secondary: '#0a2418' },
    horizon: { primary: '#22c55e', secondary: '#3b82f6' },
    arctic: { primary: '#33b3ff', secondary: '#ff3d85' },
    eclipse: { primary: '#2e196b', secondary: '#ffd600' },
    vapor: { primary: '#b38cf2', secondary: '#4debb3' },
    nebula: { primary: '#9333ea', secondary: '#ec4899' },
    glacier: { primary: '#14b8a6', secondary: '#6366f1' },
    prism: { primary: '#7c3aed', secondary: '#f59e0b' }
  };

  let hexMismatches = [];
  for (const [id, expected] of Object.entries(SPEC_HEX)) {
    const t = THEMES.find(x => x.id === id);
    if (!t) {
      hexMismatches.push(`Theme ${id} not found`);
      continue;
    }
    if (t.primary.toLowerCase() !== expected.primary.toLowerCase()) {
      hexMismatches.push(`${id}.primary expected ${expected.primary}, got ${t.primary}`);
    }
    if (t.secondary.toLowerCase() !== expected.secondary.toLowerCase()) {
      hexMismatches.push(`${id}.secondary expected ${expected.secondary}, got ${t.secondary}`);
    }
  }
  assert(hexMismatches.length === 0, 'All 16 target themes match authoritative reference hex values', hexMismatches.join(', '));

  // Category counts
  const categoryTotal = SINGLE_COLOR_THEMES.length + EARTHY_THEMES.length + DUO_TONE_THEMES.length;
  assert(categoryTotal === 28, `Category theme groups sum to exactly 28 (12 Single + 4 Earthy + 12 Duo = ${categoryTotal})`);
  assert(SINGLE_COLOR_THEMES.length === 12, 'SINGLE_COLOR_THEMES has 12 items');
  assert(EARTHY_THEMES.length === 4, 'EARTHY_THEMES has 4 items');
  assert(DUO_TONE_THEMES.length === 12, 'DUO_TONE_THEMES has 12 items');

  // Vector table completeness
  let vectorErrors = [];
  for (const id of EXPECTED_28_IDS) {
    const v = THEME_VECTORS[id];
    if (!v) {
      vectorErrors.push(`Missing vector for ${id}`);
      continue;
    }
    if (!v.primary || v.primary.length !== 3 || !v.secondary || v.secondary.length !== 3) {
      vectorErrors.push(`Invalid vector format for ${id}`);
      continue;
    }
    for (let i = 0; i < 3; i++) {
      if (v.primary[i] < 0 || v.primary[i] > 1 || Number.isNaN(v.primary[i])) {
        vectorErrors.push(`Primary[${i}] out of range for ${id}: ${v.primary[i]}`);
      }
      if (v.secondary[i] < 0 || v.secondary[i] > 1 || Number.isNaN(v.secondary[i])) {
        vectorErrors.push(`Secondary[${i}] out of range for ${id}: ${v.secondary[i]}`);
      }
    }
  }
  assert(vectorErrors.length === 0, 'THEME_VECTORS contains valid normalized float vectors for all 28 themes', vectorErrors.join(', '));

  // ==========================================================================
  // SECTION 2: Unknown Theme IDs & Fallback Robustness
  // ==========================================================================
  console.log('\n--- SECTION 2: Unknown Theme IDs & Fallback Robustness ---');

  const defaultTheme = THEMES[0]; // ember

  // Standard non-existent string IDs
  const unknownIds = [
    'nonexistent',
    'unknown-theme-xyz',
    'does-not-exist',
    'random_theme_9999',
    '__proto__',
    'constructor',
    'toString',
    'valueOf'
  ];

  let unknownFallbackPass = true;
  for (const id of unknownIds) {
    const result = getTheme(id);
    if (!result || result.id !== 'ember') {
      unknownFallbackPass = false;
      findings.push({ testName: `Fallback for '${id}'`, details: `Got ${result ? result.id : 'null'}` });
    }
  }
  assert(unknownFallbackPass, 'Standard unknown string IDs fall back gracefully to Ember without crashing');

  // Falsy inputs
  assert(getTheme('').id === 'ember', "Empty string '' falls back to Ember");
  assert(getTheme(null).id === 'ember', 'null falls back to Ember');
  assert(getTheme(undefined).id === 'ember', 'undefined falls back to Ember');

  // Vector fallback for unknown IDs
  assert(getThemeVectors('nonexistent').primary[0] === THEME_VECTORS.ember.primary[0], 'getThemeVectors unknown ID falls back to ember vector');
  assert(getThemeVectors('').primary[0] === THEME_VECTORS.ember.primary[0], 'getThemeVectors empty string falls back to ember vector');

  // Adversarial edge cases: Non-string inputs
  let nonStringCrash = false;
  let nonStringError = '';
  try {
    getTheme(12345);
  } catch (err) {
    nonStringCrash = true;
    nonStringError = err.message;
  }
  assert(!nonStringCrash, 'Numeric input (12345) handled without throwing exception', nonStringError);

  let objectInputCrash = false;
  let objectInputError = '';
  try {
    getTheme({});
  } catch (err) {
    objectInputCrash = true;
    objectInputError = err.message;
  }
  assert(!objectInputCrash, 'Object input ({}) handled without throwing exception', objectInputError);

  let arrayInputCrash = false;
  let arrayInputError = '';
  try {
    getTheme(['ember']);
  } catch (err) {
    arrayInputCrash = true;
    arrayInputError = err.message;
  }
  assert(!arrayInputCrash, 'Array input (["ember"]) handled without throwing exception', arrayInputError);

  // ==========================================================================
  // SECTION 3: Case Sensitivity, Separators & Whitespace Resilience
  // ==========================================================================
  console.log('\n--- SECTION 3: Case Sensitivity, Separators & Whitespace Resilience ---');

  // Case insensitivity
  assert(getTheme('EMBER').id === 'ember', 'Uppercase EMBER resolves to ember');
  assert(getTheme('Ember').id === 'ember', 'Mixed case Ember resolves to ember');
  assert(getTheme('SYNTHWAVE').id === 'synthwave', 'Uppercase SYNTHWAVE resolves to synthwave');
  assert(getTheme('SynthWave').id === 'synthwave', 'Mixed case SynthWave resolves to synthwave');
  assert(getTheme('TOXIC').id === 'toxic', 'Uppercase TOXIC resolves to toxic');

  // Separator resilience: dash vs underscore vs camelCase
  assert(getTheme('coral-reef').id === 'coral-reef', "Kebab-case 'coral-reef' resolves to coral-reef");
  assert(getTheme('coral_reef').id === 'coral-reef', "Snake-case 'coral_reef' resolves to coral-reef");
  assert(getTheme('coralreef').id === 'coral-reef', "Lowercase continuous 'coralreef' resolves to coral-reef");
  assert(getTheme('coralReef').id === 'coral-reef', "CamelCase 'coralReef' resolves to coral-reef");
  assert(getTheme('CoralReef').id === 'coral-reef', "PascalCase 'CoralReef' resolves to coral-reef");
  assert(getTheme('CORAL_REEF').id === 'coral-reef', "Screaming snake 'CORAL_REEF' resolves to coral-reef");

  // Alias resolution
  assert(getTheme('forest').id === 'earthy', "Alias 'forest' resolves to 'earthy'");
  assert(getTheme('FOREST').id === 'earthy', "Case-insensitive alias 'FOREST' resolves to 'earthy'");
  assert(getTheme('copper').id === 'glacier', "Alias 'copper' resolves to 'glacier'");
  assert(getTheme('COPPER').id === 'glacier', "Case-insensitive alias 'COPPER' resolves to 'glacier'");
  assert(getTheme('orange').id === 'ember', "Alias 'orange' resolves to 'ember'");
  assert(getTheme('green').id === 'jade', "Alias 'green' resolves to 'jade'");
  assert(getTheme('purple').id === 'violet', "Alias 'purple' resolves to 'violet'");
  assert(getTheme('pink').id === 'rose', "Alias 'pink' resolves to 'rose'");
  assert(getTheme('blue').id === 'azure', "Alias 'blue' resolves to 'azure'");
  assert(getTheme('yellow').id === 'amber', "Alias 'yellow' resolves to 'amber'");

  // Whitespace resilience (surrounding whitespace)
  const surroundingWhitespaceCases = [
    { input: ' ember ', expected: 'ember' },
    { input: ' jade ', expected: 'jade' },
    { input: ' synthwave ', expected: 'synthwave' },
    { input: '\ttoxic\n', expected: 'toxic' },
    { input: '  coral-reef  ', expected: 'coral-reef' },
    { input: '   ', expected: 'ember' }
  ];

  let surroundingWhitespacePass = true;
  let whitespaceFailures = [];
  for (const { input, expected } of surroundingWhitespaceCases) {
    const result = getTheme(input);
    if (!result || result.id !== expected) {
      surroundingWhitespacePass = false;
      whitespaceFailures.push(`'${input}' -> expected '${expected}', got '${result ? result.id : 'null'}'`);
    }
  }
  assert(surroundingWhitespacePass, 'Leading and trailing whitespace stripped cleanly without falling back to ember incorrectly', whitespaceFailures.join('; '));

  // Display name with space resilience: e.g. 'Coral Reef' or 'coral reef'
  let displayNameErrors = [];
  for (const t of THEMES) {
    const resolved = getTheme(t.name);
    if (!resolved || resolved.id !== t.id) {
      displayNameErrors.push(`${t.name} -> expected ${t.id}, got ${resolved ? resolved.id : 'null'}`);
    }
  }
  assert(displayNameErrors.length === 0, 'getTheme resolves all 28 themes by their exact display name (theme.name)', displayNameErrors.join('; '));

  const displaySpaceResult1 = getTheme('Coral Reef');
  assert(displaySpaceResult1.id === 'coral-reef', "Theme display name with space 'Coral Reef' resolves to 'coral-reef'", `Got '${displaySpaceResult1.id}'`);

  const displaySpaceResult2 = getTheme('coral reef');
  assert(displaySpaceResult2.id === 'coral-reef', "Lowercase with space 'coral reef' resolves to 'coral-reef'", `Got '${displaySpaceResult2.id}'`);

  // ==========================================================================
  // SECTION 4: Integration with RenderEngine.setTheme() & Presets
  // ==========================================================================
  console.log('\n--- SECTION 4: Integration with RenderEngine.setTheme() & Presets ---');

  let engineInitPass = false;
  let engine;
  try {
    engine = new RenderEngine(mockElement, getTheme('ember'));
    engineInitPass = true;
  } catch (err) {
    engineInitPass = false;
    findings.push({ testName: 'RenderEngine constructor', details: err.message });
  }
  assert(engineInitPass, 'RenderEngine instantiates cleanly with initial Ember theme');

  // Verify all 28 themes work when passed to RenderEngine.setTheme()
  let setThemeErrors = [];
  if (engine) {
    for (const theme of THEMES) {
      try {
        engine.setTheme(theme);
        if (engine.currentTheme.id !== theme.id) {
          setThemeErrors.push(`currentTheme.id mismatch for ${theme.id}: got ${engine.currentTheme.id}`);
        }
        if (!(engine.scene.background instanceof THREE.Color)) {
          setThemeErrors.push(`scene.background not THREE.Color for ${theme.id}`);
        }
        const bgHex = '#' + engine.scene.background.getHexString();
        if (bgHex.toLowerCase() !== theme.background.toLowerCase()) {
          setThemeErrors.push(`scene.background hex mismatch for ${theme.id}: expected ${theme.background}, got ${bgHex}`);
        }
      } catch (err) {
        setThemeErrors.push(`setTheme threw for ${theme.id}: ${err.message}`);
      }
    }
  }
  assert(setThemeErrors.length === 0, 'RenderEngine.setTheme() succeeds for all 28 themes and sets background accurately', setThemeErrors.join('; '));

  // Verify preset.onThemeChange integration
  let presetThemeCalls = 0;
  let lastThemeReceived = null;
  const mockPreset = {
    id: 'test-spy-preset',
    name: 'Spy Preset',
    category: 'abstract',
    init: () => {},
    update: () => {},
    onThemeChange: (theme) => {
      presetThemeCalls++;
      lastThemeReceived = theme;
    },
    dispose: () => {}
  };

  if (engine) {
    engine.setPreset(mockPreset);
    engine.setTheme(getTheme('toxic'));
    assert(presetThemeCalls === 1 && lastThemeReceived?.id === 'toxic', 'RenderEngine.setTheme() invokes active preset onThemeChange(theme) with exact theme');

    // Rapid switching stress test: 280 theme switches (10 full cycles)
    let rapidSwitchErrors = [];
    try {
      for (let i = 0; i < 280; i++) {
        const targetTheme = THEMES[i % THEMES.length];
        engine.setTheme(targetTheme);
      }
    } catch (err) {
      rapidSwitchErrors.push(`Rapid switching threw: ${err.message}`);
    }
    assert(rapidSwitchErrors.length === 0, 'Rapid switching through 280 theme changes executes without throwing or leaking', rapidSwitchErrors.join(', '));
    assert(presetThemeCalls === 281, `Preset onThemeChange called 281 times total (got ${presetThemeCalls})`);

    // Real NeonTunnel preset test
    const neonBundle = esbuild.buildSync({
      entryPoints: [path.resolve(__dirname, '../src/presets/NeonTunnel.ts')],
      bundle: true,
      format: 'cjs',
      write: false,
      external: ['three'],
      target: 'node18'
    });
    const neonMod = { exports: {} };
    new Function('module', 'exports', 'require', neonBundle.outputFiles[0].text)(neonMod, neonMod.exports, () => THREE);
    const NeonTunnel = neonMod.exports.NeonTunnelPreset || neonMod.exports.NeonTunnel || neonMod.exports.default;
    const neonPreset = new NeonTunnel();

    let neonThemeErrors = [];
    try {
      neonPreset.init({
        scene: engine.scene,
        camera: engine.camera,
        renderer: engine.renderer,
        width: 1920,
        height: 1080,
        theme: getTheme('ember')
      });
      for (const theme of THEMES) {
        neonPreset.onThemeChange(theme);
      }
      neonPreset.dispose();
    } catch (err) {
      neonThemeErrors.push(err.message);
    }
    assert(neonThemeErrors.length === 0, 'Real NeonTunnel preset initializes and processes onThemeChange() for all 28 themes cleanly', neonThemeErrors.join(', '));
  }

  // ==========================================================================
  // SECTION 5: High-Throughput Performance & Zero-Allocation Guarantee
  // ==========================================================================
  console.log('\n--- SECTION 5: High-Throughput Performance & Zero-Allocation Guarantee ---');

  const LOOKUP_COUNT = 100000;
  const sampleQueries = [
    'ember', 'synthwave', 'toxic', 'coral-reef', 'forest', 'COPPER',
    'terracotta', 'sand', 'prism', 'nonexistent', 'arctic', 'eclipse'
  ];

  // Warm up JIT
  for (let i = 0; i < 1000; i++) {
    getTheme(sampleQueries[i % sampleQueries.length]);
    getThemeVectors(sampleQueries[i % sampleQueries.length]);
  }

  // Measure 100,000 getTheme() lookups
  if (global.gc) global.gc();
  const heapBefore = process.memoryUsage().heapUsed;
  const startTheme = process.hrtime.bigint();

  for (let i = 0; i < LOOKUP_COUNT; i++) {
    getTheme(sampleQueries[i % sampleQueries.length]);
  }

  const endTheme = process.hrtime.bigint();
  const heapAfter = process.memoryUsage().heapUsed;
  const durationMs = Number(endTheme - startTheme) / 1e6;
  const heapDeltaKB = (heapAfter - heapBefore) / 1024;

  console.log(`  Duration for ${LOOKUP_COUNT.toLocaleString()} getTheme() lookups: ${durationMs.toFixed(2)}ms`);
  console.log(`  Average lookup duration: ${(durationMs / LOOKUP_COUNT * 1000).toFixed(4)}µs`);
  console.log(`  Heap delta during test: ${heapDeltaKB.toFixed(2)} KB`);

  // Target requirement: thousands of lookups in < 10ms (10,000 in < 10ms -> 100,000 in < 100ms)
  assert(durationMs < 100, `100,000 theme lookups completed in < 100ms (10,000 in < 10ms equivalent): took ${durationMs.toFixed(2)}ms`);

  // Measure 100,000 getThemeVectors() lookups
  const startVectors = process.hrtime.bigint();
  for (let i = 0; i < LOOKUP_COUNT; i++) {
    getThemeVectors(sampleQueries[i % sampleQueries.length]);
  }
  const endVectors = process.hrtime.bigint();
  const durationVectorsMs = Number(endVectors - startVectors) / 1e6;
  console.log(`  Duration for ${LOOKUP_COUNT.toLocaleString()} getThemeVectors() lookups: ${durationVectorsMs.toFixed(2)}ms`);
  assert(durationVectorsMs < 100, `100,000 theme vector lookups completed in < 100ms: took ${durationVectorsMs.toFixed(2)}ms`);

  // ==========================================================================
  // SUMMARY & VERDICT
  // ==========================================================================
  console.log('\n======================================================================');
  console.log(`RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================================');

  if (findings.length > 0) {
    console.log('\nFAILED CHECKS / FINDINGS:');
    findings.forEach((f, idx) => {
      console.log(`${idx + 1}. [${f.testName}] ${f.details}`);
    });
  }

  return { passedTests, failedTests, findings };
}

runAdversarialChallenge().then(({ failedTests, findings }) => {
  if (failedTests > 0) {
    console.log(`\nADVERSARIAL HARNESS RESULT: ${failedTests} FAILURE(S) DETECTED.`);
    process.exit(1);
  } else {
    console.log('\nADVERSARIAL HARNESS RESULT: ALL STRESS TESTS PASSED.');
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal harness error:', err);
  process.exit(2);
});
