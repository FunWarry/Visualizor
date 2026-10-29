import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class FerrofluidPreset implements VisualizerPreset {
  id = 'ferrofluid';
  name = 'Ferrofluid Magnetic';
  category = 'Structures' as const;
  description = 'Liquid magnetic sphere erupting with sharp spikes synchronized to bass kicks.';

  private mesh!: THREE.Mesh;
  private geometry!: THREE.SphereGeometry;
  private material!: THREE.MeshPhysicalMaterial;
  private basePositions!: Float32Array;
  private spikeDirections!: Float32Array;
  private numVertices = 0;

  init(ctx: PresetContext) {
    this.geometry = new THREE.SphereGeometry(2.4, 72, 72);
    const pos = this.geometry.attributes.position.array as Float32Array;
    this.numVertices = pos.length / 3;
    this.basePositions = new Float32Array(pos);
    this.spikeDirections = new Float32Array(pos.length);

    // Calculate normalized spike outward vectors
    for (let i = 0; i < this.numVertices; i++) {
      const v = new THREE.Vector3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]).normalize();
      this.spikeDirections[i * 3] = v.x;
      this.spikeDirections[i * 3 + 1] = v.y;
      this.spikeDirections[i * 3 + 2] = v.z;
    }

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x050508),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.25,
      roughness: 0.08,
      metalness: 0.98,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    ctx.scene.add(this.mesh);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.mesh.rotation.y += delta * (0.2 + audio.mid * 0.4);
    this.mesh.rotation.x += delta * (0.1 + audio.treble * 0.3);

    const pos = this.geometry.attributes.position.array as Float32Array;
    const spikePower = audio.bass * 2.2 + audio.beatEnergy * 2.8;

    for (let i = 0; i < this.numVertices; i++) {
      const bx = this.basePositions[i * 3];
      const by = this.basePositions[i * 3 + 1];
      const bz = this.basePositions[i * 3 + 2];

      const dx = this.spikeDirections[i * 3];
      const dy = this.spikeDirections[i * 3 + 1];
      const dz = this.spikeDirections[i * 3 + 2];

      // Sharp conical spike function
      const spikeNoise = Math.pow(Math.max(0, Math.sin(dx * 8.0 + time * 3.0) * Math.cos(dy * 8.0 + time * 2.5) * Math.sin(dz * 8.0)), 2.5);
      const spikeLen = spikeNoise * spikePower * 1.6;

      pos[i * 3] = bx + dx * spikeLen;
      pos[i * 3 + 1] = by + dy * spikeLen;
      pos[i * 3 + 2] = bz + dz * spikeLen;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
      this.material.emissiveIntensity = 1.0;
    } else {
      this.material.emissiveIntensity *= 0.93;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.emissive.set(theme.primary);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.mesh.removeFromParent();
  }
}

