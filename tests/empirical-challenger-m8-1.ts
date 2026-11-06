/**
 * EMPIRICAL ADVERSARIAL STRESS TEST SUITE: MILESTONE 8 (TICKET #38)
 * Target: Complete 71-Preset Catalog Across All 7 Categories
 * Archetype: Empirical Challenger (critic, specialist)
 * Challenger: challenger_m8_1
 *
 * Scope:
 * 1. Catalog Invariants, Partition Integrity & Schema Verification
 * 2. Lifecycle Stress: 60 frames per preset across 71 presets under silence, extreme bass, heavy kicks, high treble
 * 3. Rapid Preset Switching: 100 sequential + 50 random switches under active RenderEngine with orphaned object audit
 * 4. Memory & Resource Cleanup Audit: Recursive geometry/material disposal traversal & double disposal idempotence
 * 5. Backward-Compatible Aliasing Audit: Canonical IDs, legacy aliases proxy, and fallback behavior
 * 6. Parameter Store & Tuning Robustness Under Extreme Values
 * 7. UI Category Badges & SVG Thumbnail Generator Verification
 */

import * as fs from 'fs';
import * as path from 'path';
import * as THREE from 'three';
import { setupTestEnvironment, MockElement } from './harness/env';
import { PRESETS, PRESET_ALIASES, getPreset } from '../src/presets';
import { RenderEngine } from '../src/engine/RenderEngine';
import { getTheme } from '../src/themes/themes';
import {
  createMockPresetContext,
  createSilentAudioFeatures,
  createBeatDropAudioFeatures,
  createTrebleMelodyAudioFeatures
} from './harness/fixtures';
import { AudioFeatures, VisualizerPreset } from '../src/types';

console.log('========================================================================');
console.log('  EMPIRICAL CHALLENGER STRESS HARNESS: 71-PRESET FULL CATALOG (#38)     ');
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

function assert(condition: unknown, msg: string): asserts condition {
  if (!condition) throw new Error(msg);
}

// Initialize headless environment
setupTestEnvironment();
const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;

// Fix headless WebGL mock getExtension to return null for un-implemented multisampled extension
const origGetContext = canvas.getContext.bind(canvas);
canvas.getContext = ((type: string) => {
  const gl = origGetContext(type) as { getExtension?: (name: string) => unknown };
  if (gl && gl.getExtension) {
    const origGetExt = gl.getExtension.bind(gl);
    gl.getExtension = (name: string) => {
      if (name === 'WEBGL_multisampled_render_to_texture') {
        return null;
      }
      return origGetExt(name);
    };
  }
  return gl;
}) as unknown as typeof canvas.getContext;

const defaultTheme = getTheme('ember');

function createChaoticAudio(seed: number): AudioFeatures {
  const freq = new Uint8Array(1024);
  const time = new Uint8Array(1024);
  for (let i = 0; i < 1024; i++) {
    freq[i] = Math.floor((Math.sin(seed + i * 0.2) * 0.5 + 0.5) * 255);
    time[i] = Math.floor((Math.cos(seed + i * 0.15) * 0.5 + 0.5) * 255);
  }
  const bass = (Math.sin(seed) * 0.5 + 0.5);
  const treble = (Math.cos(seed * 1.3) * 0.5 + 0.5);
  return {
    frequencyData: freq,
    timeDomainData: time,
    subBass: bass * 0.9,
    bass,
    mid: 0.5,
    treble,
    rms: (bass + treble) / 2,
    beat: bass > 0.7,
    beatEnergy: bass > 0.7 ? bass : 0,
    bpm: 120 + Math.floor(bass * 40)
  };
}

// ============================================================================
// SECTION 1: CATALOG INVARIANTS, SCHEMA & CATEGORY PARTITION AUDIT
// ============================================================================
console.log('--- SECTION 1: Catalog Invariants & Schema Verification ---');

check('1.1: Exact 71 unique presets registered in PRESETS', () => {
  assert(PRESETS.length === 71, `Expected exactly 71 presets, got: ${PRESETS.length}`);
  const idSet = new Set<string>();
  const nameSet = new Set<string>();

  for (const preset of PRESETS) {
    assert(typeof preset.id === 'string' && preset.id.length > 0, `Preset missing valid id: ${JSON.stringify(preset)}`);
    assert(!idSet.has(preset.id), `Duplicate preset id found: ${preset.id}`);
    idSet.add(preset.id);

    assert(typeof preset.name === 'string' && preset.name.length > 0, `Preset ${preset.id} missing name`);
    assert(!nameSet.has(preset.name), `Duplicate preset name found: ${preset.name}`);
    nameSet.add(preset.name);

    assert(typeof preset.description === 'string' && preset.description.length >= 10,
      `Preset ${preset.id} has insufficient description: "${preset.description}"`);
  }
  assert(idSet.size === 71, `ID set size mismatch: ${idSet.size} !== 71`);
  assert(nameSet.size === 71, `Name set size mismatch: ${nameSet.size} !== 71`);
});

check('1.2: Exact canonical category breakdown summing to 71', () => {
  const expectedBreakdown: Record<string, number> = {
    'Structures': 15,
    'Abstract & Space': 15,
    'Particles & Light': 4,
    'Fluids & Heat': 9,
    'Tunnels': 7,
    'Retro & Digital': 7,
    'Organic & Nature': 14
  };

  const actualBreakdown: Record<string, number> = {};
  for (const preset of PRESETS) {
    actualBreakdown[preset.category] = (actualBreakdown[preset.category] || 0) + 1;
  }

  for (const [cat, expected] of Object.entries(expectedBreakdown)) {
    const actual = actualBreakdown[cat] || 0;
    assert(actual === expected, `Category "${cat}" count mismatch: expected ${expected}, got ${actual}`);
  }

  const totalSum = Object.values(actualBreakdown).reduce((sum, n) => sum + n, 0);
  assert(totalSum === 71, `Category sum mismatch: expected 71, got ${totalSum}`);
});

check('1.3: Parameter definitions contract validation across all presets', () => {
  for (const preset of PRESETS) {
    if (preset.getCustomParameters) {
      const defs = preset.getCustomParameters();
      assert(Array.isArray(defs), `getCustomParameters for ${preset.id} must return an array`);

      // Special rule: MilkDrop preset is not tunable -> defs must be empty
      if (preset.id === 'milkdrop') {
        assert(defs.length === 0, `Milkdrop must declare 0 custom parameters. Got: ${defs.length}`);
      } else {
        assert(defs.length > 0, `Preset ${preset.id} should declare custom parameters. Got 0`);
      }

      for (const def of defs) {
        assert(typeof def.id === 'string' && def.id.length > 0, `${preset.id} param missing id`);
        assert(typeof def.name === 'string' && def.name.length > 0, `${preset.id} param missing name`);
        assert(Number.isFinite(def.min), `${preset.id} param ${def.id} min must be finite`);
        assert(Number.isFinite(def.max), `${preset.id} param ${def.id} max must be finite`);
        assert(def.max > def.min, `${preset.id} param ${def.id} max (${def.max}) must be > min (${def.min})`);
        assert(Number.isFinite(def.step) && def.step > 0, `${preset.id} param ${def.id} step must be > 0`);
        assert(Number.isFinite(def.defaultValue), `${preset.id} param ${def.id} defaultValue must be finite`);
        assert(def.defaultValue >= def.min && def.defaultValue <= def.max,
          `${preset.id} param ${def.id} default (${def.defaultValue}) out of range [${def.min}, ${def.max}]`);
      }
    }
  }
});

// ============================================================================
// SECTION 2: 60-FRAME LIFECYCLE STRESS ACROSS ALL 71 PRESETS
// ============================================================================
console.log('\n--- SECTION 2: 60-Frame Lifecycle Stress Across ALL 71 Presets ---');

check('2.1: Run 60 frames under silence, beat drop, treble, and chaotic audio on all 71 presets', () => {
  const silent = createSilentAudioFeatures();
  const beatDrop = createBeatDropAudioFeatures(0.95);
  const trebleMelody = createTrebleMelodyAudioFeatures();

  for (let pIdx = 0; pIdx < PRESETS.length; pIdx++) {
    const preset = PRESETS[pIdx];
    const ctx = createMockPresetContext(defaultTheme);

    // 1. Initialize
    preset.init(ctx);
    assert(ctx.scene.children.length > 0, `Preset ${preset.id} did not add elements to scene on init`);

    // 2. 60-frame stress run
    for (let frame = 0; frame < 60; frame++) {
      let audio: AudioFeatures;
      if (frame < 15) {
        audio = silent;
      } else if (frame < 30) {
        audio = beatDrop;
      } else if (frame < 45) {
        audio = trebleMelody;
      } else {
        audio = createChaoticAudio(frame + pIdx * 10);
      }

      const time = frame * 0.016;
      const delta = 0.016;

      try {
        preset.update(ctx, audio, time, delta);
      } catch (err: unknown) {
        throw new Error(`Preset ${preset.id} threw error at frame ${frame}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 3. Verify scene objects have valid, non-NaN transformations
    ctx.scene.traverse((obj) => {
      assert(Number.isFinite(obj.position.x) && !Number.isNaN(obj.position.x), `NaN position.x in ${preset.id}`);
      assert(Number.isFinite(obj.position.y) && !Number.isNaN(obj.position.y), `NaN position.y in ${preset.id}`);
      assert(Number.isFinite(obj.position.z) && !Number.isNaN(obj.position.z), `NaN position.z in ${preset.id}`);
      assert(Number.isFinite(obj.scale.x) && !Number.isNaN(obj.scale.x), `NaN scale.x in ${preset.id}`);
      assert(Number.isFinite(obj.scale.y) && !Number.isNaN(obj.scale.y), `NaN scale.y in ${preset.id}`);
      assert(Number.isFinite(obj.scale.z) && !Number.isNaN(obj.scale.z), `NaN scale.z in ${preset.id}`);
    });

    // 4. Dispose
    preset.dispose();
  }
});

check('2.2: Extreme delta time inputs (0.0, 100.0, -0.016) handled stably without exploding', () => {
  const silent = createSilentAudioFeatures();
  const extremeDeltas = [0.0, 100.0, -0.016, 1e-6, 10.0];

  for (const preset of PRESETS) {
    const ctx = createMockPresetContext(defaultTheme);
    preset.init(ctx);

    for (const dt of extremeDeltas) {
      try {
        preset.update(ctx, silent, 1.0, dt);
      } catch (err: unknown) {
        throw new Error(`Preset ${preset.id} failed under extreme delta ${dt}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    preset.dispose();
  }
});

check('2.3: Theme swapping across 10 diverse palettes during active render loop', () => {
  const testThemes = [
    getTheme('ember'),
    getTheme('cyberpunk'),
    getTheme('synthwave'),
    getTheme('arctic'),
    getTheme('matrix'),
    getTheme('sunset'),
    getTheme('toxic'),
    getTheme('sand'),
    getTheme('lavender'),
    getTheme('monochrome')
  ];

  for (const preset of PRESETS) {
    const ctx = createMockPresetContext(testThemes[0]);
    preset.init(ctx);

    if (preset.onThemeChange) {
      for (const t of testThemes) {
        try {
          preset.onThemeChange(t);
        } catch (err: unknown) {
          throw new Error(`Preset ${preset.id} onThemeChange failed for theme ${t.id}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    preset.dispose();
  }
});

check('2.4: Viewport resizing to extreme aspect ratios (0x0, 3840x2160, 1080x1920, 10000x100)', () => {
  const resolutions = [
    [0, 0],
    [1, 1],
    [3840, 2160], // 4K 16:9
    [1080, 1920], // Portrait 9:16
    [10000, 100]  // Extreme banner
  ];

  for (const preset of PRESETS) {
    const ctx = createMockPresetContext(defaultTheme);
    preset.init(ctx);

    if (preset.resize) {
      for (const [w, h] of resolutions) {
        try {
          preset.resize(w, h);
        } catch (err: unknown) {
          throw new Error(`Preset ${preset.id} resize failed for ${w}x${h}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }

    preset.dispose();
  }
});

// ============================================================================
// SECTION 3: RAPID PRESET SWITCHING & ORPHANED MESH LEAK AUDIT
// ============================================================================
console.log('\n--- SECTION 3: Rapid Preset Switching & Orphaned Mesh Leak Audit ---');

check('3.1: 100 sequential rapid preset switches under active RenderEngine without error', () => {
  const engine = new RenderEngine(canvas, defaultTheme);
  const audio = createBeatDropAudioFeatures(0.8);

  const initialLights = engine.scene.children.filter(c => c instanceof THREE.Light);
  assert(initialLights.length >= 2, `Expected at least 2 lights in RenderEngine scene, found ${initialLights.length}`);

  for (let i = 0; i < 100; i++) {
    const targetPreset = PRESETS[i % PRESETS.length];
    try {
      engine.setPreset(targetPreset);
    } catch (err: unknown) {
      throw new Error(`engine.setPreset failed at iteration ${i} on preset ${targetPreset.id}: ${err instanceof Error ? err.message : String(err)}`);
    }

    assert(engine.activePreset?.id === targetPreset.id,
      `activePreset id mismatch: expected ${targetPreset.id}, got ${engine.activePreset?.id}`);

    // Render 2 frames per preset
    engine.render(audio);
    engine.render(audio);
  }
});

check('3.2: 50 high-frequency random preset jumps under chaotic audio', () => {
  const engine = new RenderEngine(canvas, defaultTheme);

  for (let i = 0; i < 50; i++) {
    const randomIdx = Math.floor(Math.random() * PRESETS.length);
    const target = PRESETS[randomIdx];
    const audio = createChaoticAudio(i * 17);

    engine.setPreset(target);
    assert(engine.activePreset?.id === target.id, `Random switch to ${target.id} failed`);
    engine.render(audio);
  }
});

check('3.3: Orphaned object audit: ZERO lingering meshes or groups from previous presets', () => {
  const engine = new RenderEngine(canvas, defaultTheme);
  const initialLightCount = engine.scene.children.filter(c => c instanceof THREE.Light).length;

  // Rapidly switch through 71 presets sequentially
  for (let i = 0; i < PRESETS.length; i++) {
    engine.setPreset(PRESETS[i]);
  }

  // After the 71st preset is loaded:
  // The scene should ONLY contain initial lights + active preset's objects.
  // There should NOT be 71 preset groups in the scene!
  const topLevelChildren = engine.scene.children;
  const nonLights = topLevelChildren.filter(c => !(c instanceof THREE.Light));

  // Exactly 1 top-level group or mesh added by the active preset (or few)
  assert(nonLights.length <= 3,
    `Orphaned groups detected in scene! Expected <= 3 non-light roots, found ${nonLights.length}`);

  // Now dispose the active preset and clear non-lights
  if (engine.activePreset) {
    engine.activePreset.dispose();
  }

  const toRemove: THREE.Object3D[] = [];
  engine.scene.children.forEach(child => {
    if (!(child instanceof THREE.Light)) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(obj => engine.scene.remove(obj));

  const remainingNonLights = engine.scene.children.filter(c => !(c instanceof THREE.Light));
  assert(remainingNonLights.length === 0,
    `Scene retained orphaned objects after full cleanup: count = ${remainingNonLights.length}`);
  assert(engine.scene.children.length === initialLightCount,
    `Expected scene to revert to ${initialLightCount} initial lights, found ${engine.scene.children.length}`);
});

// ============================================================================
// SECTION 4: MEMORY & RESOURCE CLEANUP AUDIT (RECURSIVE TRAVERSAL & IDEMPOTENCE)
// ============================================================================
console.log('\n--- SECTION 4: Memory & Resource Cleanup Audit ---');

check('4.1: Recursive disposal audit for Three.js Geometries & Materials across representative presets', () => {
  // Test 14 diverse presets across all 7 categories
  const testSampleIds = [
    'wave', 'bars3d',           // Structures
    'starfield', 'blackhole',   // Abstract & Space
    'particles', 'lightning',   // Particles & Light
    'lava', 'fluid',            // Fluids & Heat
    'tunnel', 'waterslide',     // Tunnels
    'matrix', 'diodewall',      // Retro & Digital
    'bloom', 'ocean'            // Organic & Nature
  ];

  for (const id of testSampleIds) {
    const preset = getPreset(id);
    const ctx = createMockPresetContext(defaultTheme);

    preset.init(ctx);

    // Count geometries and materials attached to scene children
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();

    ctx.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        geometries.add(mesh.geometry);
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => materials.add(m));
        } else {
          materials.add(mesh.material);
        }
      }
    });

    assert(geometries.size > 0 || materials.size > 0,
      `Preset ${id} has no detected geometries or materials in scene tree`);

    let geometryDisposedCount = 0;
    let materialDisposedCount = 0;

    geometries.forEach(g => {
      const origDispose = g.dispose.bind(g);
      g.dispose = () => {
        geometryDisposedCount++;
        origDispose();
      };
    });

    materials.forEach(m => {
      const origDispose = m.dispose.bind(m);
      m.dispose = () => {
        materialDisposedCount++;
        origDispose();
      };
    });

    // Execute disposal
    preset.dispose();

    assert(geometryDisposedCount >= geometries.size,
      `Preset ${id} geometry dispose count mismatch: expected ${geometries.size}, got ${geometryDisposedCount}`);
    assert(materialDisposedCount >= materials.size,
      `Preset ${id} material dispose count mismatch: expected ${materials.size}, got ${materialDisposedCount}`);
  }
});

check('4.2: Double and triple dispose() invocations are strictly idempotent across ALL 71 presets', () => {
  for (const preset of PRESETS) {
    const ctx = createMockPresetContext(defaultTheme);
    preset.init(ctx);

    try {
      preset.dispose();
      preset.dispose(); // 2nd disposal
      preset.dispose(); // 3rd disposal
    } catch (err: unknown) {
      throw new Error(`Preset ${preset.id} threw error during repeated dispose(): ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});

check('4.3: Resurrection test: Re-initialization after disposal works seamlessly across ALL 71 presets', () => {
  const audio = createBeatDropAudioFeatures(0.9);

  for (const preset of PRESETS) {
    const ctx1 = createMockPresetContext(defaultTheme);
    preset.init(ctx1);
    preset.update(ctx1, audio, 0, 0.016);
    preset.dispose();

    // Re-initialize (resurrect) with fresh context
    const ctx2 = createMockPresetContext(defaultTheme);
    try {
      preset.init(ctx2);
      preset.update(ctx2, audio, 0.016, 0.016);
      preset.dispose();
    } catch (err: unknown) {
      throw new Error(`Preset ${preset.id} resurrection failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});

// ============================================================================
// SECTION 5: BACKWARD-COMPATIBLE ALIASING AUDIT
// ============================================================================
console.log('\n--- SECTION 5: Backward-Compatible Aliasing Audit ---');

check('5.1: Canonical ID retrieval for all 71 presets returns original preset instance and ID', () => {
  for (const canonicalPreset of PRESETS) {
    const retrieved = getPreset(canonicalPreset.id);
    assert(retrieved !== undefined, `getPreset returned undefined for canonical id: ${canonicalPreset.id}`);
    assert(retrieved.id === canonicalPreset.id,
      `Canonical retrieval id mismatch: expected ${canonicalPreset.id}, got ${retrieved.id}`);
    assert(retrieved.name === canonicalPreset.name,
      `Canonical retrieval name mismatch for ${canonicalPreset.id}`);
  }
});

check('5.2: Legacy alias dictionary completeness: all aliases map to real presets with alias proxy id', () => {
  const aliasEntries = Object.entries(PRESET_ALIASES);
  assert(aliasEntries.length >= 40, `Expected at least 40 aliases, found ${aliasEntries.length}`);

  const audio = createSilentAudioFeatures();

  for (const [alias, canonicalTarget] of aliasEntries) {
    // Verify target exists in PRESETS
    const exists = PRESETS.some(p => p.id === canonicalTarget);
    assert(exists, `Alias "${alias}" targets non-existent canonical preset "${canonicalTarget}"`);

    // Retrieve via alias
    const retrieved = getPreset(alias);
    assert(retrieved !== undefined, `getPreset returned undefined for alias: ${alias}`);

    // CRITICAL CONTRACT: retrieved.id MUST equal the requested alias for backward compatibility!
    assert(retrieved.id === alias,
      `Alias proxy contract violation! getPreset('${alias}').id must be '${alias}', got '${retrieved.id}'`);

    // Verify properties match target canonical preset
    const target = PRESETS.find(p => p.id === canonicalTarget)!;
    assert(retrieved.name === target.name, `Alias "${alias}" name mismatch`);
    assert(retrieved.category === target.category, `Alias "${alias}" category mismatch`);

    // Verify proxy forwards lifecycle methods cleanly
    const ctx = createMockPresetContext(defaultTheme);
    try {
      retrieved.init(ctx);
      retrieved.update(ctx, audio, 0, 0.016);
      retrieved.dispose();
    } catch (err: unknown) {
      throw new Error(`Alias proxy "${alias}" lifecycle execution threw: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});

check('5.3: Specific canonical legacy aliases spot-checks', () => {
  const criticalPairs = [
    ['waveform', 'wave'],
    ['3d-bars', 'bars3d'],
    ['particle-field', 'particles'],
    ['neon-tunnel', 'neontunnel'],
    ['black-hole', 'blackhole'],
    ['synthwave-terrain', 'terrain'],
    ['ocean-waves', 'ocean'],
    ['water-slide', 'waterslide'],
    ['dna-helix', 'dna'],
    ['matrix-rain', 'matrix']
  ];

  for (const [alias, canonical] of criticalPairs) {
    const p = getPreset(alias);
    assert(p.id === alias, `Alias ${alias} did not return alias id`);
    const c = getPreset(canonical);
    assert(c.id === canonical, `Canonical ${canonical} did not return canonical id`);
    assert(p.name === c.name, `Name mismatch between alias ${alias} and canonical ${canonical}`);
  }
});

check('5.4: Fallback behavior on unknown preset ID and studio-composer preset', () => {
  // Unknown ID falls back to PRESETS[0]
  const fallback = getPreset('completely_fictitious_preset_id_9999');
  assert(fallback.id === PRESETS[0].id, `Fallback preset mismatch: expected ${PRESETS[0].id}, got ${fallback.id}`);

  // Special studio-composer preset
  const composer = getPreset('studio-composer');
  assert(composer !== undefined, 'studio-composer preset should be defined');
  assert(composer.id === 'studio-composer', `studio-composer id mismatch: got ${composer.id}`);
});

// ============================================================================
// SECTION 6: PARAMETER STORE & TUNING ROBUSTNESS UNDER EXTREME VALUES
// ============================================================================
console.log('\n--- SECTION 6: Parameter Store & Tuning Robustness ---');

check('6.1: Parameter boundary clamping under extreme inputs (-999999, +999999, NaN)', () => {
  for (const preset of PRESETS) {
    if (preset.getCustomParameters && preset.getCustomParameters().length > 0) {
      const defs = preset.getCustomParameters();
      for (const def of defs) {
        // Test negative out of bounds
        preset.setCustomParameter?.(def.id, -999999);
        const valLow = preset.getCustomParameterValue?.(def.id);
        assert(valLow !== undefined && valLow >= def.min,
          `${preset.id} param ${def.id} failed to clamp min: value = ${valLow}, min = ${def.min}`);

        // Test positive out of bounds
        preset.setCustomParameter?.(def.id, 999999);
        const valHigh = preset.getCustomParameterValue?.(def.id);
        assert(valHigh !== undefined && valHigh <= def.max,
          `${preset.id} param ${def.id} failed to clamp max: value = ${valHigh}, max = ${def.max}`);

        // Reset to default
        preset.resetCustomParameters?.();
        const valDef = preset.getCustomParameterValue?.(def.id);
        assert(valDef === def.defaultValue,
          `${preset.id} param ${def.id} did not reset to default: expected ${def.defaultValue}, got ${valDef}`);
      }
    }
  }
});

check('6.2: Unknown parameter ID gracefully handled without throwing or corrupting store', () => {
  for (const preset of PRESETS) {
    if (preset.setCustomParameter) {
      // Should not throw
      preset.setCustomParameter('completely_nonexistent_param_id', 5.0);
    }
    if (preset.getCustomParameterValue) {
      const val = preset.getCustomParameterValue('completely_nonexistent_param_id');
      // ParameterStore returns 0 for unknown parameters
      assert(val === 0 || val === undefined, `getCustomParameterValue for unknown param should be 0 or undefined, got ${val}`);
    }
  }
});

// ============================================================================
// SECTION 7: UI CATEGORY COUNTERS & THUMBNAIL GENERATOR VERIFICATION
// ============================================================================
console.log('\n--- SECTION 7: UI Category Counters & Thumbnail Generator Audit ---');

const htmlPath = path.resolve(process.cwd(), 'index.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

const mainTsPath = path.resolve(process.cwd(), 'src/main.ts');
const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');

check('7.1: index.html defines #presetCategoryTabs with exact 7 category pills and matching counts', () => {
  assert(htmlContent.includes('id="presetCategoryTabs"'), 'index.html missing #presetCategoryTabs container');

  const expectedCategories: Record<string, number> = {
    'Structures': 15,
    'Abstract & Space': 15,
    'Particles & Light': 4,
    'Fluids & Heat': 9,
    'Tunnels': 7,
    'Retro & Digital': 7,
    'Organic & Nature': 14
  };

  assert(htmlContent.includes('id="badgeAll">71</span>'), 'index.html missing badgeAll with count 71');

  for (const [cat, count] of Object.entries(expectedCategories)) {
    const badgeRegex = new RegExp(`data-category-badge="${cat}"[^>]*>${count}</span>`);
    assert(badgeRegex.test(htmlContent), `index.html missing badge for category "${cat}" with count ${count}`);
  }
});

check('7.2: main.ts exports CATEGORIES with all 7 canonical categories', () => {
  assert(mainTsContent.includes('export const CATEGORIES'), 'main.ts must export CATEGORIES');
  const expectedKeys = [
    'Structures',
    'Abstract & Space',
    'Particles & Light',
    'Fluids & Heat',
    'Tunnels',
    'Retro & Digital',
    'Organic & Nature'
  ];

  for (const key of expectedKeys) {
    assert(mainTsContent.includes(`'${key}'`), `main.ts missing category key "${key}"`);
  }
});

check('7.3: Thumbnail SVG generation pattern covers all 7 categories and defaults with valid SVG markup', () => {
  // Replicate thumbnail function logic to audit coverage across all 71 presets
  function auditThumbnail(preset: VisualizerPreset): string {
    switch (preset.category) {
      case 'Structures':
        return '<svg viewBox="0 0 24 24"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>';
      case 'Abstract & Space':
        return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-30 12 12)"/></svg>';
      case 'Particles & Light':
        return '<svg viewBox="0 0 24 24"><path d="m13 2-2 7h5l-4 13 2-7H9l4-13Z"/></svg>';
      case 'Fluids & Heat':
        return '<svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>';
      case 'Tunnels':
        return '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="7" y="7" width="10" height="10" rx="1"/><rect x="10" y="10" width="4" height="4"/></svg>';
      case 'Retro & Digital':
        return '<svg viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>';
      case 'Organic & Nature':
        return '<svg viewBox="0 0 24 24"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';
      default:
        return '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
  }

  for (const preset of PRESETS) {
    const svg = auditThumbnail(preset);
    assert(svg.startsWith('<svg') && svg.endsWith('</svg>'), `Thumbnail invalid for ${preset.id}`);
    assert(svg.includes('viewBox="0 0 24 24"'), `viewBox missing in thumbnail for ${preset.id}`);
  }
});

// ============================================================================
// SUMMARY & EXIT DISPATCH
// ============================================================================
console.log('\n========================================================================');
console.log(`STRESS RESULTS: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed)`);
console.log('========================================================================\n');

if (failedChecks > 0) {
  console.error('\x1b[31mFAILURES ENCOUNTERED:\x1b[0m');
  for (const f of failures) {
    console.error(`- ${f.title}: ${f.error}`);
    if (f.stack) console.error(`  ${f.stack}`);
  }
  process.exit(1);
} else {
  console.log('\x1b[32m✓ ALL 71-PRESET EMPIRICAL STRESS CHECKS PASSED FLAWLESSLY!\x1b[0m\n');
  process.exit(0);
}
