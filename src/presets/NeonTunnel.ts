import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class NeonTunnelPreset extends BasePreset {
  public override readonly id = 'neontunnel';
  public override readonly name = 'Neon Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = 'Hexagonal neon corridor with strobing light strip battens and vortex warp.';
  public override cameraConfig = {
    position: [0, 0, 4] as [number, number, number],
    target: [0, 0, -50] as [number, number, number],
    autoRotate: false
  };

  private readonly rings: THREE.LineSegments[] = [];
  private readonly numRings = 40;
  private readonly ringSpacing = 1.8;
  private readonly materials: THREE.LineBasicMaterial[] = [];

  private readonly primaryCol = new THREE.Color('#00ffff');
  private readonly secondaryCol = new THREE.Color('#ff0055');
  private readonly accentCol = new THREE.Color('#ffaa00');

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Flight Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Glow Pulse', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'zoom', name: 'Tunnel Zoom', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Segment Rings', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;
    this.materials.length = 0;

    this.primaryCol.set(ctx.theme.primary);
    this.secondaryCol.set(ctx.theme.secondary);
    this.accentCol.set(ctx.theme.accent);

    const sides = 6;
    const radius = 3.5;

    for (let i = 0; i < this.numRings; i++) {
      const geom = new THREE.BufferGeometry();
      const vertices: number[] = [];

      for (let s = 0; s < sides; s++) {
        const a1 = (s / sides) * Math.PI * 2;
        const a2 = ((s + 1) / sides) * Math.PI * 2;
        vertices.push(
          Math.cos(a1) * radius, Math.sin(a1) * radius, 0,
          Math.cos(a2) * radius, Math.sin(a2) * radius, 0
        );
      }
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const mat = new THREE.LineBasicMaterial({
        color: this.calcPaletteColor(i / this.numRings, 0),
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.materials.push(mat);

      const ring = new THREE.LineSegments(geom, mat);
      ring.position.z = -i * this.ringSpacing;
      this.rings.push(ring);
      this.group.add(ring);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed') ?? 1.0;
    const reactivity = this.paramStore.getValue('reactivity') ?? 1.0;
    const zoom = this.paramStore.getValue('zoom') ?? 1.0;
    const density = this.paramStore.getValue('density') ?? 1.0;

    const traverseSpeed = (12.0 + audio.bass * 25.0 * reactivity) * speed;
    const activeRings = Math.floor(this.numRings * density);
    const maxDepth = this.numRings * this.ringSpacing;

    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      if (i >= activeRings) {
        ring.visible = false;
        continue;
      }
      ring.visible = true;

      ring.position.z += delta * traverseSpeed;
      if (ring.position.z > 5) {
        ring.position.z -= maxDepth;
      }

      this.updateRingTransform(ring, i, time, speed, zoom, reactivity, audio);
    }
  }

  private updateRingTransform(
    ring: THREE.LineSegments,
    index: number,
    time: number,
    speed: number,
    zoom: number,
    reactivity: number,
    audio: AudioFeatures
  ): void {
    const depthFrac = Math.max(0.0, Math.min(1.0, -ring.position.z / (this.numRings * this.ringSpacing)));

    // Authentic twist & wobble rotation
    const twist = Math.sin(depthFrac * 4.0 + time * 1.5) * 0.25 * (1.0 + audio.mid * reactivity);
    const wobble = Math.sin(time * 2.0 * speed + index * 0.2) * 0.35 * (1.0 + audio.bass * reactivity);
    ring.rotation.z = twist + wobble;

    // Authentic pulse scale
    const beatPulse = (audio.beat ? 0.35 : 0.0) * (1.0 - depthFrac);
    const bassPulse = audio.bass * 0.25 * reactivity * (1.0 - depthFrac * 0.5);
    const scale = zoom * (1.0 + beatPulse + bassPulse);
    ring.scale.set(scale, scale, 1);

    // Dynamic neon color shift along depth
    const col = this.calcPaletteColor(depthFrac + time * 0.1, audio.treble * reactivity);
    this.materials[index].color.copy(col);
    this.materials[index].opacity = Math.max(0.15, (1.0 - depthFrac * 0.75) * (0.7 + audio.rms * 0.5));
  }

  private calcPaletteColor(t: number, trebleBoost: number): THREE.Color {
    // Cosine palette: 0.5 + 0.5 * cos(TAU * (t + colorMix))
    const tau = Math.PI * 2;
    const r = 0.5 + 0.5 * Math.cos(tau * (t + this.primaryCol.r * 0.7 + this.secondaryCol.r * 0.3));
    const g = 0.5 + 0.5 * Math.cos(tau * (t * 1.1 + this.primaryCol.g * 0.7 + this.secondaryCol.g * 0.3));
    const b = 0.5 + 0.5 * Math.cos(tau * (t * 0.9 + this.primaryCol.b * 0.7 + this.secondaryCol.b * 0.3));

    const out = new THREE.Color(r, g, b);
    if (trebleBoost > 0) {
      out.lerp(this.accentCol, Math.min(1.0, trebleBoost * 0.5));
    }
    return out;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.primaryCol.set(theme.primary);
    this.secondaryCol.set(theme.secondary);
    this.accentCol.set(theme.accent);

    for (let i = 0; i < this.numRings; i++) {
      const color = this.calcPaletteColor(i / this.numRings, 0);
      this.materials[i].color.copy(color);
    }
  }

  protected override onDispose(): void {
    for (const r of this.rings) {
      r.geometry.dispose();
    }
    for (const m of this.materials) {
      m.dispose();
    }
    this.rings.length = 0;
    this.materials.length = 0;
  }
}
