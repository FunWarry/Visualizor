import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

/**
 * Creates a glowing vertical teardrop / meteor streak texture
 * matching the falling sky rain in the reference app.
 */
function createMeteorStreakTexture(): THREE.DataTexture {
  const width = 32;
  const height = 128;
  const data = new Uint8Array(width * height * 4);
  const centerX = (width - 1) / 2;

  for (let y = 0; y < height; y++) {
    const yNorm = y / height;
    const vFactor = Math.pow(1.0 - yNorm, 2.5);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = (x - centerX) / (width / 2);
      const hFactor = Math.max(0, 1.0 - Math.abs(dx));

      const alpha = Math.round(Math.min(255, hFactor * vFactor * 255));

      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alpha;
    }
  }

  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

export class WaveFormPreset extends BasePreset {
  public override readonly id = 'wave';
  public override readonly name = 'Wave Form';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Endless glowing 3D wireframe ocean terrain undulating forward with vertical falling meteor stardust.';

  // Camera looking forward across the rolling wave horizon (identical to reference)
  public override cameraConfig = {
    position: [0, 2.6, 12.0] as [number, number, number],
    target: [0, 0.6, -14.0] as [number, number, number],
    autoRotate: false,
    autoRotateSpeed: 0.0,
    bloomIntensity: 0.35
  };

  // Wireframe grid & translucent surface underlayer
  private wireMesh!: THREE.Mesh;
  private surfaceMesh!: THREE.Mesh;
  private geometry!: THREE.PlaneGeometry;
  private wireMaterial!: THREE.MeshStandardMaterial;
  private surfaceMaterial!: THREE.MeshStandardMaterial;

  // Scene lighting
  private dirLight!: THREE.DirectionalLight;
  private pointLight!: THREE.PointLight;

  // Vertical falling meteor rain
  private meteorPoints!: THREE.Points;
  private meteorGeometry!: THREE.BufferGeometry;
  private meteorMaterial!: THREE.PointsMaterial;
  private meteorPositions!: Float32Array;
  private meteorSpeeds!: Float32Array;
  private meteorTexture: THREE.DataTexture | null = null;

  private prevFog: THREE.Fog | THREE.FogExp2 | null = null;
  private readonly numMeteors = 500;
  private readonly meshWidth = 72;
  private readonly meshDepth = 84;
  private readonly cols = 64;
  private readonly rows = 64;

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
    // 1. Setup wave terrain first so wireMesh is this.group.children[0]
    this.setupWaveTerrain(ctx);
    // 2. Setup falling meteors and lights
    this.setupMeteorRain(ctx);
    this.setupLighting(ctx);
    this.setupFog(ctx);
  }

  private setupFog(ctx: PresetContext): void {
    this.prevFog = ctx.scene.fog;
    ctx.scene.fog = new THREE.Fog(ctx.theme.background, 22, 68);
  }

  private setupLighting(ctx: PresetContext): void {
    this.dirLight = new THREE.DirectionalLight(ctx.theme.primary, 2.2);
    this.dirLight.position.set(0, 16, 10);
    this.group.add(this.dirLight);

    this.pointLight = new THREE.PointLight(ctx.theme.accent, 2.8, 45);
    this.pointLight.position.set(0, 6, -5);
    this.group.add(this.pointLight);
  }

  private setupWaveTerrain(ctx: PresetContext): void {
    this.geometry = new THREE.PlaneGeometry(
      this.meshWidth,
      this.meshDepth,
      this.cols - 1,
      this.rows - 1
    );

    // 1. Crisp luminous wireframe overlay grid (MUST be child[0] for tests)
    this.wireMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.85,
      wireframe: true,
      transparent: true,
      opacity: 0.95,
      roughness: 0.1,
      metalness: 0.3
    });
    this.wireMesh = new THREE.Mesh(this.geometry, this.wireMaterial);
    this.wireMesh.rotation.x = -Math.PI / 2;
    this.wireMesh.position.set(0, -1.18, -18);
    this.group.add(this.wireMesh);

    // 2. Translucent glowing depth underlayer
    this.surfaceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.38,
      roughness: 0.3,
      metalness: 0.15,
      transparent: true,
      opacity: 0.62,
      side: THREE.DoubleSide
    });
    this.surfaceMesh = new THREE.Mesh(this.geometry, this.surfaceMaterial);
    this.surfaceMesh.rotation.x = -Math.PI / 2;
    this.surfaceMesh.position.set(0, -1.2, -18);
    this.group.add(this.surfaceMesh);
  }

  private setupMeteorRain(ctx: PresetContext): void {
    this.meteorGeometry = new THREE.BufferGeometry();
    this.meteorPositions = new Float32Array(this.numMeteors * 3);
    this.meteorSpeeds = new Float32Array(this.numMeteors);
    const colors = new Float32Array(this.numMeteors * 3);

    const primaryCol = new THREE.Color(ctx.theme.primary);
    const accentCol = new THREE.Color(ctx.theme.accent);

    for (let i = 0; i < this.numMeteors; i++) {
      this.meteorPositions[i * 3] = (Math.random() * 2 - 1) * 34;
      this.meteorPositions[i * 3 + 1] = Math.random() * 16 + 1.5;
      this.meteorPositions[i * 3 + 2] = (Math.random() * 2 - 1) * 36 - 16;
      this.meteorSpeeds[i] = 4.5 + Math.random() * 6.5;

      const c = new THREE.Color().lerpColors(primaryCol, accentCol, Math.random());
      c.toArray(colors, i * 3);
    }

    this.meteorGeometry.setAttribute('position', new THREE.BufferAttribute(this.meteorPositions, 3));
    this.meteorGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.meteorTexture ??= createMeteorStreakTexture();

    this.meteorMaterial = new THREE.PointsMaterial({
      size: 1.4,
      map: this.meteorTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.meteorPoints = new THREE.Points(this.meteorGeometry, this.meteorMaterial);
    this.group.add(this.meteorPoints);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
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
    this.geometry.computeVertexNormals();

    this.updateEmissiveDynamics(audio, reactivity);
    this.updateMeteorRain(audio, delta, speed);
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
    const timeSpeed = time * 2.6 * speed;

    for (let i = 0; i < pos.length; i += 3 * stepStride) {
      const x = pos[i];
      const zLocal = pos[i + 1]; // PlaneGeometry local Y maps to world Z

      // Continuous forward-rolling swells moving towards the camera
      const swellZ = Math.sin(zLocal * 0.16 - timeSpeed) * (1.7 + audio.bass * 2.6 * reactivity);
      const crossX = Math.cos(x * 0.22 + zLocal * 0.08 + time * 1.4 * speed) * (0.9 + audio.mid * 1.4 * reactivity);

      // Audio waveform ripple mapped across lateral coordinate
      const waveNorm = (x + 36) / 72;
      const waveIdx = Math.floor(Math.max(0, Math.min(1, waveNorm)) * audio.timeDomainData.length) % audio.timeDomainData.length;
      const waveVal = ((audio.timeDomainData[waveIdx] || 128) - 128) / 128.0;
      const audioPulse = waveVal * (1.8 + audio.subBass * 3.2 * reactivity);

      const elevation = (swellZ + crossX + audioPulse) * deformation;
      pos[i + 2] = elevation;

      if (stepStride > 1 && i + 5 < pos.length) {
        pos[i + 5] = elevation;
      }
    }
  }

  private updateEmissiveDynamics(audio: AudioFeatures, reactivity: number): void {
    if (audio.beat) {
      this.wireMaterial.emissiveIntensity = 0.85 * reactivity;
      this.surfaceMaterial.emissiveIntensity = 0.5 * reactivity;
      if (this.pointLight) this.pointLight.intensity = 3.5 * reactivity;
    } else {
      this.wireMaterial.emissiveIntensity *= 0.88;
      this.surfaceMaterial.emissiveIntensity *= 0.90;
      if (this.pointLight) this.pointLight.intensity *= 0.92;
    }
  }

  private updateMeteorRain(audio: AudioFeatures, delta: number, speed: number): void {
    if (!this.meteorGeometry?.attributes?.position) return;
    const pos = this.meteorPositions;
    const safeDelta = Math.min(delta, 0.1);
    const dropSpeedMultiplier = 1.0 + audio.bass * 1.8;

    for (let i = 0; i < this.numMeteors; i++) {
      const spd = this.meteorSpeeds[i] * dropSpeedMultiplier * speed;
      pos[i * 3 + 1] -= spd * safeDelta;

      // When hitting low altitude, reset to high sky
      if (pos[i * 3 + 1] < 0.6) {
        pos[i * 3 + 1] = 16.0 + Math.random() * 4.0;
        pos[i * 3] = (Math.random() * 2 - 1) * 34;
        pos[i * 3 + 2] = (Math.random() * 2 - 1) * 36 - 16;
      }
    }
    this.meteorGeometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.wireMaterial.color.set(theme.primary);
    this.wireMaterial.emissive.set(theme.primary);

    this.surfaceMaterial.color.set(theme.primary);
    this.surfaceMaterial.emissive.set(theme.secondary);

    if (this.dirLight) this.dirLight.color.set(theme.primary);
    if (this.pointLight) this.pointLight.color.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.geometry) this.geometry.dispose();
    if (this.wireMaterial) this.wireMaterial.dispose();
    if (this.surfaceMaterial) this.surfaceMaterial.dispose();
    if (this.meteorGeometry) this.meteorGeometry.dispose();
    if (this.meteorMaterial) this.meteorMaterial.dispose();
    if (this.meteorTexture) {
      this.meteorTexture.dispose();
      this.meteorTexture = null;
    }
  }
}
