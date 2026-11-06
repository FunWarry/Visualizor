import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class OrbitalRingsPreset extends BasePreset {
  public override readonly id = 'rings';
  public override readonly name = 'Rings';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Multi-axis concentric nested torus rings orbiting central nucleus.';
  public override cameraConfig = {
    position: [0, 3, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.35
  };

  private readonly rings: THREE.Mesh[] = [];
  private coreMesh!: THREE.Mesh;
  private ringMaterial!: THREE.MeshStandardMaterial;
  private coreMaterial!: THREE.MeshStandardMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Orbit Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Gimbal Spread', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;

    // Glowing core nucleus
    const coreGeom = new THREE.SphereGeometry(1.2, 32, 32);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.8
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);

    // Multi-axis nested tori
    this.ringMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.secondary),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.3,
      roughness: 0.2,
      metalness: 0.9,
      wireframe: true
    });

    const radii = [2.4, 3.6, 4.8];
    for (const r of radii) {
      const torusGeom = new THREE.TorusGeometry(r, 0.15, 16, 64);
      const ring = new THREE.Mesh(torusGeom, this.ringMaterial);
      this.rings.push(ring);
      this.group.add(ring);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const spread = this.paramStore.getValue('density');

    // Core pulsing with bass and beat
    const coreScale = 1.0 + (audio.bass * 0.5 + audio.beatEnergy * 0.6) * reactivity;
    this.coreMesh.scale.setScalar(coreScale);

    if (this.rings.length >= 3) {
      // Ring 0: Pitch axis (Bass)
      this.rings[0].rotation.x += delta * (0.8 * speed + audio.bass * 1.5 * reactivity);
      this.rings[0].rotation.y = Math.sin(time * 0.5) * 0.3 * spread;

      // Ring 1: Roll axis (Mid)
      this.rings[1].rotation.y += delta * (0.6 * speed + audio.mid * 1.2 * reactivity);
      this.rings[1].rotation.z = Math.cos(time * 0.4) * 0.4 * spread;

      // Ring 2: Yaw axis (Treble)
      this.rings[2].rotation.z += delta * (0.5 * speed + audio.treble * 1.8 * reactivity);
      this.rings[2].rotation.x = Math.sin(time * 0.6) * 0.5 * spread;
    }

    if (audio.beat) {
      this.coreMaterial.emissiveIntensity = 1.0 * reactivity;
      this.ringMaterial.emissiveIntensity = 0.8 * reactivity;
    } else {
      this.coreMaterial.emissiveIntensity *= 0.93;
      this.ringMaterial.emissiveIntensity *= 0.95;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.coreMaterial.color.set(theme.primary);
    this.coreMaterial.emissive.set(theme.accent);
    this.ringMaterial.color.set(theme.secondary);
    this.ringMaterial.emissive.set(theme.primary);
  }
}
