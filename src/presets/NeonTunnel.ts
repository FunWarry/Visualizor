import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';

export class NeonTunnelPreset implements VisualizerPreset {
  id = 'neon-tunnel';
  name = 'Neon Tunnel';
  category = 'Tunnels' as const;
  description = 'Infinite neon geometric corridor rushing forward with audio glow.';

  private group!: THREE.Group;
  private readonly rings: THREE.LineSegments[] = [];
  private readonly numRings = 40;
  private readonly ringSpacing = 1.8;
  private readonly materials: THREE.LineBasicMaterial[] = [];

  private readonly paramStore = new ParameterStore([
    { id: 'speed', name: 'Flight Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
    { id: 'reactivity', name: 'Glow Pulse', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
    { id: 'zoom', name: 'Tunnel Zoom', min: 0.5, max: 2.0, step: 0.1, defaultValue: 1.0 },
    { id: 'density', name: 'Segment Rings', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 }
  ]);

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    for (let i = 0; i < this.numRings; i++) {
      // Hexagonal ring
      const geom = new THREE.BufferGeometry();
      const vertices: number[] = [];
      const sides = 6;
      const radius = 3.5;

      for (let s = 0; s < sides; s++) {
        const a1 = (s / sides) * Math.PI * 2;
        const a2 = ((s + 1) / sides) * Math.PI * 2;
        vertices.push(
          Math.cos(a1) * radius, Math.sin(a1) * radius, 0,
          Math.cos(a2) * radius, Math.sin(a2) * radius, 0
        );
      }
      geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

      const color = new THREE.Color().lerpColors(
        new THREE.Color(ctx.theme.primary),
        new THREE.Color(ctx.theme.accent),
        i / this.numRings
      );

      const mat = new THREE.LineBasicMaterial({
        color,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      this.materials.push(mat);

      const ring = new THREE.LineSegments(geom, mat);
      ring.position.z = -i * this.ringSpacing;
      this.rings.push(ring);
      this.group.add(ring);
    }

    ctx.scene.add(this.group);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const zoom = this.paramStore.getValue('zoom');
    const density = this.paramStore.getValue('density');

    const traverseSpeed = (12.0 + audio.bass * 25.0 * reactivity) * speed;
    const activeRings = Math.floor(this.numRings * density);

    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      if (i >= activeRings) {
        ring.visible = false;
        continue;
      }
      ring.visible = true;

      ring.position.z += delta * traverseSpeed;

      if (ring.position.z > 5) {
        ring.position.z -= this.numRings * this.ringSpacing;
      }

      // Rotate each segment slightly
      ring.rotation.z = Math.sin(time * 0.5 * speed + i * 0.15) * 0.5;

      // Pulse ring scale on kick
      const scale = zoom * (1.0 + (audio.beat ? 0.25 * reactivity : 0) * (1 - Math.abs(ring.position.z) / 40));
      ring.scale.set(scale, scale, 1);
    }
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
    for (let i = 0; i < this.numRings; i++) {
      const color = new THREE.Color().lerpColors(
        new THREE.Color(theme.primary),
        new THREE.Color(theme.accent),
        i / this.numRings
      );
      this.materials[i].color.copy(color);
    }
  }

  dispose() {
    this.rings.forEach(r => r.geometry.dispose());
    this.materials.forEach(m => m.dispose());
    this.group.removeFromParent();
  }
}
