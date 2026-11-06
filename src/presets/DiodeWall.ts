import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class DiodeWallPreset extends BasePreset {
  public override readonly id = 'diodewall';
  public override readonly name = 'Diode Wall';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = '32x24 club LED matrix equalizer with peak hold.';
  public override cameraConfig = {
    position: [0, 0, 14] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private colors!: Float32Array;
  private readonly cols = 32;
  private readonly rows = 24;
  private readonly count = 768;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Peak Decay Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'VU Sensitivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Diode Spacing', min: 0.3, max: 0.8, step: 0.05, defaultValue: 0.48 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.colors = new Float32Array(this.count * 3);

    const spacing = this.paramStore.getValue('density');
    const offsetX = (this.cols * spacing) / 2;
    const offsetY = (this.rows * spacing) / 2;

    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        this.dummy.position.set(c * spacing - offsetX, r * spacing - offsetY, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);

        new THREE.Color(ctx.theme.primary).toArray(this.colors, idx * 3);
        idx++;
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(this.colors, 3);
    this.group.add(this.instancedMesh);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, _time: number, _delta: number): void {
    const reactivity = this.paramStore.getValue('reactivity');

    let idx = 0;
    const primary = new THREE.Color(ctx.theme.primary);
    const accent = new THREE.Color(ctx.theme.accent);
    const dark = new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.08);

    for (let c = 0; c < this.cols; c++) {
      const freqIdx = Math.floor((c / this.cols) * (audio.frequencyData.length * 0.35));
      const freq = ((audio.frequencyData[freqIdx] || 0) / 255.0) * reactivity;
      const litRows = Math.floor(freq * this.rows);

      for (let r = 0; r < this.rows; r++) {
        const col = new THREE.Color();
        if (r <= litRows) {
          const factor = r / this.rows;
          col.lerpColors(primary, accent, factor);
        } else {
          col.copy(dark);
        }
        col.toArray(this.colors, idx * 3);
        idx++;
      }
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    (this.instancedMesh.material as THREE.MeshBasicMaterial).color.set(theme.primary);
  }

  protected override onDispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
    }
  }
}
