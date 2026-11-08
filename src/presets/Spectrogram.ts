import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

const HISTORY_COLS = 256;
const FREQ_BINS = 64;

export class SpectrogramPreset extends BasePreset {
  public override readonly id = 'spectogram';
  public override readonly name = 'The Spectogram';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = 'Skeuomorphic CRT instrument chassis with rolling waterfall spectrum and oscilloscope glow traces.';
  public override cameraConfig = {
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false,
    bloomIntensity: 0.15
  };

  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private historyTex!: THREE.DataTexture;
  private historyData!: Float32Array;
  private writeCol = 0;

  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private smoothRms = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Scroll Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'Bar Height', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Spectrogram Scale', min: 1.0, max: 5.0, step: 0.2, defaultValue: 2.5 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Children[0]: Must be THREE.Mesh with PlaneGeometry (satisfies Ticket 21 test assertion)
    const geom = new THREE.PlaneGeometry(16, 10);

    this.historyData = new Float32Array(HISTORY_COLS * FREQ_BINS);
    this.historyTex = new THREE.DataTexture(
      this.historyData as unknown as BufferSource,
      HISTORY_COLS,
      FREQ_BINS,
      THREE.RedFormat,
      THREE.FloatType
    );
    this.historyTex.minFilter = THREE.LinearFilter;
    this.historyTex.magFilter = THREE.LinearFilter;
    this.historyTex.wrapS = THREE.RepeatWrapping;
    this.historyTex.wrapT = THREE.ClampToEdgeWrapping;
    this.historyTex.needsUpdate = true;

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) },
        uAccent: { value: new THREE.Color(ctx.theme.accent) },
        uBackground: { value: new THREE.Color(ctx.theme.background) },
        uAudio: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uHistory: { value: this.historyTex },
        uWriteCol: { value: 0 },
        uHistoryWidth: { value: HISTORY_COLS },
        uTraceGain: { value: 0.7 },
        uTrail: { value: 0.6 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uAccent;
        uniform vec3 uBackground;
        uniform float uAudio;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform sampler2D uHistory;
        uniform float uWriteCol;
        uniform float uHistoryWidth;
        uniform float uTraceGain;
        uniform float uTrail;
        varying vec2 vUv;

        float traceGlow(float dist, float sigma) {
          float core = exp(-dist * dist / (sigma * sigma));
          float halo = exp(-abs(dist) * 12.0) * 0.25;
          return core + halo;
        }

        void main() {
          vec2 uv = vUv;
          vec2 suv = (uv - 0.08) / 0.84;
          bool inside = suv.x >= 0.0 && suv.x <= 1.0 && suv.y >= 0.0 && suv.y <= 1.0;

          if (!inside) {
            // Bezel frame casing
            vec2 fuv = abs(uv - 0.5) * 2.0;
            float border = max(fuv.x, fuv.y);
            vec3 bezel = mix(vec3(0.04, 0.042, 0.045), uBackground * 0.7, 0.5);
            float rim = smoothstep(0.85, 0.98, border);
            bezel += vec3(rim * 0.08);
            gl_FragColor = vec4(bezel, 1.0);
            return;
          }

          // CRT oscilloscope & spectrogram glass
          vec3 glass = vec3(0.01, 0.012, 0.015);

          // Grid reticle divisions
          vec2 cell = fract(suv * vec2(10.0, 8.0));
          float gridX = 1.0 - smoothstep(0.0, 0.04, min(cell.x, 1.0 - cell.x));
          float gridY = 1.0 - smoothstep(0.0, 0.04, min(cell.y, 1.0 - cell.y));
          float centerCross = (1.0 - smoothstep(0.0, 0.008, abs(suv.x - 0.5))) +
                              (1.0 - smoothstep(0.0, 0.008, abs(suv.y - 0.5)));
          float grid = max(gridX, gridY) * 0.12 + centerCross * 0.22;
          glass = mix(glass, vec3(0.18, 0.24, 0.22), grid);

          // Rolling Waterfall heatmap
          float colF = uWriteCol - (1.0 - suv.x) * uHistoryWidth;
          float tU = mod(colF, uHistoryWidth) / uHistoryWidth;
          float amp = texture2D(uHistory, vec2(tU, suv.y)).r;
          amp = clamp(amp * (0.85 + uTrail * 0.4), 0.0, 1.5);

          vec3 heat = mix(uColor2, uColor1, clamp(amp, 0.0, 1.0));
          heat = mix(heat, vec3(1.0), smoothstep(0.85, 1.25, amp) * 0.6);
          float fade = smoothstep(0.0, 0.05, suv.x) * smoothstep(0.0, 0.03, suv.y) * smoothstep(1.0, 0.97, suv.y);
          glass = mix(glass, heat, clamp(amp, 0.0, 1.0) * 0.85 * fade);

          // Real-time oscilloscope trace glow lines
          float waveA = sin(suv.x * 24.0 + uTime * 6.0) * uBass * 0.18 +
                        sin(suv.x * 60.0 - uTime * 8.0) * uMid * 0.08;
          float yA = 0.52 + waveA * uTraceGain;
          float gA = traceGlow(suv.y - yA, 0.012);

          float waveB = cos(suv.x * 32.0 - uTime * 5.0) * uTreble * 0.14 +
                        sin(suv.x * 12.0 + uTime * 4.0) * uAudio * 0.1;
          float yB = 0.42 + waveB * uTraceGain;
          float gB = traceGlow(suv.y - yB, 0.015);

          glass += uColor1 * gA * 0.95;
          glass += uAccent * gB * 0.85;

          // CRT scanlines
          float scan = 0.04 * sin(suv.y * 360.0);
          glass *= 1.0 - scan;

          gl_FragColor = vec4(clamp(glass, 0.0, 1.0), 1.0);
        }
      `
    });

    this.mesh = new THREE.Mesh(geom, this.material);
    this.group.add(this.mesh);
  }

  public update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void {
    const speed = this.paramStore.getValue('speed');
    const reactivity = this.paramStore.getValue('reactivity');
    const scaleFactor = this.paramStore.getValue('density');

    this.updateAudioSmoothing(audio, delta);
    this.updateHistoryTexture(audio, speed, reactivity, scaleFactor);

    this.material.uniforms.uTime.value = time;
    this.material.uniforms.uAudio.value = this.smoothRms * reactivity;
    this.material.uniforms.uBass.value = this.smoothBass * reactivity;
    this.material.uniforms.uMid.value = this.smoothMid * reactivity;
    this.material.uniforms.uTreble.value = this.smoothTreble * reactivity;
    this.material.uniforms.uWriteCol.value = this.writeCol % HISTORY_COLS;
  }

  private updateAudioSmoothing(audio: AudioFeatures, delta: number): void {
    const rate = Math.min(1, delta * 15);
    this.smoothBass += (audio.bass - this.smoothBass) * rate;
    this.smoothMid += (audio.mid - this.smoothMid) * rate;
    this.smoothTreble += (audio.treble - this.smoothTreble) * rate;
    this.smoothRms += (audio.rms - this.smoothRms) * rate;
  }

  private updateHistoryTexture(audio: AudioFeatures, speed: number, reactivity: number, scaleFactor: number): void {
    const freq = audio.frequencyData;
    const freqLen = freq.length;
    const scrollStep = Math.max(1, Math.round(speed * 2));

    for (let s = 0; s < scrollStep; s++) {
      const currentCol = this.writeCol % HISTORY_COLS;
      for (let b = 0; b < FREQ_BINS; b++) {
        const norm = b / FREQ_BINS;
        const binIdx = Math.floor(Math.pow(norm, 1.6) * (freqLen * 0.7));
        const val = ((freq[binIdx] || 0) / 255.0) * reactivity * (scaleFactor * 0.4);
        this.historyData[b * HISTORY_COLS + currentCol] = Math.min(1.5, val);
      }
      this.writeCol++;
    }
    this.historyTex.needsUpdate = true;
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    this.material.uniforms.uColor1.value.set(theme.primary);
    this.material.uniforms.uColor2.value.set(theme.secondary);
    this.material.uniforms.uAccent.value.set(theme.accent);
    this.material.uniforms.uBackground.value.set(theme.background);
  }

  protected override onDispose(): void {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.material.dispose();
    }
    if (this.historyTex) {
      this.historyTex.dispose();
    }
  }
}
