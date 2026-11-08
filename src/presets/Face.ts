import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class FacePreset extends BasePreset {
  public override readonly id = 'face';
  public override readonly name = 'Face';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Stylized cybernetic 3D neon mask with authentic audio-reactive facial expression morphing.';
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

    // Shape into cybernetic mask (flatten back, sculpt brow and elongate jaw)
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + 2] < -0.5) pos[i + 2] = -0.5; // flatten back
      if (pos[i + 1] < 0) pos[i + 1] *= 1.35; // jaw elongation
      if (pos[i + 1] > 0.8 && pos[i + 2] > 0.8) pos[i + 2] *= 1.15; // brow prominence
    }
    geom.computeVertexNormals();

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary).multiplyScalar(0.4),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.4
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85
    });

    this.faceMesh = new THREE.Mesh(geom, this.material);
    const wireGeom = new THREE.WireframeGeometry(geom);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.faceMesh);
    this.group.add(this.wireframe);
  }

  private deformVertex(
    bx: number,
    by: number,
    bz: number,
    jawDrop: number,
    eyeSquint: number,
    smirk: number,
    bassBoost: number
  ): [number, number, number] {
    let dx = bx;
    let dy = by;
    let dz = bz;

    // Lower jaw drops on bass + asymmetric smirk
    if (by < -0.4) {
      dy = by - jawDrop + (bx > 0 ? smirk : 0);
    }
    // Brow and eyelid squint / twitch on treble
    if (by > 0.5 && bz > 0.8) {
      dz = bz + eyeSquint;
      dy = by + (bx > 0 ? smirk * 0.5 : -smirk * 0.5);
    }
    // Cheek flare on loud transients
    if (Math.abs(by) < 0.5 && Math.abs(bx) > 1.2) {
      dx = bx * bassBoost;
    }

    return [dx, dy, dz];
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const jawScale = this.paramStore.getValue('density');

    // Subtle robotic head turn, tilt & bob
    this.group.rotation.y = Math.sin(time * 0.8 * speed) * 0.35 + (audio.mid * 0.2 * reactivity);
    this.group.rotation.x = Math.sin(time * 0.5 * speed) * 0.15 + (audio.bass * 0.1 * reactivity);
    this.group.rotation.z = Math.cos(time * 0.6 * speed) * 0.06;
    this.group.position.y = Math.sin(time * 1.5 * speed) * 0.1;

    const pos = (this.faceMesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const jawDrop = (audio.bass * 1.35 + audio.beatEnergy * 1.5) * reactivity * jawScale;
    const eyeSquint = audio.treble * 0.45 * reactivity;
    const smirk = Math.sin(time * 1.2) * audio.mid * 0.3 * reactivity;
    const bassBoost = 1.0 + audio.bass * 0.15 * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const [dx, dy, dz] = this.deformVertex(
        this.basePositions[i],
        this.basePositions[i + 1],
        this.basePositions[i + 2],
        jawDrop,
        eyeSquint,
        smirk,
        bassBoost
      );
      pos[i] = dx;
      pos[i + 1] = dy;
      pos[i + 2] = dz;
    }

    this.faceMesh.geometry.attributes.position.needsUpdate = true;
    this.faceMesh.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissiveIntensity = 1.0 * reactivity;
      this.group.scale.setScalar(1.06);
    } else {
      this.material.emissiveIntensity = Math.max(0.35, this.material.emissiveIntensity * 0.94);
      this.group.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 5.0);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.primary).multiplyScalar(0.4);
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
