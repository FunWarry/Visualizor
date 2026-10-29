import { AudioEngine, PlaylistTrack } from './audio/AudioEngine';
import { RenderEngine } from './engine/RenderEngine';
import { ExportManager } from './export/ExportManager';
import { THEMES, getTheme } from './themes/themes';
import { PRESETS, getPreset } from './presets';
import { StudioComposerPreset } from './studio/StudioComposer';
import { ExportSettings, VisualizerPreset } from './types';

// DOM Elements
const canvas = document.getElementById('webgl-canvas') as HTMLCanvasElement;
const framingGuide = document.getElementById('framingGuide') as HTMLElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const playIcon = document.getElementById('playIcon') as HTMLElement;
const prevTrackBtn = document.getElementById('prevTrackBtn') as HTMLButtonElement;
const nextTrackBtn = document.getElementById('nextTrackBtn') as HTMLButtonElement;
const demoBtn = document.getElementById('demoBtn') as HTMLButtonElement;
const audioFileInput = document.getElementById('audioFileInput') as HTMLInputElement;
const queueFileInput = document.getElementById('queueFileInput') as HTMLInputElement;
const micBtn = document.getElementById('micBtn') as HTMLButtonElement;
const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
const ambientBtn = document.getElementById('ambientBtn') as HTMLButtonElement;
const fsBtn = document.getElementById('fsBtn') as HTMLButtonElement;
const scrubber = document.getElementById('scrubber') as HTMLElement;
const scrubberFill = document.getElementById('scrubberFill') as HTMLElement;
const curTime = document.getElementById('curTime') as HTMLElement;
const totTime = document.getElementById('totTime') as HTMLElement;
const trackTitle = document.getElementById('trackTitle') as HTMLElement;
const trackArtist = document.getElementById('trackArtist') as HTMLElement;
const volumeSlider = document.getElementById('volumeSlider') as HTMLInputElement;
const vuMeter = document.getElementById('vuMeter') as HTMLElement;

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

// Queue elements
const queueList = document.getElementById('queueList') as HTMLElement;
const shuffleBtn = document.getElementById('shuffleBtn') as HTMLButtonElement;
const repeatBtn = document.getElementById('repeatBtn') as HTMLButtonElement;

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
const exportManager = new ExportManager(renderEngine, audioEngine);

// Set default preset
renderEngine.setPreset(PRESETS[0]);

// Build Presets List
const presetsList = document.getElementById('presetsList') as HTMLElement;
PRESETS.forEach(p => {
  const card = document.createElement('div');
  card.className = `preset-card ${p.id === renderEngine.activePreset?.id ? 'active' : ''}`;
  card.innerHTML = `
    <div class="preset-card-title">${p.name}</div>
    <div class="preset-card-cat">${p.category}</div>
    <div class="preset-card-desc">${p.description}</div>
  `;
  card.addEventListener('click', () => {
    renderEngine.setPreset(p);
    document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
  });
  presetsList.appendChild(card);
});

// Build Themes List
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
      audioEngine.playPlaylistIndex(i);
      updatePlayButton();
    });
    queueList.appendChild(item);
  });
}

audioEngine.onPlaylistChange = (pl, idx) => updateQueueUI(pl, idx);

// Drawer Navigation Tabs
railBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.getAttribute('data-tab');
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
  await audioEngine.togglePlay();
  updatePlayButton();
});

prevTrackBtn.addEventListener('click', () => {
  audioEngine.prevTrack();
  updatePlayButton();
});

nextTrackBtn.addEventListener('click', () => {
  audioEngine.nextTrack();
  updatePlayButton();
});

shuffleBtn.addEventListener('click', () => {
  audioEngine.isShuffle = !audioEngine.isShuffle;
  shuffleBtn.classList.toggle('active', audioEngine.isShuffle);
});

repeatBtn.addEventListener('click', () => {
  audioEngine.isRepeat = !audioEngine.isRepeat;
  repeatBtn.classList.toggle('active', audioEngine.isRepeat);
});

demoBtn.addEventListener('click', () => {
  if (audioEngine.isDemoPlaying) {
    audioEngine.stopDemo();
  } else {
    audioEngine.playDemo();
  }
  updatePlayButton();
});

audioFileInput.addEventListener('change', async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    await audioEngine.loadAudioFile(file);
    updatePlayButton();
  }
});

queueFileInput.addEventListener('change', (e) => {
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
  const active = await audioEngine.toggleMic();
  micBtn.classList.toggle('active', active);
  updatePlayButton();
});

function updatePlayButton() {
  trackTitle.textContent = audioEngine.currentTrackName;
  trackArtist.textContent = audioEngine.currentArtistName;
  if (audioEngine.isPlaying || audioEngine.isDemoPlaying) {
    playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
  } else {
    playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
  }
}

volumeSlider.addEventListener('input', () => {
  audioEngine.setVolume(parseFloat(volumeSlider.value));
});

// FX Controls
bloomSlider.addEventListener('input', () => {
  const val = parseFloat(bloomSlider.value);
  document.getElementById('bloomVal')!.textContent = val.toFixed(1);
  renderEngine.updateConfig({ bloomStrength: val });
});

persistSlider.addEventListener('input', () => {
  const val = parseFloat(persistSlider.value);
  document.getElementById('persistVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ persistence: val });
});

chromaSlider.addEventListener('input', () => {
  const val = parseFloat(chromaSlider.value);
  document.getElementById('chromaVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ chromaticAberration: val });
});

grainSlider.addEventListener('input', () => {
  const val = parseFloat(grainSlider.value);
  document.getElementById('grainVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ filmGrain: val });
});

vigSlider.addEventListener('input', () => {
  const val = parseFloat(vigSlider.value);
  document.getElementById('vigVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ vignette: val });
});

scanSlider.addEventListener('input', () => {
  const val = parseFloat(scanSlider.value);
  document.getElementById('scanVal')!.textContent = val.toFixed(1);
  renderEngine.updateConfig({ scanlines: val });
});

bendSlider.addEventListener('input', () => {
  const val = parseFloat(bendSlider.value);
  document.getElementById('bendVal')!.textContent = val.toFixed(2);
  renderEngine.updateConfig({ crtBend: val });
});

sensSlider.addEventListener('input', () => {
  const val = parseFloat(sensSlider.value);
  document.getElementById('sensVal')!.textContent = `${Math.round(val * 100)}%`;
  audioEngine.sensitivity = val;
});

// Studio Stage Composer Controls
const studioPreset = (PRESETS.find(p => p.id === 'studio-composer') as StudioComposerPreset) || new StudioComposerPreset();

const activateStudioBtn = document.getElementById('activateStudioBtn') as HTMLButtonElement;
activateStudioBtn?.addEventListener('click', () => {
  renderEngine.setPreset(studioPreset);
  document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
});

const studioChromaSlider = document.getElementById('studioChromaSlider') as HTMLInputElement;
const studioLiquidSlider = document.getElementById('studioLiquidSlider') as HTMLInputElement;
const studioTunnelSlider = document.getElementById('studioTunnelSlider') as HTMLInputElement;
const studioVolumeSlider = document.getElementById('studioVolumeSlider') as HTMLInputElement;
const studioForceSlider = document.getElementById('studioForceSlider') as HTMLInputElement;

studioChromaSlider?.addEventListener('input', () => {
  const val = parseFloat(studioChromaSlider.value);
  document.getElementById('studioChromaVal')!.textContent = val.toFixed(1);
  studioPreset.config.chromaIntensity = val;
});

studioLiquidSlider?.addEventListener('input', () => {
  const val = parseFloat(studioLiquidSlider.value);
  document.getElementById('studioLiquidVal')!.textContent = val.toFixed(1);
  studioPreset.config.liquidWarp = val;
});

studioTunnelSlider?.addEventListener('input', () => {
  const val = parseFloat(studioTunnelSlider.value);
  document.getElementById('studioTunnelVal')!.textContent = val.toFixed(1);
  studioPreset.config.tunnelDepth = val;
});

studioVolumeSlider?.addEventListener('input', () => {
  const val = parseFloat(studioVolumeSlider.value);
  document.getElementById('studioVolumeVal')!.textContent = val.toFixed(1);
  studioPreset.config.volumeDensity = val;
});

studioForceSlider?.addEventListener('input', () => {
  const val = parseFloat(studioForceSlider.value);
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

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Screenshot Capture
captureBtn.addEventListener('click', () => {
  const dataUrl = renderEngine.captureScreenshot();
  const link = document.createElement('a');
  link.download = `visualizor-${renderEngine.activePreset?.id}-${Date.now()}.png`;
  link.href = dataUrl;
  link.click();
});

// Export Video Modal & Aspect Ratio Framing
openExportBtn.addEventListener('click', () => exportModal.classList.add('open'));
cancelExportBtn.addEventListener('click', () => {
  exportModal.classList.remove('open');
  framingGuide.className = 'framing-guide hidden';
  exportManager.stopExport();
});

// Chip selection handlers
function setupChips(containerId: string, onChange?: (val: string) => void) {
  const chips = document.querySelectorAll(`#${containerId} .opt-chip`);
  chips.forEach(c => {
    c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      const val = c.getAttribute('data-val') || '';
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
    framingGuide.className = 'framing-guide hidden';
  }
});

startExportAction.addEventListener('click', async () => {
  const format = (document.querySelector('#formatChips .opt-chip.active')?.getAttribute('data-val') || 'webm') as 'webm' | 'mp4' | 'gif';
  const ratio = (document.querySelector('#aspectChips .opt-chip.active')?.getAttribute('data-val') || '16:9') as '16:9' | '9:16' | '1:1';
  const fps = parseInt(document.querySelector('#fpsChips .opt-chip.active')?.getAttribute('data-val') || '60') as 30 | 60;
  const duration = parseInt(document.querySelector('#durChips .opt-chip.active')?.getAttribute('data-val') || '15');

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
    const secondsPerPreset = parseInt(document.querySelector('#batchDurChips .opt-chip.active')?.getAttribute('data-val') || '5');
    const batchPresets = [
      getPreset('circular-spectrum'),
      getPreset('lava-energy'),
      getPreset('synthwave-terrain'),
      getPreset('tesseract-4d'),
      studioPreset
    ];

    await exportManager.startBatchExport(
      settings,
      batchPresets,
      secondsPerPreset,
      (p, idx) => {
        document.getElementById('exportProgressText')!.textContent = `Batch [${idx + 1}/${batchPresets.length}]: ${p.name}`;
      },
      (percent, timeLeft) => {
        exportProgressBar.style.width = `${percent}%`;
        exportPercent.textContent = `${percent}%`;
      },
      (_blob, downloadUrl) => {
        exportProgressSection.style.display = 'none';
        startExportAction.textContent = 'Start Export';
        exportModal.classList.remove('open');
        framingGuide.className = 'framing-guide hidden';

        const ext = format === 'gif' ? 'gif' : (format === 'mp4' ? 'mp4' : 'webm');
        const link = document.createElement('a');
        link.download = `visualizor-batch-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`;
        link.href = downloadUrl;
        link.click();
      }
    );
  } else {
    await exportManager.startExport(
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
        framingGuide.className = 'framing-guide hidden';

        const ext = format === 'gif' ? 'gif' : (format === 'mp4' ? 'mp4' : 'webm');
        const link = document.createElement('a');
        link.download = `visualizor-${renderEngine.activePreset?.id}-${ratio.replace(':', 'x')}-${Date.now()}.${ext}`;
        link.href = downloadUrl;
        link.click();
      }
    );
  }
});

// Main Animation Render Loop (60 FPS)
const vuBars = vuMeter.querySelectorAll('.vu-bar') as NodeListOf<HTMLElement>;

function animate() {
  requestAnimationFrame(animate);

  const features = audioEngine.getFeatures();
  renderEngine.render(features);

  // BPM pulse indicator
  if (features.beat) {
    bpmIndicator.classList.add('beat');
  } else {
    bpmIndicator.classList.remove('beat');
  }

  // Update VU meter visualization
  if (vuBars.length > 0) {
    vuBars[0].style.height = `${Math.min(100, Math.max(15, features.subBass * 100))}%`;
    vuBars[1].style.height = `${Math.min(100, Math.max(15, features.bass * 100))}%`;
    vuBars[2].style.height = `${Math.min(100, Math.max(15, features.mid * 100))}%`;
    vuBars[3].style.height = `${Math.min(100, Math.max(15, features.treble * 100))}%`;
    vuBars[4].style.height = `${Math.min(100, Math.max(15, features.rms * 100))}%`;
  }
}

// Start loop
animate();
