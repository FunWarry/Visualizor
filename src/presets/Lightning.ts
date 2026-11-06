import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class LightningPreset extends BasePreset {
  public override readonly id = 'lightning';
  public override readonly name = 'Lightning';
  public override readonly category = 'Particles & Light' as const;
  public override readonly description = 'Fractal high-voltage electric arc network discharging on beats.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private readonly boltLines: THREE.Line[] = [];
  private readonly boltGeometries: THREE.BufferGeometry[] = [];
  private readonly boltMaterials: THREE.LineBasicMaterial[] = [];
  private readonly numBolts = 16;
  private readonly segmentsPerBolt = 24;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Arc Frequency', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Discharge Voltage', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Arc Reach', min: 2.0, max: 10.0, step: 0.5, defaultValue: 6.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.boltLines.length = 0;
    this.boltGeometries.length = 0;
    this.boltMaterials.length = 0;

    for (let b = 0; b < this.numBolts; b++) {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(this.segmentsPerBolt * 3);
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.boltGeometries.push(geom);

      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(ctx.theme.accent),
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.boltMaterials.push(mat);

      const line = new THREE.Line(geom, mat);
      this.boltLines.push(line);
      this.group.add(line);
    }
  }

  private updateBolt(b: number, audio: AudioFeatures, time: number, ctx: PresetContext, reactivity: number, reach: number): void {
    const geom = this.boltGeometries[b];
    const pos = geom.attributes.position.array as Float32Array;

    const angle = (b / this.numBolts) * Math.PI * 2 + Math.sin(time + b) * 0.2;
    const arcLength = (2.0 + audio.bass * reach + audio.beatEnergy * 5.0) * reactivity;
    const endX = Math.cos(angle) * arcLength;
    const endY = Math.sin(angle) * arcLength;
    const jitter = 0.35 + audio.treble * 0.8 * reactivity;

    for (let s = 0; s < this.segmentsPerBolt; s++) {
      const t = s / (this.segmentsPerBolt - 1);
      const isIntermediate = s > 0 && s < this.segmentsPerBolt - 1;
      const noise = isIntermediate ? jitter : 0;

      pos[s * 3] = endX * t + (Math.random() - 0.5) * noise;
      pos[s * 3 + 1] = endY * t + (Math.random() - 0.5) * noise;
      pos[s * 3 + 2] = (Math.random() - 0.5) * noise;
    }

    geom.attributes.position.needsUpdate = true;

    const mat = this.boltMaterials[b];
    if (audio.beat) {
      mat.opacity = 1.0;
      mat.color.set(ctx.theme.glow);
    } else {
      mat.opacity = 0.4 + Math.random() * 0.4;
      mat.color.set(ctx.theme.accent);
    }
  }

  public update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const reach = this.paramStore.getValue('density');

    this.group.rotation.z += delta * (0.2 + audio.treble * 0.4) * speed;

    for (let b = 0; b < this.numBolts; b++) {
      this.updateBolt(b, audio, time * speed, ctx, reactivity, reach);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    for (const m of this.boltMaterials) {
      m.color.set(theme.accent);
    }
  }

  protected override onDispose(): void {
    for (const g of this.boltGeometries) {
      g.dispose();
    }
    for (const m of this.boltMaterials) {
      m.dispose();
    }
    this.boltLines.length = 0;
    this.boltGeometries.length = 0;
    this.boltMaterials.length = 0;
  }
}
