import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class TopoMapPreset extends BasePreset {
  public override readonly id = 'topographic';
  public override readonly name = 'Topo Map';
  public override readonly category = 'Structures' as const;
  public override readonly description = 'Stepped 3D contour elevation map with glowing isoline bands.';
  public override cameraConfig = {
    position: [0, 10, 18] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: true,
    autoRotateSpeed: 0.3
  };

  private terrainMesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private basePositions!: Float32Array;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Contour Drift', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Elevation Reactivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Contour Bands', min: 2.0, max: 10.0, step: 0.5, defaultValue: 6.0 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    const gridRes = 80;
    const size = 18;
    const geometry = new THREE.PlaneGeometry(size, size, gridRes, gridRes);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position.array as Float32Array;
    this.basePositions = new Float32Array(pos);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) },
        uBands: { value: 6.0 }
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
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform float uBands;
        varying vec3 vPos;

        void main() {
          float elev = vPos.y * 1.2;
          float contour = abs(fract(elev * uBands - 0.5) - 0.5) / fwidth(elev * uBands);
          float line = 1.0 - clamp(contour, 0.0, 1.0);

          vec3 baseCol = mix(uColor1, uColor2, clamp(elev * 0.35 + 0.5, 0.0, 1.0));
          vec3 col = mix(baseCol, uAccent, line * 0.9);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.terrainMesh = new THREE.Mesh(geometry, this.material);
    this.group.add(this.terrainMesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const bands = this.paramStore.getValue('density');

    this.material.uniforms.uBands.value = bands;
    this.group.rotation.y += delta * 0.08 * speed;

    const pos = (this.terrainMesh.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const bassElevation = (audio.bass * 2.2 + audio.beatEnergy * 1.5) * reactivity;

    for (let i = 0; i < pos.length; i += 3) {
      const x = this.basePositions[i] * 0.25;
      const z = this.basePositions[i + 2] * 0.25;

      const ridge1 = Math.sin(x * 1.8 + time * 1.5 * speed) * Math.cos(z * 1.8 + time * 1.2 * speed);
      const ridge2 = Math.sin(Math.hypot(x, z) * 3.0 - time * 2.0 * speed) * 0.5;

      pos[i + 1] = (ridge1 + ridge2) * (1.2 + bassElevation * 0.8) + audio.mid * 0.5 * reactivity;
    }

    this.terrainMesh.geometry.attributes.position.needsUpdate = true;
    this.terrainMesh.geometry.computeVertexNormals();
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
  }
}
