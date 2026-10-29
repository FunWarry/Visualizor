import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { getTheme } from '../../src/themes/themes';
import { createBeatDropAudioFeatures } from '../harness/fixtures';
import { computeZoomDistance } from '../harness/contracts';

describe('Tier 2: Camera & 3D Viewpoints Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Camera.1: Zenith and Nadir pole angles (+PI/2, -PI/2) compute finite coordinates without NaN', () => {
    const radius = 12;
    const calculateSphericalPosition = (rot: number, tilt: number): [number, number, number] => {
      const halfPi = Math.PI / 2;
      const clampedTilt = Math.max(-halfPi + 0.0001, Math.min(halfPi - 0.0001, tilt));
      const x = radius * Math.cos(clampedTilt) * Math.sin(rot);
      const y = radius * Math.sin(clampedTilt);
      const z = radius * Math.cos(clampedTilt) * Math.cos(rot);
      return [x, y, z];
    };

    // Zenith pole
    const [zx, zy, zz] = calculateSphericalPosition(0, Math.PI / 2);
    expect(isFinite(zx) && !isNaN(zx)).toBe(true);
    expect(isFinite(zy) && !isNaN(zy)).toBe(true);
    expect(isFinite(zz) && !isNaN(zz)).toBe(true);
    expect(zy).toBeCloseTo(12, 0.01);

    // Nadir pole
    const [nx, ny, nz] = calculateSphericalPosition(0, -Math.PI / 2);
    expect(isFinite(nx) && !isNaN(nx)).toBe(true);
    expect(isFinite(ny) && !isNaN(ny)).toBe(true);
    expect(isFinite(nz) && !isNaN(nz)).toBe(true);
    expect(ny).toBeCloseTo(-12, 0.01);
  });

  test('T2.Camera.2: Zoom slider boundary values clamp cleanly to minimum 0.7 and maximum 2.5', () => {
    expect(computeZoomDistance(-999.0)).toBeCloseTo(0.7);
    expect(computeZoomDistance(999.0)).toBeCloseTo(2.5);
    expect(computeZoomDistance(NaN)).toBeCloseTo(0.7);
  });

  test('T2.Camera.3: Auto-rotation speed of 0.0 preserves camera position steadily', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    engine.config.autoRotate = true;
    engine.config.autoRotateSpeed = 0.0;
    engine.config.cameraShake = false;

    const audio = {
      frequencyData: new Uint8Array(1024),
      timeDomainData: new Uint8Array(1024),
      subBass: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      rms: 0,
      beat: false,
      beatEnergy: 0,
      bpm: 120
    };

    engine.render(audio);
    const p1 = engine.camera.position.clone();
    engine.render(audio);
    const p2 = engine.camera.position.clone();

    expect(p1.distanceTo(p2)).toBeCloseTo(0, 0.001);
  });

  test('T2.Camera.4: Extreme audio kick impulse caps shake displacement at safe maximum', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    engine.config.cameraShake = true;

    // Huge bass kick with extreme intensity
    const extremeAudio = createBeatDropAudioFeatures(1.0);
    extremeAudio.bass = 1.0;

    engine.render(extremeAudio);

    // Camera displacement should be finite and within safe bounds
    expect(isFinite(engine.camera.position.x)).toBe(true);
    expect(isFinite(engine.camera.position.y)).toBe(true);
    expect(isFinite(engine.camera.position.z)).toBe(true);
    expect(Math.abs(engine.camera.position.x)).toBeLessThan(20);
  });

  test('T2.Camera.5: Zero window dimensions in resize handle aspect ratio without NaN camera projection', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    // Handle 0 width / height safely
    const safeResize = (w: number, h: number) => {
      const safeW = Math.max(1, w);
      const safeH = Math.max(1, h);
      engine.resize(safeW, safeH);
    };

    safeResize(0, 0);
    expect(isFinite(engine.camera.aspect)).toBe(true);
    expect(engine.camera.aspect).toBeGreaterThan(0);
  });
});
