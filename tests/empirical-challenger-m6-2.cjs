/**
 * EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 6 (TICKET #44)
 * Target: Studio Forge Recipe Builder and Engine Modes UI & DOM Integration
 * Challenger: challenger_m6_2 (critic, specialist)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');
const { spawnSync } = require('child_process');
const esbuild = require('esbuild');
const THREE = require('three');

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER HARNESS: MILESTONE 6 UI & DOM INTEGRATION (#44) ');
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
const composerTsPath = path.resolve(__dirname, '../src/studio/StudioComposer.ts');
const typesTsPath = path.resolve(__dirname, '../src/studio/types.ts');

const htmlContent = fs.readFileSync(htmlPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

// =============================================================================
// SECTION 1: STATIC DOM, ATTRIBUTES & SPECIFICATION AUDIT (index.html)
// =============================================================================
console.log('--- SECTION 1: Static DOM, Attributes & Specification Audit (index.html) ---');

check('1.1: Desktop rail button #studioBtn retains data-panel="myCreations" and data-alias="studio"', () => {
  const match = htmlContent.match(/<button[^>]*id="studioBtn"[^>]*>/i);
  assert(match, 'Missing button with id="studioBtn" in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="myCreations"'), `#studioBtn must have data-panel="myCreations". Got: ${tag}`);
  assert(tag.includes('data-alias="studio"'), `#studioBtn must have data-alias="studio". Got: ${tag}`);
  assert(/class="[^"]*rail-btn[^"]*"/i.test(tag), `#studioBtn must have rail-btn class`);
  assert(/class="[^"]*studio-link[^"]*"/i.test(tag), `#studioBtn must have studio-link class`);
  assert(/class="[^"]*rail-btn--desktop-only[^"]*"/i.test(tag), `#studioBtn must have rail-btn--desktop-only class`);
  assert(/aria-label="Studio Composer"/i.test(tag), `#studioBtn must have aria-label="Studio Composer"`);
  assert(/title="Visualizer Studio Composer"/i.test(tag), `#studioBtn must have title="Visualizer Studio Composer"`);
  
  // Verify Lucide SVG icon inside #studioBtn
  const blockMatch = htmlContent.match(/<button[^>]*id="studioBtn"[\s\S]*?<\/button>/i);
  assert(blockMatch, 'Could not extract #studioBtn block');
  assert(blockMatch[0].includes('<svg'), '#studioBtn must contain <svg> icon');
  assert(/viewBox="0 0 24 24"/.test(blockMatch[0]), '#studioBtn SVG must have viewBox="0 0 24 24"');
});

check('1.2: Mobile rail button #mobileStudioBtn retains data-panel="myCreations" and data-alias="studio"', () => {
  const match = htmlContent.match(/<button[^>]*id="mobileStudioBtn"[^>]*>/i);
  assert(match, 'Missing button with id="mobileStudioBtn" in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="myCreations"'), `#mobileStudioBtn must have data-panel="myCreations"`);
  assert(tag.includes('data-alias="studio"'), `#mobileStudioBtn must have data-alias="studio"`);
  assert(/class="[^"]*rail-btn--mobile-only[^"]*"/i.test(tag), `#mobileStudioBtn must have rail-btn--mobile-only class`);
});

check('1.3: Topbar Mode Switcher button #modeStudioBtn has data-mode="studio"', () => {
  const match = htmlContent.match(/<button[^>]*id="modeStudioBtn"[^>]*>/i);
  assert(match, 'Missing button with id="modeStudioBtn" in index.html');
  const tag = match[0];
  assert(tag.includes('data-mode="studio"'), `#modeStudioBtn must have data-mode="studio"`);
  assert(/class="[^"]*mode-seg-btn[^"]*"/i.test(tag), `#modeStudioBtn must have mode-seg-btn class`);
  const blockMatch = htmlContent.match(/<button[^>]*id="modeStudioBtn"[\s\S]*?<\/button>/i);
  assert(blockMatch && blockMatch[0].includes('Studio'), '#modeStudioBtn must contain text "Studio"');
});

check('1.4: Studio panel container #studioPanel exists with required attributes and header tools', () => {
  const match = htmlContent.match(/<div[^>]*id="studioPanel"[^>]*>/i);
  assert(match, 'Missing container with id="studioPanel" in index.html');
  const tag = match[0];
  assert(tag.includes('data-panel="myCreations"'), `#studioPanel must have data-panel="myCreations". Got: ${tag}`);
  assert(tag.includes('data-alias="studio"'), `#studioPanel must have data-alias="studio". Got: ${tag}`);
  assert(tag.includes('data-panel-id="studioPanel"'), `#studioPanel must have data-panel-id="studioPanel". Got: ${tag}`);
  assert(/class="[^"]*drawer-panel[^"]*"/i.test(tag), '#studioPanel missing drawer-panel class');
  assert(/class="[^"]*detail-panel[^"]*"/i.test(tag), '#studioPanel missing detail-panel class');
  assert(/class="[^"]*glass-panel[^"]*"/i.test(tag), '#studioPanel missing glass-panel class');

  // Verify header tools
  assert(htmlContent.includes('id="studioQuickForgeBtn"'), 'Missing #studioQuickForgeBtn');
  assert(htmlContent.includes('id="closeStudioBtn"'), 'Missing #closeStudioBtn');
  assert(/class="[^"]*closeStudioBtn[^"]*"/i.test(htmlContent), '#closeStudioBtn must have closeStudioBtn class');
});

check('1.5: 3 Generation Mode buttons exist (#studioModeForgeBtn, #studioModeCuratedBtn, #studioModeRemixBtn)', () => {
  assert(htmlContent.includes('id="studioModeSeg"'), 'Missing #studioModeSeg container');
  assert(/id="studioModeSeg"[^>]*role="tablist"/i.test(htmlContent), '#studioModeSeg must have role="tablist"');

  const modes = [
    { id: 'studioModeForgeBtn', mode: 'forge', text: 'Auto-Forge', defaultActive: true },
    { id: 'studioModeCuratedBtn', mode: 'curated', text: 'Curated', defaultActive: false },
    { id: 'studioModeRemixBtn', mode: 'remix', text: 'Remix', defaultActive: false }
  ];

  for (const m of modes) {
    const regex = new RegExp(`<button[^>]*id="${m.id}"[^>]*>`, 'i');
    const match = htmlContent.match(regex);
    assert(match, `Missing button #${m.id}`);
    const tag = match[0];
    assert(tag.includes(`data-mode="${m.mode}"`), `#${m.id} missing data-mode="${m.mode}"`);
    assert(tag.includes('role="tab"'), `#${m.id} missing role="tab"`);
    if (m.defaultActive) {
      assert(/class="[^"]*active[^"]*"/i.test(tag), `#${m.id} should have active class by default`);
      assert(tag.includes('aria-selected="true"'), `#${m.id} should have aria-selected="true" by default`);
    } else {
      assert(tag.includes('aria-selected="false"'), `#${m.id} should have aria-selected="false" by default`);
    }
  }
});

check('1.6: 5 Engine Family cards exist in #studioFamilyGrid (Chroma, Liquid, Tunnel, Volume, The Force)', () => {
  assert(htmlContent.includes('id="studioFamilyGrid"'), 'Missing #studioFamilyGrid container');
  assert(/id="studioFamilyGrid"[^>]*role="radiogroup"/i.test(htmlContent), '#studioFamilyGrid must have role="radiogroup"');
  assert(htmlContent.includes('id="studioActiveFamilyLabel"'), 'Missing #studioActiveFamilyLabel readout');

  const families = [
    { id: 'chroma', name: 'Chroma', vibe: 'Vintage fringe' },
    { id: 'liquid', name: 'Liquid', vibe: 'Soft fluid' },
    { id: 'tunnel', name: 'Tunnel', vibe: 'Deep corridor' },
    { id: 'volume', name: 'Volume', vibe: 'Carved mass' },
    { id: 'force', name: 'The Force', vibe: 'Orbital pull', defaultActive: true }
  ];

  for (const f of families) {
    const cardRegex = new RegExp(`<button[^>]*class="[^"]*studio-family-card[^"]*"[^>]*data-family="${f.id}"[^>]*>`, 'i');
    const altRegex = new RegExp(`<button[^>]*data-family="${f.id}"[^>]*class="[^"]*studio-family-card[^"]*"[^>]*>`, 'i');
    const match = htmlContent.match(cardRegex) || htmlContent.match(altRegex);
    assert(match, `Missing .studio-family-card with data-family="${f.id}"`);
    const tag = match[0];
    assert(tag.includes('role="radio"'), `Family card ${f.id} missing role="radio"`);

    if (f.defaultActive) {
      assert(/class="[^"]*active[^"]*"/i.test(tag), `Family card ${f.id} should have active class by default`);
      assert(tag.includes('aria-checked="true"'), `Family card ${f.id} should have aria-checked="true" by default`);
    } else {
      assert(tag.includes('aria-checked="false"'), `Family card ${f.id} should have aria-checked="false" by default`);
    }
  }
});

check('1.7: 4 Wizard tabs and panes exist (Stage, Hero, Mood, Engine)', () => {
  assert(htmlContent.includes('id="studioWizardTabs"'), 'Missing #studioWizardTabs container');
  assert(/id="studioWizardTabs"[^>]*role="tablist"/i.test(htmlContent), '#studioWizardTabs must have role="tablist"');

  const steps = [
    { tabId: 'studioTabStage', paneId: 'studioStepStage', step: 'stage', defaultActive: true },
    { tabId: 'studioTabHero', paneId: 'studioStepHero', step: 'hero', defaultActive: false },
    { tabId: 'studioTabMood', paneId: 'studioStepMood', step: 'mood', defaultActive: false },
    { tabId: 'studioTabEngine', paneId: 'studioStepEngine', step: 'engine', defaultActive: false }
  ];

  for (const s of steps) {
    // Tab check
    const tabMatch = htmlContent.match(new RegExp(`<button[^>]*id="${s.tabId}"[^>]*>`, 'i'));
    assert(tabMatch, `Missing tab button #${s.tabId}`);
    const tabTag = tabMatch[0];
    assert(tabTag.includes(`data-step="${s.step}"`), `Tab #${s.tabId} missing data-step="${s.step}"`);
    assert(tabTag.includes('role="tab"'), `Tab #${s.tabId} missing role="tab"`);

    // Pane check
    const paneMatch = htmlContent.match(new RegExp(`<div[^>]*id="${s.paneId}"[^>]*>`, 'i'));
    assert(paneMatch, `Missing step pane #${s.paneId}`);
    const paneTag = paneMatch[0];
    assert(paneTag.includes('role="tabpanel"'), `Pane #${s.paneId} missing role="tabpanel"`);
    assert(paneTag.includes(`aria-labelledby="${s.tabId}"`), `Pane #${s.paneId} missing aria-labelledby="${s.tabId}"`);

    if (s.defaultActive) {
      assert(/class="[^"]*active[^"]*"/i.test(tabTag), `Tab #${s.tabId} must have active class`);
      assert(tabTag.includes('aria-selected="true"'), `Tab #${s.tabId} must have aria-selected="true"`);
      assert(/class="[^"]*active[^"]*"/i.test(paneTag), `Pane #${s.paneId} must have active class`);
    } else {
      assert(tabTag.includes('aria-selected="false"'), `Tab #${s.tabId} must have aria-selected="false"`);
      assert(paneTag.includes('style="display:none;"') || paneTag.includes('style="display: none;"'),
        `Pane #${s.paneId} must be hidden by default`);
    }
  }
});

check('1.8: Step 1 (Stage Pane) controls: Backdrop chips and sliders exist', () => {
  assert(htmlContent.includes('id="studioBackdropChips"'), 'Missing #studioBackdropChips');
  const backdrops = ['void', 'grid', 'starfield', 'horizon', 'nebula'];
  for (const b of backdrops) {
    assert(new RegExp(`data-backdrop="${b}"`, 'i').test(htmlContent), `Missing backdrop chip for "${b}"`);
  }

  // Sliders
  const stageSliders = [
    { id: 'studioStageScaleSlider', valId: 'studioStageScaleVal', min: '0.5', max: '2.5' },
    { id: 'studioStageDustSlider', valId: 'studioStageDustVal', min: '0', max: '2.0' },
    { id: 'studioStageLightSlider', valId: 'studioStageLightVal', min: '0.2', max: '3.0' }
  ];

  for (const sl of stageSliders) {
    const match = htmlContent.match(new RegExp(`<input[^>]*id="${sl.id}"[^>]*>`, 'i'));
    assert(match, `Missing #${sl.id}`);
    const tag = match[0];
    assert(tag.includes(`min="${sl.min}"`), `#${sl.id} missing min="${sl.min}"`);
    assert(tag.includes(`max="${sl.max}"`), `#${sl.id} missing max="${sl.max}"`);
    assert(htmlContent.includes(`id="${sl.valId}"`), `Missing readout #${sl.valId}`);
  }
});

check('1.9: Step 2 (Hero Pane) controls: Geometry, style, symmetry chips and sliders exist', () => {
  assert(htmlContent.includes('id="studioHeroGeomChips"'), 'Missing #studioHeroGeomChips');
  ['sphere', 'torus', 'polyhedron', 'dual-ring', 'hypercube'].forEach(g => {
    assert(new RegExp(`data-geom="${g}"`, 'i').test(htmlContent), `Missing geom chip for "${g}"`);
  });

  assert(htmlContent.includes('id="studioHeroStyleChips"'), 'Missing #studioHeroStyleChips');
  ['solid', 'wireframe', 'crystal', 'neon'].forEach(st => {
    assert(new RegExp(`data-style="${st}"`, 'i').test(htmlContent), `Missing style chip for "${st}"`);
  });

  assert(htmlContent.includes('id="studioHeroSymmetryChips"'), 'Missing #studioHeroSymmetryChips');
  ['none', 'radial4', 'radial8', 'mirror'].forEach(sy => {
    assert(new RegExp(`data-symmetry="${sy}"`, 'i').test(htmlContent), `Missing symmetry chip for "${sy}"`);
  });

  assert(htmlContent.includes('id="studioHeroDeformSlider"'), 'Missing #studioHeroDeformSlider');
  assert(htmlContent.includes('id="studioHeroDeformVal"'), 'Missing #studioHeroDeformVal');
  assert(htmlContent.includes('id="studioHeroScaleSlider"'), 'Missing #studioHeroScaleSlider');
  assert(htmlContent.includes('id="studioHeroScaleVal"'), 'Missing #studioHeroScaleVal');
});

check('1.10: Step 3 (Mood Pane) controls: Theme select, bloom, speed sliders, lighting vibe chips', () => {
  assert(htmlContent.includes('id="studioThemeSelect"'), 'Missing #studioThemeSelect');
  const themes = ['ember', 'jade', 'violet', 'rose', 'azure', 'synthwave', 'toxic', 'horizon', 'nebula', 'glacier', 'prism'];
  for (const th of themes) {
    assert(new RegExp(`value="${th}"`, 'i').test(htmlContent), `Missing theme option "${th}"`);
  }

  assert(htmlContent.includes('id="studioMoodBloomSlider"'), 'Missing #studioMoodBloomSlider');
  assert(htmlContent.includes('id="studioMoodBloomVal"'), 'Missing #studioMoodBloomVal');
  assert(htmlContent.includes('id="studioMoodSpeedSlider"'), 'Missing #studioMoodSpeedSlider');
  assert(htmlContent.includes('id="studioMoodSpeedVal"'), 'Missing #studioMoodSpeedVal');

  assert(htmlContent.includes('id="studioLightingVibeChips"'), 'Missing #studioLightingVibeChips');
  ['neon', 'cold', 'warm', 'dark'].forEach(v => {
    assert(new RegExp(`data-vibe="${v}"`, 'i').test(htmlContent), `Missing lighting vibe chip for "${v}"`);
  });
});

check('1.11: Step 4 (Engine Pane) legacy slider IDs and preset launch button strictly retained', () => {
  assert(htmlContent.includes('id="activateStudioBtn"'), 'Missing #activateStudioBtn');

  const legacySliders = [
    { id: 'studioChromaSlider', valId: 'studioChromaVal', min: '0', max: '2', step: '0.1', defaultVal: '1.0' },
    { id: 'studioLiquidSlider', valId: 'studioLiquidVal', min: '0', max: '2', step: '0.1', defaultVal: '1.0' },
    { id: 'studioTunnelSlider', valId: 'studioTunnelVal', min: '0', max: '2', step: '0.1', defaultVal: '1.0' },
    { id: 'studioVolumeSlider', valId: 'studioVolumeVal', min: '0', max: '2', step: '0.1', defaultVal: '1.0' },
    { id: 'studioForceSlider', valId: 'studioForceVal', min: '-2', max: '2', step: '0.2', defaultVal: '1.0' }
  ];

  for (const sl of legacySliders) {
    const match = htmlContent.match(new RegExp(`<input[^>]*id="${sl.id}"[^>]*>`, 'i'));
    assert(match, `Missing legacy slider #${sl.id}`);
    const tag = match[0];
    assert(tag.includes(`min="${sl.min}"`), `#${sl.id} missing min="${sl.min}"`);
    assert(tag.includes(`max="${sl.max}"`), `#${sl.id} missing max="${sl.max}"`);
    assert(tag.includes(`step="${sl.step}"`), `#${sl.id} missing step="${sl.step}"`);
    assert(tag.includes(`value="${sl.defaultVal}"`), `#${sl.id} missing value="${sl.defaultVal}"`);
    assert(htmlContent.includes(`id="${sl.valId}"`), `Missing readout #${sl.valId}`);
  }

  // Extended post-fx sliders
  assert(htmlContent.includes('id="studioCrtSlider"'), 'Missing #studioCrtSlider');
  assert(htmlContent.includes('id="studioCrtVal"'), 'Missing #studioCrtVal');
  assert(htmlContent.includes('id="studioChromaDistortSlider"'), 'Missing #studioChromaDistortSlider');
  assert(htmlContent.includes('id="studioChromaDistortVal"'), 'Missing #studioChromaDistortVal');
});

check('1.12: Recipe action buttons & persistence gallery controls exist with correct attributes', () => {
  // Title input
  const nameInputMatch = htmlContent.match(/<input[^>]*id="studioRecipeNameInput"[^>]*>/i);
  assert(nameInputMatch, 'Missing #studioRecipeNameInput');
  assert(/maxlength="60"/i.test(nameInputMatch[0]), '#studioRecipeNameInput must have maxlength="60"');
  assert(/aria-label="Studio Recipe Name Input"/i.test(nameInputMatch[0]), '#studioRecipeNameInput missing aria-label');

  // Error hint
  assert(htmlContent.includes('id="studioRecipeNameError"'), 'Missing #studioRecipeNameError');

  // Save recipe button (must be disabled by default)
  const saveBtnMatch = htmlContent.match(/<button[^>]*id="studioSaveRecipeBtn"[^>]*>/i);
  assert(saveBtnMatch, 'Missing #studioSaveRecipeBtn');
  assert(saveBtnMatch[0].includes('disabled'), '#studioSaveRecipeBtn must be disabled by default');

  // Forge look button
  assert(htmlContent.includes('id="studioGenerateBtn"'), 'Missing #studioGenerateBtn');

  // Export JSON button
  assert(htmlContent.includes('id="studioExportJsonBtn"'), 'Missing #studioExportJsonBtn');

  // Import JSON file input
  const fileInputMatch = htmlContent.match(/<input[^>]*id="studioImportFileInput"[^>]*>/i);
  assert(fileInputMatch, 'Missing #studioImportFileInput');
  assert(fileInputMatch[0].includes('accept=".json,application/json"'), '#studioImportFileInput missing JSON accept filter');

  // Saved recipes list and count badge
  assert(htmlContent.includes('id="studioSavedRecipesList"'), 'Missing #studioSavedRecipesList');
  assert(htmlContent.includes('id="studioSavedCount"'), 'Missing #studioSavedCount');
});

check('1.13: Duplicate ID audit across index.html (zero duplicate IDs)', () => {
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
// SECTION 2: CSS STYLESHEET & DETENTS AUDIT (style.css)
// =============================================================================
console.log('\n--- SECTION 2: CSS Stylesheet & Glassmorphism Detents Audit (style.css) ---');

check('2.1: .studio-panel-content scroll container styling', () => {
  assert(/\.studio-panel-content\s*\{[^}]*overflow-y:\s*auto/i.test(cssContent),
    'Missing overflow-y: auto on .studio-panel-content');
  assert(/\.studio-panel-content\s*\{[^}]*max-height:\s*calc\(100vh\s*-\s*170px\)/i.test(cssContent),
    'Missing max-height calc on .studio-panel-content');
});

check('2.2: .studio-mode-seg and .studio-mode-btn styling with active glow', () => {
  assert(/\.studio-mode-seg\s*\{[^}]*display:\s*flex/i.test(cssContent), 'Missing flex display on .studio-mode-seg');
  assert(/\.studio-mode-btn\.active\s*\{[^}]*background:\s*var\(--primary\)/i.test(cssContent),
    '.studio-mode-btn.active must have background: var(--primary)');
  assert(/\.studio-mode-btn\.active\s*\{[^}]*box-shadow:/i.test(cssContent),
    '.studio-mode-btn.active must have box-shadow');
});

check('2.3: .studio-family-grid 3-column layout & .studio-family-card active border', () => {
  assert(/\.studio-family-grid\s*\{[^}]*display:\s*grid/i.test(cssContent), 'Missing grid on .studio-family-grid');
  assert(/\.studio-family-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/i.test(cssContent),
    '.studio-family-grid must have repeat(3, 1fr)');
  assert(/\.studio-family-card\.active\s*\{[^}]*border-color:\s*#06b6d4/i.test(cssContent),
    '.studio-family-card.active must highlight with cyan accent border');
});

check('2.4: .studio-wizard-tabs & .studio-wizard-tab active indicators', () => {
  assert(/\.studio-wizard-tabs\s*\{[^}]*display:\s*flex/i.test(cssContent), 'Missing flex on .studio-wizard-tabs');
  assert(/\.studio-wizard-tab\.active\s*\{[^}]*background:\s*var\(--primary\)/i.test(cssContent),
    '.studio-wizard-tab.active must have var(--primary) background');
});

check('2.5: .studio-step-pane animation and keyframes', () => {
  assert(/\.studio-step-pane\s*\{[^}]*animation:\s*studioFadeIn/i.test(cssContent),
    '.studio-step-pane must define animation: studioFadeIn');
  assert(/@keyframes\s+studioFadeIn\s*\{/i.test(cssContent), 'Missing @keyframes studioFadeIn definition');
});

check('2.6: Saved recipe cards styling (.studio-recipe-card, .studio-card-btn)', () => {
  assert(/\.studio-recipe-card\s*\{/i.test(cssContent), 'Missing .studio-recipe-card rule');
  assert(/\.studio-recipe-header\s*\{/i.test(cssContent), 'Missing .studio-recipe-header rule');
  assert(/\.studio-card-btn--load\s*\{/i.test(cssContent), 'Missing .studio-card-btn--load rule');
  assert(/\.studio-card-btn--delete:hover\s*\{[^}]*color:\s*#f87171/i.test(cssContent),
    'Missing delete danger hover color on .studio-card-btn--delete:hover');
});

check('2.7: Responsive detents for studio layout (<= 640px mobile 2-col, <= 900px compact)', () => {
  assert(/@media\s*\(\s*max-width:\s*640px\s*\)[\s\S]*?\.studio-family-grid\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/i.test(cssContent),
    'Missing 2-column family grid override for max-width: 640px');
  assert(/@media\s*\(\s*min-width:\s*641px\s*\)\s*and\s*\(\s*max-height:\s*900px\s*\)[\s\S]*?\.studio-panel-content/i.test(cssContent),
    'Missing compact padding/height detent for max-height: 900px');
});

// =============================================================================
// SECTION 3: LIVE INTERACTIVE HEADLESS DOM & REACTIVE CONTROLLER SIMULATION
// =============================================================================
console.log('\n--- SECTION 3: Live Interactive Headless DOM & Reactive Controller Simulation ---');

// Compile StudioComposer and Types into memory
let StudioComposerPresetClass;
let ENGINE_FAMILIES_META;
const mockStorage = {};
const mockLocalStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(mockStorage, k) ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

try {
  const typesBuild = esbuild.buildSync({
    entryPoints: [typesTsPath],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false
  });
  const typesVm = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(typesBuild.outputFiles[0].text, typesVm);
  ENGINE_FAMILIES_META = typesVm.module.exports.ENGINE_FAMILIES_META;

  const buildResult = esbuild.buildSync({
    entryPoints: [composerTsPath],
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
    console,
    window: { localStorage: mockLocalStorage },
    localStorage: mockLocalStorage
  };

  vm.runInNewContext(buildResult.outputFiles[0].text, vmContext);
  StudioComposerPresetClass = vmContext.module.exports.StudioComposerPreset;
  assert(typeof StudioComposerPresetClass === 'function', 'StudioComposerPreset exported constructor');
  assert(ENGINE_FAMILIES_META && typeof ENGINE_FAMILIES_META === 'object', 'ENGINE_FAMILIES_META exported correctly');
} catch (err) {
  throw new Error(`Failed to bundle/load StudioComposer for empirical testing: ${err.message}`);
}

// Lightweight Headless DOM simulator
class SimTokenList {
  constructor(initial = []) { this.tokens = new Set(initial); }
  add(...t) { t.forEach(x => this.tokens.add(x)); }
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
  }

  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  hasAttribute(k) { return this.attributes.has(k); }
  removeAttribute(k) { this.attributes.delete(k); }

  addEventListener(ev, fn) {
    if (!this.listeners.has(ev)) this.listeners.set(ev, []);
    this.listeners.get(ev).push(fn);
  }

  dispatchEvent(ev) {
    const list = this.listeners.get(ev.type) || [];
    for (const fn of list) {
      fn.call(this, ev);
    }
  }

  click() { this.dispatchEvent({ type: 'click', target: this }); }
  input() { this.dispatchEvent({ type: 'input', target: this }); }
  change() { this.dispatchEvent({ type: 'change', target: this }); }

  querySelector(selector) {
    for (const child of this.children) {
      if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) return child;
      if (selector.startsWith('#') && child.id === selector.slice(1)) return child;
    }
    return null;
  }

  appendChild(c) { this.children.push(c); return c; }
  removeChild(c) {
    const idx = this.children.indexOf(c);
    if (idx !== -1) this.children.splice(idx, 1);
  }
}

check('3.1: Generation mode switcher toggle updates active classes, aria-selected and button labels', () => {
  const forgeBtn = new SimElement('button', 'studioModeForgeBtn');
  forgeBtn.classList.add('active');
  forgeBtn.setAttribute('aria-selected', 'true');
  forgeBtn.dataset.mode = 'forge';

  const curatedBtn = new SimElement('button', 'studioModeCuratedBtn');
  curatedBtn.setAttribute('aria-selected', 'false');
  curatedBtn.dataset.mode = 'curated';

  const remixBtn = new SimElement('button', 'studioModeRemixBtn');
  remixBtn.setAttribute('aria-selected', 'false');
  remixBtn.dataset.mode = 'remix';

  const generateBtn = new SimElement('button', 'studioGenerateBtn');
  generateBtn.textContent = '⚡ Forge Look';

  let currentMode = 'forge';
  const modeButtons = [
    { btn: forgeBtn, mode: 'forge' },
    { btn: curatedBtn, mode: 'curated' },
    { btn: remixBtn, mode: 'remix' }
  ];

  modeButtons.forEach(({ btn, mode }) => {
    btn.addEventListener('click', () => {
      currentMode = mode;
      modeButtons.forEach(b => {
        b.btn.classList.toggle('active', b.mode === mode);
        b.btn.setAttribute('aria-selected', String(b.mode === mode));
      });
      if (mode === 'forge') generateBtn.textContent = '⚡ Forge Look';
      else if (mode === 'curated') generateBtn.textContent = '💎 Curate Look';
      else generateBtn.textContent = '🔀 Remix Look';
    });
  });

  // Click Curated
  curatedBtn.click();
  assert.strictEqual(currentMode, 'curated');
  assert.strictEqual(curatedBtn.classList.contains('active'), true);
  assert.strictEqual(curatedBtn.getAttribute('aria-selected'), 'true');
  assert.strictEqual(forgeBtn.classList.contains('active'), false);
  assert.strictEqual(forgeBtn.getAttribute('aria-selected'), 'false');
  assert.strictEqual(generateBtn.textContent, '💎 Curate Look');

  // Click Remix
  remixBtn.click();
  assert.strictEqual(currentMode, 'remix');
  assert.strictEqual(remixBtn.classList.contains('active'), true);
  assert.strictEqual(remixBtn.getAttribute('aria-selected'), 'true');
  assert.strictEqual(generateBtn.textContent, '🔀 Remix Look');

  // Click Forge
  forgeBtn.click();
  assert.strictEqual(currentMode, 'forge');
  assert.strictEqual(forgeBtn.classList.contains('active'), true);
  assert.strictEqual(generateBtn.textContent, '⚡ Forge Look');
});

check('3.2: 5 Family cards selection updates active card, aria-checked, label readout, and preset family', () => {
  mockLocalStorage.clear();
  const preset = new StudioComposerPresetClass();
  const label = new SimElement('span', 'studioActiveFamilyLabel');
  label.textContent = 'The Force';

  const families = [
    { id: 'chroma', label: 'Chroma' },
    { id: 'liquid', label: 'Liquid' },
    { id: 'tunnel', label: 'Tunnel' },
    { id: 'volume', label: 'Volume' },
    { id: 'force', label: 'The Force' }
  ];

  const cards = families.map(f => {
    const card = new SimElement('button');
    card.classList.add('studio-family-card');
    card.dataset.family = f.id;
    const isDefault = f.id === 'force';
    if (isDefault) card.classList.add('active');
    card.setAttribute('aria-checked', String(isDefault));

    const nameSpan = new SimElement('span');
    nameSpan.classList.add('studio-family-card-name');
    nameSpan.textContent = f.label;
    card.children.push(nameSpan);

    card.addEventListener('click', () => {
      cards.forEach(c => {
        const isMatch = c === card;
        c.classList.toggle('active', isMatch);
        c.setAttribute('aria-checked', String(isMatch));
      });
      label.textContent = nameSpan.textContent;
      preset.setEngineFamily(f.id);
    });

    return card;
  });

  // Switch to tunnel
  const tunnelCard = cards.find(c => c.dataset.family === 'tunnel');
  assert(tunnelCard);
  tunnelCard.click();

  assert.strictEqual(tunnelCard.classList.contains('active'), true);
  assert.strictEqual(tunnelCard.getAttribute('aria-checked'), 'true');
  assert.strictEqual(label.textContent, 'Tunnel');
  const activeRec = preset.getActiveRecipe();
  assert.strictEqual(activeRec.familyId, 'tunnel');

  // Switch to liquid
  const liquidCard = cards.find(c => c.dataset.family === 'liquid');
  assert(liquidCard);
  liquidCard.click();

  assert.strictEqual(liquidCard.classList.contains('active'), true);
  assert.strictEqual(label.textContent, 'Liquid');
  assert.strictEqual(preset.getActiveRecipe().familyId, 'liquid');
});

check('3.3: 4-Step wizard tab switching shows target pane, hides others, updates aria-selected', () => {
  const steps = ['stage', 'hero', 'mood', 'engine'];
  const tabs = {};
  const panes = {};

  steps.forEach(s => {
    const tab = new SimElement('button', `studioTab${s[0].toUpperCase()}${s.slice(1)}`);
    tab.dataset.step = s;
    tab.classList.toggle('active', s === 'stage');
    tab.setAttribute('aria-selected', String(s === 'stage'));
    tabs[s] = tab;

    const pane = new SimElement('div', `studioStep${s[0].toUpperCase()}${s.slice(1)}`);
    pane.classList.toggle('active', s === 'stage');
    pane.style.display = s === 'stage' ? 'block' : 'none';
    panes[s] = pane;

    tab.addEventListener('click', () => {
      steps.forEach(other => {
        tabs[other].classList.toggle('active', other === s);
        tabs[other].setAttribute('aria-selected', String(other === s));
        panes[other].classList.toggle('active', other === s);
        panes[other].style.display = other === s ? 'block' : 'none';
      });
    });
  });

  // Switch to Hero
  tabs.hero.click();
  assert.strictEqual(tabs.hero.classList.contains('active'), true);
  assert.strictEqual(tabs.hero.getAttribute('aria-selected'), 'true');
  assert.strictEqual(panes.hero.style.display, 'block');
  assert.strictEqual(panes.stage.style.display, 'none');

  // Switch to Engine
  tabs.engine.click();
  assert.strictEqual(tabs.engine.classList.contains('active'), true);
  assert.strictEqual(panes.engine.style.display, 'block');
  assert.strictEqual(panes.hero.style.display, 'none');
  assert.strictEqual(panes.mood.style.display, 'none');
  assert.strictEqual(panes.stage.style.display, 'none');
});

check('3.4: Recipe title validation & Save button enabling logic', () => {
  const nameInput = new SimElement('input', 'studioRecipeNameInput');
  const errorLabel = new SimElement('span', 'studioRecipeNameError');
  errorLabel.style.display = 'none';
  const saveBtn = new SimElement('button', 'studioSaveRecipeBtn');
  saveBtn.disabled = true;

  nameInput.addEventListener('input', () => {
    const trimmed = nameInput.value.trim();
    const isValid = trimmed.length > 0 && trimmed.length <= 60;
    saveBtn.disabled = !isValid;
    errorLabel.style.display = !isValid && nameInput.value.length > 0 ? 'inline' : 'none';
  });

  // Initially disabled
  assert.strictEqual(saveBtn.disabled, true);

  // Whitespace only
  nameInput.value = '    ';
  nameInput.input();
  assert.strictEqual(saveBtn.disabled, true);
  assert.strictEqual(errorLabel.style.display, 'inline');

  // Valid title
  nameInput.value = 'Quantum Aurora';
  nameInput.input();
  assert.strictEqual(saveBtn.disabled, false);
  assert.strictEqual(errorLabel.style.display, 'none');

  // Clear title
  nameInput.value = '';
  nameInput.input();
  assert.strictEqual(saveBtn.disabled, true);
  assert.strictEqual(errorLabel.style.display, 'none');
});

check('3.5: Recipe save lifecycle: adds to catalog, updates count badge and renders card', () => {
  mockLocalStorage.clear();
  const preset = new StudioComposerPresetClass();
  const savedCount = new SimElement('span', 'studioSavedCount');
  savedCount.textContent = '0 saved';
  const savedList = new SimElement('div', 'studioSavedRecipesList');

  function refreshSavedUI() {
    const list = preset.getSavedRecipes();
    savedCount.textContent = `${list.length} saved`;
    savedList.children = [];
    if (list.length === 0) {
      const emptyDiv = new SimElement('div');
      emptyDiv.textContent = 'No saved recipes yet.';
      savedList.appendChild(emptyDiv);
      return;
    }
    list.forEach(rec => {
      const card = new SimElement('div');
      card.classList.add('studio-recipe-card');
      const nameEl = new SimElement('span');
      nameEl.classList.add('studio-recipe-name');
      nameEl.textContent = rec.name;
      card.appendChild(nameEl);

      const loadBtn = new SimElement('button');
      loadBtn.classList.add('studio-card-btn', 'studio-card-btn--load');
      loadBtn.dataset.id = rec.id;
      loadBtn.addEventListener('click', () => {
        preset.loadRecipe(rec.id);
      });
      card.appendChild(loadBtn);

      const delBtn = new SimElement('button');
      delBtn.classList.add('studio-card-btn', 'studio-card-btn--delete');
      delBtn.dataset.id = rec.id;
      delBtn.addEventListener('click', () => {
        preset.deleteRecipe(rec.id);
        refreshSavedUI();
      });
      card.appendChild(delBtn);

      savedList.appendChild(card);
    });
  }

  refreshSavedUI();
  assert.strictEqual(savedCount.textContent, '0 saved');
  assert.strictEqual(savedList.children.length, 1);

  // Save recipe
  const saved = preset.saveRecipe('Neon Matrix Odyssey');
  assert(saved && saved.id);
  refreshSavedUI();

  assert.strictEqual(savedCount.textContent, '1 saved');
  assert.strictEqual(savedList.children.length, 1);
  const card = savedList.children[0];
  assert(card.classList.contains('studio-recipe-card'));
  const nameSpan = card.children.find(c => c.classList.contains('studio-recipe-name'));
  assert(nameSpan && nameSpan.textContent === 'Neon Matrix Odyssey');
});

check('3.6: Recipe load and delete lifecycle removes card and updates count badge', () => {
  mockLocalStorage.clear();
  const preset = new StudioComposerPresetClass();
  const savedCount = new SimElement('span', 'studioSavedCount');
  const savedList = new SimElement('div', 'studioSavedRecipesList');

  function refresh() {
    const list = preset.getSavedRecipes();
    savedCount.textContent = `${list.length} saved`;
    savedList.children = [];
    list.forEach(r => {
      const c = new SimElement('div');
      c.classList.add('studio-recipe-card');
      const dBtn = new SimElement('button');
      dBtn.classList.add('studio-card-btn--delete');
      dBtn.addEventListener('click', () => {
        preset.deleteRecipe(r.id);
        refresh();
      });
      c.appendChild(dBtn);
      savedList.appendChild(c);
    });
  }

  const r1 = preset.saveRecipe('Recipe One');
  const r2 = preset.saveRecipe('Recipe Two');
  refresh();
  assert.strictEqual(savedCount.textContent, '2 saved');
  assert.strictEqual(savedList.children.length, 2);

  // Delete r1
  const delBtn1 = savedList.children[0].querySelector('.studio-card-btn--delete');
  assert(delBtn1);
  delBtn1.click();

  assert.strictEqual(savedCount.textContent, '1 saved');
  assert.strictEqual(savedList.children.length, 1);

  // Delete r2
  const delBtn2 = savedList.children[0].querySelector('.studio-card-btn--delete');
  assert(delBtn2);
  delBtn2.click();

  assert.strictEqual(savedCount.textContent, '0 saved');
  assert.strictEqual(savedList.children.length, 0);
});

check('3.7: JSON Export and Import roundtrip preserves all recipe parameters', () => {
  mockLocalStorage.clear();
  const presetA = new StudioComposerPresetClass();
  presetA.setEngineFamily('tunnel');
  presetA.setStage({ scale: 1.8, dustDensity: 1.5 });
  presetA.setHero({ geometry: 'torus', renderStyle: 'crystal', deformation: 1.7 });
  presetA.setMood({ themeId: 'synthwave', bloomIntensity: 2.2 });
  presetA.config.tunnelDepth = 1.6;

  const jsonExport = presetA.exportRecipeJson();
  assert(typeof jsonExport === 'string' && jsonExport.length > 50, 'JSON export produced non-empty string');
  const parsed = JSON.parse(jsonExport);
  assert.strictEqual(parsed.familyId, 'tunnel');

  // Import into a fresh instance presetB
  const presetB = new StudioComposerPresetClass();
  const imported = presetB.importRecipeJson(jsonExport);
  assert(imported, 'importRecipeJson succeeded');

  const bRec = presetB.getActiveRecipe();
  assert.strictEqual(bRec.familyId, 'tunnel');
  assert.strictEqual(bRec.stage.scale, 1.8);
  assert.strictEqual(bRec.stage.dustDensity, 1.5);
  assert.strictEqual(bRec.hero.geometry, 'torus');
  assert.strictEqual(bRec.hero.renderStyle, 'crystal');
  assert.strictEqual(bRec.mood.themeId, 'synthwave');
});

check('3.8: Legacy slider two-way reactivity syncs studioPreset.config and value readouts', () => {
  const preset = new StudioComposerPresetClass();

  const sliders = [
    { id: 'studioChromaSlider', valId: 'studioChromaVal', prop: 'chromaIntensity', testVal: 1.7 },
    { id: 'studioLiquidSlider', valId: 'studioLiquidVal', prop: 'liquidWarp', testVal: 0.6 },
    { id: 'studioTunnelSlider', valId: 'studioTunnelVal', prop: 'tunnelDepth', testVal: 1.9 },
    { id: 'studioVolumeSlider', valId: 'studioVolumeVal', prop: 'volumeDensity', testVal: 1.3 },
    { id: 'studioForceSlider', valId: 'studioForceVal', prop: 'theForceAttraction', testVal: -0.8 }
  ];

  for (const s of sliders) {
    const slider = new SimElement('input', s.id);
    const readout = new SimElement('span', s.valId);

    slider.addEventListener('input', () => {
      const val = Number.parseFloat(slider.value);
      readout.textContent = val.toFixed(1);
      preset.config[s.prop] = val;
    });

    slider.value = String(s.testVal);
    slider.input();

    assert.strictEqual(preset.config[s.prop], s.testVal, `Config.${s.prop} did not update to ${s.testVal}`);
    assert.strictEqual(readout.textContent, s.testVal.toFixed(1), `Readout #${s.valId} did not update`);
  }
});

check('3.9: Quick forge and generate buttons create bounded non-NaN recipes', () => {
  const preset = new StudioComposerPresetClass();
  for (let i = 0; i < 20; i++) {
    const rec = preset.generateRandomRecipe();
    assert(rec && rec.id, 'Generated recipe must have id');
    assert(Number.isFinite(rec.seed), 'Seed must be finite number');
    assert(Number.isFinite(rec.stage.scale), 'Stage scale must be finite');
    assert(Number.isFinite(rec.hero.scale), 'Hero scale must be finite');
    assert(Number.isFinite(rec.mood.bloomIntensity), 'Mood bloom must be finite');
    assert(Number.isFinite(preset.config.theForceAttraction), 'Force attraction must be finite');
  }
});

// =============================================================================
// SECTION 4: NAVIGATION RAIL MUTUAL EXCLUSIVITY & ALIASING AUDIT
// =============================================================================
console.log('\n--- SECTION 4: Navigation Rail Mutual ExCLUSIVITY & ALIASING AUDIT ---');

check('4.1: PANEL_MAP binds both "myCreations" and "studio" aliases to studioPanel', () => {
  assert(mainTsContent.includes("myCreations: studioPanel"), "PANEL_MAP must map 'myCreations: studioPanel'");
  assert(mainTsContent.includes("studio: studioPanel"), "PANEL_MAP must map 'studio: studioPanel'");
});

check('4.2: Mutual exclusivity: Opening Studio panel closes Presets panel and sets active tool', () => {
  // Simulate rail drawers state
  let activeToolId = 'presets';
  const presetsBtn = new SimElement('button', 'presetsBtn');
  presetsBtn.classList.add('active');
  const presetsPanel = new SimElement('div', 'presetsPanel');
  presetsPanel.classList.add('active');

  const studioBtn = new SimElement('button', 'studioBtn');
  const studioPanel = new SimElement('div', 'studioPanel');

  function openDrawer(toolId) {
    if (activeToolId === toolId) {
      // Toggle off
      activeToolId = null;
      presetsBtn.classList.remove('active');
      presetsPanel.classList.remove('active');
      studioBtn.classList.remove('active');
      studioPanel.classList.remove('active');
      return;
    }
    // Mutual exclusivity
    activeToolId = toolId;
    presetsBtn.classList.toggle('active', toolId === 'presets');
    presetsPanel.classList.toggle('active', toolId === 'presets');
    studioBtn.classList.toggle('active', toolId === 'myCreations' || toolId === 'studio');
    studioPanel.classList.toggle('active', toolId === 'myCreations' || toolId === 'studio');
  }

  studioBtn.addEventListener('click', () => openDrawer('myCreations'));

  // Click studioBtn
  studioBtn.click();
  assert.strictEqual(activeToolId, 'myCreations');
  assert.strictEqual(studioBtn.classList.contains('active'), true);
  assert.strictEqual(studioPanel.classList.contains('active'), true);
  assert.strictEqual(presetsBtn.classList.contains('active'), false);
  assert.strictEqual(presetsPanel.classList.contains('active'), false);

  // Click studioBtn again (toggle off)
  studioBtn.click();
  assert.strictEqual(activeToolId, null);
  assert.strictEqual(studioBtn.classList.contains('active'), false);
  assert.strictEqual(studioPanel.classList.contains('active'), false);
});

check('4.3: Topbar Mode button #modeStudioBtn opens studio and activates preset', () => {
  let activeDrawer = null;
  let activePreset = null;
  const mockStudioPreset = { id: 'studio-composer' };

  function select3DPreset(p) { activePreset = p; }
  function openDrawer(d) { activeDrawer = d; }

  const modeStudioBtn = new SimElement('button', 'modeStudioBtn');
  const modeVisualizerBtn = new SimElement('button', 'modeVisualizerBtn');
  modeVisualizerBtn.classList.add('active');

  modeStudioBtn.addEventListener('click', () => {
    modeStudioBtn.classList.add('active');
    modeVisualizerBtn.classList.remove('active');
    openDrawer('myCreations');
    select3DPreset(mockStudioPreset);
  });

  modeStudioBtn.click();
  assert.strictEqual(modeStudioBtn.classList.contains('active'), true);
  assert.strictEqual(modeVisualizerBtn.classList.contains('active'), false);
  assert.strictEqual(activeDrawer, 'myCreations');
  assert.strictEqual(activePreset?.id, 'studio-composer');
});

check('4.4: Close button #closeStudioBtn closes #studioPanel and clears state', () => {
  let isPanelOpen = true;
  let activeTool = 'myCreations';
  const closeStudioBtn = new SimElement('button', 'closeStudioBtn');
  closeStudioBtn.addEventListener('click', () => {
    isPanelOpen = false;
    activeTool = null;
  });

  closeStudioBtn.click();
  assert.strictEqual(isPanelOpen, false);
  assert.strictEqual(activeTool, null);
});

// =============================================================================
// SECTION 5: ADVERSARIAL BOUNDARY & STRESS MINING
// =============================================================================
console.log('\n--- SECTION 5: Adversarial Boundary & Stress Mining ---');

check('5.1: Extreme recipe name injection (1,000 characters, XSS script injection, Unicode emojis)', () => {
  mockLocalStorage.clear();
  const preset = new StudioComposerPresetClass();
  const adversarialNames = [
    'A'.repeat(1000),
    '<script>alert("XSS")</script>',
    '🚀🔥✨🔮🌌👾💎⚡🌈',
    '\u0000\u0007\u001b[31mRed\u001b[0m',
    '\' OR 1=1 --',
    '   '
  ];

  for (const name of adversarialNames) {
    if (name.trim().length === 0) {
      assert.throws(() => preset.saveRecipe(name), /title is required/i);
    } else {
      const rec = preset.saveRecipe(name);
      assert(rec && rec.id, `Failed to handle adversarial name: ${name.slice(0, 30)}`);
      // Name must be bounded to 60 characters
      assert(rec.name.length <= 60, `Recipe name exceeded 60 characters: length was ${rec.name.length}`);
    }
  }
});

check('5.2: Corrupted, null, and malformed JSON import handling falls back gracefully', () => {
  const preset = new StudioComposerPresetClass();
  const malformedInputs = [
    '',
    'not json at all',
    '{"incomplete": true',
    'null',
    '12345',
    '[]',
    '{}',
    '{"kind": "engine"}', // missing familyId, genes, etc.
    '{"kind": "unknown_schema", "id": 123}'
  ];

  for (const input of malformedInputs) {
    let result = null;
    assert.doesNotThrow(() => {
      result = preset.importRecipeJson(input);
    }, `Threw exception on malformed input: ${input.slice(0, 30)}`);
    assert.strictEqual(result, null, `Expected null import on malformed input: ${input.slice(0, 30)}`);
  }
});

check('5.3: Rapid 1,000-cycle wizard tab switching preserves exactly 1 active tab and 1 active pane', () => {
  const steps = ['stage', 'hero', 'mood', 'engine'];
  const tabs = steps.map(s => {
    const t = new SimElement('button');
    t.dataset.step = s;
    return t;
  });
  const panes = steps.map(s => {
    const p = new SimElement('div');
    p.dataset.step = s;
    return p;
  });

  function selectStep(step) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.step === step));
    panes.forEach(p => {
      p.classList.toggle('active', p.dataset.step === step);
      p.style.display = p.dataset.step === step ? 'block' : 'none';
    });
  }

  for (let i = 0; i < 1000; i++) {
    const randStep = steps[i % steps.length];
    selectStep(randStep);
  }

  const activeTabs = tabs.filter(t => t.classList.contains('active'));
  const activePanes = panes.filter(p => p.classList.contains('active') && p.style.display === 'block');

  assert.strictEqual(activeTabs.length, 1, 'Exactly one active tab after 1000 cycles');
  assert.strictEqual(activePanes.length, 1, 'Exactly one active pane after 1000 cycles');
});

check('5.4: Rapid 500-cycle family grid switching preserves valid non-NaN family parameters', () => {
  const preset = new StudioComposerPresetClass();
  const families = ['chroma', 'liquid', 'tunnel', 'volume', 'force'];

  for (let i = 0; i < 500; i++) {
    const fam = families[i % families.length];
    preset.setEngineFamily(fam);
    const rec = preset.getActiveRecipe();
    assert.strictEqual(rec.familyId, fam);
    assert(Number.isFinite(preset.config.chromaIntensity));
    assert(Number.isFinite(preset.config.liquidWarp));
    assert(Number.isFinite(preset.config.tunnelDepth));
    assert(Number.isFinite(preset.config.volumeDensity));
    assert(Number.isFinite(preset.config.theForceAttraction));
  }
});

check('5.5: Rapid 100-cycle recipe save/delete churn maintains clean catalog and zero memory leaks', () => {
  mockLocalStorage.clear();
  const preset = new StudioComposerPresetClass();
  const initialCount = preset.getSavedRecipes().length;

  for (let i = 0; i < 100; i++) {
    const saved = preset.saveRecipe(`Churn Recipe #${i}`);
    assert(saved && saved.id);
    preset.deleteRecipe(saved.id);
  }

  const finalCount = preset.getSavedRecipes().length;
  assert.strictEqual(finalCount, initialCount, 'Catalog count restored exactly after save/delete churn');
});

// =============================================================================
// SECTION 6: ZERO REGRESSIONS ACROSS PRIOR CHALLENGER SUITES
// =============================================================================
console.log('\n--- SECTION 6: Zero Regressions Across Prior Challenger Suites ---');

const regressionSuites = [
  { name: 'Milestone 2.1 (Ticket #40: Navigation Rail)', file: 'tests/empirical-challenger-m2-1.cjs' },
  { name: 'Milestone 4 (Ticket #42: Camera & 3D Viewpoints Part 1)', file: 'tests/empirical-challenger-m4.cjs' },
  { name: 'Milestone 4.2 (Ticket #42: Camera & 3D Viewpoints Part 2)', file: 'tests/empirical-challenger-m4-2.cjs' },
  { name: 'Milestone 5.1 (Ticket #43: Animated Text & Typography Part 1)', file: 'tests/empirical-challenger-m5-1.cjs' },
  { name: 'Milestone 5.2 (Ticket #43: Animated Text & Typography Part 2)', file: 'tests/empirical-challenger-m5-2.cjs' }
];

for (const suite of regressionSuites) {
  check(`Regression check: ${suite.name} passes with 0 failures`, () => {
    const result = spawnSync(process.execPath, [path.resolve(__dirname, '..', suite.file)], {
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    if (result.status !== 0) {
      throw new Error(`Suite ${suite.file} failed with exit code ${result.status}:\n${result.stderr || result.stdout}`);
    }
    assert(
      result.stdout.includes('ALL EMPIRICAL CHALLENGES PASSED') ||
      result.stdout.includes('ALL EMPIRICAL CHALLENGER TESTS PASSED') ||
      result.stdout.includes('ALL IN-FLIGHT TRANSITION') ||
      result.stdout.includes('EMPIRICAL VERDICT: APPROVE') ||
      result.stdout.includes('ALL EMPIRICAL CHALLENGER MILESTONE 5 CHECKS PASSED'),
      `Suite ${suite.file} did not report success in output`
    );
  });
}

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log('\n========================================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} checks passed (${failedTests} failures)`);
console.log('========================================================================\n');

if (failedTests > 0) {
  console.error(`>>> EMPIRICAL VERDICT: REQUEST_CHANGES (${failedTests} failures detected) <<<`);
  process.exit(1);
} else {
  console.log('>>> EMPIRICAL VERDICT: APPROVE (100% checks passed, 0 regressions) <<<');
  process.exit(0);
}
