import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class GravityForcePreset extends BasePreset {
  public override readonly id = 'gravityforce';
  public override readonly name = 'Gravity Force';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Particle attractor velocity field with gravitational feedback.';
  public override cameraConfig = {
    position: [0, 0, 11] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.0
  };

  private particles!: THREE.Points;
  private material!: THREE.PointsMaterial;
  private readonly numParticles = 3000;
  private particlePositions!: Float32Array;
  private particleVelocities!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Simulation Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Explosion Force', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Gravity Constant', min: 0.5, max: 4.0, step: 0.1, defaultValue: 2.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    this.particleVelocities = new Float32Array(this.numParticles * 3);

    for (let i = 0; i < this.numParticles; i++) {
      const radius = 2.0 + Math.random() * 8.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      this.particlePositions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      this.particlePositions[i * 3 + 1] = radius * Math.sin(phi);
      this.particlePositions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      // Tangential velocity for orbital momentum
      this.particleVelocities[i * 3] = -Math.sin(theta) * 0.5;
      this.particleVelocities[i * 3 + 1] = 0;
      this.particleVelocities[i * 3 + 2] = Math.cos(theta) * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));

    this.material = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.15,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, this.material);
    this.group.add(this.particles);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const G = this.paramStore.getValue('density');

    const dt = Math.min(delta, 0.05) * speed;
    const isKick = audio.beat;
    const explosion = isKick ? (20.0 * reactivity) : 0;

    for (let i = 0; i < this.numParticles; i++) {
      let px = this.particlePositions[i * 3];
      let py = this.particlePositions[i * 3 + 1];
      let pz = this.particlePositions[i * 3 + 2];

      const distSq = px * px + py * py + pz * pz + 0.1;
      const dist = Math.sqrt(distSq);

      // Inward gravitational pull
      const force = (G / distSq) * dt;
      let vx = this.particleVelocities[i * 3] - (px / dist) * force;
      let vy = this.particleVelocities[i * 3 + 1] - (py / dist) * force;
      let vz = this.particleVelocities[i * 3 + 2] - (pz / dist) * force;

      // Outward blast on beat drop
      if (explosion > 0) {
        vx += (px / dist) * explosion * dt;
        vy += (py / dist) * explosion * dt;
        vz += (pz / dist) * explosion * dt;
      }

      px += vx * dt * 10.0;
      py += vy * dt * 10.0;
      pz += vz * dt * 10.0;

      // Respawn if too close to singularity or flung too far
      if (dist < 0.3 || dist > 20.0) {
        const newR = 6.0 + Math.random() * 4.0;
        const th = Math.random() * Math.PI * 2;
        px = Math.cos(th) * newR;
        py = (Math.random() - 0.5) * 2.0;
        pz = Math.sin(th) * newR;
        vx = -Math.sin(th) * 0.8;
        vy = 0;
        vz = Math.cos(th) * 0.8;
      }

      this.particlePositions[i * 3] = px;
      this.particlePositions[i * 3 + 1] = py;
      this.particlePositions[i * 3 + 2] = pz;
      this.particleVelocities[i * 3] = vx * 0.99;
      this.particleVelocities[i * 3 + 1] = vy * 0.99;
      this.particleVelocities[i * 3 + 2] = vz * 0.99;
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.particles) {
      this.particles.geometry.dispose();
      this.material.dispose();
    }
  }
}
