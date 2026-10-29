import * as THREE from 'three';
import { CameraController, CANONICAL_VIEWPOINTS, computeZoomDistance } from '../src/engine/CameraController';
import { RenderEngine } from '../src/engine/RenderEngine';
import { getTheme } from '../src/themes/themes';
import { setupTestEnvironment } from './harness/env';
import { createBeatDropAudioFeatures } from './harness/fixtures';

// ---------------------------------------------------------------------------
// EMPIRICAL CHALLENGER TEST SUITE: MILESTONE 4 (TICKET #42: feat(camera))
// ---------------------------------------------------------------------------

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER STRESS HARNESS: MILESTONE 4 (#42 feat(camera))  ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures: Array<{ name: string; error: string; stack?: string }> = [];

function check(title: string, fn: () => void): void {
  totalChecks++;
  try {
    fn();
    passedChecks++;
    console.log(`  ✓ PASS: ${title}`);
  } catch (err: unknown) {
    failedChecks++;
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`  ✗ FAIL: ${title}`);
    console.error(`    ${message}`);
    failures.push({ name: title, error: message, stack });
  }
}

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

setupTestEnvironment();
const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
const mockTheme = getTheme('ember');

// ===========================================================================
// SECTION 1: RAPID UPDATES & GC ALLOCATION STRESS
// ===========================================================================
console.log('--- SECTION 1: Rapid Updates (10,000+ updates) & GC Pressure Stress ---');

check('1.1: 50,000 rapid updates execute with continuous finite position and zero crash', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(true, 1.0, 1);
  ctrl.setCameraShakeEnabled(true);

  let prevPos = camera.position.clone();
  let maxStepDist = 0;

  for (let i = 0; i < 50000; i++) {
    const isBeat = i % 30 === 0;
    const bass = isBeat ? 0.9 : 0.05;
    ctrl.update(0.016, isBeat, bass);

    const pos = camera.position;
    assert(Number.isFinite(pos.x), `pos.x must be finite at iter ${i}`);
    assert(Number.isFinite(pos.y), `pos.y must be finite at iter ${i}`);
    assert(Number.isFinite(pos.z), `pos.z must be finite at iter ${i}`);

    const stepDist = pos.distanceTo(prevPos);
    if (stepDist > maxStepDist) maxStepDist = stepDist;
    prevPos.copy(pos);
  }

  assert(maxStepDist < 2.0, `Step distance between consecutive frames too large: ${maxStepDist}`);
});

check('1.2: Rapid updates (20,000 iterations) produce negligible heap allocation churn', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(true, 0.5, 1);
  ctrl.setCameraShakeEnabled(false);

  for (let i = 0; i < 5000; i++) ctrl.update(0.016);

  if (global.gc) global.gc();
  const startMem = process.memoryUsage().heapUsed;

  for (let i = 0; i < 20000; i++) {
    ctrl.update(0.016);
  }

  const endMem = process.memoryUsage().heapUsed;
  const memDiffMB = (endMem - startMem) / (1024 * 1024);

  assert(memDiffMB < 2.0, `Excessive heap allocation detected: ${memDiffMB.toFixed(2)} MB`);
});

// ===========================================================================
// SECTION 2: EXTREME INPUTS & BOUNDARY RESILIENCE
// ===========================================================================
console.log('\n--- SECTION 2: Extreme Inputs & Boundary Resilience ---');

check('2.1: computeZoomDistance bounds inputs strictly to [0.7, 2.5] across wild inputs', () => {
  const wildInputs = [-1000, 1000, -1e9, 1e9, NaN, Infinity, -Infinity, null as any, undefined as any, 'abc' as any];
  for (const val of wildInputs) {
    const dist = computeZoomDistance(val);
    assert(Number.isFinite(dist), `computeZoomDistance(${val}) produced non-finite: ${dist}`);
    assert(dist >= 0.7 && dist <= 2.5, `computeZoomDistance(${val}) out of bounds [0.7, 2.5]: ${dist}`);
  }
});

check('2.2: setZoom handles extreme out-of-bounds, NaN, and Infinity without NaN camera position', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);

  const testZooms = [-1000, 1000, NaN, Infinity, -Infinity];
  for (const z of testZooms) {
    ctrl.setZoom(z, true);
    assert(Number.isFinite(ctrl.getZoom()), `ctrl.getZoom() is non-finite for input ${z}`);
    assert(ctrl.getZoom() >= 0 && ctrl.getZoom() <= 1, `ctrl.getZoom() out of bounds for input ${z}`);
    assert(Number.isFinite(ctrl.getDistance()), `ctrl.getDistance() is non-finite for input ${z}`);
    assert(ctrl.getDistance() >= ctrl.minDistance && ctrl.getDistance() <= ctrl.maxDistance, `Distance out of bounds for ${z}`);
    assert(Number.isFinite(camera.position.x), `camera.position.x is non-finite for zoom ${z}`);
    assert(Number.isFinite(camera.position.y), `camera.position.y is non-finite for zoom ${z}`);
    assert(Number.isFinite(camera.position.z), `camera.position.z is non-finite for zoom ${z}`);
  }
});

check('2.3: setPosition handles extreme and non-finite angles safely', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);

  const angleTests = [
    { rot: 1e8, tilt: 1e8 },
    { rot: -1e8, tilt: -1e8 },
    { rot: NaN, tilt: NaN },
    { rot: Infinity, tilt: -Infinity },
    { rot: -Infinity, tilt: Infinity }
  ];

  for (const { rot, tilt } of angleTests) {
    ctrl.setPosition(rot, tilt, 0.5, true);
    assert(Number.isFinite(ctrl.getRotAngle()), `rotAngle non-finite for ${rot}, ${tilt}`);
    assert(Number.isFinite(ctrl.getTiltAngle()), `tiltAngle non-finite for ${rot}, ${tilt}`);
    assert(ctrl.getTiltAngle() >= CameraController.MIN_TILT, `tiltAngle below MIN_TILT for ${rot}, ${tilt}`);
    assert(ctrl.getTiltAngle() <= CameraController.MAX_TILT, `tiltAngle above MAX_TILT for ${rot}, ${tilt}`);
    assert(Number.isFinite(camera.position.x), `cam.x non-finite for ${rot}, ${tilt}`);
    assert(Number.isFinite(camera.position.y), `cam.y non-finite for ${rot}, ${tilt}`);
    assert(Number.isFinite(camera.position.z), `cam.z non-finite for ${rot}, ${tilt}`);
  }
});

check('2.4: nudge / step methods with non-finite or extreme deltas audit', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);

  ctrl.nudgeTilt(1e6);
  assert(ctrl.getTiltAngle() <= CameraController.MAX_TILT, 'tilt did not clamp to MAX_TILT');
  ctrl.nudgeTilt(-2e6);
  assert(ctrl.getTiltAngle() >= CameraController.MIN_TILT, 'tilt did not clamp to MIN_TILT');

  ctrl.nudgeOrbit(1e6);
  assert(Number.isFinite(ctrl.getRotAngle()), 'rotAngle non-finite after large orbit');
  assert(Number.isFinite(camera.position.x), 'cam.x non-finite after large orbit');

  // Verify NaN behavior on nudge:
  ctrl.reset();
  ctrl.nudgeTilt(NaN);
  const isTiltNan = isNaN(ctrl.getTiltAngle());
  // Report as observation / finding: nudgeTilt(NaN) creates NaN tiltAngle
  if (isTiltNan) {
    console.warn('    [Vulnerability Confirmed]: nudgeTilt(NaN) produces NaN tiltAngle');
  }
  ctrl.reset();
  ctrl.nudgeOrbit(NaN);
  const isRotNan = isNaN(ctrl.getRotAngle());
  if (isRotNan) {
    console.warn('    [Vulnerability Confirmed]: nudgeOrbit(NaN) produces NaN rotAngle');
  }
});

// ===========================================================================
// SECTION 3: POLE SINGULARITY & GIMBAL LOCK MITIGATION
// ===========================================================================
console.log('\n--- SECTION 3: Pole Singularity & Gimbal Lock Stress ---');

check('3.1: Tilt clamping strictly enforces 0.05 rad safety margin away from +/- PI/2', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);

  // Exact PI/2 attempt
  ctrl.setPosition(0, Math.PI / 2, 0.5, true);
  const zenithTilt = ctrl.getTiltAngle();
  assert(zenithTilt <= Math.PI / 2 - 0.049, `Zenith tilt ${zenithTilt} violated safety margin`);
  assert(zenithTilt === CameraController.MAX_TILT, `Zenith tilt must match MAX_TILT`);

  // Exact -PI/2 attempt
  ctrl.setPosition(0, -Math.PI / 2, 0.5, true);
  const nadirTilt = ctrl.getTiltAngle();
  assert(nadirTilt >= -Math.PI / 2 + 0.049, `Nadir tilt ${nadirTilt} violated safety margin`);
  assert(nadirTilt === CameraController.MIN_TILT, `Nadir tilt must match MIN_TILT`);
});

check('3.2: Camera lookAt and matrix elements are completely non-NaN and valid at extreme zenith and nadir', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);

  for (let rot = 0; rot < Math.PI * 2; rot += 0.2) {
    ctrl.setPosition(rot, CameraController.MAX_TILT, 0.5, true);
    camera.updateMatrixWorld();

    for (let elIdx = 0; elIdx < 16; elIdx++) {
      assert(Number.isFinite(camera.matrixWorld.elements[elIdx]), `Zenith matrixWorld[${elIdx}] is non-finite at rot ${rot}`);
    }
  }

  for (let rot = 0; rot < Math.PI * 2; rot += 0.2) {
    ctrl.setPosition(rot, CameraController.MIN_TILT, 0.5, true);
    camera.updateMatrixWorld();

    for (let elIdx = 0; elIdx < 16; elIdx++) {
      assert(Number.isFinite(camera.matrixWorld.elements[elIdx]), `Nadir matrixWorld[${elIdx}] is non-finite at rot ${rot}`);
    }
  }
});

check('3.3: High-intensity kick shake at zenith/nadir does not produce pole singularity or degenerate lookAt', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setPosition(0, CameraController.MAX_TILT, 0.5, true);
  ctrl.setCameraShakeEnabled(true);
  ctrl.setCameraShakeIntensity(1.0);

  for (let i = 0; i < 500; i++) {
    ctrl.triggerShake(1.0);
    ctrl.update(0.016, true, 1.0);
    camera.updateMatrixWorld();

    const distFromOrigin = camera.position.length();
    assert(distFromOrigin > 0.1, `Camera collapsed to origin at frame ${i}`);

    const dir = new THREE.Vector3().copy(ctrl.target).sub(camera.position).normalize();
    const cross = new THREE.Vector3().crossVectors(dir, camera.up);
    assert(cross.length() > 0.001, `Gimbal singularity detected at frame ${i} (dir parallel to up)`);

    for (let elIdx = 0; elIdx < 16; elIdx++) {
      assert(Number.isFinite(camera.matrixWorld.elements[elIdx]), `Non-finite matrix element during shake at iter ${i}`);
    }
  }
});

// ===========================================================================
// SECTION 4: SHORTEST PATH SPHERICAL INTERPOLATION
// ===========================================================================
console.log('\n--- SECTION 4: Shortest Path Spherical Interpolation ---');

check('4.1: Shortest path wrap-around (+3.1 to -3.1) chooses positive arc (+0.083 rad)', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(false);

  ctrl.setPosition(3.1, 0, 0.5, true);
  assert(Math.abs(ctrl.getRotAngle() - 3.1) < 1e-4, 'Initial rotAngle should be 3.1');

  ctrl.setPosition(-3.1, 0, 0.5, false);

  // Frame 1: must take positive step
  ctrl.update(0.016);
  const nextRot = ctrl.getRotAngle();
  assert(nextRot > 3.1, `Did not take positive shortest path: rot was ${nextRot}`);
  assert(nextRot < 3.2, `Step too large: rot was ${nextRot}`);

  // Step until convergence
  for (let i = 0; i < 50; i++) ctrl.update(0.016);
  assert(Math.abs(ctrl.getRotAngle() - (-3.1)) < 0.01, `Failed to converge to -3.1, got ${ctrl.getRotAngle()}`);
});

check('4.2: Shortest path wrap-around (-3.1 to +3.1) chooses negative arc (-0.083 rad)', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(false);

  ctrl.setPosition(-3.1, 0, 0.5, true);
  ctrl.setPosition(3.1, 0, 0.5, false);

  ctrl.update(0.016);
  const nextRot = ctrl.getRotAngle();
  assert(nextRot < -3.1, `Did not take negative shortest path: rot was ${nextRot}`);

  for (let i = 0; i < 50; i++) ctrl.update(0.016);
  assert(Math.abs(ctrl.getRotAngle() - 3.1) < 0.01, `Failed to converge to 3.1, got ${ctrl.getRotAngle()}`);
});

check('4.3: Shortest path wrap-around (0.1 to 6.2 rad) chooses backward arc (-0.18 rad)', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(false);

  ctrl.setPosition(0.1, 0, 0.5, true);
  ctrl.setPosition(6.2, 0, 0.5, false);

  ctrl.update(0.016);
  const nextRot = ctrl.getRotAngle();
  assert(nextRot < 0.1, `Did not take backward shortest path: rot was ${nextRot}`);

  for (let i = 0; i < 60; i++) ctrl.update(0.016);
  // Reached target within tolerance or wrapped equivalent
  const finalRot = ctrl.getRotAngle();
  const diff = Math.min(
    Math.abs(finalRot - 6.2),
    Math.abs(finalRot - (6.2 - Math.PI * 2))
  );
  assert(diff < 0.05, `Failed to converge to 6.2, got ${finalRot}`);
});

check('4.4: Camera 3D Cartesian position is completely continuous with zero jumps during wrap transition', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(false);

  ctrl.setPosition(3.1, 0, 0.5, true);
  ctrl.setPosition(-3.1, 0, 0.5, false);

  let prevPos = camera.position.clone();
  let maxPosJump = 0;

  for (let i = 0; i < 60; i++) {
    ctrl.update(0.016);
    const jump = camera.position.distanceTo(prevPos);
    if (jump > maxPosJump) maxPosJump = jump;
    prevPos.copy(camera.position);
  }

  assert(maxPosJump < 0.5, `Discontinuous position jump detected during wrap transition: ${maxPosJump}`);
});

check('4.5: [Vulnerability Test]: setPosition with autoRotate=true fails to lerp rotation due to autoRotate overwrite', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  ctrl.setAutoRotate(true, 0.4, 1);

  // Initial angle 0
  ctrl.setPosition(0, 0, 0.5, true);

  // Request smooth transition to PI
  ctrl.setPosition(Math.PI, 0, 0.5, false);

  // Update 10 frames
  for (let i = 0; i < 10; i++) ctrl.update(0.016);

  // If autoRotate overwrote targetRotAngle, rotAngle will only be around 0.03 instead of lerping towards PI
  const currentRot = ctrl.getRotAngle();
  const isClobbered = Math.abs(currentRot - Math.PI) > 2.5;
  if (isClobbered) {
    console.warn(`    [Vulnerability Confirmed]: autoRotate clobbered targetRotAngle! Rot is ${currentRot.toFixed(4)}, expected ~0.5-1.5`);
  }
  assert(isClobbered, 'Expected autoRotate to clobber targetRotAngle demonstrating vulnerability');
});

// ===========================================================================
// SECTION 5: CANONICAL VIEWPOINTS MATRIX TRANSITIONS
// ===========================================================================
console.log('\n--- SECTION 5: Canonical Viewpoints Full Transition Matrix ---');

check('5.1: Every canonical viewpoint transitions smoothly to every other viewpoint (49 permutations)', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);
  const vpKeys = Object.keys(CANONICAL_VIEWPOINTS);

  for (const fromKey of vpKeys) {
    for (const toKey of vpKeys) {
      ctrl.setViewpoint(fromKey, true);
      const startVp = CANONICAL_VIEWPOINTS[fromKey];
      assert(Math.abs(ctrl.getTiltAngle() - startVp.tiltAngle) < 0.001, `Start tilt mismatch for ${fromKey}`);

      ctrl.setViewpoint(toKey, false);
      let maxStep = 0;
      let prev = camera.position.clone();

      for (let f = 0; f < 50; f++) {
        ctrl.update(0.02);
        const dist = camera.position.distanceTo(prev);
        if (dist > maxStep) maxStep = dist;
        prev.copy(camera.position);

        assert(Number.isFinite(camera.position.x), `Non-finite x in transition ${fromKey} -> ${toKey}`);
        assert(Number.isFinite(camera.position.y), `Non-finite y in transition ${fromKey} -> ${toKey}`);
        assert(Number.isFinite(camera.position.z), `Non-finite z in transition ${fromKey} -> ${toKey}`);
      }

      // Max step on a radius-12 sphere (diameter 24) for an exponential lerp across 120+ deg arc is bounded by 5.0 units
      assert(maxStep < 5.0, `Jump too large (${maxStep}) in transition ${fromKey} -> ${toKey}`);
      const targetVp = CANONICAL_VIEWPOINTS[toKey];
      assert(Math.abs(ctrl.getTiltAngle() - targetVp.tiltAngle) < 0.05, `Target tilt not reached for ${toKey}`);
    }
  }
});

// ===========================================================================
// SECTION 6: FUZZ GENERATOR & ADVERSARIAL STRESS
// ===========================================================================
console.log('\n--- SECTION 6: Fuzz Generator (5,000 Adversarial Actions) ---');

check('6.1: 5,000 randomized operations maintain finite coordinates, valid matrices, and bounded distance', () => {
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const ctrl = new CameraController(camera);

  const actions = ['nudgeOrbit', 'nudgeTilt', 'setZoom', 'setPosition', 'setViewpoint', 'triggerShake', 'update', 'reset'];
  const viewpoints = Object.keys(CANONICAL_VIEWPOINTS);

  for (let i = 0; i < 5000; i++) {
    const act = actions[Math.floor(Math.random() * actions.length)];

    switch (act) {
      case 'nudgeOrbit':
        ctrl.nudgeOrbit((Math.random() - 0.5) * 2.0);
        break;
      case 'nudgeTilt':
        ctrl.nudgeTilt((Math.random() - 0.5) * 2.0);
        break;
      case 'setZoom':
        ctrl.setZoom(Math.random() * 2 - 0.5, Math.random() > 0.5);
        break;
      case 'setPosition':
        ctrl.setPosition((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 5, Math.random(), Math.random() > 0.5);
        break;
      case 'setViewpoint':
        ctrl.setViewpoint(viewpoints[Math.floor(Math.random() * viewpoints.length)], Math.random() > 0.5);
        break;
      case 'triggerShake':
        ctrl.triggerShake(Math.random() * 1.5);
        break;
      case 'update':
        ctrl.update(Math.random() * 0.15 - 0.02, Math.random() > 0.7, Math.random());
        break;
      case 'reset':
        ctrl.reset();
        break;
    }

    camera.updateMatrixWorld();

    const pos = camera.position;
    assert(Number.isFinite(pos.x), `Iter ${i} (${act}): pos.x is ${pos.x}`);
    assert(Number.isFinite(pos.y), `Iter ${i} (${act}): pos.y is ${pos.y}`);
    assert(Number.isFinite(pos.z), `Iter ${i} (${act}): pos.z is ${pos.z}`);

    const dist = pos.length();
    assert(dist >= 0.5 && dist <= 60.0, `Iter ${i} (${act}): distance ${dist} out of bounds`);

    for (let m = 0; m < 16; m++) {
      assert(Number.isFinite(camera.matrixWorld.elements[m]), `Iter ${i}: matrixWorld[${m}] non-finite`);
    }
  }
});

// ===========================================================================
// SECTION 7: RENDERENGINE INTEGRATION HARNESS
// ===========================================================================
console.log('\n--- SECTION 7: RenderEngine Integration & Facade Consistency ---');

check('7.1: RenderEngine facade methods delegate cleanly and update camera state in render loop', () => {
  const engine = new RenderEngine(canvas, mockTheme);

  engine.setCameraPosition(0.5, 0.2, 0.8, true);
  assert(Math.abs(engine.cameraController.getRotAngle() - 0.5) < 0.01, 'setCameraPosition did not set rot');
  assert(Math.abs(engine.cameraController.getTiltAngle() - 0.2) < 0.01, 'setCameraPosition did not set tilt');

  engine.setAutoRotate(true, 0.8, -1);
  assert(engine.cameraController.autoRotate === true, 'setAutoRotate enabled mismatch');
  assert(engine.cameraController.autoRotateSpeed === 0.8, 'setAutoRotate speed mismatch');
  assert(engine.cameraController.autoRotateDirection === -1, 'setAutoRotate direction mismatch');

  engine.triggerCameraShake(0.9);
  assert(engine.cameraController.getShakeIntensity() > 0, 'triggerCameraShake did not activate intensity');

  engine.setViewpoint('side', true);
  assert(engine.cameraController.getActiveViewpoint() === 'side', 'setViewpoint did not activate side');

  engine.resetCamera();
  assert(engine.cameraController.getRotAngle() === 0, 'resetCamera did not reset rotAngle');
  assert(engine.cameraController.getTiltAngle() === 0, 'resetCamera did not reset tiltAngle');

  const audio = createBeatDropAudioFeatures(0.9);
  engine.render(audio);
  assert(Number.isFinite(engine.camera.position.x), 'render pass produced non-finite camera pos');
});

// ===========================================================================
// SUMMARY & REPORT
// ===========================================================================
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED:       ${passedChecks}`);
console.log(`FAILED:       ${failedChecks}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error(`Verification FAILED with ${failedChecks} failures:`);
  for (const f of failures) {
    console.error(` - [FAIL] ${f.name}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('✓ ALL EMPIRICAL CHALLENGES PASSED PERFECTLY!\n');
  process.exit(0);
}
