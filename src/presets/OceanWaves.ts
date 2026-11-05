import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class OceanWavesPreset extends BasePreset {
  public override readonly id = 'ocean';
  public override readonly name = 'Ocean';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'High-res Gerstner ocean waves with sea foam crests.';

  private oceanMesh!: THREE.Mesh;
  private oceanMaterial!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Wave Period', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Swell Amplitude', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Wave Frequency', min: 0.2, max: 1.0, step: 0.05, defaultValue: 0.45 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const oceanGeom = new THREE.PlaneGeometry(24, 24, 64, 64);
    oceanGeom.rotateX(-Math.PI / 2.3);

    this.oceanMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uFreq: { value: 0.45 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;
        uniform float uFreq;

        void main() {
          vUv = uv;
          vec3 p = position;
          
          float w1 = sin(p.x * uFreq + uTime * 2.0) * (0.5 + uBass * 1.2);
          float w2 = cos(p.y * (uFreq * 1.2) + uTime * 2.3) * (0.3 + uBass * 0.8);
          p.z += w1 + w2;

          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float crest = smoothstep(0.4, 0.9, vPos.z * 0.5 + 0.5);
          vec3 col = mix(uColor1 * 0.6, uColor2, vUv.y);
          col = mix(col, uAccent, crest * 0.8);
          gl_FragColor = vec4(col, 0.9);
        }
      `
    });

    this.oceanMesh = new THREE.Mesh(oceanGeom, this.oceanMaterial);
    this.group.add(this.oceanMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const freq = this.paramStore.getValue('density');

    this.oceanMaterial.uniforms.uTime.value = time * speed;
    this.oceanMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.oceanMaterial.uniforms.uFreq.value = freq;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.oceanMaterial.uniforms.uColor1.value.set(theme.primary);
    this.oceanMaterial.uniforms.uColor2.value.set(theme.secondary);
    this.oceanMaterial.uniforms.uAccent.value.set(theme.accent);
  }
}
