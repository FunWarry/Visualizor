import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class DiodeWallPreset implements VisualizerPreset {
  id = 'diode-wall';
  name = 'Club Diode Matrix';
  category = 'Retro & Digital' as const;
  description = 'Wall of pulsing LED club diodes mapping multi-band audio spectrums.';

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private colors!: Float32Array;
  private readonly cols = 32;
  private readonly rows = 20;
  private readonly count = 640;

  init(ctx: PresetContext) {
    const geometry = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.colors = new Float32Array(this.count * 3);

    const spacing = 0.52;
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
    ctx.scene.add(this.instancedMesh);
  }

  update(ctx: PresetContext, audio: AudioFeatures, _time: number, _delta: number) {
    let idx = 0;
    const primary = new THREE.Color(ctx.theme.primary);
    const accent = new THREE.Color(ctx.theme.accent);
    const dark = new THREE.Color(0x111115);

    for (let c = 0; c < this.cols; c++) {
      const freqIdx = Math.floor((c / this.cols) * (audio.frequencyData.length * 0.35));
      const freq = (audio.frequencyData[freqIdx] || 0) / 255.0;
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

  onThemeChange(_theme: VisualizerTheme) {
    // Theme colors are dynamically evaluated on each frame from PresetContext
  }

  dispose() {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.instancedMesh.removeFromParent();
  }
}

