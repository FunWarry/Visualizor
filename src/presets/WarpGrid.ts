import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class WarpGridPreset extends BasePreset {
  public override readonly id = 'warp';
  public override readonly name = 'Warp Grid';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Distorted spacetime wireframe lattice warping on transients.';

  private mesh!: THREE.Mesh;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardMaterial;
  private basePositions!: Float32Array;
  private readonly segments = 48;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Grid Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Curvature Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Gravity Dip', min: 0.5, max: 3.0, step: 0.1, defaultValue: 1.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.geometry = new THREE.PlaneGeometry(20, 20, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2.2);

    const pos = this.geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.4,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.9
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, -1, 0);
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const dip = this.paramStore.getValue('density');

    this.group.rotation.z += delta * 0.08 * speed;

    const pos = this.geometry.attributes.position.array as Float32Array;
    const kickForce = (audio.bass * 2.0 + audio.beatEnergy * 2.5) * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const dist = Math.hypot(bx, by);
      // Gravitational warp depression in center plus concentric ripples
      const warpSink = -dip / (1.0 + dist * 0.4) * (1.0 + kickForce * 0.8);
      const ripple = Math.sin(dist * 2.5 - time * 4.0 * speed) * (0.3 + audio.mid * 0.8 * reactivity);

      pos[i + 2] = bz + warpSink + ripple;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.93;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.accent);
  }
}
