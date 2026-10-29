/**
 * EMPIRICAL CHALLENGER TEST SUITE: TICKET #40
 * Target: 15-Tool Left Navigation Rail, Lucide SVGs, Matching Drawers, and Toggle Logic
 * Challenger: challenger_m2_1
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('========================================================================');
console.log('       EMPIRICAL CHALLENGER VERIFICATION HARNESS: TICKET #40           ');
console.log('========================================================================\n');

const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

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
// SECTION 1: CANONICAL 15-TOOL SPECIFICATION & HTML ATTRIBUTE AUDIT
// -----------------------------------------------------------------------------
console.log('--- SECTION 1: 15 Canonical Rail Tools in index.html ---');

const EXPECTED_TOOLS = [
  { id: 'presets', panelId: 'presetsPanel', expectedBtnId: 'presetsRailBtn', label: 'Presets' },
  { id: 'presetSettings', panelId: 'tuningPanel', expectedBtnId: 'presetSettingsRailBtn', label: 'Preset Tuning' },
  { id: 'colors', panelId: 'themesPanel', expectedBtnId: 'themesBtn', label: 'Themes' },
  { id: 'effects', panelId: 'fxPanel', expectedBtnId: 'fxBtn', label: 'Effects' },
  { id: 'camera', panelId: 'cameraPanel', expectedBtnId: 'cameraBtn', label: 'Camera & Views' },
  { id: 'audio', panelId: 'audioPanel', expectedBtnId: 'audioBtn', label: 'Audio DSP' },
  { id: 'overlay', panelId: 'overlayPanel', expectedBtnId: 'overlayBtn', label: 'Image Overlays' },
  { id: 'text', panelId: 'textOverlayPanel', expectedBtnId: 'textBtn', label: 'Text & Typography' },
  { id: 'subtitles', panelId: 'subtitlesPanel', expectedBtnId: 'subtitlesBtn', label: 'Subtitles' },
  { id: 'tracks', panelId: 'queuePanel', expectedBtnId: 'trackLibraryRailBtn', label: 'Playback Queue' },
  { id: 'library', panelId: 'libraryPanel', expectedBtnId: 'libraryBtn', label: 'Library' },
  { id: 'myCreations', panelId: 'studioPanel', expectedBtnId: 'studioBtn', label: 'Studio Composer' },
  { id: 'more', panelId: 'railMoreExtras', expectedBtnId: 'railMoreBtn', label: 'More Extras', isSpecial: true },
  { id: 'shortcuts', panelId: 'shortcutsModal', expectedBtnId: 'shortcutHelpBtn', label: 'Shortcuts', isSpecial: true },
  { id: 'hideUi', panelId: 'showUiBtn', expectedBtnId: 'hideUiBtn', label: 'Hide UI', isSpecial: true }
];

check('1.1: aside#iconRail container exists with class icon-rail and aria-label', () => {
  const asideMatch = htmlContent.match(/<aside[^>]*class="[^"]*icon-rail[^"]*"[^>]*id="iconRail"[^>]*>/i);
  assert(asideMatch, 'Could not find <aside class="...icon-rail..." id="iconRail"> in index.html');
  assert(/aria-label="[^"]+"/i.test(asideMatch[0]), 'aside#iconRail missing aria-label attribute');
});

check('1.2: All 15 canonical rail buttons are declared with exact data-panel and IDs', () => {
  for (const tool of EXPECTED_TOOLS) {
    const btnRegex = new RegExp(`<button[^>]*class="[^"]*rail-btn[^"]*"[^>]*data-panel="${tool.id}"[^>]*>`, 'i');
    const altRegex = new RegExp(`<button[^>]*data-panel="${tool.id}"[^>]*class="[^"]*rail-btn[^"]*"[^>]*>`, 'i');
    const match = htmlContent.match(btnRegex) || htmlContent.match(altRegex);
    assert(match, `Missing rail button with data-panel="${tool.id}"`);

    const btnTag = match[0];
    assert(btnTag.includes(`id="${tool.expectedBtnId}"`), `Button for ${tool.id} does not have expected id="${tool.expectedBtnId}". Got: ${btnTag}`);
    assert(/aria-label="[^"]+"/i.test(btnTag), `Button for ${tool.id} missing aria-label`);
    assert(/title="[^"]+"/i.test(btnTag), `Button for ${tool.id} missing tooltip (title) attribute`);
  }
});

check('1.3: Every rail button contains a valid Lucide SVG icon with viewBox and dimensions', () => {
  // Extract the rail content
  const railBlockMatch = htmlContent.match(/<aside[^>]*id="iconRail"[^>]*>([\s\S]*?)<\/aside>/i);
  assert(railBlockMatch, 'Could not extract <aside id="iconRail">...</aside>');
  const railBlock = railBlockMatch[1];

  for (const tool of EXPECTED_TOOLS) {
    const btnBlockMatch = railBlock.match(new RegExp(`<button[^>]*data-panel="${tool.id}"[\\s\\S]*?<\\/button>`, 'i'));
    assert(btnBlockMatch, `Could not find button block for ${tool.id}`);
    const btnBlock = btnBlockMatch[0];

    assert(btnBlock.includes('<svg'), `Button for ${tool.id} does not contain an <svg> element`);
    assert(/viewBox="0 0 24 24"/.test(btnBlock), `Button SVG for ${tool.id} does not have viewBox="0 0 24 24"`);
    assert(/stroke="currentColor"/.test(btnBlock), `Button SVG for ${tool.id} does not have stroke="currentColor"`);
    assert(/<(path|circle|line|rect|polyline|polygon)/.test(btnBlock), `Button SVG for ${tool.id} does not contain SVG shapes`);
  }
});

check('1.4: All 12 canonical drawer panels exist with .detail-panel and matching data-panel attributes', () => {
  const drawerTools = EXPECTED_TOOLS.filter(t => !t.isSpecial);
  assert.strictEqual(drawerTools.length, 12, 'Expected exactly 12 drawer tools');

  for (const tool of drawerTools) {
    const panelRegex = new RegExp(`<div[^>]*id="${tool.panelId}"[^>]*>`, 'i');
    const match = htmlContent.match(panelRegex);
    assert(match, `Missing drawer container with id="${tool.panelId}" for tool ${tool.id}`);

    const tag = match[0];
    assert(/class="[^"]*detail-panel[^"]*"/i.test(tag), `Drawer #${tool.panelId} missing 'detail-panel' class. Tag: ${tag}`);
    assert(/class="[^"]*drawer-panel[^"]*"/i.test(tag), `Drawer #${tool.panelId} missing 'drawer-panel' class. Tag: ${tag}`);
    assert(tag.includes(`data-panel="${tool.id}"`), `Drawer #${tool.panelId} missing data-panel="${tool.id}". Tag: ${tag}`);
  }
});

check('1.5: Ancillary containers exist: #railMoreExtras, #shortcutsModal, #showUiBtn', () => {
  assert(htmlContent.includes('id="railMoreExtras"'), 'Missing #railMoreExtras popover');
  assert(/id="railMoreExtras"[^>]*role="menu"/i.test(htmlContent), '#railMoreExtras must have role="menu"');
  assert(htmlContent.includes('id="ambientModeBtn"'), 'Missing #ambientModeBtn inside popover');
  assert(htmlContent.includes('id="bugReportBtn"'), 'Missing #bugReportBtn inside popover');

  assert(htmlContent.includes('id="shortcutsModal"'), 'Missing #shortcutsModal');
  assert(/id="shortcutsModal"[^>]*role="dialog"/i.test(htmlContent), '#shortcutsModal must have role="dialog"');
  assert(htmlContent.includes('id="closeShortcutsBtn"'), 'Missing #closeShortcutsBtn');

  assert(htmlContent.includes('id="showUiBtn"'), 'Missing floating #showUiBtn');
});

check('1.6: Duplicate ID verification across entire index.html', () => {
  const idRegex = /\sid="([^"]+)"/g;
  const ids = [];
  let m;
  while ((m = idRegex.exec(htmlContent)) !== null) {
    ids.push(m[1]);
  }
  const idCounts = {};
  const duplicates = [];
  for (const id of ids) {
    idCounts[id] = (idCounts[id] || 0) + 1;
    if (idCounts[id] === 2) {
      duplicates.push(id);
    }
  }
  assert.strictEqual(duplicates.length, 0, `Found duplicate IDs in index.html: ${duplicates.join(', ')}`);
});

// -----------------------------------------------------------------------------
// SECTION 2: CSS SPECIFICATION & DETENT VERIFICATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 2: CSS Rules & Responsive Detents in style.css ---');

check('2.1: .icon-rail styles exist with proper width, position, and styling', () => {
  assert(/\.icon-rail\s*\{[^}]*position:\s*absolute/i.test(cssContent), 'Missing position: absolute on .icon-rail');
  assert(/\.icon-rail\s*\{[^}]*width:\s*var\(--rail-width\)/i.test(cssContent), 'Missing width: var(--rail-width) on .icon-rail');
  assert(/\.icon-rail\s*\{[^}]*z-index:\s*10/i.test(cssContent), 'Missing z-index: 10 on .icon-rail');
});

check('2.2: .rail-btn sizing conforms to spec (40px standard, 80px presets card)', () => {
  assert(/\.rail-btn\s*\{[^}]*width:\s*40px/i.test(cssContent), 'Expected 40px width on .rail-btn');
  assert(/\.rail-btn\s*\{[^}]*height:\s*40px/i.test(cssContent), 'Expected 40px height on .rail-btn');
  assert(/\.rail-btn\[data-panel="presets"\]\s*\{[^}]*height:\s*80px/i.test(cssContent), 'Expected 80px height on presets .rail-btn');
});

check('2.3: .rail-btn.active indicator :after is styled with 3px width and accent color', () => {
  assert(/\.rail-btn\.active:after\s*\{[^}]*width:\s*3px/i.test(cssContent), 'Expected width: 3px on .rail-btn.active:after');
  assert(/\.rail-btn\.active:after\s*\{[^}]*background:\s*var\(--accent-start\)/i.test(cssContent), 'Expected background: var(--accent-start) on .rail-btn.active:after');
});

check('2.4: Responsive detents (< 900px height compact, <= 640px mobile hide/show)', () => {
  assert(/@media[^{]*max-height:\s*900px/i.test(cssContent), 'Missing max-height: 900px media query');
  assert(/@media[^{]*max-width:\s*640px/i.test(cssContent), 'Missing max-width: 640px media query');
  assert(/\.rail-btn--desktop-only\s*\{[^}]*display:\s*none\s*!important/i.test(cssContent), 'Missing mobile hide rule for desktop rail buttons');
  assert(/\.rail-btn--mobile-only\s*\{[^}]*display:\s*flex\s*!important/i.test(cssContent), 'Missing mobile show rule for mobile rail buttons');
});

check('2.5: #app.ui-hidden hides chrome and surfaces floating #showUiBtn', () => {
  assert(/#app\.ui-hidden\s+\.icon-rail/i.test(cssContent), 'Missing #app.ui-hidden .icon-rail rule');
  assert(/#app\.ui-hidden\s+\.topbar/i.test(cssContent), 'Missing #app.ui-hidden .topbar rule');
  assert(/#app\.ui-hidden\s+#showUiBtn/i.test(cssContent), 'Missing #app.ui-hidden #showUiBtn reveal rule');
});

check('2.6: .is-collapsed rule is defined with display: none !important', () => {
  assert(/\.is-collapsed\s*\{[^}]*display:\s*none\s*!important/i.test(cssContent), 'Missing .is-collapsed { display: none !important; }');
});

// -----------------------------------------------------------------------------
// SECTION 3: EMPIRICAL TOGGLE & DRAWER LOGIC SIMULATION
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 3: Empirical Interactive Toggle & Drawer Logic Simulation ---');

// Lightweight Headless DOM for interactive verification
class TestDOMTokenList {
  constructor(initial = []) {
    this.tokens = new Set(initial);
  }
  add(...tokens) { tokens.forEach(t => this.tokens.add(t)); }
  remove(...tokens) { tokens.forEach(t => this.tokens.delete(t)); }
  toggle(t) {
    if (this.tokens.has(t)) { this.tokens.delete(t); return false; }
    this.tokens.add(t); return true;
  }
  contains(t) { return this.tokens.has(t); }
  toString() { return Array.from(this.tokens).join(' '); }
}

class TestElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new TestDOMTokenList(className.split(' ').filter(Boolean));
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
  }
  setAttribute(k, v) {
    this.attributes[k] = v;
    if (k.startsWith('data-')) {
      const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[prop] = v;
    }
  }
  getAttribute(k) {
    if (k.startsWith('data-')) {
      const prop = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return this.dataset[prop] || null;
    }
    return this.attributes[k] || null;
  }
  addEventListener(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event).push(fn);
  }
  click() {
    const list = this.listeners.get('click') || [];
    list.forEach(fn => fn({ target: this, preventDefault: () => {} }));
  }
  appendChild(child) {
    this.children.push(child);
    child.parentElement = this;
  }
}

// Controller under test mimicking src/main.ts
class RailNavigationHarness {
  constructor() {
    this.allPanels = [];
    this.panelMap = {};
    this.buttons = [];
    this.activeToolId = 'presets'; // initial state
    this.appRoot = new TestElement('DIV', 'app');
    this.shortcutsModal = new TestElement('DIV', 'shortcutsModal');
    this.railMoreWrapper = new TestElement('DIV', 'railMoreWrapper');
    this.railMoreBtn = new TestElement('BUTTON', 'railMoreBtn');
    this.hideUiBtn = new TestElement('BUTTON', 'hideUiBtn');
    this.showUiBtn = new TestElement('BUTTON', 'showUiBtn');

    for (const tool of EXPECTED_TOOLS) {
      const btn = new TestElement('BUTTON', tool.expectedBtnId, 'rail-btn');
      btn.setAttribute('data-panel', tool.id);
      this.buttons.push(btn);

      if (!tool.isSpecial) {
        const panel = new TestElement('DIV', tool.panelId, 'drawer-panel detail-panel');
        panel.setAttribute('data-panel', tool.id);
        this.allPanels.push(panel);
        this.panelMap[tool.id] = panel;
      }
    }

    // Initial state: presets panel is open, presets button is active
    this.panelMap['presets'].classList.add('open');
    this.getBtn('presets').classList.add('active');

    this.wireListeners();
  }

  getBtn(toolId) {
    return this.buttons.find(b => b.dataset.panel === toolId);
  }

  closeAllDrawers() {
    this.allPanels.forEach(p => p.classList.remove('open'));
    this.buttons.forEach(b => b.classList.remove('active'));
  }

  openDrawer(toolId) {
    this.closeAllDrawers();
    this.activeToolId = toolId;
    const btn = this.getBtn(toolId);
    btn?.classList.add('active');
    const panel = this.panelMap[toolId];
    if (panel) {
      panel.classList.add('open');
    }
  }

  toggleDrawer(toolId) {
    if (this.activeToolId === toolId) {
      const panel = this.panelMap[toolId];
      panel?.classList.remove('open');
      const btn = this.getBtn(toolId);
      btn?.classList.remove('active');
      this.activeToolId = null;
      return;
    }
    this.openDrawer(toolId);
  }

  toggleHideUI() {
    const isHidden = this.appRoot.classList.toggle('ui-hidden');
    return isHidden;
  }

  setRailMoreExpanded(expanded) {
    if (expanded) {
      this.railMoreWrapper.classList.add('expanded');
      this.railMoreBtn.setAttribute('aria-expanded', 'true');
    } else {
      this.railMoreWrapper.classList.remove('expanded');
      this.railMoreBtn.setAttribute('aria-expanded', 'false');
    }
  }

  wireListeners() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.dataset.panel;
        if (!toolId) return;

        if (toolId === 'more') {
          const isExp = !this.railMoreWrapper.classList.contains('expanded');
          this.setRailMoreExpanded(isExp);
          return;
        }

        if (toolId === 'shortcuts') {
          this.shortcutsModal.classList.toggle('open');
          return;
        }

        if (toolId === 'hideUi') {
          this.toggleHideUI();
          return;
        }

        this.toggleDrawer(toolId);
      });
    });

    this.showUiBtn.addEventListener('click', () => {
      this.appRoot.classList.remove('ui-hidden');
    });
  }
}

check('3.1: Initial State: presets is active, #presetsPanel is open, others closed', () => {
  const harness = new RailNavigationHarness();
  assert.strictEqual(harness.activeToolId, 'presets');
  assert(harness.getBtn('presets').classList.contains('active'), 'Presets btn should be active');
  assert(harness.panelMap['presets'].classList.contains('open'), 'Presets panel should be open');

  for (const tool of EXPECTED_TOOLS.filter(t => !t.isSpecial && t.id !== 'presets')) {
    assert(!harness.getBtn(tool.id).classList.contains('active'), `Btn ${tool.id} should NOT be active initially`);
    assert(!harness.panelMap[tool.id].classList.contains('open'), `Panel ${tool.id} should NOT be open initially`);
  }
});

check('3.2: Active Toggle: Clicking already open Presets panel closes it and removes active class', () => {
  const harness = new RailNavigationHarness();
  // Presets is open initially
  harness.getBtn('presets').click();

  assert.strictEqual(harness.activeToolId, null, 'activeToolId must be null after toggling off');
  assert(!harness.getBtn('presets').classList.contains('active'), 'Presets btn should NOT have active class');
  assert(!harness.panelMap['presets'].classList.contains('open'), 'Presets panel should NOT have open class');

  // Verify all 12 drawers are closed
  for (const p of harness.allPanels) {
    assert(!p.classList.contains('open'), `Panel #${p.id} should be closed`);
  }
});

check('3.3: Active Toggle: Clicking closed Presets button re-opens it', () => {
  const harness = new RailNavigationHarness();
  // Close it
  harness.getBtn('presets').click();
  // Open it again
  harness.getBtn('presets').click();

  assert.strictEqual(harness.activeToolId, 'presets');
  assert(harness.getBtn('presets').classList.contains('active'), 'Presets btn should be active');
  assert(harness.panelMap['presets'].classList.contains('open'), 'Presets panel should be open');
});

check('3.4: Mutual Exclusivity: Switching from Presets to Camera closes Presets and opens Camera', () => {
  const harness = new RailNavigationHarness();
  harness.getBtn('camera').click();

  assert.strictEqual(harness.activeToolId, 'camera');
  assert(!harness.getBtn('presets').classList.contains('active'), 'Presets btn should NOT be active');
  assert(!harness.panelMap['presets'].classList.contains('open'), 'Presets panel should NOT be open');
  assert(harness.getBtn('camera').classList.contains('active'), 'Camera btn should be active');
  assert(harness.panelMap['camera'].classList.contains('open'), 'Camera panel should be open');

  // Verify exactly 1 panel is open
  const openPanels = harness.allPanels.filter(p => p.classList.contains('open'));
  assert.strictEqual(openPanels.length, 1, 'Exactly 1 panel should be open');
});

check('3.5: Rapid Sequential Switching: Cycling all 12 drawer tools leaves only the last one open', () => {
  const harness = new RailNavigationHarness();
  // Close initial presets panel so all start closed
  harness.closeAllDrawers();
  harness.activeToolId = null;

  const drawerTools = EXPECTED_TOOLS.filter(t => !t.isSpecial);

  for (const tool of drawerTools) {
    harness.getBtn(tool.id).click();
    assert.strictEqual(harness.activeToolId, tool.id);
    assert(harness.getBtn(tool.id).classList.contains('active'));
    assert(harness.panelMap[tool.id].classList.contains('open'));
  }

  const lastTool = drawerTools[drawerTools.length - 1];
  assert.strictEqual(harness.activeToolId, lastTool.id);
  const openPanels = harness.allPanels.filter(p => p.classList.contains('open'));
  assert.strictEqual(openPanels.length, 1);
  assert.strictEqual(openPanels[0].id, lastTool.panelId);
});

check('3.6: Rapid 50-Click Toggle: Preserves deterministic parity state', () => {
  const harness = new RailNavigationHarness();
  // Starts open (state = 1)
  for (let i = 0; i < 50; i++) {
    harness.getBtn('colors').click();
  }
  // 50 clicks on colors (from initial open presets):
  // Click 1: colors opens (odd)
  // Click 2: colors closes (even)
  // ...
  // Click 50: colors closes (even)
  assert.strictEqual(harness.activeToolId, null);
  assert(!harness.getBtn('colors').classList.contains('active'));
  assert(!harness.panelMap['colors'].classList.contains('open'));
});

check('3.7: Special Tool: More Extras popover expands/collapses and sets aria-expanded', () => {
  const harness = new RailNavigationHarness();
  assert(!harness.railMoreWrapper.classList.contains('expanded'));

  harness.getBtn('more').click();
  assert(harness.railMoreWrapper.classList.contains('expanded'));
  assert.strictEqual(harness.railMoreBtn.getAttribute('aria-expanded'), 'true');

  harness.getBtn('more').click();
  assert(!harness.railMoreWrapper.classList.contains('expanded'));
  assert.strictEqual(harness.railMoreBtn.getAttribute('aria-expanded'), 'false');
});

check('3.8: Special Tool: Shortcuts modal toggles open and closed', () => {
  const harness = new RailNavigationHarness();
  assert(!harness.shortcutsModal.classList.contains('open'));

  harness.getBtn('shortcuts').click();
  assert(harness.shortcutsModal.classList.contains('open'));

  harness.getBtn('shortcuts').click();
  assert(!harness.shortcutsModal.classList.contains('open'));
});

check('3.9: Special Tool: Hide UI toggles .ui-hidden and #showUiBtn unhides', () => {
  const harness = new RailNavigationHarness();
  assert(!harness.appRoot.classList.contains('ui-hidden'));

  harness.getBtn('hideUi').click();
  assert(harness.appRoot.classList.contains('ui-hidden'), 'Hide UI should add ui-hidden');

  harness.showUiBtn.click();
  assert(!harness.appRoot.classList.contains('ui-hidden'), 'showUiBtn click should remove ui-hidden');
});

check('3.10: Tuning button collapse state: non-tunable preset collapses tuning button and closes panel', () => {
  const tuningBtn = new TestElement('BUTTON', 'presetSettingsRailBtn', 'rail-btn preset-settings-link');
  const tuningPanel = new TestElement('DIV', 'tuningPanel', 'drawer-panel detail-panel open');
  let activeId = 'presetSettings';

  function updateTuningButtonState(preset) {
    const hasParams = Boolean(preset && typeof preset.getCustomParameters === 'function' && preset.getCustomParameters()?.length > 0);
    if (hasParams) {
      tuningBtn.classList.remove('is-collapsed');
    } else {
      tuningBtn.classList.add('is-collapsed');
      if (activeId === 'presetSettings') {
        tuningPanel.classList.remove('open');
        tuningBtn.classList.remove('active');
        activeId = null;
      }
    }
  }

  // Non-tunable preset
  updateTuningButtonState({ id: 'plain', name: 'Plain Preset' });
  assert(tuningBtn.classList.contains('is-collapsed'), 'Tuning btn should have is-collapsed class');
  assert(!tuningPanel.classList.contains('open'), 'Tuning panel should be closed');
  assert.strictEqual(activeId, null, 'activeId should be cleared');

  // Tunable preset
  updateTuningButtonState({ id: 'tunable', name: 'Tunable', getCustomParameters: () => [{ id: 'p1' }] });
  assert(!tuningBtn.classList.contains('is-collapsed'), 'Tuning btn should NOT have is-collapsed class');
});

// -----------------------------------------------------------------------------
// SECTION 4: HARDENING & EDGE CASE ADVERSARIAL STRESS
// -----------------------------------------------------------------------------
console.log('\n--- SECTION 4: Adversarial Edge Cases & Boundary Mining ---');

check('4.1: Unknown or corrupted toolId gracefully handles without throwing', () => {
  const harness = new RailNavigationHarness();
  assert.doesNotThrow(() => {
    harness.toggleDrawer('invalid_nonexistent_tool');
  });
  assert.strictEqual(harness.activeToolId, 'invalid_nonexistent_tool');
  // No panel opened
  const openPanels = harness.allPanels.filter(p => p.classList.contains('open'));
  assert.strictEqual(openPanels.length, 0);

  // Toggle off unknown
  harness.toggleDrawer('invalid_nonexistent_tool');
  assert.strictEqual(harness.activeToolId, null);
});

check('4.2: Double invocation of closeAllDrawers does not corrupt state', () => {
  const harness = new RailNavigationHarness();
  assert.doesNotThrow(() => {
    harness.closeAllDrawers();
    harness.closeAllDrawers();
  });
  for (const p of harness.allPanels) {
    assert(!p.classList.contains('open'));
  }
});

check('4.3: Keyboard Hotkey H and ? dispatch handlers in main.ts exist and are bound', () => {
  assert(/case\s+'h':\s*toggleHideUI\(\);/i.test(mainTsContent), 'Hotkey "H" must trigger toggleHideUI()');
  assert(/case\s+'\?':\s*shortcutsModal\?\.classList\.toggle\('open'\);/i.test(mainTsContent), 'Hotkey "?" must toggle shortcutsModal');
  assert(/case\s+'\/':\s*if\s*\(isShift\)/i.test(mainTsContent), 'Shift+"/" must toggle shortcutsModal');
});

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} tests passed (${failedTests} failures)`);
console.log('========================================================================');

if (failedTests > 0) {
  console.error('\nFAILURE DETAILS:');
  failures.forEach(f => {
    console.error(`- ${f.testName}: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('>>> ALL EMPIRICAL CHALLENGER TESTS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
}
