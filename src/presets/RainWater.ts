import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class RainWaterPreset extends BasePreset {
  public override readonly id = 'water';
  public override readonly name = 'Rain Water';
  public override readonly category = 'Fluids & Heat' as const;
  public override readonly description = 'Concentric circular rain ripple water surface.';
  public override cameraConfig = {
    position: [0, 8, 16] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private waterPlane!: THREE.Mesh;
  private waterMaterial!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Ripple Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Impact Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Ripple Frequency', min: 2.0, max: 10.0, step: 0.5, defaultValue: 6.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const waterGeom = new THREE.PlaneGeometry(22, 22, 80, 80);
    waterGeom.rotateX(-Math.PI / 2.3);

    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uKickImpact: { value: 0 },
        uFreq: { value: 6.0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uKickImpact;
        uniform float uFreq;

        void main() {
          vUv = uv;
          vec3 p = position;
          
          float dist = length(p.xy);
          float ripple = sin(dist * uFreq - uTime * 4.0) * exp(-dist * 0.22) * (0.25 + uKickImpact * 0.85);
          p.z += ripple;

          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float dist = length(vPos.xy);
          float fresnel = pow(1.0 - abs(dot(normalize(vPos), vec3(0.0, 0.0, 1.0))), 2.0);
          vec3 col = mix(uColor1 * 0.35, uAccent, fresnel * 0.85);
          gl_FragColor = vec4(col, 0.92);
        }
      `
    });

    this.waterPlane = new THREE.Mesh(waterGeom, this.waterMaterial);
    this.group.add(this.waterPlane);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const freq = this.paramStore.getValue('density');

    this.waterMaterial.uniforms.uTime.value = time * speed;
    this.waterMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.waterMaterial.uniforms.uFreq.value = freq;

    if (audio.beat) {
      this.waterMaterial.uniforms.uKickImpact.value = 1.0 * reactivity;
    } else {
      this.waterMaterial.uniforms.uKickImpact.value = Math.max(0.1, this.waterMaterial.uniforms.uKickImpact.value * 0.93);
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.waterMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterMaterial.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.waterPlane) {
      this.waterPlane.geometry.dispose();
      this.waterMaterial?.dispose();
    }
  }
}
