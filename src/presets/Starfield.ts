import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';

export class StarfieldPreset implements VisualizerPreset {
  id = 'starfield';
  name = 'Starfield Warp';
  category = 'Abstract & Space' as const;
  description = 'Warp-speed cosmic starfield accelerating dynamically on kicks.';

  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;
  private readonly count = 4000;
  private speeds!: Float32Array;

  private readonly paramStore = new ParameterStore([
    { id: 'speed', name: 'Warp Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
    { id: 'reactivity', name: 'Kick Reactivity', min: 0.0, max: 2.5, step: 0.1, defaultValue: 1.0 },
    { id: 'density', name: 'Star Density', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 },
    { id: 'starSize', name: 'Star Size', min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.22 }
  ]);

  init(ctx: PresetContext) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.speeds = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
      this.speeds[i] = 0.4 + Math.random() * 0.8;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: this.paramStore.getValue('starSize'),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });

    this.points = new THREE.Points(this.geometry, this.material);
    ctx.scene.add(this.points);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number) {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const density = this.paramStore.getValue('density');
    const starSize = this.paramStore.getValue('starSize');

    this.material.size = starSize;
    const activeCount = Math.floor(this.count * density);
    this.geometry.setDrawRange(0, activeCount);

    const pos = this.geometry.attributes.position.array as Float32Array;
    const warpSpeed = (10.0 + (audio.bass * 40.0 + audio.beatEnergy * 50.0) * reactivity) * speed;

    for (let i = 0; i < activeCount; i++) {
      pos[i * 3 + 2] += delta * warpSpeed * this.speeds[i];

      // Reset star when it flies past camera
      if (pos[i * 3 + 2] > 20) {
        pos[i * 3 + 2] = -40;
        pos[i * 3] = (Math.random() - 0.5) * 50;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.points.rotation.z += delta * (0.05 + audio.treble * 0.2 * reactivity) * speed;
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
    this.material.color.set(theme.accent);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.points.removeFromParent();
  }
}
