import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class FacePreset extends BasePreset {
  public override readonly id = 'face';
  public override readonly name = 'Face';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Stylized 3D cybernetic neon mask deforming expressions.';
  public override cameraConfig = {
    position: [0, 0, 7.5] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private faceMesh!: THREE.Mesh;
  private wireframe!: THREE.LineSegments;
  private material!: THREE.MeshStandardMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Turn Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Expression Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Jaw Deformation', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.2 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // Stylized mask head geometry: Icosahedron with front-curved mask profile
    const geom = new THREE.IcosahedronGeometry(2.8, 3);
    const pos = geom.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    // Shape into mask (flatten back, elongate jaw)
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + 2] < -0.5) pos[i + 2] = -0.5; // flatten back
      if (pos[i + 1] < 0) pos[i + 1] *= 1.3; // jaw elongation
    }
    geom.computeVertexNormals();

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.04),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.95
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.8
    });

    this.faceMesh = new THREE.Mesh(geom, this.material);
    const wireGeom = new THREE.WireframeGeometry(geom);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.faceMesh);
    this.group.add(this.wireframe);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const jawScale = this.paramStore.getValue('density');

    // Subtle head turn & bob
    this.group.rotation.y = Math.sin(time * 0.8 * speed) * 0.35;
    this.group.rotation.x = Math.sin(time * 0.5 * speed) * 0.15;
    this.group.position.y = Math.sin(time * 1.5 * speed) * 0.1;

    const pos = (this.faceMesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const jawDrop = (audio.bass * 1.2 + audio.beatEnergy * 1.4) * reactivity * jawScale;
    const eyeSquint = audio.treble * 0.4 * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      let dy = by;
      // Lower jaw drops on bass
      if (by < -0.5) {
        dy = by - jawDrop;
      }
      // Brow/eyes shift on treble
      let dz = bz;
      if (by > 0.5 && bz > 1.0) {
        dz = bz + eyeSquint;
      }

      pos[i] = bx;
      pos[i + 1] = dy;
      pos[i + 2] = dz;
    }

    this.faceMesh.geometry.attributes.position.needsUpdate = true;
    this.faceMesh.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissiveIntensity = 0.9 * reactivity;
      this.group.scale.setScalar(1.06);
    } else {
      this.material.emissiveIntensity *= 0.93;
      this.group.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 5.0);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.emissive.set(theme.primary);
    this.wireMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.faceMesh) {
      this.faceMesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.wireframe) {
      this.wireframe.geometry.dispose();
      this.wireMaterial.dispose();
    }
  }
}
