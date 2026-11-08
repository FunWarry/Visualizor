import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class RainRoomPreset extends BasePreset {
  public override readonly id = 'rainroom';
  public override readonly name = 'Rain Room';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = '3k vertical rain streaks in dark spotlight cone with dynamic floor splashes.';
  public override cameraConfig = {
    position: [0, 1.5, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.42
  };

  private rainLines!: THREE.LineSegments;
  private splashPoints!: THREE.Points;
  private rainMaterial!: THREE.LineBasicMaterial;
  private splashMaterial!: THREE.PointsMaterial;

  private readonly rainCount = 3000;
  private readonly splashCount = 300;
  private rainPositions!: Float32Array;
  private splashPositions!: Float32Array;
  private splashAges!: Float32Array;
  private splashVels!: Float32Array;
  private splashIndex = 0;

  private readonly fallScales = [0.75, 1.25, 1.7, 1.05];
  private readonly streakLengths = [0.45, 0.6, 0.75, 0.55];

  private readonly coolRainCol = new THREE.Color(0.82, 0.9, 1.0);
  private readonly accentCol = new THREE.Color();
  private readonly primaryCol = new THREE.Color();

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

    this.accentCol.set(ctx.theme.accent);
    this.primaryCol.set(ctx.theme.primary);

    // 1. Vertical rain streaks
    const rainGeom = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 2 * 3);

    for (let i = 0; i < this.rainCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.sqrt(Math.random()) * radius;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = -4.0 + Math.random() * 12.0;
      const len = this.streakLengths[i % 4];

      const idx = i * 6;
      this.rainPositions[idx] = x;
      this.rainPositions[idx + 1] = y;
      this.rainPositions[idx + 2] = z;

      this.rainPositions[idx + 3] = x;
      this.rainPositions[idx + 4] = y - len;
      this.rainPositions[idx + 5] = z;
    }
    rainGeom.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));

    const finalRainCol = new THREE.Color().copy(this.coolRainCol).lerp(this.accentCol, 0.35);
    this.rainMaterial = new THREE.LineBasicMaterial({
      color: finalRainCol,
      transparent: true,
      opacity: 0.82,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.rainLines = new THREE.LineSegments(rainGeom, this.rainMaterial);
    this.group.add(this.rainLines);

    // 2. Floor splash particles
    const splashGeom = new THREE.BufferGeometry();
    this.splashPositions = new Float32Array(this.splashCount * 3);
    this.splashAges = new Float32Array(this.splashCount);
    this.splashVels = new Float32Array(this.splashCount * 3);

    for (let i = 0; i < this.splashCount; i++) {
      this.splashPositions[i * 3] = 0;
      this.splashPositions[i * 3 + 1] = -4.0;
      this.splashPositions[i * 3 + 2] = 0;
      this.splashAges[i] = 1.0;
    }
    splashGeom.setAttribute('position', new THREE.BufferAttribute(this.splashPositions, 3));

    this.splashMaterial = new THREE.PointsMaterial({
      color: this.primaryCol,
      size: 0.16,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.splashPoints = new THREE.Points(splashGeom, this.splashMaterial);
    this.group.add(this.splashPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.updateRainStreaks(audio, speed, reactivity, delta);
    this.updateSplashes(audio, reactivity, delta);
  }

  private updateRainStreaks(audio: AudioFeatures, speed: number, reactivity: number, delta: number): void {
    const fallSpeed = (14.0 + audio.bass * 20.0 * reactivity + audio.treble * 10.0) * speed;
    const wind = audio.mid * 1.2 * reactivity;
    const pos = this.rainPositions;

    for (let i = 0; i < this.rainCount; i++) {
      const idx = i * 6;
      const scale = this.fallScales[i % 4];
      const len = this.streakLengths[i % 4];

      pos[idx + 1] -= delta * fallSpeed * scale;
      pos[idx + 4] = pos[idx + 1] - len;
      pos[idx + 3] = pos[idx] + wind * 0.12;

      if (pos[idx + 1] < -4.0) {
        this.spawnSplash(pos[idx], pos[idx + 2]);
        pos[idx + 1] = 8.0 + (i % 6) * 0.4;
        pos[idx + 4] = pos[idx + 1] - len;
      }
    }
    this.rainLines.geometry.attributes.position.needsUpdate = true;
  }

  private spawnSplash(x: number, z: number): void {
    const i = this.splashIndex;
    const idx = i * 3;
    this.splashPositions[idx] = x;
    this.splashPositions[idx + 1] = -3.98;
    this.splashPositions[idx + 2] = z;
    this.splashAges[i] = 0.0;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.2;
    this.splashVels[idx] = Math.cos(angle) * speed;
    this.splashVels[idx + 1] = 1.0 + Math.random() * 1.5;
    this.splashVels[idx + 2] = Math.sin(angle) * speed;

    this.splashIndex = (this.splashIndex + 1) % this.splashCount;
  }

  private updateSplashes(audio: AudioFeatures, reactivity: number, delta: number): void {
    const pos = this.splashPositions;
    const vels = this.splashVels;
    const ages = this.splashAges;

    for (let i = 0; i < this.splashCount; i++) {
      if (ages[i] >= 1.0) continue;

      ages[i] += delta * 3.5;
      const idx = i * 3;
      pos[idx] += vels[idx] * delta;
      pos[idx + 1] += vels[idx + 1] * delta;
      pos[idx + 2] += vels[idx + 2] * delta;
      vels[idx + 1] -= 9.8 * delta;

      if (pos[idx + 1] < -4.0) {
        pos[idx + 1] = -4.0;
        ages[i] = 1.0;
      }
    }
    this.splashPoints.geometry.attributes.position.needsUpdate = true;

    // Splashes expand and brighten on beat
    const baseSize = audio.beat ? 0.32 : 0.16;
    this.splashMaterial.size = baseSize * (1.0 + audio.bass * 0.5 * reactivity);
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.accentCol.set(theme.accent);
    this.primaryCol.set(theme.primary);

    const finalRainCol = new THREE.Color().copy(this.coolRainCol).lerp(this.accentCol, 0.35);
    this.rainMaterial.color.copy(finalRainCol);
    this.splashMaterial.color.copy(this.primaryCol);
  }

  protected override onDispose(): void {
    if (this.rainLines) {
      this.rainLines.geometry.dispose();
      this.rainMaterial?.dispose();
    }
    if (this.splashPoints) {
      this.splashPoints.geometry.dispose();
      this.splashMaterial?.dispose();
    }
  }
}
