import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class VolcanoPreset extends BasePreset {
  public override readonly id = 'volcano';
  public override readonly name = 'Volcano';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = '3D caldera cone mountain erupting molten magma particles.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mountainMesh!: THREE.Mesh;
  private magmaLake!: THREE.Mesh;
  private lavaSparks!: THREE.Points;
  private mountainMaterial!: THREE.MeshStandardMaterial;
  private magmaMaterial!: THREE.MeshBasicMaterial;
  private sparkMaterial!: THREE.PointsMaterial;
  private sparkPositions!: Float32Array;
  private sparkVelocities!: Float32Array;
  private readonly sparkCount = 1000;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Eruption Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Pyroclastic Force', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Caldera Scale', min: 1.0, max: 4.0, step: 0.2, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.group.position.y = -2;

    // 1. Volcano Mountain Cone
    const mountainGeom = new THREE.CylinderGeometry(1.2, 5.0, 3.5, 32, 8, true);
    this.mountainMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.06),
      roughness: 0.95,
      metalness: 0.1
    });
    this.mountainMesh = new THREE.Mesh(mountainGeom, this.mountainMaterial);
    this.mountainMesh.position.y = 1.75;
    this.group.add(this.mountainMesh);

    // 2. Glowing Magma Crater Lake
    const lakeGeom = new THREE.CircleGeometry(1.15, 32);
    lakeGeom.rotateX(-Math.PI / 2);
    this.magmaMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.accent)
    });
    this.magmaLake = new THREE.Mesh(lakeGeom, this.magmaMaterial);
    this.magmaLake.position.y = 3.4;
    this.group.add(this.magmaLake);

    // 3. Erupting Lava Spark Particles
    const sparkGeom = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(this.sparkCount * 3);
    this.sparkVelocities = new Float32Array(this.sparkCount * 3);

    for (let i = 0; i < this.sparkCount; i++) {
      this.resetSpark(i);
      this.sparkPositions[i * 3 + 1] = 3.5 + Math.random() * 3.0;
    }
    sparkGeom.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));

    this.sparkMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.lavaSparks = new THREE.Points(sparkGeom, this.sparkMaterial);
    this.group.add(this.lavaSparks);
  }

  private resetSpark(i: number) {
    this.sparkPositions[i * 3] = (Math.random() - 0.5) * 1.0;
    this.sparkPositions[i * 3 + 1] = 3.5;
    this.sparkPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;

    const angle = Math.random() * Math.PI * 2;
    const spread = Math.random() * 1.5;
    this.sparkVelocities[i * 3] = Math.cos(angle) * spread;
    this.sparkVelocities[i * 3 + 1] = 4.0 + Math.random() * 6.0;
    this.sparkVelocities[i * 3 + 2] = Math.sin(angle) * spread;
  }

  public update(ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.1 * speed;

    if (audio.beat) {
      this.magmaMaterial.color.set(ctx.theme.primary);
      this.sparkMaterial.size = 0.32 * reactivity;
    } else {
      this.magmaMaterial.color.set(ctx.theme.accent);
      this.sparkMaterial.size = 0.16;
    }

    const pos = (this.lavaSparks.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const gravity = 9.8 * delta;
    const eruptionBoost = audio.bass * 4.0 * reactivity;

    for (let i = 0; i < this.sparkCount; i++) {
      const idx = i * 3;
      pos[idx] += this.sparkVelocities[idx] * delta * speed;
      pos[idx + 1] += (this.sparkVelocities[idx + 1] + eruptionBoost) * delta * speed;
      pos[idx + 2] += this.sparkVelocities[idx + 2] * delta * speed;

      this.sparkVelocities[idx + 1] -= gravity;

      if (pos[idx + 1] < 1.0) {
        this.resetSpark(i);
      }
    }
    this.lavaSparks.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.magmaMaterial.color.set(theme.accent);
    this.sparkMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.mountainMesh) {
      this.mountainMesh.geometry.dispose();
      this.mountainMaterial?.dispose();
    }
    if (this.magmaLake) {
      this.magmaLake.geometry.dispose();
      this.magmaMaterial?.dispose();
    }
    if (this.lavaSparks) {
      this.lavaSparks.geometry.dispose();
      this.sparkMaterial?.dispose();
    }
  }
}
