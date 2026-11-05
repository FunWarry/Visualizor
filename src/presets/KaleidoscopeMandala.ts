import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class KaleidoscopeMandalaPreset extends BasePreset {
  public override readonly id = 'kaleidoscope';
  public override readonly name = 'Kaleidoscope';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = 'N-fold kaleidoscopic mirror symmetry mandala reflections.';

  private readonly rings: THREE.LineSegments[] = [];
  private readonly numArms = 8;
  private readonly numRings = 16;
  private readonly materials: THREE.LineBasicMaterial[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Spin Rate', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Mandala Bloom', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Symmetry Fold', min: 4.0, max: 16.0, step: 2.0, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;
    this.materials.length = 0;

    for (let r = 0; r < this.numRings; r++) {
      const radius = 1.0 + r * 0.45;
      const geom = new THREE.BufferGeometry();
      const vertices: number[] = [];

      for (let a = 0; a < this.numArms; a++) {
        const theta1 = (a / this.numArms) * Math.PI * 2;
        const theta2 = ((a + 0.5) / this.numArms) * Math.PI * 2;
        const theta3 = ((a + 1) / this.numArms) * Math.PI * 2;

        const x1 = Math.cos(theta1) * radius;
        const y1 = Math.sin(theta1) * radius;
        const x2 = Math.cos(theta2) * (radius * 1.3);
        const y2 = Math.sin(theta2) * (radius * 1.3);
        const x3 = Math.cos(theta3) * radius;
        const y3 = Math.sin(theta3) * radius;

        vertices.push(x1, y1, 0, x2, y2, 0, x2, y2, 0, x3, y3, 0);
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const color = new THREE.Color().lerpColors(
        new THREE.Color(ctx.theme.primary),
        new THREE.Color(ctx.theme.accent),
        r / this.numRings
      );

      const mat = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.85
      });
      this.materials.push(mat);

      const line = new THREE.LineSegments(geom, mat);
      this.rings.push(line);
      this.group.add(line);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed') ?? 1.0;
    const reactivity = this.paramStore.getValue('reactivity') ?? 1.0;

    this.group.rotation.z += delta * (0.15 + audio.mid * 0.5 * reactivity) * speed;

    for (let r = 0; r < this.numRings; r++) {
      const ring = this.rings[r];
      const freqIdx = Math.floor((r / this.numRings) * (audio.frequencyData.length * 0.4));
      const freq = (audio.frequencyData[freqIdx] || 0) / 255.0;

      ring.rotation.z = Math.sin(time * 0.5 * speed + r * 0.2) * (0.5 + freq * reactivity);
      const scale = 1.0 + freq * 0.8 * reactivity + (audio.beat ? 0.25 * reactivity : 0);
      ring.scale.set(scale, scale, 1);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    for (let r = 0; r < this.numRings; r++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        r / this.numRings
      );
      this.materials[r].color.copy(color);
    }
  }
}
