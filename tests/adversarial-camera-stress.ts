/**
 * ADVERSARIAL CAMERA DRAWER LIFECYCLE & STATE SYNCHRONIZATION STRESS HARNESS
 * Milestone: M4 (Ticket #42: feat(camera))
 * Author: empirical_challenger (challenger_m4_2_2)
 *
 * Targets:
 * 1. DOM Event Lifecycle Stress:
 *    - Mount #cameraPanel and simulate rapid interactions: D-pad clicks, zoom slider changes,
 *      viewpoint buttons, reset button, and direction buttons.
 *    - Assert that renderEngine.cameraController and renderEngine.config stay synchronized.
 * 2. Rapid input bursts, timer leak prevention, and boundary robustness.
 * 3. Bidirectional property proxy integrity under active render loop.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as THREE from 'three';
import { setupTestEnvironment, MockElement } from './harness/env';
import { RenderEngine } from '../src/engine/RenderEngine';
import { CameraController, CANONICAL_VIEWPOINTS, computeZoomDistance } from '../src/engine/CameraController';
import { getTheme } from '../src/themes/themes';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from './harness/fixtures';

console.log('========================================================================');
console.log('  ADVERSARIAL STRESS HARNESS: CAMERA DRAWER DOM LIFECYCLE & SYNC (#42)  ');
console.log('========================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const failures: Array<{ title: string; error: string; stack?: string }> = [];

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
    failures.push({ title, error: message, stack });
  }
}

function assert(condition: unknown, msg?: string): void {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

// Initialize headless environment
setupTestEnvironment();
const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
const mockTheme = getTheme('ember');

// ============================================================================
// SECTION 1: DOM ELEMENT MOUNT & CONTRACT VERIFICATION
// ============================================================================
console.log('--- SECTION 1: DOM Hierarchy, IDs, and Data Attributes Audit ---');

const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');

check('1.1: index.html defines #cameraPanel with data-panel="camera" and drawer-panel classes', () => {
  assert(indexHtml.includes('id="cameraPanel"'), 'Missing #cameraPanel');
  assert(indexHtml.includes('data-panel="camera"'), 'Missing data-panel="camera"');
  assert(indexHtml.includes('class="drawer-panel glass-panel detail-panel"'), 'Missing standard drawer classes');
});

check('1.2: All canonical camera drawer controls exist in index.html with valid IDs and data attributes', () => {
  const requiredElements = [
    { id: 'tiltUp', attr: 'data-axis="tilt"', dir: 'data-direction="1"' },
    { id: 'tiltDown', attr: 'data-axis="tilt"', dir: 'data-direction="-1"' },
    { id: 'rotateLeft', attr: 'data-axis="orbit"', dir: 'data-direction="-1"' },
    { id: 'rotateRight', attr: 'data-axis="orbit"', dir: 'data-direction="1"' },
    { id: 'cameraReset', attr: 'data-alias="camResetBtn"' },
    { id: 'zoomSlider', attr: 'type="range"' },
    { id: 'zoomIn', attr: 'id="zoomIn"' },
    { id: 'zoomOut', attr: 'id="zoomOut"' },
    { id: 'zoomValue', attr: 'id="zoomValue"' },
    { id: 'autoRotateToggle', attr: 'type="checkbox"' },
    { id: 'rotateSpeedSlider', attr: 'type="range"' },
    { id: 'rotateSpeedValue', attr: 'id="rotateSpeedValue"' },
    { id: 'camDirCcwBtn', attr: 'data-direction="-1"' },
    { id: 'camDirCwBtn', attr: 'data-direction="1"' },
    { id: 'viewDefaultBtn', attr: 'data-view="default"' },
    { id: 'viewTopBtn', attr: 'data-view="top"' },
    { id: 'viewLowBtn', attr: 'data-view="low"' },
    { id: 'viewIsoBtn', attr: 'data-view="iso"' },
    { id: 'viewSideBtn', attr: 'data-view="side"' },
    { id: 'camShakeToggle', attr: 'type="checkbox"' },
    { id: 'cameraShakeSegments', attr: 'id="cameraShakeSegments"' },
    { id: 'camShakeIntensitySlider', attr: 'type="range"' },
    { id: 'camShakeIntensityVal', attr: 'id="camShakeIntensityVal"' },
    { id: 'dofSegments', attr: 'id="dofSegments"' }
  ];

  for (const item of requiredElements) {
    assert(indexHtml.includes(`id="${item.id}"`), `Missing element #${item.id} in index.html`);
    if (item.attr) {
      assert(indexHtml.includes(item.attr), `Missing attribute ${item.attr} in index.html`);
    }
    if (item.dir) {
      assert(indexHtml.includes(item.dir), `Missing direction attribute ${item.dir} in index.html`);
    }
  }
});

// Helper: Wire up a complete simulated Camera Drawer DOM according to main.ts
interface MountedCameraDrawer {
  engine: RenderEngine;
  tiltUp: MockElement;
  tiltDown: MockElement;
  rotateLeft: MockElement;
  rotateRight: MockElement;
  cameraReset: MockElement;
  zoomSlider: MockElement;
  zoomIn: MockElement;
  zoomOut: MockElement;
  zoomValue: MockElement;
  autoRotateToggle: MockElement;
  rotateSpeedSlider: MockElement;
  rotateSpeedValue: MockElement;
  camDirCcwBtn: MockElement;
  camDirCwBtn: MockElement;
  viewpointBtns: MockElement[];
  camShakeToggle: MockElement;
  camShakeSlider: MockElement;
  camShakeVal: MockElement;
  cameraShakeSegments: MockElement[];
  dofSegments: MockElement[];
}

function mountCameraDrawer(): MountedCameraDrawer {
  const engine = new RenderEngine(canvas, mockTheme);

  const tiltUp = new MockElement('BUTTON');
  tiltUp.id = 'tiltUp';
  tiltUp.setAttribute('data-axis', 'tilt');
  tiltUp.setAttribute('data-direction', '1');

  const tiltDown = new MockElement('BUTTON');
  tiltDown.id = 'tiltDown';
  tiltDown.setAttribute('data-axis', 'tilt');
  tiltDown.setAttribute('data-direction', '-1');

  const rotateLeft = new MockElement('BUTTON');
  rotateLeft.id = 'rotateLeft';
  rotateLeft.setAttribute('data-axis', 'orbit');
  rotateLeft.setAttribute('data-direction', '-1');

  const rotateRight = new MockElement('BUTTON');
  rotateRight.id = 'rotateRight';
  rotateRight.setAttribute('data-axis', 'orbit');
  rotateRight.setAttribute('data-direction', '1');

  const cameraReset = new MockElement('BUTTON');
  cameraReset.id = 'cameraReset';

  const zoomSlider = new MockElement('INPUT');
  zoomSlider.id = 'zoomSlider';
  zoomSlider.setAttribute('type', 'range');
  zoomSlider.value = '0.5';

  const zoomIn = new MockElement('BUTTON');
  zoomIn.id = 'zoomIn';

  const zoomOut = new MockElement('BUTTON');
  zoomOut.id = 'zoomOut';

  const zoomValue = new MockElement('SPAN');
  zoomValue.id = 'zoomValue';
  zoomValue.textContent = '50%';

  const autoRotateToggle = new MockElement('INPUT');
  autoRotateToggle.id = 'autoRotateToggle';
  autoRotateToggle.setAttribute('type', 'checkbox');
  (autoRotateToggle as unknown as { checked: boolean }).checked = true;

  const rotateSpeedSlider = new MockElement('INPUT');
  rotateSpeedSlider.id = 'rotateSpeedSlider';
  rotateSpeedSlider.value = '0.5';

  const rotateSpeedValue = new MockElement('SPAN');
  rotateSpeedValue.id = 'rotateSpeedValue';
  rotateSpeedValue.textContent = '50%';

  const camDirCcwBtn = new MockElement('BUTTON');
  camDirCcwBtn.id = 'camDirCcwBtn';
  camDirCcwBtn.setAttribute('data-direction', '-1');

  const camDirCwBtn = new MockElement('BUTTON');
  camDirCwBtn.id = 'camDirCwBtn';
  camDirCwBtn.setAttribute('data-direction', '1');
  camDirCwBtn.classList.add('active');

  const viewpoints = ['default', 'top', 'low', 'iso', 'side'];
  const viewpointBtns = viewpoints.map(v => {
    const btn = new MockElement('BUTTON');
    btn.id = `view${v.charAt(0).toUpperCase() + v.slice(1)}Btn`;
    btn.classList.add('viewpoint-btn');
    btn.setAttribute('data-view', v);
    if (v === 'default') btn.classList.add('active');
    return btn;
  });

  const camShakeToggle = new MockElement('INPUT');
  camShakeToggle.id = 'camShakeToggle';
  (camShakeToggle as unknown as { checked: boolean }).checked = true;

  const camShakeSlider = new MockElement('INPUT');
  camShakeSlider.id = 'camShakeIntensitySlider';
  camShakeSlider.value = '0.6';

  const camShakeVal = new MockElement('SPAN');
  camShakeVal.id = 'camShakeIntensityVal';
  camShakeVal.textContent = '60%';

  const chipValues = ['0', '0.3', '0.6', '1.0'];
  const cameraShakeSegments = chipValues.map(v => {
    const chip = new MockElement('DIV');
    chip.classList.add('opt-chip');
    chip.setAttribute('data-value', v);
    if (v === '0.6') chip.classList.add('active');
    return chip;
  });

  const dofSegments = ['0', '0.3', '0.6', '1.0'].map(v => {
    const chip = new MockElement('DIV');
    chip.classList.add('opt-chip');
    chip.setAttribute('data-value', v);
    if (v === '0') chip.classList.add('active');
    return chip;
  });

  // Attach event handlers strictly mirroring src/main.ts
  function setupDpadArrow(btn: MockElement, axis: 'orbit' | 'tilt', direction: 1 | -1) {
    let glideInterval: NodeJS.Timeout | null = null;
    let glideTimeout: NodeJS.Timeout | null = null;

    const stopGlide = () => {
      btn.classList.remove('is-holding');
      if (glideTimeout !== null) {
        clearTimeout(glideTimeout);
        glideTimeout = null;
      }
      if (glideInterval !== null) {
        clearInterval(glideInterval);
        glideInterval = null;
      }
    };

    const startGlide = () => {
      stopGlide();
      btn.classList.add('is-holding');
      (autoRotateToggle as unknown as { checked: boolean }).checked = false;
      engine.setAutoRotate(false);
      engine.cameraController.nudge(axis, direction, 0.1);

      glideTimeout = setTimeout(() => {
        glideInterval = setInterval(() => {
          engine.cameraController.nudge(axis, direction, 0.03);
        }, 30);
      }, 250);
    };

    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startGlide();
    });

    btn.addEventListener('pointerup', stopGlide);
    btn.addEventListener('pointercancel', stopGlide);
    btn.addEventListener('pointerleave', stopGlide);
  }

  setupDpadArrow(rotateLeft, 'orbit', -1);
  setupDpadArrow(rotateRight, 'orbit', 1);
  setupDpadArrow(tiltUp, 'tilt', 1);
  setupDpadArrow(tiltDown, 'tilt', -1);

  cameraReset.addEventListener('click', () => {
    engine.resetCamera();
    zoomSlider.value = '0.5';
    zoomValue.textContent = '50%';
    (autoRotateToggle as unknown as { checked: boolean }).checked = true;
    viewpointBtns.forEach(b => b.classList.remove('active'));
    viewpointBtns[0].classList.add('active');
  });

  function updateZoomReadout(val: number) {
    const clamped = Math.max(0, Math.min(1, val));
    zoomSlider.value = clamped.toString();
    zoomValue.textContent = `${Math.round(clamped * 100)}%`;
    engine.cameraController.setZoom(clamped);
  }

  zoomSlider.addEventListener('input', () => {
    const val = Number.parseFloat(zoomSlider.value);
    updateZoomReadout(val);
  });

  zoomIn.addEventListener('click', () => {
    const current = Number.parseFloat(zoomSlider.value || '0.5');
    updateZoomReadout(Math.min(1.0, current + 0.1));
  });

  zoomOut.addEventListener('click', () => {
    const current = Number.parseFloat(zoomSlider.value || '0.5');
    updateZoomReadout(Math.max(0.0, current - 0.1));
  });

  viewpointBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewpointBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const viewId = btn.dataset.view ?? 'default';
      engine.setAutoRotate(false);
      engine.setViewpoint(viewId);
      (autoRotateToggle as unknown as { checked: boolean }).checked = false;
      const currentZoom = engine.cameraController.getZoom();
      zoomSlider.value = currentZoom.toString();
      zoomValue.textContent = `${Math.round(currentZoom * 100)}%`;
    });
  });

  autoRotateToggle.addEventListener('change', () => {
    engine.setAutoRotate((autoRotateToggle as unknown as { checked: boolean }).checked);
  });

  rotateSpeedSlider.addEventListener('input', () => {
    const spd = Number.parseFloat(rotateSpeedSlider.value);
    engine.setAutoRotate(engine.config.autoRotate, spd);
    rotateSpeedValue.textContent = `${Math.round(spd * 100)}%`;
  });

  function setSpinDirection(dir: 1 | -1) {
    if (dir === 1) {
      camDirCwBtn.classList.add('active');
      camDirCcwBtn.classList.remove('active');
    } else {
      camDirCcwBtn.classList.add('active');
      camDirCwBtn.classList.remove('active');
    }
    engine.cameraController.setRotationDirection(dir);
  }

  camDirCcwBtn.addEventListener('click', () => setSpinDirection(-1));
  camDirCwBtn.addEventListener('click', () => setSpinDirection(1));

  camShakeToggle.addEventListener('change', () => {
    engine.setCameraShake((camShakeToggle as unknown as { checked: boolean }).checked);
  });

  camShakeSlider.addEventListener('input', () => {
    const val = Number.parseFloat(camShakeSlider.value);
    camShakeVal.textContent = `${Math.round(val * 100)}%`;
    engine.cameraController.setCameraShakeIntensity(val);
    cameraShakeSegments.forEach(chip => {
      const chipVal = Number.parseFloat(chip.dataset.value || '0');
      chip.classList.toggle('active', Math.abs(chipVal - val) < 0.15);
    });
  });

  cameraShakeSegments.forEach(chip => {
    chip.addEventListener('click', () => {
      cameraShakeSegments.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = Number.parseFloat(chip.dataset.value || '0');
      engine.setCameraShake(val > 0, val);
      camShakeSlider.value = val.toString();
      camShakeVal.textContent = `${Math.round(val * 100)}%`;
      (camShakeToggle as unknown as { checked: boolean }).checked = val > 0;
    });
  });

  dofSegments.forEach(chip => {
    chip.addEventListener('click', () => {
      dofSegments.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });

  return {
    engine,
    tiltUp,
    tiltDown,
    rotateLeft,
    rotateRight,
    cameraReset,
    zoomSlider,
    zoomIn,
    zoomOut,
    zoomValue,
    autoRotateToggle,
    rotateSpeedSlider,
    rotateSpeedValue,
    camDirCcwBtn,
    camDirCwBtn,
    viewpointBtns,
    camShakeToggle,
    camShakeSlider,
    camShakeVal,
    cameraShakeSegments,
    dofSegments
  };
}

// ============================================================================
// SECTION 2: BIDIRECTIONAL SYNCHRONIZATION INTEGRITY
// ============================================================================
console.log('\n--- SECTION 2: Bidirectional Synchronization Invariants ---');

check('2.1: engine.config and cameraController autoRotate property descriptor proxy synchronization', () => {
  const { engine } = mountCameraDrawer();

  // Test config -> cameraController
  engine.config.autoRotate = false;
  assert(engine.cameraController.autoRotate === false, 'Setting config.autoRotate=false must update cameraController');

  engine.config.autoRotate = true;
  assert(engine.cameraController.autoRotate === true, 'Setting config.autoRotate=true must update cameraController');

  // Test cameraController -> config
  engine.cameraController.autoRotate = false;
  assert((engine.config.autoRotate as boolean) === false, 'Setting cameraController.autoRotate=false must reflect in config');

  engine.cameraController.autoRotate = true;
  assert(engine.config.autoRotate === true, 'Setting cameraController.autoRotate=true must reflect in config');
});

check('2.2: engine.config and cameraController autoRotateSpeed property descriptor proxy synchronization', () => {
  const { engine } = mountCameraDrawer();

  engine.config.autoRotateSpeed = 0.85;
  assert(Math.abs(engine.cameraController.autoRotateSpeed - 0.85) < 1e-4, 'config.autoRotateSpeed setter failed');
  assert(Math.abs(engine.config.autoRotateSpeed - 0.85) < 1e-4, 'config.autoRotateSpeed getter failed');

  engine.cameraController.autoRotateSpeed = 1.75;
  assert(Math.abs(engine.config.autoRotateSpeed - 1.75) < 1e-4, 'cameraController speed write not reflected in config');
});

check('2.3: engine.config and cameraController cameraShake property descriptor proxy synchronization', () => {
  const { engine } = mountCameraDrawer();

  engine.config.cameraShake = false;
  assert(engine.cameraController.cameraShakeEnabled === false, 'config.cameraShake=false must disable shake on controller');
  assert(engine.config.cameraShake === false, 'config.cameraShake getter must be false');

  engine.config.cameraShake = true;
  assert(engine.cameraController.cameraShakeEnabled === true, 'config.cameraShake=true must enable shake on controller');

  engine.cameraController.setCameraShakeEnabled(false);
  assert((engine.config.cameraShake as boolean) === false, 'setCameraShakeEnabled(false) must reflect in config');
});

check('2.4: Active render loop NEVER desynchronizes or clobbers cameraController state', () => {
  const { engine } = mountCameraDrawer();
  const silentAudio = createSilentAudioFeatures();

  // Set autoRotate false
  engine.setAutoRotate(false);
  assert(engine.cameraController.autoRotate === false);
  assert(engine.config.autoRotate === false);

  // Render 60 frames
  for (let i = 0; i < 60; i++) {
    engine.render(silentAudio);
    assert(engine.cameraController.autoRotate === false, `Frame ${i}: cameraController.autoRotate was clobbered to true`);
    assert(engine.config.autoRotate === false, `Frame ${i}: config.autoRotate was clobbered to true`);
  }

  // Turn autoRotate back on
  engine.setAutoRotate(true);
  for (let i = 0; i < 30; i++) {
    engine.render(silentAudio);
    assert(engine.cameraController.autoRotate === true, `Frame ${i}: cameraController.autoRotate was clobbered to false`);
    assert(engine.config.autoRotate === true, `Frame ${i}: config.autoRotate was clobbered to false`);
  }
});

// ============================================================================
// SECTION 3: DOM EVENT LIFECYCLE STRESS & RAPID USER INTERACTIONS
// ============================================================================
console.log('\n--- SECTION 3: DOM Event Lifecycle Stress & Rapid Interaction Bursts ---');

check('3.1: Rapid D-Pad clicks and synthetic pointerdown storms do not leak timers or corrupt angles', () => {
  const drawer = mountCameraDrawer();
  const { engine, rotateLeft, rotateRight, tiltUp, tiltDown, autoRotateToggle } = drawer;

  const initialRot = engine.cameraController.getRotAngle();
  const initialTilt = engine.cameraController.getTiltAngle();

  // Simulate rapid 200 pointerdown events on rotateLeft without pointerup (multitouch/burst)
  for (let i = 0; i < 200; i++) {
    rotateLeft.dispatchEvent(new Event('pointerdown'));
    assert(rotateLeft.classList.contains('is-holding'), 'Button should have is-holding class');
    assert((autoRotateToggle as unknown as { checked: boolean }).checked === false, 'autoRotateToggle should uncheck');
    assert(engine.config.autoRotate === false, 'config.autoRotate should be false');
    assert(engine.cameraController.autoRotate === false, 'cameraController.autoRotate should be false');
  }

  // Release pointer
  rotateLeft.dispatchEvent(new Event('pointerup'));
  assert(!rotateLeft.classList.contains('is-holding'), 'is-holding should be removed on pointerup');

  // Verify rotAngle nudged left (negative direction)
  assert(engine.cameraController.getRotAngle() < initialRot, 'Camera should have nudged left');

  // Now rapid bursts across all 4 directions
  for (let i = 0; i < 50; i++) {
    tiltUp.dispatchEvent(new Event('pointerdown'));
    tiltUp.dispatchEvent(new Event('pointerup'));
    rotateRight.dispatchEvent(new Event('pointerdown'));
    rotateRight.dispatchEvent(new Event('pointerup'));
    tiltDown.dispatchEvent(new Event('pointerdown'));
    tiltDown.dispatchEvent(new Event('pointerup'));
  }

  assert(Number.isFinite(engine.camera.position.x), 'Camera x must be finite');
  assert(Number.isFinite(engine.camera.position.y), 'Camera y must be finite');
  assert(Number.isFinite(engine.camera.position.z), 'Camera z must be finite');
  assert(engine.cameraController.getTiltAngle() <= CameraController.MAX_TILT, 'Tilt must clamp <= MAX_TILT');
  assert(engine.cameraController.getTiltAngle() >= CameraController.MIN_TILT, 'Tilt must clamp >= MIN_TILT');
});

check('3.2: Rapid Zoom slider events, out-of-bounds inputs, and Zoom In/Out bursts', () => {
  const drawer = mountCameraDrawer();
  const { engine, zoomSlider, zoomIn, zoomOut, zoomValue } = drawer;

  // 1. Rapid slider sweeps
  for (let i = 0; i <= 100; i++) {
    const val = (i / 100).toFixed(2);
    zoomSlider.value = val;
    zoomSlider.dispatchEvent(new Event('input'));

    const expectedZoom = Number.parseFloat(val);
    assert(Math.abs(engine.cameraController.getZoom() - expectedZoom) < 0.01, `Zoom mismatch at ${val}`);
    assert(zoomValue.textContent === `${Math.round(expectedZoom * 100)}%`, `Readout mismatch at ${val}`);
  }

  // 2. Wild / out-of-bounds values
  const extremeValues = ['-10', '500', 'NaN', 'Infinity', '-Infinity'];
  for (const v of extremeValues) {
    zoomSlider.value = v;
    zoomSlider.dispatchEvent(new Event('input'));
    const zoom = engine.cameraController.getZoom();
    assert(Number.isFinite(zoom), `Zoom was non-finite for input ${v}`);
    assert(zoom >= 0 && zoom <= 1, `Zoom out of [0, 1] for input ${v}`);
    assert(Number.isFinite(engine.camera.position.length()), `Distance non-finite for input ${v}`);
  }

  // 3. Zoom In 20 times (hits ceiling 1.0)
  for (let i = 0; i < 20; i++) {
    zoomIn.click();
  }
  assert(engine.cameraController.getZoom() === 1.0, 'Zoom In must clamp at 1.0');
  assert(zoomSlider.value === '1', 'zoomSlider value must clamp at 1');
  assert(zoomValue.textContent === '100%', 'zoomValue must display 100%');

  // 4. Zoom Out 20 times (hits floor 0.0)
  for (let i = 0; i < 20; i++) {
    zoomOut.click();
  }
  assert(engine.cameraController.getZoom() === 0.0, 'Zoom Out must clamp at 0.0');
  assert(zoomSlider.value === '0', 'zoomSlider value must clamp at 0');
  assert(zoomValue.textContent === '0%', 'zoomValue must display 0%');
});

check('3.3: Rapid Viewpoint button switching interleaving render frames preserves targets', () => {
  const drawer = mountCameraDrawer();
  const { engine, viewpointBtns, autoRotateToggle, zoomSlider } = drawer;
  const silentAudio = createSilentAudioFeatures();

  const viewpoints = ['default', 'top', 'low', 'iso', 'side'];

  for (let iter = 0; iter < 50; iter++) {
    const vpIdx = Math.floor(Math.random() * viewpoints.length);
    const targetBtn = viewpointBtns[vpIdx];
    const targetId = viewpoints[vpIdx];

    targetBtn.click();

    // Verify UI state
    assert(targetBtn.classList.contains('active'), `Button for ${targetId} must be active`);
    assert((autoRotateToggle as unknown as { checked: boolean }).checked === false, 'autoRotateToggle must be unchecked');
    assert(engine.config.autoRotate === false, 'config.autoRotate must be false');
    assert(engine.cameraController.autoRotate === false, 'cameraController.autoRotate must be false');

    // Run 2 frames
    engine.render(silentAudio);
    engine.render(silentAudio);

    assert(engine.config.autoRotate === false, 'config.autoRotate must remain false during transition');
    assert(engine.cameraController.autoRotate === false, 'cameraController.autoRotate must remain false during transition');
  }

  // After 50 rapid switches, select 'top' and let it settle for 60 frames
  const topBtn = viewpointBtns.find(b => b.dataset.view === 'top')!;
  topBtn.click();

  for (let f = 0; f < 60; f++) {
    engine.render(silentAudio);
  }

  assert(engine.cameraController.getActiveViewpoint() === 'top', 'Active viewpoint should be top');
  assert(Math.abs(engine.cameraController.getTiltAngle() - (Math.PI / 2 - 0.05)) < 0.05, 'Settled tilt angle mismatch for top');
  assert(engine.config.autoRotate === false, 'config.autoRotate must remain false');
});

check('3.4: Camera Reset button completely restores front view, zoom, and autoRotate', () => {
  const drawer = mountCameraDrawer();
  const { engine, cameraReset, zoomSlider, zoomValue, autoRotateToggle, viewpointBtns } = drawer;

  // Perturb camera state
  engine.setCameraPosition(1.5, 0.8, 0.9, true);
  engine.setAutoRotate(false);
  (autoRotateToggle as unknown as { checked: boolean }).checked = false;
  viewpointBtns.forEach(b => b.classList.remove('active'));
  viewpointBtns[2].classList.add('active'); // 'low' active

  // Trigger reset
  cameraReset.click();

  assert(engine.cameraController.getRotAngle() === 0, 'rotAngle must reset to 0');
  assert(engine.cameraController.getTiltAngle() === 0, 'tiltAngle must reset to 0');
  assert(engine.cameraController.getZoom() === 0.5, 'zoom must reset to 0.5');
  assert(zoomSlider.value === '0.5', 'zoomSlider must reset to 0.5');
  assert(zoomValue.textContent === '50%', 'zoomValue must reset to 50%');
  assert((autoRotateToggle as unknown as { checked: boolean }).checked === true, 'autoRotateToggle must be checked');
  assert(engine.config.autoRotate === true, 'config.autoRotate must be true');
  assert(engine.cameraController.autoRotate === true, 'cameraController.autoRotate must be true');
  assert(viewpointBtns[0].classList.contains('active'), 'Default viewpoint button must be active');
});

check('3.5: Direction buttons (CW / CCW) and Speed slider update trajectory in sync', () => {
  const drawer = mountCameraDrawer();
  const { engine, camDirCcwBtn, camDirCwBtn, rotateSpeedSlider, rotateSpeedValue } = drawer;

  // Click CCW (-1)
  camDirCcwBtn.click();
  assert(camDirCcwBtn.classList.contains('active'), 'CCW button should be active');
  assert(!camDirCwBtn.classList.contains('active'), 'CW button should not be active');
  assert(engine.cameraController.autoRotateDirection === -1, 'cameraController direction should be -1');

  // Click CW (+1)
  camDirCwBtn.click();
  assert(camDirCwBtn.classList.contains('active'), 'CW button should be active');
  assert(!camDirCcwBtn.classList.contains('active'), 'CCW button should not be active');
  assert(engine.cameraController.autoRotateDirection === 1, 'cameraController direction should be 1');

  // Change speed slider to 0.8
  rotateSpeedSlider.value = '0.8';
  rotateSpeedSlider.dispatchEvent(new Event('input'));
  assert(Math.abs(engine.cameraController.autoRotateSpeed - 0.8) < 0.01, 'cameraController speed mismatch');
  assert(Math.abs(engine.config.autoRotateSpeed - 0.8) < 0.01, 'config speed mismatch');
  assert(rotateSpeedValue.textContent === '80%', 'Speed readout mismatch');
});

check('3.6: Audio Camera Shake toggle, intensity slider, and chips synchronize with render pipeline', () => {
  const drawer = mountCameraDrawer();
  const { engine, camShakeToggle, camShakeSlider, camShakeVal, cameraShakeSegments } = drawer;
  const beatAudio = createBeatDropAudioFeatures(0.95);

  // 1. Toggle shake off
  engine.setAutoRotate(false);
  (camShakeToggle as unknown as { checked: boolean }).checked = false;
  camShakeToggle.dispatchEvent(new Event('change'));
  assert(engine.cameraController.cameraShakeEnabled === false, 'cameraController shake should be false');
  assert(engine.config.cameraShake === false, 'config shake should be false');

  // Render beat frame -> no shake displacement
  const preBeatPos = engine.camera.position.clone();
  engine.render(beatAudio);
  assert(engine.cameraController.getShakeOffset().length() === 0, 'Disabled shake must produce zero shake offset');
  assert(engine.camera.position.distanceTo(preBeatPos) < 1e-4, 'Disabled shake without autoRotate must produce zero displacement');

  // 2. Click Strong chip (1.0)
  const strongChip = cameraShakeSegments.find(c => c.dataset.value === '1.0')!;
  strongChip.click();
  assert(strongChip.classList.contains('active'), 'Strong chip should be active');
  assert(engine.config.cameraShake === true, 'config shake should be true');
  assert(engine.cameraController.cameraShakeEnabled === true, 'controller shake should be true');
  assert(camShakeSlider.value === '1', 'slider value should be 1');
  assert(camShakeVal.textContent === '100%', 'readout should be 100%');
  assert((camShakeToggle as unknown as { checked: boolean }).checked === true, 'toggle should be checked');

  // Render beat frame -> kick displaces camera
  const initialPos = engine.camera.position.clone();
  engine.render(beatAudio);
  const kickPos = engine.camera.position.clone();
  assert(kickPos.distanceTo(initialPos) > 0.05, 'Strong shake kick must displace camera position');
  assert(Number.isFinite(kickPos.x) && Number.isFinite(kickPos.y) && Number.isFinite(kickPos.z), 'Kick coords must be finite');

  // 3. Click Off chip (0)
  const offChip = cameraShakeSegments.find(c => c.dataset.value === '0')!;
  offChip.click();
  assert(offChip.classList.contains('active'), 'Off chip should be active');
  assert(engine.config.cameraShake === false, 'config shake should be false');
  assert(engine.cameraController.cameraShakeEnabled === false, 'controller shake should be false');
  assert((camShakeToggle as unknown as { checked: boolean }).checked === false, 'toggle should be unchecked');
});

// ============================================================================
// SECTION 4: CHAOS GENERATOR & ADVERSARIAL FUZZING (3,000 ACTIONS)
// ============================================================================
console.log('\n--- SECTION 4: Chaos Stress Generator (3,000 Interleaved Operations) ---');

check('4.1: 3,000 randomized DOM + engine actions maintain strict invariants, finite coords, and bounded distance', () => {
  const drawer = mountCameraDrawer();
  const {
    engine,
    tiltUp,
    tiltDown,
    rotateLeft,
    rotateRight,
    cameraReset,
    zoomSlider,
    zoomIn,
    zoomOut,
    autoRotateToggle,
    rotateSpeedSlider,
    camDirCcwBtn,
    camDirCwBtn,
    viewpointBtns,
    camShakeToggle,
    camShakeSlider,
    cameraShakeSegments
  } = drawer;

  const audioBeat = createBeatDropAudioFeatures(0.9);
  const audioSilent = createSilentAudioFeatures();

  const actions = [
    'dpadUp', 'dpadDown', 'dpadLeft', 'dpadRight',
    'zoomIn', 'zoomOut', 'zoomInput',
    'viewpointClick',
    'resetClick',
    'autoRotateToggle', 'speedInput',
    'dirCcw', 'dirCw',
    'shakeToggle', 'shakeChip', 'shakeSlider',
    'renderBeat', 'renderSilent'
  ];

  for (let i = 0; i < 3000; i++) {
    const act = actions[Math.floor(Math.random() * actions.length)];

    switch (act) {
      case 'dpadUp':
        tiltUp.dispatchEvent(new Event('pointerdown'));
        tiltUp.dispatchEvent(new Event('pointerup'));
        break;
      case 'dpadDown':
        tiltDown.dispatchEvent(new Event('pointerdown'));
        tiltDown.dispatchEvent(new Event('pointerup'));
        break;
      case 'dpadLeft':
        rotateLeft.dispatchEvent(new Event('pointerdown'));
        rotateLeft.dispatchEvent(new Event('pointerup'));
        break;
      case 'dpadRight':
        rotateRight.dispatchEvent(new Event('pointerdown'));
        rotateRight.dispatchEvent(new Event('pointerup'));
        break;
      case 'zoomIn':
        zoomIn.click();
        break;
      case 'zoomOut':
        zoomOut.click();
        break;
      case 'zoomInput':
        zoomSlider.value = (Math.random() * 1.4 - 0.2).toFixed(2);
        zoomSlider.dispatchEvent(new Event('input'));
        break;
      case 'viewpointClick': {
        const vp = viewpointBtns[Math.floor(Math.random() * viewpointBtns.length)];
        vp.click();
        break;
      }
      case 'resetClick':
        cameraReset.click();
        break;
      case 'autoRotateToggle': {
        const checked = Math.random() > 0.5;
        (autoRotateToggle as unknown as { checked: boolean }).checked = checked;
        autoRotateToggle.dispatchEvent(new Event('change'));
        break;
      }
      case 'speedInput':
        rotateSpeedSlider.value = Math.random().toFixed(2);
        rotateSpeedSlider.dispatchEvent(new Event('input'));
        break;
      case 'dirCcw':
        camDirCcwBtn.click();
        break;
      case 'dirCw':
        camDirCwBtn.click();
        break;
      case 'shakeToggle': {
        const sChecked = Math.random() > 0.5;
        (camShakeToggle as unknown as { checked: boolean }).checked = sChecked;
        camShakeToggle.dispatchEvent(new Event('change'));
        break;
      }
      case 'shakeChip': {
        const chip = cameraShakeSegments[Math.floor(Math.random() * cameraShakeSegments.length)];
        chip.click();
        break;
      }
      case 'shakeSlider':
        camShakeSlider.value = Math.random().toFixed(2);
        camShakeSlider.dispatchEvent(new Event('input'));
        break;
      case 'renderBeat':
        engine.render(audioBeat);
        break;
      case 'renderSilent':
        engine.render(audioSilent);
        break;
    }

    // Assert strict invariants after EVERY single action
    assert(
      engine.config.autoRotate === engine.cameraController.autoRotate,
      `Iter ${i} (${act}): config.autoRotate (${engine.config.autoRotate}) !== controller.autoRotate (${engine.cameraController.autoRotate})`
    );

    assert(
      Math.abs(engine.config.autoRotateSpeed - engine.cameraController.autoRotateSpeed) < 1e-4,
      `Iter ${i} (${act}): speed desync (config ${engine.config.autoRotateSpeed} vs ctrl ${engine.cameraController.autoRotateSpeed})`
    );

    assert(
      engine.config.cameraShake === engine.cameraController.cameraShakeEnabled,
      `Iter ${i} (${act}): shake desync (config ${engine.config.cameraShake} vs ctrl ${engine.cameraController.cameraShakeEnabled})`
    );

    const pos = engine.camera.position;
    assert(Number.isFinite(pos.x), `Iter ${i} (${act}): pos.x is ${pos.x}`);
    assert(Number.isFinite(pos.y), `Iter ${i} (${act}): pos.y is ${pos.y}`);
    assert(Number.isFinite(pos.z), `Iter ${i} (${act}): pos.z is ${pos.z}`);

    const dist = pos.length();
    assert(
      dist >= 4.0 && dist <= 30.0,
      `Iter ${i} (${act}): distance ${dist.toFixed(2)} out of safe spherical envelope [4.0, 30.0]`
    );
  }
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('\n========================================================================');
console.log(`TOTAL CHECKS: ${totalChecks}`);
console.log(`PASSED:       ${passedChecks}`);
console.log(`FAILED:       ${failedChecks}`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error(`Verification FAILED with ${failedChecks} failures:`);
  for (const f of failures) {
    console.error(` - [FAIL] ${f.title}: ${f.error}`);
  }
  process.exit(1);
} else {
  console.log('✓ ALL ADVERSARIAL STRESS CHALLENGES PASSED PERFECTLY!\n');
  process.exit(0);
}
