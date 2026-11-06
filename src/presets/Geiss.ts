import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class GeissPreset extends BasePreset {
  public override readonly id = 'geiss';
  public override readonly name = 'Geiss';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Icy feedback vortices with cyan tint and rotational drift.';
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
      { id: 'speed', name: 'Drift Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Vortex Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Vortex Zoom', min: 1.0, max: 5.0, step: 0.2, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geometry = new THREE.PlaneGeometry(24, 18, 64, 64);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
        uZoom: { value: 2.5 },
        uPrimary: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      transparent: true,
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
        uniform float uTreble;
        uniform float uZoom;
        uniform vec3 uPrimary;
        uniform vec3 uAccent;
        varying vec2 vUv;

        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p);
          float a = atan(p.y, p.x);

          // Geiss feedback logarithmic spiral equation
          float vortex = sin(a * 4.0 + log(r + 0.01) * uZoom - uTime * 2.0);
          float ripple = sin(r * 24.0 - uTime * 3.0 * (1.0 + uBass));
          float pattern = vortex * 0.6 + ripple * 0.4;

          // Icy feedback chromatic gradient
          vec3 iceCyan = vec3(0.2, 0.85, 1.0);
          vec3 col = mix(uPrimary, iceCyan, smoothstep(-0.5, 0.8, pattern));
          col = mix(col, uAccent, smoothstep(0.4, 0.95, pattern) * (0.8 + uTreble));

          // Center vortex glow
          col += iceCyan * (0.12 / (r + 0.06)) * (0.5 + uBass);

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
    const zoom = this.paramStore.getValue('density');

    this.material.uniforms.uTime.value = time * speed;
    this.material.uniforms.uBass.value = audio.bass * reactivity;
    this.material.uniforms.uTreble.value = audio.treble * reactivity;
    this.material.uniforms.uZoom.value = zoom;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uPrimary.value.set(theme.primary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material?.dispose();
    }
  }
}
