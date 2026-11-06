import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class NeonTunnelPreset extends BasePreset {
  public override readonly id = 'neontunnel';
  public override readonly name = 'Neon Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = 'Hexagonal neon corridor with strobing light strip battens.';
  public override cameraConfig = {
    position: [0, 0, 4] as [number, number, number],
    target: [0, 0, -50] as [number, number, number],
    autoRotate: false
  };

  private readonly rings: THREE.LineSegments[] = [];
  private readonly numRings = 40;
  private readonly ringSpacing = 1.8;
  private readonly materials: THREE.LineBasicMaterial[] = [];

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

    for (let i = 0; i < this.numRings; i++) {
      const geom = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const sides = 6;
      const radius = 3.5;

      for (let s = 0; s < sides; s++) {
        const a1 = (s / sides) * Math.PI * 2;
        const a2 = ((s + 1) / sides) * Math.PI * 2;
        vertices.push(
          Math.cos(a1) * radius, Math.sin(a1) * radius, 0,
          Math.cos(a2) * radius, Math.sin(a2) * radius, 0
        );
      }
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const color = new THREE.Color().lerpColors(
        new THREE.Color(ctx.theme.primary),
        new THREE.Color(ctx.theme.accent),
        i / this.numRings
      );

      const mat = new THREE.LineBasicMaterial({
        color,
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

    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      if (i >= activeRings) {
        ring.visible = false;
        continue;
      }
      ring.visible = true;

      ring.position.z += delta * traverseSpeed;

      if (ring.position.z > 5) {
        ring.position.z -= this.numRings * this.ringSpacing;
      }

      ring.rotation.z = Math.sin(time * 0.5 * speed + i * 0.15) * 0.5;
      const scale = zoom * (1.0 + (audio.beat ? 0.25 * reactivity : 0) * (1 - Math.abs(ring.position.z) / 40));
      ring.scale.set(scale, scale, 1);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    for (let i = 0; i < this.numRings; i++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        i / this.numRings
      );
      this.materials[i].color.copy(color);
    }
  }
}
