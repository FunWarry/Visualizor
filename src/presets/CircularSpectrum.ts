import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class CircularSpectrumPreset extends BasePreset {
  public override readonly id = 'circular';
  public override readonly name = 'Circular';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Concentric circular rings expanding and vibrating to frequency bands.';

  private readonly rings: THREE.Line[] = [];
  private readonly ringGeometries: THREE.BufferGeometry[] = [];
  private readonly ringMaterials: THREE.LineBasicMaterial[] = [];
  private readonly numRings = 16;
  private readonly segments = 128;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rotation Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'radius', name: 'Ring Radius', min: 1.0, max: 5.0, step: 0.2, defaultValue: 3.0 },
      { id: 'density', name: 'Ring Count', min: 4, max: 16, step: 1, defaultValue: 16 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;
    this.ringGeometries.length = 0;
    this.ringMaterials.length = 0;

    for (let r = 0; r < this.numRings; r++) {
      const radius = 1.2 + r * 0.45;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array((this.segments + 1) * 3);

      for (let s = 0; s <= this.segments; s++) {
        const theta = (s / this.segments) * Math.PI * 2;
        positions[s * 3] = Math.cos(theta) * radius;
        positions[s * 3 + 1] = Math.sin(theta) * radius;
        positions[s * 3 + 2] = 0;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.ringGeometries.push(geom);

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
      this.ringMaterials.push(mat);

      const line = new THREE.Line(geom, mat);
      this.rings.push(line);
      this.group.add(line);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const radiusMultiplier = this.paramStore.getValue('radius') / 3.0;
    const activeRings = Math.floor(this.paramStore.getValue('density'));

    this.group.rotation.z += delta * (0.15 + audio.mid * 0.3 * reactivity) * speed;

    for (let r = 0; r < this.numRings; r++) {
      const line = this.rings[r];
      if (r >= activeRings) {
        line.visible = false;
        continue;
      }
      line.visible = true;

      const geom = this.ringGeometries[r];
      const pos = geom.attributes.position.array as Float32Array;
      const baseRadius = (1.2 + r * 0.45) * radiusMultiplier;
      const freqIndex = Math.floor((r / this.numRings) * (audio.frequencyData.length * 0.4));
      const freqVal = (audio.frequencyData[freqIndex] || 0) / 255.0;

      for (let s = 0; s <= this.segments; s++) {
        const theta = (s / this.segments) * Math.PI * 2;
        const waveIndex = Math.floor((s / this.segments) * audio.timeDomainData.length);
        const waveVal = ((audio.timeDomainData[waveIndex] || 128) - 128) / 128.0;

        const displacement = (freqVal * 0.6 + waveVal * (0.2 + audio.bass * 0.4)) * reactivity;
        const currentRadius = baseRadius + displacement;

        pos[s * 3] = Math.cos(theta) * currentRadius;
        pos[s * 3 + 1] = Math.sin(theta) * currentRadius;
        pos[s * 3 + 2] = Math.sin(theta * 6 + time * 3 * speed) * freqVal * 0.5 * reactivity;
      }

      geom.attributes.position.needsUpdate = true;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    for (let r = 0; r < this.numRings; r++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        r / this.numRings
      );
      this.ringMaterials[r].color.copy(color);
    }
  }
}
