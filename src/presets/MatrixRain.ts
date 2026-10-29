import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class MatrixRainPreset implements VisualizerPreset {
  id = 'matrix-rain';
  name = 'Matrix Digital Cascade';
  category = 'Retro & Digital' as const;
  description = 'Cascading cyber code columns with reactive luminescent drops.';

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private readonly count = 1200;
  private speeds!: Float32Array;
  private readonly cols = 40;
  private readonly rows = 30;

  init(ctx: PresetContext) {
    const geometry = new THREE.BoxGeometry(0.12, 0.45, 0.05);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.85
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.speeds = new Float32Array(this.count);

    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (idx >= this.count) break;
        const x = (c - this.cols / 2) * 0.45;
        const y = (Math.random() - 0.5) * 16;
        const z = (Math.random() - 0.5) * 12;

        this.dummy.position.set(x, y, z);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);

        this.speeds[idx] = 4.0 + Math.random() * 8.0;
        idx++;
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    ctx.scene.add(this.instancedMesh);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const speedBoost = 1.0 + audio.bass * 2.5;

    for (let i = 0; i < this.count; i++) {
      this.instancedMesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);

      position.y -= this.speeds[i] * delta * speedBoost;
      if (position.y < -8) {
        position.y = 8;
      }

      matrix.setPosition(position);
      this.instancedMesh.setMatrixAt(i, matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    (this.instancedMesh.material as THREE.MeshBasicMaterial).color.set(theme.primary);
  }

  dispose() {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.instancedMesh.removeFromParent();
  }
}

