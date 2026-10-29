import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';

export class WaveFormPreset implements VisualizerPreset {
  id = 'waveform';
  name = 'Wave Form';
  category = 'Structures' as const;
  description = 'Continuous 3D wireframe terrain oscillating with time-domain waveforms.';

  private mesh!: THREE.Mesh;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardMaterial;
  private readonly cols = 64;
  private readonly rows = 64;

  private readonly paramStore = new ParameterStore([
    { id: 'speed', name: 'Wave Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
    { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
    { id: 'deformation', name: 'Wave Height', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
    { id: 'density', name: 'Mesh Density', min: 32, max: 256, step: 16, defaultValue: 128 }
  ]);

  init(ctx: PresetContext) {
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
    ctx.scene.add(this.mesh);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number) {
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

      // Calculate reactive 3D elevation
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

  getCustomParameters(): ParameterDefinition[] {
    return this.paramStore.getDefinitions();
  }

  setCustomParameter(id: string, value: number): void {
    this.paramStore.setValue(id, value);
  }

  getCustomParameterValue(id: string): number | undefined {
    return this.paramStore.getValue(id);
  }

  resetCustomParameters(): void {
    this.paramStore.reset();
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.secondary);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
