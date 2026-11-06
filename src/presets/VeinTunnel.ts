import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class VeinTunnelPreset extends BasePreset {
  public override readonly id = 'veintunnel';
  public override readonly name = 'Vein Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = 'Vascular cylinder lined with neon blood capillary contractions.';
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
      { id: 'speed', name: 'Contraction Pulse', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Vascular Swell', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Capillary Density', min: 8.0, max: 32.0, step: 2.0, defaultValue: 16.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < 40; i++) {
      const z = -i * 2.0;
      const x = Math.sin(i * 0.25) * 2.5;
      const y = Math.cos(i * 0.2) * 2.0;
      points.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 100, 2.5, 24, false);

    this.material = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uCapillary: { value: 16.0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;

        void main() {
          vUv = uv;
          vec3 p = position;
          // Peristaltic vascular contraction wave
          float peristalsis = sin(p.z * 0.4 + uTime * 4.0) * 0.2 * (1.0 + uBass * 1.6);
          p += normal * peristalsis;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uCapillary;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec2 flowUv = vec2(vUv.x * uCapillary, vUv.y * 12.0 - uTime * 3.0);
          float spiral = sin(flowUv.x + flowUv.y);
          float rings = sin(vUv.y * 40.0 - uTime * 5.0);

          vec3 col = mix(uColor1, uColor2, smoothstep(0.2, 0.8, spiral * rings));
          col += uColor2 * (pow(abs(spiral), 4.0) * (0.6 + uBass));

          gl_FragColor = vec4(col, 0.9);
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const capillary = this.paramStore.getValue('density');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uCapillary.value = capillary;

    this.mesh.rotation.z += delta * 0.25 * speed;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
  }
}
