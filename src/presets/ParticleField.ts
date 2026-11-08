import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const SWARM_VERTEX_SHADER = `
  attribute float size;
  attribute float aRandom;
  attribute float aLayer;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uKick;
  uniform float uOrbitSpeed;
  uniform float uSpread;

  varying float vAlpha;
  varying float vRandom;
  varying float vLayer;
  varying float vDist;

  void main() {
    vRandom = aRandom;
    vLayer = aLayer;
    vec3 pos = position;

    float speed = 0.03 + uOrbitSpeed * 0.3 + aRandom * 0.15;
    float angle = uTime * speed * (1.0 + aLayer * 0.5);
    float r = length(pos.xz);
    float currentAngle = atan(pos.z, pos.x) + angle;
    pos.x = cos(currentAngle) * r;
    pos.z = sin(currentAngle) * r;

    float bassPulse = (uKick * 2.2 + uBass * 0.45) * sin(uTime * 3.0 + aRandom * 6.28);
    float midDisplace = uMid * 0.35 * cos(pos.y * 1.5 + uTime * 2.0);
    float expansion = 1.0 + bassPulse * 0.25 * (1.0 + aLayer * 0.4);

    pos.xz *= expansion * (0.8 + uSpread * 0.4);
    pos.y += midDisplace + sin(uTime * 1.5 + r * 0.5) * 0.2 * uTreble;

    vDist = length(pos);
    vAlpha = (0.3 + 0.7 * (1.0 - smoothstep(1.0, 14.0, vDist))) * (0.5 + 0.5 * sin(uTime * 1.5 + aRandom * 6.28));
    vAlpha *= 0.6 + uBass * 0.6;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;

    float pSize = size * (1.0 + uBass * 0.8) * (180.0 / max(-mvPos.z, 0.1));
    gl_PointSize = clamp(pSize, 1.0, 48.0);
  }
`;

const SWARM_FRAGMENT_SHADER = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;

  varying float vAlpha;
  varying float vRandom;
  varying float vLayer;
  varying float vDist;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    float d = length(center);

    float core = exp(-d * 10.0);
    float glow = exp(-d * 4.0) * 0.5;
    float shape = core + glow;
    shape *= smoothstep(0.5, 0.2, d);

    float alpha = shape * vAlpha;
    if (alpha < 0.005) discard;

    vec3 innerColor = uColor1 * 1.2;
    vec3 outerColor = uColor2 * 0.9;
    vec3 color = mix(innerColor, outerColor, vLayer);

    color *= 0.85 + 0.15 * sin(uTime * 2.0 + vRandom * 6.28);
    color = mix(color, vec3(1.0), core * 0.2);

    gl_FragColor = vec4(color, alpha * 0.85);
  }
`;

export class ParticleFieldPreset extends BasePreset {
  public override readonly id = 'particles';
  public override readonly name = 'Particles';
  public override readonly category = 'Particles & Light' as const;
  public override readonly description = 'Multi-layered orbital particle vortex with relativistic audio pulses and core halo.';
  public override cameraConfig = {
    position: [0, 6, 16] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.25
  };

  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.ShaderMaterial;
  private coreMesh!: THREE.Mesh;
  private coreMaterial!: THREE.MeshBasicMaterial;

  private readonly count = 6000;
  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Swirl Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'particleScale', name: 'Particle Size', min: 0.05, max: 0.5, step: 0.01, defaultValue: 0.16 },
      { id: 'density', name: 'Particle Density', min: 0.2, max: 1.0, step: 0.1, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    const randoms = new Float32Array(this.count);
    const layers = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      const layer = Math.random();
      layers[i] = layer;

      // Concentric cloud layers from inner core (radius 1.5) to outer nebula (radius 12.0)
      const radius = 1.5 + Math.pow(Math.random(), 0.7) * 11.0;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.8;

      positions[i * 3] = radius * Math.cos(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * 0.55;
      positions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);

      sizes[i] = 0.4 + Math.random() * 1.2;
      randoms[i] = Math.random();
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    this.geometry.setAttribute('aLayer', new THREE.BufferAttribute(layers, 1));

    const primaryColor = new THREE.Color(ctx.theme.primary);
    const accentColor = new THREE.Color(ctx.theme.accent);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uBass: { value: 0.0 },
        uMid: { value: 0.0 },
        uTreble: { value: 0.0 },
        uKick: { value: 0.0 },
        uOrbitSpeed: { value: 0.5 },
        uSpread: { value: 0.5 },
        uColor1: { value: primaryColor },
        uColor2: { value: accentColor }
      },
      vertexShader: SWARM_VERTEX_SHADER,
      fragmentShader: SWARM_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    this.group.add(this.points);

    // Subtle central stellar core
    const coreGeom = new THREE.SphereGeometry(0.8, 24, 24);
    this.coreMaterial = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.coreMesh = new THREE.Mesh(coreGeom, this.coreMaterial);
    this.group.add(this.coreMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    if (!this.points || !this.material) return;

    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const density = this.paramStore.getValue('density');

    const activeCount = density <= 0 ? 0 : Math.floor(this.count * Math.min(1.0, density));
    this.geometry.setDrawRange(0, activeCount);
    if (this.points) this.points.visible = density > 0;

    const bassIn = audio.bass * reactivity;
    const midIn = audio.mid * reactivity;
    const trebleIn = audio.treble * reactivity;

    this.smoothBass += (bassIn - this.smoothBass) * 0.15;
    this.smoothMid += (midIn - this.smoothMid) * 0.12;
    this.smoothTreble += (trebleIn - this.smoothTreble) * 0.15;

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uBass.value = this.smoothBass;
    this.material.uniforms.uMid.value = this.smoothMid;
    this.material.uniforms.uTreble.value = this.smoothTreble;
    this.material.uniforms.uKick.value = audio.beat ? 1.0 : (audio.beatEnergy * reactivity);
    this.material.uniforms.uOrbitSpeed.value = speed * 0.6;
    this.material.uniforms.uSpread.value = 0.5 + this.smoothBass * 0.5;

    // Core pulse
    if (this.coreMesh) {
      const coreScale = 1.0 + this.smoothBass * 0.8 + (audio.beat ? 0.4 : 0);
      this.coreMesh.scale.setScalar(coreScale);
      this.coreMaterial.opacity = 0.35 + this.smoothBass * 0.45;
    }

    // Outer slow rotation
    this.group.rotation.y += delta * 0.1 * speed;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    const primary = new THREE.Color(theme.primary);
    const accent = new THREE.Color(theme.accent);

    if (this.material?.uniforms) {
      this.material.uniforms.uColor1.value.copy(primary);
      this.material.uniforms.uColor2.value.copy(accent);
    }
    if (this.coreMaterial) {
      this.coreMaterial.color.copy(primary);
    }
  }

  protected override onDispose(): void {
    this.geometry?.dispose();
    this.material?.dispose();
    if (this.coreMesh) {
      this.coreMesh.geometry.dispose();
      this.coreMaterial?.dispose();
    }
  }
}
