import { AudioEngine, PlaylistTrack } from './audio/AudioEngine';
import { RenderEngine } from './engine/RenderEngine';
import { MilkdropEngine } from './engine/MilkdropEngine';
import { ExportManager } from './export/ExportManager';
import { THEMES, getTheme, SINGLE_COLOR_THEMES, EARTHY_THEMES, DUO_TONE_THEMES } from './themes/themes';
import { VisualizerTheme } from './types';
import { PRESETS, getPreset } from './presets';
import { StudioComposerPreset } from './studio/StudioComposer';
import {
  EngineFamily,
  ENGINE_FAMILIES_META,
  StageBackdropType,
  HeroGeometryType,
  HeroRenderStyle,
  HeroSymmetry,
  MoodConfig,
  StageConfig,
  HeroConfig
} from './studio/types';
import { ExportSettings, VisualizerPreset } from './types';
import { renderTuningPanel, updateTuningButtonState as syncTuningButtonState } from './tuning/TuningPanel';
import { TextAnchor, TextAnimationMode } from './overlay/types';
import { MidiManager, initMidiPanel } from './midi';

// DOM Elements
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const milkdropCanvas = document.getElementById('milkdrop-canvas') as HTMLCanvasElement;
const framingGuide = document.getElementById('framingGuide') as HTMLElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const playIcon = document.getElementById('playIcon') as HTMLElement;
const demoBtn = document.getElementById('demoBtn') as HTMLButtonElement;
const topUploadInput = document.getElementById('topUploadInput') as HTMLInputElement;
const queueFileInput = document.getElementById('queueFileInput') as HTMLInputElement;
const micBtn = document.getElementById('micBtn') as HTMLButtonElement;
const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
const ambientBtn = document.getElementById('ambientBtn') as HTMLButtonElement;
const fsBtn = document.getElementById('fsBtn') as HTMLButtonElement;
const dockFsBtn = document.getElementById('dockFsBtn') as HTMLButtonElement;
const dockQueueBtn = document.getElementById('dockQueueBtn') as HTMLButtonElement;
const scrubber = document.getElementById('scrubber') as HTMLElement;
const scrubberFill = document.getElementById('scrubberFill') as HTMLElement;
const curTime = document.getElementById('curTime') as HTMLElement;
const totTime = document.getElementById('totTime') as HTMLElement;
const trackTitle = document.getElementById('trackTitle') as HTMLElement;
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;

// Mode Switcher Elements
const modeVisualizerBtn = document.getElementById('modeVisualizerBtn') as HTMLButtonElement;
const modeStudioBtn = document.getElementById('modeStudioBtn') as HTMLButtonElement;

// BPM Elements
const bpmBtn = document.getElementById('bpmBtn') as HTMLButtonElement;
const bpmText = document.getElementById('bpmText') as HTMLElement;
const bpmIndicator = document.getElementById('bpmIndicator') as HTMLElement;
const resetBpmBtn = document.getElementById('resetBpmBtn') as HTMLButtonElement;

// Drawers & Modals (Canonical 15 Tools)
const presetsPanel = document.getElementById('presetsPanel') as HTMLElement | null;
const tuningPanel = document.getElementById('tuningPanel') as HTMLElement | null;
const themesPanel = document.getElementById('themesPanel') as HTMLElement | null;
const fxPanel = document.getElementById('fxPanel') as HTMLElement | null;
const cameraPanel = document.getElementById('cameraPanel') as HTMLElement | null;
const audioPanel = document.getElementById('audioPanel') as HTMLElement | null;
const overlayPanel = document.getElementById('overlayPanel') as HTMLElement | null;
const textOverlayPanel = document.getElementById('textOverlayPanel') as HTMLElement | null;
const subtitlesPanel = document.getElementById('subtitlesPanel') as HTMLElement | null;
const queuePanel = document.getElementById('queuePanel') as HTMLElement | null;
const libraryPanel = document.getElementById('libraryPanel') as HTMLElement | null;
const studioPanel = document.getElementById('studioPanel') as HTMLElement | null;
const midiPanel = document.getElementById('midiPanel') as HTMLElement | null;
const shortcutsModal = document.getElementById('shortcutsModal') as HTMLElement | null;
const showUiBtn = document.getElementById('showUiBtn') as HTMLButtonElement | null;
const hideUiBtn = document.getElementById('hideUiBtn') as HTMLButtonElement | null;
const railMoreBtn = document.getElementById('railMoreBtn') as HTMLButtonElement | null;
const railMoreWrapper = document.getElementById('railMoreWrapper') as HTMLElement | null;
const ambientModeBtn = document.getElementById('ambientModeBtn') as HTMLButtonElement | null;
const bugReportBtn = document.getElementById('bugReportBtn') as HTMLButtonElement | null;
const closeShortcutsBtn = document.getElementById('closeShortcutsBtn') as HTMLButtonElement | null;
const appRoot = (document.getElementById('app') || document.body) as HTMLElement;

const PANEL_MAP: Record<string, HTMLElement | null> = {
  presets: presetsPanel,
  presetSettings: tuningPanel,
  colors: themesPanel,
  effects: fxPanel,
  camera: cameraPanel,
  audio: audioPanel,
  overlay: overlayPanel,
  text: textOverlayPanel,
  textOverlayPanel: textOverlayPanel,
  subtitles: subtitlesPanel,
  tracks: queuePanel,
  library: libraryPanel,
  myCreations: studioPanel,
  studio: studioPanel,
  midi: midiPanel,
  midiPanel: midiPanel
};

const allPanels: HTMLElement[] = [
  presetsPanel,
  tuningPanel,
  themesPanel,
  fxPanel,
  cameraPanel,
  audioPanel,
  overlayPanel,
  textOverlayPanel,
  subtitlesPanel,
  queuePanel,
  libraryPanel,
  studioPanel,
  midiPanel
].filter((p): p is HTMLElement => p !== null);

let activeToolId: string | null = 'presets';
const ARIA_EXPANDED = 'aria-expanded';
const AMBIENT_MODE_CLASS = 'ambient-mode';

const railShuffleBtn = document.getElementById('railShuffleBtn');

// Queue elements
const queueList = document.getElementById('queueList') as HTMLElement;
const shuffleBtn = document.getElementById('shuffleBtn') as HTMLButtonElement;
const repeatBtn = document.getElementById('repeatBtn') as HTMLButtonElement;

// Presets Search & Filters
const presetSearchInput = document.getElementById('presetSearchInput') as HTMLInputElement;
const presetsCatalogView = document.getElementById('presetsCatalogView') as HTMLElement;
const autoCycleBtn = document.getElementById('autoCycleBtn') as HTMLButtonElement;
const shufflePresetBtn = document.getElementById('shufflePresetBtn') as HTMLButtonElement;
const loopPresetBtn = document.getElementById('loopPresetBtn') as HTMLButtonElement;

// Export Modal
const exportModal = document.getElementById('exportModal') as HTMLElement;
const openExportBtn = document.getElementById('openExportBtn') as HTMLElement;
const cancelExportBtn = document.getElementById('cancelExportBtn') as HTMLElement;
const startExportAction = document.getElementById('startExportAction') as HTMLElement;
const exportProgressBar = document.getElementById('exportProgressBar') as HTMLElement;
const exportPercent = document.getElementById('exportPercent') as HTMLElement;
const exportProgressSection = document.getElementById('exportProgressSection') as HTMLElement;

// Sliders
const bloomSlider = document.getElementById('bloomSlider') as HTMLInputElement;
const persistSlider = document.getElementById('persistSlider') as HTMLInputElement;
const chromaSlider = document.getElementById('chromaSlider') as HTMLInputElement;
const grainSlider = document.getElementById('grainSlider') as HTMLInputElement;
const vigSlider = document.getElementById('vigSlider') as HTMLInputElement;
const scanSlider = document.getElementById('scanSlider') as HTMLInputElement;
const bendSlider = document.getElementById('bendSlider') as HTMLInputElement;
const sensSlider = document.getElementById('sensSlider') as HTMLInputElement;

// Instantiate Core Engines
const defaultTheme = getTheme('ember');
const audioEngine = new AudioEngine();
const renderEngine = new RenderEngine(canvas, defaultTheme);
const milkdropEngine = new MilkdropEngine(milkdropCanvas);
const exportManager = new ExportManager(renderEngine, audioEngine);

let isMilkdropInitialized = false;
let currentFilter: 'all' | 'fav' | 'milkdrop' | VisualizerPreset['category'] = 'all';
let searchQuery = '';
let autoCycleTimer: ReturnType<typeof setInterval> | null = null;
let activePresetId = PRESETS[0].id;
const favoritePresets = new Set<string>(JSON.parse(localStorage.getItem('visualizor_favorites') || '[]'));

function initMilkdropIfNeeded() {
  if (!isMilkdropInitialized) {
    const ctx = audioEngine.getContext();
    const analyser = audioEngine.getAnalyser();
    milkdropEngine.init(ctx, analyser);
    isMilkdropInitialized = true;
  }
}

// Set initial 3D preset
renderEngine.setPreset(PRESETS[0]);
updateTuningButtonState(PRESETS[0]);
renderTuningPanel(PRESETS[0]);

// --- Canonical 4-Column Colors Panel (Matching Image 3) ---
function updateColorCalloutAndInputs(theme: VisualizerTheme): void {
  const calloutName = document.getElementById('themeCalloutName');
  if (calloutName) calloutName.textContent = theme.name;

  const box = document.getElementById('customColorBox');
  if (box) box.style.backgroundColor = theme.primary;

  const hexInput = document.getElementById('customHexInput') as HTMLInputElement | null;
  if (hexInput) hexInput.value = theme.primary.toUpperCase();

  const satSlider = document.getElementById('themeSaturationSlider') as HTMLInputElement | null;
  if (satSlider) {
    satSlider.style.background = `linear-gradient(90deg, #666666, ${theme.primary})`;
  }
}

function applyAppTheme(theme: VisualizerTheme): void {
  renderEngine.setTheme(theme);
  document.querySelectorAll('.theme-swatch-card').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-theme-id') === theme.id);
  });
  updateColorCalloutAndInputs(theme);
}

function createThemeSwatchCard(
  theme: VisualizerTheme,
  displayName: string,
  isDuo: boolean
): HTMLElement {
  const card = document.createElement('div');
  card.className = `theme-swatch-card ${theme.id === renderEngine.currentTheme.id ? 'active' : ''}`;
  card.setAttribute('data-theme-id', theme.id);
  card.title = `${displayName} (${theme.primary})`;

  const bg = isDuo
    ? `linear-gradient(135deg, ${theme.primary} 50%, ${theme.secondary || theme.accent} 50%)`
    : theme.primary;

  card.innerHTML = `
    <div class="swatch-block" style="background: ${bg};"></div>
    <span class="swatch-name">${displayName}</span>
  `;

  card.addEventListener('click', () => {
    applyAppTheme(theme);
  });

  return card;
}

function populateThemeGrid(
  containerId: string,
  themeIds: readonly string[],
  nameResolver?: (id: string, name: string) => string,
  isDuo: boolean = false
): void {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  for (const id of themeIds) {
    const theme = getTheme(id);
    const name = nameResolver ? nameResolver(id, theme.name) : theme.name;
    const card = createThemeSwatchCard(theme, name, isDuo);
    container.appendChild(card);
  }
}

// 1. Single Color (12 swatches)
populateThemeGrid('singleColorGrid', SINGLE_COLOR_THEMES, undefined, false);

// 2. Earthy (4 swatches: Terra-cotta, Forest, Sand, Lavender)
populateThemeGrid('earthyColorGrid', EARTHY_THEMES, (id, name) => id === 'earthy' ? 'Forest' : name, false);

// 3. Duo Tones (12 diagonal split swatches)
populateThemeGrid('duoTonesGrid', DUO_TONE_THEMES, undefined, true);

// Initial callout & inputs
updateColorCalloutAndInputs(renderEngine.currentTheme);

// Random Theme Button (Top right of Colors Drawer)
const randomThemeBtn = document.getElementById('randomThemeBtn');
randomThemeBtn?.addEventListener('click', () => {
  const randTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
  applyAppTheme(randTheme);
});

// Saturation Slider
const themeSaturationSlider = document.getElementById('themeSaturationSlider') as HTMLInputElement | null;
const themeSaturationVal = document.getElementById('themeSaturationVal');
themeSaturationSlider?.addEventListener('input', () => {
  const val = Number.parseInt(themeSaturationSlider.value, 10);
  if (themeSaturationVal) themeSaturationVal.textContent = `${val}%`;
});

// Custom Color Controls
const customHexInput = document.getElementById('customHexInput') as HTMLInputElement | null;
const eyeDropperBtn = document.getElementById('eyeDropperBtn');
const hiddenNativeColorPicker = document.getElementById('hiddenNativeColorPicker') as HTMLInputElement | null;
const randomCustomColorBtn = document.getElementById('randomCustomColorBtn');

function applyCustomColor(hex: string): void {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
  const customTheme: VisualizerTheme = {
    id: 'custom',
    name: 'Custom',
    primary: hex,
    secondary: hex,
    accent: hex,
    background: '#0a0a0c',
    glow: hex
  };
  applyAppTheme(customTheme);
}

customHexInput?.addEventListener('change', () => {
  let val = customHexInput.value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  applyCustomColor(val);
});

eyeDropperBtn?.addEventListener('click', async () => {
  const win = window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };
  if (win.EyeDropper) {
    try {
      const dropper = new win.EyeDropper();
      const res = await dropper.open();
      if (res?.sRGBHex) {
        applyCustomColor(res.sRGBHex);
      }
    } catch {
      // User cancelled dropper
    }
  } else if (hiddenNativeColorPicker) {
    hiddenNativeColorPicker.click();
  }
});

hiddenNativeColorPicker?.addEventListener('input', () => {
  if (hiddenNativeColorPicker.value) {
    applyCustomColor(hiddenNativeColorPicker.value);
  }
});

randomCustomColorBtn?.addEventListener('click', () => {
  const randHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  applyCustomColor(randHex);
});

const customSolidBtn = document.getElementById('customSolidBtn');
const customGradientBtn = document.getElementById('customGradientBtn');
customSolidBtn?.addEventListener('click', () => {
  customSolidBtn.classList.add('active');
  customGradientBtn?.classList.remove('active');
});
customGradientBtn?.addEventListener('click', () => {
  customGradientBtn.classList.add('active');
  customSolidBtn?.classList.remove('active');
});

const ARIA_SELECTED = 'aria-selected';
const CAT_ABSTRACT: VisualizerPreset['category'] = 'Abstract & Space';
const CAT_PARTICLES: VisualizerPreset['category'] = 'Particles & Light';
const CAT_FLUIDS: VisualizerPreset['category'] = 'Fluids & Heat';
const CAT_RETRO: VisualizerPreset['category'] = 'Retro & Digital';
const CAT_ORGANIC: VisualizerPreset['category'] = 'Organic & Nature';

// Category definition matching user screenshot and canonical catalog
export const CATEGORIES: { name: string; key: VisualizerPreset['category'] }[] = [
  { name: 'Structures', key: 'Structures' },
  { name: CAT_ABSTRACT, key: CAT_ABSTRACT },
  { name: CAT_PARTICLES, key: CAT_PARTICLES },
  { name: CAT_FLUIDS, key: CAT_FLUIDS },
  { name: 'Tunnels', key: 'Tunnels' },
  { name: CAT_RETRO, key: CAT_RETRO },
  { name: CAT_ORGANIC, key: CAT_ORGANIC }
];

export function getPresetThumbnailSvg(preset: VisualizerPreset): string {
  switch (preset.category) {
    case 'Structures':
      return `<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>`;
    case CAT_ABSTRACT:
      return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/></svg>`;
    case CAT_PARTICLES:
      return `<svg viewBox="0 0 24 24"><path d="m13 2-2 7h5l-4 13 2-7H9l4-13Z"/></svg>`;
    case CAT_FLUIDS:
      return `<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`;
    case 'Tunnels':
      return `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/><rect x="10" y="10" width="4" height="4"/></svg>`;
    case CAT_RETRO:
      return `<svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`;
    case CAT_ORGANIC:
      return `<svg viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`;
    default:
      return `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  }
}

export function updatePresetCategoryTabCounters(): void {
  const counts: Record<string, number> = {};
  for (const c of CATEGORIES) {
    counts[c.key] = 0;
  }
  for (const p of PRESETS) {
    if (counts[p.category] !== undefined) {
      counts[p.category]++;
    }
  }

  const badgeAll = document.getElementById('badgeAll');
  if (badgeAll) {
    badgeAll.textContent = PRESETS.length.toString();
  }

  const favCount = Array.from(favoritePresets).filter(id =>
    PRESETS.some(p => p.id === id) || id.startsWith('milkdrop_')
  ).length;
  const badgeFav = document.getElementById('badgeFav');
  if (badgeFav) {
    badgeFav.textContent = favCount.toString();
  }

  for (const c of CATEGORIES) {
    const badge = document.querySelector(`[data-category-badge="${c.key}"]`);
    if (badge) {
      badge.textContent = (counts[c.key] || 0).toString();
    }
  }
}

function renderCategoryPresets(cat: typeof CATEGORIES[0], q: string): void {
  let catPresets = PRESETS.filter(p => p.category === cat.key);
  if (q) {
    catPresets = catPresets.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }
  if (currentFilter === 'fav') {
    catPresets = catPresets.filter(p => favoritePresets.has(p.id));
  }

  if (catPresets.length === 0) return;

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'category-header';
  sectionHeader.innerHTML = `<span>${cat.name}</span><span>${catPresets.length}</span>`;
  presetsCatalogView.appendChild(sectionHeader);

  const grid = document.createElement('div');
  grid.className = 'cards-grid-3';

  for (const p of catPresets) {
    const isFav = favoritePresets.has(p.id);
    const isActive = !milkdropEngine.isActive && activePresetId === p.id;

    const card = document.createElement('div');
    card.className = `preset-card-3 ${isActive ? 'active' : ''}`;
    card.setAttribute('data-preset-id', p.id);
    card.setAttribute('data-category', p.category);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.innerHTML = `
      <span class="preset-active-indicator" title="Active"></span>
      <button class="preset-fav-btn ${isFav ? 'active' : ''}" aria-label="Favorite preset" title="Favorite">★</button>
      <div class="preset-thumb-visual">${getPresetThumbnailSvg(p)}</div>
      <div class="preset-card-info">
        <div class="preset-badge-name" title="${p.name}">${p.name}</div>
        <span class="preset-cat-badge">${p.category}</span>
      </div>
    `;

    card.querySelector('.preset-fav-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(p.id);
    });

    card.addEventListener('click', () => {
      select3DPreset(p);
    });

    grid.appendChild(card);
  }

  presetsCatalogView.appendChild(grid);
}

function renderMilkdropSection(q: string): void {
  let milkdropNames = milkdropEngine.presetNames;
  if (q) {
    milkdropNames = milkdropNames.filter(n => n.toLowerCase().includes(q));
  }
  if (currentFilter === 'fav') {
    milkdropNames = milkdropNames.filter(n => favoritePresets.has(`milkdrop_${n}`));
  }

  if (milkdropNames.length === 0) return;

  const displayList = milkdropNames.slice(0, 30);
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'category-header';
  sectionHeader.innerHTML = `<span>ProjectM & MilkDrop</span><span>${milkdropNames.length}</span>`;
  presetsCatalogView.appendChild(sectionHeader);

  const grid = document.createElement('div');
  grid.className = 'cards-grid-3';

  for (const name of displayList) {
    const favKey = `milkdrop_${name}`;
    const isFav = favoritePresets.has(favKey);
    const isActive = milkdropEngine.isActive && milkdropEngine.currentPresetName === name;

    const card = document.createElement('div');
    card.className = `preset-card-3 ${isActive ? 'active' : ''}`;
    card.innerHTML = `
      <button class="preset-fav-btn ${isFav ? 'active' : ''}" title="Favorite">★</button>
      <div class="preset-thumb-visual">🌀</div>
      <div class="preset-badge-name" title="${name}">${name}</div>
    `;

    card.querySelector('.preset-fav-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(favKey);
    });

    card.addEventListener('click', () => {
      selectMilkdropPreset(name);
    });

    grid.appendChild(card);
  }

  presetsCatalogView.appendChild(grid);
}

// Presets Catalog Renderer
export function renderPresetsCatalog(): void {
  initMilkdropIfNeeded();
  updatePresetCategoryTabCounters();
  presetsCatalogView.innerHTML = '';

  const q = searchQuery.toLowerCase().trim();

  // 1. Render Three.js 3D Presets by Category
  if (currentFilter !== 'milkdrop') {
    for (const cat of CATEGORIES) {
      if (currentFilter !== 'all' && currentFilter !== 'fav' && currentFilter !== cat.key) {
        continue;
      }
      renderCategoryPresets(cat, q);
    }
  }

  // 2. Render ProjectM & MilkDrop Presets Section
  if (currentFilter === 'all' || currentFilter === 'milkdrop' || currentFilter === 'fav') {
    renderMilkdropSection(q);
  }
}

function updateTuningButtonState(preset: VisualizerPreset | null) {
  const tuningBtn = document.querySelector('.preset-settings-link') as HTMLElement | null;
  syncTuningButtonState(preset, tuningBtn, tuningPanel, () => {
    activeToolId = null;
  });
}

function select3DPreset(p: VisualizerPreset) {
  milkdropEngine.setActive(false);
  canvas.style.display = 'block';
  activePresetId = p.id;
  renderEngine.setPreset(p);
  updateTuningButtonState(p);
  renderTuningPanel(p);
  renderPresetsCatalog();
}

function selectMilkdropPreset(name: string) {
  initMilkdropIfNeeded();
  canvas.style.display = 'none';
  milkdropEngine.setActive(true);
  milkdropEngine.loadPreset(name, 2.0);
  updateTuningButtonState(null);
  renderTuningPanel(null);
  renderPresetsCatalog();
}

function toggleFavorite(id: string) {
  if (favoritePresets.has(id)) {
    favoritePresets.delete(id);
  } else {
    favoritePresets.add(id);
  }
  localStorage.setItem('visualizor_favorites', JSON.stringify(Array.from(favoritePresets)));
  renderPresetsCatalog();
}

// Search and filter listeners
presetSearchInput.addEventListener('input', () => {
  searchQuery = presetSearchInput.value;
  renderPresetsCatalog();
});

export function setFilter(f: 'all' | 'fav' | 'milkdrop' | VisualizerPreset['category']): void {
  currentFilter = f;
  const pills = document.querySelectorAll('#presetCategoryTabs .filter-pill');
  pills.forEach(pill => {
    const filterAttr = (pill as HTMLElement).dataset.filter;
    const isMatching = filterAttr === f;
    pill.classList.toggle('active', isMatching);
    pill.setAttribute(ARIA_SELECTED, String(isMatching));
  });
  renderPresetsCatalog();
}

const categoryTabsContainer = document.getElementById('presetCategoryTabs');
if (categoryTabsContainer) {
  categoryTabsContainer.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.filter-pill') as HTMLElement | null;
    if (!target) return;
    const filter = target.dataset.filter as 'all' | 'fav' | 'milkdrop' | VisualizerPreset['category'] | null;
    if (filter) {
      setFilter(filter);
    }
  });
}


// Auto Cycle Presets
autoCycleBtn.addEventListener('click', () => {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
    autoCycleBtn.classList.remove('active');
  } else {
    autoCycleBtn.classList.add('active');
    autoCycleTimer = setInterval(() => {
      pickRandomPreset();
    }, 10000);
  }
});

function pickRandomPreset() {
  const chooseMilkdrop = Math.random() > 0.5 && milkdropEngine.presetNames.length > 0;
  if (chooseMilkdrop) {
    milkdropEngine.loadRandomPreset(2.5);
    canvas.style.display = 'none';
    milkdropEngine.setActive(true);
  } else {
    const randomIdx = Math.floor(Math.random() * PRESETS.length);
    select3DPreset(PRESETS[randomIdx]);
  }
  renderPresetsCatalog();
}

shufflePresetBtn.addEventListener('click', pickRandomPreset);
railShuffleBtn?.addEventListener('click', pickRandomPreset);
loopPresetBtn.addEventListener('click', () => {
  loopPresetBtn.classList.toggle('active');
});

// Helper functions for drawer management
function closeAllDrawers() {
  allPanels.forEach(p => p.classList.remove('open'));
  document.querySelectorAll('.rail-btn').forEach(b => b.classList.remove('active'));
}

function openDrawer(toolId: string) {
  closeAllDrawers();
  activeToolId = toolId;
  const btn = document.querySelector(`.rail-btn[data-panel="${toolId}"]`) || document.querySelector(`.rail-btn[data-tab="${toolId}"]`);
  btn?.classList.add('active');
  const panel = PANEL_MAP[toolId];
  if (panel) {
    panel.classList.add('open');
  }
}

function toggleDrawer(toolId: string) {
  if (activeToolId === toolId) {
    const panel = PANEL_MAP[toolId];
    panel?.classList.remove('open');
    const btn = document.querySelector(`.rail-btn[data-panel="${toolId}"]`) || document.querySelector(`.rail-btn[data-tab="${toolId}"]`);
    btn?.classList.remove('active');
    activeToolId = null;
    return;
  }
  openDrawer(toolId);
}

function toggleHideUI() {
  const isHidden = appRoot.classList.toggle('ui-hidden');
  document.documentElement.classList.toggle('ui-hidden', isHidden);
  document.body.classList.toggle('ui-hidden', isHidden);
}

// Topbar Mode Switcher: Visualizer vs Studio
modeVisualizerBtn.addEventListener('click', () => {
  modeVisualizerBtn.classList.add('active');
  modeStudioBtn.classList.remove('active');
  openDrawer('presets');
});

modeStudioBtn.addEventListener('click', () => {
  modeStudioBtn.classList.add('active');
  modeVisualizerBtn.classList.remove('active');
  openDrawer('myCreations');
  select3DPreset(studioPreset);
});

// Build & Update Queue UI
function updateQueueUI(playlist: PlaylistTrack[], currentIdx: number) {
  queueList.innerHTML = '';
  if (playlist.length === 0) {
    queueList.innerHTML = '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:20px 0;">No tracks in queue. Add tracks or drop files here.</div>';
    return;
  }

  playlist.forEach((track, i) => {
    const item = document.createElement('div');
    item.className = `queue-item ${i === currentIdx ? 'active' : ''}`;
    item.innerHTML = `
      <div class="queue-item-title">${track.name}</div>
      <div class="queue-item-artist">${track.artist}</div>
    `;
    item.addEventListener('click', () => {
      void audioEngine.playPlaylistIndex(i);
      updatePlayButton();
    });
    queueList.appendChild(item);
  });
}

audioEngine.onPlaylistChange = (pl, idx) => updateQueueUI(pl, idx);

shuffleBtn.addEventListener('click', () => {
  audioEngine.isShuffle = !audioEngine.isShuffle;
  shuffleBtn.classList.toggle('active', audioEngine.isShuffle);
});

repeatBtn.addEventListener('click', () => {
  audioEngine.isRepeat = !audioEngine.isRepeat;
  repeatBtn.classList.toggle('active', audioEngine.isRepeat);
});

// More extras popover state manager
function setRailMoreExpanded(expanded: boolean) {
  if (expanded) {
    railMoreWrapper?.classList.add('expanded');
    railMoreBtn?.setAttribute(ARIA_EXPANDED, 'true');
  } else {
    railMoreWrapper?.classList.remove('expanded');
    railMoreBtn?.setAttribute(ARIA_EXPANDED, 'false');
  }
}

// 15 Navigation Rail Tool Switcher (drawers only; special buttons handled individually below)
document.querySelectorAll('.rail-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = btn as HTMLElement;
    const toolId = el.dataset.panel || el.dataset.tab;
    if (!toolId || toolId === 'more' || toolId === 'shortcuts' || toolId === 'hideUi') return;
    toggleDrawer(toolId);
  });
});

// Hide UI & Show UI Handlers
hideUiBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleHideUI();
});
showUiBtn?.addEventListener('click', () => {
  appRoot.classList.remove('ui-hidden');
  document.documentElement.classList.remove('ui-hidden');
  document.body.classList.remove('ui-hidden');
});

// Shortcuts Modal Handlers
const shortcutHelpBtn = document.getElementById('shortcutHelpBtn');
shortcutHelpBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  shortcutsModal?.classList.toggle('open');
});
closeShortcutsBtn?.addEventListener('click', () => {
  shortcutsModal?.classList.remove('open');
});
shortcutsModal?.addEventListener('click', (e) => {
  if (e.target === shortcutsModal) {
    shortcutsModal.classList.remove('open');
  }
});

// More Extras Popover Handlers
railMoreBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isExpanded = !railMoreWrapper?.classList.contains('expanded');
  setRailMoreExpanded(isExpanded);
});
ambientModeBtn?.addEventListener('click', () => {
  document.body.classList.toggle(AMBIENT_MODE_CLASS);
});
bugReportBtn?.addEventListener('click', () => {
  window.open('https://github.com/FunWarry/Visualizor/issues', '_blank');
});
document.addEventListener('click', (e: MouseEvent) => {
  if (railMoreWrapper?.classList.contains('expanded') && !railMoreWrapper.contains(e.target as Node)) {
    setRailMoreExpanded(false);
  }
});

// Close Buttons for Drawer Panels
document.querySelectorAll('.close-drawer-btn, .closeThemeBtn, .closeQueueBtn, .closeStudioBtn, .closeFxBtn, .closeAudioBtn, .closeCameraBtn, .closeOverlayBtn, .closeTextBtn, .closeSubtitlesBtn, .closeLibraryBtn, .closeTuningBtn, .closeMidiBtn, #closeDrawerBtn, #closeMidiBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    closeAllDrawers();
    activeToolId = null;
  });
});
dockQueueBtn?.addEventListener('click', () => queuePanel?.classList.toggle('open'));

// Camera & 3D Views Drawer Controls (Ticket #42)
const tiltUp = document.getElementById('tiltUp') || document.querySelector('[data-alias="camUpBtn"]');
const tiltDown = document.getElementById('tiltDown') || document.querySelector('[data-alias="camDownBtn"]');
const rotateLeft = document.getElementById('rotateLeft') || document.querySelector('[data-alias="camLeftBtn"]');
const rotateRight = document.getElementById('rotateRight') || document.querySelector('[data-alias="camRightBtn"]');
const cameraReset = document.getElementById('cameraReset') || document.querySelector('[data-alias="camResetBtn"]');
const zoomSlider = (document.getElementById('zoomSlider') || document.querySelector('[data-alias="camZoomSlider"]')) as HTMLInputElement | null;
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const zoomValue = document.getElementById('zoomValue');
const autoRotateToggle = (document.getElementById('autoRotateToggle') || document.querySelector('[data-alias="camAutoOrbitToggle"]')) as HTMLInputElement | null;
const rotateSpeedSlider = (document.getElementById('rotateSpeedSlider') || document.querySelector('[data-alias="camOrbitSpeedSlider"]')) as HTMLInputElement | null;
const rotateSpeedValue = document.getElementById('rotateSpeedValue');
const camDirCcwBtn = document.getElementById('camDirCcwBtn');
const camDirCwBtn = document.getElementById('camDirCwBtn');
const viewpointBtns = document.querySelectorAll('.viewpoint-btn');
const camShakeToggle = document.getElementById('camShakeToggle') as HTMLInputElement | null;
const camShakeSlider = document.getElementById('camShakeIntensitySlider') as HTMLInputElement | null;
const camShakeVal = document.getElementById('camShakeIntensityVal');
const cameraShakeSegments = document.querySelectorAll('#cameraShakeSegments .opt-chip');
const dofSegments = document.querySelectorAll('#dofSegments .opt-chip');

function setupDpadArrow(btn: Element | null, axis: 'orbit' | 'tilt', direction: 1 | -1) {
  if (!btn) return;

  let glideInterval: number | null = null;
  let glideTimeout: number | null = null;

  const startGlide = () => {
    stopGlide();
    btn.classList.add('is-holding');
    if (autoRotateToggle) {
      autoRotateToggle.checked = false;
    }
    renderEngine.setAutoRotate(false);
    renderEngine.cameraController.nudge(axis, direction, 0.1);

    glideTimeout = window.setTimeout(() => {
      glideInterval = window.setInterval(() => {
        renderEngine.cameraController.nudge(axis, direction, 0.03);
      }, 30);
    }, 250);
  };

  const stopGlide = () => {
    btn.classList.remove('is-holding');
    if (glideTimeout !== null) {
      window.clearTimeout(glideTimeout);
      glideTimeout = null;
    }
    if (glideInterval !== null) {
      window.clearInterval(glideInterval);
      glideInterval = null;
    }
  };

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startGlide();
    try {
      (btn as HTMLElement).setPointerCapture((e as PointerEvent).pointerId);
    } catch {
      // Ignore if pointer capture fails in mock environment
    }
  });

  btn.addEventListener('pointerup', stopGlide);
  btn.addEventListener('pointercancel', stopGlide);
  btn.addEventListener('pointerleave', stopGlide);
}

setupDpadArrow(rotateLeft, 'orbit', -1);
setupDpadArrow(rotateRight, 'orbit', 1);
setupDpadArrow(tiltUp, 'tilt', 1);
setupDpadArrow(tiltDown, 'tilt', -1);

cameraReset?.addEventListener('click', () => {
  renderEngine.resetCamera();
  if (zoomSlider) zoomSlider.value = '0.5';
  if (zoomValue) zoomValue.textContent = '50%';
  if (autoRotateToggle) autoRotateToggle.checked = true;
  viewpointBtns.forEach(b => b.classList.remove('active'));
  document.getElementById('viewDefaultBtn')?.classList.add('active');
});

function updateZoomReadout(val: number) {
  const clamped = Math.max(0, Math.min(1, val));
  if (zoomSlider) zoomSlider.value = clamped.toString();
  if (zoomValue) zoomValue.textContent = `${Math.round(clamped * 100)}%`;
  renderEngine.cameraController.setZoom(clamped);
}

zoomSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(zoomSlider.value);
  updateZoomReadout(val);
});

zoomIn?.addEventListener('click', () => {
  const current = Number.parseFloat(zoomSlider?.value ?? '0.5');
  updateZoomReadout(Math.min(1.0, current + 0.1));
});

zoomOut?.addEventListener('click', () => {
  const current = Number.parseFloat(zoomSlider?.value ?? '0.5');
  updateZoomReadout(Math.max(0.0, current - 0.1));
});

viewpointBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    viewpointBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const viewId = (btn as HTMLElement).dataset.view ?? 'default';
    renderEngine.setAutoRotate(false);
    renderEngine.setViewpoint(viewId);
    if (autoRotateToggle) autoRotateToggle.checked = false;
    const currentZoom = renderEngine.cameraController.getZoom();
    if (zoomSlider) zoomSlider.value = currentZoom.toString();
    if (zoomValue) zoomValue.textContent = `${Math.round(currentZoom * 100)}%`;
  });
});

autoRotateToggle?.addEventListener('change', () => {
  renderEngine.setAutoRotate(autoRotateToggle.checked);
});

rotateSpeedSlider?.addEventListener('input', () => {
  const spd = Number.parseFloat(rotateSpeedSlider.value);
  renderEngine.setAutoRotate(renderEngine.config.autoRotate, spd);
  if (rotateSpeedValue) rotateSpeedValue.textContent = `${Math.round(spd * 100)}%`;
});

function setSpinDirection(dir: 1 | -1) {
  if (dir === 1) {
    camDirCwBtn?.classList.add('active');
    camDirCcwBtn?.classList.remove('active');
  } else {
    camDirCcwBtn?.classList.add('active');
    camDirCwBtn?.classList.remove('active');
  }
  renderEngine.cameraController.setRotationDirection(dir);
}

camDirCcwBtn?.addEventListener('click', () => setSpinDirection(-1));
camDirCwBtn?.addEventListener('click', () => setSpinDirection(1));

camShakeToggle?.addEventListener('change', () => {
  renderEngine.setCameraShake(camShakeToggle.checked);
});

camShakeSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(camShakeSlider.value);
  if (camShakeVal) camShakeVal.textContent = `${Math.round(val * 100)}%`;
  renderEngine.cameraController.setCameraShakeIntensity(val);
  cameraShakeSegments.forEach(chip => {
    const chipVal = Number.parseFloat((chip as HTMLElement).dataset.value || '0');
    chip.classList.toggle('active', Math.abs(chipVal - val) < 0.15);
  });
});

cameraShakeSegments.forEach(chip => {
  chip.addEventListener('click', () => {
    cameraShakeSegments.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const val = Number.parseFloat((chip as HTMLElement).dataset.value || '0');
    renderEngine.setCameraShake(val > 0, val);
    if (camShakeSlider) camShakeSlider.value = val.toString();
    if (camShakeVal) camShakeVal.textContent = `${Math.round(val * 100)}%`;
    if (camShakeToggle) camShakeToggle.checked = val > 0;
  });
});

dofSegments.forEach(chip => {
  chip.addEventListener('click', () => {
    dofSegments.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
  });
});

// =========================================================================
// Text & Typography Drawer Controls (Milestone 5 - Ticket #43)
// =========================================================================
const textInput0 = document.getElementById('textInput0') as HTMLInputElement | null;
const textInput1 = document.getElementById('textInput1') as HTMLInputElement | null;
const textInput2 = document.getElementById('textInput2') as HTMLInputElement | null;
const textWatermarkToggle = document.getElementById('textWatermarkToggle') as HTMLInputElement | null;
const textAnchorCells = document.querySelectorAll('#textAnchorMatrix .anchor-cell');
const textAnchorLabel = document.getElementById('textAnchorLabel');
const textAnchorSelect = document.getElementById('textAnchorSelect') as HTMLSelectElement | null;
const textAnimChips = document.querySelectorAll('#textAnimChips .opt-chip');
const textAnimSelect = document.getElementById('textAnimSelect') as HTMLSelectElement | null;
const textFontFamilySelect = document.getElementById('textFontFamilySelect') as HTMLSelectElement | null;
const textFontSizeSlider = document.getElementById('textFontSizeSlider') as HTMLInputElement | null;
const textFontSizeVal = document.getElementById('textFontSizeVal');
const textColorPicker = document.getElementById('textColorPicker') as HTMLInputElement | null;
const textColorInput = document.getElementById('textColorInput') as HTMLInputElement | null;
const textColorHexVal = document.getElementById('textColorHexVal');
const textGlowSlider = document.getElementById('textGlowSlider') as HTMLInputElement | null;
const textGlowVal = document.getElementById('textGlowVal');
const textOpacitySlider = document.getElementById('textOpacitySlider') as HTMLInputElement | null;
const textOpacityVal = document.getElementById('textOpacityVal');
const textIntensitySlider = document.getElementById('textIntensitySlider') as HTMLInputElement | null;
const textIntensityVal = document.getElementById('textIntensityVal');

// Text Inputs Binding
textInput0?.addEventListener('input', () => {
  renderEngine.textOverlay?.setTitle(textInput0.value);
});
textInput1?.addEventListener('input', () => {
  renderEngine.textOverlay?.setArtist(textInput1.value);
});
textInput2?.addEventListener('input', () => {
  renderEngine.textOverlay?.setCustomText(textInput2.value);
});

// Watermark Binding
textWatermarkToggle?.addEventListener('change', () => {
  renderEngine.textOverlay?.setWatermark(textWatermarkToggle.checked);
});

// 9-Point Anchor Matrix Binding
const ANCHOR_DISPLAY_NAMES: Record<string, string> = {
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

const selectAnchor = (anchor: string) => {
  textAnchorCells.forEach(cell => {
    const a = (cell as HTMLElement).dataset.anchor;
    cell.classList.toggle('active', a === anchor);
  });
  if (textAnchorLabel) {
    textAnchorLabel.textContent = ANCHOR_DISPLAY_NAMES[anchor] || anchor;
  }
  if (textAnchorSelect) {
    textAnchorSelect.value = anchor;
  }
  renderEngine.textOverlay?.setAnchor(anchor as TextAnchor);
};

textAnchorCells.forEach(cell => {
  cell.addEventListener('click', () => {
    const anchor = (cell as HTMLElement).dataset.anchor || 'center';
    selectAnchor(anchor);
  });
});

textAnchorSelect?.addEventListener('change', () => {
  selectAnchor(textAnchorSelect.value);
});

// Animation Modes Binding
const selectAnimMode = (anim: string) => {
  textAnimChips.forEach(chip => {
    const a = (chip as HTMLElement).dataset.anim || (chip as HTMLElement).dataset.alias;
    chip.classList.toggle('active', a === anim);
  });
  if (textAnimSelect) {
    textAnimSelect.value = anim;
  }
  renderEngine.textOverlay?.setAnimationMode(anim as TextAnimationMode);
};

textAnimChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const anim = (chip as HTMLElement).dataset.anim || 'pulse';
    selectAnimMode(anim);
  });
});

textAnimSelect?.addEventListener('change', () => {
  selectAnimMode(textAnimSelect.value);
});

// Typography Controls Binding
textFontFamilySelect?.addEventListener('change', () => {
  renderEngine.textOverlay?.setFontFamily(textFontFamilySelect.value);
});

textFontSizeSlider?.addEventListener('input', () => {
  const size = Number(textFontSizeSlider.value);
  if (textFontSizeVal) textFontSizeVal.textContent = `${size}px`;
  renderEngine.textOverlay?.setFontSize(size);
});

const updateTextColor = (hex: string) => {
  const upper = hex.toUpperCase();
  if (textColorPicker) textColorPicker.value = upper;
  if (textColorInput) textColorInput.value = upper;
  if (textColorHexVal) textColorHexVal.textContent = upper;
  renderEngine.textOverlay?.setColor(upper);
};

textColorPicker?.addEventListener('input', () => {
  updateTextColor(textColorPicker.value);
});

textColorInput?.addEventListener('input', () => {
  const val = textColorInput.value.trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(val)) {
    updateTextColor(val);
  }
});

textGlowSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(textGlowSlider.value);
  if (textGlowVal) textGlowVal.textContent = val.toFixed(1);
  renderEngine.textOverlay?.setGlowIntensity(val);
});

textOpacitySlider?.addEventListener('input', () => {
  const val = Number.parseFloat(textOpacitySlider.value);
  if (textOpacityVal) textOpacityVal.textContent = `${Math.round(val * 100)}%`;
  renderEngine.textOverlay?.setOpacity(val);
});

textIntensitySlider?.addEventListener('input', () => {
  const val = Number.parseFloat(textIntensitySlider.value);
  if (textIntensityVal) textIntensityVal.textContent = `${Math.round(val * 100)}%`;
  renderEngine.textOverlay?.setAnimationIntensity(val);
});

function handleKeyboardHotkey(key: string, isShift: boolean): boolean {
  switch (key.toLowerCase()) {
    case 'h':
      toggleHideUI();
      return true;
    case 't':
      toggleDrawer('text');
      return true;
    case 'f':
      toggleFullscreen();
      return true;
    case ' ':
      initMilkdropIfNeeded();
      void audioEngine.togglePlay();
      updatePlayButton();
      return true;
    case 'r':
      pickRandomPreset();
      return true;
    case 'b':
      bpmText.textContent = `${audioEngine.bpmDetector.tap()} BPM (Tap)`;
      bpmBtn.style.borderColor = 'var(--primary)';
      return true;
    case '?':
      shortcutsModal?.classList.toggle('open');
      return true;
    case '/':
      if (isShift) {
        shortcutsModal?.classList.toggle('open');
        return true;
      }
      return false;
    default:
      return false;
  }
}

// Keyboard Hotkeys
window.addEventListener('keydown', (e: KeyboardEvent) => {
  const target = e.target as HTMLElement | null;
  const isInput = Boolean(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable));
  if (isInput) return;

  if (handleKeyboardHotkey(e.key, e.shiftKey)) {
    e.preventDefault();
  }
});

// BPM & Tap Tempo
bpmBtn.addEventListener('click', () => {
  const bpm = audioEngine.bpmDetector.tap();
  bpmText.textContent = `${bpm} BPM (Tap)`;
  bpmBtn.style.borderColor = 'var(--primary)';
});

resetBpmBtn.addEventListener('click', () => {
  audioEngine.bpmDetector.resetManual();
  bpmText.textContent = `${audioEngine.bpmDetector.detectedBPM} BPM`;
  bpmBtn.style.borderColor = '';
});

audioEngine.onBpmChange = (bpm, isManual) => {
  bpmText.textContent = `${bpm} BPM${isManual ? ' (Lock)' : ''}`;
};

// Audio & Player Controls
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

audioEngine.onTimeUpdate = (curr, total) => {
  curTime.textContent = formatTime(curr);
  totTime.textContent = formatTime(total);
  if (total > 0) {
    scrubberFill.style.width = `${(curr / total) * 100}%`;
  }
};

scrubber.addEventListener('click', (e) => {
  const rect = scrubber.getBoundingClientRect();
  const frac = (e.clientX - rect.left) / rect.width;
  audioEngine.seek(frac * audioEngine.duration);
});

playBtn.addEventListener('click', async () => {
  initMilkdropIfNeeded();
  await audioEngine.togglePlay();
  updatePlayButton();
});

demoBtn.addEventListener('click', () => {
  initMilkdropIfNeeded();
  if (audioEngine.isDemoPlaying) {
    audioEngine.stopDemo();
  } else {
    audioEngine.playDemo();
  }
  updatePlayButton();
});

topUploadInput?.addEventListener('change', (e) => {
  initMilkdropIfNeeded();
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    audioEngine.loadAudioFile(file);
    updatePlayButton();
  }
});

queueFileInput.addEventListener('change', (e) => {
  initMilkdropIfNeeded();
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    audioEngine.addFilesToPlaylist(Array.from(files));
    updatePlayButton();
  }
});

// Drag and drop audio files onto window
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
  e.preventDefault();
  initMilkdropIfNeeded();
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));
    if (audioFiles.length > 0) {
      audioEngine.addFilesToPlaylist(audioFiles);
      updatePlayButton();
    }
  }
});

micBtn.addEventListener('click', async () => {
  initMilkdropIfNeeded();
  const active = await audioEngine.toggleMic();
  micBtn.classList.toggle('active', active);
  if (active) {
    syncScreenAudioUI(false);
  }
  updatePlayButton();
});

// Screen / Window / Tab Audio Capture Source Handler
const screenAudioBtn = document.getElementById('screenAudioBtn') as HTMLButtonElement | null;
const captureSystemAudioBtn = document.getElementById('captureSystemAudioBtn') as HTMLButtonElement | null;
const captureSystemAudioLabel = document.getElementById('captureSystemAudioLabel');
const audioSourceStatus = document.getElementById('audioSourceStatus');

function syncScreenAudioUI(active: boolean) {
  screenAudioBtn?.classList.toggle('active', active);
  captureSystemAudioBtn?.classList.toggle('active', active);
  captureSystemAudioBtn?.setAttribute('aria-pressed', String(active));
  if (captureSystemAudioLabel) {
    captureSystemAudioLabel.textContent = active ? 'Stop Screen Audio Capture' : 'Capture Screen / App Audio';
  }
  if (audioSourceStatus) {
    audioSourceStatus.style.display = active ? 'block' : 'none';
  }
  updatePlayButton();
}

audioEngine.onScreenAudioEnded = () => {
  syncScreenAudioUI(false);
};

async function handleScreenAudioToggle() {
  initMilkdropIfNeeded();
  try {
    const active = await audioEngine.toggleScreenAudioCapture();
    syncScreenAudioUI(active);
    micBtn.classList.remove('active');
  } catch (err: unknown) {
    if ((err as Error)?.message === 'NO_AUDIO_TRACK') {
      alert("No audio track shared!\n\nPlease make sure to check 'Also share tab audio' or 'Share system audio' when choosing the screen, window, or tab.");
    }
    syncScreenAudioUI(false);
  }
}

screenAudioBtn?.addEventListener('click', handleScreenAudioToggle);
captureSystemAudioBtn?.addEventListener('click', handleScreenAudioToggle);

function updatePlayButton() {
  trackTitle.textContent = audioEngine.currentTrackName;
  if (audioEngine.isPlaying || audioEngine.isDemoPlaying) {
    playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

volumeSlider.addEventListener('input', () => {
  audioEngine.setVolume(Number.parseFloat(volumeSlider.value));
});

// FX Controls
bloomSlider.addEventListener('input', () => {
  const val = Number.parseFloat(bloomSlider.value);
  document.getElementById('bloomVal')!.textContent = val.toFixed(1);
  renderEngine.updateConfig({ bloomStrength: val });
});

persistSlider.addEventListener('input', () => {
  const val = Number.parseFloat(persistSlider.value);
  document.getElementById('persistVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ persistence: val });
});

chromaSlider.addEventListener('input', () => {
  const val = Number.parseFloat(chromaSlider.value);
  document.getElementById('chromaVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ chromaticAberration: val });
});

grainSlider.addEventListener('input', () => {
  const val = Number.parseFloat(grainSlider.value);
  document.getElementById('grainVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ filmGrain: val });
});

vigSlider.addEventListener('input', () => {
  const val = Number.parseFloat(vigSlider.value);
  document.getElementById('vigVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ vignette: val });
});

scanSlider.addEventListener('input', () => {
  const val = Number.parseFloat(scanSlider.value);
  document.getElementById('scanVal')!.textContent = val.toFixed(1);
  renderEngine.updateConfig({ scanlines: val });
});

bendSlider.addEventListener('input', () => {
  const val = Number.parseFloat(bendSlider.value);
  document.getElementById('bendVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ crtBend: val });
});

sensSlider.addEventListener('input', () => {
  const val = Number.parseFloat(sensSlider.value);
  document.getElementById('sensVal')!.textContent = `${Math.round(val * 100)}%`;
  audioEngine.sensitivity = val;
});

// Web MIDI API Controller Setup (Ticket #45)
const midiManager = new MidiManager();
const midiPanelController = initMidiPanel(midiManager, midiPanel);

function updateSliderUi(slider: HTMLInputElement | null, val: number | string, textId: string, textVal: string): void {
  if (slider) slider.value = String(val);
  const el = document.getElementById(textId);
  if (el) el.textContent = textVal;
}

const MIDI_DISPATCH_TABLE: Record<string, (value: number) => void> = {
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
    const rotSlider = document.getElementById('rotateSpeedSlider') as HTMLInputElement | null;
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
    const moodSpeed = document.getElementById('studioMoodSpeedSlider') as HTMLInputElement | null;
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

function dispatchMidiParameter(target: string, value: number): void {
  const handler = MIDI_DISPATCH_TABLE[target];
  if (handler) {
    handler(value);
    return;
  }
  const activePreset = renderEngine.activePreset;
  if (activePreset && typeof activePreset.setCustomParameter === 'function') {
    activePreset.setCustomParameter(target, value);
    const slider = document.getElementById(`tuning_${target}_slider`) as HTMLInputElement | null;
    updateSliderUi(slider, value, `tuning_${target}_val`, value.toFixed(2));
  }
}

midiManager.on('cc', (ev) => {
  dispatchMidiParameter(ev.target, ev.value);
  midiPanelController.updateParameterValue(ev.target, ev.value);
});

// Studio Forge & Recipe Builder Controls (Ticket #44)
const studioPreset = (PRESETS.find(p => p.id === 'studio-composer') as StudioComposerPreset) || new StudioComposerPreset();

// 1. Launch Preset Button
const activateStudioBtn = document.getElementById('activateStudioBtn') as HTMLButtonElement | null;
activateStudioBtn?.addEventListener('click', () => {
  select3DPreset(studioPreset);
});

// 2. Generation Modes: Auto-Forge, Curated, Remix
let currentGenerationMode: 'forge' | 'curated' | 'remix' = 'forge';
const studioModeForgeBtn = document.getElementById('studioModeForgeBtn') as HTMLButtonElement | null;
const studioModeCuratedBtn = document.getElementById('studioModeCuratedBtn') as HTMLButtonElement | null;
const studioModeRemixBtn = document.getElementById('studioModeRemixBtn') as HTMLButtonElement | null;
const studioQuickForgeBtn = document.getElementById('studioQuickForgeBtn') as HTMLButtonElement | null;
const studioGenerateBtn = document.getElementById('studioGenerateBtn') as HTMLButtonElement | null;

const modeButtons = [
  { btn: studioModeForgeBtn, mode: 'forge' as const },
  { btn: studioModeCuratedBtn, mode: 'curated' as const },
  { btn: studioModeRemixBtn, mode: 'remix' as const }
];

modeButtons.forEach(({ btn, mode }) => {
  btn?.addEventListener('click', () => {
    currentGenerationMode = mode;
    modeButtons.forEach(b => {
      if (b.btn) {
        b.btn.classList.toggle('active', b.mode === mode);
        b.btn.setAttribute(ARIA_SELECTED, String(b.mode === mode));
      }
    });
    if (studioGenerateBtn) {
      if (mode === 'forge') studioGenerateBtn.textContent = '⚡ Forge Look';
      else if (mode === 'curated') studioGenerateBtn.textContent = '💎 Curate Look';
      else studioGenerateBtn.textContent = '🔀 Remix Look';
    }
  });
});

function executeGeneration() {
  if (currentGenerationMode === 'forge') {
    studioPreset.generateRandomRecipe();
  } else if (currentGenerationMode === 'curated') {
    const inputName = (document.getElementById('studioRecipeNameInput') as HTMLInputElement | null)?.value;
    studioPreset.generateCuratedRecipe(inputName || '');
  } else {
    studioPreset.remixCurrent();
  }
  syncStudioUIFromActiveRecipe();
}

studioQuickForgeBtn?.addEventListener('click', () => {
  studioPreset.generateRandomRecipe();
  syncStudioUIFromActiveRecipe();
});

studioGenerateBtn?.addEventListener('click', executeGeneration);

// 3. Engine Families Space Selector
const studioFamilyCards = document.querySelectorAll<HTMLButtonElement>('.studio-family-card');
const studioActiveFamilyLabel = document.getElementById('studioActiveFamilyLabel');

studioFamilyCards.forEach(card => {
  card.addEventListener('click', () => {
    const family = (card.dataset.family || 'force') as EngineFamily;
    studioFamilyCards.forEach(c => {
      c.classList.toggle('active', c === card);
      c.setAttribute('aria-checked', String(c === card));
    });
    if (studioActiveFamilyLabel) {
      const nameSpan = card.querySelector('.studio-family-card-name');
      studioActiveFamilyLabel.textContent = nameSpan ? nameSpan.textContent : family;
    }
    studioPreset.setEngineFamily(family);
    syncStudioUIFromActiveRecipe();
  });
});

// 4. 4-Step Recipe Wizard Tabs & Panes
const studioWizardTabs = document.querySelectorAll<HTMLButtonElement>('.studio-wizard-tab');
const studioStepPanes: Record<string, HTMLElement | null> = {
  stage: document.getElementById('studioStepStage'),
  hero: document.getElementById('studioStepHero'),
  mood: document.getElementById('studioStepMood'),
  engine: document.getElementById('studioStepEngine')
};

studioWizardTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const step = tab.dataset.step || 'stage';
    studioWizardTabs.forEach(t => {
      t.classList.toggle('active', t === tab);
      t.setAttribute(ARIA_SELECTED, String(t === tab));
    });
    Object.entries(studioStepPanes).forEach(([k, pane]) => {
      if (pane) {
        pane.style.display = k === step ? 'block' : 'none';
        pane.classList.toggle('active', k === step);
      }
    });
  });
});

// Step 1: Stage Controls
const studioBackdropChips = document.querySelectorAll('#studioBackdropChips .opt-chip');
studioBackdropChips.forEach(chip => {
  chip.addEventListener('click', () => {
    studioBackdropChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const backdrop = ((chip as HTMLElement).dataset.backdrop || 'void') as StageBackdropType;
    studioPreset.setStage({ backdrop });
  });
});

const studioStageScaleSlider = document.getElementById('studioStageScaleSlider') as HTMLInputElement | null;
studioStageScaleSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioStageScaleSlider.value);
  const label = document.getElementById('studioStageScaleVal');
  if (label) label.textContent = `${val.toFixed(1)}x`;
  studioPreset.setStage({ scale: val });
});

const studioStageDustSlider = document.getElementById('studioStageDustSlider') as HTMLInputElement | null;
studioStageDustSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioStageDustSlider.value);
  const label = document.getElementById('studioStageDustVal');
  if (label) label.textContent = val.toFixed(1);
  studioPreset.setStage({ dustDensity: val });
});

const studioStageLightSlider = document.getElementById('studioStageLightSlider') as HTMLInputElement | null;
studioStageLightSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioStageLightSlider.value);
  const label = document.getElementById('studioStageLightVal');
  if (label) label.textContent = val.toFixed(1);
  studioPreset.setStage({ lightIntensity: val });
});

// Step 2: Hero Controls
const studioHeroGeomChips = document.querySelectorAll('#studioHeroGeomChips .opt-chip');
studioHeroGeomChips.forEach(chip => {
  chip.addEventListener('click', () => {
    studioHeroGeomChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const geometry = ((chip as HTMLElement).dataset.geom || 'sphere') as HeroGeometryType;
    studioPreset.setHero({ geometry });
  });
});

const studioHeroStyleChips = document.querySelectorAll('#studioHeroStyleChips .opt-chip');
studioHeroStyleChips.forEach(chip => {
  chip.addEventListener('click', () => {
    studioHeroStyleChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const renderStyle = ((chip as HTMLElement).dataset.style || 'solid') as HeroRenderStyle;
    studioPreset.setHero({ renderStyle });
  });
});

const studioHeroSymmetryChips = document.querySelectorAll('#studioHeroSymmetryChips .opt-chip');
studioHeroSymmetryChips.forEach(chip => {
  chip.addEventListener('click', () => {
    studioHeroSymmetryChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const symmetry = ((chip as HTMLElement).dataset.symmetry || 'none') as HeroSymmetry;
    studioPreset.setHero({ symmetry });
  });
});

const studioHeroDeformSlider = document.getElementById('studioHeroDeformSlider') as HTMLInputElement | null;
studioHeroDeformSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioHeroDeformSlider.value);
  const label = document.getElementById('studioHeroDeformVal');
  if (label) label.textContent = val.toFixed(1);
  studioPreset.setHero({ deformation: val });
});

const studioHeroScaleSlider = document.getElementById('studioHeroScaleSlider') as HTMLInputElement | null;
studioHeroScaleSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioHeroScaleSlider.value);
  const label = document.getElementById('studioHeroScaleVal');
  if (label) label.textContent = `${val.toFixed(1)}x`;
  studioPreset.setHero({ scale: val });
});

// Step 3: Mood Controls
const studioThemeSelect = document.getElementById('studioThemeSelect') as HTMLSelectElement | null;
studioThemeSelect?.addEventListener('change', () => {
  const themeId = studioThemeSelect.value;
  studioPreset.setMood({ themeId });
  const theme = getTheme(themeId);
  renderEngine.setTheme(theme);
});

const studioMoodBloomSlider = document.getElementById('studioMoodBloomSlider') as HTMLInputElement | null;
studioMoodBloomSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioMoodBloomSlider.value);
  const label = document.getElementById('studioMoodBloomVal');
  if (label) label.textContent = val.toFixed(1);
  studioPreset.setMood({ bloomIntensity: val });
  renderEngine.updateConfig({ bloomStrength: val });
});

const studioMoodSpeedSlider = document.getElementById('studioMoodSpeedSlider') as HTMLInputElement | null;
studioMoodSpeedSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioMoodSpeedSlider.value);
  const label = document.getElementById('studioMoodSpeedVal');
  if (label) label.textContent = `${val.toFixed(1)}x`;
  studioPreset.setMood({ speedMultiplier: val });
});

const studioLightingVibeChips = document.querySelectorAll('#studioLightingVibeChips .opt-chip');
studioLightingVibeChips.forEach(chip => {
  chip.addEventListener('click', () => {
    studioLightingVibeChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    const lightingVibe = ((chip as HTMLElement).dataset.vibe || 'neon') as MoodConfig['lightingVibe'];
    studioPreset.setMood({ lightingVibe });
  });
});

// Step 4: Engine Sliders & Distortions (Retaining legacy slider IDs)
const studioChromaSlider = document.getElementById('studioChromaSlider') as HTMLInputElement | null;
const studioLiquidSlider = document.getElementById('studioLiquidSlider') as HTMLInputElement | null;
const studioTunnelSlider = document.getElementById('studioTunnelSlider') as HTMLInputElement | null;
const studioVolumeSlider = document.getElementById('studioVolumeSlider') as HTMLInputElement | null;
const studioForceSlider = document.getElementById('studioForceSlider') as HTMLInputElement | null;
const studioCrtSlider = document.getElementById('studioCrtSlider') as HTMLInputElement | null;
const studioChromaDistortSlider = document.getElementById('studioChromaDistortSlider') as HTMLInputElement | null;

studioChromaSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioChromaSlider.value);
  document.getElementById('studioChromaVal')!.textContent = val.toFixed(1);
  studioPreset.config.chromaIntensity = val;
  studioPreset.setGene('bloom', val);
});

studioLiquidSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioLiquidSlider.value);
  document.getElementById('studioLiquidVal')!.textContent = val.toFixed(1);
  studioPreset.config.liquidWarp = val;
  studioPreset.setGene('warp', val / 2.0);
});

studioTunnelSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioTunnelSlider.value);
  document.getElementById('studioTunnelVal')!.textContent = val.toFixed(1);
  studioPreset.config.tunnelDepth = val;
  studioPreset.setGene('depth', val / 2.0);
});

studioVolumeSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioVolumeSlider.value);
  document.getElementById('studioVolumeVal')!.textContent = val.toFixed(1);
  studioPreset.config.volumeDensity = val;
  studioPreset.setGene('filament', val);
});

studioForceSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioForceSlider.value);
  document.getElementById('studioForceVal')!.textContent = val.toFixed(1);
  studioPreset.config.theForceAttraction = val;
  studioPreset.setGene('spin', (val + 2.0) / 4.0);
});

studioCrtSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioCrtSlider.value);
  const label = document.getElementById('studioCrtVal');
  if (label) label.textContent = val.toFixed(2);
  renderEngine.updateConfig({ scanlines: val });
});

studioChromaDistortSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioChromaDistortSlider.value);
  const label = document.getElementById('studioChromaDistortVal');
  if (label) label.textContent = val.toFixed(2);
  renderEngine.updateConfig({ chromaticAberration: val });
});

// Recipe Management & Saved Gallery
const studioRecipeNameInput = document.getElementById('studioRecipeNameInput') as HTMLInputElement | null;
const studioRecipeNameError = document.getElementById('studioRecipeNameError') as HTMLElement | null;
const studioSaveRecipeBtn = document.getElementById('studioSaveRecipeBtn') as HTMLButtonElement | null;
const studioExportJsonBtn = document.getElementById('studioExportJsonBtn') as HTMLButtonElement | null;
const studioImportFileInput = document.getElementById('studioImportFileInput') as HTMLInputElement | null;
const studioSavedRecipesList = document.getElementById('studioSavedRecipesList') as HTMLElement | null;
const studioSavedCount = document.getElementById('studioSavedCount') as HTMLElement | null;

studioRecipeNameInput?.addEventListener('input', () => {
  const trimmed = studioRecipeNameInput.value.trim();
  const isValid = trimmed.length > 0 && trimmed.length <= 60;
  if (studioSaveRecipeBtn) studioSaveRecipeBtn.disabled = !isValid;
  if (studioRecipeNameError) {
    studioRecipeNameError.style.display = !isValid && studioRecipeNameInput.value.length > 0 ? 'inline' : 'none';
  }
});

studioSaveRecipeBtn?.addEventListener('click', () => {
  const name = studioRecipeNameInput?.value.trim();
  if (!name) return;
  try {
    studioPreset.saveRecipe(name);
    refreshSavedRecipesUI();
    if (studioRecipeNameInput) studioRecipeNameInput.value = '';
    if (studioSaveRecipeBtn) studioSaveRecipeBtn.disabled = true;
  } catch (err) {
    console.error('Error saving recipe:', err);
  }
});

studioExportJsonBtn?.addEventListener('click', () => {
  const jsonStr = studioPreset.exportRecipeJson();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const active = studioPreset.getActiveRecipe();
  a.download = `studio-recipe-${active.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'look'}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

studioImportFileInput?.addEventListener('change', () => {
  const file = studioImportFileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target?.result as string;
    if (content) {
      const imported = studioPreset.importRecipeJson(content);
      if (imported) {
        refreshSavedRecipesUI();
        syncStudioUIFromActiveRecipe();
      }
    }
    studioImportFileInput.value = '';
  };
  reader.readAsText(file);
});

function refreshSavedRecipesUI() {
  if (!studioSavedRecipesList) return;
  const list = studioPreset.getSavedRecipes();
  if (studioSavedCount) {
    studioSavedCount.textContent = `${list.length} saved`;
  }

  if (list.length === 0) {
    studioSavedRecipesList.innerHTML = `
      <div style="font-size:12px;color:var(--text-muted);text-align:center;padding:16px 0;">
        No saved recipes yet. Craft parameters and click Save Recipe.
      </div>`;
    return;
  }

  studioSavedRecipesList.innerHTML = '';
  list.forEach(rec => {
    const card = document.createElement('div');
    card.className = 'studio-recipe-card';
    const familyLabel = rec.kind === 'engine' ? (ENGINE_FAMILIES_META[rec.familyId]?.label || rec.familyId) : 'Recipe';
    card.innerHTML = `
      <div class="studio-recipe-header">
        <span class="studio-recipe-name" title="${rec.name}">${rec.name}</span>
        <span class="studio-recipe-badge">${familyLabel}</span>
      </div>
      <div class="studio-recipe-card-actions">
        <button type="button" class="studio-card-btn studio-card-btn--load" data-id="${rec.id}">Load</button>
        <button type="button" class="studio-card-btn studio-card-btn--delete" data-id="${rec.id}">Delete</button>
      </div>`;

    card.querySelector('.studio-card-btn--load')?.addEventListener('click', () => {
      studioPreset.loadRecipe(rec.id);
      syncStudioUIFromActiveRecipe();
    });

    card.querySelector('.studio-card-btn--delete')?.addEventListener('click', () => {
      studioPreset.deleteRecipe(rec.id);
      refreshSavedRecipesUI();
    });

    studioSavedRecipesList.appendChild(card);
  });
}

function syncStudioEngineSliders() {
  if (studioChromaSlider) {
    studioChromaSlider.value = studioPreset.config.chromaIntensity.toFixed(1);
    document.getElementById('studioChromaVal')!.textContent = studioPreset.config.chromaIntensity.toFixed(1);
  }
  if (studioLiquidSlider) {
    studioLiquidSlider.value = studioPreset.config.liquidWarp.toFixed(1);
    document.getElementById('studioLiquidVal')!.textContent = studioPreset.config.liquidWarp.toFixed(1);
  }
  if (studioTunnelSlider) {
    studioTunnelSlider.value = studioPreset.config.tunnelDepth.toFixed(1);
    document.getElementById('studioTunnelVal')!.textContent = studioPreset.config.tunnelDepth.toFixed(1);
  }
  if (studioVolumeSlider) {
    studioVolumeSlider.value = studioPreset.config.volumeDensity.toFixed(1);
    document.getElementById('studioVolumeVal')!.textContent = studioPreset.config.volumeDensity.toFixed(1);
  }
  if (studioForceSlider) {
    studioForceSlider.value = studioPreset.config.theForceAttraction.toFixed(1);
    document.getElementById('studioForceVal')!.textContent = studioPreset.config.theForceAttraction.toFixed(1);
  }
}

function syncStudioStageSliders(stage?: StageConfig) {
  if (!stage) return;
  if (studioStageScaleSlider) {
    studioStageScaleSlider.value = String(stage.scale);
    const l = document.getElementById('studioStageScaleVal');
    if (l) l.textContent = `${stage.scale}x`;
  }
  if (studioStageDustSlider) {
    studioStageDustSlider.value = String(stage.dustDensity);
    const l = document.getElementById('studioStageDustVal');
    if (l) l.textContent = String(stage.dustDensity);
  }
  if (studioStageLightSlider) {
    studioStageLightSlider.value = String(stage.lightIntensity);
    const l = document.getElementById('studioStageLightVal');
    if (l) l.textContent = String(stage.lightIntensity);
  }
}

function syncStudioHeroSliders(hero?: HeroConfig) {
  if (!hero) return;
  if (studioHeroDeformSlider) {
    studioHeroDeformSlider.value = String(hero.deformation);
    const l = document.getElementById('studioHeroDeformVal');
    if (l) l.textContent = String(hero.deformation);
  }
  if (studioHeroScaleSlider) {
    studioHeroScaleSlider.value = String(hero.scale);
    const l = document.getElementById('studioHeroScaleVal');
    if (l) l.textContent = `${hero.scale}x`;
  }
}

function syncStudioMoodSliders(mood?: MoodConfig) {
  if (!mood) return;
  if (studioThemeSelect && mood.themeId) {
    studioThemeSelect.value = mood.themeId;
  }
  if (studioMoodBloomSlider) {
    studioMoodBloomSlider.value = String(mood.bloomIntensity);
    const l = document.getElementById('studioMoodBloomVal');
    if (l) l.textContent = String(mood.bloomIntensity);
  }
  if (studioMoodSpeedSlider) {
    studioMoodSpeedSlider.value = String(mood.speedMultiplier);
    const l = document.getElementById('studioMoodSpeedVal');
    if (l) l.textContent = `${mood.speedMultiplier}x`;
  }
}

function syncStudioUIFromActiveRecipe() {
  const active = studioPreset.getActiveRecipe();
  if (active.kind !== 'engine') return;

  // Sync family card
  studioFamilyCards.forEach(c => {
    const isMatch = c.dataset.family === active.familyId;
    c.classList.toggle('active', isMatch);
    c.setAttribute('aria-checked', String(isMatch));
  });
  if (studioActiveFamilyLabel) {
    studioActiveFamilyLabel.textContent = ENGINE_FAMILIES_META[active.familyId]?.label || active.familyId;
  }

  syncStudioEngineSliders();
  syncStudioStageSliders(active.stage);
  syncStudioHeroSliders(active.hero);
  syncStudioMoodSliders(active.mood);
}

// Initial gallery populate
refreshSavedRecipesUI();
syncStudioUIFromActiveRecipe();

// Zen / Ambient Mode
ambientBtn.addEventListener('click', () => {
  document.body.classList.toggle(AMBIENT_MODE_CLASS);
});

fsBtn.addEventListener('click', toggleFullscreen);
dockFsBtn?.addEventListener('click', toggleFullscreen);

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    void document.documentElement.requestFullscreen();
  } else {
    void document.exitFullscreen();
  }
}

// Screenshot Capture
captureBtn.addEventListener('click', () => {
  const activeCanvas = milkdropEngine.isActive ? milkdropCanvas : canvas;
  const dataUrl = activeCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `visuval-${activePresetId}-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
});

// Export Video Modal & Aspect Ratio Framing
const FRAMING_GUIDE_HIDDEN = 'framing-guide hidden';
openExportBtn.addEventListener('click', () => exportModal.classList.add('open'));
cancelExportBtn.addEventListener('click', () => {
  exportModal.classList.remove('open');
  framingGuide.className = FRAMING_GUIDE_HIDDEN;
  exportManager.stopExport();
});

// Chip selection handlers
function setupChips(containerId: string, onChange?: (val: string) => void) {
  const chips = document.querySelectorAll(`#${containerId} .opt-chip`);
  chips.forEach(c => {
    c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const val = (c as HTMLElement).dataset.val || '';
      onChange?.(val);
    });
  });
}
setupChips('formatChips');
setupChips('resChips');
setupChips('fpsChips');
setupChips('durChips');
setupChips('batchDurChips');

// Batch Recording Mode UI
const batchModeToggle = document.getElementById('batchModeToggle') as HTMLInputElement;
const batchOptions = document.getElementById('batchOptions') as HTMLElement;
batchModeToggle?.addEventListener('change', () => {
  batchOptions.style.display = batchModeToggle.checked ? 'block' : 'none';
});

setupChips('aspectChips', (ratio) => {
  if (ratio === '9:16') {
    framingGuide.className = 'framing-guide ratio-9-16';
  } else if (ratio === '1:1') {
    framingGuide.className = 'framing-guide ratio-1-1';
  } else {
    framingGuide.className = FRAMING_GUIDE_HIDDEN;
  }
});

function getExportExtension(format: 'webm' | 'mp4' | 'gif'): string {
  if (format === 'gif') return 'gif';
  if (format === 'mp4') return 'mp4';
  return 'webm';
}

startExportAction.addEventListener('click', () => {
  const format = ((document.querySelector('#formatChips .opt-chip.active') as HTMLElement)?.dataset.val || 'webm') as 'webm' | 'mp4' | 'gif';
  const ratio = ((document.querySelector('#aspectChips .opt-chip.active') as HTMLElement)?.dataset.val || '16:9') as '16:9' | '9:16' | '1:1';
  const fps = Number.parseInt((document.querySelector('#fpsChips .opt-chip.active') as HTMLElement)?.dataset.val || '60', 10) as 30 | 60;
  const duration = Number.parseInt((document.querySelector('#durChips .opt-chip.active') as HTMLElement)?.dataset.val || '15', 10);

  const settings: ExportSettings = {
    format,
    aspectRatio: ratio,
    resolution: '1080p',
    fps,
    quality: 'ultra',
    durationMode: 'clip',
    clipStart: 0,
    clipEnd: duration,
    fastRender: false
  };

  exportProgressSection.style.display = 'block';
  startExportAction.textContent = 'Rendering...';

  if (!audioEngine.isPlaying && !audioEngine.isDemoPlaying) {
    audioEngine.playDemo();
    updatePlayButton();
  }

  if (batchModeToggle?.checked) {
    const secondsPerPreset = Number.parseInt((document.querySelector('#batchDurChips .opt-chip.active') as HTMLElement)?.dataset.val || '5', 10);
    const batchPresets = [
      getPreset('circular-spectrum'),
      getPreset('lava-energy'),
      getPreset('synthwave-terrain'),
      getPreset('tesseract-4d'),
      studioPreset
    ];

    exportManager.startBatchExport(
      settings,
      batchPresets,
      secondsPerPreset,
      (p, idx) => {
        document.getElementById('exportProgressText')!.textContent = `Batch [${idx + 1}/${batchPresets.length}]: ${p.name}`;
      },
      (percent, _timeLeft) => {
        exportProgressBar.style.width = `${percent}%`;
        exportPercent.textContent = `${percent}%`;
      },
      (_blob, downloadUrl) => {
        exportProgressSection.style.display = 'none';
        startExportAction.textContent = 'Start Export';
        exportModal.classList.remove('open');
        framingGuide.className = FRAMING_GUIDE_HIDDEN;

        const ext = getExportExtension(format);
        const link = document.createElement('a');
        link.download = `visuval-batch-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`;
        link.href = downloadUrl;
        link.click();
      }
    );
  } else {
    exportManager.startExport(
      settings,
      duration,
      (percent, timeLeft) => {
        exportProgressBar.style.width = `${percent}%`;
        exportPercent.textContent = `${percent}%`;
        document.getElementById('exportProgressText')!.textContent = `Rendering: ${timeLeft}s remaining...`;
      },
      (_blob, downloadUrl) => {
        exportProgressSection.style.display = 'none';
        startExportAction.textContent = 'Start Export';
        exportModal.classList.remove('open');
        framingGuide.className = FRAMING_GUIDE_HIDDEN;

        const ext = getExportExtension(format);
        const link = document.createElement('a');
        link.download = `visuval-${activePresetId}-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`;
        link.href = downloadUrl;
        link.click();
      }
    );
  }
});

// Handle window resizing
window.addEventListener('resize', () => {
  renderEngine.resize(window.innerWidth, window.innerHeight);
  milkdropEngine.resize(window.innerWidth, window.innerHeight);
});

// Initial catalog render
renderPresetsCatalog();

// Main Animation Render Loop (60 FPS)
function animate() {
  requestAnimationFrame(animate);

  const features = audioEngine.getFeatures();

  // If MilkDrop preset is active, render via Butterchurn WebGL
  if (milkdropEngine.isActive) {
    milkdropEngine.render();
  } else {
    // Render 3D Three.js preset
    renderEngine.render(features);
  }

  // BPM pulse indicator
  if (features.beat) {
    bpmIndicator.classList.add('beat');
  } else {
    bpmIndicator.classList.remove('beat');
  }
}

// Start loop
animate();
