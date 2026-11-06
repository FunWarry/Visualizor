import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class FirefliesPreset extends BasePreset {
  public override readonly id = 'fireflies';
  public override readonly name = 'Fireflies';
  public override readonly category = 'Particles & Light' as const;
  public override readonly description = 'Bioluminescent swarm of wandering fireflies pulsing softly.';
  public override cameraConfig = {
    position: [0, 2, 12] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };

  private points!: THREE.Points;
  private material!: THREE.PointsMaterial;
  private positions!: Float32Array;
  private phases!: Float32Array;
  private readonly count = 1200;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Drift Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Biolum Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Glow Size', min: 0.1, max: 0.5, step: 0.02, defaultValue: 0.22 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geom = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.phases = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.positions[i * 3] = (Math.random() - 0.5) * 16;
      this.positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      this.positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
      this.phases[i] = Math.random() * Math.PI * 2;
    }

    geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: this.paramStore.getValue('density'),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geom, this.material);
    this.group.add(this.points);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const baseSize = this.paramStore.getValue('density');

    const pos = (this.points.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const speedMultiplier = (1.0 + audio.mid * 2.0 * reactivity) * speed;

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const phase = this.phases[i];

      pos[idx] += Math.sin(time * 1.5 + phase) * delta * speedMultiplier;
      pos[idx + 1] += Math.cos(time * 1.2 + phase * 1.3) * delta * speedMultiplier;
      pos[idx + 2] += Math.sin(time * 0.9 + phase * 0.7) * delta * speedMultiplier;

      if (pos[idx] > 10) pos[idx] = -10;
      if (pos[idx] < -10) pos[idx] = 10;
      if (pos[idx + 1] > 8) pos[idx + 1] = -8;
      if (pos[idx + 1] < -8) pos[idx + 1] = 8;
      if (pos[idx + 2] > 7) pos[idx + 2] = -7;
      if (pos[idx + 2] < -7) pos[idx + 2] = 7;
    }

    this.points.geometry.attributes.position.needsUpdate = true;

    const beatPulse = audio.beat ? (baseSize * 1.6) : baseSize;
    this.material.size = beatPulse + audio.treble * 0.15 * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.accent);
  }
}
