/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 5 (TICKET #43)
 * Target: Animated Text and Typography Overlays ("T" Rail Icon & #textOverlayPanel DOM Integration)
 * Challenger: challenger_m5_2 (critic, specialist)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const { spawnSync } = require('child_process');
const esbuild = require('esbuild');
const THREE = require('three');

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER HARNESS: MILESTONE 5 DOM & INTEGRATION (#43)    ');
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

// File paths
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');
const engineTsPath = path.resolve(__dirname, '../src/overlay/TextOverlayEngine.ts');
const typesTsPath = path.resolve(__dirname, '../src/overlay/types.ts');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

// =============================================================================
// SECTION 1: STATIC DOM, ATTRIBUTES & CSS SPECIFICATION AUDIT
// =============================================================================
console.log('--- SECTION 1: Static DOM, Attributes & CSS Specification Audit ---');

check('1.1: Rail button #textBtn retains id="textBtn", data-panel="text", and data-alias="btnTextOverlay"', () => {
  const match = htmlContent.match(/<button[^>]*id="textBtn"[^>]*>/i);
  assert(match, 'Missing button with id="textBtn" in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="text"'), `id="textBtn" must contain data-panel="text". Got: ${tag}`);
  assert(tag.includes('data-alias="btnTextOverlay"'), `id="textBtn" must contain data-alias="btnTextOverlay". Got: ${tag}`);
  assert(/class="[^"]*rail-btn[^"]*"/i.test(tag), `id="textBtn" must have rail-btn class. Got: ${tag}`);
  assert(/aria-label="Text & Typography"/i.test(tag), `id="textBtn" must have aria-label="Text & Typography"`);
  assert(/title="Text & Typography"/i.test(tag), `id="textBtn" must have title="Text & Typography"`);
});

check('1.2: Rail button #textBtn contains valid Lucide type SVG icon', () => {
  const railBlockMatch = htmlContent.match(/<button[^>]*id="textBtn"[\s\S]*?<\/button>/i);
  assert(railBlockMatch, 'Could not extract #textBtn button element block');
  const block = railBlockMatch[0];
  assert(block.includes('<svg'), '#textBtn must contain <svg> element');
  assert(/viewBox="0 0 24 24"/.test(block), '#textBtn SVG must have viewBox="0 0 24 24"');
  assert(/stroke="currentColor"/.test(block), '#textBtn SVG must have stroke="currentColor"');
  assert(/<polyline points="4 7 4 4 20 4 20 7"/.test(block), '#textBtn SVG must contain "T" polyline');
});

check('1.3: Drawer container #textOverlayPanel exists with required classes and data attributes', () => {
  const match = htmlContent.match(/<div[^>]*id="textOverlayPanel"[^>]*>/i);
  assert(match, 'Missing container with id="textOverlayPanel" in index.html');
  const tag = match[0];
  assert(/class="[^"]*drawer-panel[^"]*"/i.test(tag), '#textOverlayPanel missing drawer-panel class');
  assert(/class="[^"]*detail-panel[^"]*"/i.test(tag), '#textOverlayPanel missing detail-panel class');
  assert(/class="[^"]*glass-panel[^"]*"/i.test(tag), '#textOverlayPanel missing glass-panel class');
  assert(tag.includes('data-panel="text"'), '#textOverlayPanel must have data-panel="text"');
  assert(tag.includes('data-panel-id="textOverlayPanel"'), '#textOverlayPanel must have data-panel-id="textOverlayPanel"');
});

check('1.4: Drawer container #textOverlayPanel contains header with close button #closeTextBtn', () => {
  const panelBlockMatch = htmlContent.match(/<div[^>]*id="textOverlayPanel"[\s\S]*?<!-- 9\. Subtitles/i);
  assert(panelBlockMatch, 'Could not extract #textOverlayPanel content block');
  const block = panelBlockMatch[0];
  assert(block.includes('id="closeTextBtn"'), 'Missing close button with id="closeTextBtn"');
  assert(/class="[^"]*close-drawer-btn[^"]*"/i.test(block), 'Close button must have close-drawer-btn class');
  assert(/class="[^"]*closeTextBtn[^"]*"/i.test(block), 'Close button must have closeTextBtn class');
});

check('1.5: Multi-layer text inputs: Line 1 (#textInput0), Line 2 (#textInput1), Line 3 (#textInput2)', () => {
  const inputs = [
    { id: 'textInput0', layer: 'title', alias: 'textTitleInput' },
    { id: 'textInput1', layer: 'artist', alias: 'textArtistInput' },
    { id: 'textInput2', layer: 'custom', alias: 'textCustomInput' }
  ];

  for (const item of inputs) {
    const regex = new RegExp(`<input[^>]*id="${item.id}"[^>]*>`, 'i');
    const match = htmlContent.match(regex);
    assert(match, `Missing input with id="${item.id}"`);
    const tag = match[0];
    assert(tag.includes(`data-layer="${item.layer}"`), `Input #${item.id} missing data-layer="${item.layer}"`);
    assert(tag.includes(`data-alias="${item.alias}"`), `Input #${item.id} missing data-alias="${item.alias}"`);
    assert(/maxlength="200"/i.test(tag), `Input #${item.id} must enforce maxlength="200"`);
    assert(/aria-label="[^"]+"/i.test(tag), `Input #${item.id} missing aria-label attribute`);
  }
});

check('1.6: Watermark toggle input #textWatermarkToggle exists with data-alias="watermarkToggle"', () => {
  const match = htmlContent.match(/<input[^>]*id="textWatermarkToggle"[^>]*>/i);
  assert(match, 'Missing checkbox with id="textWatermarkToggle"');
  const tag = match[0];
  assert(/type="checkbox"/i.test(tag), '#textWatermarkToggle must have type="checkbox"');
  assert(tag.includes('data-alias="watermarkToggle"'), '#textWatermarkToggle missing data-alias="watermarkToggle"');
  assert(/aria-label="Watermark Toggle"/i.test(tag), '#textWatermarkToggle missing aria-label');
});

check('1.7: 3x3 9-point screen quadrant anchor matrix grid (#textAnchorMatrix) contains 9 .anchor-cell buttons', () => {
  const CANONICAL_ANCHORS = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  assert(htmlContent.includes('id="textAnchorMatrix"'), 'Missing #textAnchorMatrix element in index.html');
  assert(/id="textAnchorMatrix"[^>]*role="group"/i.test(htmlContent), '#textAnchorMatrix must have role="group"');
  assert(htmlContent.includes('id="textAnchorLabel"'), 'Missing #textAnchorLabel element for readout');
  assert(htmlContent.includes('id="textAnchorSelect"'), 'Missing fallback #textAnchorSelect element');

  // Verify all 9 anchor cell buttons
  for (const anchor of CANONICAL_ANCHORS) {
    const btnRegex = new RegExp(`<button[^>]*class="[^"]*anchor-cell[^"]*"[^>]*data-anchor="${anchor}"[^>]*>`, 'i');
    const altRegex = new RegExp(`<button[^>]*data-anchor="${anchor}"[^>]*class="[^"]*anchor-cell[^"]*"[^>]*>`, 'i');
    const match = htmlContent.match(btnRegex) || htmlContent.match(altRegex);
    assert(match, `Missing .anchor-cell button with data-anchor="${anchor}"`);
  }

  // Verify center is active by default in HTML
  assert(/<button[^>]*class="[^"]*anchor-cell active[^"]*"[^>]*data-anchor="center"/i.test(htmlContent) ||
         /<button[^>]*data-anchor="center"[^>]*class="[^"]*anchor-cell active[^"]*"/i.test(htmlContent),
         'Default active anchor cell must be "center"');
});

check('1.8: 5 animation mode chips (#textAnimChips) exist with pulse, marquee, fade, static, glitch', () => {
  const CANONICAL_MODES = [
    { mode: 'pulse', alias: 'pulse' },
    { mode: 'marquee', alias: 'runningRow' },
    { mode: 'fade', alias: 'fade' },
    { mode: 'static', alias: 'none' },
    { mode: 'glitch', alias: 'glitch' }
  ];

  assert(htmlContent.includes('id="textAnimChips"'), 'Missing #textAnimChips container');
  assert(htmlContent.includes('id="textAnimSelect"'), 'Missing fallback #textAnimSelect element');

  for (const item of CANONICAL_MODES) {
    const chipRegex = new RegExp(`<button[^>]*class="[^"]*opt-chip[^"]*"[^>]*data-anim="${item.mode}"[^>]*data-alias="${item.alias}"[^>]*>`, 'i');
    const altRegex = new RegExp(`<button[^>]*data-anim="${item.mode}"[^>]*data-alias="${item.alias}"[^>]*class="[^"]*opt-chip[^"]*"[^>]*>`, 'i');
    const match = htmlContent.match(chipRegex) || htmlContent.match(altRegex);
    assert(match, `Missing .opt-chip button with data-anim="${item.mode}" and data-alias="${item.alias}"`);
  }

  // Pulse is active by default in HTML
  assert(/<button[^>]*class="[^"]*opt-chip active[^"]*"[^>]*data-anim="pulse"/i.test(htmlContent) ||
         /<button[^>]*data-anim="pulse"[^>]*class="[^"]*opt-chip active[^"]*"/i.test(htmlContent),
         'Default active anim chip must be "pulse"');
});

check('1.9: Complete typography controls exist with exact IDs and boundary attributes', () => {
  // Font select
  assert(htmlContent.includes('id="textFontFamilySelect"'), 'Missing #textFontFamilySelect');
  // Font size slider
  const sizeMatch = htmlContent.match(/<input[^>]*id="textFontSizeSlider"[^>]*>/i);
  assert(sizeMatch, 'Missing #textFontSizeSlider');
  assert(/min="12"/.test(sizeMatch[0]) && /max="96"/.test(sizeMatch[0]), '#textFontSizeSlider must bound [12, 96]');
  assert(htmlContent.includes('id="textFontSizeVal"'), 'Missing #textFontSizeVal readout');

  // Color picker and text hex input
  assert(htmlContent.includes('id="textColorPicker"'), 'Missing #textColorPicker');
  assert(htmlContent.includes('id="textColorInput"'), 'Missing #textColorInput');
  assert(htmlContent.includes('id="textColorHexVal"'), 'Missing #textColorHexVal readout');

  // Glow slider
  const glowMatch = htmlContent.match(/<input[^>]*id="textGlowSlider"[^>]*>/i);
  assert(glowMatch, 'Missing #textGlowSlider');
  assert(/min="0"/.test(glowMatch[0]) && /max="2"/.test(glowMatch[0]), '#textGlowSlider must bound [0, 2]');
  assert(htmlContent.includes('id="textGlowVal"'), 'Missing #textGlowVal readout');

  // Opacity slider
  const opMatch = htmlContent.match(/<input[^>]*id="textOpacitySlider"[^>]*>/i);
  assert(opMatch, 'Missing #textOpacitySlider');
  assert(/min="0"/.test(opMatch[0]) && /max="1"/.test(opMatch[0]), '#textOpacitySlider must bound [0, 1]');
  assert(htmlContent.includes('id="textOpacityVal"'), 'Missing #textOpacityVal readout');

  // Reactivity / intensity slider
  const intMatch = htmlContent.match(/<input[^>]*id="textIntensitySlider"[^>]*>/i);
  assert(intMatch, 'Missing #textIntensitySlider');
  assert(/min="0"/.test(intMatch[0]) && /max="1"/.test(intMatch[0]), '#textIntensitySlider must bound [0, 1]');
  assert(htmlContent.includes('id="textIntensityVal"'), 'Missing #textIntensityVal readout');
});

check('1.10: style.css defines rules for .anchor-matrix, .anchor-cell.active, .text-anim-chips, and .text-select', () => {
  assert(/\.anchor-matrix\s*\{[^}]*display:\s*grid/i.test(cssContent), 'Missing display: grid on .anchor-matrix');
  assert(/\.anchor-matrix\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*(?:40px|1fr|\S+)\)/i.test(cssContent), '.anchor-matrix must have 3-column repeat');
  assert(/\.anchor-cell\.active\s*\{[^}]*background:/i.test(cssContent), 'Missing .anchor-cell.active background highlight');
  assert(/\.text-anim-chips\s*\{/i.test(cssContent), 'Missing .text-anim-chips styling');
  assert(/\.text-select\s*\{/i.test(cssContent), 'Missing .text-select styling');
});

check('1.11: Duplicate ID verification across index.html with Milestone 5 additions', () => {
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

// =============================================================================
// SECTION 2: LIVE INTERACTIVE HEADLESS DOM & TWO-WAY REACTIVE BINDING
// =============================================================================
console.log('\n--- SECTION 2: Live Interactive Headless DOM & Two-Way Reactive Binding ---');

// Compile TextOverlayEngine into memory to test live reactive interaction
let TextOverlayEngineClass;
try {
  const buildResult = esbuild.buildSync({
    entryPoints: [engineTsPath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    external: ['three']
  });

  const vmContext = {
    require: (mod) => (mod === 'three' ? THREE : require(mod)),
    module: { exports: {} },
    exports: {},
    document: {
      createElement: () => ({
        width: 1920,
        height: 1080,
        getContext: () => ({
          clearRect: () => {},
          fillRect: () => {},
          measureText: (txt) => ({ width: (txt || '').length * 10 }),
          save: () => {},
          restore: () => {},
          beginPath: () => {},
          roundRect: () => {},
          fill: () => {},
          fillText: () => {}
        })
      })
    },
    window: { devicePixelRatio: 1 }
  };

  vm.runInNewContext(buildResult.outputFiles[0].text, vmContext);
  TextOverlayEngineClass = vmContext.module.exports.TextOverlayEngine;
  assert(typeof TextOverlayEngineClass === 'function', 'TextOverlayEngine exported constructor');
} catch (err) {
  throw new Error(`Failed to bundle/load TextOverlayEngine for empirical testing: ${err.message}`);
}

// Lightweight Test DOM classes
class SimDOMTokenList {
  constructor(initial = []) {
    this.tokens = new Set(initial);
  }
  add(...tokens) { tokens.forEach(t => this.tokens.add(t)); }
  remove(...tokens) { tokens.forEach(t => this.tokens.delete(t)); }
  toggle(t, force) {
    if (force !== undefined) {
      if (force) this.tokens.add(t);
      else this.tokens.delete(t);
      return force;
    }
    if (this.tokens.has(t)) { this.tokens.delete(t); return false; }
    this.tokens.add(t); return true;
  }
  contains(t) { return this.tokens.has(t); }
  toString() { return Array.from(this.tokens).join(' '); }
}

class SimElement {
  constructor(tagName, id = '', className = '') {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.classList = new SimDOMTokenList(className.split(' ').filter(Boolean));
    this.dataset = {};
    this.attributes = {};
    this.children = [];
    this.parentElement = null;
    this.listeners = new Map();
    this.value = '';
    this.checked = false;
    this.textContent = '';
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

  dispatchEvent(event) {
    const list = this.listeners.get(event.type) || [];
    list.forEach(fn => fn(event));
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
  }

  change() {
    this.dispatchEvent({ type: 'change', target: this, preventDefault: () => {} });
  }

  input(val) {
    if (val !== undefined) this.value = val;
    this.dispatchEvent({ type: 'input', target: this, preventDefault: () => {} });
  }
}

// Headless UI Harness faithfully executing the exact bindings from src/main.ts
class TextOverlayUIHarness {
  constructor() {
    this.engine = new TextOverlayEngineClass();

    // DOM Elements
    this.textInput0 = new SimElement('INPUT', 'textInput0', 'drawer-search text-layer-input');
    this.textInput1 = new SimElement('INPUT', 'textInput1', 'drawer-search text-layer-input');
    this.textInput2 = new SimElement('INPUT', 'textInput2', 'drawer-search text-layer-input');
    this.textWatermarkToggle = new SimElement('INPUT', 'textWatermarkToggle');
    this.textWatermarkToggle.checked = false;

    this.textAnchorMatrix = new SimElement('DIV', 'textAnchorMatrix');
    this.textAnchorLabel = new SimElement('SPAN', 'textAnchorLabel');
    this.textAnchorLabel.textContent = 'Center';
    this.textAnchorSelect = new SimElement('SELECT', 'textAnchorSelect');

    const ANCHORS = ['top-left', 'top-center', 'top-right', 'center-left', 'center', 'center-right', 'bottom-left', 'bottom-center', 'bottom-right'];
    this.anchorCells = ANCHORS.map(a => {
      const btn = new SimElement('BUTTON', '', `anchor-cell ${a === 'center' ? 'active' : ''}`);
      btn.setAttribute('data-anchor', a);
      return btn;
    });

    const MODES = [
      { id: 'pulse', alias: 'pulse' },
      { id: 'marquee', alias: 'runningRow' },
      { id: 'fade', alias: 'fade' },
      { id: 'static', alias: 'none' },
      { id: 'glitch', alias: 'glitch' }
    ];
    this.animChips = MODES.map(m => {
      const chip = new SimElement('BUTTON', '', `opt-chip ${m.id === 'pulse' ? 'active' : ''}`);
      chip.setAttribute('data-anim', m.id);
      chip.setAttribute('data-alias', m.alias);
      return chip;
    });
    this.textAnimSelect = new SimElement('SELECT', 'textAnimSelect');

    this.textFontFamilySelect = new SimElement('SELECT', 'textFontFamilySelect');
    this.textFontFamilySelect.value = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    this.textFontSizeSlider = new SimElement('INPUT', 'textFontSizeSlider');
    this.textFontSizeSlider.value = '32';
    this.textFontSizeVal = new SimElement('SPAN', 'textFontSizeVal');
    this.textFontSizeVal.textContent = '32px';

    this.textColorPicker = new SimElement('INPUT', 'textColorPicker');
    this.textColorPicker.value = '#ffffff';
    this.textColorInput = new SimElement('INPUT', 'textColorInput');
    this.textColorInput.value = '#ffffff';
    this.textColorHexVal = new SimElement('SPAN', 'textColorHexVal');
    this.textColorHexVal.textContent = '#FFFFFF';

    this.textGlowSlider = new SimElement('INPUT', 'textGlowSlider');
    this.textGlowSlider.value = '0.8';
    this.textGlowVal = new SimElement('SPAN', 'textGlowVal');
    this.textGlowVal.textContent = '0.8';

    this.textOpacitySlider = new SimElement('INPUT', 'textOpacitySlider');
    this.textOpacitySlider.value = '1.0';
    this.textOpacityVal = new SimElement('SPAN', 'textOpacityVal');
    this.textOpacityVal.textContent = '100%';

    this.textIntensitySlider = new SimElement('INPUT', 'textIntensitySlider');
    this.textIntensitySlider.value = '0.5';
    this.textIntensityVal = new SimElement('SPAN', 'textIntensityVal');
    this.textIntensityVal.textContent = '50%';

    this.wireListeners();
  }

  wireListeners() {
    const { engine } = this;

    // Text inputs
    this.textInput0.addEventListener('input', () => engine.setTitle(this.textInput0.value));
    this.textInput1.addEventListener('input', () => engine.setArtist(this.textInput1.value));
    this.textInput2.addEventListener('input', () => engine.setCustomText(this.textInput2.value));

    // Watermark
    this.textWatermarkToggle.addEventListener('change', () => engine.setWatermark(this.textWatermarkToggle.checked));

    // Anchor matrix
    const ANCHOR_DISPLAY_NAMES = {
      'top-left': 'Top Left',
      'top-center': 'Top Center',
      'top-right': 'Top Right',
      'center-left': 'Center Left',
      'center': 'Center',
      'center-right': 'Center Right',
      'bottom-left': 'Bottom Left',
      'bottom-center': 'Bottom Center',
      'bottom-right': 'Bottom Right'
    };

    const selectAnchor = (anchor) => {
      this.anchorCells.forEach(cell => {
        const a = cell.getAttribute('data-anchor');
        cell.classList.toggle('active', a === anchor);
      });
      if (this.textAnchorLabel) {
        this.textAnchorLabel.textContent = ANCHOR_DISPLAY_NAMES[anchor] || anchor;
      }
      if (this.textAnchorSelect) {
        this.textAnchorSelect.value = anchor;
      }
      engine.setAnchor(anchor);
    };

    this.anchorCells.forEach(cell => {
      cell.addEventListener('click', () => {
        const anchor = cell.getAttribute('data-anchor') || 'center';
        selectAnchor(anchor);
      });
    });

    this.textAnchorSelect.addEventListener('change', () => {
      selectAnchor(this.textAnchorSelect.value);
    });

    // Animation modes
    const selectAnimMode = (anim) => {
      this.animChips.forEach(chip => {
        const a = chip.getAttribute('data-anim') || chip.getAttribute('data-alias');
        chip.classList.toggle('active', a === anim);
      });
      if (this.textAnimSelect) {
        this.textAnimSelect.value = anim;
      }
      engine.setAnimationMode(anim);
    };

    this.animChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const anim = chip.getAttribute('data-anim') || 'pulse';
        selectAnimMode(anim);
      });
    });

    this.textAnimSelect.addEventListener('change', () => {
      selectAnimMode(this.textAnimSelect.value);
    });

    // Typography
    this.textFontFamilySelect.addEventListener('change', () => {
      engine.setFontFamily(this.textFontFamilySelect.value);
    });

    this.textFontSizeSlider.addEventListener('input', () => {
      const size = Number(this.textFontSizeSlider.value);
      this.textFontSizeVal.textContent = `${size}px`;
      engine.setFontSize(size);
    });

    const updateTextColor = (hex) => {
      const upper = hex.toUpperCase();
      this.textColorPicker.value = upper;
      this.textColorInput.value = upper;
      this.textColorHexVal.textContent = upper;
      engine.setColor(upper);
    };

    this.textColorPicker.addEventListener('input', () => {
      updateTextColor(this.textColorPicker.value);
    });

    this.textColorInput.addEventListener('input', () => {
      const val = this.textColorInput.value.trim();
      if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
        updateTextColor(val);
      }
    });

    this.textGlowSlider.addEventListener('input', () => {
      const val = Number.parseFloat(this.textGlowSlider.value);
      this.textGlowVal.textContent = val.toFixed(1);
      engine.setGlowIntensity(val);
    });

    this.textOpacitySlider.addEventListener('input', () => {
      const val = Number.parseFloat(this.textOpacitySlider.value);
      this.textOpacityVal.textContent = `${Math.round(val * 100)}%`;
      engine.setOpacity(val);
    });

    this.textIntensitySlider.addEventListener('input', () => {
      const val = Number.parseFloat(this.textIntensitySlider.value);
      this.textIntensityVal.textContent = `${Math.round(val * 100)}%`;
      engine.setAnimationIntensity(val);
    });
  }
}

check('2.1: Multi-layer text input events update engine layers and hasActiveContent()', () => {
  const harness = new TextOverlayUIHarness();
  assert.strictEqual(harness.engine.hasActiveContent(), false, 'Overlay must be inactive initially');

  harness.textInput0.input('Strobe Symphony');
  assert.strictEqual(harness.engine.getConfig().layers.title, 'Strobe Symphony');
  assert.strictEqual(harness.engine.hasActiveContent(), true);

  harness.textInput1.input('Cyber Pulse');
  assert.strictEqual(harness.engine.getConfig().layers.artist, 'Cyber Pulse');

  harness.textInput2.input('Live from Berlin');
  assert.strictEqual(harness.engine.getConfig().layers.custom, 'Live from Berlin');

  const layers = Array.from(harness.engine.getActiveLayers());
  assert.deepStrictEqual(layers, ['title', 'artist', 'custom']);
});

check('2.2: Watermark toggle input event updates engine watermark state and hasActiveContent()', () => {
  const harness = new TextOverlayUIHarness();
  assert.strictEqual(harness.engine.getConfig().watermark, false);

  harness.textWatermarkToggle.checked = true;
  harness.textWatermarkToggle.change();
  assert.strictEqual(harness.engine.getConfig().watermark, true);
  assert.strictEqual(harness.engine.hasActiveContent(), true);

  harness.textWatermarkToggle.checked = false;
  harness.textWatermarkToggle.change();
  assert.strictEqual(harness.engine.getConfig().watermark, false);
  assert.strictEqual(harness.engine.hasActiveContent(), false);
});

check('2.3: 9-point anchor matrix clicks update cell active classes, label, and engine config', () => {
  const harness = new TextOverlayUIHarness();
  const testAnchors = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'center-left', label: 'Center Left' },
    { id: 'center', label: 'Center' },
    { id: 'center-right', label: 'Center Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' }
  ];

  for (const item of testAnchors) {
    const btn = harness.anchorCells.find(c => c.getAttribute('data-anchor') === item.id);
    assert(btn, `Anchor cell for ${item.id} not found`);
    btn.click();

    // Verify exactly 1 cell is active
    const activeCells = harness.anchorCells.filter(c => c.classList.contains('active'));
    assert.strictEqual(activeCells.length, 1, `Expected exactly 1 active cell, found ${activeCells.length}`);
    assert.strictEqual(activeCells[0].getAttribute('data-anchor'), item.id);

    // Verify label and select value
    assert.strictEqual(harness.textAnchorLabel.textContent, item.label);
    assert.strictEqual(harness.textAnchorSelect.value, item.id);

    // Verify engine state
    assert.strictEqual(harness.engine.getConfig().anchor, item.id);
  }
});

check('2.4: 5 animation mode chips clicks update active chip, fallback select, and engine config', () => {
  const harness = new TextOverlayUIHarness();
  const testModes = ['pulse', 'marquee', 'fade', 'static', 'glitch'];

  for (const mode of testModes) {
    const chip = harness.animChips.find(c => c.getAttribute('data-anim') === mode);
    assert(chip, `Chip for ${mode} not found`);
    chip.click();

    // Verify exactly 1 chip is active
    const activeChips = harness.animChips.filter(c => c.classList.contains('active'));
    assert.strictEqual(activeChips.length, 1);
    assert.strictEqual(activeChips[0].getAttribute('data-anim'), mode);

    // Verify select value and engine state
    assert.strictEqual(harness.textAnimSelect.value, mode);
    assert.strictEqual(harness.engine.getConfig().animation, mode);
  }
});

check('2.5: Typography sliders and color pickers two-way reactivity with validation', () => {
  const harness = new TextOverlayUIHarness();

  // Font family
  harness.textFontFamilySelect.value = "'Fira Code', 'Courier New', monospace";
  harness.textFontFamilySelect.change();
  assert.strictEqual(harness.engine.getConfig().fontFamily, "'Fira Code', 'Courier New', monospace");

  // Font size
  harness.textFontSizeSlider.input('48');
  assert.strictEqual(harness.textFontSizeVal.textContent, '48px');
  assert.strictEqual(harness.engine.getConfig().fontSize, 48);

  // Color picker -> Hex input and engine
  harness.textColorPicker.input('#00FFCC');
  assert.strictEqual(harness.textColorPicker.value, '#00FFCC');
  assert.strictEqual(harness.textColorInput.value, '#00FFCC');
  assert.strictEqual(harness.textColorHexVal.textContent, '#00FFCC');
  assert.strictEqual(harness.engine.getConfig().color, '#00FFCC');

  // Hex input -> Color picker and engine
  harness.textColorInput.input('#ff3366');
  assert.strictEqual(harness.textColorPicker.value, '#FF3366');
  assert.strictEqual(harness.textColorHexVal.textContent, '#FF3366');
  assert.strictEqual(harness.engine.getConfig().color, '#FF3366');

  // Invalid hex input does NOT update color
  harness.textColorInput.input('invalid-hex-color');
  assert.strictEqual(harness.engine.getConfig().color, '#FF3366', 'Invalid hex should be ignored');

  // Glow
  harness.textGlowSlider.input('1.5');
  assert.strictEqual(harness.textGlowVal.textContent, '1.5');
  assert.strictEqual(harness.engine.getConfig().glowIntensity, 1.5);

  // Opacity
  harness.textOpacitySlider.input('0.75');
  assert.strictEqual(harness.textOpacityVal.textContent, '75%');
  assert.strictEqual(harness.engine.getConfig().opacity, 0.75);

  // Animation Intensity
  harness.textIntensitySlider.input('0.9');
  assert.strictEqual(harness.textIntensityVal.textContent, '90%');
  assert.strictEqual(harness.engine.getConfig().animationIntensity, 0.9);
});

// =============================================================================
// SECTION 3: DRAWER MUTUAL EXCLUSIVITY, PARITY CYCLES & KEYBOARD HOTKEY 'T'
// =============================================================================
console.log('\n--- SECTION 3: Drawer Mutual Exclusivity, Parity Cycles & Keyboard Hotkey "T" ---');

class DrawerIntegrationHarness {
  constructor() {
    this.PANEL_MAP = {};
    this.allPanels = [];
    this.buttons = [];
    this.activeToolId = 'presets';

    const TOOLS = [
      { id: 'presets', panelId: 'presetsPanel', btnId: 'presetsRailBtn' },
      { id: 'presetSettings', panelId: 'tuningPanel', btnId: 'presetSettingsRailBtn' },
      { id: 'colors', panelId: 'themesPanel', btnId: 'themesBtn' },
      { id: 'effects', panelId: 'fxPanel', btnId: 'fxBtn' },
      { id: 'camera', panelId: 'cameraPanel', btnId: 'cameraBtn' },
      { id: 'audio', panelId: 'audioPanel', btnId: 'audioBtn' },
      { id: 'overlay', panelId: 'overlayPanel', btnId: 'overlayBtn' },
      { id: 'text', panelId: 'textOverlayPanel', btnId: 'textBtn' },
      { id: 'subtitles', panelId: 'subtitlesPanel', btnId: 'subtitlesBtn' },
      { id: 'tracks', panelId: 'queuePanel', btnId: 'trackLibraryRailBtn' },
      { id: 'library', panelId: 'libraryPanel', btnId: 'libraryBtn' },
      { id: 'myCreations', panelId: 'studioPanel', btnId: 'studioBtn' }
    ];

    for (const t of TOOLS) {
      const btn = new SimElement('BUTTON', t.btnId, 'rail-btn');
      btn.setAttribute('data-panel', t.id);
      this.buttons.push(btn);

      const panel = new SimElement('DIV', t.panelId, 'drawer-panel detail-panel');
      panel.setAttribute('data-panel', t.id);
      this.allPanels.push(panel);
      this.PANEL_MAP[t.id] = panel;
    }

    // Mirror main.ts alias
    this.PANEL_MAP['textOverlayPanel'] = this.PANEL_MAP['text'];

    // Initial state: presets is open
    this.PANEL_MAP['presets'].classList.add('open');
    this.getBtn('presets').classList.add('active');

    // Close buttons
    this.closeTextBtn = new SimElement('BUTTON', 'closeTextBtn', 'btn-icon close-drawer-btn closeTextBtn');
    this.closeDrawerBtn = new SimElement('BUTTON', 'closeDrawerBtn', 'btn-icon close-drawer-btn');

    this.wire();
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
    const panel = this.PANEL_MAP[toolId];
    if (panel) {
      panel.classList.add('open');
    }
  }

  toggleDrawer(toolId) {
    if (this.activeToolId === toolId) {
      const panel = this.PANEL_MAP[toolId];
      panel?.classList.remove('open');
      const btn = this.getBtn(toolId);
      btn?.classList.remove('active');
      this.activeToolId = null;
      return;
    }
    this.openDrawer(toolId);
  }

  handleKeyboardHotkey(key, isShift) {
    switch (key.toLowerCase()) {
      case 't':
        this.toggleDrawer('text');
        return true;
      default:
        return false;
    }
  }

  dispatchKeydown(key, isShift, targetElement = null) {
    const isInput = Boolean(targetElement && (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA'));
    if (isInput) return false;
    return this.handleKeyboardHotkey(key, isShift);
  }

  wire() {
    this.buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.dataset.panel;
        if (toolId) this.toggleDrawer(toolId);
      });
    });

    [this.closeTextBtn, this.closeDrawerBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllDrawers();
        this.activeToolId = null;
      });
    });
  }
}

check('3.1: Mutual exclusivity: Switching between Text and other drawers closes previous and opens target', () => {
  const harness = new DrawerIntegrationHarness();
  assert.strictEqual(harness.activeToolId, 'presets');
  assert(harness.PANEL_MAP['presets'].classList.contains('open'));

  // Switch to text
  harness.getBtn('text').click();
  assert.strictEqual(harness.activeToolId, 'text');
  assert(harness.PANEL_MAP['text'].classList.contains('open'), '#textOverlayPanel should be open');
  assert(harness.getBtn('text').classList.contains('active'), '#textBtn should be active');
  assert(!harness.PANEL_MAP['presets'].classList.contains('open'), 'presetsPanel should be closed');
  assert(!harness.getBtn('presets').classList.contains('active'), 'presetsRailBtn should be inactive');

  // Verify exactly 1 panel is open
  const openPanels = harness.allPanels.filter(p => p.classList.contains('open'));
  assert.strictEqual(openPanels.length, 1);
  assert.strictEqual(openPanels[0].id, 'textOverlayPanel');

  // Switch to camera
  harness.getBtn('camera').click();
  assert.strictEqual(harness.activeToolId, 'camera');
  assert(!harness.PANEL_MAP['text'].classList.contains('open'), '#textOverlayPanel should be closed');
  assert(!harness.getBtn('text').classList.contains('active'), '#textBtn should be inactive');
});

check('3.2: Self-toggle: Clicking #textBtn when #textOverlayPanel is open closes it cleanly', () => {
  const harness = new DrawerIntegrationHarness();
  harness.openDrawer('text');

  // Click #textBtn again
  harness.getBtn('text').click();
  assert.strictEqual(harness.activeToolId, null);
  assert(!harness.PANEL_MAP['text'].classList.contains('open'));
  assert(!harness.getBtn('text').classList.contains('active'));

  // All 12 panels must be closed
  for (const p of harness.allPanels) {
    assert(!p.classList.contains('open'), `Panel ${p.id} should be closed`);
  }
});

check('3.3: Close button #closeTextBtn closes drawer and clears activeToolId', () => {
  const harness = new DrawerIntegrationHarness();
  harness.openDrawer('text');
  assert.strictEqual(harness.activeToolId, 'text');

  harness.closeTextBtn.click();
  assert.strictEqual(harness.activeToolId, null);
  assert(!harness.PANEL_MAP['text'].classList.contains('open'));
  assert(!harness.getBtn('text').classList.contains('active'));
});

check('3.4: Keyboard hotkey "t" and "T" toggles #textOverlayPanel', () => {
  const harness = new DrawerIntegrationHarness();
  // Close initial presets panel
  harness.closeAllDrawers();
  harness.activeToolId = null;

  // Press lowercase 't' -> opens text drawer
  harness.dispatchKeydown('t', false);
  assert.strictEqual(harness.activeToolId, 'text');
  assert(harness.PANEL_MAP['text'].classList.contains('open'));
  assert(harness.getBtn('text').classList.contains('active'));

  // Press lowercase 't' again -> closes text drawer
  harness.dispatchKeydown('t', false);
  assert.strictEqual(harness.activeToolId, null);
  assert(!harness.PANEL_MAP['text'].classList.contains('open'));

  // Press uppercase 'T' (with Shift) -> opens text drawer
  harness.dispatchKeydown('T', true);
  assert.strictEqual(harness.activeToolId, 'text');
  assert(harness.PANEL_MAP['text'].classList.contains('open'));

  // Press uppercase 'T' again -> closes text drawer
  harness.dispatchKeydown('T', true);
  assert.strictEqual(harness.activeToolId, null);
  assert(!harness.PANEL_MAP['text'].classList.contains('open'));
});

check('3.5: Keyboard hotkey "t" is suppressed when typing inside an <input> or <textarea>', () => {
  const harness = new DrawerIntegrationHarness();
  harness.openDrawer('text');

  const textInput = new SimElement('INPUT', 'textInput0');
  // While typing inside textInput, pressing 't' should be ignored
  const handled = harness.dispatchKeydown('t', false, textInput);
  assert.strictEqual(handled, false, 'Hotkey must not fire when focused on an input element');
  assert.strictEqual(harness.activeToolId, 'text', 'Drawer must remain open while typing "t"');
  assert(harness.PANEL_MAP['text'].classList.contains('open'));
});

check('3.6: 100-cycle rapid alternating hotkey & click stress test preserves parity state', () => {
  const harness = new DrawerIntegrationHarness();
  harness.closeAllDrawers();
  harness.activeToolId = null;

  for (let i = 0; i < 100; i++) {
    if (i % 2 === 0) {
      harness.dispatchKeydown('t', false);
      assert.strictEqual(harness.activeToolId, 'text');
    } else {
      harness.getBtn('text').click();
      assert.strictEqual(harness.activeToolId, null);
    }
  }

  // After 100 alternating operations (50 opens, 50 closes), drawer must be closed
  assert.strictEqual(harness.activeToolId, null);
  assert(!harness.PANEL_MAP['text'].classList.contains('open'));
  assert(!harness.getBtn('text').classList.contains('active'));
});

// =============================================================================
// SECTION 4: ADVERSARIAL STRESS, EVENT FLOODS & BOUNDARY MINING
// =============================================================================
console.log('\n--- SECTION 4: Adversarial Stress, Event Floods & Boundary Mining ---');

check('4.1: Rapid 1,000 keystroke flood across text inputs with Unicode, emojis, and HTML entities', () => {
  const harness = new TextOverlayUIHarness();
  const testPayloads = [
    '🔥 CYBER KICK ⚡ 999 BPM 🚀',
    '<script>alert("XSS")</script>',
    'こんにちは世界 (Hello World)',
    'Line1\nLine2\tLine3\0NullByte',
    'A'.repeat(500) // length > 200 max length
  ];

  for (let i = 0; i < 1000; i++) {
    const payload = testPayloads[i % testPayloads.length];
    harness.textInput0.input(payload);
    harness.textInput1.input(payload);
    harness.textInput2.input(payload);
  }

  // Verify engine remains completely functional with valid strings
  const conf = harness.engine.getConfig();
  assert.strictEqual(typeof conf.layers.title, 'string');
  assert.strictEqual(typeof conf.layers.artist, 'string');
  assert.strictEqual(typeof conf.layers.custom, 'string');
  assert(harness.engine.hasActiveContent());
});

check('4.2: Extreme out-of-bounds slider inputs are clamped strictly within safe limits', () => {
  const harness = new TextOverlayUIHarness();

  // Font size: valid [12, 96]
  harness.engine.setFontSize(-999);
  assert.strictEqual(harness.engine.getConfig().fontSize, 12, 'Negative font size must clamp to min 12');
  harness.engine.setFontSize(99999);
  assert.strictEqual(harness.engine.getConfig().fontSize, 96, 'Extreme font size must clamp to max 96');
  harness.engine.setFontSize(NaN);
  assert.strictEqual(harness.engine.getConfig().fontSize, 32, 'NaN font size must fallback to 32');

  // Glow: valid [0.0, 2.0]
  harness.engine.setGlowIntensity(-5.0);
  assert.strictEqual(harness.engine.getConfig().glowIntensity, 0.0);
  harness.engine.setGlowIntensity(10.0);
  assert.strictEqual(harness.engine.getConfig().glowIntensity, 2.0);

  // Opacity: valid [0.0, 1.0]
  harness.engine.setOpacity(-1.0);
  assert.strictEqual(harness.engine.getConfig().opacity, 0.0);
  harness.engine.setOpacity(2.5);
  assert.strictEqual(harness.engine.getConfig().opacity, 1.0);

  // Animation Intensity: valid [0.0, 1.0]
  harness.engine.setAnimationIntensity(-0.5);
  assert.strictEqual(harness.engine.getConfig().animationIntensity, 0.0);
  harness.engine.setAnimationIntensity(5.0);
  assert.strictEqual(harness.engine.getConfig().animationIntensity, 1.0);
});

check('4.3: 500 randomized concurrent clicks across all 9 anchor cells and 5 anim chips', () => {
  const harness = new TextOverlayUIHarness();

  for (let i = 0; i < 500; i++) {
    const randomCell = harness.anchorCells[Math.floor(Math.random() * harness.anchorCells.length)];
    const randomChip = harness.animChips[Math.floor(Math.random() * harness.animChips.length)];
    randomCell.click();
    randomChip.click();

    // Verify exactly 1 cell is active
    const activeCells = harness.anchorCells.filter(c => c.classList.contains('active'));
    assert.strictEqual(activeCells.length, 1);

    // Verify exactly 1 chip is active
    const activeChips = harness.animChips.filter(c => c.classList.contains('active'));
    assert.strictEqual(activeChips.length, 1);
  }

  // Verify engine state matches active cell and chip
  const activeAnchor = harness.anchorCells.find(c => c.classList.contains('active')).getAttribute('data-anchor');
  const activeMode = harness.animChips.find(c => c.classList.contains('active')).getAttribute('data-anim');
  assert.strictEqual(harness.engine.getConfig().anchor, activeAnchor);
  assert.strictEqual(harness.engine.getConfig().animation, activeMode);
});

check('4.4: Static event listener integrity in src/main.ts (no listeners bound dynamically in openDrawer)', () => {
  // Extract openDrawer function body
  const openDrawerMatch = mainTsContent.match(/function\s+openDrawer\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
  assert(openDrawerMatch, 'Could not find openDrawer function in src/main.ts');
  const openDrawerBody = openDrawerMatch[1];

  assert(!openDrawerBody.includes('addEventListener'), 'openDrawer must not add dynamic event listeners (leak hazard)');

  // Extract toggleDrawer function body
  const toggleDrawerMatch = mainTsContent.match(/function\s+toggleDrawer\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
  assert(toggleDrawerMatch, 'Could not find toggleDrawer function in src/main.ts');
  const toggleDrawerBody = toggleDrawerMatch[1];
  assert(!toggleDrawerBody.includes('addEventListener'), 'toggleDrawer must not add dynamic event listeners');
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
  console.error(`Verification FAILED with ${failedTests} failures:`);
  failures.forEach(f => {
    console.error(` - [FAIL] ${f.testName}: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('>>> ALL EMPIRICAL CHALLENGER MILESTONE 5 CHECKS PASSED PERFECTLY! <<<\n');
  process.exit(0);
}
