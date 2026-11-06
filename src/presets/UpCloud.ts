import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class UpCloudPreset extends BasePreset {
  public override readonly id = 'upcloud';
  public override readonly name = 'Up Cloud';
  public override readonly category = 'Organic & Nature' as const;
  public override readonly description = 'Volumetric sky clouds with silver lining sunlight rim.';
  public override cameraConfig = {
    position: [0, -4, 12] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.0
  };

  private cloudMesh!: THREE.Mesh;
  private cloudMaterial!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Drift Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Cloud Breathing', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Cloud Scale', min: 1.0, max: 5.0, step: 0.2, defaultValue: 3.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const cloudGeom = new THREE.PlaneGeometry(28, 28, 64, 64);
    cloudGeom.rotateX(Math.PI / 2.2);

    this.cloudMaterial = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uBass: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          float billow = sin(p.x * 0.3 + uTime * 0.5) * cos(p.y * 0.3 + uTime * 0.4) * (1.2 + uBass * 1.5);
          p.z += billow;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                     mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }

        void main() {
          vec2 p = vUv * 4.0 + vec2(uTime * 0.08, uTime * 0.04);
          float n = noise(p) * 0.5 + noise(p * 2.0) * 0.25 + noise(p * 4.0) * 0.125;

          // Silver lining highlight rim
          float rim = pow(smoothstep(0.4, 0.75, n), 2.0);
          vec3 col = mix(uColor1 * 0.3, uAccent * 1.5, rim * (0.8 + uTreble * 0.6));

          gl_FragColor = vec4(col, smoothstep(0.2, 0.6, n) * 0.85);
        }
      `
    });

    this.cloudMesh = new THREE.Mesh(cloudGeom, this.cloudMaterial);
    this.cloudMesh.position.y = 3.0;
    this.group.add(this.cloudMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.cloudMaterial.uniforms.uTime.value = time * speed;
    this.cloudMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.cloudMaterial.uniforms.uTreble.value = audio.treble * reactivity;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.cloudMaterial.uniforms.uColor1.value.set(theme.primary);
    this.cloudMaterial.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.cloudMesh) {
      this.cloudMesh.geometry.dispose();
      this.cloudMaterial?.dispose();
    }
  }
}
