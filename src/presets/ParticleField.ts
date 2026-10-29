import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class ParticleFieldPreset implements VisualizerPreset {
  id = 'particle-field';
  name = 'Particle Swarm';
  category = 'Particles & Light' as const;
  description = 'Cosmic particle field expanding, swirling and reacting to audio energy.';

  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private readonly count = 6000;
  private basePositions!: Float32Array;

  init(ctx: PresetContext) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.basePositions = new Float32Array(this.count * 3);

    for (let i = 0; i < this.count; i++) {
      const radius = 2.0 + Math.random() * 8.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.basePositions[i * 3] = x;
      this.basePositions[i * 3 + 1] = y;
      this.basePositions[i * 3 + 2] = z;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.primary),
      size: 0.16,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    ctx.scene.add(this.points);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const expansion = 1.0 + audio.bass * 0.8 + audio.beatEnergy * 0.5;

    for (let i = 0; i < this.count; i++) {
      const bx = this.basePositions[i * 3];
      const by = this.basePositions[i * 3 + 1];
      const bz = this.basePositions[i * 3 + 2];

      const wave = Math.sin(time * 2.0 + i * 0.05) * (0.2 + audio.mid * 0.5);

      pos[i * 3] = bx * expansion + wave;
      pos[i * 3 + 1] = by * expansion + wave;
      pos[i * 3 + 2] = bz * expansion + wave;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.y += delta * (0.2 + audio.treble * 0.5);
    this.points.rotation.x += delta * (0.1 + audio.mid * 0.3);
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.color.set(theme.primary);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}
