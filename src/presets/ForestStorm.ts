import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class ForestStormPreset extends BasePreset {
  public override readonly id = 'forest';
  public override readonly name = 'Forest';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Cathedral tree canopy dome with volumetric god rays and breeze audio sway.';
  public override cameraConfig = {
    position: [0, 0, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private treeLines!: THREE.LineSegments;
  private godRays!: THREE.LineSegments;
  private lineMaterial!: THREE.LineBasicMaterial;
  private rayMaterial!: THREE.LineBasicMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Canopy Breeze', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'God Ray Pulse', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Canopy Height', min: 2.0, max: 6.0, step: 0.2, defaultValue: 3.8 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.group.position.y = -3;

    // Cathedral canopy procedural trunks & dome branches
    const points: THREE.Vector3[] = [];
    const buildBranch = (start: THREE.Vector3, dir: THREE.Vector3, length: number, depth: number) => {
      if (depth <= 0) return;
      const end = start.clone().add(dir.clone().multiplyScalar(length));
      points.push(start, end);

      const nextLength = length * 0.72;
      const branchCount = depth > 3 ? 3 : 2;

      for (let b = 0; b < branchCount; b++) {
        const spreadAngle = 0.45 + (b * 0.1);
        const rotAxis = new THREE.Vector3(Math.sin(b * 2.0), 0, Math.cos(b * 2.0)).normalize();
        const newDir = dir.clone().applyAxisAngle(rotAxis, spreadAngle);
        buildBranch(end, newDir, nextLength, depth - 1);
      }
    };

    const height = this.paramStore.getValue('density');
    buildBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), height * 0.6, 5);

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    this.treeLines = new THREE.LineSegments(geom, this.lineMaterial);
    this.group.add(this.treeLines);

    // Volumetric sunlight god rays descending through canopy
    const rayPoints: number[] = [];
    for (let r = 0; r < 24; r++) {
      const topX = (Math.sin(r * 1.3) * 0.5) * 6;
      const topZ = (Math.cos(r * 1.7) * 0.5) * 6;
      rayPoints.push(topX, 6.0, topZ, topX * 1.6, 0.0, topZ * 1.6);
    }
    const rayGeom = new THREE.BufferGeometry();
    rayGeom.setAttribute('position', new THREE.Float32BufferAttribute(rayPoints, 3));
    this.rayMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.godRays = new THREE.LineSegments(rayGeom, this.rayMaterial);
    this.group.add(this.godRays);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.15 * speed;
    this.group.rotation.z = Math.sin(time * 2.0 * speed) * (0.05 + audio.bass * 0.15 * reactivity);

    this.rayMaterial.opacity = 0.2 + (audio.mid * 0.6 + (audio.beat ? 0.3 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.lineMaterial.color.set(theme.accent);
    this.rayMaterial.color.set(theme.primary);
  }

  protected override onDispose(): void {
    this.treeLines.geometry.dispose();
    this.lineMaterial.dispose();
    this.godRays.geometry.dispose();
    this.rayMaterial.dispose();
  }
}
