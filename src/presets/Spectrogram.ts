import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class SpectrogramPreset extends BasePreset {
  public override readonly id = 'spectogram';
  public override readonly name = 'The Spectogram';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Skeuomorphic 3D instrument chassis with log spectrum bars.';
  public override cameraConfig = {
    position: [0, 8, 14] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.0
  };

  private waterfallMesh!: THREE.Mesh;
  private waterfallMaterial!: THREE.ShaderMaterial;
  private historyBuffer!: Float32Array;
  private readonly rows = 64;
  private readonly cols = 64;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Scroll Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Bar Height', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Spectrogram Scale', min: 1.0, max: 5.0, step: 0.2, defaultValue: 3.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const geom = new THREE.PlaneGeometry(16, 16, this.cols - 1, this.rows - 1);
    geom.rotateX(-Math.PI / 2.2);

    this.historyBuffer = new Float32Array(this.rows * this.cols);

    this.waterfallMaterial = new THREE.ShaderMaterial({
      wireframe: true,
      uniforms: {
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uAccent;
        varying vec3 vPos;

        void main() {
          float heightFactor = clamp(vPos.z * 0.35, 0.0, 1.0);
          vec3 col = mix(uColor1, uAccent, heightFactor);
          gl_FragColor = vec4(col, 0.9);
        }
      `
    });

    this.waterfallMesh = new THREE.Mesh(geom, this.waterfallMaterial);
    this.group.add(this.waterfallMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, _time: number, _delta: number): void {
    const reactivity = this.paramStore.getValue('reactivity');
    const scaleFactor = this.paramStore.getValue('density');

    for (let r = this.rows - 1; r > 0; r--) {
      for (let c = 0; c < this.cols; c++) {
        this.historyBuffer[r * this.cols + c] = this.historyBuffer[(r - 1) * this.cols + c];
      }
    }

    const freq = audio.frequencyData;
    const step = Math.floor(freq.length / this.cols);
    for (let c = 0; c < this.cols; c++) {
      this.historyBuffer[c] = (freq[c * step] / 255.0) * scaleFactor * reactivity;
    }

    const pos = (this.waterfallMesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    for (let i = 0; i < this.rows * this.cols; i++) {
      pos[i * 3 + 2] = this.historyBuffer[i];
    }
    this.waterfallMesh.geometry.attributes.position.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.waterfallMaterial.uniforms.uColor1.value.set(theme.primary);
    this.waterfallMaterial.uniforms.uAccent.value.set(theme.accent);
  }

  protected override onDispose(): void {
    if (this.waterfallMesh) {
      this.waterfallMesh.geometry.dispose();
      this.waterfallMaterial?.dispose();
    }
  }
}
