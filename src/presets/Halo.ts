import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class HaloPreset extends BasePreset {
  public override readonly id = 'halo';
  public override readonly name = 'Halo';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Multi-layered blooming corona light disc with harmonic petals.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private discMesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Spin Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Treble Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Petal Count', min: 4.0, max: 16.0, step: 1.0, defaultValue: 8.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.PlaneGeometry(16, 16, 64, 64);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uTreble: { value: 0 },
        uBass: { value: 0 },
        uPetals: { value: 8.0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
      depthWrite: false,
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
        uniform float uTreble;
        uniform float uBass;
        uniform float uPetals;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv - 0.5;
          float r = length(uv) * 2.0;
          float angle = atan(uv.y, uv.x);

          // Harmonic blooming petals
          float petals = cos(angle * uPetals + uTime * 2.0) * (0.15 + uTreble * 0.35);
          float haloDist = abs(r - (0.6 + petals + uBass * 0.2));
          float glow = 0.04 / (haloDist + 0.02);

          // Inner core flare
          float core = 0.08 / (r + 0.05) * (0.8 + uBass);

          vec3 col = mix(uColor1, uColor2, sin(angle * 3.0 + uTime) * 0.5 + 0.5);
          col *= (glow + core);

          gl_FragColor = vec4(col, clamp(glow * 0.8 + core * 0.6, 0.0, 1.0));
        }
      `
    });

    this.discMesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.discMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const petals = this.paramStore.getValue('density');

    this.discMesh.rotation.z += delta * 0.2 * speed;

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uPetals.value = petals;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.accent);
  }
}
