import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class CircularSpectrumPreset implements VisualizerPreset {
  id = 'circular-spectrum';
  name = 'Circular Spectrum';
  category = 'Structures' as const;
  description = 'Concentric circular rings expanding and vibrating to frequency bands.';

  private group!: THREE.Group;
  private readonly rings: THREE.Line[] = [];
  private readonly ringGeometries: THREE.BufferGeometry[] = [];
  private readonly ringMaterials: THREE.LineBasicMaterial[] = [];
  private readonly numRings = 16;
  private readonly segments = 128;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

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

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.z += delta * (0.15 + audio.mid * 0.3);

    for (let r = 0; r < this.numRings; r++) {
      const geom = this.ringGeometries[r];
      const pos = geom.attributes.position.array as Float32Array;
      const baseRadius = 1.2 + r * 0.45;
      const freqIndex = Math.floor((r / this.numRings) * (audio.frequencyData.length * 0.4));
      const freqVal = (audio.frequencyData[freqIndex] || 0) / 255.0;

      for (let s = 0; s <= this.segments; s++) {
        const theta = (s / this.segments) * Math.PI * 2;
        const waveIndex = Math.floor((s / this.segments) * audio.timeDomainData.length);
        const waveVal = ((audio.timeDomainData[waveIndex] || 128) - 128) / 128.0;

        const displacement = freqVal * 0.6 + waveVal * (0.2 + audio.bass * 0.4);
        const currentRadius = baseRadius + displacement;

        pos[s * 3] = Math.cos(theta) * currentRadius;
        pos[s * 3 + 1] = Math.sin(theta) * currentRadius;
        pos[s * 3 + 2] = Math.sin(theta * 6 + time * 3) * freqVal * 0.5;
      }

      geom.attributes.position.needsUpdate = true;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    for (let r = 0; r < this.numRings; r++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        r / this.numRings
      );
      this.ringMaterials[r].color.copy(color);
    }
  }

  dispose() {
    this.ringGeometries.forEach(g => g.dispose());
    this.ringMaterials.forEach(m => m.dispose());
    this.group.removeFromParent();
  }
}
