import * as THREE from 'three';
import { AudioFeatures, VisualizerTheme, PresetContext, VisualizerPreset } from '../../src/types';
import { MockElement } from './env';

export function createSilentAudioFeatures(): AudioFeatures {
  return {
    frequencyData: new Uint8Array(1024),
    timeDomainData: new Uint8Array(1024).fill(128),
    subBass: 0,
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
    beat: false,
    beatEnergy: 0,
    bpm: 120
  };
}

export function createBeatDropAudioFeatures(bassIntensity = 0.95): AudioFeatures {
  const freq = new Uint8Array(1024);
  for (let i = 1; i < 15; i++) {
    freq[i] = Math.round(255 * bassIntensity);
  }
  const time = new Uint8Array(1024);
  for (let i = 0; i < time.length; i++) {
    time[i] = Math.round(128 + 120 * Math.sin(i * 0.1));
  }

  return {
    frequencyData: freq,
    timeDomainData: time,
    subBass: bassIntensity,
    bass: bassIntensity,
    mid: 0.3,
    treble: 0.2,
    rms: 0.85,
    beat: true,
    beatEnergy: 1.0,
    bpm: 128
  };
}

export function createTrebleMelodyAudioFeatures(): AudioFeatures {
  const freq = new Uint8Array(1024);
  for (let i = 180; i < 600; i++) {
    freq[i] = 220;
  }
  return {
    frequencyData: freq,
    timeDomainData: new Uint8Array(1024).fill(128),
    subBass: 0.05,
    bass: 0.1,
    mid: 0.4,
    treble: 0.86,
    rms: 0.4,
    beat: false,
    beatEnergy: 0.1,
    bpm: 135
  };
}

export function createMockTheme(id = 'test-theme', primary = '#ff0055'): VisualizerTheme {
  return {
    id,
    name: 'Test Theme',
    primary,
    secondary: '#00ccff',
    accent: '#ffff00',
    background: '#0a0a0a',
    glow: '#ff00aa'
  };
}

export class SpyVisualizerPreset implements VisualizerPreset {
  id = 'spy-preset';
  name = 'Spy Preset';
  category = 'Structures' as const;
  description = 'Preset used to spy on lifecycle invocations.';

  public initCalls = 0;
  public updateCalls = 0;
  public themeChangeCalls = 0;
  public resizeCalls = 0;
  public disposeCalls = 0;

  public lastTheme?: VisualizerTheme;
  public lastAudio?: AudioFeatures;
  public lastWidth = 0;
  public lastHeight = 0;

  private mesh?: THREE.Mesh;

  init(ctx: PresetContext): void {
    this.initCalls++;
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: ctx.theme.primary });
    this.mesh = new THREE.Mesh(geom, mat);
    ctx.scene.add(this.mesh);
  }

  update(_ctx: PresetContext, audio: AudioFeatures, _time: number, _delta: number): void {
    this.updateCalls++;
    this.lastAudio = audio;
  }

  onThemeChange(theme: VisualizerTheme): void {
    this.themeChangeCalls++;
    this.lastTheme = theme;
  }

  resize(width: number, height: number): void {
    this.resizeCalls++;
    this.lastWidth = width;
    this.lastHeight = height;
  }

  dispose(): void {
    this.disposeCalls++;
    if (this.mesh) {
      this.mesh.geometry.dispose();
      (this.mesh.material as THREE.Material).dispose();
      this.mesh.removeFromParent();
      this.mesh = undefined;
    }
  }
}

export function createMockPresetContext(theme: VisualizerTheme = createMockTheme()): PresetContext {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1920 / 1080, 0.1, 1000);
  const canvas = new MockElement('CANVAS');
  canvas.width = 1920;
  canvas.height = 1080;

  return {
    scene,
    camera,
    renderer: {
      domElement: canvas as unknown as HTMLCanvasElement,
      setSize: () => {},
      render: () => {},
      dispose: () => {}
    } as unknown as THREE.WebGLRenderer,
    width: 1920,
    height: 1080,
    theme
  };
}
