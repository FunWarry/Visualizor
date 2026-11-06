import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class LavaEnergyPreset extends BasePreset {
  public override readonly id = 'lava';
  public override readonly name = 'Lava';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Molten magma energy blob with glowing crust fissures.';
  public override cameraConfig = {
    position: [0, 2, 8] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };

  private mesh!: THREE.Mesh;
  private geometry!: THREE.SphereGeometry;
  private material!: THREE.MeshStandardMaterial;
  private basePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Magma Flow Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Pulse Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Crust Roughness', min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.25 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.geometry = new THREE.SphereGeometry(2.5, 64, 64);
    const pos = this.geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.45,
      roughness: this.paramStore.getValue('density'),
      metalness: 0.7,
      wireframe: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.group.add(this.mesh);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.mesh.rotation.y += delta * (0.3 + audio.mid * 0.5 * reactivity) * speed;
    this.mesh.rotation.x += delta * (0.15 + audio.treble * 0.4 * reactivity) * speed;

    const pos = this.geometry.attributes.position.array as Float32Array;
    const waveAmp = (0.35 + audio.bass * 0.8 + audio.beatEnergy * 0.5) * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const u = bx * 1.5 + time * 2.0 * speed;
      const v = by * 1.5 + time * 1.8 * speed;
      const noise = Math.sin(u) * Math.cos(v) * Math.sin(bz * 1.5 + time * speed);

      const displacement = 1.0 + noise * waveAmp;

      pos[i] = bx * displacement;
      pos[i + 1] = by * displacement;
      pos[i + 2] = bz * displacement;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.glow);
      this.material.emissiveIntensity = 1.0 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.93;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.accent);
  }

  protected override onDispose(): void {
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
