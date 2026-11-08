import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const SLIDE_VERT = `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  uniform float uTime;
  uniform float uBass;

  void main() {
    vUv = uv;
    vec3 p = position;
    float ripple = sin(uv.x * 24.0 + uTime * 4.0) * cos(uv.y * 32.0 - uTime * 6.0) * 0.08 * (1.0 + uBass * 1.5);
    p += normal * ripple;
    vPos = p;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
    vViewDir = -normalize(mvPos.xyz);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const SLIDE_FRAG = `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uAccent;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uTravel;
  uniform float uWaveAmount;
  uniform float uWallTexture;
  uniform float uRingDens;

  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  vec2 ringBands(float z, float dens, float w) {
    w = max(w, 1e-4);
    float freq = dens * 6.28318530;
    float arg = freq * w;
    float sinc = abs(arg) < 1e-3 ? 1.0 : sin(arg) / arg;
    float c = 0.5 + 0.5 * cos(freq * z) * sinc;
    float soft = clamp(dens * w * 1.7, 0.0, 1.0);
    float sharp = mix(18.0, 2.8, soft);
    float light = pow(max(c, 0.0), sharp);
    light += exp(-(1.0 - c) * mix(20.0, 6.5, soft)) * mix(0.12, 0.035, soft);
    light = clamp(light, 0.0, 1.0);
    float dark = pow(max(1.0 - c, 0.0), mix(2.0, 1.1, soft));
    return vec2(light, dark);
  }

  vec3 wallSurface(vec2 n2, float z, float darkAmt, vec3 wallDark, vec3 wallMid, vec3 accent) {
    vec3 base = mix(wallDark * 1.05, wallMid * 0.85, 0.5 + 0.5 * darkAmt);
    if (uWallTexture < 0.5) return base;

    vec2 uv = n2 * 2.15 + vec2(z * 0.42, z * 0.58 + uTravel * 0.4);
    float c1 = fbm(uv);
    float c2 = fbm(uv * 2.4 + vec2(1.7, 3.1));
    float streak = fbm(vec2(dot(n2, vec2(0.7, 0.7)), z * 1.85 - uTravel * 0.6));
    float m = c1 * 0.5 + c2 * 0.35 + streak * 0.15;

    vec3 pale = mix(uColor1, uColor2, 0.42) * 0.72 + vec3(0.12);
    vec3 deep = mix(accent * 0.22, pale * 0.38, 0.55);
    vec3 frost = mix(deep, pale, smoothstep(0.22, 0.78, m));
    frost += (hash(n2 * 48.0 + z * 0.7) - 0.5) * 0.055 * accent;

    return mix(base, frost, 0.9);
  }

  void main() {
    float zCoord = -vPos.z + uTravel * 2.0;
    vec2 radial = vNormal.xy;
    float darkAmt = sin(vUv.y * 32.0 + uTravel * 3.0);

    vec3 accent = mix(uColor1, uColor2, 0.5);
    vec3 wallDark = mix(vec3(0.008, 0.01, 0.016), accent * 0.07, 0.55);
    vec3 wallMid = mix(vec3(0.02, 0.025, 0.035), accent * 0.16, 0.5);

    vec3 surface = wallSurface(radial, zCoord, darkAmt, wallDark, wallMid, accent);

    vec2 bands = ringBands(zCoord, uRingDens, 0.04);
    float light = bands.x * smoothstep(80.0, 10.0, -vPos.z);

    vec3 ringCol = mix(uColor1, uColor2, 0.5 + 0.5 * sin(zCoord * 0.2 + uTime * 0.08));
    ringCol *= 1.25 + uTreble * 0.35;

    surface = mix(surface, ringCol * 2.45, light);
    surface += ringCol * light * 0.75 * (0.85 + uTreble * 0.4);

    float fres = pow(clamp(1.0 - max(dot(vViewDir, -vNormal), 0.0), 0.0, 1.0), 2.6);
    surface += ringCol * fres * 0.25 * (0.2 + light);

    float fog = exp(vPos.z * 0.025);
    vec3 col = surface * fog;

    float vig = 1.0 - dot(vUv * 2.0 - 1.0, vUv * 2.0 - 1.0) * 0.25;
    col *= clamp(vig, 0.25, 1.0);

    col = col / (col + 0.7);
    col = pow(max(col, 0.0), vec3(0.92));

    gl_FragColor = vec4(col, 0.92);
  }
`;

export class WaterSlidePreset extends BasePreset {
  public override readonly id = 'waterslide';
  public override readonly name = 'Water Slide';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = '3D serpentine water tube corridor with camera spline tracking.';
  public override cameraConfig = {
    position: [0, 0, 3] as [number, number, number],
    target: [0, 0, -50] as [number, number, number],
    autoRotate: false
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;

  private smoothBass = 0.0;
  private smoothMid = 0.0;
  private smoothTreble = 0.0;
  private smoothAvg = 0.0;
  private travel = 0.0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Ride Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Spline Curvature', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'waveAmount', name: 'Wave Distortion', min: 0.1, max: 2.0, step: 0.1, defaultValue: 0.5 },
      { id: 'wallTexture', name: 'Caustic Walls', min: 0.0, max: 1.0, step: 1.0, defaultValue: 1.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 50; i++) {
      const z = -i * 2.0;
      const x = Math.sin(z * 0.32) * 1.2 + Math.sin(z * 0.13 + 1.3) * 0.55;
      const y = Math.cos(z * 0.24 + 0.5) * 0.85 + Math.sin(z * 0.18 + 2.1) * 0.5;
      points.push(new THREE.Vector3(x * 1.8, y * 1.8, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 100, 2.2, 32, false);

    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      vertexShader: SLIDE_VERT,
      fragmentShader: SLIDE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uTravel: { value: 0 },
        uWaveAmount: { value: 0.5 },
        uWallTexture: { value: 1.0 },
        uRingDens: { value: 1.0 }
      }
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const waveAmount = this.paramStore.getValue('waveAmount');
    const wallTexture = this.paramStore.getValue('wallTexture');

    this.updateAudioSmoothing(audio, reactivity);

    const traverseRate = 0.55 + speed * 3.3;
    this.travel += delta * traverseRate * (1.0 + this.smoothBass * 0.45);

    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uBass.value = this.smoothBass;
    u.uMid.value = this.smoothMid;
    u.uTreble.value = this.smoothTreble;
    u.uTravel.value = this.travel;
    u.uWaveAmount.value = waveAmount;
    u.uWallTexture.value = wallTexture;

    this.mesh.rotation.z += delta * (0.2 + audio.treble * 0.3) * speed;
  }

  private updateAudioSmoothing(audio: AudioFeatures, reactivity: number): void {
    const b = audio.bass * reactivity;
    const m = audio.mid * reactivity;
    const tr = audio.treble * reactivity;
    const avg = audio.rms * reactivity;

    this.smoothBass += (b - this.smoothBass) * (b > this.smoothBass ? 0.1 : 0.04);
    this.smoothMid += (m - this.smoothMid) * (m > this.smoothMid ? 0.1 : 0.04);
    this.smoothTreble += (tr - this.smoothTreble) * (tr > this.smoothTreble ? 0.1 : 0.04);
    this.smoothAvg += (avg - this.smoothAvg) * (avg > this.smoothAvg ? 0.1 : 0.04);
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
  }
}
