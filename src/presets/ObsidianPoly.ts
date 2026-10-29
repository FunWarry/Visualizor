import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class ObsidianPolyPreset implements VisualizerPreset {
  id = 'obsidian-poly';
  name = 'Obsidian Poly';
  category = 'Structures' as const;
  description = 'Dark glossy multifaceted polyhedron deforming dynamically to audio.';

  private mesh!: THREE.Mesh;
  private wireframe!: THREE.LineSegments;
  private group!: THREE.Group;
  private material!: THREE.MeshPhysicalMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();
    const geometry = new THREE.IcosahedronGeometry(3.0, 3);
    const pos = geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0a0a10),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.2,
      roughness: 0.1,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.75
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    const wireGeom = new THREE.WireframeGeometry(geometry);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.mesh);
    this.group.add(this.wireframe);
    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    this.group.rotation.x += delta * (0.2 + audio.mid * 0.4);
    this.group.rotation.y += delta * (0.3 + audio.treble * 0.6);

    const pos = (this.mesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const pulse = audio.bass * 1.5 + audio.beatEnergy * 1.2;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const noise = Math.sin(bx * 2.0 + time * 3.0) * Math.cos(by * 2.0 + time * 2.5);
      const deform = 1.0 + (noise * 0.25 * audio.mid) + pulse * 0.2;

      pos[i] = bx * deform;
      pos[i + 1] = by * deform;
      pos[i + 2] = bz * deform;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
      this.material.emissiveIntensity = 0.9;
    } else {
      this.material.emissiveIntensity *= 0.92;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.emissive.set(theme.primary);
    this.wireMaterial.color.set(theme.accent);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.wireframe.geometry.dispose();
    this.wireMaterial.dispose();
    this.group.removeFromParent();
  }
}

