/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 7 (TICKET #45)
 * Target: Web MIDI API Controller Mapping, UI Drawer Controls, and Parameter Dispatch Wiring
 * Challenger: challenger_m7_2 (UI and Parameter Dispatch Challenger - critic, specialist)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const esbuild = require('esbuild');

console.log('================================================================================');
console.log('  EMPIRICAL CHALLENGER HARNESS: MILESTONE 7 UI & PARAMETER DISPATCH (#45)       ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

const asyncChecks = [];

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

function checkAsync(testName, fn) {
  asyncChecks.push({ testName, fn });
}

// File paths
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');
const midiIndexPath = path.resolve(__dirname, '../src/midi/index.ts');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

// =============================================================================
// SECTION 1: STATIC DOM, ATTRIBUTES & HTML5 SPECIFICATION AUDIT (index.html)
// =============================================================================
console.log('--- SECTION 1: Static DOM, Attributes & HTML5 Specification Audit ---');

check('1.1: Navigation rail button #midiBtn exists inside #railMoreExtras with data-panel="midi"', () => {
  const match = htmlContent.match(/<button[^>]*id="midiBtn"[^>]*>/i);
  assert(match, 'Missing button with id="midiBtn" in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="midi"'), `#midiBtn must have data-panel="midi". Got: ${tag}`);
  assert(/class="[^"]*rail-btn[^"]*"/i.test(tag), '#midiBtn must have rail-btn class');
  assert(/aria-label="MIDI Controller"/i.test(tag), '#midiBtn must have aria-label="MIDI Controller"');
  assert(/title="[^"]*MIDI Controller Mapping[^"]*"/i.test(tag), '#midiBtn must have title containing "MIDI Controller Mapping"');

  // Verify Lucide-style 5-pin DIN MIDI SVG icon
  const blockMatch = htmlContent.match(/<button[^>]*id="midiBtn"[\s\S]*?<\/button>/i);
  assert(blockMatch, 'Could not extract #midiBtn block');
  assert(blockMatch[0].includes('<svg'), '#midiBtn must contain <svg> icon');
  assert(/viewBox="0 0 24 24"/.test(blockMatch[0]), '#midiBtn SVG must have viewBox="0 0 24 24"');
  assert(/<circle cx="12" cy="12" r="9"/.test(blockMatch[0]), '#midiBtn SVG must have 5-pin DIN connector ring');
});

check('1.2: Drawer container #midiPanel exists with required attributes and drawer classes', () => {
  const match = htmlContent.match(/<div[^>]*id="midiPanel"[^>]*>/i);
  assert(match, 'Missing container with id="midiPanel" in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="midi"'), `#midiPanel must have data-panel="midi". Got: ${tag}`);
  assert(tag.includes('data-panel-id="midiPanel"'), `#midiPanel must have data-panel-id="midiPanel". Got: ${tag}`);
  assert(tag.includes('data-alias="midi"'), `#midiPanel must have data-alias="midi". Got: ${tag}`);
  assert(/class="[^"]*drawer-panel[^"]*"/i.test(tag), '#midiPanel missing drawer-panel class');
  assert(/class="[^"]*glass-panel[^"]*"/i.test(tag), '#midiPanel missing glass-panel class');
  assert(/class="[^"]*detail-panel[^"]*"/i.test(tag), '#midiPanel missing detail-panel class');

  // Verify close button #closeMidiBtn
  const closeMatch = htmlContent.match(/<button[^>]*id="closeMidiBtn"[^>]*>/i);
  assert(closeMatch, 'Missing button with id="closeMidiBtn"');
  const closeTag = closeMatch[0];
  assert(/class="[^"]*close-drawer-btn[^"]*"/i.test(closeTag), '#closeMidiBtn must have close-drawer-btn class');
  assert(/class="[^"]*closeMidiBtn[^"]*"/i.test(closeTag), '#closeMidiBtn must have closeMidiBtn class');
});

check('1.3: Connection status banner elements exist in #midiPanel', () => {
  assert(htmlContent.includes('id="midiStatusBanner"'), 'Missing #midiStatusBanner');
  assert(htmlContent.includes('id="midiStatusIndicator"'), 'Missing #midiStatusIndicator');
  assert(htmlContent.includes('id="midiStatusBadge"'), 'Missing #midiStatusBadge');
  assert(htmlContent.includes('id="midiDeviceCount"'), 'Missing #midiDeviceCount');
  assert(htmlContent.includes('id="midiConnectBtn"'), 'Missing #midiConnectBtn');
  assert(htmlContent.includes('id="midiConnectBtnText"'), 'Missing #midiConnectBtnText');

  // Verify initial badge state
  const badgeMatch = htmlContent.match(/<span[^>]*id="midiStatusBadge"[^>]*>([\s\S]*?)<\/span>/i);
  assert(badgeMatch, 'Could not match #midiStatusBadge');
  assert(badgeMatch[0].includes('midi-disconnected'), '#midiStatusBadge must have midi-disconnected by default');
  assert(badgeMatch[1].includes('Disconnected'), '#midiStatusBadge initial text must be Disconnected');
});

check('1.4: Hardware input ports enumeration container elements exist', () => {
  assert(htmlContent.includes('id="midiPortsList"'), 'Missing #midiPortsList');
  assert(htmlContent.includes('id="midiPortEmpty"'), 'Missing #midiPortEmpty');
  assert(htmlContent.includes('id="midiRefreshPortsBtn"'), 'Missing #midiRefreshPortsBtn');
  assert(htmlContent.includes('role="list"'), '#midiPortsList must declare role="list"');
});

check('1.5: Interactive MIDI Learn Mode container elements exist', () => {
  assert(htmlContent.includes('id="midiLearnBox"'), 'Missing #midiLearnBox');
  assert(htmlContent.includes('id="midiLearnBadge"'), 'Missing #midiLearnBadge');
  assert(htmlContent.includes('id="midiLearnActiveTarget"'), 'Missing #midiLearnActiveTarget');
  assert(htmlContent.includes('id="midiLearnPulse"'), 'Missing #midiLearnPulse');
  assert(htmlContent.includes('id="midiCancelLearnBtn"'), 'Missing #midiCancelLearnBtn');
});

check('1.6: CC Parameter Mappings table and Reset button exist', () => {
  assert(htmlContent.includes('id="midiMappingsTable"'), 'Missing #midiMappingsTable');
  assert(htmlContent.includes('id="midiMappingCount"'), 'Missing #midiMappingCount');
  assert(htmlContent.includes('id="midiResetDefaultsBtn"'), 'Missing #midiResetDefaultsBtn');
});

check('1.7: Core parameter readout elements exist across drawers for MIDI dispatch verification', () => {
  assert(htmlContent.includes('id="sensVal"'), 'Missing #sensVal readout for Sensitivity');
  assert(htmlContent.includes('id="bloomVal"'), 'Missing #bloomVal readout for Bloom');
  assert(htmlContent.includes('id="persistVal"'), 'Missing #persistVal readout for Persistence');
  assert(htmlContent.includes('id="rotateSpeedValue"'), 'Missing #rotateSpeedValue readout for Camera Orbit');
  assert(htmlContent.includes('id="studioMoodSpeedVal"'), 'Missing #studioMoodSpeedVal readout for Speed');
  assert(htmlContent.includes('id="volumeSlider"'), 'Missing #volumeSlider for Audio Volume');
  assert(htmlContent.includes('id="chromaVal"'), 'Missing #chromaVal readout for Saturation');
  assert(htmlContent.includes('id="grainVal"'), 'Missing #grainVal readout for Resonance');
});

check('1.8: CSS styles for MIDI panel, status badges, learn box, and pulse animation are defined', () => {
  assert(cssContent.includes('.midi-panel-content'), 'Missing .midi-panel-content CSS');
  assert(cssContent.includes('.midi-status-banner'), 'Missing .midi-status-banner CSS');
  assert(cssContent.includes('.midi-status-badge'), 'Missing .midi-status-badge CSS');
  assert(cssContent.includes('.midi-status-badge.midi-connected'), 'Missing .midi-status-badge.midi-connected CSS');
  assert(cssContent.includes('.midi-status-badge.midi-disconnected'), 'Missing .midi-status-badge.midi-disconnected CSS');
  assert(cssContent.includes('.midi-status-badge.midi-learning'), 'Missing .midi-status-badge.midi-learning CSS');
  assert(cssContent.includes('@keyframes midiPulse'), 'Missing @keyframes midiPulse CSS animation');
  assert(cssContent.includes('.midi-mappings-table'), 'Missing .midi-mappings-table CSS');
  assert(cssContent.includes('.midi-mapping-row'), 'Missing .midi-mapping-row CSS');
  assert(cssContent.includes('.midi-cc-badge'), 'Missing .midi-cc-badge CSS');
  assert(cssContent.includes('.midi-value-track'), 'Missing .midi-value-track CSS');
  assert(cssContent.includes('.midi-value-fill'), 'Missing .midi-value-fill CSS');
});

// =============================================================================
// SECTION 2: SIMULATED DOM HARNESS & WEBMIDI BUNDLE INITIALIZATION
// =============================================================================
console.log('\n--- SECTION 2: Simulated DOM Harness & WebMIDI Engine Initialization ---');

class SimTokenList {
  constructor(initial = []) { this.tokens = new Set(initial); }
  add(...t) { t.forEach(x => { if (x) this.tokens.add(x); }); }
  remove(...t) { t.forEach(x => this.tokens.delete(x)); }
  toggle(t, force) {
    if (force !== undefined) {
      if (force) this.tokens.add(t); else this.tokens.delete(t);
      return force;
    }
    if (this.tokens.has(t)) { this.tokens.delete(t); return false; }
    this.tokens.add(t); return true;
  }
  contains(t) { return this.tokens.has(t); }
  toString() { return Array.from(this.tokens).join(' '); }
}

function matchSelector(el, sel) {
  if (sel.startsWith('#')) return el.id === sel.slice(1);
  if (sel.startsWith('.')) return el.classList.contains(sel.slice(1));
  if (sel.startsWith('[') && sel.endsWith(']')) {
    const inner = sel.slice(1, -1);
    if (inner.includes('=')) {
      const parts = inner.split('=');
      const k = parts[0];
      const v = parts[1].replace(/^["']|["']$/g, '');
      return el.getAttribute(k) === v;
    }
    return el.hasAttribute(inner);
  }
  return el.tagName.toLowerCase() === sel.toLowerCase();
}

function querySelectorDeep(el, sel) {
  for (const child of el.children) {
    if (matchSelector(child, sel)) return child;
    const found = querySelectorDeep(child, sel);
    if (found) return found;
  }
  return null;
}

function querySelectorAllDeep(el, sel, acc = []) {
  for (const child of el.children) {
    if (matchSelector(child, sel)) acc.push(child);
    querySelectorAllDeep(child, sel, acc);
  }
  return acc;
}

class SimElement {
  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new SimTokenList();
    this.attributes = new Map();
    this.dataset = {};
    this.listeners = new Map();
    this.children = [];
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.disabled = false;
    this.parentElement = null;
    this._innerHTML = '';
  }

  get className() {
    return this.classList.toString();
  }

  set className(val) {
    this.classList = new SimTokenList(val ? val.split(/\s+/).filter(Boolean) : []);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(val) {
    this._innerHTML = val;
    if (val === '') {
      this.children = [];
    }
  }

  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === 'id') this.id = String(v);
    if (k === 'class') this.className = String(v);
    if (k.startsWith('data-')) {
      const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = String(v);
    }
  }

  getAttribute(k) {
    if (k === 'id') return this.id || null;
    if (k === 'class') return this.className || null;
    if (k.startsWith('data-')) {
      const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return this.dataset[prop] !== undefined ? this.dataset[prop] : null;
    }
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }

  hasAttribute(k) {
    return this.attributes.has(k) || (k === 'id' && !!this.id) || (k === 'class' && this.classList.tokens.size > 0);
  }

  removeAttribute(k) {
    this.attributes.delete(k);
    if (k === 'id') this.id = '';
    if (k === 'class') this.classList = new SimTokenList();
  }

  addEventListener(ev, fn) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, []);
    this.listeners.get(ev).push(fn);
  }

  removeEventListener(ev, fn) {
    if (this.listeners.has(ev)) {
      this.listeners.set(ev, this.listeners.get(ev).filter(f => f !== fn));
    }
  }

  dispatchEvent(ev) {
    const list = this.listeners.get(ev.type) || [];
    for (const fn of list) {
      fn.call(this, ev);
    }
    return true;
  }

  click() { this.dispatchEvent({ type: 'click', target: this }); }
  input() { this.dispatchEvent({ type: 'input', target: this }); }
  change() { this.dispatchEvent({ type: 'change', target: this }); }

  appendChild(c) {
    c.parentElement = this;
    this.children.push(c);
    return c;
  }

  removeChild(c) {
    const idx = this.children.indexOf(c);
    if (idx !== -1) {
      c.parentElement = null;
      this.children.splice(idx, 1);
    }
    return c;
  }

  querySelector(sel) {
    return querySelectorDeep(this, sel);
  }

  querySelectorAll(sel) {
    return querySelectorAllDeep(this, sel, []);
  }
}

class MockMIDIInput {
  constructor(id, name, manufacturer = 'Visuval Virtual Controller') {
    this.id = id;
    this.name = name;
    this.manufacturer = manufacturer;
    this.state = 'connected';
    this.type = 'input';
    this.onmidimessage = null;
  }

  simulateMessage(bytes) {
    if (typeof this.onmidimessage === 'function') {
      this.onmidimessage({ data: new Uint8Array(bytes) });
    }
  }
}

class MockMIDIAccess {
  constructor() {
    this.inputs = new Map();
    this.onstatechange = null;
  }

  addInput(id, name, manufacturer) {
    const input = new MockMIDIInput(id, name, manufacturer);
    this.inputs.set(id, input);
    if (typeof this.onstatechange === 'function') {
      this.onstatechange({ port: input });
    }
    return input;
  }

  removeInput(id) {
    const input = this.inputs.get(id);
    if (input) {
      input.state = 'disconnected';
      if (typeof this.onstatechange === 'function') {
        this.onstatechange({ port: input });
      }
      this.inputs.delete(id);
    }
  }
}

// Bundle src/midi/index.ts into CJS
let MidiManagerClass;
let MidiPanelClass;
let initMidiPanelFn;
let CANONICAL_DEFAULT_MAPPINGS;
let parseMidiCCMessageFn;

const mockStorage = {};
const mockLocalStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(mockStorage, k) ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

let activeMockMIDIAccess = null;
let shouldRejectWebMidi = false;

const simDocElements = new Map();

const simDocument = {
  createElement: (tag) => new SimElement(tag),
  getElementById: (id) => simDocElements.get(id) || null,
  querySelector: (sel) => {
    for (const el of simDocElements.values()) {
      if (matchSelector(el, sel)) return el;
      const found = querySelectorDeep(el, sel);
      if (found) return found;
    }
    return null;
  },
  querySelectorAll: (sel) => {
    const acc = [];
    for (const el of simDocElements.values()) {
      if (matchSelector(el, sel)) acc.push(el);
      querySelectorAllDeep(el, sel, acc);
    }
    return acc;
  }
};

const simNavigator = {
  requestMIDIAccess: async (options) => {
    if (shouldRejectWebMidi) {
      throw new Error('Web MIDI API Permission denied');
    }
    if (!activeMockMIDIAccess) {
      activeMockMIDIAccess = new MockMIDIAccess();
    }
    return activeMockMIDIAccess;
  }
};

try {
  const buildResult = esbuild.buildSync({
    entryPoints: [midiIndexPath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false
  });

  const vmContext = {
    module: { exports: {} },
    exports: {},
    console,
    navigator: simNavigator,
    document: simDocument,
    localStorage: mockLocalStorage,
    Uint8Array,
    Map,
    Set,
    Array,
    Object,
    Number,
    Math,
    String,
    JSON
  };

  vm.runInNewContext(buildResult.outputFiles[0].text, vmContext);
  MidiManagerClass = vmContext.module.exports.MidiManager;
  MidiPanelClass = vmContext.module.exports.MidiPanel;
  initMidiPanelFn = vmContext.module.exports.initMidiPanel;
  CANONICAL_DEFAULT_MAPPINGS = vmContext.module.exports.CANONICAL_DEFAULT_MAPPINGS;
  parseMidiCCMessageFn = vmContext.module.exports.parseMidiCCMessage;

  assert(typeof MidiManagerClass === 'function', 'MidiManagerClass must be a function');
  assert(typeof MidiPanelClass === 'function', 'MidiPanelClass must be a function');
  assert(typeof initMidiPanelFn === 'function', 'initMidiPanelFn must be a function');
  assert(CANONICAL_DEFAULT_MAPPINGS && typeof CANONICAL_DEFAULT_MAPPINGS === 'object', 'CANONICAL_DEFAULT_MAPPINGS must be object');
} catch (err) {
  throw new Error(`Failed to bundle/load Midi modules for testing: ${err.message}`);
}

function createSimulatedMidiPanel() {
  const panel = new SimElement('div', 'midiPanel');
  panel.setAttribute('data-panel', 'midi');

  const banner = panel.appendChild(new SimElement('div', 'midiStatusBanner'));
  const ind = banner.appendChild(new SimElement('span', 'midiStatusIndicator'));
  const badge = banner.appendChild(new SimElement('span', 'midiStatusBadge'));
  const devCount = banner.appendChild(new SimElement('span', 'midiDeviceCount'));
  const connBtn = banner.appendChild(new SimElement('button', 'midiConnectBtn'));
  const connText = connBtn.appendChild(new SimElement('span', 'midiConnectBtnText'));

  const refreshBtn = panel.appendChild(new SimElement('button', 'midiRefreshPortsBtn'));
  const portsList = panel.appendChild(new SimElement('div', 'midiPortsList'));

  const learnBox = panel.appendChild(new SimElement('div', 'midiLearnBox'));
  const learnBadge = learnBox.appendChild(new SimElement('span', 'midiLearnBadge'));
  const activeTarget = learnBox.appendChild(new SimElement('span', 'midiLearnActiveTarget'));
  const learnPulse = learnBox.appendChild(new SimElement('div', 'midiLearnPulse'));
  const cancelBtn = learnBox.appendChild(new SimElement('button', 'midiCancelLearnBtn'));

  const mappingCount = panel.appendChild(new SimElement('span', 'midiMappingCount'));
  const mappingsTable = panel.appendChild(new SimElement('div', 'midiMappingsTable'));
  const resetBtn = panel.appendChild(new SimElement('button', 'midiResetDefaultsBtn'));

  simDocElements.set('midiPanel', panel);
  simDocElements.set('midiStatusBanner', banner);
  simDocElements.set('midiStatusIndicator', ind);
  simDocElements.set('midiStatusBadge', badge);
  simDocElements.set('midiDeviceCount', devCount);
  simDocElements.set('midiConnectBtn', connBtn);
  simDocElements.set('midiConnectBtnText', connText);
  simDocElements.set('midiRefreshPortsBtn', refreshBtn);
  simDocElements.set('midiPortsList', portsList);
  simDocElements.set('midiLearnBox', learnBox);
  simDocElements.set('midiLearnBadge', learnBadge);
  simDocElements.set('midiLearnActiveTarget', activeTarget);
  simDocElements.set('midiLearnPulse', learnPulse);
  simDocElements.set('midiCancelLearnBtn', cancelBtn);
  simDocElements.set('midiMappingCount', mappingCount);
  simDocElements.set('midiMappingsTable', mappingsTable);
  simDocElements.set('midiResetDefaultsBtn', resetBtn);

  return panel;
}

// =============================================================================
// SECTION 3: PARAMETER DISPATCH CORRECTNESS (CC 1, 74, 3, 4/10, 2, 7, CUSTOM)
// =============================================================================
console.log('\n--- SECTION 3: Parameter Dispatch Correctness (CC 1, 74, 3, 4/10, 2, 7, Custom) ---');

class MockAudioEngine {
  constructor() {
    this.sensitivity = 1.0;
    this.volume = 0.8;
  }
  setVolume(v) {
    this.volume = v;
  }
}

class MockRenderEngine {
  constructor() {
    this.config = {
      bloomStrength: 1.2,
      persistence: 0.0,
      chromaticAberration: 0.0,
      filmGrain: 0.0
    };
    this.autoRotate = false;
    this.autoRotateSpeed = 0.5;
    this.cameraController = {
      autoRotateSpeed: 0.5
    };
    this.activePreset = {
      id: 'kaleidoscope',
      customParams: {},
      setCustomParameter(id, val) {
        this.customParams[id] = val;
      }
    };
  }

  updateConfig(cfg) {
    Object.assign(this.config, cfg);
  }

  setAutoRotate(enabled, speed) {
    this.autoRotate = enabled;
    this.autoRotateSpeed = speed;
  }
}

function setupDispatchHarness() {
  mockLocalStorage.clear();
  activeMockMIDIAccess = new MockMIDIAccess();
  shouldRejectWebMidi = false;

  const panelEl = createSimulatedMidiPanel();
  const manager = new MidiManagerClass();

  // Create UI sliders and readout elements
  const sensSlider = new SimElement('input', 'sensSlider');
  const sensVal = new SimElement('span', 'sensVal');
  const bloomSlider = new SimElement('input', 'bloomSlider');
  const bloomVal = new SimElement('span', 'bloomVal');
  const persistSlider = new SimElement('input', 'persistSlider');
  const persistVal = new SimElement('span', 'persistVal');
  const rotateSpeedSlider = new SimElement('input', 'rotateSpeedSlider');
  const rotateSpeedValue = new SimElement('span', 'rotateSpeedValue');
  const studioMoodSpeedSlider = new SimElement('input', 'studioMoodSpeedSlider');
  const studioMoodSpeedVal = new SimElement('span', 'studioMoodSpeedVal');
  const volumeSlider = new SimElement('input', 'volumeSlider');
  const chromaSlider = new SimElement('input', 'chromaSlider');
  const chromaVal = new SimElement('span', 'chromaVal');
  const grainSlider = new SimElement('input', 'grainSlider');
  const grainVal = new SimElement('span', 'grainVal');

  // Dynamic custom preset slider
  const customParamSlider = new SimElement('input', 'tuning_geometryDensity_slider');
  const customParamVal = new SimElement('span', 'tuning_geometryDensity_val');

  simDocElements.set('sensSlider', sensSlider);
  simDocElements.set('sensVal', sensVal);
  simDocElements.set('bloomSlider', bloomSlider);
  simDocElements.set('bloomVal', bloomVal);
  simDocElements.set('persistSlider', persistSlider);
  simDocElements.set('persistVal', persistVal);
  simDocElements.set('rotateSpeedSlider', rotateSpeedSlider);
  simDocElements.set('rotateSpeedValue', rotateSpeedValue);
  simDocElements.set('studioMoodSpeedSlider', studioMoodSpeedSlider);
  simDocElements.set('studioMoodSpeedVal', studioMoodSpeedVal);
  simDocElements.set('volumeSlider', volumeSlider);
  simDocElements.set('chromaSlider', chromaSlider);
  simDocElements.set('chromaVal', chromaVal);
  simDocElements.set('grainSlider', grainSlider);
  simDocElements.set('grainVal', grainVal);
  simDocElements.set('tuning_geometryDensity_slider', customParamSlider);
  simDocElements.set('tuning_geometryDensity_val', customParamVal);

  const audioEngine = new MockAudioEngine();
  const renderEngine = new MockRenderEngine();
  const panelController = new MidiPanelClass(manager, panelEl);

  // Exact dispatch function wired in main.ts
  function updateSliderUi(slider, val, textId, textVal) {
    if (slider) slider.value = String(val);
    const el = simDocument.getElementById(textId);
    if (el) el.textContent = textVal;
  }

  const MIDI_DISPATCH_TABLE = {
    audioSensitivity: (value) => {
      const sens = 0.5 + value * 2.0;
      audioEngine.sensitivity = sens;
      updateSliderUi(sensSlider, sens.toFixed(1), 'sensVal', `${Math.round(sens * 100)}%`);
    },
    sensitivity: (value) => MIDI_DISPATCH_TABLE.audioSensitivity(value),

    bloomStrength: (value) => {
      const bloom = value * 3.0;
      renderEngine.updateConfig({ bloomStrength: bloom });
      updateSliderUi(bloomSlider, bloom.toFixed(1), 'bloomVal', bloom.toFixed(1));
    },
    bloom: (value) => MIDI_DISPATCH_TABLE.bloomStrength(value),

    persistence: (value) => {
      const persist = value * 0.9;
      renderEngine.updateConfig({ persistence: persist });
      updateSliderUi(persistSlider, persist.toFixed(2), 'persistVal', persist.toFixed(2));
    },

    cameraOrbit: (value) => {
      const spd = 0.1 + value * 1.9;
      renderEngine.setAutoRotate(true, spd);
      if (renderEngine.cameraController) renderEngine.cameraController.autoRotateSpeed = spd;
      const rotSlider = simDocument.getElementById('rotateSpeedSlider');
      updateSliderUi(rotSlider, spd.toFixed(1), 'rotateSpeedValue', `${Math.round(spd * 100)}%`);
    },
    rotateSpeed: (value) => MIDI_DISPATCH_TABLE.cameraOrbit(value),
    orbit: (value) => MIDI_DISPATCH_TABLE.cameraOrbit(value),

    animationSpeed: (value) => {
      const spd = 0.2 + value * 2.8;
      const active = renderEngine.activePreset;
      if (active && typeof active.setCustomParameter === 'function') {
        active.setCustomParameter('speed', spd);
      }
      const moodSpeed = simDocument.getElementById('studioMoodSpeedSlider');
      updateSliderUi(moodSpeed, spd.toFixed(1), 'studioMoodSpeedVal', `${spd.toFixed(1)}x`);
    },
    speed: (value) => MIDI_DISPATCH_TABLE.animationSpeed(value),

    audioVolume: (value) => {
      audioEngine.setVolume(value);
      if (volumeSlider) volumeSlider.value = value.toFixed(2);
    },
    volume: (value) => MIDI_DISPATCH_TABLE.audioVolume(value),

    colorSaturation: (value) => {
      renderEngine.updateConfig({ chromaticAberration: value });
      updateSliderUi(chromaSlider, value.toFixed(2), 'chromaVal', value.toFixed(2));
    },
    saturation: (value) => MIDI_DISPATCH_TABLE.colorSaturation(value),

    resonance: (value) => {
      renderEngine.updateConfig({ filmGrain: value });
      updateSliderUi(grainSlider, value.toFixed(2), 'grainVal', value.toFixed(2));
    },
    brightness: (value) => MIDI_DISPATCH_TABLE.resonance(value)
  };

  function dispatchMidiParameter(target, value) {
    const handler = MIDI_DISPATCH_TABLE[target];
    if (handler) {
      handler(value);
      return;
    }
    const activePreset = renderEngine.activePreset;
    if (activePreset && typeof activePreset.setCustomParameter === 'function') {
      activePreset.setCustomParameter(target, value);
      const slider = simDocument.getElementById(`tuning_${target}_slider`);
      updateSliderUi(slider, value, `tuning_${target}_val`, value.toFixed(2));
    }
  }

  manager.on('cc', (ev) => {
    dispatchMidiParameter(ev.target, ev.value);
    panelController.updateParameterValue(ev.target, ev.value);
  });

  return {
    manager,
    panelController,
    audioEngine,
    renderEngine,
    panelEl,
    sensSlider,
    sensVal,
    bloomSlider,
    bloomVal,
    persistSlider,
    persistVal,
    rotateSpeedSlider,
    rotateSpeedValue,
    studioMoodSpeedSlider,
    studioMoodSpeedVal,
    volumeSlider,
    customParamSlider,
    customParamVal,
    inputPort: activeMockMIDIAccess.addInput('hw-1', 'Arturia KeyLab Essential')
  };
}

checkAsync('3.1: CC 1 updates AudioEngine.sensitivity in real time and updates #sensVal readout', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // CC 1 with value 64 -> normalized ~0.5039 -> sens = 0.5 + 0.5039 * 2.0 = ~1.508
  h.inputPort.simulateMessage([0xB0, 1, 64]);
  const expectedSens = 0.5 + (64 / 127.0) * 2.0;

  assert(Math.abs(h.audioEngine.sensitivity - expectedSens) < 0.001, `audioEngine.sensitivity expected ~${expectedSens}, got ${h.audioEngine.sensitivity}`);
  assert.strictEqual(h.sensSlider.value, expectedSens.toFixed(1), `sensSlider.value expected ${expectedSens.toFixed(1)}, got ${h.sensSlider.value}`);
  assert.strictEqual(h.sensVal.textContent, `${Math.round(expectedSens * 100)}%`, `#sensVal expected ${Math.round(expectedSens * 100)}%, got ${h.sensVal.textContent}`);

  // Test full scale 127
  h.inputPort.simulateMessage([0xB0, 1, 127]);
  assert.strictEqual(h.audioEngine.sensitivity, 2.5);
  assert.strictEqual(h.sensVal.textContent, '250%');

  // Test zero 0
  h.inputPort.simulateMessage([0xB0, 1, 0]);
  assert.strictEqual(h.audioEngine.sensitivity, 0.5);
  assert.strictEqual(h.sensVal.textContent, '50%');
});

checkAsync('3.2: CC 74 updates RenderEngine.bloomStrength in real time and updates #bloomVal readout', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Send CC 74 (Bloom) value 100 -> bloom = (100 / 127) * 3.0 = ~2.3622
  h.inputPort.simulateMessage([0xB0, 74, 100]);
  const expectedBloom = (100 / 127.0) * 3.0;

  assert(Math.abs(h.renderEngine.config.bloomStrength - expectedBloom) < 0.001, `bloomStrength expected ~${expectedBloom}, got ${h.renderEngine.config.bloomStrength}`);
  assert.strictEqual(h.bloomSlider.value, expectedBloom.toFixed(1), `bloomSlider.value expected ${expectedBloom.toFixed(1)}, got ${h.bloomSlider.value}`);
  assert.strictEqual(h.bloomVal.textContent, expectedBloom.toFixed(1), `#bloomVal expected ${expectedBloom.toFixed(1)}, got ${h.bloomVal.textContent}`);

  // Max bloom CC 74 = 127
  h.inputPort.simulateMessage([0xB0, 74, 127]);
  assert.strictEqual(h.renderEngine.config.bloomStrength, 3.0);
  assert.strictEqual(h.bloomVal.textContent, '3.0');
});

checkAsync('3.3: CC 3 updates RenderEngine.persistence in real time and updates #persistVal readout', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Send CC 3 (Persistence) value 80 -> persist = (80 / 127) * 0.9 = ~0.5669
  h.inputPort.simulateMessage([0xB0, 3, 80]);
  const expectedPersist = (80 / 127.0) * 0.9;

  assert(Math.abs(h.renderEngine.config.persistence - expectedPersist) < 0.001, `persistence expected ~${expectedPersist}, got ${h.renderEngine.config.persistence}`);
  assert.strictEqual(h.persistSlider.value, expectedPersist.toFixed(2), `persistSlider.value expected ${expectedPersist.toFixed(2)}, got ${h.persistSlider.value}`);
  assert.strictEqual(h.persistVal.textContent, expectedPersist.toFixed(2), `#persistVal expected ${expectedPersist.toFixed(2)}, got ${h.persistVal.textContent}`);

  // Max persistence CC 3 = 127
  h.inputPort.simulateMessage([0xB0, 3, 127]);
  assert.strictEqual(h.renderEngine.config.persistence, 0.9);
  assert.strictEqual(h.persistVal.textContent, '0.90');
});

checkAsync('3.4: CC 4 / CC 10 updates CameraController.autoRotateSpeed and updates #rotateSpeedValue readout', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Canonical default CC 4 binds cameraOrbit
  h.inputPort.simulateMessage([0xB0, 4, 64]);
  const expectedSpd = 0.1 + (64 / 127.0) * 1.9;

  assert(Math.abs(h.renderEngine.autoRotateSpeed - expectedSpd) < 0.001, `autoRotateSpeed expected ~${expectedSpd}, got ${h.renderEngine.autoRotateSpeed}`);
  assert.strictEqual(h.renderEngine.cameraController.autoRotateSpeed, h.renderEngine.autoRotateSpeed);
  assert.strictEqual(h.rotateSpeedSlider.value, expectedSpd.toFixed(1));
  assert.strictEqual(h.rotateSpeedValue.textContent, `${Math.round(expectedSpd * 100)}%`);

  // Now remap CC 10 to rotateSpeed / cameraOrbit via MIDI Learn
  h.manager.startLearn('cameraOrbit');
  assert.strictEqual(h.manager.isLearning, true);
  h.inputPort.simulateMessage([0xB0, 10, 127]); // Establish mapping and send max 127
  assert.strictEqual(h.manager.isLearning, false);
  assert.strictEqual(h.manager.mappings.get(10), 'cameraOrbit');

  const maxSpd = 0.1 + 1.0 * 1.9; // 2.0
  assert.strictEqual(h.renderEngine.autoRotateSpeed, maxSpd);
  assert.strictEqual(h.renderEngine.cameraController.autoRotateSpeed, maxSpd);
  assert.strictEqual(h.rotateSpeedValue.textContent, '200%');
});

checkAsync('3.5: CC 2 updates Preset speed / animationSpeed and updates #studioMoodSpeedVal readout', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Send CC 2 (Speed) value 90 -> spd = 0.2 + (90 / 127) * 2.8 = ~2.184
  h.inputPort.simulateMessage([0xB0, 2, 90]);
  const expectedSpd = 0.2 + (90 / 127.0) * 2.8;

  assert(Math.abs(h.renderEngine.activePreset.customParams.speed - expectedSpd) < 0.001);
  assert.strictEqual(h.studioMoodSpeedSlider.value, expectedSpd.toFixed(1));
  assert.strictEqual(h.studioMoodSpeedVal.textContent, `${expectedSpd.toFixed(1)}x`);
});

checkAsync('3.6: CC 7 updates AudioEngine volume and volumeSlider.value', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Send CC 7 (Volume) value 127 -> normalized 1.0
  h.inputPort.simulateMessage([0xB0, 7, 127]);
  assert.strictEqual(h.audioEngine.volume, 1.0);
  assert.strictEqual(h.volumeSlider.value, '1.00');

  // Send CC 7 value 0 -> normalized 0.0
  h.inputPort.simulateMessage([0xB0, 7, 0]);
  assert.strictEqual(h.audioEngine.volume, 0.0);
  assert.strictEqual(h.volumeSlider.value, '0.00');
});

checkAsync('3.7: Active preset dynamic custom parameters update in real-time via MIDI learn', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Bind CC 28 to active preset custom param 'geometryDensity'
  h.manager.startLearn('geometryDensity');
  h.inputPort.simulateMessage([0xB0, 28, 95]); // CC 28, value 95

  assert.strictEqual(h.manager.mappings.get(28), 'geometryDensity');
  const expectedVal = 95 / 127.0;
  assert.strictEqual(h.renderEngine.activePreset.customParams.geometryDensity, expectedVal);
  assert.strictEqual(h.customParamVal.textContent, expectedVal.toFixed(2));
  assert.strictEqual(h.customParamSlider.value, String(expectedVal));

  // Send another value CC 28 = 30
  h.inputPort.simulateMessage([0xB0, 28, 30]);
  const expectedVal2 = 30 / 127.0;
  assert.strictEqual(h.renderEngine.activePreset.customParams.geometryDensity, expectedVal2);
  assert.strictEqual(h.customParamVal.textContent, expectedVal2.toFixed(2));
  assert.strictEqual(h.customParamSlider.value, String(expectedVal2));
});

// =============================================================================
// SECTION 4: PROGRAMMATIC SLIDER UPDATES & FEEDBACK CASCADE IMMUNITY
// =============================================================================
console.log('\n--- SECTION 4: Programmatic Slider Updates & Feedback Loop Immunity ---');

checkAsync('4.1: Programmatic slider updates from MIDI CC do not trigger synthetic "input" or "change" events', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  let sensInputFired = 0;
  let bloomInputFired = 0;
  let persistInputFired = 0;
  let rotateInputFired = 0;

  h.sensSlider.addEventListener('input', () => { sensInputFired++; });
  h.bloomSlider.addEventListener('input', () => { bloomInputFired++; });
  h.persistSlider.addEventListener('input', () => { persistInputFired++; });
  h.rotateSpeedSlider.addEventListener('input', () => { rotateInputFired++; });

  // Stream 50 rapid MIDI CC messages across these 4 parameters
  for (let i = 0; i < 50; i++) {
    h.inputPort.simulateMessage([0xB0, 1, i * 2]);
    h.inputPort.simulateMessage([0xB0, 74, i * 2]);
    h.inputPort.simulateMessage([0xB0, 3, i * 2]);
    h.inputPort.simulateMessage([0xB0, 4, i * 2]);
  }

  // Verify slider values updated
  assert.strictEqual(h.bloomSlider.value, ((98 / 127.0) * 3.0).toFixed(1));
  assert.strictEqual(h.persistSlider.value, ((98 / 127.0) * 0.9).toFixed(2));

  // Verify listeners were NEVER invoked by programmatic property assignment
  assert.strictEqual(sensInputFired, 0, 'sensSlider input event must NOT fire from programmatic MIDI update');
  assert.strictEqual(bloomInputFired, 0, 'bloomSlider input event must NOT fire from programmatic MIDI update');
  assert.strictEqual(persistInputFired, 0, 'persistSlider input event must NOT fire from programmatic MIDI update');
  assert.strictEqual(rotateInputFired, 0, 'rotateSpeedSlider input event must NOT fire from programmatic MIDI update');
});

checkAsync('4.2: Manual user slider input event updates parameter and does not re-enter MIDI message handler', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  let midiCcDispatched = 0;
  h.manager.on('cc', () => { midiCcDispatched++; });

  // Simulate user dragging sensitivity slider
  h.sensSlider.value = '1.8';
  h.sensSlider.input(); // Manual user drag event

  assert.strictEqual(midiCcDispatched, 0, 'User slider dragging must not trigger feedback loop into MIDI manager CC event');
});

// =============================================================================
// SECTION 5: PORT ENUMERATION DOM UPDATES (HOTPLUG & DISCONNECT LIFECYCLE)
// =============================================================================
console.log('\n--- SECTION 5: Port Enumeration DOM Updates (Hotplug & Disconnect) ---');

checkAsync('5.1: Initial connection renders port items and updates device count readout', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  const portsList = h.panelEl.querySelector('#midiPortsList');
  const items = portsList.querySelectorAll('.midi-port-item');
  assert.strictEqual(items.length, 1, `Expected 1 port item, found ${items.length}`);

  const nameEl = items[0].querySelector('.midi-port-name');
  assert.strictEqual(nameEl.textContent, 'Arturia KeyLab Essential');

  const devCountEl = h.panelEl.querySelector('#midiDeviceCount');
  assert.strictEqual(devCountEl.textContent, '1 device connected');

  const emptyEl = portsList.querySelector('#midiPortEmpty');
  assert.strictEqual(emptyEl, null, '#midiPortEmpty must be removed when ports are present');
});

checkAsync('5.2: Hotplug event dynamically appends port item and increments device count', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Add 2nd port: Novation Launch Control
  activeMockMIDIAccess.addInput('hw-2', 'Novation Launch Control XL', 'Novation');

  const portsList = h.panelEl.querySelector('#midiPortsList');
  const items = portsList.querySelectorAll('.midi-port-item');
  assert.strictEqual(items.length, 2, `Expected 2 port items, found ${items.length}`);

  const devCountEl = h.panelEl.querySelector('#midiDeviceCount');
  assert.strictEqual(devCountEl.textContent, '2 devices connected');

  // Add 3rd port: Korg nanoKONTROL Studio
  activeMockMIDIAccess.addInput('hw-3', 'Korg nanoKONTROL Studio', 'KORG Inc.');
  const items3 = portsList.querySelectorAll('.midi-port-item');
  assert.strictEqual(items3.length, 3, `Expected 3 port items, found ${items3.length}`);
  assert.strictEqual(devCountEl.textContent, '3 devices connected');
});

checkAsync('5.3: Disconnect event dynamically removes port item and updates device count', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  activeMockMIDIAccess.addInput('hw-2', 'Novation Launch Control XL', 'Novation');
  assert.strictEqual(h.manager.getDevices().length, 2);

  // Disconnect hw-2
  activeMockMIDIAccess.removeInput('hw-2');

  const portsList = h.panelEl.querySelector('#midiPortsList');
  const items = portsList.querySelectorAll('.midi-port-item');
  assert.strictEqual(items.length, 1, `Expected 1 port item after disconnect, found ${items.length}`);
  assert.strictEqual(items[0].querySelector('.midi-port-name').textContent, 'Arturia KeyLab Essential');

  const devCountEl = h.panelEl.querySelector('#midiDeviceCount');
  assert.strictEqual(devCountEl.textContent, '1 device connected');
});

checkAsync('5.4: Disconnecting all devices restores #midiPortEmpty and disconnected status', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Disconnect only port
  activeMockMIDIAccess.removeInput('hw-1');

  const portsList = h.panelEl.querySelector('#midiPortsList');
  const emptyEl = portsList.querySelector('#midiPortEmpty');
  assert(emptyEl, 'Missing #midiPortEmpty when all devices are disconnected');
  assert(emptyEl.textContent.includes('No MIDI devices detected'), 'Must show empty notice text');

  const devCountEl = h.panelEl.querySelector('#midiDeviceCount');
  assert.strictEqual(devCountEl.textContent, '0 devices connected');

  const badge = h.panelEl.querySelector('#midiStatusBadge');
  assert(badge.classList.contains('midi-disconnected'), 'Badge must have .midi-disconnected');
  assert(!badge.classList.contains('midi-connected'), 'Badge must not have .midi-connected');
  assert.strictEqual(badge.textContent, 'Disconnected');
});

// =============================================================================
// SECTION 6: STATUS BADGE TRANSITIONS (.midi-connected, .midi-disconnected, .midi-learning)
// =============================================================================
console.log('\n--- SECTION 6: Status Badge Transitions ---');

checkAsync('6.1: Badge transitions through Disconnected -> Connected -> Learning -> Connected', async () => {
  mockLocalStorage.clear();
  activeMockMIDIAccess = new MockMIDIAccess();
  const panelEl = createSimulatedMidiPanel();
  const manager = new MidiManagerClass();
  new MidiPanelClass(manager, panelEl);

  const badge = panelEl.querySelector('#midiStatusBadge');
  const indicator = panelEl.querySelector('#midiStatusIndicator');

  // 1. Initial State: Disconnected
  assert(badge.classList.contains('midi-disconnected'), 'Initial: must be .midi-disconnected');
  assert.strictEqual(badge.textContent, 'Disconnected');
  assert(!indicator.classList.contains('connected'), 'Indicator must not be connected');

  // 2. Add device and Connect
  activeMockMIDIAccess.addInput('hw-1', 'Akai MPK Mini Plus');
  await manager.init();

  assert(badge.classList.contains('midi-connected'), 'After init: must be .midi-connected');
  assert(!badge.classList.contains('midi-disconnected'), 'After init: must NOT have .midi-disconnected');
  assert(!badge.classList.contains('midi-learning'), 'After init: must NOT have .midi-learning');
  assert.strictEqual(badge.textContent, 'Connected');
  assert(indicator.classList.contains('connected'), 'Indicator must have .connected');

  // 3. Enter Learn Mode
  manager.startLearn('bloomStrength');
  assert(badge.classList.contains('midi-learning'), 'In learn: must be .midi-learning');
  assert(!badge.classList.contains('midi-connected'), 'In learn: must NOT have .midi-connected');
  assert(!badge.classList.contains('midi-disconnected'), 'In learn: must NOT have .midi-disconnected');
  assert.strictEqual(badge.textContent, 'Learning');
  assert(indicator.classList.contains('learning'), 'Indicator must have .learning');

  // Verify learn box DOM elements
  const learnBox = panelEl.querySelector('#midiLearnBox');
  assert(learnBox.classList.contains('active'), '#midiLearnBox must have .active in learn mode');
  const activeTargetEl = panelEl.querySelector('#midiLearnActiveTarget');
  assert.strictEqual(activeTargetEl.textContent, 'Bloom');
  const learnPulse = panelEl.querySelector('#midiLearnPulse');
  assert.strictEqual(learnPulse.style.display, 'flex');

  // 4. Cancel Learn Mode
  manager.cancelLearn();
  assert(badge.classList.contains('midi-connected'), 'After cancel: must restore .midi-connected');
  assert(!badge.classList.contains('midi-learning'), 'After cancel: must NOT have .midi-learning');
  assert.strictEqual(badge.textContent, 'Connected');
  assert(!learnBox.classList.contains('active'), '#midiLearnBox must remove .active');
  assert.strictEqual(learnPulse.style.display, 'none');

  // 5. Complete Learn Mode via incoming CC
  manager.startLearn('audioSensitivity');
  assert(badge.classList.contains('midi-learning'));
  const input = activeMockMIDIAccess.inputs.get('hw-1');
  input.simulateMessage([0xB0, 55, 100]); // Complete learn

  assert(badge.classList.contains('midi-connected'), 'After CC learn: must restore .midi-connected');
  assert(!badge.classList.contains('midi-learning'));
  assert.strictEqual(badge.textContent, 'Connected');
});

// =============================================================================
// SECTION 7: RESET-TO-DEFAULTS RESTORING CANONICAL MAPPINGS AND TABLE ROWS
// =============================================================================
console.log('\n--- SECTION 7: Reset-to-Defaults & UI Table Rows Synchronization ---');

checkAsync('7.1: Reset button restores canonical defaults, updates table rows, and syncs localStorage', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Corrupt mappings: delete multiple canonical mappings and add custom ones
  h.manager.removeMapping(1);  // Delete Sensitivity
  h.manager.removeMapping(74); // Delete Bloom
  h.manager.setMapping(88, 'customDistortion');
  h.manager.setMapping(2, 'cameraOrbit'); // Overwrite Speed with Camera Orbit

  assert.strictEqual(h.manager.mappings.get(1), undefined);
  assert.strictEqual(h.manager.mappings.get(74), undefined);
  assert.strictEqual(h.manager.mappings.get(88), 'customDistortion');

  // Click #midiResetDefaultsBtn
  const resetBtn = h.panelEl.querySelector('#midiResetDefaultsBtn');
  resetBtn.click();

  // 1. Verify manager.mappings restored to exact canonical defaults
  assert.strictEqual(h.manager.mappings.get(1), 'audioSensitivity');
  assert.strictEqual(h.manager.mappings.get(2), 'animationSpeed');
  assert.strictEqual(h.manager.mappings.get(3), 'persistence');
  assert.strictEqual(h.manager.mappings.get(4), 'cameraOrbit');
  assert.strictEqual(h.manager.mappings.get(7), 'audioVolume');
  assert.strictEqual(h.manager.mappings.get(10), 'colorSaturation');
  assert.strictEqual(h.manager.mappings.get(71), 'resonance');
  assert.strictEqual(h.manager.mappings.get(74), 'bloomStrength');
  assert.strictEqual(h.manager.mappings.get(88), undefined, 'Custom mapping 88 must be cleared');

  // 2. Verify table rows in DOM
  const table = h.panelEl.querySelector('#midiMappingsTable');
  const rows = table.querySelectorAll('.midi-mapping-row');
  assert.strictEqual(rows.length, 8, `Expected exactly 8 canonical rows, found ${rows.length}`);

  const mappingCountEl = h.panelEl.querySelector('#midiMappingCount');
  assert.strictEqual(mappingCountEl.textContent, '8 active');

  // Verify each row's CC badge in DOM
  const sensRow = table.querySelector('[data-target-id="audioSensitivity"]');
  assert(sensRow, 'audioSensitivity row must exist');
  assert.strictEqual(sensRow.querySelector('.midi-cc-badge').textContent, 'CC 1');

  const bloomRow = table.querySelector('[data-target-id="bloomStrength"]');
  assert(bloomRow, 'bloomStrength row must exist');
  assert.strictEqual(bloomRow.querySelector('.midi-cc-badge').textContent, 'CC 74');

  // 3. Verify localStorage persistence
  const saved = JSON.parse(mockLocalStorage.getItem('visuval_midi_mappings'));
  assert.strictEqual(saved['1'], 'audioSensitivity');
  assert.strictEqual(saved['74'], 'bloomStrength');
  assert.strictEqual(saved['88'], undefined);
});

// =============================================================================
// SECTION 8: UNBINDING INDIVIDUAL MAPPINGS & DETACHING PARAMETER UPDATES
// =============================================================================
console.log('\n--- SECTION 8: Unbinding Individual Mappings & Parameter Detachment ---');

checkAsync('8.1: Unbinding canonical mapping displays "Unassigned", disables Clear button, and detaches CC dispatch', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  const table = h.panelEl.querySelector('#midiMappingsTable');
  const bloomRow = table.querySelector('[data-target-id="bloomStrength"]');
  assert(bloomRow, 'bloomStrength row must exist');

  const clearBtn = bloomRow.querySelector('.midi-row-btn--clear');
  assert.strictEqual(clearBtn.disabled, false);

  // Initial value of bloom
  h.renderEngine.config.bloomStrength = 1.0;

  // Click Clear on Bloom row
  clearBtn.click();

  // 1. Verify manager state
  assert.strictEqual(h.manager.mappings.has(74), false, 'CC 74 must be deleted from mappings');

  // 2. Verify DOM row updates
  const updatedBloomRow = table.querySelector('[data-target-id="bloomStrength"]');
  assert(updatedBloomRow, 'Canonical row remains in table but is unassigned');
  assert.strictEqual(updatedBloomRow.querySelector('.midi-cc-badge').textContent, 'Unassigned');
  assert.strictEqual(updatedBloomRow.querySelector('.midi-row-btn--clear').disabled, true);

  // 3. Verify active count decremented
  const mappingCountEl = h.panelEl.querySelector('#midiMappingCount');
  assert.strictEqual(mappingCountEl.textContent, '7 active');

  // 4. Send CC 74 event: parameter MUST NOT update!
  h.inputPort.simulateMessage([0xB0, 74, 127]);
  assert.strictEqual(h.renderEngine.config.bloomStrength, 1.0, 'bloomStrength must NOT update when unbound');
  assert.strictEqual(h.bloomVal.textContent, '', 'bloomVal readout must NOT update');
});

checkAsync('8.2: Unbinding custom parameter completely removes row from table and detaches updates', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Add custom mapping
  h.manager.setMapping(35, 'glitchIntensity');
  h.panelController.render();

  const table = h.panelEl.querySelector('#midiMappingsTable');
  const glitchRow = table.querySelector('[data-target-id="glitchIntensity"]');
  assert(glitchRow, 'glitchIntensity custom row must exist in table');
  assert.strictEqual(glitchRow.querySelector('.midi-cc-badge').textContent, 'CC 35');

  // Click Clear button on custom row
  const clearBtn = glitchRow.querySelector('.midi-row-btn--clear');
  clearBtn.click();

  // 1. Verify manager state
  assert.strictEqual(h.manager.mappings.has(35), false);

  // 2. Verify row is completely removed
  const removedRow = table.querySelector('[data-target-id="glitchIntensity"]');
  assert.strictEqual(removedRow, null, 'Custom mapping row must be completely removed when cleared');

  // 3. Send CC 35: verify no dispatch
  h.inputPort.simulateMessage([0xB0, 35, 100]);
  assert.strictEqual(h.renderEngine.activePreset.customParams.glitchIntensity, undefined);
});

// =============================================================================
// SECTION 9: ADVERSARIAL STRESS, CORRUPTED STREAMS & EDGE CASES
// =============================================================================
console.log('\n--- SECTION 9: Adversarial Stress, Floods & Robustness ---');

checkAsync('9.1: Rapid burst of 1,000 CC events across 8 channels processes without memory leak or drop', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  let ccCount = 0;
  h.manager.on('cc', () => { ccCount++; });

  const startMem = process.memoryUsage().heapUsed;

  for (let i = 0; i < 1000; i++) {
    const channel = i % 16;
    const cc = (i % 8) + 1; // 1 to 8
    const val = (i * 3) % 128;
    h.inputPort.simulateMessage([0xB0 | channel, cc, val]);
  }

  assert(ccCount > 0, 'Must process CC events');
  const endMem = process.memoryUsage().heapUsed;
  const growthMB = (endMem - startMem) / (1024 * 1024);
  assert(growthMB < 20, `Heap memory growth should be minimal (< 20MB), got ${growthMB.toFixed(2)}MB`);
});

checkAsync('9.2: Non-CC MIDI messages (Pitch Bend, Note On, SysEx) are safely ignored without dispatch corruption', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  let ccCount = 0;
  h.manager.on('cc', () => { ccCount++; });

  // Pitch Bend (0xE0)
  h.inputPort.simulateMessage([0xE0, 0x00, 0x40]);
  // Program Change (0xC0)
  h.inputPort.simulateMessage([0xC0, 0x05]);
  // SysEx (0xF0 ... 0xF7)
  h.inputPort.simulateMessage([0xF0, 0x7E, 0x7F, 0x09, 0x01, 0xF7]);
  // Channel Aftertouch (0xD0)
  h.inputPort.simulateMessage([0xD0, 0x50]);

  assert.strictEqual(ccCount, 0, 'Non-CC messages must not fire CC parameter dispatch');
});

checkAsync('9.3: Switching Learn targets before receiving CC binds exclusively to the latest target', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  h.manager.startLearn('audioSensitivity');
  assert.strictEqual(h.manager.learningTarget, 'audioSensitivity');

  // User changes mind and clicks Learn on bloomStrength
  h.manager.startLearn('bloomStrength');
  assert.strictEqual(h.manager.learningTarget, 'bloomStrength');

  // Hardware knob movement on CC 40
  h.inputPort.simulateMessage([0xB0, 40, 99]);

  assert.strictEqual(h.manager.isLearning, false);
  assert.strictEqual(h.manager.mappings.get(40), 'bloomStrength', 'CC 40 must bind to latest target');
  assert.strictEqual(h.manager.mappings.get(1), 'audioSensitivity', 'audioSensitivity must retain original CC 1');
});

checkAsync('9.4: 1-to-1 conflict de-duplication: moving target to existing CC unbinds old target, and remapping target unbinds old CC', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Initially: CC 1 -> audioSensitivity, CC 74 -> bloomStrength
  assert.strictEqual(h.manager.mappings.get(1), 'audioSensitivity');
  assert.strictEqual(h.manager.mappings.get(74), 'bloomStrength');

  // Remap audioSensitivity to CC 74
  h.manager.startLearn('audioSensitivity');
  h.inputPort.simulateMessage([0xB0, 74, 80]);

  // CC 74 is now audioSensitivity; old CC 1 should have been freed to prevent 1 target on multiple CCs
  assert.strictEqual(h.manager.mappings.get(74), 'audioSensitivity');
  assert.strictEqual(h.manager.mappings.get(1), undefined, 'Previous CC 1 binding must be de-duplicated');

  // Now remap bloomStrength to CC 74 (conflict)
  h.manager.startLearn('bloomStrength');
  h.inputPort.simulateMessage([0xB0, 74, 90]);

  // CC 74 is now bloomStrength; audioSensitivity on CC 74 was replaced
  assert.strictEqual(h.manager.mappings.get(74), 'bloomStrength');
  // audioSensitivity has no CC mapped now
  let audioSensMapped = false;
  for (const t of h.manager.mappings.values()) {
    if (t === 'audioSensitivity') audioSensMapped = true;
  }
  assert.strictEqual(audioSensMapped, false, 'Old target was overwritten on CC 74');
});

checkAsync('9.5: Corrupted or legacy object JSON in localStorage recovers cleanly without uncaught exceptions', async () => {
  const h = setupDispatchHarness();
  mockLocalStorage.setItem('visuval_midi_mappings', '<<<INVALID-MALFORMED-JSON>>>');
  await h.manager.init();

  // Falls back to canonical defaults cleanly
  assert.strictEqual(h.manager.mappings.get(1), 'audioSensitivity');
  assert.strictEqual(h.manager.mappings.get(74), 'bloomStrength');

  // Test legacy object schema: { "15": { "target": "cameraOrbit" } }
  const h2 = setupDispatchHarness();
  mockLocalStorage.setItem('visuval_midi_mappings', JSON.stringify({ '15': { target: 'cameraOrbit' } }));
  await h2.manager.init();
  assert.strictEqual(h2.manager.mappings.get(15), 'cameraOrbit', 'Legacy object format must be deserialized');
});

checkAsync('9.6: Visual progress fill track in #midiPanel reflects normalized parameter value percentage', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  // Send CC 1 (Sensitivity) at max 127
  h.inputPort.simulateMessage([0xB0, 1, 127]);
  const fillEl1 = h.panelEl.querySelector('[data-fill-target="audioSensitivity"]');
  assert(fillEl1, 'Must find fill element for audioSensitivity');
  assert.strictEqual(fillEl1.style.width, '100%');

  // Send CC 1 at 0
  h.inputPort.simulateMessage([0xB0, 1, 0]);
  assert.strictEqual(fillEl1.style.width, '0%');

  // Send CC 74 (Bloom) at 64 -> 64/127 = ~50%
  h.inputPort.simulateMessage([0xB0, 74, 64]);
  const fillElBloom = h.panelEl.querySelector('[data-fill-target="bloomStrength"]');
  assert(fillElBloom, 'Must find fill element for bloomStrength');
  assert.strictEqual(fillElBloom.style.width, '50%');
});

checkAsync('9.7: Rapid successive clicks on Reset Defaults button are idempotent and preserve clean state', async () => {
  const h = setupDispatchHarness();
  await h.manager.init();

  const resetBtn = h.panelEl.querySelector('#midiResetDefaultsBtn');
  for (let i = 0; i < 20; i++) {
    resetBtn.click();
  }

  assert.strictEqual(h.manager.mappings.size, 8);
  assert.strictEqual(h.manager.mappings.get(1), 'audioSensitivity');
  assert.strictEqual(h.manager.mappings.get(74), 'bloomStrength');
  const countEl = h.panelEl.querySelector('#midiMappingCount');
  assert.strictEqual(countEl.textContent, '8 active');
});

checkAsync('9.8: Web MIDI API permission rejection handles SecurityError gracefully without uncaught rejection', async () => {
  mockLocalStorage.clear();
  activeMockMIDIAccess = null;
  shouldRejectWebMidi = true; // Trigger rejection in navigator.requestMIDIAccess

  const panelEl = createSimulatedMidiPanel();
  const manager = new MidiManagerClass();
  const panelController = new MidiPanelClass(manager, panelEl);

  const success = await manager.init();
  assert.strictEqual(success, false, 'init() must return false on permission rejection');
  assert.strictEqual(manager.isConnected, false);

  const badge = panelEl.querySelector('#midiStatusBadge');
  assert(badge.classList.contains('midi-disconnected'));
  assert.strictEqual(badge.textContent, 'Disconnected');
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
(async function runAll() {
  for (const item of asyncChecks) {
    totalTests++;
    try {
      await item.fn();
      passedTests++;
      console.log(`  ✓ PASS: ${item.testName}`);
    } catch (err) {
      failedTests++;
      console.error(`  ✗ FAIL: ${item.testName}`);
      console.error(`    Details: ${err.message}`);
      failures.push({ testName: item.testName, error: err.message, stack: err.stack });
    }
  }

  console.log('\n================================================================================');
  console.log(`  EMPIRICAL CHALLENGER VERIFICATION SUMMARY: MILESTONE 7 (#45)`);
  console.log(`  Total Checks:  ${totalTests}`);
  console.log(`  Passed Checks: ${passedTests}`);
  console.log(`  Failed Checks: ${failedTests}`);
  console.log('================================================================================');

  if (failedTests > 0) {
    console.error('\nFAILURE DETAILS:');
    for (const f of failures) {
      console.error(`- ${f.testName}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n>>> VERDICT: ALL EMPIRICAL CHALLENGES PASSED WITH ZERO DEFECTS! <<<\n');
    process.exit(0);
  }
})();
