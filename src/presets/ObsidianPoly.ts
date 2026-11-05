import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class ObsidianPolyPreset extends BasePreset {
  public override readonly id = 'obsidian';
  public override readonly name = 'Obsidian';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Dark glossy multifaceted polyhedron deforming dynamically.';

  private mesh!: THREE.Mesh;
  private wireframe!: THREE.LineSegments;
  private material!: THREE.MeshPhysicalMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Tumble Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'deformation', name: 'Vertex Morph', min: 0.0, max: 2.0, step: 0.05, defaultValue: 0.35 },
      { id: 'density', name: 'Wireframe Opacity', min: 0.1, max: 1.0, step: 0.05, defaultValue: 0.75 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
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
      opacity: this.paramStore.getValue('density')
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    const wireGeom = new THREE.WireframeGeometry(geometry);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.mesh);
    this.group.add(this.wireframe);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const deformation = this.paramStore.getValue('deformation');
    const density = this.paramStore.getValue('density');

    this.group.rotation.x += delta * (0.2 + audio.mid * 0.4) * speed;
    this.group.rotation.y += delta * (0.3 + audio.treble * 0.6) * speed;
    this.wireMaterial.opacity = density;

    const pos = (this.mesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const pulse = (audio.bass * 1.5 + audio.beatEnergy * 1.2) * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const noise = Math.sin(bx * 2.0 + time * 3.0 * speed) * Math.cos(by * 2.0 + time * 2.5 * speed);
      const deform = 1.0 + (noise * deformation * audio.mid * reactivity) + pulse * 0.2;

      pos[i] = bx * deform;
      pos[i + 1] = by * deform;
      pos[i + 2] = bz * deform;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
      this.material.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.92;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.emissive.set(theme.primary);
    this.wireMaterial.color.set(theme.accent);
  }
}
