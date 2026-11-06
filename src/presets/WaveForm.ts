import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

function createSoftParticleTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const center = (size - 1) / 2;
  const maxR = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
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

export class WaveFormPreset extends BasePreset {
  public override readonly id = 'wave';
  public override readonly name = 'Wave Form';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Continuous 3D wireframe terrain oscillating with time-domain waveforms and stardust particles.';

  public override cameraConfig = {
    position: [0, 14, 34] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25,
    bloomIntensity: 0.5
  };

  private mesh!: THREE.Mesh;
  private geometry!: THREE.PlaneGeometry;
  private material!: THREE.MeshStandardMaterial;

  private surfaceMesh!: THREE.Mesh;
  private surfaceMaterial!: THREE.MeshStandardMaterial;

  private particlePoints!: THREE.Points;
  private particleGeometry!: THREE.BufferGeometry;
  private particleMaterial!: THREE.PointsMaterial;
  private particleBasePositions!: Float32Array;
  private particlePhases!: Float32Array;

  private particleTexture: THREE.DataTexture | null = null;

  private readonly cols = 64;
  private readonly rows = 64;
  private readonly numParticles = 1500;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Wave Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'deformation', name: 'Wave Height', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Mesh Density', min: 32, max: 256, step: 16, defaultValue: 128 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const size = 60;
    this.geometry = new THREE.PlaneGeometry(size, size, this.cols - 1, this.rows - 1);

    this.material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.45,
      wireframe: true,
      roughness: 0.25,
      metalness: 0.3
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2.3;
    this.mesh.position.set(0, -2, 0);
    this.group.add(this.mesh);

    // Glowing translucent depth underlayer
    this.surfaceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.05),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.2,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.surfaceMesh = new THREE.Mesh(this.geometry, this.surfaceMaterial);
    this.surfaceMesh.rotation.x = -Math.PI / 2.3;
    this.surfaceMesh.position.set(0, -2.05, 0);
    this.group.add(this.surfaceMesh);

    // Floating stardust particles
    this.setupParticles(ctx);
  }

  private setupParticles(ctx: PresetContext): void {
    this.particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.numParticles * 3);
    this.particleBasePositions = new Float32Array(this.numParticles * 3);
    this.particlePhases = new Float32Array(this.numParticles);
    const colors = new Float32Array(this.numParticles * 3);

    const primaryCol = new THREE.Color(ctx.theme.primary);
    const accentCol = new THREE.Color(ctx.theme.accent);

    const range = 28;
    for (let i = 0; i < this.numParticles; i++) {
      const px = (Math.random() * 2 - 1) * range;
      const py = Math.random() * 8 + 1;
      const pz = (Math.random() * 2 - 1) * range;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      this.particleBasePositions[i * 3] = px;
      this.particleBasePositions[i * 3 + 1] = py;
      this.particleBasePositions[i * 3 + 2] = pz;

      this.particlePhases[i] = Math.random() * Math.PI * 2;

      const c = new THREE.Color().lerpColors(primaryCol, accentCol, Math.random());
      c.toArray(colors, i * 3);
    }

    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    if (!this.particleTexture) {
      this.particleTexture = createSoftParticleTexture();
    }

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.45,
      map: this.particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particlePoints.rotation.x = -Math.PI / 2.3;
    this.particlePoints.position.set(0, -2, 0);
    this.group.add(this.particlePoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const deformation = this.paramStore.getValue('deformation');
    const density = this.paramStore.getValue('density');

    if (audio.rms === 0 && audio.bass === 0 && audio.subBass === 0) {
      this.clearDisplacement(pos);
    } else {
      this.applyAudioDisplacement(pos, audio, time, speed, reactivity, deformation, density);
    }

    this.geometry.attributes.position.needsUpdate = true;
    (this.geometry.attributes.position as THREE.BufferAttribute).version++;

    this.updateEmissiveDynamics(audio, reactivity);
    this.updateStardust(audio, time, speed, reactivity);
  }

  private clearDisplacement(pos: Float32Array): void {
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 2] = 0;
    }
  }

  private applyAudioDisplacement(
    pos: Float32Array,
    audio: AudioFeatures,
    time: number,
    speed: number,
    reactivity: number,
    deformation: number,
    density: number
  ): void {
    const stepStride = density >= 128 ? 1 : 2;

    for (let i = 0; i < pos.length; i += 3 * stepStride) {
      const x = pos[i];
      const y = pos[i + 1];

      const waveIndex = Math.floor(Math.abs(x / 30.0) * audio.timeDomainData.length) % audio.timeDomainData.length;
      const wave = ((audio.timeDomainData[waveIndex] || 128) - 128) / 128.0;

      const freqIndex = Math.floor(Math.abs(y / 30.0) * (audio.frequencyData.length * 0.5)) % audio.frequencyData.length;
      const freq = (audio.frequencyData[freqIndex] || 0) / 255.0;

      const baseWave = Math.sin(x * 0.2 + time * 2.5 * speed) * Math.cos(y * 0.2 + time * 1.5 * speed) * 1.5;
      const ripple = Math.sin(Math.hypot(x, y) * 0.3 - time * 3.0 * speed) * 0.8;

      const elevation = (baseWave + ripple * 0.5 + wave * (2.0 + audio.bass * 3.5 * reactivity) + freq * 2.5 * reactivity) * deformation;
      pos[i + 2] = elevation;

      if (stepStride > 1 && i + 5 < pos.length) {
        pos[i + 5] = elevation;
      }
    }
  }

  private updateEmissiveDynamics(audio: AudioFeatures, reactivity: number): void {
    if (audio.beat) {
      this.material.emissiveIntensity = 0.85 * reactivity;
      if (this.surfaceMaterial) this.surfaceMaterial.emissiveIntensity = 0.45 * reactivity;
    } else {
      this.material.emissiveIntensity *= 0.92;
      if (this.surfaceMaterial) this.surfaceMaterial.emissiveIntensity *= 0.94;
    }
  }

  private updateStardust(audio: AudioFeatures, time: number, speed: number, reactivity: number): void {
    if (!this.particlePoints?.geometry?.attributes?.position) return;
    const pPos = this.particlePoints.geometry.attributes.position.array as Float32Array;
    const bPos = this.particleBasePositions;
    for (let i = 0; i < this.numParticles; i++) {
      const phase = this.particlePhases[i];
      pPos[i * 3 + 2] = bPos[i * 3 + 2] + Math.sin(time * 2.0 * speed + phase) * (0.8 + audio.bass * 1.5 * reactivity);
    }
    this.particlePoints.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.color.set(theme.primary);
    this.material.emissive.set(theme.secondary);
    if (this.surfaceMaterial) {
      this.surfaceMaterial.color.set(theme.background).offsetHSL(0, 0, 0.05);
      this.surfaceMaterial.emissive.set(theme.primary);
    }
  }

  protected override onDispose(): void {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.surfaceMaterial) this.surfaceMaterial.dispose();
    if (this.particleGeometry) this.particleGeometry.dispose();
    if (this.particleMaterial) this.particleMaterial.dispose();
    if (this.particleTexture) {
      this.particleTexture.dispose();
      this.particleTexture = null;
    }
  }
}
