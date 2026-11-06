import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class UnfoldingMatterPreset extends BasePreset {
  public override readonly id = 'unfoldingmatter';
  public override readonly name = 'Unfolding Matter';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Crystalline fractal polyhedron facets unfolding like origami.';
  public override cameraConfig = {
    position: [0, 0, 9] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private readonly facets: THREE.Mesh[] = [];
  private facetMaterial!: THREE.MeshPhysicalMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private readonly numFacets = 20;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Unfold Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Hinge Angle', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.facets.length = 0;

    this.facetMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.3,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.4,
      transparent: true,
      opacity: 0.85
    });

    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.8
    });

    // Triangular origami facet
    const triGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 1.8, 0,
      -1.2, -0.9, 0,
      1.2, -0.9, 0
    ]);
    triGeom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    triGeom.computeVertexNormals();

    const wireGeom = new THREE.WireframeGeometry(triGeom);

    for (let i = 0; i < this.numFacets; i++) {
      const mesh = new THREE.Mesh(triGeom, this.facetMaterial);
      const wire = new THREE.LineSegments(wireGeom, this.wireMaterial);
      mesh.add(wire);

      // Distribute in spherical origami arrangement
      const phi = Math.acos(-1 + (2 * i) / this.numFacets);
      const theta = Math.sqrt(this.numFacets * Math.PI) * phi;

      mesh.position.set(
        Math.cos(theta) * Math.sin(phi) * 2.2,
        Math.sin(theta) * Math.sin(phi) * 2.2,
        Math.cos(phi) * 2.2
      );
      mesh.lookAt(0, 0, 0);

      this.facets.push(mesh);
      this.group.add(mesh);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const maxHinge = this.paramStore.getValue('density');

    this.group.rotation.x += delta * 0.2 * speed;
    this.group.rotation.y += delta * 0.25 * speed;

    const unfold = (audio.rms * 1.5 + audio.bass * 1.2) * reactivity;

    for (let i = 0; i < this.numFacets; i++) {
      const mesh = this.facets[i];
      // Hinge rotation opens like origami flower petals
      const angle = (Math.sin(time * 2.0 * speed + i * 0.5) * 0.5 + 0.5) * unfold * maxHinge;
      mesh.rotation.x = angle;
      mesh.rotation.z = Math.sin(time * speed + i) * 0.2;
    }

    if (audio.beat) {
      this.facetMaterial.emissiveIntensity = 0.9 * reactivity;
    } else {
      this.facetMaterial.emissiveIntensity *= 0.94;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.facetMaterial.color.set(theme.primary);
    this.facetMaterial.emissive.set(theme.accent);
    this.wireMaterial.color.set(theme.accent);
  }
}
