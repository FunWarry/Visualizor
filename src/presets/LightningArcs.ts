import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class LightningArcsPreset implements VisualizerPreset {
  id = 'lightning-arcs';
  name = 'Lightning Plasma Arcs';
  category = 'Particles & Light' as const;
  description = 'High-voltage electric arcs discharging and branching on audio transients.';

  private group!: THREE.Group;
  private boltLines: THREE.Line[] = [];
  private boltGeometries: THREE.BufferGeometry[] = [];
  private boltMaterials: THREE.LineBasicMaterial[] = [];
  private numBolts = 14;
  private segmentsPerBolt = 24;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    for (let b = 0; b < this.numBolts; b++) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(this.segmentsPerBolt * 3);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.boltGeometries.push(geom);

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(ctx.theme.accent),
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });
      this.boltMaterials.push(mat);

      const line = new THREE.Line(geom, mat);
      this.boltLines.push(line);
      this.group.add(line);
    }

    ctx.scene.add(this.group);
  }

  private updateBolt(b: number, audio: AudioFeatures, time: number, ctx: PresetContext) {
    const geom = this.boltGeometries[b];
    const pos = geom.attributes.position.array as Float32Array;

    const angle = (b / this.numBolts) * Math.PI * 2 + Math.sin(time + b) * 0.2;
    const arcLength = 2.0 + audio.bass * 6.0 + audio.beatEnergy * 5.0;
    const endX = Math.cos(angle) * arcLength;
    const endY = Math.sin(angle) * arcLength;
    const jitter = 0.35 + audio.treble * 0.8;

    for (let s = 0; s < this.segmentsPerBolt; s++) {
      const t = s / (this.segmentsPerBolt - 1);
      const isIntermediate = s > 0 && s < this.segmentsPerBolt - 1;
      const noise = isIntermediate ? jitter : 0;

      pos[s * 3] = endX * t + (Math.random() - 0.5) * noise;
      pos[s * 3 + 1] = endY * t + (Math.random() - 0.5) * noise;
      pos[s * 3 + 2] = (Math.random() - 0.5) * noise;
    }

    geom.attributes.position.needsUpdate = true;

    const mat = this.boltMaterials[b];
    if (audio.beat) {
      mat.opacity = 1.0;
      mat.color.set(ctx.theme.glow);
    } else {
      mat.opacity = 0.4 + Math.random() * 0.4;
      mat.color.set(ctx.theme.accent);
    }
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.z += delta * (0.2 + audio.treble * 0.4);

    for (let b = 0; b < this.numBolts; b++) {
      this.updateBolt(b, audio, time, ctx);
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.boltMaterials.forEach(m => m.color.set(theme.accent));
  }

  dispose() {
    this.boltGeometries.forEach(g => g.dispose());
    this.boltMaterials.forEach(m => m.dispose());
    this.group.removeFromParent();
  }
}

