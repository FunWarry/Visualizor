import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const FERRO_SPIKES = 14;
const FERRO_GOLDEN = 2.399963229728653;
const NUM_PARTICLES = 3000;

export class FerrofluidPreset extends BasePreset {
  public override readonly id = 'ferrofluid';
  public override readonly name = 'Ferrofluid';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Liquid magnetic sphere erupting spikes on bass kick transients.';
  public override cameraConfig = {
    position: [0, 6, 16] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.2
  };

  private mesh!: THREE.Mesh;
  private geometry!: THREE.SphereGeometry;
  private material!: THREE.MeshPhysicalMaterial;
  private basePositions!: Float32Array;
  private spikeDirections!: Float32Array;
  private numVertices = 0;

  private basePlane?: THREE.Mesh;
  private basePlaneMaterial?: THREE.ShaderMaterial;

  private ambientParticles?: THREE.Points;
  private particleMaterial?: THREE.ShaderMaterial;

  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private smoothAvg = 0;

  private readonly cachedAxes: THREE.Vector3[] = [];

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rotation Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Pulse Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'deformation', name: 'Spike Height', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Spike Density', min: 0.2, max: 1.0, step: 0.1, defaultValue: 0.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Children[0]: Main ferrofluid sphere (72x72 = 5329 vertices > 5000 required by test)
    this.geometry = new THREE.SphereGeometry(4.8, 72, 72);
    const pos = this.geometry.attributes.position.array as Float32Array;
    this.numVertices = pos.length / 3;
    this.basePositions = new Float32Array(pos);
    this.spikeDirections = new Float32Array(pos.length);

    for (let i = 0; i < this.numVertices; i++) {
      const vx = pos[i * 3];
      const vy = pos[i * 3 + 1];
      const vz = pos[i * 3 + 2];
      const len = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      this.spikeDirections[i * 3] = vx / len;
      this.spikeDirections[i * 3 + 1] = vy / len;
      this.spikeDirections[i * 3 + 2] = vz / len;
    }

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary).multiplyScalar(0.7),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.group.add(this.mesh);

    // Initialize Fibonacci spike directions
    this.cachedAxes.length = 0;
    for (let i = 0; i < FERRO_SPIKES; i++) {
      const y = 1.0 - ((i + 0.5) / FERRO_SPIKES) * 2.0;
      const r = Math.sqrt(Math.max(1.0 - y * y, 0.0));
      const phi = i * FERRO_GOLDEN;
      this.cachedAxes.push(new THREE.Vector3(Math.cos(phi) * r, y, Math.sin(phi) * r));
    }

    // 2. Children[1]: Ripple floor disc
    this.setupBasePlane(ctx);

    // 3. Children[2]: Ambient magnetic particles
    this.setupParticles(ctx);
  }

  private setupBasePlane(ctx: PresetContext): void {
    const planeGeom = new THREE.PlaneGeometry(40, 40, 1, 1);
    this.basePlaneMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAudio: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uAudio;
        varying vec2 vUv;
        void main() {
          vec2 centered = vUv - 0.5;
          float dist = length(centered);
          float ripple = sin(dist * 30.0 - uTime * 3.0) * 0.5 + 0.5;
          ripple *= exp(-dist * 4.0) * uAudio;
          vec3 color = mix(uColor1, uColor2, ripple) * ripple * 0.4;
          float alpha = (0.08 + ripple * 0.3) * (1.0 - smoothstep(0.3, 0.5, dist));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.basePlane = new THREE.Mesh(planeGeom, this.basePlaneMaterial);
    this.basePlane.rotation.x = -Math.PI / 2;
    this.basePlane.position.y = -7.0;
    this.group.add(this.basePlane);
  }

  private setupParticles(ctx: PresetContext): void {
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(NUM_PARTICLES * 3);
    const sizes = new Float32Array(NUM_PARTICLES);
    const randoms = new Float32Array(NUM_PARTICLES);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 12 + Math.random() * 25;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      sizes[i] = 1.2 + Math.random() * 2.5;
      randoms[i] = Math.random();
    }

    pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    pGeom.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uBass: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uBass;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          vRandom = aRandom;
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * 0.2;
          float fieldStrength = uBass * 2.0;
          pos.y += sin(angle * 3.0 + uTime) * fieldStrength;
          pos.x += cos(uTime * 0.3 + aRandom * 6.28) * 0.5;
          vAlpha = 0.1 + 0.15 * sin(uTime * 0.8 + aRandom * 6.28);
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (120.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = exp(-d * 12.0);
          float glow = exp(-d * 4.0) * 0.4;
          float alpha = (core + glow) * (1.0 - smoothstep(0.0, 0.5, d));
          if (alpha < 0.005) discard;
          vec3 color = mix(uColor1, uColor2, vRandom);
          color = mix(color, vec3(1.0), core * 0.3);
          gl_FragColor = vec4(color, alpha * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.ambientParticles = new THREE.Points(pGeom, this.particleMaterial);
    this.group.add(this.ambientParticles);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const deformation = this.paramStore.getValue('deformation');
    const density = this.paramStore.getValue('density');

    this.updateAudioSmoothing(audio, delta);

    this.mesh.rotation.y += delta * (0.2 + this.smoothMid * 0.4) * speed;
    this.mesh.rotation.x = Math.sin(time * 0.15) * 0.1;

    this.deformSphere(time, speed, reactivity, deformation, density);
    this.updateFloorAndParticles(time, audio);

    const baseEmissive = 0.35 * reactivity;
    const beatEmissive = audio.beat ? 0.65 * reactivity : (this.smoothBass * 0.35 * reactivity);
    this.material.emissiveIntensity = baseEmissive + beatEmissive;

    if (audio.beat) {
      this.material.emissive.set(ctx.theme.accent);
    } else {
      this.material.emissive.lerp(new THREE.Color(ctx.theme.primary), 0.08);
    }
  }

  private updateAudioSmoothing(audio: AudioFeatures, delta: number): void {
    const rate = Math.min(1, delta * 15);
    this.smoothBass += (audio.bass - this.smoothBass) * rate;
    this.smoothMid += (audio.mid - this.smoothMid) * rate;
    this.smoothTreble += (audio.treble - this.smoothTreble) * rate;
    this.smoothAvg += (audio.rms - this.smoothAvg) * rate;
  }

  private deformSphere(time: number, speed: number, reactivity: number, deformation: number, density: number): void {
    const pos = this.geometry.attributes.position.array as Float32Array;
    const spikeHeight = ((0.5 + density * 2.0) + this.smoothBass * 2.5) * deformation * reactivity * 0.45;
    const spikeSharpness = 4.0 + density * 12.0 + this.smoothTreble * 8.0;

    const yaw = time * 0.25 * speed;
    const pitch = Math.sin(time * 0.17 * speed) * 0.35;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);

    const rotatedAxes: { x: number; y: number; z: number; hMul: number }[] = [];
    for (let i = 0; i < FERRO_SPIKES; i++) {
      const a = this.cachedAxes[i];
      const px = cy * a.x + sy * a.z;
      const py = a.y;
      const pz = -sy * a.x + cy * a.z;

      const rx = px;
      const ry = cp * py - sp * pz;
      const rz = sp * py + cp * pz;
      const hMul = 0.75 + 0.25 * Math.sin(i * FERRO_GOLDEN + time * 0.9);
      rotatedAxes.push({ x: rx, y: ry, z: rz, hMul });
    }

    for (let i = 0; i < this.numVertices; i++) {
      const idx = i * 3;
      const bx = this.basePositions[idx];
      const by = this.basePositions[idx + 1];
      const bz = this.basePositions[idx + 2];

      const dx = this.spikeDirections[idx];
      const dy = this.spikeDirections[idx + 1];
      const dz = this.spikeDirections[idx + 2];

      let disp = 0;
      for (let s = 0; s < FERRO_SPIKES; s++) {
        const ax = rotatedAxes[s];
        const dot = dx * ax.x + dy * ax.y + dz * ax.z;
        if (dot > 0) {
          const smooth = Math.min(1.0, dot / 0.3);
          const sCurve = smooth * smooth * (3.0 - 2.0 * smooth);
          const spikeVal = Math.pow(dot, spikeSharpness) * sCurve * spikeHeight * ax.hMul;
          if (spikeVal > disp) disp = spikeVal;
        }
      }

      disp += Math.sin(dx * 4.0 + time * 2.0) * Math.cos(dy * 4.0 + time * 1.5) * Math.sin(dz * 4.0 + time * 1.8) * 0.15;

      pos[idx] = bx + dx * disp;
      pos[idx + 1] = by + dy * disp;
      pos[idx + 2] = bz + dz * disp;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  private updateFloorAndParticles(time: number, audio: AudioFeatures): void {
    if (this.basePlaneMaterial) {
      this.basePlaneMaterial.uniforms.uTime.value = time;
      this.basePlaneMaterial.uniforms.uAudio.value = audio.rms;
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uTime.value = time;
      this.particleMaterial.uniforms.uBass.value = audio.bass;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const stops = theme.gradientStops;
    const cFluid = stops?.[0] ?? theme.primary;
    const cPlane1 = stops?.[1] ?? theme.primary;
    const cPlane2 = stops?.[2] ?? theme.secondary;
    const cPart1 = stops?.[2] ?? theme.primary;
    const cPart2 = stops?.[3] ?? stops?.[1] ?? theme.secondary;

    this.material.color.set(cFluid).multiplyScalar(0.7);
    this.material.emissive.set(cFluid);
    if (this.basePlaneMaterial) {
      this.basePlaneMaterial.uniforms.uColor1.value.set(cPlane1);
      this.basePlaneMaterial.uniforms.uColor2.value.set(cPlane2);
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uColor1.value.set(cPart1);
      this.particleMaterial.uniforms.uColor2.value.set(cPart2);
    }
  }

  protected override onDispose(): void {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.basePlane) {
      this.basePlane.geometry.dispose();
      this.basePlaneMaterial?.dispose();
    }
    if (this.ambientParticles) {
      this.ambientParticles.geometry.dispose();
      this.particleMaterial?.dispose();
    }
  }
}
