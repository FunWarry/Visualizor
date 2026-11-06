import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class VodLinesPreset extends BasePreset {
  public override readonly id = 'vodlines';
  public override readonly name = 'Vod Lines';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Retro music tracker channel oscilloscope display lines.';
  public override cameraConfig = {
    position: [0, 0, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private readonly channels: THREE.Line[] = [];
  private readonly numChannels = 4;
  private readonly pointsPerChannel = 64;
  private channelMaterials: THREE.LineBasicMaterial[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Oscilloscope Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Trace Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Channel Height', min: 1.0, max: 4.0, step: 0.2, defaultValue: 2.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.channels.length = 0;
    this.channelMaterials = [];

    const colors = [
      new THREE.Color(ctx.theme.primary),
      new THREE.Color(ctx.theme.accent),
      new THREE.Color(ctx.theme.secondary),
      new THREE.Color(ctx.theme.glow)
    ];

    for (let c = 0; c < this.numChannels; c++) {
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(this.pointsPerChannel * 3);
      const yOffset = (c - 1.5) * 2.2;

      for (let p = 0; p < this.pointsPerChannel; p++) {
        pos[p * 3] = (p / (this.pointsPerChannel - 1) - 0.5) * 16.0;
        pos[p * 3 + 1] = yOffset;
        pos[p * 3 + 2] = 0;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

      const mat = new THREE.LineBasicMaterial({
        color: colors[c % colors.length],
        linewidth: 2,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.channelMaterials.push(mat);

      const line = new THREE.Line(geom, mat);
      this.channels.push(line);
      this.group.add(line);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const height = this.paramStore.getValue('density');

    const bands = [audio.subBass, audio.bass, audio.mid, audio.treble];

    for (let c = 0; c < this.numChannels; c++) {
      const line = this.channels[c];
      const pos = (line.geometry.attributes.position.array as Float32Array);
      const yBase = (c - 1.5) * 2.2;
      const energy = bands[c] * reactivity;

      for (let p = 0; p < this.pointsPerChannel; p++) {
        const xNorm = p / this.pointsPerChannel;
        const wave = Math.sin(xNorm * 12.0 + time * (4.0 + c * 2.0) * speed);
        const noise = (Math.random() - 0.5) * 0.1 * energy;
        pos[p * 3 + 1] = yBase + (wave * energy * height) + noise;
      }
      line.geometry.attributes.position.needsUpdate = true;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const colors = [
      new THREE.Color(theme.primary),
      new THREE.Color(theme.accent),
      new THREE.Color(theme.secondary),
      new THREE.Color(theme.glow)
    ];
    for (let c = 0; c < this.numChannels; c++) {
      this.channelMaterials[c].color.copy(colors[c % colors.length]);
    }
  }

  protected override onDispose(): void {
    for (const c of this.channels) {
      c.geometry.dispose();
    }
    for (const m of this.channelMaterials) {
      m.dispose();
    }
    this.channels.length = 0;
    this.channelMaterials.length = 0;
  }
}
