import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class FirefliesPreset implements VisualizerPreset {
  id = 'fireflies';
  name = 'Fireflies Swarm';
  category = 'Particles & Light' as const;
  description = 'Bioluminescent swarm of wandering fireflies pulsing softly with audio dynamics.';

  private points!: THREE.Points;
  private material!: THREE.PointsMaterial;
  private positions!: Float32Array;
  private velocities!: Float32Array;
  private phases!: Float32Array;
  private count = 1200;

  init(ctx: PresetContext) {
    const geom = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.phases = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 16;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.4;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      this.phases[i] = Math.random() * Math.PI * 2;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(geom, this.material);
    ctx.scene.add(this.points);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    const pos = (this.points.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const speedMultiplier = 1.0 + audio.mid * 2.0;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;

      // Organic wandering noise
      const phase = this.phases[i];
      pos[idx] += Math.sin(time * 1.5 + phase) * delta * speedMultiplier;
      pos[idx + 1] += Math.cos(time * 1.2 + phase * 1.3) * delta * speedMultiplier;
      pos[idx + 2] += Math.sin(time * 0.9 + phase * 0.7) * delta * speedMultiplier;

      // Boundary wraparound
      if (pos[idx] > 10) pos[idx] = -10;
      if (pos[idx] < -10) pos[idx] = 10;
      if (pos[idx + 1] > 8) pos[idx + 1] = -8;
      if (pos[idx + 1] < -8) pos[idx + 1] = 8;
      if (pos[idx + 2] > 7) pos[idx + 2] = -7;
      if (pos[idx + 2] < -7) pos[idx + 2] = 7;
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    // Glowing size flicker reactive to treble & beats
    const beatPulse = audio.beat ? 0.35 : 0.18;
    this.material.size = beatPulse + audio.treble * 0.15;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.color.set(theme.accent);
  }

  dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}
