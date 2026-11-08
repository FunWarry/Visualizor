import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform float uTime;
  uniform float uBass;
  uniform float uMid;
  uniform float uTreble;
  uniform float uZoom;
  uniform vec3 uPrimary;
  uniform vec3 uSecondary;
  uniform vec3 uAccent;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float geissNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  float geissFbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 q = p;
    for (int i = 0; i < 4; i++) {
      v += a * geissNoise(q);
      q *= 2.05;
      a *= 0.5;
    }
    return v;
  }

  vec2 inverseVortexWarp(vec2 p, float t, float zoomAmt) {
    vec2 accum = vec2(0.0);
    float wSum = 0.0;

    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float ts = t + fi * 1.7;
      vec2 c = vec2(
        0.42 * sin(ts * 0.19 + fi * 2.1) + 0.14 * cos(ts * 0.27 + fi),
        0.36 * cos(ts * 0.21 + fi * 1.7) + 0.12 * sin(ts * 0.33 + fi * 1.3)
      );

      vec2 d = p - c;
      float r = length(d);
      float a = atan(d.y, d.x);

      float zoom = 1.0 + zoomAmt * (0.012 + uBass * 0.035) + 0.006 * sin(ts * 0.35 + fi * 1.9);
      float omega = (0.35 + uMid * 0.55) / (r * r + 0.06);

      a -= omega * 0.032;
      r /= max(0.01, zoom);
      vec2 warped = c + r * vec2(cos(a), sin(a));

      float w = exp(-r * 1.4);
      accum += warped * w;
      wSum += w;
    }

    return accum / max(wSum, 1e-4);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);

    vec2 warped = inverseVortexWarp(p, uTime * 0.4, uZoom);
    float veins = pow(geissFbm(warped * 2.8 + vec2(uTime * 0.04, -uTime * 0.03)), 1.4);
    float ripple = sin(warped.x * 4.5 + uTime * 0.6) * sin(warped.y * 3.6 - uTime * 0.5);
    float structure = veins * 0.7 + ripple * 0.3;

    float logSpiral = sin(atan(warped.y, warped.x) * 4.0 + log(r + 0.01) * uZoom - uTime * 2.0);
    float pattern = structure * 0.5 + logSpiral * 0.5;

    // Authentic Geiss icy feedback & duo/mono mapping
    vec3 iceCyan = vec3(0.18, 0.82, 1.0);
    vec3 col = mix(uPrimary, iceCyan, smoothstep(-0.4, 0.7, pattern));
    col = mix(col, uSecondary, smoothstep(0.2, 0.9, pattern) * (0.7 + uTreble * 0.5));
    col = mix(col, uAccent, smoothstep(0.6, 1.0, structure) * (0.8 + uBass));

    // Vortex center eye glow
    float eye = exp(-r * 2.5) * (0.4 + uBass * 0.8);
    col += mix(uAccent, vec3(1.0), 0.4) * eye;

    // Dark peripheral vignette
    col *= clamp(1.4 - r * 0.7, 0.0, 1.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class GeissPreset extends BasePreset {
  public override readonly id = 'geiss';
  public override readonly name = 'Geiss';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Authentic Geiss feedback diffusion engine with logarithmic spiral vortices and FBM veins.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Drift Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Vortex Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Vortex Zoom', min: 1.0, max: 5.0, step: 0.2, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.PlaneGeometry(24, 18, 64, 64);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uZoom: { value: 2.5 },
        uPrimary: { value: new THREE.Color(ctx.theme.primary) },
        uSecondary: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = -2;
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const zoom = this.paramStore.getValue('density');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uZoom.value = zoom;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uPrimary.value.set(theme.primary);
    this.material.uniforms.uSecondary.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
