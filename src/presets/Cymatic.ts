import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class CymaticPreset extends BasePreset {
  public override readonly id = 'cymatic';
  public override readonly name = 'Cymatic';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Standing wave resonance plate organizing nodal sand figures.';

  private plateMesh!: THREE.Mesh;
  private sandParticles!: THREE.Points;
  private material!: THREE.MeshStandardMaterial;
  private particleMaterial!: THREE.PointsMaterial;
  private readonly numParticles = 4000;
  private particleBasePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Resonance Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Nodal Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Mode Complexity', min: 2.0, max: 8.0, step: 1.0, defaultValue: 4.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const plateGeom = new THREE.CylinderGeometry(6, 6, 0.2, 64);
    plateGeom.rotateX(Math.PI / 6);

    this.material = new THREE.MeshStandardMaterial({
      color: 0x111118,
      roughness: 0.4,
      metalness: 0.85,
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.15
    });

    this.plateMesh = new THREE.Mesh(plateGeom, this.material);
    this.group.add(this.plateMesh);

    // Chladni resonant sand particles
    const particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numParticles * 3);
    this.particleBasePositions = new Float32Array(this.numParticles * 2);

    for (let i = 0; i < this.numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 5.6;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      this.particleBasePositions[i * 2] = x;
      this.particleBasePositions[i * 2 + 1] = z;

      positions[i * 3] = x;
      positions[i * 3 + 1] = 0.15;
      positions[i * 3 + 2] = z;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.08,
      transparent: true,
      opacity: 0.85
    });

    this.sandParticles = new THREE.Points(particleGeom, this.particleMaterial);
    this.plateMesh.add(this.sandParticles);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const baseMode = Math.floor(this.paramStore.getValue('density'));

    this.plateMesh.rotation.y += delta * 0.15 * speed;

    const n = baseMode + Math.floor(audio.bass * 3.0);
    const m = baseMode + 2 + Math.floor(audio.mid * 3.0);

    const pos = (this.sandParticles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;

    for (let i = 0; i < this.numParticles; i++) {
      const bx = this.particleBasePositions[i * 2];
      const bz = this.particleBasePositions[i * 2 + 1];

      // Chladni nodal function: N(x, y) = a*sin(nx)*sin(my) - b*sin(mx)*sin(ny)
      const chladni = Math.cos(n * bx * 0.6) * Math.cos(m * bz * 0.6) - Math.cos(m * bx * 0.6) * Math.cos(n * bz * 0.6);
      const vibration = Math.abs(chladni);

      // Sand bounces away from high amplitude regions toward nodal lines (vibration ~ 0)
      const drift = vibration * 0.25 * (1.0 + audio.bass * 2.0 * reactivity);
      const jitter = Math.sin(i * 12.0 + time * 8.0) * drift;

      pos[i * 3] = bx + (chladni > 0 ? -1 : 1) * Math.abs(chladni) * 0.15 * reactivity;
      pos[i * 3 + 1] = 0.15 + Math.abs(jitter);
      pos[i * 3 + 2] = bz + (chladni > 0 ? 1 : -1) * Math.abs(chladni) * 0.15 * reactivity;
    }

    this.sandParticles.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.emissive.set(theme.primary);
    this.particleMaterial.color.set(theme.accent);
  }
}
