import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class SingleTreePreset extends BasePreset {
  public override readonly id = 'singletree';
  public override readonly name = 'Single Tree';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Solitary procedural lone bonsai tree with seasonal blossoms.';

  private treeLines!: THREE.LineSegments;
  private petalPoints!: THREE.Points;
  private lineMaterial!: THREE.LineBasicMaterial;
  private petalMaterial!: THREE.PointsMaterial;
  private readonly numPetals = 400;
  private petalPositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Sway Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Blossom Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Tree Height', min: 2.0, max: 5.0, step: 0.2, defaultValue: 3.2 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.group.position.y = -2.5;

    // Procedural branching tree
    const points: THREE.Vector3[] = [];
    const buildBranch = (start: THREE.Vector3, dir: THREE.Vector3, length: number, depth: number) => {
      if (depth <= 0) return;
      const end = start.clone().add(dir.clone().multiplyScalar(length));
      points.push(start, end);

      const nextLength = length * 0.74;
      const count = depth > 3 ? 3 : 2;
      for (let b = 0; b < count; b++) {
        const spread = 0.5 + b * 0.15;
        const axis = new THREE.Vector3(Math.sin(b * 2.2), 0, Math.cos(b * 2.2)).normalize();
        const nextDir = dir.clone().applyAxisAngle(axis, spread);
        buildBranch(end, nextDir, nextLength, depth - 1);
      }
    };

    const treeHeight = this.paramStore.getValue('density');
    buildBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), treeHeight * 0.65, 5);

    const treeGeom = new THREE.BufferGeometry().setFromPoints(points);
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.treeLines = new THREE.LineSegments(treeGeom, this.lineMaterial);
    this.group.add(this.treeLines);

    // Falling glowing blossoms/petals
    const petalGeom = new THREE.BufferGeometry();
    this.petalPositions = new Float32Array(this.numPetals * 3);
    for (let i = 0; i < this.numPetals; i++) {
      this.petalPositions[i * 3] = (Math.random() - 0.5) * 6.0;
      this.petalPositions[i * 3 + 1] = Math.random() * 5.0;
      this.petalPositions[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
    }
    petalGeom.setAttribute('position', new THREE.BufferAttribute(this.petalPositions, 3));

    this.petalMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.petalPoints = new THREE.Points(petalGeom, this.petalMaterial);
    this.group.add(this.petalPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    // Tree sway
    this.treeLines.rotation.z = Math.sin(time * 1.2 * speed) * (0.05 + audio.bass * 0.12 * reactivity);

    // Petal drift
    const pos = (this.petalPoints.geometry.attributes.position.array as Float32Array);
    for (let i = 0; i < this.numPetals; i++) {
      const idx = i * 3;
      pos[idx + 1] -= delta * (0.5 + audio.treble * 0.8 * reactivity) * speed;
      pos[idx] += Math.sin(time + i) * delta * 0.3;
      if (pos[idx + 1] < 0) {
        pos[idx + 1] = 5.0;
      }
    }
    this.petalPoints.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.lineMaterial.color.set(theme.primary);
    this.petalMaterial.color.set(theme.accent);
  }
}
