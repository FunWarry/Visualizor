import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class TieDyePreset extends BasePreset {
  public override readonly id = 'tiedye';
  public override readonly name = 'Tie Dye';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Psychedelic spiral fabric shader with color advection.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Twist Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Advection Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Spiral Arms', min: 2.0, max: 12.0, step: 1.0, defaultValue: 6.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.PlaneGeometry(24, 18, 64, 64);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uArms: { value: 6.0 },
        uPrimary: { value: new THREE.Color(ctx.theme.primary) },
        uSecondary: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
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
        uniform float uMid;
        uniform float uArms;
        uniform vec3 uPrimary;
        uniform vec3 uSecondary;
        uniform vec3 uAccent;
        varying vec2 vUv;

        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);
          float a = atan(p.y, p.x);

          // Domain-warped logarithmic spiral
          float spiral = sin(a * uArms + r * 8.0 - uTime * 2.0 + sin(r * 4.0 - uTime) * (1.0 + uBass * 1.5));
          float wave = cos(r * 12.0 - uTime * 3.0 + a * 2.0);

          float t = spiral * 0.5 + wave * 0.5 + uMid * 0.3;

          // 3-way chromatic dye blend
          vec3 col = mix(uPrimary, uSecondary, sin(t * 3.1415 + uTime) * 0.5 + 0.5);
          col = mix(col, uAccent, clamp(spiral * wave + 0.3, 0.0, 1.0));

          gl_FragColor = vec4(col, 1.0);
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
    const arms = this.paramStore.getValue('density');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uMid.value = audio.mid * reactivity;
    this.material.uniforms.uArms.value = arms;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uPrimary.value.set(theme.primary);
    this.material.uniforms.uSecondary.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
}
