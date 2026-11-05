import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class WaveFormPreset extends BasePreset {
  public override readonly id = 'wave';
  public override readonly name = 'Wave Form';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Continuous 3D wireframe terrain oscillating with time-domain waveforms.';

  private mesh!: THREE.Mesh;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardMaterial;
  private readonly cols = 64;
  private readonly rows = 64;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Wave Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'deformation', name: 'Wave Height', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Mesh Density', min: 32, max: 256, step: 16, defaultValue: 128 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.geometry = new THREE.PlaneGeometry(16, 16, this.cols - 1, this.rows - 1);
    this.geometry.rotateX(-Math.PI / 2.5);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.35,
      wireframe: true,
      roughness: 0.3,
      metalness: 0.8
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(0, -1, 0);
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const deformation = this.paramStore.getValue('deformation');
    const density = this.paramStore.getValue('density');

    const stepStride = density >= 128 ? 1 : 2;

    for (let i = 0; i < pos.length; i += 3 * stepStride) {
      const x = pos[i];
      const z = pos[i + 1];

      const waveIndex = Math.floor(Math.abs(x / 8.0) * audio.timeDomainData.length) % audio.timeDomainData.length;
      const wave = ((audio.timeDomainData[waveIndex] || 128) - 128) / 128.0;

      const freqIndex = Math.floor(Math.abs(z / 8.0) * (audio.frequencyData.length * 0.5)) % audio.frequencyData.length;
      const freq = (audio.frequencyData[freqIndex] || 0) / 255.0;

      const elevation = (wave * (1.5 + audio.bass * 2.0 * reactivity) + Math.sin(x * 0.8 + time * 3 * speed) * freq * 1.8 * reactivity) * deformation;
      pos[i + 2] = elevation;
      if (stepStride > 1 && i + 5 < pos.length) {
        pos[i + 5] = elevation;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissiveIntensity = 0.8 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.94;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.secondary);
  }
}
