import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class RingTunnelPreset extends BasePreset {
  public override readonly id = 'ringtunnel';
  public override readonly name = 'Ring Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = '48 concentric circular torus rings extending into depth with golden-ratio waves.';
  public override cameraConfig = {
    position: [0, 0, 3] as [number, number, number],
    target: [0, 0, -40] as [number, number, number],
    autoRotate: false
  };

  private readonly rings: THREE.Mesh[] = [];
  private readonly numRings = 48;
  private readonly spacing = 1.2;
  private readonly materials: THREE.MeshStandardMaterial[] = [];
  private themeCache: VisualizerTheme | null = null;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Fly Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Ring Pulse', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Ring Radius', min: 2.0, max: 5.5, step: 0.2, defaultValue: 3.6 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;
    this.materials.length = 0;
    this.themeCache = ctx.theme;

    const radius = this.paramStore.getValue('density');
    const torusGeom = new THREE.TorusGeometry(radius, 0.06, 16, 64);

    for (let i = 0; i < this.numRings; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: this.computeRingColor(i, 0, 0, 0, 0),
        emissive: new THREE.Color(ctx.theme.accent),
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85
      });
      this.materials.push(mat);

      const ring = new THREE.Mesh(torusGeom, mat);
      ring.position.z = -i * this.spacing;
      this.rings.push(ring);
      this.group.add(ring);
    }
  }

  private computeRingColor(i: number, time: number, bass: number, mid: number, treble: number): THREE.Color {
    const theme = this.themeCache;
    if (!theme) return new THREE.Color(0xffffff);

    const c1 = new THREE.Color(theme.primary);
    const c2 = new THREE.Color(theme.secondary);

    const colorPhase = i * 0.15 + time * 0.06;
    const col = new THREE.Color().lerpColors(c1, c2, 0.5 + 0.5 * Math.sin(colorPhase));

    col.r += c1.r * treble * 0.25 + c2.r * mid * 0.1;
    col.g += c1.g * treble * 0.25 + c2.g * mid * 0.1;
    col.b += c1.b * treble * 0.25 + c2.b * mid * 0.1;

    const cellRand = Math.abs(Math.sin(i * 3.73 + 0.5) * 43758.5453) % 1.0;
    if (cellRand > 0.6) {
      col.addScalar(bass * 0.8);
    }

    return col;
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const totalSpan = this.numRings * this.spacing;
    const moveZ = delta * (6.0 + audio.bass * 10.0 * reactivity) * speed;

    const bass = audio.bass * reactivity;
    const mid = audio.mid * reactivity;
    const treble = audio.treble * reactivity;

    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      ring.position.z += moveZ;

      if (ring.position.z > 2.0) {
        ring.position.z -= totalSpan;
      }

      // Golden ratio phase & wave wobble
      const ringPhase = i * 1.618;
      const wobbleAmt = 0.02 + bass * 0.06 + mid * 0.03;
      const wobble = Math.sin(time * 1.2 + ringPhase) * wobbleAmt;
      const waveCount = 3.0 + (i % 5);
      const angularWave = Math.sin(time * 0.8 + ringPhase) * (0.01 + bass * 0.03);

      ring.rotation.z = angularWave * waveCount;
      ring.rotation.x = wobble;

      // Depth fade & dynamic scaling
      const depthRatio = Math.max(0, 1 - Math.abs(ring.position.z) / totalSpan);
      const pulse = 1.0 + Math.sin(time * 3.0 + ringPhase) * 0.12 * (1.0 + bass);
      const beatBoost = audio.beat ? 1.25 : 1.0;
      const scale = pulse * beatBoost;
      ring.scale.set(scale, scale, 1.0);

      // Material color & emissive reactivity
      const col = this.computeRingColor(i, time, bass, mid, treble);
      const mat = this.materials[i];
      mat.color.copy(col);
      mat.opacity = 0.15 + depthRatio * 0.8;
      mat.emissiveIntensity = 0.3 + (bass * 0.8 + (audio.beat ? 0.6 : 0)) * reactivity;
    }

    this.group.rotation.z += delta * 0.2 * speed;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.themeCache = theme;
    for (let i = 0; i < this.numRings; i++) {
      const color = this.computeRingColor(i, 0, 0, 0, 0);
      this.materials[i].color.copy(color);
      this.materials[i].emissive.set(theme.accent);
    }
  }

  protected override onDispose(): void {
    for (const r of this.rings) {
      r.geometry.dispose();
    }
    this.rings.length = 0;
    for (const m of this.materials) {
      m.dispose();
    }
    this.materials.length = 0;
  }
}
