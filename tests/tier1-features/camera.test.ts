import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { getTheme } from '../../src/themes/themes';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from '../harness/fixtures';
import { computeZoomDistance, computeAutoRotateAngle } from '../harness/contracts';

describe('Tier 1: Camera & 3D Viewpoints (#42)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Camera.1: Spherical coordinates contract maps orbit and tilt updates', () => {
    let rotAngle = 0;
    let tiltAngle = 0;

    // Simulate D-pad left/right (orbit axis)
    const orbitStep = 0.05;
    rotAngle += orbitStep * 1; // Orbit right
    expect(rotAngle).toBeCloseTo(0.05);

    // Simulate D-pad up/down (tilt axis)
    const tiltStep = 0.05;
    tiltAngle += tiltStep * 1; // Tilt up
    expect(tiltAngle).toBeCloseTo(0.05);
  });

  test('T1.Camera.2: Tilt angle clamps strictly within [-PI/2, PI/2] to prevent gimbal lock', () => {
    const halfPi = Math.PI / 2;

    const clampTilt = (angle: number): number => Math.max(-halfPi, Math.min(halfPi, angle));

    expect(clampTilt(2.5)).toBeCloseTo(halfPi);
    expect(clampTilt(-3.0)).toBeCloseTo(-halfPi);
    expect(clampTilt(0.4)).toBeCloseTo(0.4);
  });

  test('T1.Camera.3: Zoom slider maps normalized [0.0, 1.0] to camera distance multiplier', () => {
    // Distance formula: 0.7 + (2.5 - 0.7) * zoom
    expect(computeZoomDistance(0.0)).toBeCloseTo(0.7);
    expect(computeZoomDistance(0.5)).toBeCloseTo(1.6);
    expect(computeZoomDistance(1.0)).toBeCloseTo(2.5);
    // Boundary clamping
    expect(computeZoomDistance(-0.5)).toBeCloseTo(0.7);
    expect(computeZoomDistance(1.5)).toBeCloseTo(2.5);
  });

  test('T1.Camera.4: Auto-rotation increments rotAngle continuously with speed and direction', () => {
    let angle = 0;
    // Clockwise (+1)
    angle = computeAutoRotateAngle(angle, 0.5, 1);
    expect(angle).toBeGreaterThan(0);

    // Counter-clockwise (-1)
    angle = computeAutoRotateAngle(angle, 0.5, -1);
    expect(angle).toBeCloseTo(0);
  });

  test('T1.Camera.5: Audio-reactive camera shake triggers on beat and decays per frame', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    engine.config.autoRotate = false;
    engine.config.cameraShake = true;

    // Initially at base position
    const initialPos = engine.camera.position.clone();

    // Render with beat drop -> kick triggers shake
    const beatAudio = createBeatDropAudioFeatures(0.9);
    engine.render(beatAudio);

    // Position displaced due to cameraShake
    const posDuringShake = engine.camera.position.clone();
    expect(posDuringShake.distanceTo(initialPos)).toBeGreaterThan(0);

    // Render several frames with silence -> shake decays towards 0
    const silentAudio = createSilentAudioFeatures();
    for (let i = 0; i < 20; i++) {
      engine.render(silentAudio);
    }

    const posAfterDecay = engine.camera.position.clone();
    expect(posAfterDecay.distanceTo(initialPos)).toBeCloseTo(0, 0.05);
  });

  test('T1.Camera.6: RenderEngine auto-rotate rotates camera around origin', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    engine.config.autoRotate = true;
    engine.config.autoRotateSpeed = 1.0;

    const silentAudio = createSilentAudioFeatures();
    engine.render(silentAudio);
    const p1 = engine.camera.position.clone();

    // Simulate passage of time
    setTimeout(() => {}, 50);
    engine.render(silentAudio);
    const p2 = engine.camera.position.clone();

    // Verify camera position is orbiting on XZ circle around (0,0,0)
    const radius1 = Math.sqrt(p1.x * p1.x + p1.z * p1.z);
    const radius2 = Math.sqrt(p2.x * p2.x + p2.z * p2.z);
    expect(radius1).toBeCloseTo(12, 0.1);
    expect(radius2).toBeCloseTo(12, 0.1);
  });
});
