import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class BlackHolePreset extends BasePreset {
  public override readonly id = 'blackhole';
  public override readonly name = 'Black Hole';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Relativistic accretion disk with gravitational lensing vortex.';
  public override cameraConfig = {
    position: [0, 5.5, 10.5] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };

  private coreMesh!: THREE.Mesh;
  private diskPoints!: THREE.Points;
  private diskGeometry!: THREE.BufferGeometry;
  private diskMaterial!: THREE.PointsMaterial;
  private ringGroup!: THREE.Group;
  private ringMaterial!: THREE.LineBasicMaterial;
  private readonly ringGeometries: THREE.BufferGeometry[] = [];
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

    // Relativistic photon orbit rings
    this.ringGroup = new THREE.Group();
    const numRings = 8;
    this.ringMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.38
    });

    for (let i = 1; i <= numRings; i++) {
      const radius = 2.0 + (i / numRings) * 7.5;
      const circleGeom = new THREE.BufferGeometry();
      const points: THREE.Vector3[] = [];
      const segments = 64;
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      circleGeom.setFromPoints(points);
      this.ringGeometries.push(circleGeom);
      const line = new THREE.LineLoop(circleGeom, this.ringMaterial);
      this.ringGroup.add(line);
    }
    this.coreMesh.add(this.ringGroup);

    this.diskGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    this.angles = new Float32Array(this.count);
    this.radii = new Float32Array(this.count);
    const maxRadius = this.paramStore.getValue('density');

    const whiteColor = new THREE.Color('#ffffff');
    const primaryColor = new THREE.Color(ctx.theme.primary || '#ffaa00');
    const accentColor = new THREE.Color(ctx.theme.accent || '#ff3300');

    for (let i = 0; i < this.count; i++) {
      const radius = 2.0 + Math.pow(Math.random(), 1.5) * maxRadius;
      const angle = Math.random() * Math.PI * 2;
      this.radii[i] = radius;
      this.angles[i] = angle;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.4 * (radius / 3.0);
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const normR = Math.min(1.0, (radius - 2.0) / maxRadius);
      const col = new THREE.Color();
      if (normR < 0.2) {
        col.lerpColors(whiteColor, primaryColor, normR / 0.2);
      } else {
        col.lerpColors(primaryColor, accentColor, (normR - 0.2) / 0.8);
      }
      col.toArray(colors, i * 3);
    }

    this.diskGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.diskGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.diskMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.diskPoints = new THREE.Points(this.diskGeometry, this.diskMaterial);
    this.group.add(this.diskPoints);

    this.group.rotation.set(0, 0, 0);
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
    if (this.ringMaterial) {
      this.ringMaterial.color.set(theme.primary);
    }
  }

  protected override onDispose(): void {
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      (this.coreMesh.material as THREE.Material).dispose();
    }
    if (this.diskPoints) {
      this.diskGeometry.dispose();
      this.diskMaterial.dispose();
    }
    this.ringGeometries.forEach(g => g.dispose());
    if (this.ringMaterial) {
      this.ringMaterial.dispose();
    }
  }
}
