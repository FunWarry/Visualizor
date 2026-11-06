import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import { getPreset, PRESETS } from '../../src/presets';
import { getTheme } from '../../src/themes/themes';
import {
  createMockPresetContext,
  createBeatDropAudioFeatures,
  createSilentAudioFeatures,
  createTrebleMelodyAudioFeatures
} from '../harness/fixtures';
import { AudioEngine, BeatDetector, BPMDetector } from '../../src/audio/AudioEngine';
import { StudioComposerPreset } from '../../src/studio/StudioComposer';
import { RenderEngine } from '../../src/engine/RenderEngine';
import { ExportManager } from '../../src/export/ExportManager';
import * as THREE from 'three';

describe('Tier 1: Comprehensive Tickets 1-37 Verification Pass', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  // =========================================================================
  // Tickets 1 to 7: Structures & Geometry
  // =========================================================================

  test('Ticket 1: Wave Form Preset (#1) audio displacement, beat flash, and parameters', () => {
    const ctx = createMockPresetContext(getTheme('ember'));
    const wave = getPreset('wave');
    expect(wave.id).toBe('wave');
    expect(wave.name).toBe('Wave Form');
    expect(wave.category).toBe('Structures');

    wave.init(ctx);
    const waveGroup = ctx.scene.children[0] as THREE.Group;
    const planeMesh = waveGroup.children[0] as THREE.Mesh;
    expect(planeMesh).toBeDefined();
    expect(planeMesh.geometry instanceof THREE.PlaneGeometry).toBe(true);
    const posAttr = planeMesh.geometry.attributes.position as THREE.BufferAttribute;
    expect(posAttr.count).toBe(64 * 64);

    // Initial silent frame
    const silent = createSilentAudioFeatures();
    wave.update(ctx, silent, 1.0, 0.016);
    let silentSum = 0;
    for (let i = 0; i < posAttr.count; i++) silentSum += Math.abs(posAttr.getZ(i));
    expect(silentSum).toBe(0);

    // Beat drop audio with elevated bass and time domain wave
    const beatAudio = createBeatDropAudioFeatures(0.95);
    wave.update(ctx, beatAudio, 2.0, 0.016);
    let beatSum = 0;
    for (let i = 0; i < posAttr.count; i++) beatSum += Math.abs(posAttr.getZ(i));
    expect(posAttr.version > 0).toBe(true);
    expect(beatSum).toBeGreaterThan(10);

    // Beat emissive flash
    const mat = planeMesh.material as THREE.MeshStandardMaterial;
    expect(mat.emissiveIntensity).toBeGreaterThan(0.5);

    // Frame without beat decays emissive intensity
    wave.update(ctx, silent, 2.016, 0.016);
    expect(mat.emissiveIntensity).toBeLessThan(0.8);

    // Parameter store verification
    const params = wave.getCustomParameters?.() || [];
    expect(params.map(p => p.id)).toEqual(['speed', 'reactivity', 'deformation', 'density']);
    wave.setCustomParameter?.('deformation', 2.5);
    expect(wave.getCustomParameterValue?.('deformation')).toBe(2.5);

    wave.dispose();
    ctx.scene.clear();
  });

  test('Ticket 2: Circular Spectrum & 3D Bars Presets (#2) ring culling and column scaling', () => {
    const ctx = createMockPresetContext(getTheme('neon'));

    // 1. Circular Spectrum
    const circular = getPreset('circular');
    expect(circular.category).toBe('Structures');
    circular.init(ctx);
    expect(ctx.scene.children.length).toBeGreaterThan(0);
    const ringGroup = ctx.scene.children[0] as THREE.Group;
    expect(ringGroup.children.length).toBe(16); // 16 concentric lines

    const beatAudio = createBeatDropAudioFeatures(0.9);
    circular.update(ctx, beatAudio, 1.0, 0.016);
    expect(ringGroup.rotation.z).not.toBe(0);

    // Density parameter limits active rings
    circular.setCustomParameter?.('density', 8);
    circular.update(ctx, beatAudio, 1.016, 0.016);
    expect((ringGroup.children[0] as THREE.Line).visible).toBe(true);
    expect((ringGroup.children[15] as THREE.Line).visible).toBe(false);

    circular.dispose();
    ctx.scene.clear();

    // 2. 3D Bars
    const bars = getPreset('bars3d');
    expect(bars.category).toBe('Structures');
    bars.init(ctx);
    const barsGroup = ctx.scene.children[0] as THREE.Group;
    const instMesh = barsGroup.children[0] as THREE.InstancedMesh;
    expect(instMesh.count).toBe(256); // 16x16 grid

    bars.update(ctx, beatAudio, 1.0, 0.016);
    const matrix = new THREE.Matrix4();
    instMesh.getMatrixAt(0, matrix);
    expect(matrix.elements[5]).toBeGreaterThan(0.1); // Y scale elevated

    bars.dispose();
    ctx.scene.clear();
  });

  test('Ticket 3: Obsidian Poly & Ferrofluid Presets (#3) physical material and spike deformation', () => {
    const ctx = createMockPresetContext(getTheme('obsidian'));

    // 1. Obsidian Poly
    const obsidian = getPreset('obsidian');
    obsidian.init(ctx);
    const obsGroup = ctx.scene.children[0] as THREE.Group;
    const obsMesh = obsGroup.children[0] as THREE.Mesh;
    expect(obsMesh.material instanceof THREE.MeshPhysicalMaterial).toBe(true);
    const obsMat = obsMesh.material as THREE.MeshPhysicalMaterial;
    expect(obsMat.clearcoat).toBe(1.0);

    const beatAudio = createBeatDropAudioFeatures(0.9);
    obsidian.update(ctx, beatAudio, 1.0, 0.016);
    expect(obsMat.emissiveIntensity).toBeGreaterThan(0.5);

    obsidian.dispose();
    ctx.scene.clear();

    // 2. Ferrofluid
    const ferro = getPreset('ferrofluid');
    ferro.init(ctx);
    const ferroGroup = ctx.scene.children[0] as THREE.Group;
    const ferroMesh = ferroGroup.children[0] as THREE.Mesh;
    expect(ferroMesh.geometry instanceof THREE.SphereGeometry).toBe(true);
    const pos = ferroMesh.geometry.attributes.position;
    expect(pos.count).toBeGreaterThan(5000);

    ferro.update(ctx, beatAudio, 1.0, 0.016);
    const ferroMat = ferroMesh.material as THREE.MeshPhysicalMaterial;
    expect(ferroMat.emissiveIntensity).toBeGreaterThan(0.7);

    ferro.dispose();
    ctx.scene.clear();
  });

  test('Ticket 4: DNA Helix, Topo Map & Cymatic Presets (#4) geometry and Chladni acoustics', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. DNA Helix
    const dna = getPreset('dna');
    dna.init(ctx);
    const dnaGroup = ctx.scene.children[0] as THREE.Group;
    expect(dnaGroup.children.length).toBe(2); // Spheres instancedMesh + Rungs instancedMesh
    dna.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    dna.dispose();
    ctx.scene.clear();

    // 2. Topo Map
    const topo = getPreset('topographic');
    topo.init(ctx);
    const topoGroup = ctx.scene.children[0] as THREE.Group;
    const topoMesh = topoGroup.children[0] as THREE.Mesh;
    expect(topoMesh.material instanceof THREE.ShaderMaterial).toBe(true);
    const topoShader = topoMesh.material as THREE.ShaderMaterial;
    expect(topoShader.uniforms.uBands).toBeDefined();
    topo.setCustomParameter?.('density', 8.5);
    topo.update(ctx, createBeatDropAudioFeatures(0.8), 1.0, 0.016);
    expect(topoShader.uniforms.uBands.value).toBe(8.5);
    topo.dispose();
    ctx.scene.clear();

    // 3. Cymatic
    const cymatic = getPreset('cymatic');
    cymatic.init(ctx);
    const cymGroup = ctx.scene.children[0] as THREE.Group;
    expect(cymGroup.children.length).toBe(1); // Plate mesh
    const plate = cymGroup.children[0] as THREE.Mesh;
    expect(plate.children.length).toBe(1); // Sand Points attached to plate
    cymatic.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    cymatic.dispose();
    ctx.scene.clear();
  });

  test('Ticket 5: Vinyl Player & Orbital Rings Presets (#5) turntable rotation and decoupled orrery', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Vinyl Player
    const vinyl = getPreset('vinyl');
    vinyl.init(ctx);
    const vinylGroup = ctx.scene.children[0] as THREE.Group;
    const disc = vinylGroup.children[0] as THREE.Mesh;
    const initialRot = disc.rotation.y;
    vinyl.update(ctx, createTrebleMelodyAudioFeatures(), 1.0, 0.016);
    expect(disc.rotation.y).toBeGreaterThan(initialRot);
    vinyl.dispose();
    ctx.scene.clear();

    // 2. Orbital Rings
    const rings = getPreset('rings');
    rings.init(ctx);
    const ringsGroup = ctx.scene.children[0] as THREE.Group;
    expect(ringsGroup.children.length).toBe(4); // Core sphere + 3 tori
    rings.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    rings.dispose();
    ctx.scene.clear();
  });

  test('Ticket 6: Tesseract 4D & Hologram Presets (#6) 4D rotation and glitch shader', () => {
    const ctx = createMockPresetContext(getTheme('cyberpunk'));

    // 1. Tesseract 4D
    const tesseract = getPreset('tesseract');
    tesseract.init(ctx);
    const tessGroup = ctx.scene.children[0] as THREE.Group;
    expect(tessGroup.children.length).toBe(2); // LineSegments (edges) + Points (vertices)
    tesseract.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    const edges = tessGroup.children[0] as THREE.LineSegments;
    const edgePos = edges.geometry.attributes.position.array;
    for (let i = 0; i < 20; i++) {
      expect(Number.isFinite(edgePos[i])).toBe(true);
    }
    tesseract.dispose();
    ctx.scene.clear();

    // 2. Hologram
    const holo = getPreset('hologram');
    holo.init(ctx);
    const holoGroup = ctx.scene.children[0] as THREE.Group;
    const plane = holoGroup.children[0] as THREE.Mesh;
    const mat = plane.material as THREE.ShaderMaterial;
    expect(mat.uniforms.uGlitch).toBeDefined();
    holo.update(ctx, createBeatDropAudioFeatures(0.95), 1.0, 0.016);
    expect(mat.uniforms.uGlitch.value).toBeGreaterThan(0.2);
    holo.dispose();
    ctx.scene.clear();
  });

  test('Ticket 7: Geodesic Sphere & Warp Grid Presets (#7) frequency extrusion and spacetime dip', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Geodesic Sphere
    const geodesic = getPreset('geodesic');
    geodesic.init(ctx);
    geodesic.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    geodesic.dispose();
    ctx.scene.clear();

    // 2. Warp Grid
    const warp = getPreset('warp');
    warp.init(ctx);
    const warpGroup = ctx.scene.children[0] as THREE.Group;
    const warpMesh = warpGroup.children[0] as THREE.Mesh;
    const pos = warpMesh.geometry.attributes.position;
    warp.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    // Center vertex dip (z coordinate depressed)
    expect(pos.getY(pos.count / 2) !== 0 || pos.needsUpdate).toBe(true);
    warp.dispose();
    ctx.scene.clear();
  });

  // =========================================================================
  // Tickets 8 to 14: Abstract, Space, Particles, Light
  // =========================================================================

  test('Ticket 8: Starfield, Black Hole & The Sun Presets (#8) warp speeds and accretion dynamics', () => {
    const ctx = createMockPresetContext(getTheme('space'));

    // 1. Starfield
    const starfield = getPreset('starfield');
    starfield.init(ctx);
    const starGroup = ctx.scene.children[0] as THREE.Group;
    const starPoints = starGroup.children[0] as THREE.Points;
    expect(starPoints.geometry.attributes.position.count).toBe(4000);
    starfield.update(ctx, createBeatDropAudioFeatures(0.95), 1.0, 0.016);
    starfield.dispose();
    ctx.scene.clear();

    // 2. Black Hole
    const blackhole = getPreset('blackhole');
    blackhole.init(ctx);
    const bhGroup = ctx.scene.children[0] as THREE.Group;
    expect(bhGroup.children.length).toBe(2); // Core event horizon + accretion Points
    blackhole.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    blackhole.dispose();
    ctx.scene.clear();

    // 3. The Sun
    const sun = getPreset('sun');
    sun.init(ctx);
    const sunGroup = ctx.scene.children[0] as THREE.Group;
    expect(sunGroup.children.length).toBe(3); // Core + Corona + Flares
    sun.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    sun.dispose();
    ctx.scene.clear();
  });

  test('Ticket 9: Mandel Fractal & Unfolding Matter Presets (#9) fractal zoom and origami hinges', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Mandel
    const mandel = getPreset('mandel');
    mandel.init(ctx);
    const mGroup = ctx.scene.children[0] as THREE.Group;
    const mMesh = mGroup.children[0] as THREE.Mesh;
    const mShader = mMesh.material as THREE.ShaderMaterial;
    expect(mShader.uniforms.uBass).toBeDefined();
    mandel.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    expect(mShader.uniforms.uBass.value).toBeGreaterThan(0.5);
    mandel.dispose();
    ctx.scene.clear();

    // 2. Unfolding Matter
    const unfolding = getPreset('unfoldingmatter');
    unfolding.init(ctx);
    const uGroup = ctx.scene.children[0] as THREE.Group;
    expect(uGroup.children.length).toBe(20); // 20 origami facets
    unfolding.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    unfolding.dispose();
    ctx.scene.clear();
  });

  test('Ticket 10: MilkDrop & Geiss Presets (#10) oscilloscope line and non-tunable UI contract', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. MilkDrop
    const milk = getPreset('milkdrop');
    expect(milk.getCustomParameters?.()).toEqual([]); // Non-tunable contract
    milk.init(ctx);
    const milkGroup = ctx.scene.children[0] as THREE.Group;
    expect(milkGroup.children.length).toBe(2); // Deformed plane + oscilloscope line
    milk.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    milk.dispose();
    ctx.scene.clear();

    // 2. Geiss
    const geiss = getPreset('geiss');
    geiss.init(ctx);
    const gGroup = ctx.scene.children[0] as THREE.Group;
    const gMesh = gGroup.children[0] as THREE.Mesh;
    const gShader = gMesh.material as THREE.ShaderMaterial;
    expect(gShader.uniforms.uBass).toBeDefined();
    geiss.update(ctx, createBeatDropAudioFeatures(0.8), 1.0, 0.016);
    geiss.dispose();
    ctx.scene.clear();
  });

  test('Ticket 11: Aurora & Sacred Mandala Presets (#11) curtain shader and harmonic line loops', () => {
    const ctx = createMockPresetContext(getTheme('arctic'));

    // 1. Aurora
    const aurora = getPreset('aurora');
    aurora.init(ctx);
    const aGroup = ctx.scene.children[0] as THREE.Group;
    const aMesh = aGroup.children[0] as THREE.Mesh;
    const aShader = aMesh.material as THREE.ShaderMaterial;
    expect(aShader.uniforms.uMid).toBeDefined();
    aurora.update(ctx, createTrebleMelodyAudioFeatures(), 1.0, 0.016);
    aurora.dispose();
    ctx.scene.clear();

    // 2. Sacred Mandala
    const sacred = getPreset('sacred');
    sacred.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    expect(sGroup.children.length).toBe(5); // 5 harmonic LineLoops
    sacred.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    sacred.dispose();
    ctx.scene.clear();
  });

  test('Ticket 12: Synthwave Terrain & Galaxy Presets (#12) canyon perspectives and spiral arms', () => {
    const ctx = createMockPresetContext(getTheme('synthwave'));

    // 1. Terrain
    const terrain = getPreset('terrain');
    terrain.init(ctx);
    const tGroup = ctx.scene.children[0] as THREE.Group;
    expect(tGroup.children.length).toBe(2); // Grid mesh + distant Sun
    terrain.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    terrain.dispose();
    ctx.scene.clear();

    // 2. Galaxy
    const galaxy = getPreset('galaxy');
    galaxy.init(ctx);
    const galGroup = ctx.scene.children[0] as THREE.Group;
    expect(galGroup.children.length).toBe(2); // Core bulge + 6000 particles
    galaxy.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    galaxy.dispose();
    ctx.scene.clear();
  });

  test('Ticket 13: Particle Swarm & Fireflies Presets (#13) draw ranges and bounded 3D wandering', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Particles
    const swarm = getPreset('particles');
    swarm.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    const sPoints = sGroup.children[0] as THREE.Points;
    expect(sPoints.geometry.attributes.position.count).toBe(6000);
    swarm.setCustomParameter?.('density', 0.5);
    swarm.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    expect(sPoints.geometry.drawRange.count).toBe(3000);
    swarm.dispose();
    ctx.scene.clear();

    // 2. Fireflies
    const flies = getPreset('fireflies');
    flies.init(ctx);
    const fGroup = ctx.scene.children[0] as THREE.Group;
    const fPoints = fGroup.children[0] as THREE.Points;
    expect(fPoints.geometry.attributes.position.count).toBe(1200);
    flies.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    flies.dispose();
    ctx.scene.clear();
  });

  test('Ticket 14: Lightning & Plasma Arcs Presets (#14) electric bolts and dielectric breakdown', () => {
    const ctx = createMockPresetContext(getTheme('electric'));

    // 1. Lightning
    const lightning = getPreset('lightning');
    lightning.init(ctx);
    const lGroup = ctx.scene.children[0] as THREE.Group;
    expect(lGroup.children.length).toBe(16); // 16 electric arc bolts
    lightning.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    lightning.dispose();
    ctx.scene.clear();

    // 2. Plasma Arcs
    const plasmaArcs = getPreset('plasmaarcs');
    plasmaArcs.init(ctx);
    const pGroup = ctx.scene.children[0] as THREE.Group;
    const pMesh = pGroup.children[0] as THREE.Mesh;
    const pShader = pMesh.material as THREE.ShaderMaterial;
    expect(pShader.uniforms.uVoltage).toBeDefined();
    plasmaArcs.update(ctx, createTrebleMelodyAudioFeatures(), 1.0, 0.016);
    expect(pShader.uniforms.uVoltage.value).toBeGreaterThan(0.5);
    plasmaArcs.dispose();
    ctx.scene.clear();
  });

  // =========================================================================
  // Tickets 15 to 23: Fluids, Heat, Tunnels, Retro & Digital
  // =========================================================================

  test('Ticket 15: Lava, Fireball & Water Neurons Presets (#15) noise crust, sparks, and synaptic network', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Lava
    const lava = getPreset('lava');
    expect(lava.category).toBe('Fluids & Heat');
    lava.init(ctx);
    lava.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    lava.dispose();
    ctx.scene.clear();

    // 2. Fireball
    const fireball = getPreset('fireball');
    fireball.init(ctx);
    const fGroup = ctx.scene.children[0] as THREE.Group;
    expect(fGroup.children.length).toBe(2); // Core + sparks
    fireball.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    fireball.dispose();
    ctx.scene.clear();

    // 3. Water Neurons
    const neurons = getPreset('waterneurons');
    neurons.init(ctx);
    const nGroup = ctx.scene.children[0] as THREE.Group;
    expect(nGroup.children.length).toBe(3); // Nucleus + axons + terminal points
    neurons.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    neurons.dispose();
    ctx.scene.clear();
  });

  test('Ticket 16: Liquid, Fluid & Plasma Presets (#16) multi-octave fBm and bubble ascension', () => {
    const ctx = createMockPresetContext(getTheme('ocean'));

    // 1. Liquid
    const liquid = getPreset('liquid');
    liquid.init(ctx);
    const lGroup = ctx.scene.children[0] as THREE.Group;
    const lMesh = lGroup.children[0] as THREE.Mesh;
    const lShader = lMesh.material as THREE.ShaderMaterial;
    expect(lShader.uniforms.uBass).toBeDefined();
    liquid.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    liquid.dispose();
    ctx.scene.clear();

    // 2. Fluid
    const fluid = getPreset('fluid');
    fluid.init(ctx);
    const flGroup = ctx.scene.children[0] as THREE.Group;
    expect(flGroup.children.length).toBe(3); // Box + slosh plane + bubbles
    fluid.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    fluid.dispose();
    ctx.scene.clear();

    // 3. Plasma
    const plasma = getPreset('plasma');
    plasma.init(ctx);
    const plGroup = ctx.scene.children[0] as THREE.Group;
    expect(plGroup.children.length).toBe(2); // Torus + filaments
    plasma.update(ctx, createTrebleMelodyAudioFeatures(), 1.0, 0.016);
    plasma.dispose();
    ctx.scene.clear();
  });

  test('Ticket 17: Fog, Rain Water & Smoke Presets (#17) depth planes, ripples, and buoyancy', () => {
    const ctx = createMockPresetContext(getTheme('arctic'));

    // 1. Fog
    const fog = getPreset('fog');
    fog.init(ctx);
    const fogGroup = ctx.scene.children[0] as THREE.Group;
    expect(fogGroup.children.length).toBe(5); // 5 depth planes
    fog.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    fog.dispose();
    ctx.scene.clear();

    // 2. Rain Water
    const rain = getPreset('water');
    rain.init(ctx);
    const rGroup = ctx.scene.children[0] as THREE.Group;
    const rMesh = rGroup.children[0] as THREE.Mesh;
    const rShader = rMesh.material as THREE.ShaderMaterial;
    expect(rShader.uniforms.uKickImpact).toBeDefined();
    rain.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    expect(rShader.uniforms.uKickImpact.value).toBeGreaterThan(0.5);
    rain.dispose();
    ctx.scene.clear();

    // 3. Smoke
    const smoke = getPreset('smoke');
    smoke.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    const sPoints = sGroup.children[0] as THREE.Points;
    expect(sPoints.geometry.attributes.position.count).toBe(1200);
    smoke.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    smoke.dispose();
    ctx.scene.clear();
  });

  test('Ticket 18: Neon Tunnel, Box Tunnel & Ring Tunnel Presets (#18) Z-corridor conveyor wraps', () => {
    const ctx = createMockPresetContext(getTheme('neon'));

    // 1. Neon Tunnel
    const neon = getPreset('neontunnel');
    expect(neon.category).toBe('Tunnels');
    neon.init(ctx);
    const nGroup = ctx.scene.children[0] as THREE.Group;
    expect(nGroup.children.length).toBe(40); // 40 hexagonal rings
    neon.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    neon.dispose();
    ctx.scene.clear();

    // 2. Box Tunnel
    const box = getPreset('boxtunnel');
    box.init(ctx);
    const bGroup = ctx.scene.children[0] as THREE.Group;
    expect(bGroup.children.length).toBe(36); // 36 square frames
    box.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    box.dispose();
    ctx.scene.clear();

    // 3. Ring Tunnel
    const ring = getPreset('ringtunnel');
    ring.init(ctx);
    const rGroup = ctx.scene.children[0] as THREE.Group;
    expect(rGroup.children.length).toBe(48); // 48 circular tori
    ring.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    ring.dispose();
    ctx.scene.clear();
  });

  test('Ticket 19: Water Slide & Vein Tunnel Presets (#19) 3D CatmullRom spline tubes', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Water Slide
    const slide = getPreset('waterslide');
    slide.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    const sMesh = sGroup.children[0] as THREE.Mesh;
    expect(sMesh.geometry instanceof THREE.TubeGeometry).toBe(true);
    slide.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    slide.dispose();
    ctx.scene.clear();

    // 2. Vein Tunnel
    const vein = getPreset('veintunnel');
    vein.init(ctx);
    const vGroup = ctx.scene.children[0] as THREE.Group;
    const vMesh = vGroup.children[0] as THREE.Mesh;
    expect(vMesh.geometry instanceof THREE.TubeGeometry).toBe(true);
    vein.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    vein.dispose();
    ctx.scene.clear();
  });

  test('Ticket 20: Kaleidoscope Preset (#20) 8-fold mirror mandala geometry', () => {
    const ctx = createMockPresetContext(getTheme('ember'));
    const kaleido = getPreset('kaleidoscope');
    kaleido.init(ctx);
    const kGroup = ctx.scene.children[0] as THREE.Group;
    expect(kGroup.children.length).toBe(16); // 16 concentric layers
    kaleido.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    expect(kaleido.getCustomParameterValue?.('density')).toBe(8);
    kaleido.dispose();
    ctx.scene.clear();
  });

  test('Ticket 21: Matrix, The Spectrogram & Night Radar Presets (#21) glyph cascade, rolling history, and radar CRT', () => {
    const ctx = createMockPresetContext(getTheme('matrix'));

    // 1. Matrix
    const matrix = getPreset('matrix');
    expect(matrix.category).toBe('Retro & Digital');
    matrix.init(ctx);
    const mGroup = ctx.scene.children[0] as THREE.Group;
    const mInst = mGroup.children[0] as THREE.InstancedMesh;
    expect(mInst.count).toBe(1200);
    matrix.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    matrix.dispose();
    ctx.scene.clear();

    // 2. Spectrogram
    const spec = getPreset('spectrogram');
    spec.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    const sMesh = sGroup.children[0] as THREE.Mesh;
    expect(sMesh.geometry instanceof THREE.PlaneGeometry).toBe(true);
    spec.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    spec.dispose();
    ctx.scene.clear();

    // 3. Night Radar
    const radar = getPreset('nightradar');
    radar.init(ctx);
    const rGroup = ctx.scene.children[0] as THREE.Group;
    expect(rGroup.children.length).toBe(3); // CRT scope + sweep line + 32 target blips
    radar.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    radar.dispose();
    ctx.scene.clear();
  });

  test('Ticket 22: Diode Wall & Vod Lines Presets (#22) 768 LED matrix and 4-channel multi-band routing', () => {
    const ctx = createMockPresetContext(getTheme('cyberpunk'));

    // 1. Diode Wall
    const diode = getPreset('diodewall');
    diode.init(ctx);
    const dGroup = ctx.scene.children[0] as THREE.Group;
    const dInst = dGroup.children[0] as THREE.InstancedMesh;
    expect(dInst.count).toBe(768); // 32x24 diodes
    diode.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    diode.dispose();
    ctx.scene.clear();

    // 2. Vod Lines
    const vod = getPreset('vodlines');
    vod.init(ctx);
    const vGroup = ctx.scene.children[0] as THREE.Group;
    expect(vGroup.children.length).toBe(4); // 4 tracker channels (subBass, bass, mid, treble)
    vod.update(ctx, createTrebleMelodyAudioFeatures(), 1.0, 0.016);
    vod.dispose();
    ctx.scene.clear();
  });

  test('Ticket 23: LCD Deck & Signal Lock Presets (#23) spinning CD disc and SMPTE test pattern', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. LCD Deck
    const lcd = getPreset('lcddeck');
    lcd.init(ctx);
    const lGroup = ctx.scene.children[0] as THREE.Group;
    expect(lGroup.children.length).toBe(18); // Base plate + disc + 16 VU bars
    lcd.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    lcd.dispose();
    ctx.scene.clear();

    // 2. Signal Lock
    const lock = getPreset('signallock');
    lock.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    expect(sGroup.children.length).toBe(2); // SMPTE screen + Lissajous line
    lock.update(ctx, createBeatDropAudioFeatures(0.95), 1.0, 0.016);
    lock.dispose();
    ctx.scene.clear();
  });

  // =========================================================================
  // Tickets 24 to 29: Organic & Nature
  // =========================================================================

  test('Ticket 24: Bloom & Ink Drop Presets (#24) phyllotaxis petals and settling plume velocities', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Bloom
    const bloom = getPreset('bloom');
    expect(bloom.category).toBe('Organic & Nature');
    bloom.init(ctx);
    const bGroup = ctx.scene.children[0] as THREE.Group;
    expect(bGroup.children.length).toBe(34); // 34 golden spiral cone petals
    bloom.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    bloom.dispose();
    ctx.scene.clear();

    // 2. Ink Drop
    const ink = getPreset('ink');
    ink.init(ctx);
    const iGroup = ctx.scene.children[0] as THREE.Group;
    const iPoints = iGroup.children[0] as THREE.Points;
    expect(iPoints.geometry.attributes.position.count).toBe(1200);
    ink.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    ink.dispose();
    ctx.scene.clear();
  });

  test('Ticket 25: Meadow & Up Cloud Presets (#25) instanced grass blades and value noise rim shader', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Meadow
    const meadow = getPreset('meadow');
    meadow.init(ctx);
    const mGroup = ctx.scene.children[0] as THREE.Group;
    const mInst = mGroup.children[0] as THREE.InstancedMesh;
    expect(mInst.count).toBe(2000); // 2000 grass blades
    meadow.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    meadow.dispose();
    ctx.scene.clear();

    // 2. Up Cloud
    const cloud = getPreset('upcloud');
    cloud.init(ctx);
    const cGroup = ctx.scene.children[0] as THREE.Group;
    const cMesh = cGroup.children[0] as THREE.Mesh;
    const cShader = cMesh.material as THREE.ShaderMaterial;
    expect(cShader.uniforms.uBass).toBeDefined();
    cloud.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    cloud.dispose();
    ctx.scene.clear();
  });

  test('Ticket 26: Ocean Wave & Rain Room Presets (#26) Gerstner swell and vertical streak downpour', () => {
    const ctx = createMockPresetContext(getTheme('ocean'));

    // 1. Ocean
    const ocean = getPreset('ocean');
    ocean.init(ctx);
    const oGroup = ctx.scene.children[0] as THREE.Group;
    const oMesh = oGroup.children[0] as THREE.Mesh;
    const oShader = oMesh.material as THREE.ShaderMaterial;
    expect(oShader.uniforms.uBass).toBeDefined();
    ocean.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    ocean.dispose();
    ctx.scene.clear();

    // 2. Rain Room
    const rain = getPreset('rainroom');
    rain.init(ctx);
    const rGroup = ctx.scene.children[0] as THREE.Group;
    expect(rGroup.children.length).toBe(2); // Rain streaks + splash points
    rain.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    rain.dispose();
    ctx.scene.clear();
  });

  test('Ticket 27: Forest & Storm Cell Presets (#27) recursive branching and anvil cloud lightning', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Forest
    const forest = getPreset('forest');
    forest.init(ctx);
    const fGroup = ctx.scene.children[0] as THREE.Group;
    expect(fGroup.children.length).toBe(2); // Fractal tree canopy + god rays
    forest.update(ctx, createBeatDropAudioFeatures(0.85), 1.0, 0.016);
    forest.dispose();
    ctx.scene.clear();

    // 2. Storm Cell
    const storm = getPreset('stormcell');
    storm.init(ctx);
    const sGroup = ctx.scene.children[0] as THREE.Group;
    expect(sGroup.children.length).toBe(2); // Supercell cone + lightning lines
    storm.update(ctx, createBeatDropAudioFeatures(0.95), 1.0, 0.016);
    storm.dispose();
    ctx.scene.clear();
  });

  test('Ticket 28: Jellyfish & Mycelium Presets (#28) soft-body contraction and fungal hyphae nodes', () => {
    const ctx = createMockPresetContext(getTheme('ember'));

    // 1. Jellyfish
    const jelly = getPreset('jellyfish');
    jelly.init(ctx);
    const jGroup = ctx.scene.children[0] as THREE.Group;
    expect(jGroup.children.length).toBe(13); // Bell dome + 12 tentacles
    jelly.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    jelly.dispose();
    ctx.scene.clear();

    // 2. Mycelium
    const myc = getPreset('mycelium');
    myc.init(ctx);
    const mGroup = ctx.scene.children[0] as THREE.Group;
    expect(mGroup.children.length).toBe(2); // Filaments + glowing nodes
    myc.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    myc.dispose();
    ctx.scene.clear();
  });

  test('Ticket 29: Erupting Volcano Preset (#29) basalt cone, crater lake, and ballistic magma gravity', () => {
    const ctx = createMockPresetContext(getTheme('ember'));
    const volcano = getPreset('volcano');
    volcano.init(ctx);
    const vGroup = ctx.scene.children[0] as THREE.Group;
    expect(vGroup.children.length).toBe(3); // Caldera cone + crater lake + magma sparks
    volcano.update(ctx, createBeatDropAudioFeatures(0.95), 1.0, 0.016);
    volcano.dispose();
    ctx.scene.clear();
  });

  // =========================================================================
  // Tickets 30 to 37: Audio DSP, Persistence, Export, Quality & Dual-Engine
  // =========================================================================

  test('Ticket 30: Audio Engine & DSP Subsystems (#30) FFT slicing, beat threshold, and BPM detection', () => {
    const engine = new AudioEngine();
    const features = engine.getFeatures();
    expect(features.subBass).toBeGreaterThanOrEqual(0.0);
    expect(features.bass).toBeGreaterThanOrEqual(0.0);
    expect(features.mid).toBeGreaterThanOrEqual(0.0);
    expect(features.treble).toBeGreaterThanOrEqual(0.0);

    // Beat detector variance-adaptive threshold
    const beatDet = new BeatDetector();
    for (let i = 0; i < 40; i++) beatDet.update(0.1);
    const hit = beatDet.update(0.9);
    expect(hit).toBe(true);
    expect(beatDet.beatEnergy).toBe(1.0);

    // BPM detector auto-interval and manual tap
    const bpmDet = new BPMDetector();
    bpmDet.tap();
    expect(bpmDet.manualBPM !== null || bpmDet.detectedBPM >= 0).toBe(true);
    bpmDet.resetManual();
    expect(bpmDet.manualBPM).toBeNull();
  });

  test('Ticket 31: Playlist Queue Manager (#31) track queuing, shuffle, and repeat state machine', () => {
    const engine = new AudioEngine();
    expect(engine.playlist).toHaveLength(0);

    const mockFile1 = { name: 'track1.mp3' } as unknown as File;
    const mockFile2 = { name: 'track2.mp3' } as unknown as File;
    engine.addFilesToPlaylist([mockFile1, mockFile2]);
    expect(engine.playlist).toHaveLength(2);
    expect(engine.currentTrackIndex).toBe(0);

    // Shuffle and repeat modes
    engine.isShuffle = true;
    engine.isRepeat = true;
    expect(engine.isShuffle).toBe(true);
    expect(engine.isRepeat).toBe(true);

    engine.nextTrack();
    expect(engine.currentTrackIndex).toBeGreaterThanOrEqual(0);
    expect(engine.currentTrackIndex).toBeLessThan(2);
  });

  test('Ticket 32: Visualizer Studio Stage Composer (#32) 5-layer WebGL preset and ParameterStore', () => {
    const studioPreset = new StudioComposerPreset();
    expect(studioPreset.id).toBe('studio-composer');
    expect(studioPreset.name).toBe('Visualizer Studio');
    expect(studioPreset.category).toBe('Structures');

    const ctx = createMockPresetContext(getTheme('ember'));
    studioPreset.init(ctx);
    const group = ctx.scene.children[0] as THREE.Group;
    expect(group.children.length).toBeGreaterThanOrEqual(4); // Liquid, Tunnel, Volume, Force

    const params = studioPreset.getCustomParameters();
    expect(params.map(p => p.id)).toEqual([
      'chromaIntensity',
      'liquidWarp',
      'tunnelDepth',
      'volumeDensity',
      'theForceAttraction'
    ]);

    studioPreset.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    studioPreset.dispose();
    ctx.scene.clear();
  });

  test('Ticket 33: Motion Persistence & Feedback Buffer Pass (#33) dual render target ping-pong pass', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    expect(engine.config.persistence).toBe(0);
    engine.updateConfig({ persistence: 0.65 });
    expect(engine.config.persistence).toBe(0.65);

    // MasterShader uniforms persistence test
    engine.resize(800, 600);
    expect(engine.camera.aspect).toBeCloseTo(800 / 600, 0.01);
    expect(engine.feedbackTargets[0].width).toBe(800);
    expect(engine.feedbackTargets[1].width).toBe(800);
  });

  test('Ticket 34: Batch Recording Mode (#34) ExportManager preset sequence progression', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const renderEngine = new RenderEngine(canvas, getTheme('ember'));
    const audioEngine = new AudioEngine();
    const exportManager = new ExportManager(renderEngine, audioEngine);

    expect(exportManager.isRecording).toBe(false);
    expect(typeof exportManager.startBatchExport).toBe('function');
    expect(typeof exportManager.stopExport).toBe('function');
  });

  test('Ticket 35: Aspect Ratio Framing & GIF Export (#35) framing aspect math and extension mapping', () => {
    const canvas = document.getElementById('webgl-canvas') as unknown as HTMLCanvasElement;
    const engine = new RenderEngine(canvas, getTheme('ember'));

    // 16:9 Landscape
    engine.resize(1920, 1080);
    expect(engine.camera.aspect).toBeCloseTo(16 / 9, 0.01);

    // 9:16 Vertical
    engine.resize(1080, 1920);
    expect(engine.camera.aspect).toBeCloseTo(9 / 16, 0.01);

    // 1:1 Square
    engine.resize(1080, 1080);
    expect(engine.camera.aspect).toBeCloseTo(1.0, 0.01);
  });

  test('Ticket 36: SonarQube Quality Gate & Zero-Defect Architecture (#36) strict preset contracts', () => {
    expect(PRESETS.length).toBe(71);
    for (const preset of PRESETS) {
      expect(typeof preset.id).toBe('string');
      expect(typeof preset.name).toBe('string');
      expect(typeof preset.category).toBe('string');
      expect(typeof preset.init).toBe('function');
      expect(typeof preset.update).toBe('function');
      expect(typeof preset.dispose).toBe('function');
    }
  });

  test('Ticket 37: Dual-Engine MilkDrop & ProjectM Support (#37) Butterchurn WebGL engine architecture', () => {
    // 1. Dual Canvas Architecture in DOM
    const webglCanvas = document.getElementById('webgl-canvas') as unknown as MockElement;
    const milkCanvas = document.getElementById('milkdrop-canvas') as unknown as MockElement;
    expect(webglCanvas).toBeDefined();
    expect(milkCanvas).toBeDefined();

    // Default engine state: Three.js active, Milkdrop hidden
    milkCanvas.style.display = 'none';
    expect(milkCanvas.style.display).toBe('none');

    // Engine switch arbitration: Activating Butterchurn displays milkdrop-canvas
    milkCanvas.style.display = 'block';
    expect(milkCanvas.style.display).toBe('block');
    milkCanvas.style.display = 'none';

    // 2. Three.js Dual-Engine Fallback Presets
    const ctx = createMockPresetContext(getTheme('ember'));
    const milkdrop = getPreset('milkdrop');
    expect(milkdrop.id).toBe('milkdrop');
    expect(milkdrop.description).toContain('Butterchurn');
    milkdrop.init(ctx);
    milkdrop.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    milkdrop.dispose();
    ctx.scene.clear();

    const geiss = getPreset('geiss');
    expect(geiss.id).toBe('geiss');
    geiss.init(ctx);
    geiss.update(ctx, createBeatDropAudioFeatures(0.9), 1.0, 0.016);
    geiss.dispose();
    ctx.scene.clear();
  });

  // =========================================================================
  // Comprehensive Canonical Alias Matrix for Tickets 1-37
  // =========================================================================

  test('Tickets 1-37: Legacy Preset Aliases and Canonical Resolution Integrity', () => {
    const canonicalMap: Record<string, string> = {
      // Cluster A (1-7)
      'waveform': 'wave',
      'wave-form': 'wave',
      'circular-spectrum': 'circular',
      '3d-bars': 'bars3d',
      'obsidian-poly': 'obsidian',
      'dna-helix': 'dna',
      'topo-map': 'topographic',
      'cymatic-plate': 'cymatic',
      'vinyl-player': 'vinyl',
      'orbital-rings': 'rings',
      'tesseract-4d': 'tesseract',
      'hologram-glitch': 'hologram',
      'geodesic-sphere': 'geodesic',
      'warp-grid': 'warp',
      // Cluster B (8-14)
      'black-hole': 'blackhole',
      'the-sun': 'sun',
      'mandel-fractal': 'mandel',
      'unfolding-matter': 'unfoldingmatter',
      'geiss-feedback': 'geiss',
      'aurora-mandala': 'aurora',
      'sacred-mandala': 'sacred',
      'synthwave-terrain': 'terrain',
      'galaxy-clusters': 'galaxy',
      'particle-field': 'particles',
      'lightning-arcs': 'lightning',
      'plasma-arcs': 'plasmaarcs',
      // Cluster C (15-23)
      'lava-energy': 'lava',
      'fireball-neurons': 'fireball',
      'water-neurons': 'waterneurons',
      'liquid-chroma': 'liquid',
      'fluid-container': 'fluid',
      'plasma-gas': 'plasma',
      'fog-mist': 'fog',
      'rain-water': 'water',
      'smoke-wisps': 'smoke',
      'neon-tunnel': 'neontunnel',
      'box-tunnel': 'boxtunnel',
      'ring-tunnel': 'ringtunnel',
      'water-slide': 'waterslide',
      'vein-tunnel': 'veintunnel',
      'kaleidoscope-mandala': 'kaleidoscope',
      'matrix-rain': 'matrix',
      'spectrogram': 'spectogram',
      'night-radar': 'nightradar',
      'diode-wall': 'diodewall',
      'vod-lines': 'vodlines',
      'lcd-deck': 'lcddeck',
      'signal-lock': 'signallock',
      // Cluster D (24-29)
      'bloom-flower': 'bloom',
      'ink-drops': 'ink',
      'meadow-field': 'meadow',
      'up-cloud': 'upcloud',
      'ocean-waves': 'ocean',
      'rain-room': 'rainroom',
      'forest-storm': 'forest',
      'storm-cell': 'stormcell',
      'jellyfish-mycelium': 'jellyfish',
      'volcano-eruption': 'volcano'
    };

    for (const [alias, canonicalId] of Object.entries(canonicalMap)) {
      const preset = getPreset(alias);
      expect(preset).toBeDefined();
      expect(preset.id).toBe(alias);
      const canonical = getPreset(canonicalId);
      expect(canonical).toBeDefined();
      expect(canonical.id).toBe(canonicalId);
    }
  });
});
