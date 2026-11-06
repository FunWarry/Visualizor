import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

/**
 * Creates a soft radial Gaussian stardust particle texture
 */
function createStardustTexture(): THREE.DataTexture {
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
      const alpha = Math.round(Math.pow(norm, 2.2) * 255);

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
  public override readonly description = 'Endless glowing 3D wireframe ocean terrain undulating forward with vertical falling meteor stardust.';

  // Camera looking forward across the rolling wave horizon (identical to Visuval template)
  public override cameraConfig = {
    position: [0, 6.2, 18.0] as [number, number, number],
    target: [0, 1.8, -16.0] as [number, number, number],
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

  // Vertical falling meteor streaks (LineSegments - no billboard distortion)
  private meteorLines!: THREE.LineSegments;
  private meteorGeometry!: THREE.BufferGeometry;
  private meteorMaterial!: THREE.LineBasicMaterial;
  private meteorPositions!: Float32Array;
  private meteorSpeeds!: Float32Array;
  private meteorLengths!: Float32Array;

  // Soft glowing stardust motes (Points with soft radial texture)
  private stardustPoints!: THREE.Points;
  private stardustGeometry!: THREE.BufferGeometry;
  private stardustMaterial!: THREE.PointsMaterial;
  private stardustPositions!: Float32Array;
  private stardustTexture: THREE.DataTexture | null = null;

  private prevFog: THREE.Fog | THREE.FogExp2 | null = null;
  private readonly numMeteors = 350;
  private readonly numStardust = 350;
  private readonly meshWidth = 76;
  private readonly meshDepth = 96;
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
    this.setupStardust(ctx);
    this.setupLighting(ctx);
    this.setupFog(ctx);
  }

  private setupFog(ctx: PresetContext): void {
    this.prevFog = ctx.scene.fog;
    ctx.scene.fog = new THREE.Fog(ctx.theme.background, 25, 75);
  }

  private setupLighting(ctx: PresetContext): void {
    this.dirLight = new THREE.DirectionalLight(ctx.theme.primary, 2.5);
    this.dirLight.position.set(0, 20, 12);
    this.group.add(this.dirLight);

    this.pointLight = new THREE.PointLight(ctx.theme.accent, 3.5, 55);
    this.pointLight.position.set(0, 8, -6);
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
      metalness: 0.35
    });
    this.wireMesh = new THREE.Mesh(this.geometry, this.wireMaterial);
    this.wireMesh.rotation.x = -Math.PI / 2;
    this.wireMesh.position.set(0, -1.5, -20);
    this.group.add(this.wireMesh);

    // 2. Translucent glowing depth underlayer
    this.surfaceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.42,
      roughness: 0.25,
      metalness: 0.15,
      transparent: true,
      opacity: 0.70,
      side: THREE.DoubleSide
    });
    this.surfaceMesh = new THREE.Mesh(this.geometry, this.surfaceMaterial);
    this.surfaceMesh.rotation.x = -Math.PI / 2;
    this.surfaceMesh.position.set(0, -1.52, -20);
    this.group.add(this.surfaceMesh);
  }

  private setupMeteorRain(ctx: PresetContext): void {
    this.meteorGeometry = new THREE.BufferGeometry();
    // Each meteor line has 2 vertices: head and tail
    this.meteorPositions = new Float32Array(this.numMeteors * 2 * 3);
    this.meteorSpeeds = new Float32Array(this.numMeteors);
    this.meteorLengths = new Float32Array(this.numMeteors);
    const colors = new Float32Array(this.numMeteors * 2 * 3);

    const primaryCol = new THREE.Color(ctx.theme.primary);
    const accentCol = new THREE.Color(ctx.theme.accent);

    for (let i = 0; i < this.numMeteors; i++) {
      const x = (Math.random() * 2 - 1) * 36;
      const y = Math.random() * 20 + 2.0;
      const z = (Math.random() * 2 - 1) * 40 - 18;
      const len = 0.8 + Math.random() * 1.6;

      this.meteorSpeeds[i] = 5.0 + Math.random() * 8.0;
      this.meteorLengths[i] = len;

      const idxHead = i * 6;
      const idxTail = i * 6 + 3;

      // Head
      this.meteorPositions[idxHead] = x;
      this.meteorPositions[idxHead + 1] = y;
      this.meteorPositions[idxHead + 2] = z;

      // Tail (pointing straight up behind falling head)
      this.meteorPositions[idxTail] = x;
      this.meteorPositions[idxTail + 1] = y + len;
      this.meteorPositions[idxTail + 2] = z;

      const headCol = new THREE.Color().lerpColors(primaryCol, accentCol, Math.random());
      const tailCol = headCol.clone().multiplyScalar(0.2);

      headCol.toArray(colors, idxHead);
      tailCol.toArray(colors, idxTail);
    }

    this.meteorGeometry.setAttribute('position', new THREE.BufferAttribute(this.meteorPositions, 3));
    this.meteorGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.meteorMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });

    this.meteorLines = new THREE.LineSegments(this.meteorGeometry, this.meteorMaterial);
    this.group.add(this.meteorLines);
  }

  private setupStardust(ctx: PresetContext): void {
    this.stardustGeometry = new THREE.BufferGeometry();
    this.stardustPositions = new Float32Array(this.numStardust * 3);
    const colors = new Float32Array(this.numStardust * 3);

    const primaryCol = new THREE.Color(ctx.theme.primary);
    const accentCol = new THREE.Color(ctx.theme.accent);

    for (let i = 0; i < this.numStardust; i++) {
      this.stardustPositions[i * 3] = (Math.random() * 2 - 1) * 36;
      this.stardustPositions[i * 3 + 1] = Math.random() * 18 + 1.0;
      this.stardustPositions[i * 3 + 2] = (Math.random() * 2 - 1) * 42 - 18;

      const c = new THREE.Color().lerpColors(primaryCol, accentCol, Math.random());
      c.toArray(colors, i * 3);
    }

    this.stardustGeometry.setAttribute('position', new THREE.BufferAttribute(this.stardustPositions, 3));
    this.stardustGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.stardustTexture ??= createStardustTexture();

    this.stardustMaterial = new THREE.PointsMaterial({
      size: 0.35,
      map: this.stardustTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.stardustPoints = new THREE.Points(this.stardustGeometry, this.stardustMaterial);
    this.group.add(this.stardustPoints);
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
    this.updateStardust(audio, delta, speed);
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
    const timeSpeed = time * 2.5 * speed;

    for (let i = 0; i < pos.length; i += 3 * stepStride) {
      const x = pos[i];
      const zLocal = pos[i + 1]; // PlaneGeometry local Y maps to world Z

      // Large, rolling deep ocean swells (matching Visuval reference)
      const swellZ = Math.sin(zLocal * 0.14 - timeSpeed) * (4.2 + audio.bass * 6.0 * reactivity);
      const crossX = Math.cos(x * 0.18 + zLocal * 0.06 + time * 1.5 * speed) * (2.2 + audio.mid * 3.5 * reactivity);

      // Audio waveform ripple mapped across lateral coordinate
      const waveNorm = (x + 38) / 76;
      const waveIdx = Math.floor(Math.max(0, Math.min(1, waveNorm)) * audio.timeDomainData.length) % audio.timeDomainData.length;
      const waveVal = ((audio.timeDomainData[waveIdx] || 128) - 128) / 128.0;
      const audioPulse = waveVal * (2.4 + audio.subBass * 4.5 * reactivity);

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
      this.surfaceMaterial.emissiveIntensity = 0.52 * reactivity;
      if (this.pointLight) this.pointLight.intensity = 4.5 * reactivity;
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
    const dropSpeedMultiplier = 1.0 + audio.bass * 2.0;

    for (let i = 0; i < this.numMeteors; i++) {
      const spd = this.meteorSpeeds[i] * dropSpeedMultiplier * speed;
      const idxHead = i * 6;
      const idxTail = i * 6 + 3;
      const len = this.meteorLengths[i];

      pos[idxHead + 1] -= spd * safeDelta;
      pos[idxTail + 1] = pos[idxHead + 1] + len;

      // When hitting low altitude, reset to high sky
      if (pos[idxHead + 1] < 0.2) {
        const resetY = 18.0 + Math.random() * 5.0;
        pos[idxHead + 1] = resetY;
        pos[idxTail + 1] = resetY + len;
        const newX = (Math.random() * 2 - 1) * 36;
        const newZ = (Math.random() * 2 - 1) * 40 - 18;
        pos[idxHead] = newX;
        pos[idxTail] = newX;
        pos[idxHead + 2] = newZ;
        pos[idxTail + 2] = newZ;
      }
    }
    this.meteorGeometry.attributes.position.needsUpdate = true;
  }

  private updateStardust(audio: AudioFeatures, delta: number, speed: number): void {
    if (!this.stardustGeometry?.attributes?.position) return;
    const pos = this.stardustPositions;
    const safeDelta = Math.min(delta, 0.1);
    const dropSpeed = (3.0 + audio.mid * 4.0) * speed;

    for (let i = 0; i < this.numStardust; i++) {
      pos[i * 3 + 1] -= dropSpeed * safeDelta;
      if (pos[i * 3 + 1] < 0.5) {
        pos[i * 3 + 1] = 18.0 + Math.random() * 4.0;
        pos[i * 3] = (Math.random() * 2 - 1) * 36;
        pos[i * 3 + 2] = (Math.random() * 2 - 1) * 42 - 18;
      }
    }
    this.stardustGeometry.attributes.position.needsUpdate = true;
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
    if (this.stardustGeometry) this.stardustGeometry.dispose();
    if (this.stardustMaterial) this.stardustMaterial.dispose();
    if (this.stardustTexture) {
      this.stardustTexture.dispose();
      this.stardustTexture = null;
    }
  }
}
