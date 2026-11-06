import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class LiquidPreset extends BasePreset {
  public override readonly id = 'liquid';
  public override readonly name = 'Liquid';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Flowing chromatic liquid distortion shader with color advection.';
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
      { id: 'speed', name: 'Flow Velocity', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Turbulence Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Viscosity Scale', min: 1.0, max: 5.0, step: 0.2, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geom = new THREE.PlaneGeometry(28, 18);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
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
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;

        vec3 hash3(vec2 p) {
          vec3 q = vec3(dot(p, vec2(127.1, 311.7)), 
                        dot(p, vec2(269.5, 183.3)), 
                        dot(p, vec2(419.2, 371.9)));
          return fract(sin(q) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(dot(hash3(i + vec2(0.0,0.0)).xy, f - vec2(0.0,0.0)),
                         dot(hash3(i + vec2(1.0,0.0)).xy, f - vec2(1.0,0.0)), u.x),
                     mix(dot(hash3(i + vec2(0.0,1.0)).xy, f - vec2(0.0,1.0)),
                         dot(hash3(i + vec2(1.0,1.0)).xy, f - vec2(1.0,1.0)), u.x), u.y);
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.1 + vec2(1.2, 3.4);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 p = vUv * 4.0 - vec2(2.0);
          vec2 q = vec2(fbm(p + vec2(0.0, uTime * 0.4)),
                        fbm(p + vec2(5.2, 1.3 - uTime * 0.3)));

          vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + 0.15 * uTime * (1.0 + uMid)),
                        fbm(p + 4.0 * q + vec2(8.3, 2.8) + 0.126 * uTime));

          float f = fbm(p + 4.0 * r + uBass * 0.8);

          vec3 col = mix(uColor1, uColor2, clamp(f * f * 4.0, 0.0, 1.0));
          col = mix(col, uAccent, clamp(length(q) * (0.8 + uTreble), 0.0, 1.0));
          col += vec3(0.1, 0.1, 0.2) * (f * f * f * 2.0);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.position.z = -5;
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
}
