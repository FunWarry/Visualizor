import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class MandelFractalPreset extends BasePreset {
  public override readonly id = 'mandel';
  public override readonly name = 'Mandel';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Continuous escape-time Mandelbrot & Julia fractal infinity zoom.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private currentZoom = 1.0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Zoom Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Fractal Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Iteration Depth', min: 20.0, max: 64.0, step: 2.0, defaultValue: 40.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geom = new THREE.PlaneGeometry(2, 2);
    const aspect = typeof window !== 'undefined' ? window.innerWidth / Math.max(window.innerHeight, 1) : 1.7778;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uZoom: { value: 1.0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uMaxIter: { value: 40.0 },
        uAspect: { value: aspect },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      depthWrite: false,
      depthTest: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uZoom;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uMaxIter;
        uniform float uAspect;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;

        vec2 complexSquare(vec2 c) {
          return vec2(c.x * c.x - c.y * c.y, 2.0 * c.x * c.y);
        }

        void main() {
          vec2 c = (vUv - 0.5) * vec2(2.5 * (uAspect > 0.0 ? uAspect : 1.7778), 2.5) / uZoom;
          c += vec2(-0.743643887037158704752191506114774, 0.131825904205311970493132056385139);

          vec2 z = c;
          vec2 juliaC = vec2(sin(uTime * 0.2) * 0.3 * (1.0 + uMid), cos(uTime * 0.15) * 0.3);

          float n = 0.0;
          float maxIter = uMaxIter + uTreble * 20.0;

          for (float i = 0.0; i < 64.0; i += 1.0) {
            if (i >= maxIter) break;
            if (dot(z, z) > 4.0) {
              n = i;
              break;
            }
            z = complexSquare(z) + mix(c, juliaC, 0.35 + uMid * 0.2);
          }

          if (n == 0.0) {
            gl_FragColor = vec4(0.01, 0.01, 0.03, 1.0);
          } else {
            float t = n / maxIter;
            vec3 col = mix(uColor1, uColor2, sin(t * 6.28 + uTime * 0.5) * 0.5 + 0.5);
            col = mix(col, uAccent, pow(t, 2.0) * (0.8 + uBass));
            gl_FragColor = vec4(col, 1.0);
          }
        }
      `
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const maxIter = this.paramStore.getValue('density');

    const zoomSpeed = (0.4 + audio.bass * 1.2 * reactivity) * speed;
    this.currentZoom *= 1.0 + delta * zoomSpeed;
    if (this.currentZoom > 500.0) {
      this.currentZoom = 1.0;
    }

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uZoom.value = this.currentZoom;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uMaxIter.value = maxIter;
    if (typeof window !== 'undefined') {
      this.material.uniforms.uAspect.value = window.innerWidth / Math.max(window.innerHeight, 1);
    }
  }

  public resize(width: number, height: number): void {
    if (this.material?.uniforms?.uAspect) {
      this.material.uniforms.uAspect.value = width / Math.max(height, 1);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
  }
}
