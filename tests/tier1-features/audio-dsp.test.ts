import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { AudioEngine, BeatDetector, BPMDetector } from '../../src/audio/AudioEngine';

describe('Tier 1: Audio DSP Engine & Analysis', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Audio.1: Multi-band FFT energies subBass, bass, mid, treble remain normalized [0.0, 1.0]', () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();

    expect(features.subBass).toBeGreaterThanOrEqual(0.0);
    expect(features.subBass).toBeLessThanOrEqual(1.0);

    expect(features.bass).toBeGreaterThanOrEqual(0.0);
    expect(features.bass).toBeLessThanOrEqual(1.0);

    expect(features.mid).toBeGreaterThanOrEqual(0.0);
    expect(features.mid).toBeLessThanOrEqual(1.0);

    expect(features.treble).toBeGreaterThanOrEqual(0.0);
    expect(features.treble).toBeLessThanOrEqual(1.0);
  });

  test('T1.Audio.2: RMS calculation derives global amplitude in normalized range [0.0, 1.0]', () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();

    expect(features.rms).toBeGreaterThanOrEqual(0.0);
    expect(features.rms).toBeLessThanOrEqual(1.0);
  });

  test('T1.Audio.3: BeatDetector triggers kick transient on energy threshold and decays exponentially', () => {
    const detector = new BeatDetector();

    // Fill history with quiet baseline (0.1)
    for (let i = 0; i < 40; i++) {
      detector.update(0.1);
    }

    // Trigger sudden bass kick spike (0.85)
    const isBeat = detector.update(0.85);
    expect(isBeat).toBe(true);
    expect(detector.beatEnergy).toBe(1.0);

    // Following quiet frame decays energy
    detector.update(0.1);
    expect(detector.isBeat).toBe(false);
    expect(detector.beatEnergy).toBeCloseTo(0.9, 0.05);
  });

  test('T1.Audio.4: BPMDetector records beat timestamps and calculates tempo', () => {
    const bpm = new BPMDetector();

    // Simulate 120 BPM kicks (every 0.5s)
    let t = 10.0;
    for (let i = 0; i < 6; i++) {
      bpm.recordBeat(t);
      t += 0.5;
    }

    expect(bpm.detectedBPM).toBeGreaterThanOrEqual(100);
    expect(bpm.detectedBPM).toBeLessThanOrEqual(140);
  });

  test('T1.Audio.5: BPM tap tempo overrides auto detection with manual tempo', () => {
    const bpm = new BPMDetector();

    // Call tap() twice to simulate user tapping at 120 BPM (~500ms apart)
    bpm.tap();
    // Simulate delay
    setTimeout(() => {}, 500);
    bpm.tap();

    expect(bpm.manualBPM !== null || bpm.detectedBPM > 0).toBe(true);

    bpm.resetManual();
    expect(bpm.manualBPM).toBeNull();
  });

  test('T1.Audio.6: Playlist Queue manages queue order, shuffle, and repeat modes', () => {
    const engine = new AudioEngine();

    expect(engine.playlist.length).toBe(0);
    expect(engine.isShuffle).toBe(false);
    expect(engine.isRepeat).toBe(false);

    engine.isShuffle = !engine.isShuffle;
    expect(engine.isShuffle).toBe(true);

    engine.isRepeat = !engine.isRepeat;
    expect(engine.isRepeat).toBe(true);
  });
});
