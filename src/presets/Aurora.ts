import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class AuroraPreset extends BasePreset {
  public override readonly id = 'aurora';
  public override readonly name = 'Aurora';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Undulating ethereal northern light curtains in upper atmosphere.';
  public override cameraConfig = {
    position: [0, 3, 11] as [number, number, number],
    target: [0, 1, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.2
  };

  private auroraMesh!: THREE.Mesh;
  private auroraMaterial!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Curtain Wave Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Wind Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Curtain Height', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const auroraGeom = new THREE.PlaneGeometry(28, 14, 70, 35);
    this.auroraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uMid: { value: 0 },
        uHeight: { value: 1.5 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uTreble;
        uniform float uMid;
        uniform float uHeight;

        void main() {
          vUv = uv;
          vec3 p = position;
          p.z += sin(p.x * 0.4 + uTime * 2.0) * uHeight * (1.0 + uMid);
          p.z += cos(p.y * 0.8 + uTime * 2.5) * 0.8 * (1.0 + uTreble);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float curtainGradient = smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.65, vUv.y);
          vec3 col = mix(uColor1, uColor2, sin(vPos.x * 0.3 + vUv.y * 3.0) * 0.5 + 0.5);
          gl_FragColor = vec4(col, curtainGradient * 0.8);
        }
      `
    });

    this.auroraMesh = new THREE.Mesh(auroraGeom, this.auroraMaterial);
    this.auroraMesh.position.z = -3;
    this.group.add(this.auroraMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const height = this.paramStore.getValue('density');

    this.auroraMaterial.uniforms.uTime.value = time * speed;
    this.auroraMaterial.uniforms.uTreble.value = audio.treble * reactivity;
    this.auroraMaterial.uniforms.uMid.value = audio.mid * reactivity;
    this.auroraMaterial.uniforms.uHeight.value = height;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.auroraMaterial.uniforms.uColor1.value.set(theme.primary);
    this.auroraMaterial.uniforms.uColor2.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.auroraMesh) {
      this.auroraMesh.geometry.dispose();
      this.auroraMaterial.dispose();
    }
  }
}
