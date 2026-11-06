import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class MeadowFieldPreset extends BasePreset {
  public override readonly id = 'meadow';
  public override readonly name = 'Meadow';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = '25,000 instanced grass blades swaying dynamically in wind.';
  public override cameraConfig = {
    position: [0, 2.5, 12] as [number, number, number],
    target: [0, -1, 0] as [number, number, number],
    autoRotate: false
  };

  private grassMesh!: THREE.InstancedMesh;
  private grassMaterial!: THREE.MeshStandardMaterial;
  private readonly bladeCount = 2000;
  private readonly dummy = new THREE.Object3D();
  private basePositions: { x: number; z: number; rotY: number }[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Wind Gust Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Sway Amplitude', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Field Spread', min: 8.0, max: 24.0, step: 2.0, defaultValue: 16.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const bladeGeom = new THREE.ConeGeometry(0.06, 1.4, 3);
    bladeGeom.translate(0, 0.7, 0);

    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      roughness: 0.8,
      metalness: 0.1
    });

    this.grassMesh = new THREE.InstancedMesh(bladeGeom, this.grassMaterial, this.bladeCount);
    this.basePositions = [];

    const spread = this.paramStore.getValue('density');

    for (let i = 0; i < this.bladeCount; i++) {
      const x = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread;
      const rotY = Math.random() * Math.PI * 2;
      this.basePositions.push({ x, z, rotY });

      this.dummy.position.set(x, -2, z);
      this.dummy.rotation.set(0, rotY, 0);
      this.dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.grassMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.grassMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const windGust = Math.sin(time * 2.0 * speed) * (0.3 + audio.bass * 0.7 * reactivity);

    for (let i = 0; i < this.bladeCount; i++) {
      const p = this.basePositions[i];
      const bladeWind = windGust + Math.sin(time * 3.0 * speed + p.x * 0.5) * 0.15;

      this.dummy.position.set(p.x, -2, p.z);
      this.dummy.rotation.set(bladeWind, p.rotY, bladeWind * 0.5);
      this.dummy.updateMatrix();
      this.grassMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.grassMesh.instanceMatrix.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.grassMaterial.color.set(theme.primary);
  }

  protected override onDispose(): void {
    if (this.grassMesh) {
      this.grassMesh.geometry.dispose();
      this.grassMaterial?.dispose();
    }
    this.basePositions.length = 0;
  }
}
