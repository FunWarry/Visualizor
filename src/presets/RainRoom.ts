import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class RainRoomPreset extends BasePreset {
  public override readonly id = 'rainroom';
  public override readonly name = 'Rain Room';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = '5k vertical rain streaks in dark spotlight cone with splashes.';

  private rainLines!: THREE.LineSegments;
  private splashPoints!: THREE.Points;
  private rainMaterial!: THREE.LineBasicMaterial;
  private splashMaterial!: THREE.PointsMaterial;
  private readonly rainCount = 3000;
  private rainPositions!: Float32Array;
  private splashPositions!: Float32Array;
  private readonly splashCount = 200;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rainfall Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Downpour Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Spotlight Radius', min: 4.0, max: 12.0, step: 0.5, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const radius = this.paramStore.getValue('density');

    // 1. Vertical rain streaks
    const rainGeom = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 2 * 3);

    for (let i = 0; i < this.rainCount; i++) {
      const x = (Math.random() - 0.5) * radius * 2.0;
      const z = (Math.random() - 0.5) * radius * 2.0;
      const y = -4 + Math.random() * 12.0;
      const len = 0.4 + Math.random() * 0.6;

      const idx = i * 6;
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;

      this.rainPositions[idx + 3] = x;
      this.rainPositions[idx + 4] = y - len;
      this.rainPositions[idx + 5] = z;
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    this.rainMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.65
    });
    this.rainLines = new THREE.LineSegments(rainGeom, this.rainMaterial);
    this.group.add(this.rainLines);

    // 2. Floor splash particles
    const splashGeom = new THREE.BufferGeometry();
    this.splashPositions = new Float32Array(this.splashCount * 3);
    for (let i = 0; i < this.splashCount; i++) {
      this.splashPositions[i * 3] = (Math.random() - 0.5) * radius * 1.8;
      this.splashPositions[i * 3 + 1] = -4.0;
      this.splashPositions[i * 3 + 2] = (Math.random() - 0.5) * radius * 1.8;
    }
    splashGeom.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));

    this.splashMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.primary),
      size: 0.15,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.splashPoints = new THREE.Points(splashGeom, this.splashMaterial);
    this.group.add(this.splashPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const fallSpeed = (16.0 + audio.bass * 25.0 * reactivity) * speed;
    const pos = (this.rainLines.geometry.attributes.position.array as Float32Array);

    for (let i = 0; i < this.rainCount; i++) {
      const idx = i * 6;
      pos[idx + 1] -= delta * fallSpeed;
      pos[idx + 4] -= delta * fallSpeed;

      if (pos[idx + 1] < -4.0) {
        pos[idx + 1] = 8.0;
        pos[idx + 4] = 8.0 - 0.5;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;

    // Splashes expand on beat
    this.splashMaterial.size = (audio.beat ? 0.35 : 0.15) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.rainMaterial.color.set(theme.accent);
    this.splashMaterial.color.set(theme.primary);
  }
}
