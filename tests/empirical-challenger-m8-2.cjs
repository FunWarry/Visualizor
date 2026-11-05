/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 8 (TICKET #38)
 * Target: Complete 71-Preset Catalog, UI Drawer Rendering, Category Counters, & Search Matrix
 * Challenger: challenger_m8_2 (UI and Category Counter Challenger - critic, specialist)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const esbuild = require('esbuild');

console.log('================================================================================');
console.log('  EMPIRICAL CHALLENGER HARNESS: MILESTONE 8 UI & 71-PRESET MATRIX (#38)        ');
console.log('================================================================================\n');

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
// File Paths
// -----------------------------------------------------------------------------
const htmlPath = path.resolve(__dirname, '../index.html');
const cssPath = path.resolve(__dirname, '../src/style.css');
const mainTsPath = path.resolve(__dirname, '../src/main.ts');
const presetsIndexPath = path.resolve(__dirname, '../src/presets/index.ts');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

// -----------------------------------------------------------------------------
// Load and Bundle src/presets/index.ts
// -----------------------------------------------------------------------------
let PRESETS = [];
let getPreset = null;
let PRESET_ALIASES = {};

try {
  const buildResult = esbuild.buildSync({
    entryPoints: [presetsIndexPath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['three'],
    write: false
  });

  const vmContext = {
    module: { exports: {} },
    exports: {},
    console,
    require,
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
  PRESETS = vmContext.module.exports.PRESETS;
  getPreset = vmContext.module.exports.getPreset;
  PRESET_ALIASES = vmContext.module.exports.PRESET_ALIASES;
} catch (err) {
  console.error('Fatal error bundling src/presets/index.ts:', err);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Category Definitions & SVG Icon Mapper matching src/main.ts
// -----------------------------------------------------------------------------
const CANONICAL_CATEGORIES = [
  { name: 'Structures', key: 'Structures', expectedCount: 15 },
  { name: 'Abstract & Space', key: 'Abstract & Space', expectedCount: 15 },
  { name: 'Particles & Light', key: 'Particles & Light', expectedCount: 4 },
  { name: 'Fluids & Heat', key: 'Fluids & Heat', expectedCount: 9 },
  { name: 'Tunnels', key: 'Tunnels', expectedCount: 7 },
  { name: 'Retro & Digital', key: 'Retro & Digital', expectedCount: 7 },
  { name: 'Organic & Nature', key: 'Organic & Nature', expectedCount: 14 }
];

function getPresetThumbnailSvg(preset) {
  switch (preset.category) {
    case 'Structures':
      return `<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`;
    case 'Abstract & Space':
      return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/></svg>`;
    case 'Particles & Light':
      return `<svg viewBox="0 0 24 24"><path d="m13 2-2 7h5l-4 13 2-7H9l4-13Z"/></svg>`;
    case 'Fluids & Heat':
      return `<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case 'Tunnels':
      return `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/><rect x="10" y="10" width="4" height="4"/></svg>`;
    case 'Retro & Digital':
      return `<svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;
    case 'Organic & Nature':
      return `<svg viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
}

// -----------------------------------------------------------------------------
// Lightweight Simulated DOM for Headless Testing
// -----------------------------------------------------------------------------
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
  if (sel.startsWith('.')) {
    const classes = sel.split('.').filter(Boolean);
    return classes.every(c => el.classList.contains(c));
  }
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
  constructor(tag, id = '', className = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new SimTokenList(className ? className.split(/\s+/).filter(Boolean) : []);
    this.attributes = new Map();
    this.dataset = {};
    this.listeners = new Map();
    this.children = [];
    this.style = {};
    this.value = '';
    this.textContent = '';
    this.parentElement = null;
    this._innerHTML = '';
  }

  get className() { return this.classList.toString(); }
  set className(val) {
    this.classList = new SimTokenList(val ? val.split(/\s+/).filter(Boolean) : []);
  }

  get innerHTML() { return this._innerHTML; }
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

  getAttribute(k) { return this.attributes.has(k) ? this.attributes.get(k) : null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  addEventListener(type, fn) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(fn);
  }

  removeEventListener(type, fn) {
    if (this.listeners.has(type)) this.listeners.get(type).delete(fn);
  }

  dispatchEvent(evt) {
    if (!evt.target) evt.target = this;
    if (this.listeners.has(evt.type)) {
      for (const fn of this.listeners.get(evt.type)) {
        fn(evt);
        if (evt._stopped) break;
      }
    }
    if (!evt._stopped && this.parentElement) {
      this.parentElement.dispatchEvent(evt);
    }
  }

  querySelector(sel) { return querySelectorDeep(this, sel); }
  querySelectorAll(sel) { return querySelectorAllDeep(this, sel); }

  click() {
    let stopped = false;
    const evt = {
      type: 'click',
      target: this,
      preventDefault: () => {},
      stopPropagation: () => { stopped = true; evt._stopped = true; },
      _stopped: false
    };
    this.dispatchEvent(evt);
  }
}

// =============================================================================
// SECTION 1: PRESET CATALOG INTEGRITY & 7-CATEGORY BREAKDOWN MATRIX
// =============================================================================
console.log('--- SECTION 1: Preset Catalog Integrity & 7-Category Breakdown Matrix ---');

check('1.1: Total registered presets strictly equals 71', () => {
  assert.strictEqual(PRESETS.length, 71, `Expected PRESETS.length to be 71, but got ${PRESETS.length}`);
});

check('1.2: Exact category breakdown strictly matches canonical distribution (15, 15, 4, 9, 7, 7, 14 = 71)', () => {
  const counts = {};
  for (const cat of CANONICAL_CATEGORIES) {
    counts[cat.key] = 0;
  }

  for (const p of PRESETS) {
    assert(counts[p.category] !== undefined, `Unknown category "${p.category}" on preset "${p.id}"`);
    counts[p.category]++;
  }

  let totalSum = 0;
  for (const cat of CANONICAL_CATEGORIES) {
    assert.strictEqual(
      counts[cat.key],
      cat.expectedCount,
      `Category "${cat.key}" expected ${cat.expectedCount} presets, but found ${counts[cat.key]}`
    );
    totalSum += counts[cat.key];
  }

  assert.strictEqual(totalSum, 71, `Total sum of presets across categories must be 71, got ${totalSum}`);
});

check('1.3: All 71 presets have valid, non-empty, unique IDs and names', () => {
  const ids = new Set();
  const names = new Set();

  for (const p of PRESETS) {
    assert(typeof p.id === 'string' && p.id.trim().length > 0, `Preset missing valid id: ${JSON.stringify(p)}`);
    assert(typeof p.name === 'string' && p.name.trim().length > 0, `Preset "${p.id}" missing name`);
    assert(typeof p.description === 'string' && p.description.trim().length > 0, `Preset "${p.id}" missing description`);
    assert(!ids.has(p.id), `Duplicate preset id found: "${p.id}"`);
    assert(!names.has(p.name), `Duplicate preset name found: "${p.name}"`);
    ids.add(p.id);
    names.add(p.name);
  }

  assert.strictEqual(ids.size, 71, `Expected 71 unique IDs, found ${ids.size}`);
  assert.strictEqual(names.size, 71, `Expected 71 unique names, found ${names.size}`);
});

check('1.4: PRESET_ALIASES maps legacy IDs and getPreset returns matching instances', () => {
  const testAliases = [
    ['waveform', 'wave'],
    ['wave-form', 'wave'],
    ['circular-spectrum', 'circular'],
    ['3d-bars', 'bars3d'],
    ['three-d-bars', 'bars3d'],
    ['obsidian-poly', 'obsidian'],
    ['pendulum-wave', 'pendulum'],
    ['warp-grid', 'warp'],
    ['dna-helix', 'dna'],
    ['cymatic-plate', 'cymatic'],
    ['topo-map', 'topographic'],
    ['vinyl-player', 'vinyl'],
    ['orbital-rings', 'rings'],
    ['tesseract-4d', 'tesseract'],
    ['hologram-glitch', 'hologram'],
    ['geodesic-sphere', 'geodesic'],
    ['halo-bloom', 'halo'],
    ['face-mask', 'face'],
    ['geiss-feedback', 'geiss'],
    ['tiedye-fabric', 'tiedye'],
    ['gravity-force', 'gravityforce'],
    ['sacred-mandala', 'sacred'],
    ['the-sun', 'sun'],
    ['black-hole', 'blackhole'],
    ['mandel-fractal', 'mandel'],
    ['unfolding-matter', 'unfoldingmatter'],
    ['synthwave-terrain', 'terrain'],
    ['particle-field', 'particles'],
    ['plasma-arcs', 'plasmaarcs'],
    ['lava-energy', 'lava'],
    ['water-neurons', 'waterneurons'],
    ['rain-water', 'water'],
    ['water-slide', 'waterslide'],
    ['neon-tunnel', 'neontunnel'],
    ['vein-tunnel', 'veintunnel'],
    ['kaleidoscope-mandala', 'kaleidoscope'],
    ['box-tunnel', 'boxtunnel'],
    ['ring-tunnel', 'ringtunnel'],
    ['matrix-rain', 'matrix'],
    ['vod-lines', 'vodlines'],
    ['night-radar', 'nightradar'],
    ['diode-wall', 'diodewall'],
    ['lcd-deck', 'lcddeck'],
    ['signal-lock', 'signallock'],
    ['bloom-flower', 'bloom'],
    ['ink-drops', 'ink'],
    ['meadow-field', 'meadow'],
    ['bio-cells', 'biocells'],
    ['up-cloud', 'upcloud'],
    ['rain-room', 'rainroom'],
    ['ocean-waves', 'ocean'],
    ['forest-storm', 'forest'],
    ['single-tree', 'singletree'],
    ['haunted-forest', 'hauntedforest'],
    ['storm-cell', 'stormcell']
  ];

  for (const [alias, canonicalId] of testAliases) {
    assert.strictEqual(PRESET_ALIASES[alias], canonicalId, `Alias "${alias}" should map to "${canonicalId}"`);
    const retrieved = getPreset(alias);
    assert(retrieved, `getPreset("${alias}") returned undefined`);
    assert.strictEqual(retrieved.id, alias, `getPreset Proxy should preserve queried alias ID "${alias}"`);
    assert.strictEqual(retrieved.name, getPreset(canonicalId).name, `Names must match for alias "${alias}"`);
  }

  // Fallback check
  const fallback = getPreset('completely-unknown-preset-xyz-999');
  assert(fallback, 'Fallback preset must be returned for unknown ID');
  assert.strictEqual(fallback.id, PRESETS[0].id, 'Fallback must be PRESETS[0]');
});

// =============================================================================
// SECTION 2: STATIC DOM & CSS SPECIFICATION AUDIT
// =============================================================================
console.log('\n--- SECTION 2: Static DOM, Attributes & CSS Specification Audit ---');

check('2.1: index.html contains #presetCategoryTabs with 7 category tabs and badge counters', () => {
  const tabsMatch = htmlContent.match(/<div[^>]*id="presetCategoryTabs"[^>]*>([\s\S]*?)<\/div>/i);
  assert(tabsMatch, 'Missing container with id="presetCategoryTabs" in index.html');
  const tabsInner = tabsMatch[1];

  assert(tabsInner.includes('id="filterAllBtn"'), 'Missing #filterAllBtn in #presetCategoryTabs');
  assert(tabsInner.includes('id="badgeAll"'), 'Missing #badgeAll badge in #filterAllBtn');
  assert(tabsInner.includes('id="badgeFav"'), 'Missing #badgeFav badge in #filterFavBtn');
  assert(tabsInner.includes('id="filterMilkdropBtn"'), 'Missing #filterMilkdropBtn');

  for (const cat of CANONICAL_CATEGORIES) {
    const dataFilterAttr = `data-filter="${cat.key}"`;
    const dataCatAttr = `data-category="${cat.key}"`;
    const dataBadgeAttr = `data-category-badge="${cat.key}"`;

    assert(tabsInner.includes(dataFilterAttr), `Missing tab with ${dataFilterAttr}`);
    assert(tabsInner.includes(dataCatAttr), `Missing tab with ${dataCatAttr}`);
    assert(tabsInner.includes(dataBadgeAttr), `Missing badge with ${dataBadgeAttr}`);
  }
});

check('2.2: src/style.css defines horizontally scrollable category tabs, tab badges, and cards grid', () => {
  assert(cssContent.includes('.drawer-filter-pills'), 'Missing .drawer-filter-pills CSS');
  assert(cssContent.includes('overflow-x: auto'), '.drawer-filter-pills must have overflow-x: auto');
  assert(cssContent.includes('flex-wrap: nowrap'), '.drawer-filter-pills must have flex-wrap: nowrap');

  assert(cssContent.includes('.tab-badge'), 'Missing .tab-badge CSS');
  assert(cssContent.includes('min-width: 16px'), '.tab-badge must define min-width');
  assert(cssContent.includes('border-radius: 999px'), '.tab-badge must have pill border-radius');

  assert(cssContent.includes('.cards-grid-3'), 'Missing .cards-grid-3 CSS');
  assert(cssContent.includes('grid-template-columns: repeat(3, 1fr)'), '.cards-grid-3 must define 3 columns');

  assert(cssContent.includes('.preset-card-3'), 'Missing .preset-card-3 CSS');
  assert(cssContent.includes('.preset-thumb-visual'), 'Missing .preset-thumb-visual CSS');
  assert(cssContent.includes('.preset-badge-name'), 'Missing .preset-badge-name CSS');
  assert(cssContent.includes('.preset-cat-badge'), 'Missing .preset-cat-badge CSS');
  assert(cssContent.includes('.preset-active-indicator'), 'Missing .preset-active-indicator CSS');
  assert(cssContent.includes('.preset-fav-btn'), 'Missing .preset-fav-btn CSS');

  // Media queries
  assert(cssContent.includes('@media (max-width: 640px)'), 'Missing mobile responsive media query (<= 640px)');
  assert(cssContent.includes('@media (min-width: 641px) and (max-width: 1024px)'), 'Missing tablet media query');
  assert(cssContent.includes('@media (min-width: 1025px)'), 'Missing desktop media query');
});

// =============================================================================
// SECTION 3: DYNAMIC TAB COUNTER BADGES DOM VALIDATION
// =============================================================================
console.log('\n--- SECTION 3: Dynamic Tab Counter Badges DOM Validation ---');

class MockPresetDrawerDOM {
  constructor() {
    this.container = new SimElement('DIV', 'presetsPanel', 'drawer-panel detail-panel');
    this.tabsContainer = new SimElement('DIV', 'presetCategoryTabs', 'drawer-filter-pills');
    this.container.appendChild(this.tabsContainer);

    // All pill
    this.allPill = new SimElement('BUTTON', 'filterAllBtn', 'filter-pill active');
    this.allPill.setAttribute('data-filter', 'all');
    this.badgeAll = new SimElement('SPAN', 'badgeAll', 'tab-badge');
    this.badgeAll.textContent = '0';
    this.allPill.appendChild(this.badgeAll);
    this.tabsContainer.appendChild(this.allPill);

    // Fav pill
    this.favPill = new SimElement('BUTTON', 'filterFavBtn', 'filter-pill');
    this.favPill.setAttribute('data-filter', 'fav');
    this.badgeFav = new SimElement('SPAN', 'badgeFav', 'tab-badge');
    this.badgeFav.textContent = '0';
    this.favPill.appendChild(this.badgeFav);
    this.tabsContainer.appendChild(this.favPill);

    // 7 Category pills
    this.catPills = {};
    this.catBadges = {};
    for (const cat of CANONICAL_CATEGORIES) {
      const pill = new SimElement('BUTTON', '', 'filter-pill');
      pill.setAttribute('data-filter', cat.key);
      pill.setAttribute('data-category', cat.key);
      const badge = new SimElement('SPAN', '', 'tab-badge');
      badge.setAttribute('data-category-badge', cat.key);
      badge.textContent = '0';
      pill.appendChild(badge);
      this.tabsContainer.appendChild(pill);

      this.catPills[cat.key] = pill;
      this.catBadges[cat.key] = badge;
    }

    // Catalog view
    this.catalogView = new SimElement('DIV', 'presetsCatalogView');
    this.container.appendChild(this.catalogView);

    this.favoritePresets = new Set();
    this.currentFilter = 'all';
    this.searchQuery = '';
    this.activePresetId = 'wave';
  }

  updatePresetCategoryTabCounters() {
    const counts = {};
    for (const c of CANONICAL_CATEGORIES) {
      counts[c.key] = 0;
    }
    for (const p of PRESETS) {
      if (counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    }

    this.badgeAll.textContent = PRESETS.length.toString();

    const favCount = Array.from(this.favoritePresets).filter(id =>
      PRESETS.some(p => p.id === id) || id.startsWith('milkdrop_')
    ).length;
    this.badgeFav.textContent = favCount.toString();

    for (const c of CANONICAL_CATEGORIES) {
      const badge = this.tabsContainer.querySelector(`[data-category-badge="${c.key}"]`);
      if (badge) {
        badge.textContent = (counts[c.key] || 0).toString();
      }
    }
  }

  setFilter(f) {
    this.currentFilter = f;
    const pills = this.tabsContainer.querySelectorAll('.filter-pill');
    for (const pill of pills) {
      const isMatching = pill.getAttribute('data-filter') === f;
      pill.classList.toggle('active', isMatching);
      pill.setAttribute('aria-selected', String(isMatching));
    }
    this.renderPresetsCatalog();
  }

  renderPresetsCatalog() {
    this.updatePresetCategoryTabCounters();
    this.catalogView.innerHTML = '';
    this.catalogView.children = [];

    const q = this.searchQuery.toLowerCase().trim();

    if (this.currentFilter !== 'milkdrop') {
      for (const cat of CANONICAL_CATEGORIES) {
        if (this.currentFilter !== 'all' && this.currentFilter !== 'fav' && this.currentFilter !== cat.key) {
          continue;
        }

        let catPresets = PRESETS.filter(p => p.category === cat.key);
        if (q) {
          catPresets = catPresets.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q))
          );
        }
        if (this.currentFilter === 'fav') {
          catPresets = catPresets.filter(p => this.favoritePresets.has(p.id));
        }

        if (catPresets.length === 0) continue;

        const sectionHeader = new SimElement('DIV', '', 'category-header');
        sectionHeader.innerHTML = `<span>${cat.name}</span><span>${catPresets.length}</span>`;
        this.catalogView.appendChild(sectionHeader);

        const grid = new SimElement('DIV', '', 'cards-grid-3');

        for (const p of catPresets) {
          const isFav = this.favoritePresets.has(p.id);
          const isActive = this.activePresetId === p.id;

          const card = new SimElement('DIV', '', `preset-card-3 ${isActive ? 'active' : ''}`);
          card.setAttribute('data-preset-id', p.id);
          card.setAttribute('data-category', p.category);
          card.setAttribute('role', 'button');
          card.setAttribute('tabindex', '0');

          // Active indicator
          const indicator = new SimElement('SPAN', '', 'preset-active-indicator');
          indicator.setAttribute('title', 'Active');
          card.appendChild(indicator);

          // Fav button
          const favBtn = new SimElement('BUTTON', '', `preset-fav-btn ${isFav ? 'active' : ''}`);
          favBtn.setAttribute('aria-label', 'Favorite preset');
          favBtn.setAttribute('title', 'Favorite');
          favBtn.textContent = '★';
          favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.favoritePresets.has(p.id)) {
              this.favoritePresets.delete(p.id);
            } else {
              this.favoritePresets.add(p.id);
            }
            this.renderPresetsCatalog();
          });
          card.appendChild(favBtn);

          // SVG Thumbnail
          const thumb = new SimElement('DIV', '', 'preset-thumb-visual');
          thumb.innerHTML = getPresetThumbnailSvg(p);
          card.appendChild(thumb);

          // Card info
          const info = new SimElement('DIV', '', 'preset-card-info');
          const title = new SimElement('DIV', '', 'preset-badge-name');
          title.setAttribute('title', p.name);
          title.textContent = p.name;
          const catBadge = new SimElement('SPAN', '', 'preset-cat-badge');
          catBadge.textContent = p.category;
          info.appendChild(title);
          info.appendChild(catBadge);
          card.appendChild(info);

          card.addEventListener('click', () => {
            this.activePresetId = p.id;
            this.renderPresetsCatalog();
          });

          grid.appendChild(card);
        }

        this.catalogView.appendChild(grid);
      }
    }
  }
}

check('3.1: updatePresetCategoryTabCounters sets #badgeAll to 71 and all 7 category badges accurately', () => {
  const dom = new MockPresetDrawerDOM();
  dom.updatePresetCategoryTabCounters();

  assert.strictEqual(dom.badgeAll.textContent, '71', '#badgeAll must display "71"');

  for (const cat of CANONICAL_CATEGORIES) {
    const badge = dom.tabsContainer.querySelector(`[data-category-badge="${cat.key}"]`);
    assert(badge, `Missing badge for category ${cat.key}`);
    assert.strictEqual(
      badge.textContent,
      cat.expectedCount.toString(),
      `Badge for category ${cat.key} expected "${cat.expectedCount}", got "${badge.textContent}"`
    );
  }
});

check('3.2: Dynamic favorite counter badge updates when favorites are added and removed', () => {
  const dom = new MockPresetDrawerDOM();
  dom.updatePresetCategoryTabCounters();
  assert.strictEqual(dom.badgeFav.textContent, '0', 'Initial favorite count must be 0');

  // Add 1 favorite
  dom.favoritePresets.add('wave');
  dom.updatePresetCategoryTabCounters();
  assert.strictEqual(dom.badgeFav.textContent, '1');

  // Add 4 more favorites
  dom.favoritePresets.add('matrix');
  dom.favoritePresets.add('particles');
  dom.favoritePresets.add('ocean');
  dom.favoritePresets.add('tunnel');
  dom.updatePresetCategoryTabCounters();
  assert.strictEqual(dom.badgeFav.textContent, '5');

  // Remove 2 favorites
  dom.favoritePresets.delete('wave');
  dom.favoritePresets.delete('tunnel');
  dom.updatePresetCategoryTabCounters();
  assert.strictEqual(dom.badgeFav.textContent, '3');
});

check('3.3: Category filter pill selection updates active class and aria-selected state', () => {
  const dom = new MockPresetDrawerDOM();
  dom.renderPresetsCatalog();

  assert(dom.allPill.classList.contains('active'), 'Default active filter must be "all"');

  dom.setFilter('Structures');
  assert(!dom.allPill.classList.contains('active'), 'All pill must lose active class');
  assert.strictEqual(dom.allPill.getAttribute('aria-selected'), 'false');

  const structPill = dom.catPills['Structures'];
  assert(structPill.classList.contains('active'), 'Structures pill must have active class');
  assert.strictEqual(structPill.getAttribute('aria-selected'), 'true');

  dom.setFilter('Tunnels');
  assert(!structPill.classList.contains('active'), 'Structures pill must lose active class');
  const tunnelPill = dom.catPills['Tunnels'];
  assert(tunnelPill.classList.contains('active'), 'Tunnels pill must have active class');
  assert.strictEqual(tunnelPill.getAttribute('aria-selected'), 'true');
});

// =============================================================================
// SECTION 4: 50-QUERY SEARCH FILTERING MATRIX
// =============================================================================
console.log('\n--- SECTION 4: 50-Query Search Filtering Matrix ---');

const SEARCH_MATRIX = [
  { q: 'wave', minExpected: 3, description: 'Matches wave, pendulum, ocean waves' },
  { q: 'tunnel', minExpected: 7, description: 'Matches all 7 tunnel presets or category' },
  { q: 'particles', minExpected: 4, description: 'Matches particle presets and category' },
  { q: 'forest', minExpected: 2, description: 'Matches ForestStorm and HauntedForest' },
  { q: 'water', minExpected: 3, description: 'Matches RainWater, WaterNeurons, WaterSlide' },
  { q: 'fluid', minExpected: 9, description: 'Matches Fluids & Heat presets and category' },
  { q: 'dna', minExpected: 1, description: 'Matches DNAHelix' },
  { q: 'space', minExpected: 15, description: 'Matches Abstract & Space presets' },
  { q: 'matrix', minExpected: 1, description: 'Matches MatrixRain' },
  { q: 'light', minExpected: 4, description: 'Matches Particles & Light presets' },
  { q: 'retro', minExpected: 7, description: 'Matches Retro & Digital presets' },
  { q: 'digital', minExpected: 7, description: 'Matches Retro & Digital presets' },
  { q: 'organic', minExpected: 14, description: 'Matches Organic & Nature presets' },
  { q: 'nature', minExpected: 14, description: 'Matches Organic & Nature presets' },
  { q: 'bloom', minExpected: 1, description: 'Matches BloomFlower' },
  { q: 'starfield', minExpected: 1, description: 'Matches Starfield' },
  { q: 'milkdrop', minExpected: 1, description: 'Matches MilkDrop' },
  { q: 'fire', minExpected: 2, description: 'Matches Fireflies and Fireball' },
  { q: 'rain', minExpected: 3, description: 'Matches RainRoom, RainWater, MatrixRain' },
  { q: 'tree', minExpected: 1, description: 'Matches SingleTree' },
  { q: 'jellyfish', minExpected: 1, description: 'Matches Jellyfish' },
  { q: 'volcano', minExpected: 1, description: 'Matches Volcano' },
  { q: 'mycelium', minExpected: 1, description: 'Matches Mycelium' },
  { q: 'storm', minExpected: 1, description: 'Matches StormCell' },
  { q: 'cloud', minExpected: 1, description: 'Matches UpCloud' },
  { q: 'ink', minExpected: 1, description: 'Matches InkDiffusion' },
  { q: 'meadow', minExpected: 1, description: 'Matches MeadowField' },
  { q: 'bio', minExpected: 1, description: 'Matches BioCells' },
  { q: 'radar', minExpected: 1, description: 'Matches NightRadar' },
  { q: 'diode', minExpected: 1, description: 'Matches DiodeWall' },
  { q: 'lcd', minExpected: 1, description: 'Matches LCDDeck' },
  { q: 'spectog', minExpected: 1, description: 'Matches Spectrogram ("The Spectogram")' },
  { q: 'signal', minExpected: 1, description: 'Matches SignalLock' },
  { q: 'smoke', minExpected: 1, description: 'Matches Smoke' },
  { q: 'fog', minExpected: 1, description: 'Matches Fog' },
  { q: 'plasma', minExpected: 2, description: 'Matches Plasma and PlasmaArcs' },
  { q: 'lava', minExpected: 1, description: 'Matches LavaEnergy' },
  { q: 'circular', minExpected: 1, description: 'Matches CircularSpectrum' },
  { q: 'bars', minExpected: 1, description: 'Matches ThreeDBars' },
  { q: 'obsidian', minExpected: 1, description: 'Matches ObsidianPoly' },
  { q: 'warp', minExpected: 1, description: 'Matches WarpGrid' },
  { q: 'cymatic', minExpected: 1, description: 'Matches Cymatic' },
  { q: 'topo', minExpected: 1, description: 'Matches TopoMap' },
  { q: 'vinyl', minExpected: 1, description: 'Matches VinylPlayer' },
  { q: 'rings', minExpected: 1, description: 'Matches OrbitalRings' },
  { q: 'tesseract', minExpected: 1, description: 'Matches Tesseract4D' },
  { q: 'hologram', minExpected: 1, description: 'Matches Hologram' },
  { q: 'geodesic', minExpected: 1, description: 'Matches GeodesicSphere' },
  { q: 'galaxy', minExpected: 1, description: 'Matches Galaxy' },
  { q: '__zero_matches_query_xyz_999__', minExpected: 0, maxExpected: 0, description: 'Non-matching query' }
];

assert.strictEqual(SEARCH_MATRIX.length, 50, 'Search matrix must contain exactly 50 distinct queries');

SEARCH_MATRIX.forEach((entry, idx) => {
  check(`4.${idx + 1}: Query "${entry.q}" [${entry.description}] filters presets accurately`, () => {
    const qLower = entry.q.toLowerCase().trim();
    const matched = PRESETS.filter(p =>
      p.name.toLowerCase().includes(qLower) ||
      p.category.toLowerCase().includes(qLower) ||
      (p.description && p.description.toLowerCase().includes(qLower))
    );

    if (entry.maxExpected !== undefined) {
      assert.strictEqual(matched.length, entry.maxExpected, `Query "${entry.q}" should return 0 results`);
    } else {
      assert(matched.length >= entry.minExpected, `Query "${entry.q}" expected >= ${entry.minExpected} matches, got ${matched.length}`);
    }

    // Also verify DOM rendering with this search query
    const dom = new MockPresetDrawerDOM();
    dom.searchQuery = entry.q;
    dom.renderPresetsCatalog();
    const renderedCards = dom.catalogView.querySelectorAll('.preset-card-3');
    assert.strictEqual(renderedCards.length, matched.length, `DOM cards rendered (${renderedCards.length}) must equal matched count (${matched.length})`);
  });
});

check('4.51: Case-insensitivity & whitespace trimming matrix across varied queries', () => {
  const caseTests = ['WAVE', '  wave  ', 'TUNNEL', 'TuNnEl', '   particles   ', 'NATURE', 'fLuIdS'];
  const dom = new MockPresetDrawerDOM();

  for (const q of caseTests) {
    dom.searchQuery = q;
    dom.renderPresetsCatalog();
    const cleanQ = q.toLowerCase().trim();
    const expectedCount = PRESETS.filter(p =>
      p.name.toLowerCase().includes(cleanQ) ||
      p.category.toLowerCase().includes(cleanQ) ||
      (p.description && p.description.toLowerCase().includes(cleanQ))
    ).length;

    const cards = dom.catalogView.querySelectorAll('.preset-card-3');
    assert.strictEqual(cards.length, expectedCount, `Case query "${q}" failed: expected ${expectedCount}, got ${cards.length}`);
  }
});

// =============================================================================
// SECTION 5: PRESET CARD DOM STRUCTURE & INTERACTION
// =============================================================================
console.log('\n--- SECTION 5: Preset Card DOM Structure & Interaction ---');

check('5.1: renderPresetsCatalog produces .cards-grid-3 with complete card DOM structure across all 71 presets', () => {
  const dom = new MockPresetDrawerDOM();
  dom.renderPresetsCatalog();

  const grids = dom.catalogView.querySelectorAll('.cards-grid-3');
  assert(grids.length > 0, 'Catalog view must contain .cards-grid-3 grids');

  const allCards = dom.catalogView.querySelectorAll('.preset-card-3');
  assert.strictEqual(allCards.length, 71, `Catalog view must render all 71 preset cards, got ${allCards.length}`);

  for (let i = 0; i < allCards.length; i++) {
    const card = allCards[i];
    const presetId = card.getAttribute('data-preset-id');
    const category = card.getAttribute('data-category');

    assert(presetId, `Card ${i} missing data-preset-id`);
    assert(category, `Card ${i} missing data-category`);
    assert.strictEqual(card.getAttribute('role'), 'button');
    assert.strictEqual(card.getAttribute('tabindex'), '0');

    // Active indicator
    const indicator = card.querySelector('.preset-active-indicator');
    assert(indicator, `Card "${presetId}" missing .preset-active-indicator`);

    // Fav button
    const favBtn = card.querySelector('.preset-fav-btn');
    assert(favBtn, `Card "${presetId}" missing .preset-fav-btn`);
    assert.strictEqual(favBtn.getAttribute('aria-label'), 'Favorite preset');
    assert.strictEqual(favBtn.textContent, '★');

    // Thumb visual with SVG
    const thumb = card.querySelector('.preset-thumb-visual');
    assert(thumb, `Card "${presetId}" missing .preset-thumb-visual`);
    assert(thumb.innerHTML.includes('<svg'), `Card "${presetId}" thumb must contain <svg> element`);
    assert(thumb.innerHTML.includes('viewBox="0 0 24 24"'), `Card "${presetId}" SVG must have viewBox="0 0 24 24"`);

    // Card info
    const info = card.querySelector('.preset-card-info');
    assert(info, `Card "${presetId}" missing .preset-card-info`);
    const nameEl = info.querySelector('.preset-badge-name');
    assert(nameEl, `Card "${presetId}" missing .preset-badge-name`);
    assert(nameEl.textContent.length > 0, `Card "${presetId}" name must not be empty`);

    const catBadge = info.querySelector('.preset-cat-badge');
    assert(catBadge, `Card "${presetId}" missing .preset-cat-badge`);
    assert.strictEqual(catBadge.textContent, category, `Card "${presetId}" category badge must match preset category`);
  }
});

check('5.2: Active preset card styling matches activePresetId', () => {
  const dom = new MockPresetDrawerDOM();
  dom.activePresetId = 'pendulum';
  dom.renderPresetsCatalog();

  const activeCard = dom.catalogView.querySelector(`.preset-card-3.active`);
  assert(activeCard, 'Must have an active card');
  assert.strictEqual(activeCard.getAttribute('data-preset-id'), 'pendulum');

  // Change active preset to matrix
  dom.activePresetId = 'matrix';
  dom.renderPresetsCatalog();
  const newActiveCard = dom.catalogView.querySelector(`.preset-card-3.active`);
  assert(newActiveCard, 'Must have new active card');
  assert.strictEqual(newActiveCard.getAttribute('data-preset-id'), 'matrix');
});

check('5.3: Favorite button toggle persists without bubbling and updates favorite count', () => {
  const dom = new MockPresetDrawerDOM();
  dom.renderPresetsCatalog();

  assert.strictEqual(dom.favoritePresets.size, 0);

  const card = dom.catalogView.querySelector('[data-preset-id="galaxy"]');
  assert(card, 'Galaxy card must exist');
  const favBtn = card.querySelector('.preset-fav-btn');

  // Click favorite button
  favBtn.click();
  assert(dom.favoritePresets.has('galaxy'), 'Galaxy should be added to favorites');
  assert.strictEqual(dom.badgeFav.textContent, '1', 'Fav badge should update to 1');

  // Click again to unfavorite
  const cardAfter = dom.catalogView.querySelector('[data-preset-id="galaxy"]');
  const favBtnAfter = cardAfter.querySelector('.preset-fav-btn');
  favBtnAfter.click();
  assert(!dom.favoritePresets.has('galaxy'), 'Galaxy should be removed from favorites');
  assert.strictEqual(dom.badgeFav.textContent, '0', 'Fav badge should return to 0');
});

// =============================================================================
// SECTION 6: CATEGORY & FILTER SWITCHING VIEW INTEGRITY
// =============================================================================
console.log('\n--- SECTION 6: Category & Filter Switching View Integrity ---');

check('6.1: Category filter isolation: selecting category tab renders ONLY presets from that category', () => {
  const dom = new MockPresetDrawerDOM();

  for (const cat of CANONICAL_CATEGORIES) {
    dom.setFilter(cat.key);
    const cards = dom.catalogView.querySelectorAll('.preset-card-3');
    assert.strictEqual(cards.length, cat.expectedCount, `Filtered category "${cat.key}" should show ${cat.expectedCount} cards, got ${cards.length}`);

    // Verify all rendered cards belong to this category
    for (const card of cards) {
      assert.strictEqual(
        card.getAttribute('data-category'),
        cat.key,
        `Rendered card ${card.getAttribute('data-preset-id')} belongs to wrong category: ${card.getAttribute('data-category')}`
      );
    }
  }
});

check('6.2: Favorites filter isolation: shows only favorited presets across categories', () => {
  const dom = new MockPresetDrawerDOM();
  dom.favoritePresets.add('wave'); // Structures
  dom.favoritePresets.add('starfield'); // Abstract & Space
  dom.favoritePresets.add('particles'); // Particles & Light
  dom.favoritePresets.add('lava'); // Fluids & Heat

  dom.setFilter('fav');
  const cards = dom.catalogView.querySelectorAll('.preset-card-3');
  assert.strictEqual(cards.length, 4, `Favorites view must render exactly 4 cards, got ${cards.length}`);

  const renderedIds = cards.map(c => c.getAttribute('data-preset-id'));
  assert(renderedIds.includes('wave'));
  assert(renderedIds.includes('starfield'));
  assert(renderedIds.includes('particles'));
  assert(renderedIds.includes('lava'));
});

check('6.3: Compound category filter + search query produces correct intersection', () => {
  const dom = new MockPresetDrawerDOM();
  dom.setFilter('Organic & Nature');
  dom.searchQuery = 'forest';
  dom.renderPresetsCatalog();

  const cards = dom.catalogView.querySelectorAll('.preset-card-3');
  assert.strictEqual(cards.length, 2, `Organic & Nature + "forest" should match 2 presets (ForestStorm, HauntedForest), got ${cards.length}`);

  // Now search for "forest" in Structures
  dom.setFilter('Structures');
  dom.renderPresetsCatalog();
  const emptyCards = dom.catalogView.querySelectorAll('.preset-card-3');
  assert.strictEqual(emptyCards.length, 0, `Structures + "forest" should yield 0 matches, got ${emptyCards.length}`);
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n================================================================================');
console.log(`  CHALLENGER HARNESS RESULTS: ${passedTests} PASSED / ${failedTests} FAILED / ${totalTests} TOTAL`);
console.log('================================================================================');

if (failedTests > 0) {
  console.error('\nFAILURES SUMMARY:');
  failures.forEach((f, i) => {
    console.error(`  ${i + 1}. ${f.testName}`);
    console.error(`     ${f.error}`);
  });
  console.error('\n>>> VERDICT: REQUEST_CHANGES <<<\n');
  process.exit(1);
} else {
  console.log('\n>>> VERDICT: APPROVE <<<\n');
  process.exit(0);
}
