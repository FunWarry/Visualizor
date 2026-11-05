import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class InkDiffusionPreset extends BasePreset {
  public override readonly id = 'ink';
  public override readonly name = 'Ink';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Rayleigh-Taylor fluid ink droplet diffusion plumes in water.';

  private inkParticles!: THREE.Points;
  private inkMaterial!: THREE.PointsMaterial;
  private readonly inkCount = 1200;
  private inkPositions!: Float32Array;
  private inkVelocities!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Diffusion Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Burst Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Plume Spread', min: 4.0, max: 16.0, step: 1.0, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const inkGeom = new THREE.BufferGeometry();
    this.inkPositions = new Float32Array(this.inkCount * 3);
    this.inkVelocities = new Float32Array(this.inkCount * 3);

    for (let i = 0; i < this.inkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 2.0;
      this.inkPositions[i * 3] = Math.cos(angle) * r;
      this.inkPositions[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      this.inkPositions[i * 3 + 2] = Math.sin(angle) * r;

      this.inkVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
      this.inkVelocities[i * 3 + 1] = -0.2 - Math.random() * 0.4; // downward settling plume
      this.inkVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    inkGeom.setAttribute('position', new THREE.BufferAttribute(this.inkPositions, 3));

    this.inkMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.primary),
      size: 0.3,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });

    this.inkParticles = new THREE.Points(inkGeom, this.inkMaterial);
    this.group.add(this.inkParticles);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const pos = (this.inkParticles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const burst = (audio.beat ? 2.5 : 0.8) * reactivity;

    for (let i = 0; i < this.inkCount; i++) {
      const idx = i * 3;
      pos[idx] += this.inkVelocities[idx] * delta * burst * speed;
      pos[idx + 1] += this.inkVelocities[idx + 1] * delta * speed;
      pos[idx + 2] += this.inkVelocities[idx + 2] * delta * burst * speed;

      // Swirling curl noise
      pos[idx] += Math.sin(time + pos[idx + 1] * 0.8) * delta * 0.4;

      if (pos[idx + 1] < -5.0 || Math.hypot(pos[idx], pos[idx + 2]) > 7.0) {
        pos[idx] = (Math.random() - 0.5) * 1.5;
        pos[idx + 1] = 4.0;
        pos[idx + 2] = (Math.random() - 0.5) * 1.5;
      }
    }
    this.inkParticles.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.inkMaterial.color.set(theme.primary);
  }
}
