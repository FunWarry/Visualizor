import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class BloomFlowerPreset extends BasePreset {
  public override readonly id = 'bloom';
  public override readonly name = 'Bloom';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Watercolor phyllotaxis flower petals opening and closing.';
  public override cameraConfig = {
    position: [0, 6, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };

  private readonly petals: THREE.Mesh[] = [];
  private petalMaterial!: THREE.MeshStandardMaterial;
  private readonly petalBaseRotations: number[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Spin Rate', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Petal Bloom', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Petal Count', min: 20, max: 55, step: 5, defaultValue: 34 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.petals.length = 0;
    this.petalBaseRotations.length = 0;
    this.group.rotation.set(0, 0, 0);

    const petalCount = Math.floor(this.paramStore.getValue('density'));
    const goldenAngle = 137.5 * (Math.PI / 180);
    const petalGeom = new THREE.ConeGeometry(0.5, 2.2, 5);

    this.petalMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.35,
      roughness: 0.2,
      metalness: 0.1
    });

    for (let i = 0; i < petalCount; i++) {
      const radius = 0.4 + Math.sqrt(i) * 0.45;
      const theta = i * goldenAngle;

      const petal = new THREE.Mesh(petalGeom, this.petalMaterial);
      petal.position.set(Math.cos(theta) * radius, (i / petalCount) * 0.4, Math.sin(theta) * radius);

      const openAngle = 0.4 + (i / petalCount) * 0.8;
      petal.rotation.y = theta;
      petal.rotation.z = openAngle;
      this.petalBaseRotations.push(openAngle);

      this.petals.push(petal);
      this.group.add(petal);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.18 * speed;

    const openMod = (audio.bass * 0.5 + audio.beatEnergy * 0.4) * reactivity;
    for (let i = 0; i < this.petals.length; i++) {
      this.petals[i].rotation.z = this.petalBaseRotations[i] + openMod;
    }

    if (audio.beat) {
      this.petalMaterial.emissiveIntensity = 1.0 * reactivity;
    } else {
      this.petalMaterial.emissiveIntensity = Math.max(0.3, this.petalMaterial.emissiveIntensity * 0.94);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.petalMaterial.color.set(theme.primary);
    this.petalMaterial.emissive.set(theme.accent);
  }

  protected override onDispose(): void {
    for (const p of this.petals) {
      p.geometry.dispose();
    }
    this.petals.length = 0;
    this.petalBaseRotations.length = 0;
    this.petalMaterial?.dispose();
  }
}
