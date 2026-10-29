import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export interface StudioStageConfig {
  chromaIntensity: number;   // 0.0 - 2.0
  liquidWarp: number;        // 0.0 - 2.0
  tunnelDepth: number;       // 0.0 - 2.0
  volumeDensity: number;     // 0.0 - 2.0
  theForceAttraction: number;// -2.0 - 2.0 (repulsion to attraction)
}

export class StudioComposerPreset implements VisualizerPreset {
  id = 'studio-composer';
  name = 'Visualizer Studio';
  category = 'Structures' as const;
  description = 'Multi-layer stage composer blending Chroma, Liquid, Tunnel, Volume, and The Force.';

  public config: StudioStageConfig = {
    chromaIntensity: 1.0,
    liquidWarp: 1.0,
    tunnelDepth: 1.0,
    volumeDensity: 1.0,
    theForceAttraction: 1.0
  };

  private group!: THREE.Group;

  // Layer 1: Liquid Warp Plane
  private liquidMesh!: THREE.Mesh;
  private liquidMaterial!: THREE.ShaderMaterial;

  // Layer 2: Tunnel Corridor Frames
  private tunnelGroup!: THREE.Group;
  private tunnelFrames: THREE.LineLoop[] = [];
  private frameCount = 16;

  // Layer 3: Volume Particle Cloud & The Force Physics
  private volumeParticles!: THREE.Points;
  private volumePositions!: Float32Array;
  private volumeVelocities!: Float32Array;
  private volumeMaterial!: THREE.PointsMaterial;
  private particleCount = 2000;

  // Layer 4: The Force Singularity Attractor
  private forceCore!: THREE.Mesh;
  private forceMaterial!: THREE.MeshStandardMaterial;

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Layer: Liquid Warp Background
    const liquidGeom = new THREE.PlaneGeometry(30, 20, 40, 40);
    this.liquidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uWarp: { value: 1.0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;
        uniform float uWarp;

        void main() {
          vUv = uv;
          vec3 p = position;
          p.z -= 10.0;
          p.z += sin(p.x * 0.5 + uTime * 2.0) * cos(p.y * 0.5 + uTime) * (1.5 * uWarp + uBass);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec3 col = mix(uColor1 * 0.3, uColor2 * 0.5, sin(vUv.x * 4.0 + uTime) * 0.5 + 0.5);
          gl_FragColor = vec4(col, 0.6);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.liquidMesh = new THREE.Mesh(liquidGeom, this.liquidMaterial);
    this.group.add(this.liquidMesh);

    // 2. Layer: Tunnel Corridor Frames
    this.tunnelGroup = new THREE.Group();
    const frameMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < this.frameCount; i++) {
      const size = 3.5;
      const pts = [
        new THREE.Vector3(-size, -size, 0),
        new THREE.Vector3(size, -size, 0),
        new THREE.Vector3(size, size, 0),
        new THREE.Vector3(-size, size, 0)
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const loop = new THREE.LineLoop(geom, frameMat);
      loop.position.z = -i * 2.5;
      this.tunnelFrames.push(loop);
      this.tunnelGroup.add(loop);
    }
    this.group.add(this.tunnelGroup);

    // 3. Layer: Volume Particle Cloud & The Force Attractor
    const particleGeom = new THREE.BufferGeometry();
    this.volumePositions = new Float32Array(this.particleCount * 3);
    this.volumeVelocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.volumePositions[idx] = (Math.random() - 0.5) * 14;
      this.volumePositions[idx + 1] = (Math.random() - 0.5) * 10;
      this.volumePositions[idx + 2] = (Math.random() - 0.5) * 14;

      this.volumeVelocities[idx] = (Math.random() - 0.5) * 0.2;
      this.volumeVelocities[idx + 1] = (Math.random() - 0.5) * 0.2;
      this.volumeVelocities[idx + 2] = (Math.random() - 0.5) * 0.2;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(this.volumePositions, 3));

    this.volumeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.volumeParticles = new THREE.Points(particleGeom, this.volumeMaterial);
    this.group.add(this.volumeParticles);

    // 4. Layer: The Force Center Singularity
    const forceGeom = new THREE.SphereGeometry(1.2, 32, 32);
    this.forceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85
    });
    this.forceCore = new THREE.Mesh(forceGeom, this.forceMaterial);
    this.forceCore.position.z = -4;
    this.group.add(this.forceCore);

    ctx.scene.add(this.group);
  }

  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    // 1. Update Liquid
    this.liquidMaterial.uniforms.uTime.value = time;
    this.liquidMaterial.uniforms.uBass.value = audio.bass;
    this.liquidMaterial.uniforms.uWarp.value = this.config.liquidWarp;

    // 2. Update Tunnel speed & depth
    const speed = (6.0 + audio.bass * 8.0) * delta * this.config.tunnelDepth;
    this.tunnelFrames.forEach(frame => {
      frame.position.z += speed;
      if (frame.position.z > 2) {
        frame.position.z = -this.frameCount * 2.5 + 2;
      }
      if (audio.beat) {
        frame.scale.setScalar(1.08);
      } else {
        frame.scale.setScalar(1.0);
      }
    });

    // 3. Update The Force & Volume particles
    const pos = (this.volumeParticles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const forceStrength = this.config.theForceAttraction * (1.0 + audio.bass * 2.0);
    const attractorZ = -4.0;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const px = pos[idx];
      const py = pos[idx + 1];
      const pz = pos[idx + 2] - attractorZ;

      const distSq = px * px + py * py + pz * pz + 0.5;
      const f = (forceStrength / distSq) * delta;

      // Gravitational attraction toward (0, 0, attractorZ) + orbital swirl
      this.volumeVelocities[idx] -= px * f;
      this.volumeVelocities[idx + 1] -= py * f;
      this.volumeVelocities[idx + 2] -= pz * f;

      // Swirl
      this.volumeVelocities[idx] += -py * f * 1.5;
      this.volumeVelocities[idx + 1] += px * f * 1.5;

      // Drag
      this.volumeVelocities[idx] *= 0.96;
      this.volumeVelocities[idx + 1] *= 0.96;
      this.volumeVelocities[idx + 2] *= 0.96;

      pos[idx] += this.volumeVelocities[idx];
      pos[idx + 1] += this.volumeVelocities[idx + 1];
      pos[idx + 2] += this.volumeVelocities[idx + 2];

      // Respawn if escaped bounds
      if (Math.abs(pos[idx]) > 12 || Math.abs(pos[idx + 1]) > 10 || Math.abs(pos[idx + 2]) > 14) {
        pos[idx] = (Math.random() - 0.5) * 10;
        pos[idx + 1] = (Math.random() - 0.5) * 8;
        pos[idx + 2] = (Math.random() - 0.5) * 10;
      }
    }
    this.volumeParticles.geometry.attributes.position.needsUpdate = true;
    this.volumeMaterial.size = 0.12 * this.config.volumeDensity;

    // 4. Force core pulsates with bass & Chroma intensity
    const coreScale = 1.0 + audio.bass * 0.4 + (audio.beat ? 0.3 : 0);
    this.forceCore.scale.set(coreScale, coreScale, coreScale);
    this.forceCore.rotation.y += delta * 0.5;

    if (audio.beat) {
      this.forceMaterial.emissiveIntensity = 1.8 * this.config.chromaIntensity;
    } else {
      this.forceMaterial.emissiveIntensity *= 0.94;
    }
  }

  onThemeChange(theme: VisualizerTheme) {
    this.liquidMaterial.uniforms.uColor1.value.set(theme.primary);
    this.liquidMaterial.uniforms.uColor2.value.set(theme.secondary);
    this.volumeMaterial.color.set(theme.accent);
    this.forceMaterial.color.set(theme.primary);
    this.forceMaterial.emissive.set(theme.accent);
  }

  dispose() {
    this.liquidMesh.geometry.dispose();
    this.liquidMaterial.dispose();
    this.tunnelFrames.forEach(f => {
      f.geometry.dispose();
      (f.material as THREE.Material).dispose();
    });
    this.volumeParticles.geometry.dispose();
    this.volumeMaterial.dispose();
    this.forceCore.geometry.dispose();
    this.forceMaterial.dispose();
    this.group.removeFromParent();
  }
}
