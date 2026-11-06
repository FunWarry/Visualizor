import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class GalaxyPreset extends BasePreset {
  public override readonly id = 'galaxy';
  public override readonly name = 'Galaxy';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Spiral galaxy disc with orbital resonance rings and pulsating galactic core.';
  
  public override cameraConfig = {
    position: [0, 8.5, 14.5] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.22,
    bloomIntensity: 0.3
  };

  private galaxyPoints!: THREE.Points;
  private coreMesh!: THREE.Mesh;
  private particleMaterial!: THREE.PointsMaterial;
  private coreMaterial!: THREE.MeshStandardMaterial;
  private ringGroup!: THREE.Group;
  private ringMaterial!: THREE.LineBasicMaterial;
  private readonly ringGeometries: THREE.BufferGeometry[] = [];

  private readonly numParticles = 7000;
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
    this.setupParticles(ctx);
    this.setupCore(ctx);
    this.setupOrbitalRings(ctx);
    this.group.rotation.set(0, 0, 0);
  }

  private setupParticles(ctx: PresetContext): void {
    const geometry = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    const colors = new Float32Array(this.numParticles * 3);

    const arms = 3;
    const maxRadius = 9.5;
    const tightness = this.paramStore.getValue('density');

    const innerColor = new THREE.Color('#ffffff');
    const magentaColor = new THREE.Color(ctx.theme.secondary || '#ff2a85');
    const emeraldColor = new THREE.Color('#39ff88');
    const yellowColor = new THREE.Color(ctx.theme.primary || '#ffaa00');
    const orangeColor = new THREE.Color(ctx.theme.accent || '#ff5500');

    for (let i = 0; i < this.numParticles; i++) {
      const r = Math.pow(Math.random(), 1.6) * maxRadius;
      const armIndex = i % arms;
      const armAngle = (armIndex / arms) * Math.PI * 2;
      const spiralAngle = r * tightness * 0.38;
      const angle = armAngle + spiralAngle + (Math.random() - 0.5) * 0.35;

      const spreadY = (Math.random() - 0.5) * (0.8 / (1.0 + r * 0.2));

      this.particlePositions[i * 3] = Math.cos(angle) * r;
      this.particlePositions[i * 3 + 1] = spreadY;
      this.particlePositions[i * 3 + 2] = Math.sin(angle) * r;

      const normR = r / maxRadius;
      const col = new THREE.Color();
      if (normR < 0.22) {
        col.lerpColors(innerColor, magentaColor, normR / 0.22);
      } else if (normR < 0.52) {
        col.lerpColors(magentaColor, emeraldColor, (normR - 0.22) / 0.30);
      } else if (normR < 0.78) {
        col.lerpColors(emeraldColor, yellowColor, (normR - 0.52) / 0.26);
      } else {
        col.lerpColors(yellowColor, orangeColor, (normR - 0.78) / 0.22);
      }
      col.toArray(colors, i * 3);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.galaxyPoints = new THREE.Points(geometry, this.particleMaterial);
    this.group.add(this.galaxyPoints);
  }

  private setupCore(ctx: PresetContext): void {
    const coreGeom = new THREE.SphereGeometry(0.85, 32, 32);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.85,
      roughness: 0.15,
      metalness: 0.2
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);

    const wireGeom = new THREE.SphereGeometry(0.86, 16, 12);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    const coreWire = new THREE.Mesh(wireGeom, wireMat);
    this.coreMesh.add(coreWire);

    this.group.add(this.coreMesh);
  }

  private setupOrbitalRings(ctx: PresetContext): void {
    this.ringGroup = new THREE.Group();
    const numRings = 9;
    this.ringMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.primary),
      transparent: true,
      opacity: 0.38
    });

    for (let i = 1; i <= numRings; i++) {
      const radius = (i / numRings) * 8.8;
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
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.galaxyPoints.rotation.y += delta * 0.22 * speed;
    if (this.ringGroup) {
      this.ringGroup.rotation.y += delta * 0.08 * speed;
    }
    this.group.rotation.y += delta * 0.04 * speed;

    const corePulse = 1.0 + (audio.bass * 0.35 + audio.beatEnergy * 0.55) * reactivity;
    this.coreMesh.scale.set(corePulse, corePulse, corePulse);

    if (audio.beat) {
      this.particleMaterial.size = 0.22 * reactivity;
      this.coreMaterial.emissiveIntensity = 1.4 * reactivity;
    } else {
      this.particleMaterial.size = Math.max(0.14, this.particleMaterial.size * 0.94);
      this.coreMaterial.emissiveIntensity = Math.max(0.7, this.coreMaterial.emissiveIntensity * 0.94);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.coreMaterial.emissive.set(theme.accent);
    if (this.ringMaterial) {
      this.ringMaterial.color.set(theme.primary);
    }
  }

  protected override onDispose(): void {
    if (this.galaxyPoints) {
      this.galaxyPoints.geometry.dispose();
      this.particleMaterial.dispose();
    }
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial.dispose();
    }
    this.ringGeometries.forEach(g => g.dispose());
    if (this.ringMaterial) {
      this.ringMaterial.dispose();
    }
  }
}
