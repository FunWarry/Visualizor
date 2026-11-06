import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class BioCellsPreset extends BasePreset {
  public override readonly id = 'biocells';
  public override readonly name = 'Bio Cells';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Microscopic biological cell clusters undergoing mitosis.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private readonly cells: THREE.Mesh[] = [];
  private readonly numCells = 12;
  private cellMaterial!: THREE.MeshPhysicalMaterial;
  private readonly cellBasePositions: THREE.Vector3[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Mitosis Cycle', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Membrane Wobble', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Cell Count', min: 4, max: 12, step: 1, defaultValue: 12 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.cells.length = 0;
    this.cellBasePositions.length = 0;

    const cellGeom = new THREE.IcosahedronGeometry(1.2, 3);
    this.cellMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.35,
      roughness: 0.2,
      transmission: 0.65,
      thickness: 0.5,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < this.numCells; i++) {
      const angle = (i / this.numCells) * Math.PI * 2;
      const r = 2.5 + (i % 2) * 1.5;
      const pos = new THREE.Vector3(
        Math.cos(angle) * r,
        (Math.sin(i * 1.7) * 2.0),
        Math.sin(angle) * r
      );
      this.cellBasePositions.push(pos);

      const cell = new THREE.Mesh(cellGeom, this.cellMaterial);
      cell.position.copy(pos);
      this.cells.push(cell);
      this.group.add(cell);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.2 * speed;
    this.group.rotation.z += delta * 0.1 * speed;

    const wobble = Math.sin(time * 3.0 * speed) * 0.2 * reactivity;

    for (let i = 0; i < this.cells.length; i++) {
      const cell = this.cells[i];
      const basePos = this.cellBasePositions[i];

      // Mitosis split displacement on beat
      const split = audio.beat ? 1.4 * reactivity : 1.0;
      cell.position.set(
        basePos.x * split + Math.sin(time * 2.0 + i) * 0.3,
        basePos.y * split + Math.cos(time * 2.5 + i) * 0.3,
        basePos.z * split
      );

      // Cytoplasmic membrane elongation
      const scaleX = 1.0 + audio.bass * 0.5 * reactivity + wobble;
      const scaleY = 1.0 + audio.mid * 0.4 * reactivity - wobble;
      cell.scale.set(scaleX, scaleY, 1.0);
    }

    this.cellMaterial.emissiveIntensity = 0.25 + (audio.bass * 0.6 + (audio.beat ? 0.4 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.cellMaterial.color.set(theme.primary);
    this.cellMaterial.emissive.set(theme.accent);
  }

  protected override onDispose(): void {
    for (const c of this.cells) {
      c.geometry.dispose();
    }
    this.cells.length = 0;
    this.cellBasePositions.length = 0;
    this.cellMaterial?.dispose();
  }
}
