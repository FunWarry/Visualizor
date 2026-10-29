import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';

export class ThreeDBarsPreset implements VisualizerPreset {
  id = '3d-bars';
  name = '3D Bars Grid';
  category = 'Structures' as const;
  description = 'Matrix of illuminated 3D columns jumping to frequency bands.';

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private colors!: Float32Array;
  private readonly cols = 16;
  private readonly rows = 16;
  private readonly count = 256;

  private readonly paramStore = new ParameterStore([
    { id: 'speed', name: 'Column Spacing', min: 0.5, max: 1.5, step: 0.05, defaultValue: 0.8 },
    { id: 'reactivity', name: 'Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
    { id: 'deformation', name: 'Column Height', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
    { id: 'density', name: 'Grid Density', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 }
  ]);

  init(ctx: PresetContext) {
    const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.85
    });

    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);
    this.colors = new Float32Array(this.count * 3);

    const primary = new THREE.Color(ctx.theme.primary);
    const accent = new THREE.Color(ctx.theme.accent);

    let idx = 0;
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        const factor = (x + z) / (this.cols + this.rows);
        const col = new THREE.Color().lerpColors(primary, accent, factor);
        col.toArray(this.colors, idx * 3);
        idx++;
      }
    }

    this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(this.colors, 3);
    this.instancedMesh.position.set(0, -2, 0);
    ctx.scene.add(this.instancedMesh);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, _delta: number) {
    const spacing = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const heightScale = this.paramStore.getValue('deformation');
    const density = this.paramStore.getValue('density');

    const activeCount = Math.floor(this.count * density);
    this.instancedMesh.count = activeCount;

    let idx = 0;
    const offsetX = (this.cols * spacing) / 2;
    const offsetZ = (this.rows * spacing) / 2;

    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        if (idx >= activeCount) break;

        // Distance from center determines frequency mapping
        const dx = x - this.cols / 2;
        const dz = z - this.rows / 2;
        const dist = Math.hypot(dx, dz);
        const freqIndex = Math.floor((dist / (this.cols / 1.4)) * (audio.frequencyData.length * 0.4));
        const freq = (audio.frequencyData[freqIndex] || 0) / 255.0;

        const height = Math.max(0.1, (freq * 6.0 + audio.bass * 1.5) * reactivity * heightScale);
        this.dummy.position.set(x * spacing - offsetX, height / 2, z * spacing - offsetZ);
        this.dummy.scale.set(1, height, 1);
        this.dummy.updateMatrix();

        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
        idx++;
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  getCustomParameters(): ParameterDefinition[] {
    return this.paramStore.getDefinitions();
  }

  setCustomParameter(id: string, value: number): void {
    this.paramStore.setValue(id, value);
  }

  getCustomParameterValue(id: string): number | undefined {
    return this.paramStore.getValue(id);
  }

  resetCustomParameters(): void {
    this.paramStore.reset();
  }

  onThemeChange(theme: VisualizerTheme) {
    const primary = new THREE.Color(theme.primary);
    const accent = new THREE.Color(theme.accent);

    let idx = 0;
    for (let x = 0; x < this.cols; x++) {
      for (let z = 0; z < this.rows; z++) {
        const factor = (x + z) / (this.cols + this.rows);
        const col = new THREE.Color().lerpColors(primary, accent, factor);
        col.toArray(this.colors, idx * 3);
        idx++;
      }
    }
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  dispose() {
    this.instancedMesh.geometry.dispose();
    (this.instancedMesh.material as THREE.Material).dispose();
    this.instancedMesh.removeFromParent();
  }
}
