import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class RingTunnelPreset extends BasePreset {
  public override readonly id = 'ringtunnel';
  public override readonly name = 'Ring Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = '48 concentric circular torus rings extending into depth fog.';
  public override cameraConfig = {
    position: [0, 0, 3] as [number, number, number],
    target: [0, 0, -40] as [number, number, number],
    autoRotate: false
  };

  private readonly rings: THREE.Mesh[] = [];
  private readonly numRings = 48;
  private readonly spacing = 1.2;
  private ringMaterial!: THREE.MeshStandardMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Fly Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Ring Pulse', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Ring Radius', min: 2.0, max: 5.5, step: 0.2, defaultValue: 3.6 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;
    const radius = this.paramStore.getValue('density');
    const torusGeom = new THREE.TorusGeometry(radius, 0.06, 16, 64);

    this.ringMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.8
    });

    for (let i = 0; i < this.numRings; i++) {
      const ring = new THREE.Mesh(torusGeom, this.ringMaterial);
      ring.position.z = -i * this.spacing;
      this.rings.push(ring);
      this.group.add(ring);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const totalSpan = this.numRings * this.spacing;
    const moveZ = delta * (6.0 + audio.bass * 10.0 * reactivity) * speed;

    for (let i = 0; i < this.numRings; i++) {
      const ring = this.rings[i];
      ring.position.z += moveZ;

      if (ring.position.z > 2.0) {
        ring.position.z -= totalSpan;
      }

      // Wave cascade scaling
      const phase = time * 3.0 + i * 0.2;
      const scale = 1.0 + Math.sin(phase) * 0.15 * (1.0 + audio.bass * reactivity);
      ring.scale.set(scale, scale, 1.0);
    }

    this.group.rotation.z += delta * 0.2 * speed;
    this.ringMaterial.emissiveIntensity = 0.4 + (audio.bass * 0.8 + (audio.beat ? 0.6 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.ringMaterial.color.set(theme.primary);
    this.ringMaterial.emissive.set(theme.accent);
  }
}
