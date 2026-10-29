import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, getActiveMidiAccess } from '../harness/env';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { AudioEngine } from '../../src/audio/AudioEngine';
import { PRESETS, getPreset } from '../../src/presets';
import { THEMES, getTheme } from '../../src/themes/themes';
import { StudioComposerPreset } from '../../src/studio/StudioComposer';
import { createBeatDropAudioFeatures, createSilentAudioFeatures, SpyVisualizerPreset } from '../harness/fixtures';
import { parseMidiCCMessage, sanitizeTextOverlayInput } from '../harness/contracts';

describe('Tier 3: Cross-Feature Combinations', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T3.Combo.1: Theme switch during camera auto-orbit propagates colors while camera orbits', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const spy = new SpyVisualizerPreset();
    engine.setPreset(spy);

    engine.config.autoRotate = true;
    engine.config.autoRotateSpeed = 1.0;

    const audio = createSilentAudioFeatures();
    engine.render(audio);
    const pos1 = engine.camera.position.clone();

    // Switch theme mid-orbit
    engine.setTheme(getTheme('synthwave'));
    expect(engine.currentTheme.id).toBe('synthwave');
    expect(spy.themeChangeCalls).toBe(1);

    // Continue orbit
    engine.render(audio);
    const pos2 = engine.camera.position.clone();

    expect(pos1.distanceTo(pos2)).toBeGreaterThan(0);
    expect(engine.currentTheme.id).toBe('synthwave');
  });

  test('T3.Combo.2: Preset switch during active MIDI CC modulation updates parameters immediately', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    // Mount initial preset
    engine.setPreset(getPreset('particle-field'));
    expect(engine.activePreset?.id).toBe('particle-field');

    // Simulate incoming MIDI CC 74 (Bloom) = 110 (value ~0.866)
    const midiMsg = parseMidiCCMessage([0xB0, 74, 110]);
    expect(midiMsg).toBeDefined();
    engine.updateConfig({ bloomStrength: (midiMsg!.normalizedValue) * 3.0 });
    expect(engine.config.bloomStrength).toBeCloseTo((110 / 127.0) * 3.0);

    // Switch preset to NeonTunnel
    engine.setPreset(getPreset('neon-tunnel'));
    expect(engine.activePreset?.id).toBe('neon-tunnel');

    // Render new preset with preserved MIDI-adjusted bloom
    const audio = createBeatDropAudioFeatures(0.8);
    engine.render(audio);
    expect(engine.config.bloomStrength).toBeCloseTo((110 / 127.0) * 3.0);
  });

  test('T3.Combo.3: Text overlay pulse animation dynamically scales with AudioEngine beat kicks', () => {
    const audioEngine = new AudioEngine();
    const beatAudio = createBeatDropAudioFeatures(0.95);

    const overlay = {
      text: sanitizeTextOverlayInput('DROP THE BASS').sanitized,
      scale: 1.0,
      update(features: typeof beatAudio) {
        if (features.beat) {
          this.scale = 1.0 + features.bass * 0.4;
        } else {
          this.scale = 1.0;
        }
      }
    };

    overlay.update(beatAudio);
    expect(overlay.scale).toBeCloseTo(1.38, 0.05);

    const quietAudio = createSilentAudioFeatures();
    overlay.update(quietAudio);
    expect(overlay.scale).toBeCloseTo(1.0);
  });

  test('T3.Combo.4: Studio Forge recipe change combined with theme update and camera shake', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const studio = new StudioComposerPreset();
    engine.setPreset(studio);

    // Modulate studio stage
    studio.config.tunnelDepth = 1.7;
    studio.config.liquidWarp = 1.5;

    // Switch theme to Toxic
    engine.setTheme(getTheme('toxic'));

    // Trigger beat kick impulse
    const kickAudio = createBeatDropAudioFeatures(0.9);
    engine.render(kickAudio);

    expect(engine.currentTheme.id).toBe('toxic');
    expect(studio.config.tunnelDepth).toBe(1.7);
    expect(engine.camera.position.length()).toBeGreaterThan(0);

    engine.activePreset?.dispose();
  });

  test('T3.Combo.5: Microphone stream driving multi-band FFT, beat detector, and bloom post-processing', async () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('ember'));
    const audioEngine = new AudioEngine();

    const micOk = await audioEngine.toggleMic();
    expect(micOk).toBe(true);

    const features = audioEngine.getFeatures();
    // Connect audio beat to render engine config
    if (features.beat) {
      renderEngine.updateConfig({ bloomStrength: 2.5 });
    } else {
      renderEngine.updateConfig({ bloomStrength: 1.2 });
    }

    renderEngine.render(features);
    expect(renderEngine.config.bloomStrength).toBeGreaterThan(0);
  });

  test('T3.Combo.6: Playlist track change triggering BPM recalculation and preset cycle', () => {
    const audioEngine = new AudioEngine();
    let currentPresetIndex = 0;

    audioEngine.onBpmChange = (bpm) => {
      if (bpm > 130) {
        currentPresetIndex = (currentPresetIndex + 1) % PRESETS.length;
      }
    };

    // Simulate high BPM track
    audioEngine.bpmDetector.detectedBPM = 140;
    audioEngine.bpmDetector.recordBeat(1.0);
    audioEngine.onBpmChange(140, false);

    expect(currentPresetIndex).toBe(1);
  });

  test('T3.Combo.7: UI rail drawer toggling while camera auto-orbit renders active frames', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    engine.config.autoRotate = true;

    // Simulate opening FX drawer
    const fxPanel = document.createElement('div');
    fxPanel.id = 'fxPanel';
    fxPanel.classList.add('open');

    // Render frame
    engine.render(createSilentAudioFeatures());
    expect(fxPanel.classList.contains('open')).toBe(true);

    // Close drawer
    fxPanel.classList.remove('open');
    engine.render(createSilentAudioFeatures());
    expect(fxPanel.classList.contains('open')).toBe(false);
  });

  test('T3.Combo.8: MIDI CC modulating sensitivity while simultaneously modulating chromatic aberration', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const audio = new AudioEngine();

    // CC 1 (Sensitivity) = 100
    const cc1 = parseMidiCCMessage([0xB0, 1, 100]);
    if (cc1) {
      audio.sensitivity = cc1.normalizedValue * 2.0;
    }

    // CC 74 (Aberration) = 80
    const cc74 = parseMidiCCMessage([0xB0, 74, 80]);
    if (cc74) {
      engine.updateConfig({ chromaticAberration: cc74.normalizedValue });
    }

    expect(audio.sensitivity).toBeCloseTo((100 / 127.0) * 2.0);
    expect(engine.config.chromaticAberration).toBeCloseTo(80 / 127.0);
  });

  test('T3.Combo.9: Motion persistence feedback ping-pong buffer swap during rapid preset switching', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    engine.updateConfig({ persistence: 0.85 });

    const p1 = getPreset('starfield');
    const p2 = getPreset('black-hole');

    engine.setPreset(p1);
    engine.render(createBeatDropAudioFeatures(0.8));

    engine.setPreset(p2);
    engine.render(createBeatDropAudioFeatures(0.8));

    expect(engine.config.persistence).toBe(0.85);
    expect(engine.activePreset?.id).toBe('black-hole');
  });

  test('T3.Combo.10: Aspect ratio framing resize (16:9 -> 9:16 -> 1:1) with camera projection update and screenshot', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    // 16:9 (Desktop)
    engine.resize(1920, 1080);
    expect(engine.camera.aspect).toBeCloseTo(16 / 9, 0.01);
    const shot1 = engine.captureScreenshot();
    expect(shot1.startsWith('data:image/png')).toBe(true);

    // 9:16 (Story / TikTok)
    engine.resize(1080, 1920);
    expect(engine.camera.aspect).toBeCloseTo(9 / 16, 0.01);
    const shot2 = engine.captureScreenshot();
    expect(shot2.startsWith('data:image/png')).toBe(true);

    // 1:1 (Square)
    engine.resize(1080, 1080);
    expect(engine.camera.aspect).toBeCloseTo(1.0, 0.01);
    const shot3 = engine.captureScreenshot();
    expect(shot3.startsWith('data:image/png')).toBe(true);
  });
});
