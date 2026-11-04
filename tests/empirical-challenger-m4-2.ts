import * as THREE from 'three';
import { CameraController, CANONICAL_VIEWPOINTS } from '../src/engine/CameraController';
import { RenderEngine } from '../src/engine/RenderEngine';
import { getTheme } from '../src/themes/themes';
import { setupTestEnvironment } from './harness/env';
import { createBeatDropAudioFeatures, createSilentAudioFeatures } from './harness/fixtures';

// ---------------------------------------------------------------------------
// EMPIRICAL CHALLENGER STRESS HARNESS PART 2: MILESTONE 4 (#42 feat(camera))
// IN-FLIGHT RENDER TRANSITIONS & D-PAD TIMER LEAK VERIFICATION
// ---------------------------------------------------------------------------

console.log('========================================================================');
console.log('  CHALLENGER STRESS HARNESS PART 2: IN-FLIGHT TRANSITIONS & TIMERS     ');
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
// SECTION 1: IN-FLIGHT VIEWPOINT CONVERGENCE & STATIONARITY (100+ FRAMES)
// ===========================================================================
console.log('--- SECTION 1: In-Flight Viewpoint Convergence & Zero-Drift Stationarity ---');

const canonicalKeys = ['default', 'top', 'low', 'iso', 'side'];

for (const vpId of canonicalKeys) {
  check(`1.1.${vpId}: setViewpoint('${vpId}') from active auto-orbit converges and stays stationary`, () => {
    const engine = new RenderEngine(canvas, mockTheme);
    const silentAudio = createSilentAudioFeatures();

    // Start with auto-rotate ON and spin for 30 frames
    engine.setAutoRotate(true, 1.2, 1);
    for (let f = 0; f < 30; f++) engine.render(silentAudio);
    assert(engine.cameraController.autoRotate === true, 'autoRotate must be true during initial orbit');

    // Initiate in-flight transition
    const targetVp = CANONICAL_VIEWPOINTS[vpId];
    engine.setViewpoint(vpId, false);

    // Render 100 frames
    for (let f = 0; f < 100; f++) {
      engine.render(silentAudio);
    }

    const settledRot = engine.cameraController.getRotAngle();
    const settledTilt = engine.cameraController.getTiltAngle();
    const settledZoom = engine.cameraController.getZoom();

    // Verify convergence to target viewpoint
    const rotDiff = Math.abs(settledRot - targetVp.rotAngle);
    const tiltDiff = Math.abs(settledTilt - targetVp.tiltAngle);
    const zoomDiff = Math.abs(settledZoom - targetVp.zoom);

    assert(rotDiff < 0.005, `${vpId}: rotAngle mismatch: expected ${targetVp.rotAngle}, got ${settledRot} (diff ${rotDiff})`);
    assert(tiltDiff < 0.005, `${vpId}: tiltAngle mismatch: expected ${targetVp.tiltAngle}, got ${settledTilt} (diff ${tiltDiff})`);
    assert(zoomDiff < 0.01, `${vpId}: zoom mismatch: expected ${targetVp.zoom}, got ${settledZoom} (diff ${zoomDiff})`);

    assert(engine.cameraController.autoRotate === false, `${vpId}: autoRotate must be false after viewpoint transition`);
    assert(engine.config.autoRotate === false, `${vpId}: config.autoRotate must be false after viewpoint transition`);
    assert(engine.cameraController.isTransitioning === false, `${vpId}: isTransitioning must be false after 100 frames`);

    // Verify STRICT stationarity across an additional 100 render frames
    const posBeforeStationary = engine.camera.position.clone();
    for (let f = 0; f < 100; f++) {
      engine.render(silentAudio);
    }

    const posAfterStationary = engine.camera.position.clone();
    const drift = posBeforeStationary.distanceTo(posAfterStationary);
    assert(drift < 1e-4, `${vpId}: camera drifted during stationary hold: drift = ${drift}`);
    assert(Math.abs(engine.cameraController.getRotAngle() - settledRot) < 1e-5, `${vpId}: rotAngle drifted during stationary hold`);
    assert(Math.abs(engine.cameraController.getTiltAngle() - settledTilt) < 1e-5, `${vpId}: tiltAngle drifted during stationary hold`);
  });
}

check('1.2: In-flight viewpoint convergence under heavy audio beat shake impulses', () => {
  const engine = new RenderEngine(canvas, mockTheme);
  const beatAudio = createBeatDropAudioFeatures(0.95);

  engine.setAutoRotate(true, 0.8, -1);
  for (let f = 0; f < 20; f++) engine.render(beatAudio);

  for (const vpId of ['iso', 'top', 'side', 'low', 'default']) {
    const targetVp = CANONICAL_VIEWPOINTS[vpId];
    engine.setViewpoint(vpId, false);

    for (let f = 0; f < 100; f++) {
      engine.render(beatAudio);
    }

    assert(Math.abs(engine.cameraController.getRotAngle() - targetVp.rotAngle) < 0.005,
      `Under beats, ${vpId} rotAngle failed to converge: got ${engine.cameraController.getRotAngle()}, expected ${targetVp.rotAngle}`);
    assert(Math.abs(engine.cameraController.getTiltAngle() - targetVp.tiltAngle) < 0.005,
      `Under beats, ${vpId} tiltAngle failed to converge: got ${engine.cameraController.getTiltAngle()}, expected ${targetVp.tiltAngle}`);
    assert(engine.cameraController.autoRotate === false, `Under beats, autoRotate must stay false for ${vpId}`);
  }
});

check('1.3: Rapid mid-flight viewpoint interruption cascades settle cleanly at final target', () => {
  const engine = new RenderEngine(canvas, mockTheme);
  const silentAudio = createSilentAudioFeatures();

  // Switch rapidly mid-transition
  engine.setViewpoint('top', false);
  for (let f = 0; f < 10; f++) engine.render(silentAudio);

  engine.setViewpoint('low', false);
  for (let f = 0; f < 15; f++) engine.render(silentAudio);

  engine.setViewpoint('side', false);
  for (let f = 0; f < 120; f++) engine.render(silentAudio);

  const targetSide = CANONICAL_VIEWPOINTS['side'];
  assert(Math.abs(engine.cameraController.getRotAngle() - targetSide.rotAngle) < 0.005, 'Mid-flight interrupt failed to settle at side rot');
  assert(Math.abs(engine.cameraController.getTiltAngle() - targetSide.tiltAngle) < 0.005, 'Mid-flight interrupt failed to settle at side tilt');
  assert(engine.cameraController.isTransitioning === false, 'Transition flag not cleared after settling');

  // Verify stationary hold for 60 more frames
  const posAtSettle = engine.camera.position.clone();
  for (let f = 0; f < 60; f++) engine.render(silentAudio);
  assert(engine.camera.position.distanceTo(posAtSettle) < 1e-4, 'Drifted after mid-flight interrupt settling');
});

// ===========================================================================
// SECTION 2: D-PAD MULTI-TOUCH / RAPID CLICKS & TIMER LEAK HARNESS
// ===========================================================================
console.log('\n--- SECTION 2: D-Pad Multi-Touch / Rapid Clicks & Timer Leak Stress ---');

// Mock Timer Tracker to strictly verify zero orphaned intervals/timeouts
interface ActiveTimer {
  id: number;
  type: 'timeout' | 'interval';
  fn: Function;
  delay: number;
  cleared: boolean;
}

class TimerOracle {
  private nextId = 1;
  public timers: Map<number, ActiveTimer> = new Map();
  private originalSetTimeout = window.setTimeout;
  private originalClearTimeout = window.clearTimeout;
  private originalSetInterval = window.setInterval;
  private originalClearInterval = window.clearInterval;

  public install(): void {
    const self = this;

    (window as any).setTimeout = function (fn: Function, delay?: number): number {
      const id = self.nextId++;
      const timer: ActiveTimer = { id, type: 'timeout', fn, delay: delay || 0, cleared: false };
      self.timers.set(id, timer);
      return id;
    };

    (window as any).clearTimeout = function (id: number): void {
      const timer = self.timers.get(id);
      if (timer) {
        timer.cleared = true;
        self.timers.delete(id);
      }
    };

    (window as any).setInterval = function (fn: Function, delay?: number): number {
      const id = self.nextId++;
      const timer: ActiveTimer = { id, type: 'interval', fn, delay: delay || 0, cleared: false };
      self.timers.set(id, timer);
      return id;
    };

    (window as any).clearInterval = function (id: number): void {
      const timer = self.timers.get(id);
      if (timer) {
        timer.cleared = true;
        self.timers.delete(id);
      }
    };
  }

  public uninstall(): void {
    window.setTimeout = this.originalSetTimeout;
    window.clearTimeout = this.originalClearTimeout;
    window.setInterval = this.originalSetInterval;
    window.clearInterval = this.originalClearInterval;
  }

  public getActiveCount(type?: 'timeout' | 'interval'): number {
    if (!type) return this.timers.size;
    let count = 0;
    for (const t of this.timers.values()) {
      if (t.type === type && !t.cleared) count++;
    }
    return count;
  }

  public advanceTimeout(id: number): void {
    const timer = this.timers.get(id);
    if (timer && timer.type === 'timeout' && !timer.cleared) {
      this.timers.delete(id);
      timer.fn();
    }
  }

  public tickInterval(id: number): void {
    const timer = this.timers.get(id);
    if (timer && timer.type === 'interval' && !timer.cleared) {
      timer.fn();
    }
  }

  public clearAll(): void {
    this.timers.clear();
  }
}

check('2.1: 100 rapid startGlide calls on D-pad arrow create zero orphaned timers', () => {
  const oracle = new TimerOracle();
  oracle.install();

  try {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const ctrl = new CameraController(camera);

    // Replicate the exact setupDpadArrow structure from src/main.ts
    const btn = document.createElement('button');
    let glideInterval: number | null = null;
    let glideTimeout: number | null = null;

    const startGlide = () => {
      stopGlide();
      btn.classList.add('is-holding');
      ctrl.nudge('orbit', 1, 0.1);

      glideTimeout = window.setTimeout(() => {
        glideInterval = window.setInterval(() => {
          ctrl.nudge('orbit', 1, 0.03);
        }, 30);
      }, 250);
    };

    const stopGlide = () => {
      btn.classList.remove('is-holding');
      if (glideTimeout !== null) {
        window.clearTimeout(glideTimeout);
        glideTimeout = null;
      }
      if (glideInterval !== null) {
        window.clearInterval(glideInterval);
        glideInterval = null;
      }
    };

    // 100 rapid clicks without pointerup
    for (let i = 0; i < 100; i++) {
      startGlide();
      // At any point during rapid presses, only 1 timeout must be active, 0 intervals
      assert(oracle.getActiveCount('timeout') === 1, `Expected exactly 1 active timeout, found ${oracle.getActiveCount('timeout')} at iter ${i}`);
      assert(oracle.getActiveCount('interval') === 0, `Expected 0 active intervals during rapid clicks, found ${oracle.getActiveCount('interval')}`);
    }

    // Now let the hold timeout fire (simulate > 250ms hold)
    const activeTimeoutId = Array.from(oracle.timers.keys())[0];
    oracle.advanceTimeout(activeTimeoutId);

    // Now 1 interval should be active, 0 timeouts
    assert(oracle.getActiveCount('interval') === 1, `Expected 1 active interval after hold threshold, found ${oracle.getActiveCount('interval')}`);
    assert(oracle.getActiveCount('timeout') === 0, `Expected 0 timeouts after threshold, found ${oracle.getActiveCount('timeout')}`);

    // Fire 5 interval ticks
    const activeIntervalId = Array.from(oracle.timers.keys())[0];
    for (let t = 0; t < 5; t++) {
      oracle.tickInterval(activeIntervalId);
    }

    // While interval is running, simulate another 50 rapid interrupted presses
    for (let i = 0; i < 50; i++) {
      startGlide();
      assert(oracle.getActiveCount('interval') === 0, `Previous interval was not cleaned up on re-entrance at iter ${i}`);
      assert(oracle.getActiveCount('timeout') === 1, `Expected exactly 1 pending timeout at iter ${i}`);
    }

    // Now release button (pointerup)
    stopGlide();

    // Verify completely clean: 0 active timers
    assert(oracle.getActiveCount() === 0, `Leaked timers after stopGlide: ${oracle.getActiveCount()} active timers remain`);
    assert(!btn.classList.contains('is-holding'), 'is-holding class was not removed');
  } finally {
    oracle.uninstall();
  }
});

check('2.2: Multi-touch concurrent D-pad presses across all 4 directions leave zero leaked timers', () => {
  const oracle = new TimerOracle();
  oracle.install();

  try {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    const ctrl = new CameraController(camera);

    interface DpadBinding {
      btn: HTMLElement;
      start: () => void;
      stop: () => void;
    }

    const directions: Array<[string, 'orbit' | 'tilt', 1 | -1]> = [
      ['rotateLeft', 'orbit', -1],
      ['rotateRight', 'orbit', 1],
      ['tiltUp', 'tilt', 1],
      ['tiltDown', 'tilt', -1]
    ];

    const bindings: DpadBinding[] = directions.map(([name, axis, dir]) => {
      const btn = document.createElement('button');
      btn.id = name;
      let glideInterval: number | null = null;
      let glideTimeout: number | null = null;

      const stop = () => {
        btn.classList.remove('is-holding');
        if (glideTimeout !== null) {
          window.clearTimeout(glideTimeout);
          glideTimeout = null;
        }
        if (glideInterval !== null) {
          window.clearInterval(glideInterval);
          glideInterval = null;
        }
      };

      const start = () => {
        stop();
        btn.classList.add('is-holding');
        ctrl.nudge(axis, dir, 0.1);
        glideTimeout = window.setTimeout(() => {
          glideInterval = window.setInterval(() => {
            ctrl.nudge(axis, dir, 0.03);
          }, 30);
        }, 250);
      };

      return { btn, start, stop };
    });

    // Simulate chaotic multi-touch flurry: 1,000 randomized events
    for (let step = 0; step < 1000; step++) {
      const b = bindings[Math.floor(Math.random() * bindings.length)];
      if (Math.random() > 0.3) {
        b.start();
      } else {
        b.stop();
      }

      // Randomly advance timeouts or intervals
      if (Math.random() > 0.7 && oracle.timers.size > 0) {
        const ids = Array.from(oracle.timers.keys());
        const chosenId = ids[Math.floor(Math.random() * ids.length)];
        const timer = oracle.timers.get(chosenId);
        if (timer?.type === 'timeout') oracle.advanceTimeout(chosenId);
        else if (timer?.type === 'interval') oracle.tickInterval(chosenId);
      }

      // Assert total active timers never exceeds total number of buttons (4)
      assert(oracle.getActiveCount() <= 4, `Timer count exploded to ${oracle.getActiveCount()} during multi-touch stress`);
    }

    // Release all 4 buttons
    for (const b of bindings) {
      b.stop();
    }

    // Must be strictly 0 active timers
    assert(oracle.getActiveCount() === 0, `Timers leaked after releasing all buttons: ${oracle.getActiveCount()}`);
  } finally {
    oracle.uninstall();
  }
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
  console.log('✓ ALL IN-FLIGHT TRANSITION & TIMER LEAK STRESS CHECKS PASSED!\n');
  process.exit(0);
}
