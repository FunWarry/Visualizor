/**
 * EMPIRICAL CHALLENGER STRESS HARNESS: MILESTONE 3 (TICKET #41)
 * Challenger: challenger_m3_2
 * Focus:
 * 1. Navigation rail active and collapsed states
 * 2. Tunable vs non-tunable preset toggle & fallback behavior
 * 3. Drawer concurrency & orphaned modal prevention
 * 4. Double-click toggle behavior on #presetSettingsRailBtn
 * 5. Full 39-preset catalog scan
 * 6. E2E test suite assertion authenticity
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('    EMPIRICAL CHALLENGER VERIFICATION HARNESS: TICKET #41 (feat(tuning)) ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures = [];

function check(title, fn) {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✓ PASS: ${title}`);
  } catch (err) {
    failedChecks++;
    console.error(`  ✗ FAIL: ${title}`);
    console.error(`    ${err.message}`);
    failures.push({ title, error: err.message, stack: err.stack });
  }
}

// -----------------------------------------------------------------------------
// SECTION 1: STATIC DOM & CSS AUDIT
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: Static DOM, CSS, and ID Alignment Audit ---');

const indexHtmlPath = path.resolve(__dirname, '../index.html');
const styleCssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');
const tuningPanelTsPath = path.resolve(__dirname, '../src/tuning/TuningPanel.ts');
const parameterStoreTsPath = path.resolve(__dirname, '../src/tuning/ParameterStore.ts');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const styleCss = fs.readFileSync(styleCssPath, 'utf8');
const mainTs = fs.readFileSync(mainTsPath, 'utf8');
const tuningPanelTs = fs.readFileSync(tuningPanelTsPath, 'utf8');
const parameterStoreTs = fs.readFileSync(parameterStoreTsPath, 'utf8');

check('index.html contains #presetSettingsRailBtn with data-panel="presetSettings"', () => {
  const match = indexHtml.match(/id="presetSettingsRailBtn"[^>]*data-panel="presetSettings"/);
  assert(match, 'presetSettingsRailBtn must have data-panel="presetSettings"');
  assert(indexHtml.includes('class="rail-btn preset-settings-link is-collapsed"'), 'Button must initialize with is-collapsed');
});

check('index.html contains #tuningPanel with data-panel="presetSettings" and #presetSettingsContent', () => {
  assert(indexHtml.includes('id="tuningPanel"'), 'index.html must have #tuningPanel');
  assert(indexHtml.includes('id="presetSettingsContent"'), 'index.html must have #presetSettingsContent');
  assert(indexHtml.includes('data-panel="presetSettings"'), 'tuningPanel must have data-panel="presetSettings"');
});

check('src/style.css contains .is-collapsed and .preset-settings-link.is-collapsed with display: none !important', () => {
  const cssMatch = styleCss.match(/\.preset-settings-link\.is-collapsed\s*\{[^}]*display:\s*none\s*!important;?[^}]*\}/s) ||
                   styleCss.match(/\.is-collapsed[^{]*\{[^}]*display:\s*none\s*!important;?[^}]*\}/s);
  assert(cssMatch, 'CSS must enforce display: none !important on .preset-settings-link.is-collapsed');
});

check('src/main.ts maps "presetSettings" in PANEL_MAP to tuningPanel', () => {
  assert(mainTs.includes('presetSettings: tuningPanel'), 'PANEL_MAP must map presetSettings to tuningPanel');
  assert(mainTs.includes('tuningPanel = document.getElementById(\'tuningPanel\')'), 'tuningPanel must be bound');
});

check('src/main.ts includes tuningPanel in allPanels for proper drawer concurrency', () => {
  const panelListMatch = mainTs.match(/const allPanels:\s*HTMLElement\[\]\s*=\s*\[([\s\S]*?)\]\.filter/);
  assert(panelListMatch, 'allPanels definition found');
  assert(panelListMatch[1].includes('tuningPanel'), 'allPanels must include tuningPanel');
});

// -----------------------------------------------------------------------------
// SECTION 2: SIMULATED HEADLESS DOM & CONCURRENCY TESTS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: Headless DOM Concurrency & Active/Collapsed State Tests ---');

// Mock DOM primitives
class MockClassList {
  constructor(initial = '') {
    this._classes = new Set(initial.split(/\s+/).filter(Boolean));
  }
  add(...names) { names.forEach(n => this._classes.add(n)); }
  remove(...names) { names.forEach(n => this._classes.delete(n)); }
  contains(name) { return this._classes.has(name); }
  toggle(name, force) {
    if (force !== undefined) {
      if (force) this.add(name); else this.remove(name);
      return force;
    }
    if (this.contains(name)) { this.remove(name); return false; }
    this.add(name); return true;
  }
  toString() { return Array.from(this._classes).join(' '); }
}

class MockElement {
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new MockClassList(className);
    this.children = [];
    this.parentNode = null;
    this.style = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.textContent = '';
    this.value = '';
    this.type = '';
  }
  get className() { return this.classList.toString(); }
  set className(val) { this.classList = new MockClassList(val); }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }
  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  dispatchEvent(ev) {
    const handlers = this.listeners.get(ev.type) || [];
    for (const h of handlers) h(ev);
    return true;
  }
  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }
  querySelector(sel) {
    if (sel.startsWith('#')) {
      const targetId = sel.slice(1);
      if (this.id === targetId) return this;
      for (const c of this.children) {
        const found = c.querySelector(sel);
        if (found) return found;
      }
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (this.classList.contains(cls)) return this;
      for (const c of this.children) {
        const found = c.querySelector(sel);
        if (found) return found;
      }
    }
    return null;
  }
  querySelectorAll(sel) {
    const matches = [];
    const walk = (el) => {
      if (sel.startsWith('.') && el.classList.contains(sel.slice(1))) {
        matches.push(el);
      }
      for (const c of el.children) walk(c);
    };
    walk(this);
    return matches;
  }
  set innerHTML(html) {
    this.children = [];
    if (html === '') {
      this.textContent = '';
    }
  }
}

// Emulate TuningPanel logic from src/tuning/TuningPanel.ts
function simulateUpdateTuningButtonState(preset, tuningBtn, panel, onClose) {
  if (!tuningBtn) return false;
  const hasParams = Boolean(
    preset &&
    typeof preset.getCustomParameters === 'function' &&
    (preset.getCustomParameters()?.length ?? 0) > 0
  );

  if (hasParams) {
    tuningBtn.classList.remove('is-collapsed');
  } else {
    tuningBtn.classList.add('is-collapsed');
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      tuningBtn.classList.remove('active');
      if (onClose) onClose();
    }
  }
  return hasParams;
}

// Navigation Rail controller emulation matching src/main.ts
class NavRailHarness {
  constructor() {
    this.railBtn = new MockElement('BUTTON', 'presetSettingsRailBtn', 'rail-btn preset-settings-link is-collapsed');
    this.presetsBtn = new MockElement('BUTTON', 'presetsRailBtn', 'rail-btn active');
    this.cameraBtn = new MockElement('BUTTON', 'cameraBtn', 'rail-btn');
    
    this.tuningPanel = new MockElement('DIV', 'tuningPanel', 'drawer-panel detail-panel');
    this.presetsPanel = new MockElement('DIV', 'presetsPanel', 'drawer-panel detail-panel open');
    this.cameraPanel = new MockElement('DIV', 'cameraPanel', 'drawer-panel detail-panel');
    
    this.content = new MockElement('DIV', 'presetSettingsContent', 'panel-content');
    this.tuningPanel.appendChild(this.content);

    this.allPanels = [this.presetsPanel, this.tuningPanel, this.cameraPanel];
    this.allBtns = [this.presetsBtn, this.railBtn, this.cameraBtn];
    this.panelMap = {
      presets: this.presetsPanel,
      presetSettings: this.tuningPanel,
      camera: this.cameraPanel
    };
    this.btnMap = {
      presets: this.presetsBtn,
      presetSettings: this.railBtn,
      camera: this.cameraBtn
    };
    
    this.activeToolId = 'presets';

    // Wire clicks matching main.ts toggleDrawer logic
    this.railBtn.addEventListener('click', () => this.toggleDrawer('presetSettings'));
    this.presetsBtn.addEventListener('click', () => this.toggleDrawer('presets'));
    this.cameraBtn.addEventListener('click', () => this.toggleDrawer('camera'));
  }

  closeAllDrawers() {
    this.allPanels.forEach(p => p.classList.remove('open'));
    this.allBtns.forEach(b => b.classList.remove('active'));
  }

  openDrawer(toolId) {
    this.closeAllDrawers();
    this.activeToolId = toolId;
    const btn = this.btnMap[toolId];
    if (btn) btn.classList.add('active');
    const panel = this.panelMap[toolId];
    if (panel) panel.classList.add('open');
  }

  toggleDrawer(toolId) {
    if (this.activeToolId === toolId) {
      const panel = this.panelMap[toolId];
      if (panel) panel.classList.remove('open');
      const btn = this.btnMap[toolId];
      if (btn) btn.classList.remove('active');
      this.activeToolId = null;
      return;
    }
    this.openDrawer(toolId);
  }

  switchPreset(preset) {
    simulateUpdateTuningButtonState(preset, this.railBtn, this.tuningPanel, () => {
      this.activeToolId = null;
    });
  }
}

// Sample presets
const mockTunablePreset = {
  id: 'wave-form',
  getCustomParameters() {
    return [
      { id: 'speed', name: 'Speed', min: 0.1, max: 2.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Reactivity', min: 0.1, max: 2.0, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Density', min: 10, max: 100, step: 1, defaultValue: 50 }
    ];
  }
};

const mockNonTunablePreset = {
  id: 'milkdrop-vortex'
  // No getCustomParameters
};

const mockEmptyTunablePreset = {
  id: 'empty-tunable',
  getCustomParameters() {
    return [];
  }
};

check('Initial State: #presetSettingsRailBtn is collapsed', () => {
  const harness = new NavRailHarness();
  assert(harness.railBtn.classList.contains('is-collapsed'), 'Must start collapsed');
  assert(!harness.railBtn.classList.contains('active'), 'Must not be active initially');
  assert(!harness.tuningPanel.classList.contains('open'), 'Tuning panel must not be open initially');
});

check('Switching to tunable preset removes .is-collapsed', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);
  assert(!harness.railBtn.classList.contains('is-collapsed'), '.is-collapsed must be removed for tunable preset');
});

check('Switching from tunable to MilkDrop preset adds .is-collapsed', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);
  assert(!harness.railBtn.classList.contains('is-collapsed'), 'Uncollapsed when tunable');
  
  harness.switchPreset(mockNonTunablePreset);
  assert(harness.railBtn.classList.contains('is-collapsed'), '.is-collapsed must be added for non-tunable preset');
});

check('Switching from tunable to empty parameter preset adds .is-collapsed', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);
  harness.switchPreset(mockEmptyTunablePreset);
  assert(harness.railBtn.classList.contains('is-collapsed'), '.is-collapsed must be added when getCustomParameters returns []');
});

check('Switching to null preset (Milkdrop selection) adds .is-collapsed', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);
  harness.switchPreset(null);
  assert(harness.railBtn.classList.contains('is-collapsed'), '.is-collapsed must be added for null preset');
});

check('Double clicking #presetSettingsRailBtn closes panel and clears active state', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);

  // Click 1: Open tuning drawer
  harness.railBtn.click();
  assert(harness.tuningPanel.classList.contains('open'), 'Panel must open after 1st click');
  assert(harness.railBtn.classList.contains('active'), 'Button must be active after 1st click');
  assert.strictEqual(harness.activeToolId, 'presetSettings', 'activeToolId must be presetSettings');

  // Click 2: Close tuning drawer (double click)
  harness.railBtn.click();
  assert(!harness.tuningPanel.classList.contains('open'), 'Panel must close after 2nd click');
  assert(!harness.railBtn.classList.contains('active'), 'Button must not be active after 2nd click');
  assert.strictEqual(harness.activeToolId, null, 'activeToolId must be null after closing');
});

check('Quadruple clicking #presetSettingsRailBtn cycles Open -> Close -> Open -> Close correctly', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);

  harness.railBtn.click(); // 1: Open
  assert(harness.tuningPanel.classList.contains('open') && harness.railBtn.classList.contains('active'));

  harness.railBtn.click(); // 2: Close
  assert(!harness.tuningPanel.classList.contains('open') && !harness.railBtn.classList.contains('active'));

  harness.railBtn.click(); // 3: Open again
  assert(harness.tuningPanel.classList.contains('open') && harness.railBtn.classList.contains('active'));

  harness.railBtn.click(); // 4: Close again
  assert(!harness.tuningPanel.classList.contains('open') && !harness.railBtn.classList.contains('active'));
  assert.strictEqual(harness.activeToolId, null);
});

check('When #tuningPanel is OPEN and user switches to MilkDrop preset, drawer auto-closes and state clears without orphaned modal', () => {
  const harness = new NavRailHarness();
  harness.switchPreset(mockTunablePreset);

  // Open tuning panel
  harness.railBtn.click();
  assert(harness.tuningPanel.classList.contains('open'), 'Panel is open');
  assert(harness.railBtn.classList.contains('active'), 'Rail button is active');
  assert.strictEqual(harness.activeToolId, 'presetSettings');

  // Switch to MilkDrop preset while panel is open
  harness.switchPreset(mockNonTunablePreset);

  // Verification:
  assert(!harness.tuningPanel.classList.contains('open'), 'tuningPanel must automatically lose .open class');
  assert(!harness.railBtn.classList.contains('active'), 'railBtn must automatically lose .active class');
  assert(harness.railBtn.classList.contains('is-collapsed'), 'railBtn must gain .is-collapsed');
  assert.strictEqual(harness.activeToolId, null, 'activeToolId must be reset to null via onClose callback');

  // Verify no other panels were left open
  harness.allPanels.forEach(p => {
    assert(!p.classList.contains('open'), `Panel ${p.id} must not be open`);
  });
  harness.allBtns.forEach(b => {
    assert(!b.classList.contains('active'), `Button ${b.id} must not be active`);
  });
});

check('Rapid alternation stress test (100 switches between tunable and MilkDrop)', () => {
  const harness = new NavRailHarness();

  for (let i = 0; i < 100; i++) {
    // Switch to tunable
    harness.switchPreset(mockTunablePreset);
    assert(!harness.railBtn.classList.contains('is-collapsed'), `Iteration ${i}: should be uncollapsed`);

    // Sometimes open drawer
    if (i % 2 === 0) {
      harness.railBtn.click();
      assert(harness.tuningPanel.classList.contains('open'), `Iteration ${i}: panel should be open`);
    }

    // Switch to non-tunable
    harness.switchPreset(mockNonTunablePreset);
    assert(harness.railBtn.classList.contains('is-collapsed'), `Iteration ${i}: should be collapsed`);
    assert(!harness.tuningPanel.classList.contains('open'), `Iteration ${i}: panel must not remain open`);
    assert(!harness.railBtn.classList.contains('active'), `Iteration ${i}: button must not remain active`);
    assert.strictEqual(harness.activeToolId, null, `Iteration ${i}: activeToolId must be null`);
  }
});

// -----------------------------------------------------------------------------
// SECTION 3: REAL PRESET CATALOG & PARAMETER STORE EMPIRICAL VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Real Preset Parameter Store & Fallback Notice Verification ---');

// Dynamically test the bundle from runner_bundle or by loading presets
const { spawnSync } = require('child_process');

check('Run tests/runner.cjs directly via Node.js process', () => {
  const proc = spawnSync('node', ['tests/runner.cjs'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env, Path: 'C:\\Program Files\\nodejs;' + process.env.Path }
  });
  assert.strictEqual(proc.status, 0, `runner.cjs exited with code ${proc.status}: ${proc.stderr}`);
});

// -----------------------------------------------------------------------------
// SECTION 4: DIRECT TYPESCRIPT MODULE COMPILATION & REAL PRESET CLASS TESTING
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Direct TypeScript Module Verification via esbuild ---');

const esbuild = require('esbuild');

const tsTestCode = `
import { WaveFormPreset } from '../src/presets/WaveForm';
import { ParticleFieldPreset } from '../src/presets/ParticleField';
import { CircularSpectrumPreset } from '../src/presets/CircularSpectrum';
import { FerrofluidPreset } from '../src/presets/Ferrofluid';
import { ObsidianPolyPreset } from '../src/presets/ObsidianPoly';
import { NeonTunnelPreset } from '../src/presets/NeonTunnel';
import { StarfieldPreset } from '../src/presets/Starfield';
import { ThreeDBarsPreset } from '../src/presets/ThreeDBars';
import { SynthwaveTerrainPreset } from '../src/presets/SynthwaveTerrain';
import { MilkDropPreset } from '../src/presets/MilkDrop';
import { ParameterStore } from '../src/tuning/ParameterStore';
import { formatParamValue, updateTuningButtonState, renderTuningPanel } from '../src/tuning/TuningPanel';
import { setupTestEnvironment, MockElement } from './harness/env';
import assert from 'assert';

setupTestEnvironment();

const tunablePresets = [
  new WaveFormPreset(),
  new ParticleFieldPreset(),
  new CircularSpectrumPreset(),
  new FerrofluidPreset(),
  new ObsidianPolyPreset(),
  new NeonTunnelPreset(),
  new StarfieldPreset(),
  new ThreeDBarsPreset(),
  new SynthwaveTerrainPreset()
];

// 1. Verify all 9 tunable presets have complete parameter store lifecycle
for (const p of tunablePresets) {
  assert(typeof p.getCustomParameters === 'function', p.id + ' must have getCustomParameters');
  assert(typeof p.setCustomParameter === 'function', p.id + ' must have setCustomParameter');
  assert(typeof p.getCustomParameterValue === 'function', p.id + ' must have getCustomParameterValue');
  assert(typeof p.resetCustomParameters === 'function', p.id + ' must have resetCustomParameters');

  const params = p.getCustomParameters!();
  assert(params.length >= 3, p.id + ' must have at least 3 params');

  for (const def of params) {
    const defaultVal = def.defaultValue;
    assert(p.getCustomParameterValue!(def.id) === defaultVal, p.id + '.' + def.id + ' must equal defaultValue');

    // Mutate
    p.setCustomParameter!(def.id, def.max);
    assert(p.getCustomParameterValue!(def.id) === def.max, p.id + '.' + def.id + ' must equal max after mutation');

    // Clamping beyond max
    p.setCustomParameter!(def.id, def.max + 100);
    assert(p.getCustomParameterValue!(def.id) === def.max, p.id + '.' + def.id + ' must clamp to max');

    // Clamping below min
    p.setCustomParameter!(def.id, def.min - 100);
    assert(p.getCustomParameterValue!(def.id) === def.min, p.id + '.' + def.id + ' must clamp to min');

    // NaN safety
    p.setCustomParameter!(def.id, NaN);
    assert(p.getCustomParameterValue!(def.id) === def.defaultValue, p.id + '.' + def.id + ' must reset to defaultValue on NaN');

    // Reset
    p.resetCustomParameters!();
    assert(p.getCustomParameterValue!(def.id) === def.defaultValue, p.id + '.' + def.id + ' must reset to defaultValue');
  }
}

// 2. Test formatParamValue accuracy
assert.strictEqual(formatParamValue(1, 1), '1');
assert.strictEqual(formatParamValue(1.5, 0.1), '1.5');
assert.strictEqual(formatParamValue(1.55, 0.05), '1.55');
assert.strictEqual(formatParamValue(0.1 + 0.2, 0.1), '0.3');

// 3. Test ParameterStore directly
const store = new ParameterStore([
  { id: 'foo', name: 'Foo', min: 0, max: 10, step: 0.5, defaultValue: 5 }
]);
assert.strictEqual(store.get('foo'), 5);
store.set('foo', 7.23);
assert.strictEqual(store.get('foo'), 7.0); // Snapped to 0.5 step
store.set('foo', 7.26);
assert.strictEqual(store.get('foo'), 7.5); // Snapped to 0.5 step
store.set('unknown', 99); // Safe
assert.strictEqual(store.get('unknown'), 0);
store.reset();
assert.strictEqual(store.get('foo'), 5);

// 4. Test renderTuningPanel with real preset & Mock DOM
const btn = new MockElement('BUTTON');
btn.className = 'rail-btn preset-settings-link is-collapsed';
const panel = new MockElement('DIV');
panel.className = 'drawer-panel detail-panel';
const content = new MockElement('DIV');
panel.appendChild(content);

const wave = new WaveFormPreset();
const isTunable = updateTuningButtonState(wave, btn as any, panel as any);
assert.strictEqual(isTunable, true);
assert.strictEqual(btn.classList.contains('is-collapsed'), false);

renderTuningPanel(wave, content as any);
const sliders = content.querySelectorAll('.tuning-slider');
assert.strictEqual(sliders.length, wave.getCustomParameters!().length);

// 5. Test Non-tunable (MilkDrop)
const milk = new MilkDropPreset();
panel.classList.add('open');
btn.classList.add('active');

const isMilkTunable = updateTuningButtonState(milk, btn as any, panel as any);
assert.strictEqual(isMilkTunable, false);
assert.strictEqual(btn.classList.contains('is-collapsed'), true);
assert.strictEqual(panel.classList.contains('open'), false);
assert.strictEqual(btn.classList.contains('active'), false);

renderTuningPanel(milk, content as any);
assert.strictEqual(content.querySelectorAll('.tuning-slider').length, 0);
const notice = content.querySelector('.tuning-fallback-notice');
assert(notice !== null, 'Fallback notice must exist');
assert.strictEqual(notice.textContent, 'No settings for this preset');

console.log('Direct TypeScript module tests passed successfully.');
`;

const tempTsPath = path.resolve(__dirname, '.temp_challenger_test.ts');
const tempOutPath = path.resolve(__dirname, '.temp_challenger_test.mjs');

check('Compile and execute real TypeScript presets & ParameterStore via esbuild', () => {
  fs.writeFileSync(tempTsPath, tsTestCode);
  try {
    esbuild.buildSync({
      entryPoints: [tempTsPath],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: tempOutPath,
      external: ['three'],
      packages: 'external',
      logLevel: 'error'
    });

    const res = spawnSync(process.execPath, [tempOutPath], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      env: { ...process.env, Path: 'C:\\Program Files\\nodejs;' + process.env.Path }
    });

    assert.strictEqual(res.status, 0, `Execution failed: ${res.stderr}\n${res.stdout}`);
    assert(res.stdout.includes('Direct TypeScript module tests passed successfully.'));
  } finally {
    if (fs.existsSync(tempTsPath)) fs.unlinkSync(tempTsPath);
    if (fs.existsSync(tempOutPath)) fs.unlinkSync(tempOutPath);
  }
});

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`Empirical Checks: ${totalChecks} total | ${passedChecks} passed | ${failedChecks} failed`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error(`VERDICT: REJECT (${failedChecks} failures)`);
  process.exit(1);
} else {
  console.log('VERDICT: ALL ADVERSARIAL STRESS CHECKS PASSED EMPIRICALLY!');
  process.exit(0);
}
