import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class MyceliumPreset extends BasePreset {
  public override readonly id = 'mycelium';
  public override readonly name = 'Mycelium';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Branching fungal hyphae network with bioluminescent pulses.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private hyphaeLines!: THREE.LineSegments;
  private nodePoints!: THREE.Points;
  private lineMaterial!: THREE.LineBasicMaterial;
  private nodeMaterial!: THREE.PointsMaterial;
  private readonly numHyphae = 32;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Pulse Velocity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Node Glow', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Network Spread', min: 4.0, max: 14.0, step: 1.0, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const linePoints: number[] = [];
    const nodeCoords: number[] = [];

    const spread = this.paramStore.getValue('density');

    for (let h = 0; h < this.numHyphae; h++) {
      let curr = new THREE.Vector3((Math.random() - 0.5) * 2, -3, (Math.random() - 0.5) * 2);
      nodeCoords.push(curr.x, curr.y, curr.z);

      const segments = 8;
      for (let s = 0; s < segments; s++) {
        const next = curr.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * (spread / 4),
          Math.random() * 0.8,
          (Math.random() - 0.5) * (spread / 4)
        ));

        linePoints.push(curr.x, curr.y, curr.z, next.x, next.y, next.z);
        nodeCoords.push(next.x, next.y, next.z);
        curr = next;
      }
    }

    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    this.lineMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.hyphaeLines = new THREE.LineSegments(lineGeom, this.lineMaterial);
    this.group.add(this.hyphaeLines);

    const nodeGeom = new THREE.BufferGeometry();
    nodeGeom.setAttribute('position', new THREE.Float32BufferAttribute(nodeCoords, 3));
    this.nodeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.22,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.nodePoints = new THREE.Points(nodeGeom, this.nodeMaterial);
    this.group.add(this.nodePoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.15 * speed;

    const pulse = Math.sin(time * 3.0 * speed) * 0.5 + 0.5;
    this.nodeMaterial.size = (0.18 + (pulse * 0.15 + audio.bass * 0.25)) * reactivity;
    this.lineMaterial.opacity = 0.5 + (audio.mid * 0.5 + (audio.beat ? 0.3 : 0)) * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.lineMaterial.color.set(theme.primary);
    this.nodeMaterial.color.set(theme.accent);
  }
}
