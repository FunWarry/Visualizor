import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class GeodesicSpherePreset extends BasePreset {
  public override readonly id = 'geodesic';
  public override readonly name = 'Geodesic';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Tessellated geodesic frequency sphere pulsing across faces.';
  public override cameraConfig = {
    position: [0, 0, 9] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.35
  };

  private mesh!: THREE.Mesh;
  private wireframe!: THREE.LineSegments;
  private geometry!: THREE.IcosahedronGeometry;
  private material!: THREE.MeshStandardMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private basePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Spin Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Facet Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Sphere Radius', min: 1.5, max: 4.5, step: 0.1, defaultValue: 3.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const radius = this.paramStore.getValue('density');
    this.geometry = new THREE.IcosahedronGeometry(radius, 3);
    const pos = this.geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.85,
      transparent: true,
      opacity: 0.85
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.8
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    const wireGeom = new THREE.WireframeGeometry(this.geometry);
    this.wireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);

    this.group.add(this.mesh);
    this.group.add(this.wireframe);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.x += delta * (0.2 + audio.mid * 0.4 * reactivity) * speed;
    this.group.rotation.y += delta * (0.25 + audio.treble * 0.5 * reactivity) * speed;

    const pos = this.geometry.attributes.position.array as Float32Array;
    const pulse = (audio.bass * 1.4 + audio.beatEnergy * 1.8) * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const freqIdx = (i % 256);
      const freq = (audio.frequencyData[freqIdx] || 0) / 255.0;

      const scale = 1.0 + (freq * 0.5 * reactivity) + pulse * 0.2 + Math.sin(time * 3.0 * speed + i * 0.1) * 0.1;

      pos[i] = bx * scale;
      pos[i + 1] = by * scale;
      pos[i + 2] = bz * scale;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
      this.material.emissiveIntensity = 0.8 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.92;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.secondary);
    this.wireMaterial.color.set(theme.accent);
  }
}
