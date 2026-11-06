import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class BoxTunnelPreset extends BasePreset {
  public override readonly id = 'boxtunnel';
  public override readonly name = 'Box Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = '36 square wireframe gate frames rushing forward along z-axis.';
  public override cameraConfig = {
    position: [0, 0, 4] as [number, number, number],
    target: [0, 0, -50] as [number, number, number],
    autoRotate: false
  };

  private readonly frames: THREE.LineSegments[] = [];
  private readonly numFrames = 36;
  private readonly spacing = 2.2;
  private readonly materials: THREE.LineBasicMaterial[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Fly Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Frame Pump', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Frame Size', min: 3.0, max: 8.0, step: 0.5, defaultValue: 5.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.frames.length = 0;
    this.materials.length = 0;
    const size = this.paramStore.getValue('density');
    const half = size / 2;

    for (let i = 0; i < this.numFrames; i++) {
      const geom = new THREE.BufferGeometry();
      const vertices = [
        -half, -half, 0,  half, -half, 0,
         half, -half, 0,  half,  half, 0,
         half,  half, 0, -half,  half, 0,
        -half,  half, 0, -half, -half, 0
      ];
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const color = new THREE.Color().lerpColors(
        new THREE.Color(ctx.theme.primary),
        new THREE.Color(ctx.theme.accent),
        i / this.numFrames
      );

      const mat = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.materials.push(mat);

      const frame = new THREE.LineSegments(geom, mat);
      frame.position.z = -i * this.spacing;
      this.frames.push(frame);
      this.group.add(frame);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const flySpeed = (14.0 + audio.bass * 35.0 * reactivity) * speed;

    for (let i = 0; i < this.numFrames; i++) {
      const f = this.frames[i];
      f.position.z += delta * flySpeed;

      if (f.position.z > 5) {
        f.position.z -= this.numFrames * this.spacing;
      }

      f.rotation.z = Math.sin(time * 0.4 * speed + i * 0.12) * 0.4;
      const scale = 1.0 + (audio.beat ? 0.3 * reactivity : 0) * (1 - Math.abs(f.position.z) / 45);
      f.scale.set(scale, scale, 1);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    for (let i = 0; i < this.numFrames; i++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        i / this.numFrames
      );
      this.materials[i].color.copy(color);
    }
  }

  protected override onDispose(): void {
    for (const f of this.frames) {
      f.geometry.dispose();
    }
    for (const m of this.materials) {
      m.dispose();
    }
    this.frames.length = 0;
    this.materials.length = 0;
  }
}
