import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

function createGlowTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const center = (size - 1) / 2;
  const maxR = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.hypot(dx, dy);
      const norm = Math.max(0, 1.0 - dist / maxR);
      const alpha = Math.round(Math.pow(norm, 2.0) * 255);

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

export class CircularSpectrumPreset extends BasePreset {
  public override readonly id = 'circular';
  public override readonly name = 'Circular';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Volumetric glowing stardust accretion disk with pulsing core and orbital rings.';

  public override cameraConfig = {
    position: [0, 8.5, 15.0] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.35,
    bloomIntensity: 0.35
  };

  // 1. Concentric Frequency Resonance Rings (Primary group - 16 rings)
  private readonly rings: THREE.Line[] = [];
  private readonly ringGeometries: THREE.BufferGeometry[] = [];
  private readonly ringMaterials: THREE.LineBasicMaterial[] = [];
  private readonly numRings = 16;
  private readonly segments = 128;

  // 2. Ambient Volumetric Composition (Jewel Core, Orbital Rings, 14,000 Stardust Particles)
  private ambientGroup: THREE.Group | null = null;
  private coreMesh!: THREE.Mesh;
  private coreWireframe!: THREE.LineSegments;
  private coreMaterial!: THREE.MeshStandardMaterial;
  private wireMaterial!: THREE.LineBasicMaterial;
  private readonly orbitalRings: THREE.Line[] = [];
  private readonly orbitalRingMaterials: THREE.LineBasicMaterial[] = [];
  private stardustPoints!: THREE.Points;
  private particlePositions!: Float32Array;
  private particleInitialAngles!: Float32Array;
  private particleRadii!: Float32Array;
  private particleColors!: Float32Array;
  private particleDriftSpeeds!: Float32Array;
  private pointsMaterial!: THREE.PointsMaterial;
  private glowTexture: THREE.DataTexture | null = null;
  private readonly numParticles = 14000;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rotation Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'radius', name: 'Ring Radius', min: 1.0, max: 5.0, step: 0.2, defaultValue: 3.0 },
      { id: 'density', name: 'Ring Count', min: 4, max: 16, step: 1, defaultValue: 16 }
    ]);
  }

  public override init(ctx: PresetContext): void {
    super.init(ctx);
    if (this.ambientGroup) {
      ctx.scene.add(this.ambientGroup);
    }
  }

  protected setup(ctx: PresetContext): void {
    this.rings.length = 0;
    this.ringGeometries.length = 0;
    this.ringMaterials.length = 0;
    this.orbitalRings.length = 0;
    this.orbitalRingMaterials.length = 0;

    // Reset base group rotation to horizontal XZ plane
    this.group.rotation.set(0, 0, 0);

    // --- A. 16 Concentric Frequency Rings (Horizontal plane XZ) ---
    for (let r = 0; r < this.numRings; r++) {
      const radius = 1.0 + r * 0.36;
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array((this.segments + 1) * 3);

      for (let s = 0; s <= this.segments; s++) {
        const theta = (s / this.segments) * Math.PI * 2;
        positions[s * 3] = Math.cos(theta) * radius;
        positions[s * 3 + 1] = 0;
        positions[s * 3 + 2] = Math.sin(theta) * radius;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.ringGeometries.push(geom);

      const color = new THREE.Color().lerpColors(
        new THREE.Color(ctx.theme.primary),
        new THREE.Color(ctx.theme.accent),
        r / this.numRings
      );

      const mat = new THREE.LineBasicMaterial({
        color,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.65
      });
      this.ringMaterials.push(mat);

      const line = new THREE.Line(geom, mat);
      this.rings.push(line);
      this.group.add(line);
    }

    // --- B. Ambient Volumetric Composition (Core, Orbitals & Stardust Particles) ---
    this.ambientGroup = new THREE.Group();
    this.ambientGroup.rotation.set(0, 0, 0);

    // 1. 3D Pulsing Jewel Core
    const coreGeom = new THREE.IcosahedronGeometry(0.85, 2);
    this.coreMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.1
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.ambientGroup.add(this.coreMesh);

    const wireGeom = new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.08, 1));
    this.wireMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.75,
      linewidth: 1.2
    });
    this.coreWireframe = new THREE.LineSegments(wireGeom, this.wireMaterial);
    this.ambientGroup.add(this.coreWireframe);

    // 2. Orbital Coordinate Rings
    const ringRadii = [1.5, 2.4, 3.3];
    const ringAngles = [
      { x: 0.25, y: 0.0, z: 0.1 },
      { x: -0.2, y: 0.35, z: 0.15 },
      { x: 0.1, y: -0.3, z: 0.2 }
    ];

    for (let i = 0; i < ringRadii.length; i++) {
      const radius = ringRadii[i];
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(129 * 3);
      for (let s = 0; s <= 128; s++) {
        const theta = (s / 128) * Math.PI * 2;
        pos[s * 3] = Math.cos(theta) * radius;
        pos[s * 3 + 1] = 0;
        pos[s * 3 + 2] = Math.sin(theta) * radius;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));

      const ringColor = i === 1 ? new THREE.Color(ctx.theme.accent) : new THREE.Color(ctx.theme.primary);
      const ringMat = new THREE.LineBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: 0.55,
        linewidth: 1.2
      });

      const orbitalLine = new THREE.Line(geom, ringMat);
      orbitalLine.rotation.set(ringAngles[i].x, ringAngles[i].y, ringAngles[i].z);
      this.orbitalRings.push(orbitalLine);
      this.orbitalRingMaterials.push(ringMat);
      this.ambientGroup.add(orbitalLine);
    }

    // 3. Volumetric Stardust Particle Accretion Disk (14,000 points)
    this.setupParticles(ctx);
  }

  private setupParticles(ctx: PresetContext): void {
    const pointsGeom = new THREE.BufferGeometry();
    this.particlePositions = new Float32Array(this.numParticles * 3);
    this.particleInitialAngles = new Float32Array(this.numParticles);
    this.particleRadii = new Float32Array(this.numParticles);
    this.particleColors = new Float32Array(this.numParticles * 3);
    this.particleDriftSpeeds = new Float32Array(this.numParticles);

    const primaryCol = new THREE.Color(ctx.theme.primary);
    const accentCol = new THREE.Color(ctx.theme.accent);
    const glowCol = new THREE.Color(ctx.theme.glow || ctx.theme.primary);
    const whiteCol = new THREE.Color('#ffffff');

    for (let i = 0; i < this.numParticles; i++) {
      const isSpray = i > 12000;
      const radius = isSpray
        ? 4.5 + Math.random() * 3.8
        : 0.85 + Math.pow(Math.random(), 0.82) * 6.5;
      const angle = Math.random() * Math.PI * 2;

      this.particleRadii[i] = radius;
      this.particleInitialAngles[i] = angle;
      this.particleDriftSpeeds[i] = 0.8 + Math.random() * 0.4;

      this.particlePositions[i * 3] = Math.cos(angle) * radius;
      this.particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 0.22;
      this.particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      const normR = Math.min(1.0, (radius - 0.85) / 6.5);
      const c = new THREE.Color();
      if (normR < 0.22) {
        c.lerpColors(whiteCol, primaryCol, normR / 0.22);
      } else if (normR < 0.65) {
        c.lerpColors(primaryCol, accentCol, (normR - 0.22) / 0.43);
      } else {
        c.lerpColors(accentCol, glowCol, (normR - 0.65) / 0.35);
      }
      c.toArray(this.particleColors, i * 3);
    }

    pointsGeom.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    pointsGeom.setAttribute('color', new THREE.BufferAttribute(this.particleColors, 3));

    this.glowTexture ??= createGlowTexture();

    this.pointsMaterial = new THREE.PointsMaterial({
      size: 0.30,
      map: this.glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stardustPoints = new THREE.Points(pointsGeom, this.pointsMaterial);
    this.ambientGroup?.add(this.stardustPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const radiusMultiplier = this.paramStore.getValue('radius') / 3.0;
    const activeRings = Math.floor(this.paramStore.getValue('density'));

    // Smooth horizontal rotation around the Y axis
    this.group.rotation.y += delta * (0.18 + audio.mid * 0.22 * reactivity) * speed;
    this.group.rotation.z = Math.sin(time * 0.5) * 0.03 * speed + (audio.bass * 0.015);

    this.updateRings(audio, time, speed, reactivity, radiusMultiplier, activeRings);

    if (this.ambientGroup) {
      this.ambientGroup.rotation.y = this.group.rotation.y;
      this.ambientGroup.rotation.z = this.group.rotation.z;
      this.updateAmbient(audio, time, delta, speed, reactivity, radiusMultiplier);
    }
  }

  private updateRings(
    audio: AudioFeatures,
    time: number,
    speed: number,
    reactivity: number,
    radiusMultiplier: number,
    activeRings: number
  ): void {
    for (let r = 0; r < this.numRings; r++) {
      const line = this.rings[r];
      if (r >= activeRings) {
        line.visible = false;
        continue;
      }
      line.visible = true;

      const geom = this.ringGeometries[r];
      const pos = geom.attributes.position.array as Float32Array;
      const baseRadius = (1.0 + r * 0.36) * radiusMultiplier;
      const freqIndex = Math.floor((r / this.numRings) * (audio.frequencyData.length * 0.4));
      const freqVal = (audio.frequencyData[freqIndex] || 0) / 255.0;

      for (let s = 0; s <= this.segments; s++) {
        const theta = (s / this.segments) * Math.PI * 2;
        const waveIndex = Math.floor((s / this.segments) * audio.timeDomainData.length);
        const waveVal = ((audio.timeDomainData[waveIndex] || 128) - 128) / 128.0;

        const displacement = (freqVal * 0.35 + waveVal * (0.15 + audio.bass * 0.25)) * reactivity;
        const currentRadius = baseRadius + displacement;

        pos[s * 3] = Math.cos(theta) * currentRadius;
        pos[s * 3 + 1] = Math.sin(theta * 6 + time * 3 * speed) * freqVal * 0.35 * reactivity;
        pos[s * 3 + 2] = Math.sin(theta) * currentRadius;
      }

      geom.attributes.position.needsUpdate = true;
    }
  }

  private updateAmbient(
    audio: AudioFeatures,
    time: number,
    delta: number,
    speed: number,
    reactivity: number,
    radiusMultiplier: number
  ): void {
    if (!this.ambientGroup) return;

    const corePulse = 1.0 + (audio.bass * 0.35 + (audio.beat ? 0.25 : 0)) * reactivity;
    this.coreMesh.scale.set(corePulse, corePulse, corePulse);
    this.coreWireframe.scale.set(corePulse * 1.08, corePulse * 1.08, corePulse * 1.08);

    this.coreMesh.rotation.y += delta * 0.35 * speed;
    this.coreMesh.rotation.x += delta * 0.18 * speed;
    this.coreWireframe.rotation.y -= delta * 0.4 * speed;
    this.coreWireframe.rotation.z += delta * 0.25 * speed;

    for (let i = 0; i < this.orbitalRings.length; i++) {
      const ring = this.orbitalRings[i];
      const dir = i % 2 === 0 ? 1 : -1;
      ring.rotation.y += delta * (0.2 + i * 0.12) * speed * dir;
      ring.rotation.x += delta * 0.08 * speed * (i + 1);
    }

    this.updateParticles(audio, time, speed, reactivity, radiusMultiplier);
  }

  private updateParticles(
    audio: AudioFeatures,
    time: number,
    speed: number,
    reactivity: number,
    radiusMultiplier: number
  ): void {
    const positions = this.particlePositions;
    const beatKick = audio.beat ? 0.18 * reactivity : 0;
    this.pointsMaterial.size = audio.beat ? 0.36 : 0.28;

    for (let i = 0; i < this.numParticles; i++) {
      const baseR = this.particleRadii[i] * radiusMultiplier;
      const drift = this.particleDriftSpeeds[i] || 1.0;
      const keplerSpeed = (0.75 / Math.sqrt(Math.max(0.8, baseR))) * speed * drift;
      const currentAngle = this.particleInitialAngles[i] + time * keplerSpeed * 0.35;

      const freqIdx = Math.floor((this.particleRadii[i] / 7.5) * (audio.frequencyData.length * 0.45));
      const freq = (audio.frequencyData[freqIdx] || 0) / 255.0;

      const radialDisplacement = (freq * 0.3 + beatKick) * reactivity;
      const currentRadius = baseR + radialDisplacement;

      positions[i * 3] = Math.cos(currentAngle) * currentRadius;
      positions[i * 3 + 1] = Math.sin(time * 2.0 + this.particleInitialAngles[i] * 3.0) * (0.12 + freq * 0.2) * reactivity;
      positions[i * 3 + 2] = Math.sin(currentAngle) * currentRadius;
    }

    if (this.stardustPoints?.geometry?.attributes?.position) {
      this.stardustPoints.geometry.attributes.position.needsUpdate = true;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const primary = new THREE.Color(theme.primary);
    const accent = new THREE.Color(theme.accent);
    const glow = new THREE.Color(theme.glow || theme.primary);

    this.updateThemeMaterials(primary, accent);
    this.updateParticleThemeColors(primary, accent, glow);
  }

  private updateThemeMaterials(primary: THREE.Color, accent: THREE.Color): void {
    for (let r = 0; r < this.numRings; r++) {
      const color = new THREE.Color().lerpColors(primary, accent, r / this.numRings);
      if (this.ringMaterials[r]) {
        this.ringMaterials[r].color.copy(color);
      }
    }

    if (this.coreMaterial) {
      this.coreMaterial.emissive.copy(primary);
    }
    if (this.wireMaterial) {
      this.wireMaterial.color.copy(accent);
    }

    for (let i = 0; i < this.orbitalRingMaterials.length; i++) {
      this.orbitalRingMaterials[i].color.copy(i % 2 === 0 ? primary : accent);
    }
  }

  private updateParticleThemeColors(
    primary: THREE.Color,
    accent: THREE.Color,
    glow: THREE.Color
  ): void {
    if (!this.particleColors || !this.stardustPoints?.geometry.attributes.color) {
      return;
    }

    const whiteCol = new THREE.Color('#ffffff');

    for (let i = 0; i < this.numParticles; i++) {
      const normR = Math.min(1.0, (this.particleRadii[i] - 0.85) / 6.5);
      const c = new THREE.Color();
      if (normR < 0.22) {
        c.lerpColors(whiteCol, primary, normR / 0.22);
      } else if (normR < 0.65) {
        c.lerpColors(primary, accent, (normR - 0.22) / 0.43);
      } else {
        c.lerpColors(accent, glow, (normR - 0.65) / 0.35);
      }
      c.toArray(this.particleColors, i * 3);
    }
    this.stardustPoints.geometry.attributes.color.needsUpdate = true;
  }

  protected override onDispose(): void {
    if (this.ambientGroup) {
      this.ambientGroup.removeFromParent();
      this.ambientGroup.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line || child instanceof THREE.Points || child instanceof THREE.LineSegments) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      this.ambientGroup = null;
    }
    if (this.glowTexture) {
      this.glowTexture.dispose();
      this.glowTexture = null;
    }
  }
}
