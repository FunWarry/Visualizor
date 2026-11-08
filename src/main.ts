import { AudioEngine, PlaylistTrack } from './audio/AudioEngine';
import { RenderEngine } from './engine/RenderEngine';
import { MilkdropEngine } from './engine/MilkdropEngine';
import { ExportManager } from './export/ExportManager';
import { THEMES, getTheme, SINGLE_COLOR_THEMES, EARTHY_THEMES, DUO_TONE_THEMES, GRADIENT_PRESETS } from './themes/themes';
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
import { VisualizerTheme, ExportSettings, VisualizerPreset } from './types';
import { renderTuningPanel, updateTuningButtonState as syncTuningButtonState } from './tuning/TuningPanel';
import {
  applySavedTuning,
  isPresetLocked,
  setPresetLocked,
  isAutoRandomizeEnabled,
  randomizePreset,
  hasSavedTuning,
  isFxParamLocked,
  setFxParamLocked,
  getFxParamValueBounds,
  setFxParamValueBounds,
  computeRandomFxValue
} from './tuning/PresetTuningManager';
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
const ambientBtn = document.getElementById('ambientBtn') as HTMLButtonElement | null;
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

// Sliders used by MIDI controller
const bloomSlider = document.getElementById('bloomSlider') as HTMLInputElement;
const persistSlider = document.getElementById('persistSlider') as HTMLInputElement;
const grainSlider = document.getElementById('grainSlider') as HTMLInputElement;
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
    milkdropEngine.resize(window.innerWidth, window.innerHeight);
    isMilkdropInitialized = true;
  }
}

// Set initial 3D preset
applySavedTuning(PRESETS[0]);
renderEngine.setPreset(PRESETS[0]);
updateTuningButtonState(PRESETS[0]);
renderTuningPanel(PRESETS[0]);

// --- Canonical 4-Column Colors Panel (Matching Image 3) ---

// Color HSL & Saturation Utilities
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / d + 2) / 6;
  } else {
    h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let norm = t;
  if (norm < 0) norm += 1;
  if (norm > 1) norm -= 1;
  if (norm < 1 / 6) return p + (q - p) * 6 * norm;
  if (norm < 1 / 2) return q;
  if (norm < 2 / 3) return p + (q - p) * (2 / 3 - norm) * 6;
  return p;
}

function hslToRgbHex(h: number, s: number, l: number): string {
  if (s === 0) {
    const val = Math.round(l * 255).toString(16).padStart(2, '0');
    return `#${val}${val}${val}`;
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hueToRgbChannel(p, q, h + 1 / 3) * 255);
  const g = Math.round(hueToRgbChannel(p, q, h) * 255);
  const b = Math.round(hueToRgbChannel(p, q, h - 1 / 3) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function adjustHexSaturation(hex: string, factor: number): string {
  if (factor === 1 || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const [h, s, l] = rgbToHsl(r, g, b);
  const newS = Math.max(0, Math.min(1, s * factor));
  return hslToRgbHex(h, newS, l);
}

function applySaturationToTheme(theme: VisualizerTheme, factor: number): VisualizerTheme {
  if (factor === 1) return theme;
  return {
    ...theme,
    primary: adjustHexSaturation(theme.primary, factor),
    secondary: theme.secondary ? adjustHexSaturation(theme.secondary, factor) : adjustHexSaturation(theme.primary, factor),
    accent: theme.accent ? adjustHexSaturation(theme.accent, factor) : adjustHexSaturation(theme.primary, factor),
    glow: theme.glow ? adjustHexSaturation(theme.glow, factor) : adjustHexSaturation(theme.primary, factor)
  };
}

let currentBaseTheme: VisualizerTheme = renderEngine.currentTheme;
let currentSaturationPercent = 50;

let customMode: 'solid' | 'gradient' = 'solid';
let customPrimaryHex = '#FF5C00';
let customSecondaryHex = '#00D2FF';
let customGradientStops: string[] = ['#FF5C00', '#00D2FF'];

const customSolidBtn = document.getElementById('customSolidBtn');
const customGradientBtn = document.getElementById('customGradientBtn');
const customColorBox = document.getElementById('customColorBox');
const customHexInput = document.getElementById('customHexInput') as HTMLInputElement | null;
const eyeDropperBtn = document.getElementById('eyeDropperBtn');
const hiddenNativeColorPicker = document.getElementById('hiddenNativeColorPicker') as HTMLInputElement | null;

const customColorRow2 = document.getElementById('customColorRow2');
const customColorBox2 = document.getElementById('customColorBox2');
const customHexInput2 = document.getElementById('customHexInput2') as HTMLInputElement | null;
const eyeDropperBtn2 = document.getElementById('eyeDropperBtn2');
const hiddenNativeColorPicker2 = document.getElementById('hiddenNativeColorPicker2') as HTMLInputElement | null;

const customGradientExtraStops = document.getElementById('customGradientExtraStops');
const gradientControlsRow = document.getElementById('gradientControlsRow');
const addGradientStopBtn = document.getElementById('addGradientStopBtn');
const gradientPreviewBar = document.getElementById('gradientPreviewBar');
const gradientPresetsSection = document.getElementById('gradientPresetsSection');
const gradientPresetsGrid = document.getElementById('gradientPresetsGrid');

const randomCustomColorBtn = document.getElementById('randomCustomColorBtn');
const themeSaturationSlider = document.getElementById('themeSaturationSlider') as HTMLInputElement | null;
const themeSaturationVal = document.getElementById('themeSaturationVal');

function updateGradientPreview(): void {
  if (gradientPreviewBar) {
    const stopsStr = customGradientStops.length > 1
      ? customGradientStops.join(', ')
      : `${customGradientStops[0]}, ${customGradientStops[0]}`;
    gradientPreviewBar.style.background = `linear-gradient(90deg, ${stopsStr})`;
  }
}

function updateColorCalloutAndInputs(theme: VisualizerTheme): void {
  const calloutName = document.getElementById('themeCalloutName');
  if (calloutName) calloutName.textContent = theme.name;

  if (theme.id !== 'custom') {
    customPrimaryHex = theme.primary;
    customSecondaryHex = theme.secondary || theme.primary;
    customGradientStops = [theme.primary, theme.secondary || theme.primary];
  }

  if (customColorBox) customColorBox.style.backgroundColor = customPrimaryHex;
  if (customHexInput) customHexInput.value = customPrimaryHex.toUpperCase();
  if (hiddenNativeColorPicker) hiddenNativeColorPicker.value = customPrimaryHex;

  if (customColorBox2) customColorBox2.style.backgroundColor = customSecondaryHex;
  if (customHexInput2) customHexInput2.value = customSecondaryHex.toUpperCase();
  if (hiddenNativeColorPicker2) hiddenNativeColorPicker2.value = customSecondaryHex;

  if (themeSaturationSlider) {
    themeSaturationSlider.style.background = `linear-gradient(90deg, #666666, ${theme.primary})`;
  }
  updateGradientPreview();
}

function applyAppTheme(theme: VisualizerTheme): void {
  currentBaseTheme = theme;
  const factor = currentSaturationPercent / 50.0;
  const saturatedTheme = applySaturationToTheme(theme, factor);
  renderEngine.setTheme(saturatedTheme);

  document.querySelectorAll('.theme-swatch-card').forEach(c => {
    c.classList.toggle('active', (c as HTMLElement).dataset.themeId === theme.id);
  });
  updateColorCalloutAndInputs(theme);
}

function applySaturationLevel(val: number): void {
  currentSaturationPercent = Math.max(0, Math.min(100, val));
  const factor = currentSaturationPercent / 50.0;
  if (themeSaturationVal) themeSaturationVal.textContent = `${currentSaturationPercent}%`;

  const saturatedTheme = applySaturationToTheme(currentBaseTheme, factor);
  renderEngine.setTheme(saturatedTheme);

  if (themeSaturationSlider) {
    themeSaturationSlider.style.background = `linear-gradient(90deg, #666666, ${currentBaseTheme.primary})`;
  }
}

function applyCustomTheme(): void {
  const isGrad = customMode === 'gradient';
  const customTheme: VisualizerTheme = {
    id: 'custom',
    name: isGrad ? `Custom Gradient (${customGradientStops.length} Colors)` : 'Custom Solid',
    primary: customPrimaryHex,
    secondary: isGrad ? customSecondaryHex : customPrimaryHex,
    accent: isGrad ? (customGradientStops[2] || customSecondaryHex) : customPrimaryHex,
    background: '#0a0a0c',
    glow: customPrimaryHex,
    gradientStops: isGrad ? [...customGradientStops] : undefined
  };
  applyAppTheme(customTheme);
  updateGradientPreview();
}

function createThemeSwatchCard(
  theme: VisualizerTheme,
  displayName: string,
  isDuo: boolean
): HTMLElement {
  const card = document.createElement('div');
  card.className = `theme-swatch-card ${theme.id === renderEngine.currentTheme.id ? 'active' : ''}`;
  card.dataset.themeId = theme.id;
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

// Swatch squares open native color picker on click
customColorBox?.addEventListener('click', () => {
  hiddenNativeColorPicker?.click();
});
customColorBox2?.addEventListener('click', () => {
  hiddenNativeColorPicker2?.click();
});

// Color inputs
hiddenNativeColorPicker?.addEventListener('input', () => {
  if (hiddenNativeColorPicker.value) {
    customPrimaryHex = hiddenNativeColorPicker.value;
    if (customColorBox) customColorBox.style.backgroundColor = customPrimaryHex;
    if (customHexInput) customHexInput.value = customPrimaryHex.toUpperCase();
    applyCustomTheme();
  }
});

hiddenNativeColorPicker2?.addEventListener('input', () => {
  if (hiddenNativeColorPicker2.value) {
    customSecondaryHex = hiddenNativeColorPicker2.value;
    if (customColorBox2) customColorBox2.style.backgroundColor = customSecondaryHex;
    if (customHexInput2) customHexInput2.value = customSecondaryHex.toUpperCase();
    applyCustomTheme();
  }
});

customHexInput?.addEventListener('change', () => {
  let val = customHexInput.value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    customPrimaryHex = val;
    if (customColorBox) customColorBox.style.backgroundColor = val;
    if (hiddenNativeColorPicker) hiddenNativeColorPicker.value = val;
    applyCustomTheme();
  }
});

customHexInput2?.addEventListener('change', () => {
  let val = customHexInput2.value.trim();
  if (!val.startsWith('#')) val = '#' + val;
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    customSecondaryHex = val;
    if (customColorBox2) customColorBox2.style.backgroundColor = val;
    if (hiddenNativeColorPicker2) hiddenNativeColorPicker2.value = val;
    applyCustomTheme();
  }
});

async function pickEyedropperColor(onPicked: (hex: string) => void, fallbackInput: HTMLInputElement | null) {
  const win = window as unknown as { EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> } };
  if (win.EyeDropper) {
    try {
      const dropper = new win.EyeDropper();
      const res = await dropper.open();
      if (res?.sRGBHex) onPicked(res.sRGBHex);
    } catch {
      // User cancelled
    }
  } else if (fallbackInput) {
    fallbackInput.click();
  }
}

eyeDropperBtn?.addEventListener('click', () => {
  void pickEyedropperColor((hex) => {
    customPrimaryHex = hex;
    customGradientStops[0] = hex;
    if (customColorBox) customColorBox.style.backgroundColor = hex;
    if (customHexInput) customHexInput.value = hex.toUpperCase();
    if (hiddenNativeColorPicker) hiddenNativeColorPicker.value = hex;
    applyCustomTheme();
  }, hiddenNativeColorPicker);
});

eyeDropperBtn2?.addEventListener('click', () => {
  void pickEyedropperColor((hex) => {
    customSecondaryHex = hex;
    if (customGradientStops.length > 1) {
      customGradientStops[1] = hex;
    } else {
      customGradientStops.push(hex);
    }
    if (customColorBox2) customColorBox2.style.backgroundColor = hex;
    if (customHexInput2) customHexInput2.value = hex.toUpperCase();
    if (hiddenNativeColorPicker2) hiddenNativeColorPicker2.value = hex;
    applyCustomTheme();
  }, hiddenNativeColorPicker2);
});

function renderExtraGradientStops(): void {
  if (!customGradientExtraStops) return;
  customGradientExtraStops.innerHTML = '';
  updateGradientPreview();

  for (let i = 2; i < customGradientStops.length; i++) {
    const stopIdx = i;
    const hex = customGradientStops[stopIdx];

    const row = document.createElement('div');
    row.className = 'custom-color-row';
    row.style.marginTop = '4px';

    const swatch = document.createElement('div');
    swatch.className = 'custom-swatch-preview';
    swatch.style.backgroundColor = hex;
    swatch.title = `Color Stop ${stopIdx + 1}`;

    const input = document.createElement('input');
    input.id = `customGradientStopInput_${stopIdx}`;
    input.type = 'text';
    input.className = 'custom-hex-input';
    input.value = hex.toUpperCase();
    input.maxLength = 7;
    input.setAttribute('aria-label', `Color Stop ${stopIdx + 1} Hex`);

    const inputLabel = document.createElement('label');
    inputLabel.htmlFor = input.id;
    inputLabel.className = 'u-sr-only';
    inputLabel.textContent = `Color Stop ${stopIdx + 1} Hex`;

    const dropperBtn = document.createElement('button');
    dropperBtn.type = 'button';
    dropperBtn.className = 'custom-picker-btn';
    dropperBtn.title = 'Pick with eyedropper';
    dropperBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2 2 0 0 1 0-2.8l.4-.4"/></svg>`;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-stop-btn';
    removeBtn.title = 'Remove color stop';
    removeBtn.textContent = '✕';

    const nativePicker = document.createElement('input');
    nativePicker.id = `customGradientNativePicker_${stopIdx}`;
    nativePicker.type = 'color';
    nativePicker.value = hex;
    nativePicker.setAttribute('aria-label', `Color Stop ${stopIdx + 1} Native Picker`);
    nativePicker.style.cssText = 'opacity:0;position:absolute;pointer-events:none;width:0;height:0;';

    const nativePickerLabel = document.createElement('label');
    nativePickerLabel.htmlFor = nativePicker.id;
    nativePickerLabel.className = 'u-sr-only';
    nativePickerLabel.textContent = `Color Stop ${stopIdx + 1} Native Picker`;

    swatch.addEventListener('click', () => nativePicker.click());
    nativePicker.addEventListener('input', () => {
      customGradientStops[stopIdx] = nativePicker.value;
      swatch.style.backgroundColor = nativePicker.value;
      input.value = nativePicker.value.toUpperCase();
      applyCustomTheme();
    });

    input.addEventListener('change', () => {
      let val = input.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
        customGradientStops[stopIdx] = val;
        swatch.style.backgroundColor = val;
        nativePicker.value = val;
        applyCustomTheme();
      }
    });

    dropperBtn.addEventListener('click', () => {
      void pickEyedropperColor((pickedHex) => {
        customGradientStops[stopIdx] = pickedHex;
        swatch.style.backgroundColor = pickedHex;
        input.value = pickedHex.toUpperCase();
        nativePicker.value = pickedHex;
        applyCustomTheme();
      }, nativePicker);
    });

    removeBtn.addEventListener('click', () => {
      customGradientStops.splice(stopIdx, 1);
      renderExtraGradientStops();
      applyCustomTheme();
    });

    row.appendChild(swatch);
    row.appendChild(inputLabel);
    row.appendChild(input);
    row.appendChild(dropperBtn);
    row.appendChild(removeBtn);
    row.appendChild(nativePickerLabel);
    row.appendChild(nativePicker);
    customGradientExtraStops.appendChild(row);
  }
}

function initGradientPresets(): void {
  if (!gradientPresetsGrid) return;
  gradientPresetsGrid.innerHTML = '';

  for (const preset of GRADIENT_PRESETS) {
    const chip = document.createElement('div');
    chip.className = 'gradient-preset-chip';
    chip.title = `${preset.name} (${preset.stops.join(', ')})`;

    const thumb = document.createElement('div');
    thumb.className = 'gradient-preset-thumb';
    thumb.style.background = `linear-gradient(135deg, ${preset.stops.join(', ')})`;

    const name = document.createElement('span');
    name.textContent = preset.name;

    chip.appendChild(thumb);
    chip.appendChild(name);

    chip.addEventListener('click', () => {
      customGradientStops = [...preset.stops];
      customPrimaryHex = customGradientStops[0];
      customSecondaryHex = customGradientStops[1] || customPrimaryHex;
      if (customColorBox) customColorBox.style.backgroundColor = customPrimaryHex;
      if (customHexInput) customHexInput.value = customPrimaryHex.toUpperCase();
      if (hiddenNativeColorPicker) hiddenNativeColorPicker.value = customPrimaryHex;
      if (customColorBox2) customColorBox2.style.backgroundColor = customSecondaryHex;
      if (customHexInput2) customHexInput2.value = customSecondaryHex.toUpperCase();
      if (hiddenNativeColorPicker2) hiddenNativeColorPicker2.value = customSecondaryHex;
      renderExtraGradientStops();
      applyCustomTheme();
    });

    gradientPresetsGrid.appendChild(chip);
  }
}

addGradientStopBtn?.addEventListener('click', () => {
  const newHex = getRandomHex();
  customGradientStops.push(newHex);
  renderExtraGradientStops();
  applyCustomTheme();
});

initGradientPresets();

function getRandomHex(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

randomCustomColorBtn?.addEventListener('click', () => {
  customPrimaryHex = getRandomHex();
  customGradientStops[0] = customPrimaryHex;
  if (customColorBox) customColorBox.style.backgroundColor = customPrimaryHex;
  if (customHexInput) customHexInput.value = customPrimaryHex.toUpperCase();
  if (hiddenNativeColorPicker) hiddenNativeColorPicker.value = customPrimaryHex;

  if (customMode === 'gradient') {
    customSecondaryHex = getRandomHex();
    customGradientStops[1] = customSecondaryHex;
    for (let i = 2; i < customGradientStops.length; i++) {
      customGradientStops[i] = getRandomHex();
    }
    if (customColorBox2) customColorBox2.style.backgroundColor = customSecondaryHex;
    if (customHexInput2) customHexInput2.value = customSecondaryHex.toUpperCase();
    if (hiddenNativeColorPicker2) hiddenNativeColorPicker2.value = customSecondaryHex;
    renderExtraGradientStops();
  }
  applyCustomTheme();
});

customSolidBtn?.addEventListener('click', () => {
  customMode = 'solid';
  customSolidBtn.classList.add('active');
  customGradientBtn?.classList.remove('active');
  if (customColorRow2) customColorRow2.style.display = 'none';
  if (customGradientExtraStops) customGradientExtraStops.style.display = 'none';
  if (gradientControlsRow) gradientControlsRow.style.display = 'none';
  if (gradientPresetsSection) gradientPresetsSection.style.display = 'none';
  applyCustomTheme();
});

customGradientBtn?.addEventListener('click', () => {
  customMode = 'gradient';
  customGradientBtn.classList.add('active');
  customSolidBtn?.classList.remove('active');
  if (customColorRow2) customColorRow2.style.display = 'flex';
  if (customGradientExtraStops) customGradientExtraStops.style.display = 'flex';
  if (gradientControlsRow) gradientControlsRow.style.display = 'flex';
  if (gradientPresetsSection) gradientPresetsSection.style.display = 'block';
  renderExtraGradientStops();
  applyCustomTheme();
});

themeSaturationSlider?.addEventListener('input', () => {
  const val = Number.parseInt(themeSaturationSlider.value, 10);
  applySaturationLevel(val);
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

function createPresetCard(p: VisualizerPreset): HTMLElement {
  const isFav = favoritePresets.has(p.id);
  const isLocked = isPresetLocked(p.id);
  const hasCustom = hasSavedTuning(p.id);
  const isActive = !milkdropEngine.isActive && activePresetId === p.id;

  const card = document.createElement('div');
  card.className = `preset-card-3 ${isActive ? 'active' : ''}`;
  card.dataset.presetId = p.id;
  card.dataset.category = p.category;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.innerHTML = `
    <span class="preset-active-indicator" title="Active"></span>
    <button class="preset-card-lock-btn ${isLocked ? 'active' : ''}" aria-label="Lock preset" title="${isLocked ? 'Locked (Click to unlock)' : 'Lock preset'}">${isLocked ? '🔒' : '🔓'}</button>
    <button class="preset-fav-btn ${isFav ? 'active' : ''}" aria-label="Favorite preset" title="Favorite">★</button>
    <div class="preset-thumb-visual">${getPresetThumbnailSvg(p)}</div>
    <div class="preset-card-info">
      <div class="preset-badge-name" title="${p.name}">${p.name} ${hasCustom ? '<span class="preset-custom-dot" title="Custom tuning saved">●</span>' : ''}</div>
      <span class="preset-cat-badge">${p.category}</span>
    </div>
  `;

  card.querySelector('.preset-card-lock-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    setPresetLocked(p.id, !isLocked);
    renderPresetsCatalog();
    if (activePresetId === p.id) {
      renderTuningPanel(p);
    }
  });

  card.querySelector('.preset-fav-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorite(p.id);
  });

  card.addEventListener('click', () => {
    select3DPreset(p);
  });

  return card;
}

function renderCategoryPresets(cat: typeof CATEGORIES[0], q: string): void {
  let catPresets = PRESETS.filter(p => p.category === cat.key);
  if (q) {
    catPresets = catPresets.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      Boolean(p.description?.toLowerCase().includes(q))
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
    grid.appendChild(createPresetCard(p));
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
  applySavedTuning(p);
  renderEngine.setPreset(p);
  updateTuningButtonState(p);
  renderTuningPanel(p);
  renderPresetsCatalog();
  syncCameraUI();
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


// ----------------------------------------------------
// Auto-Cycle Engine & Popover Management
// ----------------------------------------------------
interface AutoCycleConfig {
  enabled: boolean;
  sync: 'timer' | 'beats';
  timerInterval: '15s' | '30s' | '1m' | '2m';
  beatsInterval: 16 | 32 | 64 | 128;
  pool: 'all' | 'favorites';
  themes: 'keep' | 'shuffle';
  parameters: 'keep' | 'shuffle';
  effects: 'keep' | 'shuffle';
  camera: 'keep' | 'shuffle';
}

const DEFAULT_AUTOCYCLE_CONFIG: AutoCycleConfig = {
  enabled: false,
  sync: 'timer',
  timerInterval: '30s',
  beatsInterval: 32,
  pool: 'all',
  themes: 'shuffle',
  parameters: 'shuffle',
  effects: 'shuffle',
  camera: 'shuffle'
};

function loadAutoCycleConfig(): AutoCycleConfig {
  try {
    const raw = localStorage.getItem('visualizor_autocycle_config');
    if (raw) return { ...DEFAULT_AUTOCYCLE_CONFIG, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return { ...DEFAULT_AUTOCYCLE_CONFIG };
}

let autoCycleConfig = loadAutoCycleConfig();
let autoCycleBeatCounter = 0;

function syncAutoCyclePopoverUI(): void {
  const popover = document.getElementById('autoCyclePopover');
  if (!popover) return;

  const pillGroups = popover.querySelectorAll('.autocycle-pills');
  pillGroups.forEach(group => {
    const settingKey = (group as HTMLElement).dataset.cycleSetting as keyof AutoCycleConfig | undefined;
    if (!settingKey) return;
    const currentVal = String(autoCycleConfig[settingKey]);
    group.querySelectorAll('.autocycle-pill').forEach(pill => {
      const pillVal = (pill as HTMLElement).dataset.val;
      pill.classList.toggle('active', pillVal === currentVal);
    });
  });

  const timerRow = document.getElementById('autoCycleTimerRow');
  const beatsRow = document.getElementById('autoCycleBeatsRow');
  if (timerRow) timerRow.style.display = autoCycleConfig.sync === 'timer' ? 'flex' : 'none';
  if (beatsRow) beatsRow.style.display = autoCycleConfig.sync === 'beats' ? 'flex' : 'none';

  loopPresetBtn?.classList.toggle('cycle-active', autoCycleConfig.enabled);
  autoCycleBtn?.classList.toggle('cycle-active', autoCycleConfig.enabled);
}

function randomizeAllFxShaders(): void {
  FX_CONTROLS.filter(fx => fx.panel === 'fx').forEach(fx => {
    if (!isFxParamLocked(fx.id)) {
      const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
      const valEl = document.getElementById(fx.valId);
      if (slider) randomizeFxControl(fx, slider, valEl);
    }
  });
}

function randomizeAllCameraOptics(): void {
  const viewpoints = ['default', 'top', 'low', 'iso', 'side'];
  const randomVp = viewpoints[Math.floor(Math.random() * viewpoints.length)];
  renderEngine.setViewpoint(randomVp);
  const bounds = getFxParamValueBounds('camSpeed', 0, 1);
  const spd = bounds.minVal + Math.random() * (bounds.maxVal - bounds.minVal);
  const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  renderEngine.setAutoRotate(true, spd, dir);
  syncCameraUI();
}

function executeAutoCycleStep(): void {
  // If active 3D preset is locked, do not switch away to another preset!
  if (!milkdropEngine.isActive && activePresetId && isPresetLocked(activePresetId)) {
    if (autoCycleConfig.parameters === 'shuffle') {
      const activePreset = PRESETS.find(p => p.id === activePresetId);
      if (activePreset) {
        randomizePreset(activePreset);
        renderTuningPanel(activePreset);
      }
    }
    if (autoCycleConfig.themes === 'shuffle') {
      const allThemeKeys = Object.keys(THEMES);
      if (allThemeKeys.length > 0) {
        const nextThemeKey = allThemeKeys[Math.floor(Math.random() * allThemeKeys.length)];
        renderEngine.setTheme(getTheme(nextThemeKey));
      }
    }
    if (autoCycleConfig.effects === 'shuffle') {
      randomizeAllFxShaders();
    }
    if (autoCycleConfig.camera === 'shuffle') {
      randomizeAllCameraOptics();
    }
    return;
  }

  // Determine pool of candidate presets
  let pool = PRESETS.slice();
  if (autoCycleConfig.pool === 'favorites') {
    const favs = PRESETS.filter(p => favoritePresets.has(p.id));
    if (favs.length > 0) pool = favs;
  }

  const unlocked = pool.filter(p => !isPresetLocked(p.id));
  const usable = unlocked.length > 0 ? unlocked : pool;
  const different = usable.filter(p => p.id !== activePresetId);
  const candidates = different.length > 0 ? different : usable;
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  if (!chosen) return;

  // Shuffle Themes if enabled
  if (autoCycleConfig.themes === 'shuffle') {
    const allThemeKeys = Object.keys(THEMES);
    if (allThemeKeys.length > 0) {
      const nextThemeKey = allThemeKeys[Math.floor(Math.random() * allThemeKeys.length)];
      renderEngine.setTheme(getTheme(nextThemeKey));
    }
  }

  // Shuffle Parameters if enabled
  if (autoCycleConfig.parameters === 'shuffle') {
    randomizePreset(chosen);
  }

  // Shuffle Effects if enabled
  if (autoCycleConfig.effects === 'shuffle') {
    randomizeAllFxShaders();
  }

  // Shuffle Camera if enabled
  if (autoCycleConfig.camera === 'shuffle') {
    randomizeAllCameraOptics();
  }

  select3DPreset(chosen);
}

function restartAutoCycleTimer(): void {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }
  autoCycleBeatCounter = 0;
  if (!autoCycleConfig.enabled) {
    syncAutoCyclePopoverUI();
    return;
  }

  if (autoCycleConfig.sync === 'timer') {
    const intervalMap: Record<string, number> = {
      '15s': 15000,
      '30s': 30000,
      '1m': 60000,
      '2m': 120000
    };
    const ms = intervalMap[autoCycleConfig.timerInterval] ?? 30000;
    autoCycleTimer = setInterval(() => {
      executeAutoCycleStep();
    }, ms);
  }
  syncAutoCyclePopoverUI();
}

function stopAutoCycle(): void {
  if (autoCycleTimer) {
    clearInterval(autoCycleTimer);
    autoCycleTimer = null;
  }
  autoCycleBeatCounter = 0;
  autoCycleConfig.enabled = false;
  localStorage.setItem('visualizor_autocycle_config', JSON.stringify(autoCycleConfig));
  syncAutoCyclePopoverUI();
}

function toggleAutoCyclePopover(e?: MouseEvent): void {
  if (e) e.stopPropagation();
  const popover = document.getElementById('autoCyclePopover');
  if (!popover) return;
  const isOpen = popover.style.display === 'block';
  popover.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    syncAutoCyclePopoverUI();
  }
}

loopPresetBtn?.addEventListener('click', (e) => {
  toggleAutoCyclePopover(e);
});

autoCycleBtn?.addEventListener('click', (e) => {
  toggleAutoCyclePopover(e);
});

document.getElementById('closeAutoCyclePopoverBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const popover = document.getElementById('autoCyclePopover');
  if (popover) popover.style.display = 'none';
});

// Click outside popover to close
document.addEventListener('click', (e) => {
  const popover = document.getElementById('autoCyclePopover');
  if (!popover || popover.style.display !== 'block') return;
  const target = e.target as HTMLElement;
  if (!popover.contains(target) && target !== loopPresetBtn && target !== autoCycleBtn) {
    popover.style.display = 'none';
  }
});

// Popover pill clicks
const autoCyclePopover = document.getElementById('autoCyclePopover');
autoCyclePopover?.addEventListener('click', (e) => {
  const pill = (e.target as HTMLElement).closest('.autocycle-pill') as HTMLElement | null;
  if (!pill) return;
  const group = pill.closest('.autocycle-pills') as HTMLElement | null;
  if (!group) return;
  const settingKey = group.dataset.cycleSetting as keyof AutoCycleConfig | undefined;
  if (!settingKey) return;
  const val = pill.dataset.val;
  if (!val) return;

  if (settingKey === 'enabled') {
    autoCycleConfig.enabled = val === 'on';
  } else if (settingKey === 'beatsInterval') {
    autoCycleConfig.beatsInterval = Number.parseInt(val, 10) as 16 | 32 | 64 | 128;
  } else {
    (autoCycleConfig as unknown as Record<string, unknown>)[settingKey] = val;
  }

  localStorage.setItem('visualizor_autocycle_config', JSON.stringify(autoCycleConfig));
  syncAutoCyclePopoverUI();

  if (autoCycleConfig.enabled) {
    restartAutoCycleTimer();
  } else {
    stopAutoCycle();
  }
});

// Single Random Preset button
function pickRandomPreset(): void {
  executeAutoCycleStep();
}

shufflePresetBtn.addEventListener('click', pickRandomPreset);
railShuffleBtn?.addEventListener('click', pickRandomPreset);

// Initialize Auto-Cycle on boot if enabled
if (autoCycleConfig.enabled) {
  restartAutoCycleTimer();
} else {
  syncAutoCyclePopoverUI();
}

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
  railMoreWrapper?.classList.toggle('expanded', expanded);
  railMoreBtn?.setAttribute(ARIA_EXPANDED, expanded ? 'true' : 'false');
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
  window.open('https://github.com/FunWarry/Visualizor/issues', '_blank', 'noopener,noreferrer');
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
  syncCameraUI();
  viewpointBtns.forEach(b => b.classList.remove('active'));
  document.getElementById('viewDefaultBtn')?.classList.add('active');
});

function updateZoomReadout(val: number, allowBeyondLimits: boolean = false) {
  if (!allowBeyondLimits) {
    const clamped = Math.max(0, Math.min(1, val));
    if (zoomSlider) zoomSlider.value = clamped.toString();
    if (zoomValue) zoomValue.textContent = `${Math.round(clamped * 100)}%`;
    const camZoomValInput = document.getElementById('camZoomValInput') as HTMLInputElement | null;
    if (camZoomValInput && document.activeElement !== camZoomValInput) {
      camZoomValInput.value = clamped.toFixed(2);
    }
    renderEngine.cameraController.setZoom(clamped);
  } else {
    const pct = Math.round(val * 100);
    if (zoomSlider) zoomSlider.value = Math.max(0, Math.min(1, val)).toString();
    if (zoomValue) zoomValue.textContent = `${pct}%`;
    const camZoomValInput = document.getElementById('camZoomValInput') as HTMLInputElement | null;
    if (camZoomValInput && document.activeElement !== camZoomValInput) {
      camZoomValInput.value = val.toFixed(2);
    }
    renderEngine.cameraController.setZoom(val, true, true);
  }
}

zoomSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(zoomSlider.value);
  updateZoomReadout(val);
});

zoomIn?.addEventListener('click', () => {
  const current = renderEngine.cameraController.getZoom();
  const next = Math.round((current + 0.1) * 100) / 100;
  updateZoomReadout(next, true);
});

zoomOut?.addEventListener('click', () => {
  const current = renderEngine.cameraController.getZoom();
  const next = Math.max(0.01, Math.round((current - 0.1) * 100) / 100);
  updateZoomReadout(next, true);
});

viewpointBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    viewpointBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const viewId = (btn as HTMLElement).dataset.view ?? 'default';
    renderEngine.setAutoRotate(false);
    renderEngine.setViewpoint(viewId);
    if (autoRotateToggle) autoRotateToggle.checked = false;
    syncCameraUI();
  });
});

autoRotateToggle?.addEventListener('change', () => {
  renderEngine.setAutoRotate(autoRotateToggle.checked);
  syncCameraUI();
});

rotateSpeedSlider?.addEventListener('input', () => {
  const spd = Number.parseFloat(rotateSpeedSlider.value);
  renderEngine.setAutoRotate(renderEngine.config.autoRotate, spd);
  if (rotateSpeedValue) rotateSpeedValue.textContent = `${Math.round(spd * 100)}%`;
  const camSpeedValInput = document.getElementById('camSpeedValInput') as HTMLInputElement | null;
  if (camSpeedValInput && document.activeElement !== camSpeedValInput) {
    camSpeedValInput.value = spd.toFixed(2);
  }
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
});

export function syncCameraUI(): void {
  const ctrl = renderEngine.cameraController;
  if (!ctrl) return;

  if (autoRotateToggle) autoRotateToggle.checked = ctrl.autoRotate;
  if (rotateSpeedSlider) rotateSpeedSlider.value = ctrl.autoRotateSpeed.toString();
  const camSpeedValInput = document.getElementById('camSpeedValInput') as HTMLInputElement | null;
  if (camSpeedValInput && document.activeElement !== camSpeedValInput) {
    camSpeedValInput.value = ctrl.autoRotateSpeed.toFixed(2);
  }
  if (rotateSpeedValue) rotateSpeedValue.textContent = `${Math.round(ctrl.autoRotateSpeed * 100)}%`;

  // Zoom
  const zoom = ctrl.getZoom();
  if (zoomSlider) zoomSlider.value = Math.max(0, Math.min(1, zoom)).toString();
  if (zoomValue) zoomValue.textContent = `${Math.round(zoom * 100)}%`;
  const camZoomValInput = document.getElementById('camZoomValInput') as HTMLInputElement | null;
  if (camZoomValInput && document.activeElement !== camZoomValInput) {
    camZoomValInput.value = zoom.toFixed(2);
  }

  // Coordinates: Orbit, Tilt, Distance, Height
  const rotDeg = Math.round(ctrl.getRotAngle() * 180 / Math.PI);
  const tiltDeg = Math.round(ctrl.getTiltAngle() * 180 / Math.PI);
  const dist = ctrl.getDistance();
  const height = ctrl.getTargetHeight();

  const orbitSlider = document.getElementById('camOrbitSlider') as HTMLInputElement | null;
  const orbitInput = document.getElementById('camOrbitValInput') as HTMLInputElement | null;
  const orbitVal = document.getElementById('camOrbitVal') as HTMLElement | null;
  if (orbitSlider) orbitSlider.value = rotDeg.toString();
  if (orbitInput && document.activeElement !== orbitInput) orbitInput.value = rotDeg.toString();
  if (orbitVal) orbitVal.textContent = `${rotDeg}°`;

  const tiltSlider = document.getElementById('camTiltSlider') as HTMLInputElement | null;
  const tiltInput = document.getElementById('camTiltValInput') as HTMLInputElement | null;
  const tiltVal = document.getElementById('camTiltVal') as HTMLElement | null;
  if (tiltSlider) tiltSlider.value = tiltDeg.toString();
  if (tiltInput && document.activeElement !== tiltInput) tiltInput.value = tiltDeg.toString();
  if (tiltVal) tiltVal.textContent = `${tiltDeg}°`;

  const distSlider = document.getElementById('camDistSlider') as HTMLInputElement | null;
  const distInput = document.getElementById('camDistValInput') as HTMLInputElement | null;
  const distVal = document.getElementById('camDistVal') as HTMLElement | null;
  if (distSlider) distSlider.value = dist.toFixed(1);
  if (distInput && document.activeElement !== distInput) distInput.value = dist.toFixed(1);
  if (distVal) distVal.textContent = `${dist.toFixed(1)}m`;

  const heightSlider = document.getElementById('camHeightSlider') as HTMLInputElement | null;
  const heightInput = document.getElementById('camHeightValInput') as HTMLInputElement | null;
  const heightVal = document.getElementById('camHeightVal') as HTMLElement | null;
  if (heightSlider) heightSlider.value = height.toFixed(1);
  if (heightInput && document.activeElement !== heightInput) heightInput.value = height.toFixed(1);
  if (heightVal) heightVal.textContent = `${height.toFixed(1)}m`;

  // Spin Direction
  if (ctrl.autoRotateDirection === 1) {
    camDirCwBtn?.classList.add('active');
    camDirCcwBtn?.classList.remove('active');
  } else {
    camDirCcwBtn?.classList.add('active');
    camDirCwBtn?.classList.remove('active');
  }

  // Camera Shake
  if (camShakeToggle) camShakeToggle.checked = ctrl.cameraShakeEnabled;
  if (camShakeSlider) camShakeSlider.value = ctrl.cameraShakeIntensity.toString();
  const camShakeIntensityValInput = document.getElementById('camShakeIntensityValInput') as HTMLInputElement | null;
  if (camShakeIntensityValInput && document.activeElement !== camShakeIntensityValInput) {
    camShakeIntensityValInput.value = ctrl.cameraShakeIntensity.toFixed(2);
  }
  if (camShakeVal) camShakeVal.textContent = `${Math.round(ctrl.cameraShakeIntensity * 100)}%`;
}

// Camera Save & Reset buttons
const saveCamBtn = document.getElementById('saveCamBtn');
saveCamBtn?.addEventListener('click', () => {
  if (!activePresetId) return;
  renderEngine.saveCameraForPreset(activePresetId);
  saveCamBtn.innerHTML = '💾 Saved ✓';
  saveCamBtn.style.color = '#22c55e';
  setTimeout(() => {
    saveCamBtn.innerHTML = '💾 Save';
    saveCamBtn.style.color = '#22c55e';
  }, 1800);
});

const resetCamBtn = document.getElementById('resetCamBtn');
resetCamBtn?.addEventListener('click', () => {
  if (!activePresetId) return;
  renderEngine.resetCameraForPreset(activePresetId);
  syncCameraUI();
});

const randAutoRotateBtn = document.getElementById('randAutoRotateBtn');
randAutoRotateBtn?.addEventListener('click', () => {
  const newEnabled = Math.random() > 0.25;
  const bounds = getFxParamValueBounds('camSpeed', 0, 1);
  const speed = bounds.minVal + Math.random() * (bounds.maxVal - bounds.minVal);
  const dir: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  renderEngine.setAutoRotate(newEnabled, speed, dir);
  syncCameraUI();
});

window.addEventListener('visualizor:save_camera', ((e: CustomEvent<{ presetId: string }>) => {
  if (e.detail?.presetId) {
    renderEngine.saveCameraForPreset(e.detail.presetId);
  }
}) as EventListener);

window.addEventListener('visualizor:reset_camera', ((e: CustomEvent<{ presetId: string }>) => {
  if (e.detail?.presetId) {
    renderEngine.resetCameraForPreset(e.detail.presetId);
    syncCameraUI();
  }
}) as EventListener);

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

// Image Overlays & Layers Drawer Panel Binding
function setupOverlayPanel(engine: RenderEngine): void {
  const canvasBgSegments = document.getElementById('canvasBgSegments');
  if (canvasBgSegments) {
    const chips = canvasBgSegments.querySelectorAll('.opt-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const mode = (chip.getAttribute('data-value') || 'dark') as 'dark' | 'white' | 'custom';
        engine.setCanvasBackground(mode);
      });
    });
  }

  const overlayFileInput = document.getElementById('overlayFileInput') as HTMLInputElement | null;
  if (overlayFileInput) {
    overlayFileInput.addEventListener('change', () => {
      const file = overlayFileInput.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (!src) return;
        const img = new Image();
        img.onload = () => {
          engine.setImageOverlay(img);
          const label = overlayFileInput.parentElement;
          if (label) {
            label.childNodes.forEach(node => {
              if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes('Add Image')) {
                node.textContent = `✓ ${file.name.slice(0, 18)} (Click to change)`;
              }
            });
          }
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    });
  }

  const overlayOpacitySlider = document.getElementById('overlayOpacitySlider') as HTMLInputElement | null;
  const overlayOpacityVal = document.getElementById('overlayOpacityVal');
  if (overlayOpacitySlider) {
    overlayOpacitySlider.addEventListener('input', () => {
      const val = Number.parseFloat(overlayOpacitySlider.value);
      if (overlayOpacityVal) overlayOpacityVal.textContent = `${Math.round(val * 100)}%`;
      engine.setImageOverlayOpacity(val);
    });
  }

  const overlayScaleSlider = document.getElementById('overlayScaleSlider') as HTMLInputElement | null;
  const overlayScaleVal = document.getElementById('overlayScaleVal');
  if (overlayScaleSlider) {
    overlayScaleSlider.addEventListener('input', () => {
      const val = Number.parseFloat(overlayScaleSlider.value);
      if (overlayScaleVal) overlayScaleVal.textContent = `${val.toFixed(1)}x`;
      engine.setImageOverlayScale(val);
    });
  }
}

setupOverlayPanel(renderEngine);

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
const screenPassthroughContainer = document.getElementById('screenPassthroughContainer');
const screenPassthroughBtn = document.getElementById('screenPassthroughBtn') as HTMLButtonElement | null;
const screenPassthroughDesc = document.getElementById('screenPassthroughDesc');

function updateScreenPassthroughUI() {
  if (!screenPassthroughBtn) return;
  const isEnabled = audioEngine.isScreenAudioPassthrough;
  screenPassthroughBtn.setAttribute('aria-pressed', String(isEnabled));
  screenPassthroughBtn.textContent = isEnabled ? 'Active (Risk)' : 'Muted';
  screenPassthroughBtn.style.color = isEnabled ? 'var(--accent-start)' : 'var(--text-muted)';
  if (screenPassthroughDesc) {
    screenPassthroughDesc.textContent = isEnabled
      ? 'Audio sent to speakers (may cause feedback loop)'
      : 'Muted to prevent infinite feedback loops';
  }
  if (audioSourceStatus) {
    audioSourceStatus.textContent = isEnabled
      ? '● Capturing live screen/app audio (Audio Return: Active)'
      : '● Capturing live screen/app audio (Audio Return: Muted - loop-safe)';
  }
}

screenPassthroughBtn?.addEventListener('click', () => {
  audioEngine.setScreenAudioPassthrough(!audioEngine.isScreenAudioPassthrough);
  updateScreenPassthroughUI();
});

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
  if (screenPassthroughContainer) {
    screenPassthroughContainer.style.display = active ? 'flex' : 'none';
  }
  updateScreenPassthroughUI();
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

// FX Controls & Shaders Setup
interface FxControlDef {
  id: string;
  sliderId: string;
  valId: string;
  min: number;
  max: number;
  step: number;
  defaultVal: number;
  format: (v: number) => string;
  apply: (v: number) => void;
  panel: 'fx' | 'camera';
  chipGroupId?: string;
}

const FX_CONTROLS: readonly FxControlDef[] = [
  {
    id: 'bloom',
    sliderId: 'bloomSlider',
    valId: 'bloomVal',
    min: 0,
    max: 3,
    step: 0.1,
    defaultVal: 1.2,
    panel: 'fx',
    chipGroupId: 'bloomSegments',
    format: (v) => v.toFixed(1),
    apply: (v) => renderEngine.updateConfig({ bloomStrength: v })
  },
  {
    id: 'bright',
    sliderId: 'brightSlider',
    valId: 'brightVal',
    min: -0.4,
    max: 0.4,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
    apply: (v) => renderEngine.updateConfig({ brightness: v })
  },
  {
    id: 'particleDensity',
    sliderId: 'particleDensitySlider',
    valId: 'particleDensityVal',
    min: 0,
    max: 2,
    step: 0.1,
    defaultVal: 1.0,
    panel: 'fx',
    chipGroupId: 'particleDensitySegments',
    format: (v) => {
      if (v === 0) return 'Off';
      if (v <= 0.5) return 'Low';
      if (v <= 1.0) return 'Normal';
      if (v <= 1.5) return 'Dense';
      return 'Max';
    },
    apply: (v) => renderEngine.updateConfig({ particleDensity: v })
  },
  {
    id: 'particleSpread',
    sliderId: 'particleSpreadSlider',
    valId: 'particleSpreadVal',
    min: 0,
    max: 2,
    step: 0.05,
    defaultVal: 1.0,
    panel: 'fx',
    format: (v) => `${Math.round(v * 50)}%`,
    apply: (v) => renderEngine.updateConfig({ particleSpread: v })
  },
  {
    id: 'persist',
    sliderId: 'persistSlider',
    valId: 'persistVal',
    min: 0,
    max: 0.95,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    chipGroupId: 'persistSegments',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ persistence: v })
  },
  {
    id: 'scan',
    sliderId: 'scanSlider',
    valId: 'scanVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(1),
    apply: (v) => renderEngine.updateConfig({ scanlines: v })
  },
  {
    id: 'phosphor',
    sliderId: 'phosphorSlider',
    valId: 'phosphorVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ phosphor: v })
  },
  {
    id: 'bend',
    sliderId: 'bendSlider',
    valId: 'bendVal',
    min: 0,
    max: 0.3,
    step: 0.02,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ crtBend: v })
  },
  {
    id: 'grain',
    sliderId: 'grainSlider',
    valId: 'grainVal',
    min: 0,
    max: 0.5,
    step: 0.02,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ filmGrain: v })
  },
  {
    id: 'vig',
    sliderId: 'vigSlider',
    valId: 'vigVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ vignette: v })
  },
  {
    id: 'chroma',
    sliderId: 'chromaSlider',
    valId: 'chromaVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ chromaticAberration: v })
  },
  {
    id: 'drip',
    sliderId: 'dripSlider',
    valId: 'dripVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ drip: v })
  },
  {
    id: 'edge',
    sliderId: 'edgeSlider',
    valId: 'edgeVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.0,
    panel: 'fx',
    format: (v) => v.toFixed(2),
    apply: (v) => renderEngine.updateConfig({ edgeDetect: v })
  },
  {
    id: 'kaleido',
    sliderId: 'kaleidoSlider',
    valId: 'kaleidoVal',
    min: 0,
    max: 12,
    step: 3,
    defaultVal: 0,
    panel: 'fx',
    chipGroupId: 'kaleidoSegments',
    format: (v) => (v === 0 ? 'Off' : `${v}x`),
    apply: (v) => renderEngine.updateConfig({ kaleidoscope: v })
  },
  {
    id: 'mirror',
    sliderId: 'mirrorSlider',
    valId: 'mirrorVal',
    min: 0,
    max: 3,
    step: 1,
    defaultVal: 0,
    panel: 'fx',
    chipGroupId: 'mirrorSegments',
    format: (v) => ['Off', 'Side', 'Flip', 'Quad'][Math.round(v)] || 'Off',
    apply: (v) => renderEngine.updateConfig({ mirror: v })
  },
  {
    id: 'pixel',
    sliderId: 'pixelSlider',
    valId: 'pixelVal',
    min: 0,
    max: 64,
    step: 16,
    defaultVal: 0,
    panel: 'fx',
    chipGroupId: 'pixelSegments',
    format: (v) => (v === 0 ? 'Off' : `${v}px`),
    apply: (v) => renderEngine.updateConfig({ pixelize: v })
  },
  {
    id: 'camZoom',
    sliderId: 'zoomSlider',
    valId: 'zoomValue',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.5,
    panel: 'camera',
    format: (v) => `${Math.round(v * 100)}%`,
    apply: (v) => {
      renderEngine.cameraController.setZoom(v, true, v > 1 || v < 0);
    }
  },
  {
    id: 'camOrbit',
    sliderId: 'camOrbitSlider',
    valId: 'camOrbitVal',
    min: -180,
    max: 180,
    step: 1,
    defaultVal: 0,
    panel: 'camera',
    format: (v) => `${Math.round(v)}°`,
    apply: (v) => {
      renderEngine.cameraController.setOrbit(v * Math.PI / 180, true);
    }
  },
  {
    id: 'camTilt',
    sliderId: 'camTiltSlider',
    valId: 'camTiltVal',
    min: -85,
    max: 85,
    step: 1,
    defaultVal: 0,
    panel: 'camera',
    format: (v) => `${Math.round(v)}°`,
    apply: (v) => {
      renderEngine.cameraController.setTilt(v * Math.PI / 180, true);
    }
  },
  {
    id: 'camDist',
    sliderId: 'camDistSlider',
    valId: 'camDistVal',
    min: 1,
    max: 50,
    step: 0.5,
    defaultVal: 12,
    panel: 'camera',
    format: (v) => `${v.toFixed(1)}m`,
    apply: (v) => {
      renderEngine.cameraController.setDistance(v, true);
    }
  },
  {
    id: 'camHeight',
    sliderId: 'camHeightSlider',
    valId: 'camHeightVal',
    min: -20,
    max: 20,
    step: 0.5,
    defaultVal: 0,
    panel: 'camera',
    format: (v) => `${v.toFixed(1)}m`,
    apply: (v) => {
      renderEngine.cameraController.setTargetHeight(v, true);
    }
  },
  {
    id: 'camSpeed',
    sliderId: 'rotateSpeedSlider',
    valId: 'rotateSpeedValue',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.5,
    panel: 'camera',
    format: (v) => `${Math.round(v * 100)}%`,
    apply: (v) => {
      renderEngine.cameraController.autoRotateSpeed = v;
      renderEngine.config.autoRotateSpeed = v;
    }
  },
  {
    id: 'camShake',
    sliderId: 'camShakeIntensitySlider',
    valId: 'camShakeIntensityVal',
    min: 0,
    max: 1,
    step: 0.05,
    defaultVal: 0.6,
    panel: 'camera',
    chipGroupId: 'cameraShakeSegments',
    format: (v) => `${Math.round(v * 100)}%`,
    apply: (v) => {
      renderEngine.cameraController.setCameraShakeIntensity(v);
      if (camShakeToggle) camShakeToggle.checked = v > 0;
    }
  }
];

function updateChipsForFx(fx: FxControlDef, val: number): void {
  if (!fx.chipGroupId) return;
  const chips = document.querySelectorAll(`#${fx.chipGroupId} .opt-chip`);
  chips.forEach(chip => {
    const chipVal = Number.parseFloat((chip as HTMLElement).dataset.value || '0');
    const tolerance = fx.step * 0.6 || 0.05;
    const matches = Math.abs(chipVal - val) <= tolerance;
    chip.classList.toggle('active', matches);
  });
}

function syncFilterCardState(fxId: string, isActive: boolean): void {
  const card = document.querySelector(`.filter-card[data-fx-target="${fxId}"]`);
  card?.classList.toggle('active', isActive);
}

function applyFxValue(
  fx: FxControlDef,
  slider: HTMLInputElement,
  valEl: HTMLElement | null,
  val: number
): void {
  slider.value = val.toString();
  if (valEl) valEl.textContent = fx.format(val);
  const mainInput = document.querySelector(`.fx-main-val-input[data-fx-target="${fx.id}"]`) as HTMLInputElement | null;
  if (mainInput && document.activeElement !== mainInput) {
    mainInput.value = val.toString();
  }
  fx.apply(val);
  updateChipsForFx(fx, val);
  syncFilterCardState(fx.id, val > 0);
}

function randomizeFxControl(
  fx: FxControlDef,
  slider: HTMLInputElement,
  valEl: HTMLElement | null
): void {
  if (isFxParamLocked(fx.id)) return;
  const bounds = getFxParamValueBounds(fx.id, fx.min, fx.max);
  const clamped = computeRandomFxValue(fx.min, fx.max, fx.step, bounds.minVal, bounds.maxVal);
  applyFxValue(fx, slider, valEl, clamped);
}

function bindFxSliderMargins(fx: FxControlDef, row: Element | null): void {
  const gearBtn = row?.querySelector(`.fx-gear-btn[data-fx="${fx.id}"]`) as HTMLElement | null;
  const drawer = document.getElementById(`${fx.id}_margin_drawer`);
  if (!drawer) return;

  const readout = drawer.querySelector('.fx-margin-readout');
  const minSlider = drawer.querySelector('.fx-bound-min') as HTMLInputElement | null;
  const maxSlider = drawer.querySelector('.fx-bound-max') as HTMLInputElement | null;
  const minInput = drawer.querySelector('.fx-bound-input-min') as HTMLInputElement | null;
  const maxInput = drawer.querySelector('.fx-bound-input-max') as HTMLInputElement | null;

  const currentBounds = getFxParamValueBounds(fx.id, fx.min, fx.max);
  let minVal = currentBounds.minVal;
  let maxVal = currentBounds.maxVal;

  const updateUiBounds = () => {
    if (minSlider) {
      minSlider.min = fx.min.toString();
      minSlider.max = fx.max.toString();
      minSlider.step = fx.step.toString();
      minSlider.value = minVal.toString();
    }
    if (maxSlider) {
      maxSlider.min = fx.min.toString();
      maxSlider.max = fx.max.toString();
      maxSlider.step = fx.step.toString();
      maxSlider.value = maxVal.toString();
    }
    if (minInput && document.activeElement !== minInput) {
      minInput.min = fx.min.toString();
      minInput.max = fx.max.toString();
      minInput.step = fx.step.toString();
      minInput.value = minVal.toString();
    }
    if (maxInput && document.activeElement !== maxInput) {
      maxInput.min = fx.min.toString();
      maxInput.max = fx.max.toString();
      maxInput.step = fx.step.toString();
      maxInput.value = maxVal.toString();
    }
    if (readout) {
      readout.textContent = `Margin: ${minVal} — ${maxVal}`;
    }
  };

  updateUiBounds();

  const syncAndSave = (newMin: number, newMax: number) => {
    minVal = Math.min(newMin, newMax);
    maxVal = Math.max(newMin, newMax);
    updateUiBounds();
    setFxParamValueBounds(fx.id, minVal, maxVal);
  };

  minSlider?.addEventListener('input', () => {
    if (!minSlider || !maxSlider) return;
    syncAndSave(Number(minSlider.value), Number(maxSlider.value));
  });
  maxSlider?.addEventListener('input', () => {
    if (!minSlider || !maxSlider) return;
    syncAndSave(Number(minSlider.value), Number(maxSlider.value));
  });

  const onInputChange = () => {
    let vMin = Number(minInput?.value ?? fx.min);
    let vMax = Number(maxInput?.value ?? fx.max);
    if (Number.isNaN(vMin)) vMin = fx.min;
    if (Number.isNaN(vMax)) vMax = fx.max;
    vMin = Math.max(fx.min, Math.min(fx.max, vMin));
    vMax = Math.max(fx.min, Math.min(fx.max, vMax));
    syncAndSave(vMin, vMax);
  };
  minInput?.addEventListener('input', onInputChange);
  maxInput?.addEventListener('input', onInputChange);

  gearBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isOpen = drawer.classList.toggle('open');
    gearBtn.classList.toggle('active', isOpen);
  });
}

function bindFxMainInput(
  fx: FxControlDef,
  slider: HTMLInputElement,
  valEl: HTMLElement | null,
  row: Element | null
): void {
  const mainInput = (row ?? document).querySelector(`.fx-main-val-input[data-fx-target="${fx.id}"]`) as HTMLInputElement | null;
  if (!mainInput) return;
  mainInput.min = fx.min.toString();
  mainInput.max = fx.max.toString();
  mainInput.step = fx.step.toString();
  mainInput.value = slider.value;
  mainInput.addEventListener('input', () => {
    let numVal = Number.parseFloat(mainInput.value);
    if (Number.isNaN(numVal)) return;
    if (fx.id === 'camZoom') {
      if (numVal > 10) numVal = numVal / 100;
      updateZoomReadout(numVal, true);
      return;
    }
    numVal = Math.max(fx.min, Math.min(fx.max, numVal));
    applyFxValue(fx, slider, valEl, numVal);
  });
}

function bindFxSlider(fx: FxControlDef): void {
  const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
  const valEl = document.getElementById(fx.valId);
  if (!slider) return;

  const row = document.querySelector(`.fx-control-row[data-fx-id="${fx.id}"]`);

  if (fx.chipGroupId) {
    const chips = document.querySelectorAll(`#${fx.chipGroupId} .opt-chip`);
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const chipVal = Number.parseFloat((chip as HTMLElement).dataset.value || '0');
        applyFxValue(fx, slider, valEl, chipVal);
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      });
    });
  }

  slider.addEventListener('input', () => {
    const numVal = Number.parseFloat(slider.value);
    if (valEl) valEl.textContent = fx.format(numVal);
    const mainInput = (row ?? document).querySelector(`.fx-main-val-input[data-fx-target="${fx.id}"]`) as HTMLInputElement | null;
    if (mainInput && document.activeElement !== mainInput) {
      mainInput.value = numVal.toString();
    }
    fx.apply(numVal);
    updateChipsForFx(fx, numVal);
    syncFilterCardState(fx.id, numVal > 0);
  });

  const lockBtn = row?.querySelector(`.fx-lock-btn[data-fx="${fx.id}"]`) as HTMLElement | null;
  const randBtn = row?.querySelector(`.fx-rand-btn[data-fx="${fx.id}"]`) as HTMLElement | null;

  if (lockBtn) {
    const isLocked = isFxParamLocked(fx.id);
    lockBtn.textContent = isLocked ? '🔒' : '🔓';
    lockBtn.classList.toggle('locked', isLocked);
    lockBtn.addEventListener('click', () => {
      const nowLocked = !isFxParamLocked(fx.id);
      setFxParamLocked(fx.id, nowLocked);
      lockBtn.textContent = nowLocked ? '🔒' : '🔓';
      lockBtn.classList.toggle('locked', nowLocked);
    });
  }

  if (randBtn) {
    randBtn.addEventListener('click', () => {
      randomizeFxControl(fx, slider, valEl);
    });
  }

  bindFxMainInput(fx, slider, valEl, row);
  bindFxSliderMargins(fx, row);
}

function setupFilterCards(): void {
  const cards = document.querySelectorAll('.filter-card[data-fx-target]');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      const targetId = (card as HTMLElement).dataset.fxTarget;
      const fx = FX_CONTROLS.find(c => c.id === targetId);
      if (!fx) return;
      const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
      const valEl = document.getElementById(fx.valId);
      if (!slider) return;
      const current = Number.parseFloat(slider.value);
      let nextVal = 0;
      if (current <= 0) {
        nextVal = fx.defaultVal > 0 ? fx.defaultVal : fx.min + (fx.max - fx.min) * 0.4;
      }
      applyFxValue(fx, slider, valEl, nextVal);
    });
  });
}

function setupPerformanceChips(): void {
  const qualityChips = document.querySelectorAll('#qualitySegments .opt-chip');
  qualityChips.forEach(chip => {
    chip.addEventListener('click', () => {
      qualityChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
  const aaChips = document.querySelectorAll('#aaSegments .opt-chip');
  aaChips.forEach(chip => {
    chip.addEventListener('click', () => {
      aaChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

function setupFxControls(): void {
  for (const fx of FX_CONTROLS) {
    bindFxSlider(fx);
  }
  setupFilterCards();
  setupPerformanceChips();

  const randAllFxBtn = document.getElementById('randomizeAllFxBtn');
  randAllFxBtn?.addEventListener('click', () => {
    for (const fx of FX_CONTROLS.filter(c => c.panel === 'fx')) {
      const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
      const valEl = document.getElementById(fx.valId);
      if (slider) randomizeFxControl(fx, slider, valEl);
    }
  });

  const resetAllFxBtn = document.getElementById('resetFxBtn');
  resetAllFxBtn?.addEventListener('click', () => {
    for (const fx of FX_CONTROLS.filter(c => c.panel === 'fx')) {
      const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
      const valEl = document.getElementById(fx.valId);
      if (slider) applyFxValue(fx, slider, valEl, fx.defaultVal);
    }
  });

  const randAllCamBtn = document.getElementById('randomizeAllCamBtn');
  randAllCamBtn?.addEventListener('click', () => {
    for (const fx of FX_CONTROLS.filter(c => c.panel === 'camera')) {
      const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
      const valEl = document.getElementById(fx.valId);
      if (slider) randomizeFxControl(fx, slider, valEl);
    }
  });

  const resetAllCamBtn = document.getElementById('resetCamBtn');
  resetAllCamBtn?.addEventListener('click', () => {
    for (const fx of FX_CONTROLS.filter(c => c.panel === 'camera')) {
      const slider = document.getElementById(fx.sliderId) as HTMLInputElement | null;
      const valEl = document.getElementById(fx.valId);
      if (slider) applyFxValue(fx, slider, valEl, fx.defaultVal);
    }
  });
}

setupFxControls();

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
    const percent = Math.round(value * 100);
    const satSlider = document.getElementById('themeSaturationSlider') as HTMLInputElement | null;
    if (satSlider) satSlider.value = String(percent);
    applySaturationLevel(percent);
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

studioImportFileInput?.addEventListener('change', async () => {
  const file = studioImportFileInput.files?.[0];
  if (!file) return;
  try {
    const content = await file.text();
    if (content) {
      const imported = studioPreset.importRecipeJson(content);
      if (imported) {
        refreshSavedRecipesUI();
        syncStudioUIFromActiveRecipe();
      }
    }
  } finally {
    studioImportFileInput.value = '';
  }
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
ambientBtn?.addEventListener('click', () => {
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
  link.download = `visualizor-${activePresetId}-${Date.now()}.png`;
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
        link.download = `visualizor-batch-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`;
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
        link.download = `visualizor-${activePresetId}-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`;
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

  // Auto-Cycle beat sync check
  if (autoCycleConfig.enabled && autoCycleConfig.sync === 'beats' && features.beat) {
    autoCycleBeatCounter++;
    if (autoCycleBeatCounter >= autoCycleConfig.beatsInterval) {
      autoCycleBeatCounter = 0;
      executeAutoCycleStep();
    }
  }
}

// Start loop
animate();
