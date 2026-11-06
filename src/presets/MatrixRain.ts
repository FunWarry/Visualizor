import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class MatrixRainPreset extends BasePreset {
  public override readonly id = 'matrix';
  public override readonly name = 'Matrix';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Cascading green neural code glyph columns.';
  public override cameraConfig = {
    position: [0, 0, 12] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private readonly count = 1200;
  private speeds!: Float32Array;
  private readonly cols = 40;
  private readonly rows = 30;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rain Velocity', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Drop Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Drop Scale', min: 0.5, max: 2.5, step: 0.1, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.BoxGeometry(0.12, 0.45, 0.05);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
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
    this.group.add(this.instancedMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const speedBoost = (1.0 + audio.bass * 2.5 * reactivity) * speed;

    for (let i = 0; i < this.count; i++) {
      this.instancedMesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);

      position.y -= this.speeds[i] * delta * speedBoost;
      if (position.y < -8) {
        position.y = 8;
      }

      this.dummy.position.copy(position);
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    (this.instancedMesh.material as THREE.MeshBasicMaterial).color.set(theme.primary);
  }
}
