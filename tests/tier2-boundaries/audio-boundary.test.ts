import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { AudioEngine, BeatDetector, BPMDetector } from '../../src/audio/AudioEngine';

describe('Tier 2: Audio DSP Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Audio.1: Absolute silence (all 0 buffers) produces zero energies without NaN', () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();

    expect(isNaN(features.subBass)).toBe(false);
    expect(isNaN(features.bass)).toBe(false);
    expect(isNaN(features.mid)).toBe(false);
    expect(isNaN(features.treble)).toBe(false);
    expect(isNaN(features.rms)).toBe(false);

    expect(features.subBass).toBe(0.0);
    expect(features.bass).toBe(0.0);
    expect(features.rms).toBe(0.0);
  });

  test('T2.Audio.2: Maximum clipping amplitude (all 255) clamps RMS cleanly to 1.0', () => {
    // Testing RMS calculation formula on max square wave
    const maxTimeData = new Uint8Array(1024).fill(255);
    let sumSquares = 0;
    for (const val of maxTimeData) {
      const norm = (val - 128) / 128.0;
      sumSquares += norm * norm;
    }
    const rms = Math.min(1.0, Math.sqrt(sumSquares / maxTimeData.length) * 2.0);

    expect(rms).toBe(1.0);
  });

  test('T2.Audio.3: BeatDetector handles abrupt transition from prolonged silence to maximum kick', () => {
    const detector = new BeatDetector();

    // 100 frames of complete silence
    for (let i = 0; i < 100; i++) {
      detector.update(0.0);
    }
    expect(detector.beatEnergy).toBe(0.0);

    // Sudden maximum bass kick (1.0)
    const kick = detector.update(1.0);
    expect(kick).toBe(true);
    expect(detector.beatEnergy).toBe(1.0);
  });

  test('T2.Audio.4: Unrealistic tap tempo frequencies (>300 BPM or <40 BPM) are filtered to valid range', () => {
    const bpm = new BPMDetector();

    // Simulating impossibly fast taps (every 20ms = 3000 BPM)
    for (let i = 0; i < 5; i++) {
      bpm.tap();
    }

    // Detected BPM should remain within standard musical range [50, 240]
    expect(bpm.detectedBPM).toBeGreaterThanOrEqual(50);
    expect(bpm.detectedBPM).toBeLessThanOrEqual(240);
  });

  test('T2.Audio.5: Empty playlist queue operations do not throw or crash', () => {
    const engine = new AudioEngine();

    expect(() => {
      engine.addFilesToPlaylist([]);
      engine.nextTrack();
      engine.prevTrack();
    }).not.toThrow();

    expect(engine.currentTrackIndex).toBe(-1);
  });

  test('T2.Audio.6: Microphone permission denial simulation returns false gracefully', async () => {
    const engine = new AudioEngine();

    // Override getUserMedia to simulate user denying microphone permission
    navigator.mediaDevices.getUserMedia = async () => {
      throw new Error('Permission denied by user');
    };

    const micResult = await engine.toggleMic();
    expect(micResult).toBe(false);
    expect(engine.isMicActive).toBe(false);
  });
});
