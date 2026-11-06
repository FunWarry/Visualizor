import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class GalaxyPreset extends BasePreset {
  public override readonly id = 'galaxy';
  public override readonly name = 'Galaxy';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Instanced billboard spiral galaxies in deep space warp flight.';
  public override cameraConfig = {
    position: [0, 9, 14] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };

  private galaxyPoints!: THREE.Points;
  private coreMesh!: THREE.Mesh;
  private particleMaterial!: THREE.PointsMaterial;
  private coreMaterial!: THREE.MeshStandardMaterial;
  private readonly numParticles = 6000;
  private particlePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Spiral Rotation', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Arm Tightness', min: 2.0, max: 8.0, step: 0.5, defaultValue: 4.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    const colors = new Float32Array(this.numParticles * 3);

    const arms = 3;
    const maxRadius = 9.0;
    const tightness = this.paramStore.getValue('density');

    const primary = new THREE.Color(ctx.theme.primary);
    const accent = new THREE.Color(ctx.theme.accent);

    for (let i = 0; i < this.numParticles; i++) {
      const r = Math.pow(Math.random(), 1.8) * maxRadius;
      const armIndex = i % arms;
      const armAngle = (armIndex / arms) * Math.PI * 2;
      const spiralAngle = r * tightness * 0.4;
      const angle = armAngle + spiralAngle + (Math.random() - 0.5) * 0.35;

      const spreadZ = (Math.random() - 0.5) * (0.8 / (1.0 + r * 0.2));

      this.particlePositions[i * 3] = Math.cos(angle) * r;
      this.particlePositions[i * 3 + 1] = spreadZ;
      this.particlePositions[i * 3 + 2] = Math.sin(angle) * r;

      const col = new THREE.Color().lerpColors(primary, accent, r / maxRadius);
      col.toArray(colors, i * 3);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.galaxyPoints = new THREE.Points(geometry, this.particleMaterial);
    this.group.add(this.galaxyPoints);

    // Glowing Galactic Center Bulge
    const coreGeom = new THREE.SphereGeometry(0.8, 24, 24);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.9,
      roughness: 0.1
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);

    this.group.rotation.set(0, 0, 0);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.galaxyPoints.rotation.y += delta * 0.25 * speed;
    this.group.rotation.y += delta * 0.05 * speed;

    const corePulse = 1.0 + (audio.bass * 0.4 + audio.beatEnergy * 0.6) * reactivity;
    this.coreMesh.scale.set(corePulse, corePulse, corePulse);

    if (audio.beat) {
      this.particleMaterial.size = 0.22;
    } else {
      this.particleMaterial.size = 0.12;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.coreMaterial.emissive.set(theme.accent);
  }
}
