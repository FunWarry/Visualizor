import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class ForestStormPreset implements VisualizerPreset {
  id = 'forest-storm';
  name = 'Forest Tree & Storm';
  category = 'Organic & Nature' as const;
  description = 'Fractal branching tree swaying dynamically in audio storm with lightning flashes.';

  private group!: THREE.Group;
  private treeLines!: THREE.LineSegments;
  private lineMaterial!: THREE.LineBasicMaterial;
  private ambientLight!: THREE.AmbientLight;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();
    this.group.position.y = -3;

    // Generate procedural fractal 3D tree branches
    const points: THREE.Vector3[] = [];

    const buildBranch = (start: THREE.Vector3, dir: THREE.Vector3, length: number, depth: number) => {
      if (depth <= 0) return;

      const end = start.clone().add(dir.clone().multiplyScalar(length));
      points.push(start, end);

      const nextLength = length * 0.72;
      const branchCount = depth > 3 ? 3 : 2;

      for (let b = 0; b < branchCount; b++) {
        const spreadAngle = 0.45 + (b * 0.1);
        const rotAxis = new THREE.Vector3(
          Math.sin(b * 2.0),
          0,
          Math.cos(b * 2.0)
        ).normalize();

        const newDir = dir.clone().applyAxisAngle(rotAxis, spreadAngle);
        buildBranch(end, newDir, nextLength, depth - 1);
      }
    };

    buildBranch(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0), 2.2, 5);

    const geom = new THREE.BufferGeometry().setFromPoints(points);

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });

    this.treeLines = new THREE.LineSegments(geom, this.lineMaterial);
    this.group.add(this.treeLines);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.group.add(this.ambientLight);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    // Tree rotates slowly
    this.group.rotation.y += delta * 0.15;

    // Wind sway from sub-bass
    const wind = Math.sin(time * 2.0) * (0.05 + audio.bass * 0.15);
    this.group.rotation.z = wind;

    // Lightning strike on beat
    if (audio.beat) {
      this.lineMaterial.color.set(0xffffff);
      this.lineMaterial.opacity = 1.0;
      this.ambientLight.intensity = 2.0;
    } else {
      this.lineMaterial.color.set(ctx.theme.accent);
      this.lineMaterial.opacity = 0.75;
      this.ambientLight.intensity *= 0.9;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.lineMaterial.color.set(theme.accent);
  }

  dispose() {
    this.treeLines.geometry.dispose();
    this.lineMaterial.dispose();
    this.group.removeFromParent();
  }
}

