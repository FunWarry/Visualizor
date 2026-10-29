import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class KaleidoscopeMandalaPreset implements VisualizerPreset {
  id = 'kaleidoscope-mandala';
  name = 'Kaleidoscope Mandala';
  category = 'Tunnels' as const;
  description = 'Symmetrical multi-fold kaleidoscopic mandala unfolding to audio harmonics.';

  private group!: THREE.Group;
  private readonly rings: THREE.LineSegments[] = [];
  private readonly numArms = 8;
  private readonly numRings = 16;
  private readonly materials: THREE.LineBasicMaterial[] = [];

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

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

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.z += delta * (0.15 + audio.mid * 0.5);

    for (let r = 0; r < this.numRings; r++) {
      const ring = this.rings[r];
      const freqIdx = Math.floor((r / this.numRings) * (audio.frequencyData.length * 0.4));
      const freq = (audio.frequencyData[freqIdx] || 0) / 255.0;

      // Oscillating counter-rotation per ring
      ring.rotation.z = Math.sin(time * 0.5 + r * 0.2) * (0.5 + freq);

      const scale = 1.0 + freq * 0.8 + (audio.beat ? 0.25 : 0);
      ring.scale.set(scale, scale, 1);
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    for (let r = 0; r < this.numRings; r++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        r / this.numRings
      );
      this.materials[r].color.copy(color);
    }
  }

  dispose() {
    this.rings.forEach(r => r.geometry.dispose());
    this.materials.forEach(m => m.dispose());
    this.group.removeFromParent();
  }
}

