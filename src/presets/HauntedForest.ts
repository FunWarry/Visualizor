import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class HauntedForestPreset extends BasePreset {
  public override readonly id = 'hauntedforest';
  public override readonly name = 'Haunted Forest';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Gnarled trees in graveyard mist with floating spirit wisps.';

  private readonly trees: THREE.LineSegments[] = [];
  private spiritPoints!: THREE.Points;
  private treeMaterial!: THREE.LineBasicMaterial;
  private spiritMaterial!: THREE.PointsMaterial;
  private readonly numSpirits = 120;
  private spiritPositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Wisp Float Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Spooky Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Tree Dispersion', min: 4.0, max: 14.0, step: 1.0, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.trees.length = 0;
    this.group.position.y = -2;

    this.treeMaterial = new THREE.LineBasicMaterial({
      color: 0x445566,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });

    // 4 Gnarled procedural trees
    for (let t = 0; t < 4; t++) {
      const points: THREE.Vector3[] = [];
      const buildGnarled = (start: THREE.Vector3, dir: THREE.Vector3, length: number, depth: number) => {
        if (depth <= 0) return;
        const end = start.clone().add(dir.clone().multiplyScalar(length));
        points.push(start, end);

        const count = 2;
        for (let b = 0; b < count; b++) {
          const spread = 0.6 + (b === 0 ? 0.2 : -0.2);
          const axis = new THREE.Vector3(1, 0, (b - 0.5) * 2).normalize();
          const nextDir = dir.clone().applyAxisAngle(axis, spread);
          buildGnarled(end, nextDir, length * 0.72, depth - 1);
        }
      };

      buildGnarled(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 1.8, 4);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const tree = new THREE.LineSegments(geom, this.treeMaterial);
      const angle = (t / 4) * Math.PI * 2;
      tree.position.set(Math.cos(angle) * 4.5, 0, Math.sin(angle) * 3.5);
      this.trees.push(tree);
      this.group.add(tree);
    }

    // Floating glowing spirit wisps
    const spiritGeom = new THREE.BufferGeometry();
    this.spiritPositions = new Float32Array(this.numSpirits * 3);
    for (let i = 0; i < this.numSpirits; i++) {
      this.spiritPositions[i * 3] = (Math.random() - 0.5) * 12.0;
      this.spiritPositions[i * 3 + 1] = Math.random() * 5.0;
      this.spiritPositions[i * 3 + 2] = (Math.random() - 0.5) * 10.0;
    }
    spiritGeom.setAttribute('position', new THREE.BufferAttribute(this.spiritPositions, 3));

    this.spiritMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.35,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.spiritPoints = new THREE.Points(spiritGeom, this.spiritMaterial);
    this.group.add(this.spiritPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    // Float spirits
    const pos = (this.spiritPoints.geometry.attributes.position.array as Float32Array);
    for (let i = 0; i < this.numSpirits; i++) {
      const idx = i * 3;
      pos[idx + 1] += Math.sin(time * 2.0 + i) * delta * 0.5 * speed;
      pos[idx] += Math.cos(time * 1.5 + i) * delta * 0.4;
      pos[idx + 2] += Math.sin(time * 1.2 + i) * delta * 0.4;
    }
    this.spiritPoints.geometry.attributes.position.needsUpdate = true;
    this.spiritMaterial.size = 0.25 + (audio.mid * 0.4 + (audio.beat ? 0.3 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.treeMaterial.color.set(theme.primary);
    this.spiritMaterial.color.set(theme.accent);
  }
}
