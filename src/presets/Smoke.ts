import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class SmokePreset extends BasePreset {
  public override readonly id = 'smoke';
  public override readonly name = 'Smoke';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Volumetric curl wisps with rising thermal buoyancy.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private smokePoints!: THREE.Points;
  private smokeMaterial!: THREE.PointsMaterial;
  private readonly smokeCount = 1200;
  private smokePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rise Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Curl Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Wisp Spread', min: 5.0, max: 20.0, step: 1.0, defaultValue: 12.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const smokeGeom = new THREE.BufferGeometry();
    this.smokePositions = new Float32Array(this.smokeCount * 3);

    const spread = this.paramStore.getValue('density');
    for (let i = 0; i < this.smokeCount; i++) {
      this.smokePositions[i * 3] = (Math.random() - 0.5) * spread;
      this.smokePositions[i * 3 + 1] = -4 + Math.random() * 8.0;
      this.smokePositions[i * 3 + 2] = (Math.random() - 0.5) * (spread * 0.7);
    }
    smokeGeom.setAttribute('position', new THREE.BufferAttribute(this.smokePositions, 3));

    this.smokeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.45,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.smokePoints = new THREE.Points(smokeGeom, this.smokeMaterial);
    this.group.add(this.smokePoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const pos = (this.smokePoints.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < this.smokeCount; i++) {
      const idx = i * 3;
      // Thermal buoyancy + audio mid-frequency curl
      pos[idx + 1] += delta * (0.6 + audio.bass * 1.5 * reactivity) * speed;
      pos[idx] += Math.sin(time * 2.0 + i) * delta * (0.4 + audio.mid * reactivity);
      pos[idx + 2] += Math.cos(time * 1.8 + i) * delta * 0.3;

      if (pos[idx + 1] > 6.0) {
        pos[idx + 1] = -4.0;
        pos[idx] = (Math.random() - 0.5) * 8.0;
      }
    }
    this.smokePoints.geometry.attributes.position.needsUpdate = true;
    this.smokeMaterial.opacity = 0.3 + (audio.mid * 0.4 + (audio.beat ? 0.3 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.smokeMaterial.color.set(theme.accent);
  }
}
