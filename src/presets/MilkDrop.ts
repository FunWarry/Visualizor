import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme } from '../types';

export class MilkDropPreset implements VisualizerPreset {
  id = 'milkdrop';
  name = 'MilkDrop Vortex';
  category = 'Abstract & Space' as const;
  description = 'Classic Winamp MilkDrop style psychedelic vortex warp with audio feedback ripples.';

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private waveformWave!: THREE.Line;
  private waveMaterial!: THREE.LineBasicMaterial;

  init(ctx: PresetContext) {
    // 1. Vortex warping plane
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

          // Logarithmic spiral MilkDrop warp
          float spiral = sin(angle * 6.0 + dist * 12.0 - uTime * 2.5);
          float ripple = sin(dist * 24.0 - uTime * 4.0 * (1.0 + uMid));
          float pattern = spiral * ripple + uBeat * 0.4;

          vec3 col = mix(uColor1, uColor2, sin(dist * 5.0 + uTime) * 0.5 + 0.5);
          col = mix(col, uAccent, smoothstep(0.2, 0.8, pattern) * (0.7 + uTreble * 0.8));

          // Center glow
          float centerGlow = 0.15 / (dist + 0.08);
          col += uAccent * centerGlow * (0.5 + uBass);

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(planeGeom, this.material);
    this.mesh.position.z = -4;
    ctx.scene.add(this.mesh);

    // 2. Overlay dynamic reactive oscilloscope waveform ribbon
    const wavePointsCount = 256;
    const waveGeom = new THREE.BufferGeometry();
    const wavePos = new Float32Array(wavePointsCount * 3);
    for (let i = 0; i < wavePointsCount; i++) {
      wavePos[i * 3] = (i / wavePointsCount - 0.5) * 22;
      wavePos[i * 3 + 1] = 0;
      wavePos[i * 3 + 2] = -2;
    }
    waveGeom.setAttribute('position', new THREE.BufferAttribute(wavePos, 3));

    this.waveMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      linewidth: 3,
      transparent: true,
      opacity: 0.85
    });

    this.waveformWave = new THREE.Line(waveGeom, this.waveMaterial);
    ctx.scene.add(this.waveformWave);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, _delta: number) {
    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uBass.value = audio.bass;
    this.material.uniforms.uMid.value = audio.mid;
    this.material.uniforms.uTreble.value = audio.treble;
    this.material.uniforms.uBeat.value = audio.beat ? 1.0 : 0.0;

    // Update oscilloscope ribbon with time-domain audio data
    const pos = (this.waveformWave.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const waveData = audio.timeDomainData;
    const step = Math.floor(waveData.length / 256);

    for (let i = 0; i < 256; i++) {
      const sample = (waveData[i * step] / 128.0) - 1.0;
      pos[i * 3 + 1] = sample * (2.5 + audio.bass * 2.0);
    }
    this.waveformWave.geometry.attributes.position.needsUpdate = true;
  }

  onThemeChange(theme: VisualizerTheme) {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
    this.waveMaterial.color.set(theme.accent);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.waveformWave.geometry.dispose();
    this.waveMaterial.dispose();
    this.mesh.removeFromParent();
    this.waveformWave.removeFromParent();
  }
}
