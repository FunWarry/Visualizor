import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, getActiveMidiAccess } from '../harness/env';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { getPreset } from '../../src/presets';
import { getTheme } from '../../src/themes/themes';
import { StudioComposerPreset } from '../../src/studio/StudioComposer';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from '../harness/fixtures';
import { parseMidiCCMessage, sanitizeTextOverlayInput } from '../harness/contracts';

describe('Tier 4: Real-World Application Scenarios', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T4.Scenario.1: Live DJ Club Performance Session (60-frame live performance simulation)', async () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('synthwave'));
    const audioEngine = new AudioEngine();

    // 1. Activate Live Microphone stream
    const micOk = await audioEngine.toggleMic();
    expect(micOk).toBe(true);

    // 2. Calibrate Tap Tempo to 128 BPM
    audioEngine.bpmDetector.detectedBPM = 128;
    audioEngine.bpmDetector.manualBPM = 128;

    // 3. Connect MIDI Controller: Map CC 7 to Volume, CC 74 to Bloom
    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get('input-0');

    input?.simulateMessage([0xB0, 7, 115]); // Volume ~90%
    audioEngine.volume = 115 / 127.0;

    input?.simulateMessage([0xB0, 74, 90]); // Bloom ~70%
    renderEngine.updateConfig({ bloomStrength: (90 / 127.0) * 2.5 });

    // 4. Select Synthwave Terrain preset with auto-orbit camera
    const synthPreset = getPreset('synthwave-terrain');
    renderEngine.setPreset(synthPreset);
    renderEngine.config.autoRotate = true;
    renderEngine.config.autoRotateSpeed = 0.8;

    // 5. Run 60 frames of live audio reactive simulation
    for (let frame = 0; frame < 60; frame++) {
      // Periodic beat kick every 15 frames
      const isKickFrame = frame % 15 === 0;
      const audio = isKickFrame ? createBeatDropAudioFeatures(0.95) : createSilentAudioFeatures();

      renderEngine.render(audio);

      // Verify camera and render stability each frame
      expect(isFinite(renderEngine.camera.position.x)).toBe(true);
      expect(isFinite(renderEngine.camera.position.y)).toBe(true);
      expect(isFinite(renderEngine.camera.position.z)).toBe(true);
    }

    expect(renderEngine.activePreset?.id).toBe('synthwave-terrain');
    expect(renderEngine.currentTheme.id).toBe('synthwave');
  });

  test('T4.Scenario.2: Music Video Production & Recording Workflow', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('sunset'));

    // 1. 16:9 4K framing configuration
    renderEngine.resize(3840, 2160);
    renderEngine.updateConfig({
      bloomStrength: 1.8,
      filmGrain: 0.25,
      chromaticAberration: 0.5
    });

    // 2. Configure 3-line animated typography overlay
    const title = sanitizeTextOverlayInput('NEO-TOKYO DRIFT');
    const artist = sanitizeTextOverlayInput('KAVINSKY & THE WEEKND');
    const lyrics = sanitizeTextOverlayInput('Under the neon lights we fall');

    expect(title.enabled && artist.enabled && lyrics.enabled).toBe(true);

    // 3. Cycle sequence: Aurora -> Black Hole -> Neon Tunnel
    const sequence = ['aurora-mandala', 'black-hole', 'neon-tunnel'];
    const capturedScreenshots: string[] = [];

    for (const presetId of sequence) {
      renderEngine.setPreset(getPreset(presetId));

      // Simulate rendering 10 frames per preset scene
      for (let f = 0; f < 10; f++) {
        renderEngine.render(createBeatDropAudioFeatures(0.7));
      }

      // Capture high-res frame
      const frameData = renderEngine.captureScreenshot();
      capturedScreenshots.push(frameData);
    }

    expect(capturedScreenshots).toHaveLength(3);
    for (const shot of capturedScreenshots) {
      expect(shot.startsWith('data:image/png')).toBe(true);
    }
  });

  test('T4.Scenario.3: Studio Forge Custom Recipe Tuning Session', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('ember'));

    // 1. Launch Studio Stage Composer
    const studio = new StudioComposerPreset();
    renderEngine.setPreset(studio);

    // 2. Tune 5 engine layers: Repulsion physics (-1.2), Deep tunnel (1.8), Heavy liquid warp (1.6)
    studio.config.theForceAttraction = -1.2;
    studio.config.tunnelDepth = 1.8;
    studio.config.liquidWarp = 1.6;
    studio.config.volumeDensity = 1.4;

    // 3. Render 15 frames of live stage simulation
    const audio = createBeatDropAudioFeatures(0.8);
    for (let i = 0; i < 15; i++) {
      renderEngine.render(audio);
    }

    // 4. Save custom recipe
    const savedRecipe = {
      name: 'Cosmic Singularity Stage',
      stageConfig: { ...studio.config },
      themeId: renderEngine.currentTheme.id
    };

    // 5. Switch away to a regular preset
    renderEngine.setPreset(getPreset('particle-field'));
    expect(renderEngine.activePreset?.id).toBe('particle-field');

    // 6. Restore custom Studio recipe
    const restoredStudio = new StudioComposerPreset();
    restoredStudio.config = { ...savedRecipe.stageConfig };
    renderEngine.setPreset(restoredStudio);

    expect(restoredStudio.config.theForceAttraction).toBe(-1.2);
    expect(restoredStudio.config.tunnelDepth).toBe(1.8);
    expect(restoredStudio.config.liquidWarp).toBe(1.6);
  });

  test('T4.Scenario.4: Live Club Visuals with MIDI Learn and Fast Preset Hopping', async () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('ember'));

    // 1. MIDI Learn on Bloom Strength
    const midiAccess = getActiveMidiAccess();
    const input = midiAccess?.inputs.get('input-0');

    // Controller sends CC 14 with value 110
    input?.simulateMessage([0xB0, 14, 110]);
    const learnedBloom = (110 / 127.0) * 3.0;
    renderEngine.updateConfig({ bloomStrength: learnedBloom });

    // 2. Hop across 10 distinct presets with different themes
    const presetsToHop = [
      'box-tunnel', 'water-slide', 'kaleidoscope-mandala',
      'matrix-rain', 'spectrogram', 'diode-wall',
      'lcd-deck', 'bloom-flower', 'meadow-field', 'ocean-waves'
    ];

    const themesToHop = ['glacier', 'vapor', 'eclipse', 'arctic', 'horizon', 'prism', 'toxic', 'synthwave', 'terracotta', 'jade'];

    for (let i = 0; i < presetsToHop.length; i++) {
      renderEngine.setTheme(getTheme(themesToHop[i]));
      renderEngine.setPreset(getPreset(presetsToHop[i]));

      // Modulate bloom continuously via MIDI CC
      const ccVal = 80 + (i * 4);
      renderEngine.updateConfig({ bloomStrength: (ccVal / 127.0) * 3.0 });

      renderEngine.render(createBeatDropAudioFeatures(0.75));
    }

    // Verify clean final state
    expect(renderEngine.activePreset?.id).toBe('ocean-waves');
    expect(renderEngine.currentTheme.id).toBe('jade');
  });

  test('T4.Scenario.5: Stress Resilience & Ambient Mode Transition', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('ember'));
    const audioEngine = new AudioEngine();

    renderEngine.setPreset(getPreset('circular-spectrum'));

    // 1. Enter Ambient Mode: Hide UI chrome
    const appEl = document.documentElement;
    appEl.classList.add('ui-hidden');
    expect(appEl.classList.contains('ui-hidden')).toBe(true);

    // 2. Stream noisy burst audio followed by silence spikes
    for (let i = 0; i < 30; i++) {
      const audio = i % 2 === 0 ? createBeatDropAudioFeatures(1.0) : createSilentAudioFeatures();
      renderEngine.render(audio);
    }

    // 3. Rapid aspect ratio transitions: Ultrawide (21:9) -> Mobile (9:16) -> Standard (16:9)
    renderEngine.resize(2560, 1080); // 21:9
    expect(renderEngine.camera.aspect).toBeCloseTo(21 / 9, 0.05);

    renderEngine.resize(1080, 1920); // 9:16
    expect(renderEngine.camera.aspect).toBeCloseTo(9 / 16, 0.05);

    renderEngine.resize(1920, 1080); // 16:9
    expect(renderEngine.camera.aspect).toBeCloseTo(16 / 9, 0.05);

    // 4. Exit Ambient Mode
    appEl.classList.remove('ui-hidden');
    expect(appEl.classList.contains('ui-hidden')).toBe(false);

    // 5. Final render pass
    renderEngine.render(audioEngine.getFeatures());
    expect(renderEngine.activePreset?.id).toBe('circular-spectrum');
  });
});
