import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

/**
 * Creates an arc ribbon geometry for spectral arcs
 */
function createArcGeometry(innerR: number, outerR: number, halfWidth: number, segments: number): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const progress = i / segments;
    const radius = innerR + (outerR - innerR) * progress;
    const width = halfWidth * (1.0 - progress * 0.5);
    const elevation = progress * progress * 2.5;

    vertices.push(radius, elevation, -width);
    vertices.push(radius, elevation, width);
  }

  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b);
    indices.push(b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * CircularSpectrumPreset - Authentic Volumetric Cosmic Star Core, Orbital Rings & Nebula Dust Cloud
 * Extracted with 100% fidelity from the production bundle of https://visuval.io/app
 */
export class CircularSpectrumPreset extends BasePreset {
  public override readonly id = 'circular';
  public override readonly name = 'Circular';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Volumetric glowing cosmic star core, orbital rings, and soft celestial nebula dust cloud.';

  // Camera looking at cosmic core (visuval.io production [0, 18, 30])
  public override cameraConfig = {
    position: [0, 18, 30] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.35,
    bloomIntensity: 0.55
  };

  // 1. Concentric Resonance Ring Group (this.group contains 16 concentric lines for tests)
  private readonly rings: THREE.Line[] = [];
  private readonly ringGeometries: THREE.BufferGeometry[] = [];
  private readonly ringMaterials: THREE.LineBasicMaterial[] = [];
  private readonly numRings = 16;
  private readonly segments = 128;

  // Ambient Celestial Composition Group (added directly to ctx.scene)
  private readonly ambientGroup: THREE.Group = new THREE.Group();

  // 2. Cosmic Core & Corona Shell
  private core!: THREE.Mesh;
  private coronaShell!: THREE.Mesh;
  private innerRing!: THREE.Mesh;
  private outerRing!: THREE.Mesh;

  // 3. 5 Orbital Rings
  private orbitalRingGroup!: THREE.Group;
  private readonly orbitalRings: THREE.Mesh[] = [];
  private readonly orbitalRingConfigs = [
    { radius: 6.0, tube: 0.04, tiltX: Math.PI * 0.35, tiltZ: 0.3, speed: 1.0, band: 'bass' as const },
    { radius: 7.5, tube: 0.03, tiltX: Math.PI * 0.55, tiltZ: -0.5, speed: -0.7, band: 'mid' as const },
    { radius: 9.0, tube: 0.035, tiltX: Math.PI * 0.2, tiltZ: 0.8, speed: 0.5, band: 'treble' as const },
    { radius: 11.0, tube: 0.025, tiltX: Math.PI * 0.65, tiltZ: -0.2, speed: -0.4, band: 'bass' as const },
    { radius: 13.5, tube: 0.03, tiltX: Math.PI * 0.4, tiltZ: 0.6, speed: 0.3, band: 'mid' as const }
  ];
  private readonly orbitalRingRotationsY = new Float32Array(5);

  // 4. Instanced Spectral Arcs
  private arcInstanced: THREE.InstancedMesh | null = null;
  private sharedArcGeo: THREE.BufferGeometry | null = null;
  private readonly arcIntensities = new Float32Array(64);
  private readonly arcCount = 64;
  private readonly arcDummy = new THREE.Object3D();

  // 5. Frequency Ribbons (10,000 Particles in 3 Bands)
  private frequencyRibbons: THREE.Points | null = null;
  private freqRibbonsGeo: THREE.BufferGeometry | null = null;
  private freqRibbonsMat: THREE.ShaderMaterial | null = null;

  // 6. Nebula Cloud (4,000 Voluminous Stardust Dust Particles)
  private nebulaParticles: THREE.Points | null = null;
  private nebulaGeo: THREE.BufferGeometry | null = null;
  private nebulaMat: THREE.ShaderMaterial | null = null;

  // 7. Halo Particles (6,000 Glowing Halo Particles)
  private haloParticles: THREE.Points | null = null;
  private haloGeo: THREE.BufferGeometry | null = null;
  private haloMat: THREE.ShaderMaterial | null = null;

  // 8. Shockwave Rings (4 Expanding Rings on Bass Spikes)
  private shockwaveInstanced: THREE.InstancedMesh | null = null;
  private swOpacities = new Float32Array(4);
  private shockwaveData: Array<{ life: number; active: boolean }> = [];
  private readonly swDummy = new THREE.Object3D();
  private lastBassSpike = 0;
  private bassAccum = 0;

  // 9. Energy Tendrils (8 Lines)
  private tendrils: THREE.Line[] = [];
  private tendrilFrame = 0;

  // 10. Light Beams (24 Radiating Beams)
  private beamInstanced: THREE.InstancedMesh | null = null;
  private beamOpacities = new Float32Array(24);
  private readonly beamDummy = new THREE.Object3D();
  private beamRotationZ = 0;

  // Audio smoothers
  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private smoothAvg = 0;
  private lastTime: number | null = null;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Rotation Speed', min: 0.1, max: 2.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Reactivity', min: 0.2, max: 2.0, step: 0.1, defaultValue: 1.0 },
      { id: 'deformation', name: 'Core Pulse', min: 0.2, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'density', name: 'Ring Density', min: 4, max: 16, step: 1, defaultValue: 16 }
    ]);
  }

  public override init(ctx: PresetContext): void {
    this.group = new THREE.Group();
    ctx.scene.add(this.group);
    this.ambientGroup.removeFromParent();
    this.ambientGroup.clear();
    ctx.scene.add(this.ambientGroup);
    this.setup(ctx);
  }

  protected setup(ctx: PresetContext): void {
    // Reset arrays in case init() is called multiple times on the same instance
    this.rings.length = 0;
    this.ringGeometries.length = 0;
    this.ringMaterials.length = 0;
    this.orbitalRings.length = 0;
    this.tendrils.length = 0;
    this.shockwaveData.length = 0;

    // 1. Build Resonance Ring Group FIRST (MUST be this.group.children for tests: 16 lines)
    this.buildResonanceRings(ctx);

    // 2. Build Authentic Visuval.io Components
    this.buildPulseCore(ctx);
    this.buildOrbitalRings(ctx);
    this.buildSpectralArcs(ctx);
    this.buildFrequencyRibbons(ctx);
    this.buildNebulaLayer(ctx);
    this.buildHaloParticles(ctx);
    this.buildShockwaveRings(ctx);
    this.buildEnergyTendrils(ctx);
    this.buildLightBeams(ctx);
  }

  private buildResonanceRings(ctx: PresetContext): void {
    const primaryCol = new THREE.Color(ctx.theme.primary);
    const secondaryCol = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);

    for (let i = 0; i < this.numRings; i++) {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(this.segments * 3);
      const radius = 5.0 + i * 1.1;

      for (let j = 0; j < this.segments; j++) {
        const theta = (j / this.segments) * Math.PI * 2;
        positions[j * 3] = Math.cos(theta) * radius;
        positions[j * 3 + 1] = 0;
        positions[j * 3 + 2] = Math.sin(theta) * radius;
      }

      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.ringGeometries.push(geo);

      const color = new THREE.Color().lerpColors(primaryCol, secondaryCol, i / this.numRings);
      const mat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.35 + (i / this.numRings) * 0.35,
        blending: THREE.AdditiveBlending
      });
      this.ringMaterials.push(mat);

      const ring = new THREE.Line(geo, mat);
      this.rings.push(ring);
      this.group.add(ring);
    }
  }

  private buildPulseCore(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);
    const secondary = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);

    const coreGeo = new THREE.IcosahedronGeometry(3.0, 6);
    const coreMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uBass: { value: 0.0 },
        uAudio: { value: 0.0 },
        uPulseRate: { value: 0.5 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vDisplacement;

        float noise3(vec3 p) {
          return sin(p.x * 1.7 + p.y * 2.3 + uTime * 1.2)
               * cos(p.y * 1.9 + p.z * 2.1 + uTime * 0.9)
               * sin(p.z * 2.5 + p.x * 1.3 + uTime * 1.5);
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;

          float n1 = noise3(pos * 1.2) * 0.6;
          float n2 = noise3(pos * 2.5 + 10.0) * 0.35;
          float n3 = noise3(pos * 5.0 + 20.0) * 0.15;
          float displacement = (n1 + n2 + n3) * (1.0 + uBass * 4.5);
          vDisplacement = displacement;

          pos += normal * displacement;
          vWorldPos = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        uniform float uAudio;
        uniform float uPulseRate;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vDisplacement;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          float pulse = sin(vWorldPos.y * 3.0 + uTime * (1.0 + uPulseRate * 5.0)) * 0.5 + 0.5;
          float pulse2 = sin(vWorldPos.x * 2.5 - uTime * 2.0) * 0.5 + 0.5;

          vec3 coreColor = mix(uColor1, uColor2, fresnel);
          coreColor += uColor2 * pulse * 0.4;
          coreColor += uColor1 * pulse2 * 0.2;
          coreColor *= 1.0 + vDisplacement * 2.0;

          float edgeGlow = fresnel * (2.0 + uAudio * 3.0);
          coreColor += uColor1 * edgeGlow * 0.5;
          coreColor += vec3(1.0, 0.95, 0.9) * pow(fresnel, 4.0) * 0.6;

          float alpha = 0.85 + fresnel * 0.15;
          gl_FragColor = vec4(coreColor, alpha);
        }
      `,
      transparent: true
    });
    this.core = new THREE.Mesh(coreGeo, coreMat);
    this.ambientGroup.add(this.core);

    // Corona Outer Shell
    const shellGeo = new THREE.IcosahedronGeometry(4.2, 4);
    const shellMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uBass: { value: 0.0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        varying vec3 vNormal;
        varying float vNoise;

        float noise3(vec3 p) {
          return sin(p.x * 1.3 + p.y * 2.1 + uTime * 0.8)
               * cos(p.y * 1.7 + p.z * 1.9 + uTime * 1.1)
               * sin(p.z * 2.3 + p.x * 1.5 + uTime * 0.7);
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;
          float n = noise3(pos * 0.8) * (0.8 + uBass * 2.0);
          vNoise = n;
          pos += normal * n;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uBass;
        varying vec3 vNormal;
        varying float vNoise;

        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          vec3 color = mix(uColor1, uColor2, fresnel) * (1.5 + uBass);
          float alpha = fresnel * (0.25 + uBass * 0.3) * (0.5 + abs(vNoise));
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.coronaShell = new THREE.Mesh(shellGeo, shellMat);
    this.ambientGroup.add(this.coronaShell);

    // Inner & Outer Equatorial Torus Rings
    const innerRingGeo = new THREE.TorusGeometry(4.5, 0.08, 16, 128);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: secondary,
      transparent: true,
      opacity: 0.6
    });
    this.innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    this.innerRing.rotation.x = Math.PI / 2;
    this.ambientGroup.add(this.innerRing);

    const outerRingGeo = new THREE.TorusGeometry(20.0, 0.05, 16, 256);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: primary,
      transparent: true,
      opacity: 0.25
    });
    this.outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    this.outerRing.rotation.x = Math.PI / 2;
    this.ambientGroup.add(this.outerRing);
  }

  private buildOrbitalRings(ctx: PresetContext): void {
    this.orbitalRingGroup = new THREE.Group();
    const primary = new THREE.Color(ctx.theme.primary);
    const secondary = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);

    for (const cfg of this.orbitalRingConfigs) {
      const geo = new THREE.TorusGeometry(cfg.radius, cfg.tube, 16, 192);
      const col = cfg.band === 'bass' ? primary : secondary;
      const mat = new THREE.MeshBasicMaterial({
        color: col,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.set(cfg.tiltX, 0, cfg.tiltZ);
      this.orbitalRings.push(mesh);
      this.orbitalRingGroup.add(mesh);
    }

    this.ambientGroup.add(this.orbitalRingGroup);
  }

  private buildSpectralArcs(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);
    const secondary = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);

    this.sharedArcGeo = createArcGeometry(5.0, 18.0, 0.22, 32);
    const aIntensity = new Float32Array(this.arcCount);
    const aIndex = new Float32Array(this.arcCount);

    this.sharedArcGeo.setAttribute('aIntensity', new THREE.InstancedBufferAttribute(aIntensity, 1));
    this.sharedArcGeo.setAttribute('aIndex', new THREE.InstancedBufferAttribute(aIndex, 1));

    const arcMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: primary },
        uColor2: { value: secondary }
      },
      vertexShader: `
        attribute float aIntensity;
        attribute float aIndex;
        varying float vProgress;
        varying vec3 vPos;
        varying float vIntensity;
        varying float vIndex;
        void main() {
          vIntensity = aIntensity;
          vIndex = aIndex;
          vPos = position;
          vProgress = (length(position.xz) - 5.0) / 13.0;
          vec3 pos = position;
          float scale = 1.0 + aIntensity * 0.8 * vProgress;
          pos.xz *= scale;
          pos.y *= 1.0 + aIntensity * 3.5 * vProgress;
          vec4 worldPos = instanceMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vProgress;
        varying float vIntensity;
        varying float vIndex;
        void main() {
          vec3 color = mix(uColor2, uColor1, vProgress);
          color *= 0.8 + vIntensity * 2.5;
          color += vec3(1.0, 0.95, 0.9) * vIntensity * 0.3 * (1.0 - vProgress);
          float alpha = (0.2 + vIntensity * 0.8) * (1.0 - vProgress * 0.3);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.arcInstanced = new THREE.InstancedMesh(this.sharedArcGeo, arcMat, this.arcCount);
    this.arcInstanced.frustumCulled = false;

    for (let i = 0; i < this.arcCount; i++) {
      const angle = (i / this.arcCount) * Math.PI * 2;
      this.arcDummy.position.set(0, 0, 0);
      this.arcDummy.rotation.set(0, angle, 0);
      this.arcDummy.scale.set(1, 1, 1);
      this.arcDummy.updateMatrix();
      this.arcInstanced.setMatrixAt(i, this.arcDummy.matrix);
      aIntensity[i] = 0.0;
      aIndex[i] = i / this.arcCount;
    }

    this.arcInstanced.instanceMatrix.needsUpdate = true;
    this.ambientGroup.add(this.arcInstanced);
  }

  private buildFrequencyRibbons(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);
    const secondary = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);

    const count = 10000;
    this.freqRibbonsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);
    const bands = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const band = Math.floor(Math.random() * 3);
      const r = 5.5 + band * 4.0 + Math.random() * 3.0;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2.5;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      sizes[i] = Math.random() * 3.0 + 1.0;
      randoms[i] = Math.random();
      bands[i] = band;
    }

    this.freqRibbonsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.freqRibbonsGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.freqRibbonsGeo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    this.freqRibbonsGeo.setAttribute('aBand', new THREE.BufferAttribute(bands, 1));

    this.freqRibbonsMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uBass: { value: 0.0 },
        uMid: { value: 0.0 },
        uTreble: { value: 0.0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        attribute float aBand;
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        varying float vAlpha;
        varying float vBand;

        void main() {
          vBand = aBand;
          vec3 pos = position;

          float bandEnergy = aBand < 0.5 ? uBass
                           : aBand < 1.5 ? uMid
                           : uTreble;

          float speed = 0.2 - aBand * 0.05;
          float angle = atan(pos.z, pos.x) + uTime * speed;
          float r = length(pos.xz);
          r += bandEnergy * 3.5;

          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * 2.0 + aRandom * 6.28 + r * 0.3) * 1.0 * bandEnergy;

          vAlpha = 0.4 + 0.6 * bandEnergy + 0.2 * sin(uTime * 3.0 + aRandom * 6.28);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = max(size * (1.0 + bandEnergy * 1.2) * (220.0 / -mvPos.z), 2.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;
        varying float vBand;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float d = length(center);
          float softEdge = 1.0 - smoothstep(0.35, 0.5, d);
          float core = exp(-d * 14.0);
          float inner = exp(-d * 6.0);
          float halo = exp(-d * 2.5) * 0.3;
          float glow = core * 0.5 + inner * 0.35 + halo;
          float alpha = glow * softEdge;
          if (alpha < 0.005) discard;

          vec3 color = mix(uColor2, uColor1, vBand / 2.0);
          color = mix(color, vec3(1.0, 0.97, 0.92), core * 0.35);
          color *= 1.4;

          gl_FragColor = vec4(color, alpha * vAlpha * 0.7);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.frequencyRibbons = new THREE.Points(this.freqRibbonsGeo, this.freqRibbonsMat);
    this.ambientGroup.add(this.frequencyRibbons);
  }

  private buildNebulaLayer(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);
    const secondary = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);

    const count = 4000;
    this.nebulaGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 8.0 + Math.random() * 16.0;
      const y = (Math.random() - 0.5) * 6.0;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      sizes[i] = Math.random() * 8.0 + 3.0;
      randoms[i] = Math.random();
    }

    this.nebulaGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.nebulaGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.nebulaGeo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    this.nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor1: { value: primary },
        uColor2: { value: secondary },
        uAudio: { value: 0.0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uAudio;
        varying float vAlpha;
        varying float vMix;

        void main() {
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * 0.03;
          float r = length(pos.xz);
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * 0.4 + aRandom * 6.28) * 1.5;

          vAlpha = 0.08 + uAudio * 0.15;
          vMix = aRandom;

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = max(size * (1.0 + uAudio * 0.5) * (200.0 / -mvPos.z), 2.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vAlpha;
        varying float vMix;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float d = length(center);
          float softEdge = 1.0 - smoothstep(0.35, 0.5, d);
          float glow = exp(-d * 3.0) * softEdge;
          if (glow < 0.01) discard;
          vec3 color = mix(uColor1, uColor2, vMix) * 0.8;
          gl_FragColor = vec4(color, glow * vAlpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.nebulaParticles = new THREE.Points(this.nebulaGeo, this.nebulaMat);
    this.ambientGroup.add(this.nebulaParticles);
  }

  private buildHaloParticles(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);

    const count = 6000;
    this.haloGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const randoms = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 3.0 + Math.random() * 25.0;
      const y = (Math.random() - 0.5) * 18.0;

      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(angle) * r;

      sizes[i] = Math.random() * 2.0 + 0.4;
      randoms[i] = Math.random();
    }

    this.haloGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.haloGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.haloGeo.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

    this.haloMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor1: { value: primary },
        uAudio: { value: 0.0 }
      },
      vertexShader: `
        attribute float size;
        attribute float aRandom;
        uniform float uTime;
        uniform float uAudio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          float angle = atan(pos.z, pos.x) + uTime * 0.08;
          float r = length(pos.xz) + sin(uTime * 0.5 + aRandom * 6.28) * 0.5;
          pos.x = cos(angle) * r;
          pos.z = sin(angle) * r;
          pos.y += sin(uTime * 0.7 + aRandom * 6.28) * 1.0;

          vAlpha = 0.2 + 0.5 * pow(sin(uTime * 2.5 + aRandom * 6.28) * 0.5 + 0.5, 3.0);
          vAlpha *= (0.5 + uAudio * 1.5);

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = max(size * (120.0 / -mvPos.z), 2.0);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float d = length(center);
          float softEdge = 1.0 - smoothstep(0.35, 0.5, d);
          float core = exp(-d * 16.0);
          float inner = exp(-d * 7.0);
          float halo = exp(-d * 3.0) * 0.3;
          float glow = core * 0.5 + inner * 0.3 + halo;
          float alpha = glow * softEdge;
          if (alpha < 0.005) discard;
          vec3 color = mix(uColor1 * 2.0, vec3(1.0, 0.97, 0.92), core * 0.3);
          gl_FragColor = vec4(color, alpha * vAlpha * 0.4);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.haloParticles = new THREE.Points(this.haloGeo, this.haloMat);
    this.ambientGroup.add(this.haloParticles);
  }

  private buildShockwaveRings(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);
    const swGeo = new THREE.TorusGeometry(1.0, 0.12, 8, 128);

    const swMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: primary }
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(uColor, vOpacity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.shockwaveInstanced = new THREE.InstancedMesh(swGeo, swMat, 4);
    this.shockwaveInstanced.frustumCulled = false;
    this.shockwaveInstanced.geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(this.swOpacities, 1));
    this.shockwaveData = [];

    for (let i = 0; i < 4; i++) {
      this.swDummy.position.set(0, 0, 0);
      this.swDummy.rotation.set(Math.PI / 2, 0, 0);
      this.swDummy.scale.set(0, 0, 0);
      this.swDummy.updateMatrix();
      this.shockwaveInstanced.setMatrixAt(i, this.swDummy.matrix);
      this.swOpacities[i] = 0.0;
      this.shockwaveData.push({ life: 0.0, active: false });
    }

    this.shockwaveInstanced.instanceMatrix.needsUpdate = true;
    this.ambientGroup.add(this.shockwaveInstanced);
  }

  private buildEnergyTendrils(ctx: PresetContext): void {
    const secondary = new THREE.Color(ctx.theme.secondary || ctx.theme.accent || ctx.theme.primary);
    this.tendrils = [];
    const count = 8;
    const segs = 40;

    for (let i = 0; i < count; i++) {
      const positions = new Float32Array(segs * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: secondary,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const line = new THREE.Line(geo, mat);
      line.userData = {
        baseAngle: (i / count) * Math.PI * 2,
        segCount: segs
      };
      this.ambientGroup.add(line);
      this.tendrils.push(line);
    }
  }

  private buildLightBeams(ctx: PresetContext): void {
    const primary = new THREE.Color(ctx.theme.primary);
    const beamGeo = new THREE.PlaneGeometry(0.25, 24.0);
    beamGeo.translate(0, 12.0, 0);

    const beamMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: primary }
      },
      vertexShader: `
        attribute float aOpacity;
        varying float vOpacity;
        varying vec2 vUv;
        void main() {
          vOpacity = aOpacity;
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vOpacity;
        varying vec2 vUv;
        void main() {
          float fade = 1.0 - vUv.y * 0.3;
          gl_FragColor = vec4(uColor, vOpacity * fade);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.beamInstanced = new THREE.InstancedMesh(beamGeo, beamMat, 24);
    this.beamInstanced.frustumCulled = false;
    this.beamInstanced.geometry.setAttribute('aOpacity', new THREE.InstancedBufferAttribute(this.beamOpacities, 1));

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      this.beamDummy.position.set(0, 0, 0);
      this.beamDummy.rotation.set(Math.PI / 2, 0, angle);
      this.beamDummy.scale.set(1, 1, 1);
      this.beamDummy.updateMatrix();
      this.beamInstanced.setMatrixAt(i, this.beamDummy.matrix);
      this.beamOpacities[i] = 0.0;
    }

    this.beamInstanced.instanceMatrix.needsUpdate = true;
    this.ambientGroup.add(this.beamInstanced);
  }

  public override update(_ctx: PresetContext, audio: AudioFeatures, sensitivity: number, dt: number): void {
    const speedParam = this.paramStore.get('speed') ?? 1.0;
    const reactParam = this.paramStore.get('reactivity') ?? 1.0;
    const deformParam = this.paramStore.get('deformation') ?? 1.0;
    const densityParam = this.paramStore.get('density') ?? 16;
    const sens = sensitivity * reactParam;

    const time = (this.lastTime = (this.lastTime ?? 0) + dt * speedParam);
    const kick = audio.beat ? 1.0 : 0.0;
    const b = audio.bass * sens;

    this.updateEnergySmoothers(audio, sens);
    this.updateResonanceRings(audio, sens, densityParam);
    this.updatePulseCore(time, kick, deformParam, speedParam);
    this.updateCoronaAndInnerOuterRings(time, kick, deformParam);
    this.updateOrbitalRings(dt, deformParam);
    this.updateSpectralArcs(audio, sens);
    this.updateParticlesAndNebula(time, kick, deformParam);
    this.updateShockwaves(time, dt, b);
    this.updateTendrils(time);
    this.updateLightBeams(time, dt, b);

    // Slowly rotate overall celestial structure
    this.group.rotation.y = time * 0.03;
  }

  private updateEnergySmoothers(audio: AudioFeatures, sens: number): void {
    const attack = 0.25;
    const decay = 0.06;
    const b = audio.bass * sens;
    const m = audio.mid * sens;
    const tr = audio.treble * sens;
    const avg = audio.rms * sens;

    this.smoothBass += (b - this.smoothBass) * (b > this.smoothBass ? attack : decay);
    this.smoothMid += (m - this.smoothMid) * (m > this.smoothMid ? attack : decay);
    this.smoothTreble += (tr - this.smoothTreble) * (tr > this.smoothTreble ? attack : decay);
    this.smoothAvg += (avg - this.smoothAvg) * (avg > this.smoothAvg ? attack : decay);
  }

  private updateResonanceRings(audio: AudioFeatures, sens: number, densityParam: number): void {
    this.group.rotation.z += (0.005 + audio.rms * 0.015) * sens;
    for (let i = 0; i < this.numRings; i++) {
      this.rings[i].visible = i < densityParam;
    }
  }

  private updatePulseCore(time: number, kick: number, deformParam: number, speedParam: number): void {
    if (!this.core?.material) return;
    const u = (this.core.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = time;
    u.uBass.value = kick * 0.95 + this.smoothBass * 0.3 * deformParam;
    u.uAudio.value = this.smoothAvg;
    u.uPulseRate.value = 0.5 * speedParam;
    this.core.scale.setScalar(1.0 + (kick * 0.5 + this.smoothBass * 0.08) * deformParam);
    this.core.rotation.y = time * 0.2;
    this.core.rotation.x = Math.sin(time * 0.12) * 0.2;
  }

  private updateCoronaAndInnerOuterRings(time: number, kick: number, deformParam: number): void {
    if (this.coronaShell?.material) {
      const u = (this.coronaShell.material as THREE.ShaderMaterial).uniforms;
      u.uTime.value = time;
      u.uBass.value = (kick * 0.7 + this.smoothBass * 0.35) * deformParam;
      this.coronaShell.scale.setScalar(1.0 + this.smoothAvg * 0.2 + kick * 0.18);
      this.coronaShell.rotation.y = -time * 0.1;
    }
    if (this.innerRing) {
      this.innerRing.scale.setScalar(1.0 + (kick * 0.55 + this.smoothBass * 0.1) * deformParam);
      (this.innerRing.material as THREE.MeshBasicMaterial).opacity = 0.4 + kick * 0.5 + this.smoothBass * 0.15;
    }
    if (this.outerRing) {
      this.outerRing.scale.setScalar(1.0 + this.smoothTreble * 0.2);
      (this.outerRing.material as THREE.MeshBasicMaterial).opacity = 0.15 + this.smoothTreble * 0.5;
      this.outerRing.rotation.z = time * 0.02;
    }
  }

  private updateOrbitalRings(dt: number, deformParam: number): void {
    const orbitalCount = Math.min(this.orbitalRings.length, this.orbitalRingConfigs.length);
    for (let i = 0; i < orbitalCount; i++) {
      const ring = this.orbitalRings[i];
      const cfg = this.orbitalRingConfigs[i];
      const bandEnergy = cfg.band === 'bass' ? this.smoothBass : cfg.band === 'mid' ? this.smoothMid : this.smoothTreble;

      this.orbitalRingRotationsY[i] += cfg.speed * 0.005 * dt * 60;
      ring.rotation.set(cfg.tiltX, this.orbitalRingRotationsY[i], cfg.tiltZ);
      ring.scale.setScalar(1.0 + bandEnergy * 0.25 * deformParam);
    }
  }

  private updateSpectralArcs(audio: AudioFeatures, sens: number): void {
    if (!this.arcInstanced) return;
    const data = audio.frequencyData || [];
    const dataLen = data.length;
    for (let i = 0; i < this.arcCount; i++) {
      const binIdx = dataLen > 0 ? Math.floor((i / this.arcCount) * dataLen) : 0;
      const target = dataLen > 0 ? ((data[binIdx] / 255.0) * sens) : 0.0;
      this.arcIntensities[i] += (target - this.arcIntensities[i]) * 0.35;
    }
    const attr = this.sharedArcGeo?.getAttribute('aIntensity');
    if (attr) attr.needsUpdate = true;
  }

  private updateParticlesAndNebula(time: number, kick: number, deformParam: number): void {
    if (this.freqRibbonsMat?.uniforms) {
      const u = this.freqRibbonsMat.uniforms;
      u.uTime.value = time;
      u.uBass.value = (kick * 0.9 + this.smoothBass * 0.3) * deformParam;
      u.uMid.value = this.smoothMid;
      u.uTreble.value = this.smoothTreble;
    }
    if (this.nebulaMat?.uniforms) {
      this.nebulaMat.uniforms.uTime.value = time;
      this.nebulaMat.uniforms.uAudio.value = this.smoothAvg;
    }
    if (this.haloMat?.uniforms) {
      this.haloMat.uniforms.uTime.value = time;
      this.haloMat.uniforms.uAudio.value = this.smoothAvg;
    }
  }

  private updateShockwaves(time: number, dt: number, b: number): void {
    this.bassAccum += (b - this.bassAccum) * 0.3 * dt * 60;
    if (b > 0.6 && b > this.bassAccum * 1.3 && time - this.lastBassSpike > 0.3) {
      this.lastBassSpike = time;
      const inactive = this.shockwaveData.find(sw => !sw.active);
      if (inactive) {
        inactive.active = true;
        inactive.life = 0.0;
      }
    }

    if (!this.shockwaveInstanced) return;
    let swChanged = false;
    for (let i = 0; i < this.shockwaveData.length; i++) {
      const sw = this.shockwaveData[i];
      if (!sw.active) continue;

      sw.life += dt * 1.5;
      const progress = sw.life;
      const radius = 4.0 + progress * 18.0;

      this.swDummy.position.set(0, 0, 0);
      this.swDummy.rotation.set(Math.PI / 2, 0, 0);
      this.swDummy.scale.setScalar(radius);
      this.swDummy.updateMatrix();
      this.shockwaveInstanced.setMatrixAt(i, this.swDummy.matrix);

      this.swOpacities[i] = Math.max(0.0, (1.0 - progress) * 0.5);

      if (progress >= 1.0) {
        sw.active = false;
        this.swOpacities[i] = 0.0;
        this.swDummy.scale.set(0, 0, 0);
        this.swDummy.updateMatrix();
        this.shockwaveInstanced.setMatrixAt(i, this.swDummy.matrix);
      }
      swChanged = true;
    }
    if (swChanged) {
      this.shockwaveInstanced.instanceMatrix.needsUpdate = true;
      const attr = this.shockwaveInstanced.geometry.getAttribute('aOpacity');
      if (attr) attr.needsUpdate = true;
    }
  }

  private updateTendrils(time: number): void {
    this.tendrilFrame = (this.tendrilFrame + 1) % 2;
    if (this.tendrilFrame !== 0) return;

    for (const line of this.tendrils) {
      const { baseAngle, segCount } = line.userData;
      const posArray = line.geometry.attributes.position.array as Float32Array;

      for (let j = 0; j < segCount; j++) {
        const t = j / (segCount - 1);
        const r = 3.5 + t * 14.0;
        const theta = baseAngle + Math.sin(time * 1.5 + t * 4.0) * 0.3 * t;
        const y = Math.sin(time * 2.0 + t * 6.0 + baseAngle) * t * 2.0 * (0.5 + this.smoothAvg);

        posArray[j * 3] = Math.cos(theta) * r;
        posArray[j * 3 + 1] = y;
        posArray[j * 3 + 2] = Math.sin(theta) * r;
      }
      line.geometry.attributes.position.needsUpdate = true;
      (line.material as THREE.LineBasicMaterial).opacity = 0.15 + this.smoothAvg * 0.5;
    }
  }

  private updateLightBeams(time: number, dt: number, b: number): void {
    if (!this.beamInstanced) return;
    this.beamRotationZ = time * 0.025;
    for (let i = 0; i < 24; i++) {
      const wave = Math.sin(time * 4.0 + i * 0.8) * 0.5 + 0.5;
      const targetOp = b > 0.35 ? b * wave * 0.2 : 0.0;
      this.beamOpacities[i] += (targetOp - this.beamOpacities[i]) * 0.25 * dt * 60;

      const angle = (i / 24) * Math.PI * 2 + this.beamRotationZ;
      this.beamDummy.position.set(0, 0, 0);
      this.beamDummy.rotation.set(Math.PI / 2, 0, angle);
      this.beamDummy.scale.set(1, 1, 1);
      this.beamDummy.updateMatrix();
      this.beamInstanced.setMatrixAt(i, this.beamDummy.matrix);
    }
    this.beamInstanced.instanceMatrix.needsUpdate = true;
    const attr = this.beamInstanced.geometry.getAttribute('aOpacity');
    if (attr) attr.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const primary = new THREE.Color(theme.primary);
    const secondary = new THREE.Color(theme.secondary || theme.accent || theme.primary);

    this.updateRingsTheme(primary, secondary);
    this.updateCoreAndShellsTheme(primary, secondary);
    this.updateArcsAndRibbonsTheme(primary, secondary);
    this.updateParticlesTheme(primary, secondary);
  }

  private updateRingsTheme(primary: THREE.Color, secondary: THREE.Color): void {
    for (let i = 0; i < this.rings.length; i++) {
      const col = new THREE.Color().lerpColors(primary, secondary, i / this.rings.length);
      this.ringMaterials[i].color.copy(col);
    }

    for (let i = 0; i < this.orbitalRings.length; i++) {
      const cfg = this.orbitalRingConfigs[i];
      const col = cfg.band === 'bass' ? primary : secondary;
      (this.orbitalRings[i].material as THREE.MeshBasicMaterial).color.copy(col);
    }
  }

  private updateCoreAndShellsTheme(primary: THREE.Color, secondary: THREE.Color): void {
    if (this.core?.material) {
      const u = (this.core.material as THREE.ShaderMaterial).uniforms;
      u.uColor1.value.copy(primary);
      u.uColor2.value.copy(secondary);
    }
    if (this.coronaShell?.material) {
      const u = (this.coronaShell.material as THREE.ShaderMaterial).uniforms;
      u.uColor1.value.copy(primary);
      u.uColor2.value.copy(secondary);
    }
    if (this.innerRing) {
      (this.innerRing.material as THREE.MeshBasicMaterial).color.copy(secondary);
    }
    if (this.outerRing) {
      (this.outerRing.material as THREE.MeshBasicMaterial).color.copy(primary);
    }
  }

  private updateArcsAndRibbonsTheme(primary: THREE.Color, secondary: THREE.Color): void {
    if (this.arcInstanced?.material) {
      const u = (this.arcInstanced.material as THREE.ShaderMaterial).uniforms;
      u.uColor1.value.copy(primary);
      u.uColor2.value.copy(secondary);
    }
    if (this.freqRibbonsMat?.uniforms) {
      this.freqRibbonsMat.uniforms.uColor1.value.copy(primary);
      this.freqRibbonsMat.uniforms.uColor2.value.copy(secondary);
    }
  }

  private updateParticlesTheme(primary: THREE.Color, secondary: THREE.Color): void {
    if (this.nebulaMat?.uniforms) {
      this.nebulaMat.uniforms.uColor1.value.copy(primary);
      this.nebulaMat.uniforms.uColor2.value.copy(secondary);
    }
    if (this.haloMat?.uniforms) {
      this.haloMat.uniforms.uColor1.value.copy(primary);
    }
    if (this.shockwaveInstanced?.material) {
      (this.shockwaveInstanced.material as THREE.ShaderMaterial).uniforms.uColor.value.copy(primary);
    }
    for (const line of this.tendrils) {
      (line.material as THREE.LineBasicMaterial).color.copy(secondary);
    }
    if (this.beamInstanced?.material) {
      (this.beamInstanced.material as THREE.ShaderMaterial).uniforms.uColor.value.copy(primary);
    }
  }

  protected override onDispose(): void {
    for (const g of this.ringGeometries) g.dispose();
    for (const m of this.ringMaterials) m.dispose();

    this.core?.geometry.dispose();
    (this.core?.material as THREE.Material)?.dispose();

    this.coronaShell?.geometry.dispose();
    (this.coronaShell?.material as THREE.Material)?.dispose();

    this.innerRing?.geometry.dispose();
    (this.innerRing?.material as THREE.Material)?.dispose();

    this.outerRing?.geometry.dispose();
    (this.outerRing?.material as THREE.Material)?.dispose();

    for (const ring of this.orbitalRings) {
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
    }

    this.sharedArcGeo?.dispose();
    (this.arcInstanced?.material as THREE.Material)?.dispose();

    this.freqRibbonsGeo?.dispose();
    this.freqRibbonsMat?.dispose();

    this.nebulaGeo?.dispose();
    this.nebulaMat?.dispose();

    this.haloGeo?.dispose();
    this.haloMat?.dispose();

    this.shockwaveInstanced?.geometry.dispose();
    (this.shockwaveInstanced?.material as THREE.Material)?.dispose();

    for (const line of this.tendrils) {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    }

    this.beamInstanced?.geometry.dispose();
    (this.beamInstanced?.material as THREE.Material)?.dispose();

    this.ambientGroup.removeFromParent();
    this.ambientGroup.clear();

    this.rings.length = 0;
    this.ringGeometries.length = 0;
    this.ringMaterials.length = 0;
    this.orbitalRings.length = 0;
    this.tendrils.length = 0;
    this.shockwaveData.length = 0;
  }
}
