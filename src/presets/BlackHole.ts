import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class BlackHolePreset extends BasePreset {
  public override readonly id = 'blackhole';
  public override readonly name = 'Black Hole';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Relativistic accretion disk with gravitational lensing vortex.';

  private coreMesh!: THREE.Mesh;
  private diskPoints!: THREE.Points;
  private diskGeometry!: THREE.BufferGeometry;
  private diskMaterial!: THREE.PointsMaterial;
  private readonly count = 5000;
  private angles!: Float32Array;
  private radii!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Swirl Velocity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Disk Radius', min: 4.0, max: 10.0, step: 0.5, defaultValue: 6.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const coreGeom = new THREE.SphereGeometry(1.6, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.coreMesh = new THREE.Mesh(coreGeom, coreMat);
    this.group.add(this.coreMesh);

    this.diskGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    this.angles = new Float32Array(this.count);
    this.radii = new Float32Array(this.count);
    const maxRadius = this.paramStore.getValue('density');

    for (let i = 0; i < this.count; i++) {
      const radius = 2.0 + Math.pow(Math.random(), 1.5) * maxRadius;
      const angle = Math.random() * Math.PI * 2;
      this.radii[i] = radius;
      this.angles[i] = angle;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4 * (radius / 3.0);
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    this.diskGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    this.diskMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.18,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.diskPoints = new THREE.Points(this.diskGeometry, this.diskMaterial);
    this.group.add(this.diskPoints);

    this.group.rotation.x = 0.55;
    this.group.rotation.z = 0.2;
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    const pos = this.diskGeometry.attributes.position.array as Float32Array;
    const baseSpeed = (1.2 + audio.bass * 2.0 * reactivity) * speed;

    for (let i = 0; i < this.count; i++) {
      const angularVel = (baseSpeed / Math.sqrt(this.radii[i])) * delta;
      this.angles[i] += angularVel;

      const r = this.radii[i] * (1.0 + (audio.beat ? 0.08 * reactivity : 0));
      pos[i * 3] = Math.cos(this.angles[i]) * r;
      pos[i * 3 + 2] = Math.sin(this.angles[i]) * r;
    }

    this.diskGeometry.attributes.position.needsUpdate = true;
    this.group.rotation.y += delta * 0.1 * speed;

    const coreScale = 1.0 + (audio.bass * 0.35 + audio.beatEnergy * 0.2) * reactivity;
    this.coreMesh.scale.set(coreScale, coreScale, coreScale);
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.diskMaterial.color.set(theme.accent);
  }
}
