import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class LavaEnergyPreset implements VisualizerPreset {
  id = 'lava-energy';
  name = 'Lava Plasma Sphere';
  category = 'Fluids & Heat' as const;
  description = 'Molten magma fluid sphere pulsing and discharging energy with audio peaks.';

  private mesh!: THREE.Mesh;
  private geometry!: THREE.SphereGeometry;
  private material!: THREE.MeshStandardMaterial;
  private basePositions!: Float32Array;

  init(ctx: PresetContext) {
    this.geometry = new THREE.SphereGeometry(2.5, 64, 64);
    const pos = this.geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.7,
      wireframe: false
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    ctx.scene.add(this.mesh);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.mesh.rotation.y += delta * (0.3 + audio.mid * 0.5);
    this.mesh.rotation.x += delta * (0.15 + audio.treble * 0.4);

    const pos = this.geometry.attributes.position.array as Float32Array;
    const waveAmp = 0.35 + audio.bass * 0.8 + audio.beatEnergy * 0.5;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const u = bx * 1.5 + time * 2.0;
      const v = by * 1.5 + time * 1.8;
      const noise = Math.sin(u) * Math.cos(v) * Math.sin(bz * 1.5 + time);

      const displacement = 1.0 + noise * waveAmp;

      pos[i] = bx * displacement;
      pos[i + 1] = by * displacement;
      pos[i + 2] = bz * displacement;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.glow);
      this.material.emissiveIntensity = 1.0;
    } else {
      this.material.emissiveIntensity *= 0.93;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.accent);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}
