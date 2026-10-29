import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class WaveFormPreset implements VisualizerPreset {
  id = 'waveform';
  name = 'Wave Form';
  category = 'Structures' as const;
  description = 'Continuous 3D wireframe terrain oscillating with time-domain waveforms.';

  private mesh!: THREE.Mesh;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardMaterial;
  private cols = 64;
  private rows = 64;

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

  update(ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number) {
    const pos = this.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < pos.length; i += 3) {
      const x = pos[i];
      const z = pos[i + 1];

      const waveIndex = Math.floor(Math.abs(x / 8.0) * audio.timeDomainData.length) % audio.timeDomainData.length;
      const wave = ((audio.timeDomainData[waveIndex] || 128) - 128) / 128.0;

      const freqIndex = Math.floor(Math.abs(z / 8.0) * (audio.frequencyData.length * 0.5)) % audio.frequencyData.length;
      const freq = (audio.frequencyData[freqIndex] || 0) / 255.0;

      // Calculate reactive 3D elevation
      const elevation = wave * (1.5 + audio.bass * 2.0) + Math.sin(x * 0.8 + time * 3) * freq * 1.8;
      pos[i + 2] = elevation;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissiveIntensity = 0.8;
    } else {
      this.material.emissiveIntensity *= 0.94;
    }
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
