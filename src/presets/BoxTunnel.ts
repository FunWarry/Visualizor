import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class BoxTunnelPreset implements VisualizerPreset {
  id = 'box-tunnel';
  name = 'Box Corridor Tunnel';
  category = 'Tunnels' as const;
  description = 'Infinite geometric square corridor accelerating through glowing audio frames.';

  private group!: THREE.Group;
  private frames: THREE.LineSegments[] = [];
  private numFrames = 36;
  private spacing = 2.2;
  private materials: THREE.LineBasicMaterial[] = [];

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    for (let i = 0; i < this.numFrames; i++) {
      const size = 5.0;
      const geom = new THREE.BufferGeometry();
      const half = size / 2;
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
        opacity: 0.85
      });
      this.materials.push(mat);

      const frame = new THREE.LineSegments(geom, mat);
      frame.position.z = -i * this.spacing;
      this.frames.push(frame);
      this.group.add(frame);
    }

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    const speed = 14.0 + audio.bass * 35.0;

    for (let i = 0; i < this.numFrames; i++) {
      const f = this.frames[i];
      f.position.z += delta * speed;

      if (f.position.z > 5) {
        f.position.z -= this.numFrames * this.spacing;
      }

      // Twist and scale pulse
      f.rotation.z = Math.sin(time * 0.4 + i * 0.12) * 0.4;
      const scale = 1.0 + (audio.beat ? 0.3 : 0) * (1 - Math.abs(f.position.z) / 45);
      f.scale.set(scale, scale, 1);
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    for (let i = 0; i < this.numFrames; i++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        i / this.numFrames
      );
      this.materials[i].color.copy(color);
    }
  }

  dispose() {
    this.frames.forEach(f => f.geometry.dispose());
    this.materials.forEach(m => m.dispose());
    this.group.removeFromParent();
  }
}
