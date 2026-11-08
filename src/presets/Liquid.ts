import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class LiquidPreset extends BasePreset {
  public override readonly id = 'liquid';
  public override readonly name = 'Liquid';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Flowing chromatic liquid caustic pool distortion shader with color advection.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private onResizeHandler?: () => void;

  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private smoothAvg = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Flow Velocity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Turbulence Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Viscosity Scale', min: 1.0, max: 5.0, step: 0.2, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geom = new THREE.PlaneGeometry(28, 18);

    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uAudio: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) },
        uReflectionSharpness: { value: 0.6 },
        uPoolSurface: { value: 1.0 },
        uFlowSpeed: { value: 0.4 },
        uCausticWarp: { value: 0.5 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform float uAudio;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec2 uResolution;
        uniform float uReflectionSharpness;
        uniform float uPoolSurface;
        uniform float uFlowSpeed;
        uniform float uCausticWarp;
        varying vec2 vUv;

        // Hash and Simplex Noise
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m;
          m = m*m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        float hash1(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        vec2 hash2(vec2 p) {
          return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453);
        }

        float voronoiCellDist(vec2 p) {
          vec2 n = floor(p);
          vec2 f = fract(p);
          float md = 8.0;
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.5 * sin(o * 6.2831);
              vec2 r = g + o - f;
              float d = dot(r, r);
              md = min(md, d);
            }
          }
          return sqrt(md);
        }

        float causticLayer(vec2 uv, float scale, vec2 offset) {
          vec2 p = uv * scale + offset;
          vec2 n = floor(p);
          vec2 f = fract(p);
          float md = 8.0;
          float md2 = 8.0;
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec2 g = vec2(float(i), float(j));
              vec2 o = hash2(n + g);
              o = 0.5 + 0.5 * sin(o * 6.2831853 + offset);
              vec2 r = g + o - f;
              float d = dot(r, r);
              if (d < md) {
                md2 = md;
                md = d;
              } else if (d < md2) {
                md2 = d;
              }
            }
          }
          return sqrt(md2) - sqrt(md);
        }

        float poolBottomGrit(vec2 uv) {
          vec2 fineUv = uv * 520.0;
          vec2 coarseUv = uv * 62.0 + 11.7;
          vec2 scratchUv = vec2(uv.x * 920.0 + uv.y * 18.0, uv.y * 14.0 - uv.x * 40.0);
          float fine = hash1(floor(fineUv));
          float coarse = hash1(floor(coarseUv));
          float scratch = hash1(floor(scratchUv));
          float streak = smoothstep(0.92, 1.0, abs(sin(uv.x * 140.0 + hash1(floor(uv * 24.0)) * 6.28)));
          return fine * 0.5 + coarse * 0.32 + scratch * 0.28 + streak * 0.18;
        }

        vec3 themeCausticColor(vec3 c1, vec3 c2) {
          vec3 base = mix(c1, c2, 0.28);
          float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
          vec3 saturated = mix(vec3(lum), base, 1.55);
          return saturated * 1.12;
        }

        void main() {
          vec2 st = (vUv - 0.5) * 4.0;
          if (uResolution.y > 0.0) {
            st.x *= uResolution.x / uResolution.y;
          }

          float speed = mix(0.08, 2.0, uFlowSpeed);
          float t = uTime * speed;

          float warpAmp = mix(0.02, 0.18, uCausticWarp);
          float caustWarp = mix(0.02, 0.14, uCausticWarp);

          float noiseTime = t * (0.2 + uMid * 0.06);
          vec2 noiseCoord = st * 3.0;
          float n = snoise(noiseCoord + vec2(noiseTime));
          float n2 = snoise(noiseCoord * 2.0 - vec2(noiseTime * 1.5));

          float distortAmp = warpAmp + uBass * 0.04 * uCausticWarp;
          vec2 distortedUV = st + vec2(n, n2) * distortAmp;

          float s = uReflectionSharpness;
          float baseScale = mix(5.0, 14.0, s);

          vec2 caustUV = distortedUV;
          caustUV += vec2(snoise(caustUV * 2.0 + t), snoise(caustUV * 2.0 - t + 4.0)) * caustWarp;

          float cellDist = voronoiCellDist(caustUV * baseScale * 0.85 + vec2(t * 0.05, -t * 0.04));
          float cellInterior = 1.0 - smoothstep(0.0, 0.4, cellDist);

          vec3 deepWater = uColor2 * 0.30;
          vec3 shallowWater = mix(uColor1, uColor2, 0.45) * 0.55;
          vec3 waterBody = mix(deepWater, shallowWater, cellInterior);

          float marble = snoise(distortedUV * 2.0 + t * (0.1 + uMid * 0.03)) * 0.5 + 0.5;
          waterBody = mix(waterBody, shallowWater, marble * 0.18);

          vec2 gritUV = distortedUV;
          float grit = poolBottomGrit(gritUV);
          waterBody *= mix(1.0, 0.78 + grit * 0.34, uPoolSurface);
          waterBody += (grit - 0.5) * 0.06 * uPoolSurface * mix(deepWater, shallowWater, 0.5);

          float c = causticLayer(caustUV, baseScale, vec2(t * 0.4, t * 0.25)) * 0.55 +
                    causticLayer(caustUV, baseScale * 1.45, vec2(-t * 0.3, t * 0.5)) * 0.35 +
                    causticLayer(caustUV, baseScale * 2.1, vec2(t * 0.22, -t * 0.35)) * 0.20;

          c = pow(max(c, 0.0), mix(0.30, 1.15, s));
          c = smoothstep(mix(0.0, 0.08, 1.0 - s), 1.0, c);

          float causticStrength = mix(0.45, 1.25, s) * (1.0 + uAudio * 0.25 + uBass * 0.35);
          vec3 causticCol = themeCausticColor(uColor1, uColor2);
          vec3 finalColor = waterBody + causticCol * c * causticStrength;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.z = -5;
    this.group.add(this.mesh);

    if (typeof window !== 'undefined') {
      this.onResizeHandler = () => {
        this.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      };
      window.addEventListener('resize', this.onResizeHandler);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.smoothBass += (audio.bass - this.smoothBass) * Math.min(1, delta * 12);
    this.smoothMid += (audio.mid - this.smoothMid) * Math.min(1, delta * 10);
    this.smoothTreble += (audio.treble - this.smoothTreble) * Math.min(1, delta * 14);
    this.smoothAvg += (audio.rms - this.smoothAvg) * Math.min(1, delta * 10);

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = this.smoothBass * reactivity;
    this.material.uniforms.uMid.value = this.smoothMid * reactivity;
    this.material.uniforms.uTreble.value = this.smoothTreble * reactivity;
    this.material.uniforms.uAudio.value = this.smoothAvg * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.onResizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResizeHandler);
    }
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
}
