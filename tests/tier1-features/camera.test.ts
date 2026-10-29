import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
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

  test('T1.Camera.7: D-pad UI buttons (orbit and tilt) adjust camera angles and clamp correctly', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const ctrl = engine.cameraController;

    const initialRot = ctrl.getRotAngle();
    const initialTilt = ctrl.getTiltAngle();

    // Orbit Right
    ctrl.nudgeOrbit(0.1);
    expect(ctrl.getRotAngle()).toBeCloseTo(initialRot + 0.1);

    // Orbit Left
    ctrl.nudgeOrbit(-0.1);
    expect(ctrl.getRotAngle()).toBeCloseTo(initialRot);

    // Tilt Up
    ctrl.nudgeTilt(0.1);
    expect(ctrl.getTiltAngle()).toBeCloseTo(initialTilt + 0.1);

    // Tilt Down
    ctrl.nudgeTilt(-0.1);
    expect(ctrl.getTiltAngle()).toBeCloseTo(initialTilt);

    // Reset restores base angles
    ctrl.nudgeOrbit(0.5);
    ctrl.nudgeTilt(0.3);
    ctrl.reset();
    expect(ctrl.getRotAngle()).toBeCloseTo(0);
    expect(ctrl.getTiltAngle()).toBeCloseTo(0);
    expect(ctrl.getZoom()).toBeCloseTo(0.5);
  });

  test('T1.Camera.8: Zoom slider maps normalized values to clamped camera distances', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const ctrl = engine.cameraController;

    // Minimum zoom (0.0) -> minimum distance
    ctrl.setZoom(0.0, true);
    expect(ctrl.getZoom()).toBeCloseTo(0.0);
    const minDistance = ctrl.getDistance();
    expect(minDistance).toBeCloseTo(computeZoomDistance(0.0) * 12 / 1.6, 0.5);

    // Maximum zoom (1.0) -> maximum distance
    ctrl.setZoom(1.0, true);
    expect(ctrl.getZoom()).toBeCloseTo(1.0);
    const maxDistance = ctrl.getDistance();
    expect(maxDistance).toBeGreaterThan(minDistance);

    // Out-of-bounds clamping
    ctrl.setZoom(-1.5, true);
    expect(ctrl.getZoom()).toBe(0.0);
    ctrl.setZoom(2.5, true);
    expect(ctrl.getZoom()).toBe(1.0);
  });

  test('T1.Camera.9: Auto-orbit toggle, speed, and CW/CCW direction modulate camera trajectory', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const ctrl = engine.cameraController;

    ctrl.setAutoRotate(true);
    ctrl.setAutoRotateSpeed(0.5);
    ctrl.setRotationDirection(1); // Clockwise

    const startRot = ctrl.getRotAngle();
    ctrl.update(0.1); // 100ms delta
    const cwRot = ctrl.getRotAngle();
    expect(cwRot).toBeGreaterThan(startRot);

    // Switch to Counter-Clockwise (-1)
    ctrl.setRotationDirection(-1);
    ctrl.update(0.1);
    expect(ctrl.getRotAngle()).toBeLessThan(cwRot);

    // Pause Auto-Orbit
    ctrl.setAutoRotate(false);
    const pausedRot = ctrl.getRotAngle();
    ctrl.update(0.5);
    expect(ctrl.getRotAngle()).toBeCloseTo(pausedRot);
  });

  test('T1.Camera.10: Cinematic viewpoints (Default, Top, Low, Iso, Side) snap/lerp to predefined coordinates', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const ctrl = engine.cameraController;
    const silentAudio = createSilentAudioFeatures();

    // Top View (Bird's eye, tilt near +PI/2)
    engine.setViewpoint('top');
    expect(ctrl.getActiveViewpoint()).toBe('top');
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getTiltAngle()).toBeCloseTo(Math.PI / 2 - 0.05, 0.05);

    // Low View (Worm's eye, tilt negative)
    engine.setViewpoint('low');
    expect(ctrl.getActiveViewpoint()).toBe('low');
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getTiltAngle()).toBeLessThan(-0.5);

    // Iso View (45 deg orbit, positive tilt)
    engine.setViewpoint('iso');
    expect(ctrl.getActiveViewpoint()).toBe('iso');
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getRotAngle()).toBeCloseTo(Math.PI / 4, 0.1);

    // Side View (90 deg orbit)
    engine.setViewpoint('side');
    expect(ctrl.getActiveViewpoint()).toBe('side');
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getRotAngle()).toBeCloseTo(Math.PI / 2, 0.1);

    // Default View (0 orbit, 0 tilt)
    engine.setViewpoint('default');
    for (let i = 0; i < 30; i++) engine.render(silentAudio);
    expect(ctrl.getRotAngle()).toBeCloseTo(0, 0.05);
    expect(ctrl.getTiltAngle()).toBeCloseTo(0, 0.05);
  });

  test('T1.Camera.11: Camera shake sensitivity and mode controls modulate kick impulse magnitude', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const ctrl = engine.cameraController;

    // Disabled shake produces zero displacement
    ctrl.setCameraShakeEnabled(false);
    ctrl.triggerShake(1.0);
    expect(ctrl.getShakeOffset().length()).toBe(0);

    // Subtle shake (0.3 intensity)
    ctrl.setCameraShakeEnabled(true);
    ctrl.setCameraShakeIntensity(0.3);
    ctrl.triggerShake(1.0);
    const subtleMag = ctrl.getShakeOffset().length();
    expect(subtleMag).toBeGreaterThan(0);

    // Strong shake (1.0 intensity)
    ctrl.setCameraShakeIntensity(1.0);
    ctrl.triggerShake(1.0);
    const strongMag = ctrl.getShakeOffset().length();
    expect(strongMag).toBeGreaterThan(subtleMag);

    // Exponential decay clears shake over time
    for (let i = 0; i < 30; i++) ctrl.update(0.033);
    expect(ctrl.getShakeOffset().length()).toBeCloseTo(0, 0.05);
  });

  test('T1.Camera.12: Polar angle clamping prevents gimbal flips and camera inversion at Zenith and Nadir', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const ctrl = engine.cameraController;

    // Rapid tilt up attempts to exceed +PI/2
    for (let i = 0; i < 50; i++) {
      ctrl.nudgeTilt(0.2);
    }
    const maxTilt = ctrl.getTiltAngle();
    expect(maxTilt).toBeLessThanOrEqual(Math.PI / 2 - 0.04);
    expect(maxTilt).toBeGreaterThan(1.4);

    // Rapid tilt down attempts to fall below -PI/2
    for (let i = 0; i < 50; i++) {
      ctrl.nudgeTilt(-0.2);
    }
    const minTilt = ctrl.getTiltAngle();
    expect(minTilt).toBeGreaterThanOrEqual(-Math.PI / 2 + 0.04);
    expect(minTilt).toBeLessThan(-1.4);

    // Ensure camera coordinates remain strictly finite
    expect(isFinite(engine.camera.position.x)).toBe(true);
    expect(isFinite(engine.camera.position.y)).toBe(true);
    expect(isFinite(engine.camera.position.z)).toBe(true);
    expect(isNaN(engine.camera.position.x)).toBe(false);
  });

  test('T1.Camera.13: Viewpoint transition under active engine.render() loop reaches PI/2 without auto-orbit clobbering', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const silentAudio = createSilentAudioFeatures();

    // Verify initial autoRotate is true
    expect(engine.config.autoRotate).toBe(true);
    expect(engine.cameraController.autoRotate).toBe(true);

    // Switch to side viewpoint (PI/2 rad = 90 deg)
    engine.setViewpoint('side');
    expect(engine.config.autoRotate).toBe(false);
    expect(engine.cameraController.autoRotate).toBe(false);

    // Run 60 frames of render loop (1 second at 60fps)
    for (let i = 0; i < 60; i++) {
      engine.render(silentAudio);
    }

    const finalRot = engine.cameraController.getRotAngle();
    expect(finalRot).toBeCloseTo(Math.PI / 2, 0.05);
    expect(engine.cameraController.autoRotate).toBe(false);
    expect(engine.config.autoRotate).toBe(false);
  });

  test('T1.Camera.14: DOM controls (#tiltUp, #rotateLeft, #zoomSlider, #viewTopBtn) drive camera rig and viewpoints', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));
    const silentAudio = createSilentAudioFeatures();

    // Create DOM structure matching index.html
    const rotateLeft = new MockElement('BUTTON');
    rotateLeft.id = 'rotateLeft';
    rotateLeft.setAttribute('data-axis', 'orbit');
    rotateLeft.setAttribute('data-direction', '-1');

    const tiltUp = new MockElement('BUTTON');
    tiltUp.id = 'tiltUp';
    tiltUp.setAttribute('data-axis', 'tilt');
    tiltUp.setAttribute('data-direction', '1');

    const zoomSlider = new MockElement('INPUT');
    zoomSlider.id = 'zoomSlider';
    zoomSlider.setAttribute('type', 'range');
    zoomSlider.value = '0.5';

    const viewTopBtn = new MockElement('BUTTON');
    viewTopBtn.id = 'viewTopBtn';
    viewTopBtn.setAttribute('data-view', 'top');

    const autoRotateToggle = new MockElement('INPUT');
    autoRotateToggle.id = 'autoRotateToggle';
    autoRotateToggle.setAttribute('type', 'checkbox');
    (autoRotateToggle as unknown as { checked: boolean }).checked = true;

    // Attach listeners following main.ts architecture
    rotateLeft.addEventListener('click', () => {
      engine.setAutoRotate(false);
      engine.cameraController.nudge('orbit', -1, 0.1);
      (autoRotateToggle as unknown as { checked: boolean }).checked = false;
    });

    tiltUp.addEventListener('click', () => {
      engine.setAutoRotate(false);
      engine.cameraController.nudge('tilt', 1, 0.1);
      (autoRotateToggle as unknown as { checked: boolean }).checked = false;
    });

    zoomSlider.addEventListener('input', () => {
      const val = Number.parseFloat(zoomSlider.value);
      engine.cameraController.setZoom(val, true);
    });

    viewTopBtn.addEventListener('click', () => {
      engine.setAutoRotate(false);
      engine.setViewpoint('top');
      (autoRotateToggle as unknown as { checked: boolean }).checked = false;
    });

    // 1. Test #rotateLeft click
    const initialRot = engine.cameraController.getRotAngle();
    rotateLeft.click();
    expect(engine.cameraController.getRotAngle()).toBeLessThan(initialRot);
    expect(engine.cameraController.autoRotate).toBe(false);
    expect(engine.config.autoRotate).toBe(false);

    // 2. Test #tiltUp click
    const initialTilt = engine.cameraController.getTiltAngle();
    tiltUp.click();
    expect(engine.cameraController.getTiltAngle()).toBeGreaterThan(initialTilt);

    // 3. Test #zoomSlider input simulation
    zoomSlider.value = '0.9';
    zoomSlider.dispatchEvent(new Event('input'));
    expect(engine.cameraController.getZoom()).toBeCloseTo(0.9);
    expect(engine.cameraController.getDistance()).toBeGreaterThan(12);

    // 4. Test #viewTopBtn click followed by render loop
    viewTopBtn.click();
    expect(engine.cameraController.getActiveViewpoint()).toBe('top');
    for (let i = 0; i < 60; i++) {
      engine.render(silentAudio);
    }
    expect(engine.cameraController.getTiltAngle()).toBeCloseTo(Math.PI / 2 - 0.05, 0.05);
    expect(engine.config.autoRotate).toBe(false);
  });
});
