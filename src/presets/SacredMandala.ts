import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class SacredMandalaPreset extends BasePreset {
  public override readonly id = 'sacred';
  public override readonly name = 'Sacred';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Sacred geometry mandalas unfolding with harmonic counter-rotation.';
  public override cameraConfig = {
    position: [0, 0, 9] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private readonly mandalaRings: THREE.LineLoop[] = [];
  private ringMaterial!: THREE.LineBasicMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Spin Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Petal Harmonics', min: 4.0, max: 12.0, step: 1.0, defaultValue: 6.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.mandalaRings.length = 0;

    this.ringMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const ringCounts = [12, 16, 24, 32, 48];
    const harmonics = this.paramStore.getValue('density');

    ringCounts.forEach((segments, idx) => {
      const radius = 1.0 + idx * 0.75;
      const geom = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];

      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        const modR = radius + Math.sin(theta * harmonics) * 0.2;
        points.push(new THREE.Vector3(Math.cos(theta) * modR, Math.sin(theta) * modR, 0));
      }

      geom.setFromPoints(points);
      const ring = new THREE.LineLoop(geom, this.ringMaterial);
      this.mandalaRings.push(ring);
      this.group.add(ring);
    });
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.mandalaRings.forEach((ring, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      ring.rotation.z += delta * (0.35 + audio.bass * 0.8 * reactivity) * dir * speed;
      const scale = 1.0 + (audio.beat ? 0.2 * reactivity : 0) * (idx + 1) * 0.2;
      ring.scale.set(scale, scale, 1);
    });
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.ringMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    for (const ring of this.mandalaRings) {
      ring.geometry.dispose();
    }
    this.mandalaRings.length = 0;
    this.ringMaterial?.dispose();
  }
}
