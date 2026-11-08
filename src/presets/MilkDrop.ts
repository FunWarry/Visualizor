import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class MilkDropPreset extends BasePreset {
  public override readonly id = 'milkdrop';
  public override readonly name = 'MilkDrop';
  public override readonly category = 'Abstract & Space' as const;
  public override readonly description = 'Classic psychedelic Winamp Butterchurn warp feedback engine.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private waveformWave!: THREE.Line;
  private waveMaterial!: THREE.LineBasicMaterial;

  constructor() {
    super();
    this.paramStore = new ParameterStore([]);
  }

  public override getCustomParameters(): ParameterDefinition[] {
    return [];
  }

  protected setup(ctx: PresetContext): void {
    const planeGeom = new THREE.PlaneGeometry(28, 20, 64, 64);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uBeat: { value: 0 },
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
          float dist = length(p.xy);
          p.z += sin(dist * 2.0 - uTime * 3.0) * (0.6 + uBass * 1.2);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform float uBeat;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        varying vec2 vUv;
        varying vec3 vPos;

        void main() {
          vec2 uv = vUv - 0.5;
          float angle = atan(uv.y, uv.x);
          float dist = length(uv);

          float spiral = sin(angle * 6.0 + dist * 12.0 - uTime * 2.5);
          float ripple = sin(dist * 24.0 - uTime * 4.0 * (1.0 + uMid));
          float pattern = spiral * ripple + uBeat * 0.4;

          vec3 col = mix(uColor1, uColor2, sin(dist * 5.0 + uTime) * 0.5 + 0.5);
          col = mix(col, uAccent, smoothstep(0.2, 0.8, pattern) * (0.7 + uTreble * 0.8));

          float centerGlow = 0.15 / (dist + 0.08);
          col += uAccent * centerGlow * (0.5 + uBass);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(planeGeom, this.material);
    this.mesh.position.z = -4;
    this.group.add(this.mesh);

    const wavePointsCount = 256;
    const waveGeom = new THREE.BufferGeometry();
    const wavePos = new Float32Array(wavePointsCount * 3);
    for (let i = 0; i < wavePointsCount; i++) {
      wavePos[i * 3] = (i / wavePointsCount - 0.5) * 22;
      wavePos[i * 3 + 1] = 0;
      wavePos[i * 3 + 2] = 0;
    }
    waveGeom.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));

    this.waveMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    this.waveformWave = new THREE.Line(waveGeom, this.waveMaterial);
    this.waveformWave.position.z = -1;
    this.group.add(this.waveformWave);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number): void {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uBass.value = audio.bass;
    this.material.uniforms.uMid.value = audio.mid;
    this.material.uniforms.uTreble.value = audio.treble;
    this.material.uniforms.uBeat.value = audio.beat ? 1.0 : 0.0;

    // Real-time oscilloscope line displacement
    const pos = (this.waveformWave.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const count = pos.length / 3;
    const waveData = audio.timeDomainData;

    for (let i = 0; i < count; i++) {
      const sample = waveData && waveData.length > 0
        ? (waveData[Math.floor((i / count) * waveData.length)] - 128) / 128
        : Math.sin(i * 0.1 + time * 10);
      pos[i * 3 + 1] = sample * (1.5 + audio.bass * 2.5);
    }
    (this.waveformWave.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;

    this.waveMaterial.opacity = 0.6 + audio.treble * 0.4;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
    this.waveMaterial.color.set(theme.accent);
  }

  protected override onDispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.waveformWave.geometry.dispose();
    this.waveMaterial.dispose();
  }
}
