import * as THREE from 'three';

export interface AudioFeatures {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  subBass: number;       // 0.0 - 1.0 (20-60 Hz)
  bass: number;          // 0.0 - 1.0 (60-250 Hz)
  mid: number;           // 0.0 - 1.0 (250-4000 Hz)
  treble: number;        // 0.0 - 1.0 (4000-16000 Hz)
  rms: number;           // 0.0 - 1.0 (Global amplitude)
  beat: boolean;         // True on transient kick
  beatEnergy: number;    // Exponential decay of kick
  bpm: number;           // Tempo (BPM)
}

export interface VisualizerTheme {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  glow: string;
}

export interface PresetContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  width: number;
  height: number;
  theme: VisualizerTheme;
}

export interface ParameterDefinition {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  currentValue?: number;
  category?: string;
  description?: string;
}

export interface VisualizerPreset {
  id: string;
  name: string;
  category: 'Structures' | 'Abstract & Space' | 'Particles & Light' | 'Fluids & Heat' | 'Tunnels' | 'Retro & Digital' | 'Organic & Nature';
  description: string;
  init(ctx: PresetContext): void;
  update(ctx: PresetContext, audio: AudioFeatures, time: number, delta: number): void;
  onThemeChange?(theme: VisualizerTheme): void;
  resize?(width: number, height: number): void;
  dispose(): void;

  // Milestone 3: Dynamic parameter tuning methods
  getCustomParameters?(): ParameterDefinition[];
  setCustomParameter?(id: string, value: number): void;
  getCustomParameterValue?(id: string): number | undefined;
  resetCustomParameters?(): void;
}

export interface PostProcessingConfig {
  bloomStrength: number;       // 0.0 - 3.0
  bloomRadius: number;         // 0.0 - 1.0
  bloomThreshold: number;      // 0.0 - 1.0
  persistence: number;         // 0.0 - 0.95 (Motion persistence / trails)
  chromaticAberration: number; // 0.0 - 1.0
  filmGrain: number;           // 0.0 - 1.0
  vignette: number;            // 0.0 - 1.0
  scanlines: number;           // 0.0 - 1.0
  crtBend: number;             // 0.0 - 1.0
  cameraShake: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;     // 0.1 - 2.0
}

export interface ExportSettings {
  format: 'webm' | 'mp4' | 'gif';
  aspectRatio: '16:9' | '9:16' | '1:1';
  resolution: '720p' | '1080p' | '1440p' | '4k';
  fps: 30 | 60;
  quality: 'medium' | 'high' | 'ultra';
  durationMode: 'full' | 'clip';
  clipStart: number;
  clipEnd: number;
  fastRender: boolean;
}
