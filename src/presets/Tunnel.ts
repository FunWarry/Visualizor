import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class TunnelPreset extends BasePreset {
  public override readonly id = 'tunnel';
  public override readonly name = 'Tunnel';
  public override readonly category = 'Tunnels' as const;
  public override readonly description = 'Infinite depth perspective portal corridor.';

  private tunnelMesh!: THREE.Mesh;
  private tunnelMaterial!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Surge Speed', min: 0.2, max: 3.0, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Wall Undulation', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Tunnel Radius', min: 2.0, max: 6.0, step: 0.2, defaultValue: 3.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const radius = this.paramStore.getValue('density');
    const geom = new THREE.CylinderGeometry(radius, radius, 40, 32, 64, true);
    geom.rotateX(Math.PI / 2);

    this.tunnelMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
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
          float undulation = sin(p.z * 0.5 + uTime * 4.0) * 0.25 * (1.0 + uBass * 1.5);
          p.xy += normal.xy * undulation;
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          float zFlow = fract(vUv.y * 6.0 - uTime * 1.5);
          float rings = smoothstep(0.4, 0.45, zFlow) - smoothstep(0.55, 0.6, zFlow);
          float strips = sin(vUv.x * 24.0);

          vec3 col = mix(uColor1, uColor2, sin(vPos.z * 0.1 + uTime) * 0.5 + 0.5);
          col += uAccent * rings * (0.8 + uBass);
          col += uColor1 * smoothstep(0.7, 0.9, strips) * (0.4 + uTreble);

          float fog = smoothstep(-35.0, -10.0, vPos.z);
          gl_FragColor = vec4(col, fog * 0.9);
        }
      `
    });

    this.tunnelMesh = new THREE.Mesh(geom, this.tunnelMaterial);
    this.group.add(this.tunnelMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');

    this.tunnelMaterial.uniforms.uTime.value = time * speed;
    this.tunnelMaterial.uniforms.uBass.value = audio.bass * reactivity;
    this.tunnelMaterial.uniforms.uTreble.value = audio.treble * reactivity;

    this.tunnelMesh.rotation.z += delta * (0.3 + audio.mid * 0.4) * speed;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.tunnelMaterial.uniforms.uColor1.value.set(theme.primary);
    this.tunnelMaterial.uniforms.uColor2.value.set(theme.secondary);
    this.tunnelMaterial.uniforms.uAccent.value.set(theme.accent);
  }
}
