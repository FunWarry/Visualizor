import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class PlasmaArcsPreset extends BasePreset {
  public override readonly id = 'plasmaarcs';
  public override readonly name = 'Plasma Arcs';
  public override readonly category = 'Particles & Light' as const;
  public override readonly description = 'Full-screen dielectric breakdown plasma filament network.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.55
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Filament Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Voltage Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Filament Density', min: 4.0, max: 16.0, step: 1.0, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.PlaneGeometry(24, 18, 64, 64);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uVoltage: { value: 0 },
        uDensity: { value: 8.0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uVoltage;
        uniform float uDensity;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;

        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          float a = atan(p.y, p.x);

          // Dielectric filament breakdown using multi-octave curl noise
          float n1 = sin(a * uDensity + uTime * 3.0 + sin(r * 10.0 - uTime * 4.0));
          float n2 = cos(r * 14.0 - uTime * 5.0 + n1 * 2.0);
          float arc = pow(abs(n1 * n2), 4.0) * (1.0 + uVoltage * 2.0);

          float centralGlow = 0.06 / (r + 0.04) * (0.6 + uVoltage);
          vec3 col = mix(uColor1, uColor2, arc + centralGlow);
          col *= (arc * 2.0 + centralGlow * 1.5);

          gl_FragColor = vec4(col, clamp(arc * 1.2 + centralGlow, 0.0, 1.0));
        }
      `
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.z = -2;
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const density = this.paramStore.getValue('density');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uVoltage.value = (audio.rms * 1.5 + audio.treble * 1.2) * reactivity;
    this.material.uniforms.uDensity.value = density;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.accent);
  }
}
