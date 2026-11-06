import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

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

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Ride Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Spline Curvature', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Water Translucency', min: 0.3, max: 1.0, step: 0.05, defaultValue: 0.85 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 40; i++) {
      const z = -i * 2.0;
      const x = Math.sin(i * 0.3) * 3.0;
      const y = Math.cos(i * 0.25) * 2.0;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 100, 2.2, 24, false);

    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
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
          float ridge = sin(uv.x * 24.0 + uTime * 3.0) * 0.15 * (1.0 + uBass * 1.5);
          p += normal * ridge;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec2 flowUv = vec2(vUv.x, vUv.y * 8.0 - uTime * 2.5);
          float rings = sin(flowUv.y * 6.28);
          float ribs = sin(vUv.x * 16.0);

          vec3 col = mix(uColor1, uColor2, sin(vPos.z * 0.1 + uTime) * 0.5 + 0.5);
          col = mix(col, uAccent, smoothstep(0.3, 0.9, rings * ribs) * (0.6 + uMid));

          gl_FragColor = vec4(col, 0.85);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;

    this.mesh.rotation.z += delta * (0.2 + audio.treble * 0.3) * speed;
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
