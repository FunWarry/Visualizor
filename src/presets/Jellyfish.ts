import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class JellyfishPreset extends BasePreset {
  public override readonly id = 'jellyfish';
  public override readonly name = 'Jellyfish';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Translucent bioluminescent jellyfish dome with trailing tentacles.';
  public override cameraConfig = {
    position: [0, 1, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };

  private bellMesh!: THREE.Mesh;
  private readonly tentacles: THREE.Line[] = [];
  private bellMaterial!: THREE.MeshPhysicalMaterial;
  private tentacleMaterial!: THREE.LineBasicMaterial;
  private readonly tentacleCount = 12;
  private readonly nodesPerTentacle = 24;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Swim Velocity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Bell Propulsion', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Bell Dome Scale', min: 1.0, max: 3.5, step: 0.1, defaultValue: 2.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.tentacles.length = 0;
    const domeRadius = this.paramStore.getValue('density');

    // 1. Jellyfish Bell Dome
    const bellGeom = new THREE.SphereGeometry(domeRadius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    this.bellMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      transmission: 0.6,
      side: THREE.DoubleSide
    });
    this.bellMesh = new THREE.Mesh(bellGeom, this.bellMaterial);
    this.bellMesh.position.y = 1.5;
    this.group.add(this.bellMesh);

    // 2. Trailing Tentacle Ribbons
    this.tentacleMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    for (let t = 0; t < this.tentacleCount; t++) {
      const angle = (t / this.tentacleCount) * Math.PI * 2;
      const r = domeRadius * 0.7;
      const pts: THREE.Vector3[] = [];

      for (let n = 0; n < this.nodesPerTentacle; n++) {
        const y = 1.5 - (n * 0.25);
        pts.push(new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r));
      }

      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(geom, this.tentacleMaterial);
      this.tentacles.push(line);
      this.group.add(line);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.group.rotation.y += delta * 0.2 * speed;

    const pulse = (Math.sin(time * 3.0 * speed) * 0.2 + (audio.beat ? 0.35 : 0) + audio.bass * 0.2) * reactivity;
    this.bellMesh.scale.set(1.0 - pulse * 0.2, 1.0 + pulse * 0.5, 1.0 - pulse * 0.2);
    this.group.position.y = Math.sin(time * 1.5 * speed) * 0.8;

    for (let tIdx = 0; tIdx < this.tentacles.length; tIdx++) {
      const tentacle = this.tentacles[tIdx];
      const pos = (tentacle.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
      const angle = (tIdx / this.tentacleCount) * Math.PI * 2;

      for (let n = 1; n < this.nodesPerTentacle; n++) {
        const wave = Math.sin(time * 4.0 * speed - n * 0.3 + tIdx) * (0.05 + audio.mid * 0.15 * reactivity);
        pos[n * 3] += Math.cos(angle) * wave;
        pos[n * 3 + 2] += Math.sin(angle) * wave;
      }
      tentacle.geometry.attributes.position.needsUpdate = true;
    }

    if (audio.beat) {
      this.bellMaterial.emissiveIntensity = 1.4 * reactivity;
    } else {
      this.bellMaterial.emissiveIntensity = Math.max(0.3, this.bellMaterial.emissiveIntensity * 0.94);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.bellMaterial.color.set(theme.primary);
    this.bellMaterial.emissive.set(theme.accent);
    this.tentacleMaterial.color.set(theme.accent);
  }
}
