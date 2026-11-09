import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

interface ShardData {
  orbitRadius: number;
  orbitSpeed: number;
  orbitHeight: number;
  orbitPhase: number;
  orbitTilt: number;
  size: number;
  tumbleSpeed: number;
  tumbleAxis: THREE.Vector3;
  bobSpeed: number;
  bobAmp: number;
  currentAngle: number;
  currentTumble: number;
}

const NUM_SHARDS = 24;
const NUM_PARTICLES = 1500;

export class ObsidianPolyPreset extends BasePreset {
  public override readonly id = 'obsidian';
  public override readonly name = 'Obsidian';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Dark glossy multifaceted polyhedron deforming dynamically.';
  public override cameraConfig = {
    position: [0, 4, 14] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.15
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.MeshPhysicalMaterial;
  private basePositions!: Float32Array;
  private baseNormals!: Float32Array;

  private shardMesh?: THREE.InstancedMesh;
  private shardMaterial?: THREE.MeshPhysicalMaterial;
  private shardData: ShardData[] = [];
  private readonly dummy = new THREE.Object3D();
  private readonly quat = new THREE.Quaternion();

  private particles?: THREE.Points;
  private particleMaterial?: THREE.ShaderMaterial;

  private nebula?: THREE.Mesh;
  private nebulaMaterial?: THREE.ShaderMaterial;

  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private energy = 0;
  private bassHit = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Tumble Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Audio Reactivity', min: 0.1, max: 2.0, step: 0.05, defaultValue: 1.0 },
      { id: 'deformation', name: 'Vertex Morph', min: 0.0, max: 2.0, step: 0.05, defaultValue: 0.5 },
      { id: 'density', name: 'Wireframe Opacity', min: 0.1, max: 1.0, step: 0.05, defaultValue: 0.75 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Children[0]: Main faceted obsidian polyhedron
    const geometry = new THREE.IcosahedronGeometry(4.8, 3);
    const pos = geometry.attributes.position.array as Float32Array;
    const norm = geometry.attributes.normal.array as Float32Array;
    this.basePositions = new Float32Array(pos);
    this.baseNormals = new Float32Array(norm);

    this.material = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.primary).lerp(new THREE.Color('#1c1c28'), 0.4),
      emissive: new THREE.Color(ctx.theme.primary),
      emissiveIntensity: 0.35,
      roughness: 0.12,
      metalness: 0.35,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      flatShading: true
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.mesh);

    // 2. Children[1]: Orbiting crystal shards
    this.setupShards(ctx);

    // 3. Children[2]: Stardust particles
    this.setupParticles(ctx);

    // 4. Children[3]: Aurora nebula background dome
    this.setupNebula(ctx);
  }

  private setupShards(ctx: PresetContext): void {
    const shardGeom = new THREE.IcosahedronGeometry(1.0, 0);
    this.shardMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(ctx.theme.secondary),
      emissive: new THREE.Color(ctx.theme.secondary),
      emissiveIntensity: 0.5,
      roughness: 0.15,
      metalness: 0.3,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      flatShading: true,
      transparent: true,
      opacity: 0.9
    });

    this.shardMesh = new THREE.InstancedMesh(shardGeom, this.shardMaterial, NUM_SHARDS);
    this.shardData = [];

    for (let i = 0; i < NUM_SHARDS; i++) {
      const radius = 7.5 + Math.random() * 5.0;
      const speed = 0.08 + Math.random() * 0.14;
      const height = (Math.random() - 0.4) * 6.0;
      const phase = Math.random() * Math.PI * 2;
      const tilt = (Math.random() - 0.5) * 0.6;
      const size = 0.25 + Math.random() * 0.45;
      const tumbleSpeed = 0.4 + Math.random() * 1.2;
      const tumbleAxis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      const bobSpeed = 0.2 + Math.random() * 0.6;
      const bobAmp = 0.3 + Math.random() * 1.0;

      this.shardData.push({
        orbitRadius: radius,
        orbitSpeed: speed,
        orbitHeight: height,
        orbitPhase: phase,
        orbitTilt: tilt,
        size,
        tumbleSpeed,
        tumbleAxis,
        bobSpeed,
        bobAmp,
        currentAngle: phase,
        currentTumble: Math.random() * Math.PI * 2
      });

      this.dummy.position.set(Math.cos(phase) * radius, height, Math.sin(phase) * radius);
      this.dummy.scale.setScalar(size);
      this.dummy.updateMatrix();
      this.shardMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.shardMesh.instanceMatrix.needsUpdate = true;
    this.group.add(this.shardMesh);
  }

  private setupParticles(ctx: PresetContext): void {
    const pGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(NUM_PARTICLES * 3);
    const sizes = new Float32Array(NUM_PARTICLES);
    const randoms = new Float32Array(NUM_PARTICLES);

    for (let i = 0; i < NUM_PARTICLES; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rad = 4.0 + Math.random() * 12.0;
      positions[i * 3] = Math.cos(angle) * rad;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10.0;
      positions[i * 3 + 2] = Math.sin(angle) * rad;
      sizes[i] = 0.3 + Math.random() * 1.5;
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
        uBass: { value: 0 },
        uAudio: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uBass;
        uniform float uAudio;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          vRandom = aRandom;
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * (0.06 + aRandom * 0.12);
          float r = length(pos.xz) + sin(uTime * 0.8 + aRandom * 6.28) * (0.2 + uBass * 0.5);
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * (0.3 + aRandom * 0.4) + aRandom * 6.28) * 0.6;
          vAlpha = (0.15 + 0.2 * sin(uTime * 1.5 + aRandom * 6.28)) * (0.3 + uAudio * 0.7);
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (80.0 / -mvPos.z);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying float vAlpha;
        varying float vRandom;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float core = exp(-d * 12.0);
          float glow = exp(-d * 4.0) * 0.3;
          float brightness = core + glow;
          float alpha = brightness * (1.0 - smoothstep(0.0, 0.5, d));
          if (alpha < 0.005) discard;
          vec3 color = mix(uColor1, uColor2, vRandom) * 0.6;
          color = mix(color, vec3(1.0), core * 0.3);
          float flicker = 0.85 + 0.15 * sin(uTime * 8.0 + vRandom * 30.0);
          gl_FragColor = vec4(color * flicker, alpha * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(pGeom, this.particleMaterial);
    this.group.add(this.particles);
  }

  private setupNebula(ctx: PresetContext): void {
    const geom = new THREE.SphereGeometry(60, 32, 32);
    this.nebulaMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAudio: { value: 0 },
        uBass: { value: 0 }
      },
      vertexShader: `
        varying vec3 vWorldDir;
        void main() {
          vWorldDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uAudio;
        uniform float uBass;
        varying vec3 vWorldDir;

        float hash3(vec3 p) {
          p = fract(p * vec3(443.897, 441.423, 437.195));
          p += dot(p, p.yzx + 19.19);
          return fract((p.x + p.y) * p.z);
        }
        float noise3(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          vec3 u = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), u.x),
                mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
            mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), u.x),
                mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
            u.z
          );
        }
        float fbm3(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise3(p);
            p = p * 2.0 + vec3(1.3, 2.7, 1.9);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec3 dir = normalize(vWorldDir);
          float t = uTime * 0.06;
          vec3 p1 = dir * 3.0 + vec3(t, t * 0.7, t * 0.3);
          vec3 p2 = dir * 2.0 - vec3(t * 0.5, t * 1.2, t * 0.4);
          float n1 = fbm3(p1);
          float n2 = fbm3(p2);
          float aurora = smoothstep(0.3, 0.7, n1) * smoothstep(0.2, 0.6, n2);
          vec3 col = mix(uColor1 * (0.6 + uBass * 0.4), uColor2 * (0.6 + uAudio * 0.4), n1) * aurora;
          float streaks = pow(abs(sin(dir.y * 20.0 + n1 * 5.0 + uTime * 0.2)), 8.0);
          col += mix(uColor1, uColor2, 0.5) * streaks * 0.15;
          float alpha = (0.2 + uAudio * 0.3) * aurora;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });

    this.nebula = new THREE.Mesh(geom, this.nebulaMaterial);
    this.nebula.renderOrder = -1;
    this.group.add(this.nebula);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const deformation = this.paramStore.getValue('deformation');

    this.updateAudioSmoothing(audio, delta);
    this.updateMeshDeformation(time, speed, reactivity, deformation);
    this.updateShards(time, delta, speed);
    this.updateParticles(audio, time);
    this.updateNebula(audio, time);

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
    this.smoothBass += (audio.bass - this.smoothBass) * Math.min(1, delta * 12);
    this.smoothMid += (audio.mid - this.smoothMid) * Math.min(1, delta * 10);
    this.smoothTreble += (audio.treble - this.smoothTreble) * Math.min(1, delta * 14);

    const targetEnergy = Math.min((audio.bass * 0.5 + audio.mid * 0.3 + audio.treble * 0.2) * 2.5, 1.0);
    this.energy += (targetEnergy - this.energy) * (targetEnergy > this.energy ? 0.25 : 0.03);
    this.bassHit = audio.beat ? 1.0 : this.bassHit * 0.88;
  }

  private updateMeshDeformation(time: number, speed: number, reactivity: number, deformation: number): void {
    const rotSpeed = (0.15 + this.energy * 0.6 + this.bassHit * 1.2) * speed;
    this.mesh.rotation.y += rotSpeed * 0.016;
    this.mesh.rotation.x = Math.sin(time * 0.2) * 0.15 + Math.sin(time * 0.8) * this.smoothBass * 0.35 + this.bassHit * 0.15;
    this.mesh.rotation.z = Math.sin(time * 0.15 + 1.0) * 0.1 + Math.cos(time * 0.7) * this.smoothMid * 0.2;

    const scale = 1.0 + Math.sin(time * 0.6) * 0.05 + this.smoothBass * 0.08 + this.bassHit * 0.38;
    this.mesh.scale.setScalar(scale);

    const pos = (this.mesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const len = pos.length;

    for (let i = 0; i < len; i += 3) {
      const bx = this.basePositions[i];
      const by = this.basePositions[i + 1];
      const bz = this.basePositions[i + 2];

      const nx = this.baseNormals[i];
      const ny = this.baseNormals[i + 1];
      const nz = this.baseNormals[i + 2];

      const bassWave1 = Math.sin(nx * 3.0 + time * 1.5 * speed) *
                        Math.cos(ny * 2.5 + time * 1.1 * speed) *
                        Math.sin(nz * 4.0 + time * 1.8 * speed);
      const bassWave2 = Math.sin(ny * 5.0 - time * 0.8 * speed) * Math.cos(nz * 3.5 + time * 1.3 * speed);
      const bassWave3 = Math.sin((nx + nz) * 2.0 + time * 2.0 * speed) * Math.cos(ny * 4.0 - time * 1.6 * speed);
      let disp = (bassWave1 + bassWave2 * 0.7 + bassWave3 * 0.5) * this.smoothBass * 2.5;

      const midRipple = Math.sin(nx * 8.0 + nz * 6.0 - time * 3.0 * speed) * Math.sin(ny * 5.0 + time * 2.5 * speed);
      disp += midRipple * this.smoothMid * 1.2;

      const trebleJitter = Math.sin(nx * 16.0 + time * 6.0) * Math.cos(nz * 14.0 - time * 5.0);
      disp += trebleJitter * 0.4 * this.smoothTreble * 2.0;

      disp += this.bassHit * 1.5;
      disp *= deformation * reactivity * 0.4;

      pos[i] = bx + nx * disp;
      pos[i + 1] = by + ny * disp;
      pos[i + 2] = bz + nz * disp;
    }

    this.mesh.geometry.attributes.position.needsUpdate = true;
    this.mesh.geometry.computeVertexNormals();
  }

  private updateShards(time: number, delta: number, speed: number): void {
    if (!this.shardMesh) return;
    const dt = Math.min(delta, 0.1);
    const audioBoost = 1.0 + this.energy * 0.35 + this.bassHit * 0.25;

    for (let i = 0; i < NUM_SHARDS; i++) {
      const data = this.shardData[i];
      data.currentAngle += dt * data.orbitSpeed * audioBoost * speed;
      const angle = data.currentAngle;
      const rad = data.orbitRadius + this.bassHit * 1.2 - this.smoothBass * 0.5;
      const bob = Math.sin(time * data.bobSpeed + data.orbitPhase * 3.0) * data.bobAmp * (1.0 + this.smoothBass * 1.5);

      this.dummy.position.set(
        Math.cos(angle) * rad,
        data.orbitHeight + bob + Math.sin(angle) * data.orbitTilt * rad,
        Math.sin(angle) * rad
      );

      data.currentTumble += dt * data.tumbleSpeed * (1.0 + this.energy * 0.5) * speed;
      this.quat.setFromAxisAngle(data.tumbleAxis, data.currentTumble);
      this.dummy.quaternion.copy(this.quat);
      this.dummy.scale.setScalar(data.size * (1.0 + this.bassHit * 0.4 + this.smoothBass * 0.15));
      this.dummy.updateMatrix();
      this.shardMesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.shardMesh.instanceMatrix.needsUpdate = true;
  }

  private updateParticles(audio: AudioFeatures, time: number): void {
    if (!this.particleMaterial) return;
    this.particleMaterial.uniforms.uTime.value = time;
    this.particleMaterial.uniforms.uAudio.value = audio.rms;
    this.particleMaterial.uniforms.uBass.value = audio.bass;
  }

  private updateNebula(audio: AudioFeatures, time: number): void {
    if (!this.nebulaMaterial) return;
    this.nebulaMaterial.uniforms.uTime.value = time;
    this.nebulaMaterial.uniforms.uAudio.value = audio.rms;
    this.nebulaMaterial.uniforms.uBass.value = audio.bass;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const stops = theme.gradientStops;
    const colCore = stops?.[0] ?? theme.primary;
    const colShards = stops?.[1] ?? theme.secondary;
    const colPart1 = stops?.[2] ?? stops?.[0] ?? theme.primary;
    const colPart2 = stops?.[3] ?? stops?.[1] ?? theme.secondary;
    const colNeb1 = stops?.[0] ?? theme.primary;
    const colNeb2 = stops?.[stops.length - 1] ?? theme.secondary;

    this.material.color.set(colCore).lerp(new THREE.Color('#1c1c28'), 0.4);
    this.material.emissive.set(colCore);
    if (this.shardMaterial) {
      this.shardMaterial.color.set(colShards);
      this.shardMaterial.emissive.set(colShards);
    }
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uColor1.value.set(colPart1);
      this.particleMaterial.uniforms.uColor2.value.set(colPart2);
    }
    if (this.nebulaMaterial) {
      this.nebulaMaterial.uniforms.uColor1.value.set(colNeb1);
      this.nebulaMaterial.uniforms.uColor2.value.set(colNeb2);
    }
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.shardMesh) {
      this.shardMesh.geometry.dispose();
      this.shardMaterial?.dispose();
    }
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particleMaterial?.dispose();
    }
    if (this.nebula) {
      this.nebula.geometry.dispose();
      this.nebulaMaterial?.dispose();
    }
  }
}
