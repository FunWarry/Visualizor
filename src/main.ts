import { AudioEngine, PlaylistTrack } from './audio/AudioEngine';
import { RenderEngine } from './engine/RenderEngine';
import { MilkdropEngine } from './engine/MilkdropEngine';
import { ExportManager } from './export/ExportManager';
import { THEMES, getTheme } from './themes/themes';
import { PRESETS, getPreset } from './presets';
import { StudioComposerPreset } from './studio/StudioComposer';
import { ExportSettings, VisualizerPreset } from './types';

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

// Drawers
const presetsPanel = document.getElementById('presetsPanel') as HTMLElement;
const themesPanel = document.getElementById('themesPanel') as HTMLElement;
const queuePanel = document.getElementById('queuePanel') as HTMLElement;
const studioPanel = document.getElementById('studioPanel') as HTMLElement;
const fxPanel = document.getElementById('fxPanel') as HTMLElement;
const audioPanel = document.getElementById('audioPanel') as HTMLElement;
const allPanels = [presetsPanel, themesPanel, queuePanel, studioPanel, fxPanel, audioPanel];

// Rail tabs
const railBtns = document.querySelectorAll('.rail-btn');
const railShuffleBtn = document.getElementById('railShuffleBtn');

// Queue elements
const queueList = document.getElementById('queueList') as HTMLElement;
const shuffleBtn = document.getElementById('shuffleBtn') as HTMLButtonElement;
const repeatBtn = document.getElementById('repeatBtn') as HTMLButtonElement;

// Presets Search & Filters
const presetSearchInput = document.getElementById('presetSearchInput') as HTMLInputElement;
const filterAllBtn = document.getElementById('filterAllBtn') as HTMLButtonElement;
const filterFavBtn = document.getElementById('filterFavBtn') as HTMLButtonElement;
const filterMilkdropBtn = document.getElementById('filterMilkdropBtn') as HTMLButtonElement;
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
let currentFilter: 'all' | 'fav' | 'milkdrop' = 'all';
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

// Build Color Themes List
const themesList = document.getElementById('themesList') as HTMLElement;
THEMES.forEach(t => {
  const card = document.createElement('div');
  card.className = `theme-card ${t.id === renderEngine.currentTheme.id ? 'active' : ''}`;
  card.innerHTML = `
    <div class="theme-swatch-circle" style="background: linear-gradient(135deg, ${t.primary}, ${t.accent});"></div>
    <span style="font-size:12px;font-weight:600;">${t.name}</span>
  `;
  card.addEventListener('click', () => {
    renderEngine.setTheme(t);
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
  themesList.appendChild(card);
});

// Category definition matching user screenshot
const CATEGORIES: { name: string; key: VisualizerPreset['category'] }[] = [
  { name: 'Structures', key: 'Structures' },
  { name: 'Abstract & Space', key: 'Abstract & Space' },
  { name: 'Particles & Light', key: 'Particles & Light' },
  { name: 'Fluids & Heat', key: 'Fluids & Heat' },
  { name: 'Tunnels', key: 'Tunnels' },
  { name: 'Retro & Digital', key: 'Retro & Digital' },
  { name: 'Organic & Nature', key: 'Organic & Nature' }
];

// Presets Catalog Renderer (3-Column Square Cards matching screenshot)
function renderPresetsCatalog() {
  initMilkdropIfNeeded();
  presetsCatalogView.innerHTML = '';

  const q = searchQuery.toLowerCase();

  // 1. Render Three.js 3D Presets by Category
  if (currentFilter !== 'milkdrop') {
    CATEGORIES.forEach(cat => {
      let catPresets = PRESETS.filter(p => p.category === cat.key);
      if (q) {
        catPresets = catPresets.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
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

      catPresets.forEach(p => {
        const isFav = favoritePresets.has(p.id);
        const isActive = !milkdropEngine.isActive && activePresetId === p.id;

        const card = document.createElement('div');
        card.className = `preset-card-3 ${isActive ? 'active' : ''}`;
        card.innerHTML = `
          <button class="preset-fav-btn ${isFav ? 'active' : ''}" title="Favorite">★</button>
          <div class="preset-thumb-visual">💎</div>
          <div class="preset-badge-name" title="${p.name}">${p.name}</div>
        `;

        card.querySelector('.preset-fav-btn')?.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFavorite(p.id);
        });

        card.addEventListener('click', () => {
          select3DPreset(p);
        });

        grid.appendChild(card);
      });

      presetsCatalogView.appendChild(grid);
    });
  }

  // 2. Render ProjectM & MilkDrop Presets Section
  if (currentFilter === 'all' || currentFilter === 'milkdrop' || currentFilter === 'fav') {
    let milkdropNames = milkdropEngine.presetNames;
    if (q) {
      milkdropNames = milkdropNames.filter(n => n.toLowerCase().includes(q));
    }
    if (currentFilter === 'fav') {
      milkdropNames = milkdropNames.filter(n => favoritePresets.has(`milkdrop_${n}`));
    }

    if (milkdropNames.length > 0) {
      const displayList = milkdropNames.slice(0, 30); // Show top 30 Milkdrop presets
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'category-header';
      sectionHeader.innerHTML = `<span>ProjectM & MilkDrop</span><span>${milkdropNames.length}</span>`;
      presetsCatalogView.appendChild(sectionHeader);

      const grid = document.createElement('div');
      grid.className = 'cards-grid-3';

      displayList.forEach(name => {
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
      });

      presetsCatalogView.appendChild(grid);
    }
  }
}

function select3DPreset(p: VisualizerPreset) {
  milkdropEngine.setActive(false);
  canvas.style.display = 'block';
  activePresetId = p.id;
  renderEngine.setPreset(p);
  renderPresetsCatalog();
}

function selectMilkdropPreset(name: string) {
  initMilkdropIfNeeded();
  canvas.style.display = 'none';
  milkdropEngine.setActive(true);
  milkdropEngine.loadPreset(name, 2.0);
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

function setFilter(f: 'all' | 'fav' | 'milkdrop') {
  currentFilter = f;
  filterAllBtn.classList.toggle('active', f === 'all');
  filterFavBtn.classList.toggle('active', f === 'fav');
  filterMilkdropBtn.classList.toggle('active', f === 'milkdrop');
  renderPresetsCatalog();
}

filterAllBtn.addEventListener('click', () => setFilter('all'));
filterFavBtn.addEventListener('click', () => setFilter('fav'));
filterMilkdropBtn.addEventListener('click', () => setFilter('milkdrop'));

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

// Topbar Mode Switcher: Visualizer vs Studio
modeVisualizerBtn.addEventListener('click', () => {
  modeVisualizerBtn.classList.add('active');
  modeStudioBtn.classList.remove('active');
  allPanels.forEach(p => p.classList.remove('open'));
  presetsPanel.classList.add('open');
});

modeStudioBtn.addEventListener('click', () => {
  modeStudioBtn.classList.add('active');
  modeVisualizerBtn.classList.remove('active');
  allPanels.forEach(p => p.classList.remove('open'));
  studioPanel.classList.add('open');
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

// Drawer Navigation Tabs
railBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = (btn as HTMLElement).dataset.tab;
    if (!tab) return;
    railBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    allPanels.forEach(p => p.classList.remove('open'));
    if (tab === 'presets') presetsPanel.classList.add('open');
    if (tab === 'themes') themesPanel.classList.add('open');
    if (tab === 'queue') queuePanel.classList.add('open');
    if (tab === 'studio') studioPanel.classList.add('open');
    if (tab === 'fx') fxPanel.classList.add('open');
    if (tab === 'audio') audioPanel.classList.add('open');
  });
});

document.getElementById('closeDrawerBtn')?.addEventListener('click', () => presetsPanel.classList.remove('open'));
document.querySelector('.closeThemeBtn')?.addEventListener('click', () => themesPanel.classList.remove('open'));
document.querySelector('.closeQueueBtn')?.addEventListener('click', () => queuePanel.classList.remove('open'));
document.querySelector('.closeStudioBtn')?.addEventListener('click', () => studioPanel.classList.remove('open'));
document.querySelector('.closeFxBtn')?.addEventListener('click', () => fxPanel.classList.remove('open'));
document.querySelector('.closeAudioBtn')?.addEventListener('click', () => audioPanel.classList.remove('open'));
dockQueueBtn?.addEventListener('click', () => queuePanel.classList.toggle('open'));

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
  updatePlayButton();
});

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

// Studio Stage Composer Controls
const studioPreset = (PRESETS.find(p => p.id === 'studio-composer') as StudioComposerPreset) || new StudioComposerPreset();

const activateStudioBtn = document.getElementById('activateStudioBtn') as HTMLButtonElement;
activateStudioBtn?.addEventListener('click', () => {
  select3DPreset(studioPreset);
});

const studioChromaSlider = document.getElementById('studioChromaSlider') as HTMLInputElement;
const studioLiquidSlider = document.getElementById('studioLiquidSlider') as HTMLInputElement;
const studioTunnelSlider = document.getElementById('studioTunnelSlider') as HTMLInputElement;
const studioVolumeSlider = document.getElementById('studioVolumeSlider') as HTMLInputElement;
const studioForceSlider = document.getElementById('studioForceSlider') as HTMLInputElement;

studioChromaSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioChromaSlider.value);
  document.getElementById('studioChromaVal')!.textContent = val.toFixed(1);
  studioPreset.config.chromaIntensity = val;
});

studioLiquidSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioLiquidSlider.value);
  document.getElementById('studioLiquidVal')!.textContent = val.toFixed(1);
  studioPreset.config.liquidWarp = val;
});

studioTunnelSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioTunnelSlider.value);
  document.getElementById('studioTunnelVal')!.textContent = val.toFixed(1);
  studioPreset.config.tunnelDepth = val;
});

studioVolumeSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioVolumeSlider.value);
  document.getElementById('studioVolumeVal')!.textContent = val.toFixed(1);
  studioPreset.config.volumeDensity = val;
});

studioForceSlider?.addEventListener('input', () => {
  const val = Number.parseFloat(studioForceSlider.value);
  document.getElementById('studioForceVal')!.textContent = val.toFixed(1);
  studioPreset.config.theForceAttraction = val;
});

// Zen / Ambient Mode
ambientBtn.addEventListener('click', () => {
  document.body.classList.toggle('ambient-mode');
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'h' || e.key === 'H') {
    document.body.classList.toggle('ambient-mode');
  } else if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  }
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
