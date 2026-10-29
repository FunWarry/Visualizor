import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class StarfieldPreset implements VisualizerPreset {
  id = 'starfield';
  name = 'Starfield Warp';
  category = 'Abstract & Space' as const;
  description = 'Warp-speed cosmic starfield accelerating dynamically on kicks.';

  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private count = 4000;
  private speeds!: Float32Array;

  init(ctx: PresetContext) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.speeds = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      this.speeds[i] = 0.4 + Math.random() * 0.8;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    ctx.scene.add(this.points);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const warpSpeed = 10.0 + audio.bass * 40.0 + audio.beatEnergy * 50.0;

    for (let i = 0; i < this.count; i++) {
      pos[i * 3 + 2] += delta * warpSpeed * this.speeds[i];

      // Reset star when it flies past camera
      if (pos[i * 3 + 2] > 20) {
        pos[i * 3 + 2] = -40;
        pos[i * 3] = (Math.random() - 0.5) * 50;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.z += delta * (0.05 + audio.treble * 0.2);
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.color.set(theme.accent);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}
