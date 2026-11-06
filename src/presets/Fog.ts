import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class FogPreset extends BasePreset {
  public override readonly id = 'fog';
  public override readonly name = 'Fog';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Fractional Brownian motion (fBm) domain-warped mist.';
  public override cameraConfig = {
    position: [0, 0, 8] as [number, number, number],
    target: [0, 0, -10] as [number, number, number],
    autoRotate: false
  };

  private readonly mistPlanes: THREE.Mesh[] = [];
  private readonly materials: THREE.ShaderMaterial[] = [];
  private readonly numLayers = 5;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Mist Drift Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Density Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Mist Density', min: 0.3, max: 1.0, step: 0.05, defaultValue: 0.65 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    this.mistPlanes.length = 0;
    this.materials.length = 0;

    for (let i = 0; i < this.numLayers; i++) {
      const geom = new THREE.PlaneGeometry(24, 16, 32, 32);
      const z = -i * 3.5;

      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uBass: { value: 0 },
          uLayer: { value: i },
          uColor1: { value: new THREE.Color(ctx.theme.primary) },
          uColor2: { value: new THREE.Color(ctx.theme.secondary) }
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
          uniform float uLayer;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          varying vec2 vUv;

          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
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
            for (int k = 0; k < 3; k++) {
              v += a * noise(p);
              p *= 2.0;
              a *= 0.5;
            }
            return v;
          }

          void main() {
            vec2 p = vUv * 3.0 + vec2(uTime * (0.1 + uLayer * 0.05), uTime * 0.03);
            float f = fbm(p + fbm(p + uBass * 0.5));
            float alpha = smoothstep(0.3, 0.75, f) * (0.35 + uBass * 0.3);
            vec3 col = mix(uColor1, uColor2, f);
            gl_FragColor = vec4(col, alpha);
          }
        `
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.z = z;
      this.mistPlanes.push(mesh);
      this.materials.push(mat);
      this.group.add(mesh);
    }
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    for (const mat of this.materials) {
      mat.uniforms.uTime.value = time * speed;
      mat.uniforms.uBass.value = audio.bass * reactivity;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    for (const mat of this.materials) {
      mat.uniforms.uColor1.value.set(theme.primary);
      mat.uniforms.uColor2.value.set(theme.secondary);
    }
  }
}
