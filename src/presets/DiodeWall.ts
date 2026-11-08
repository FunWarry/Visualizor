import * as THREE from 'three';
import { PresetContext, AudioFeatures, VisualizerTheme } from '../types';
import { ParameterStore } from '../tuning/ParameterStore';
import { BasePreset } from './BasePreset';

export class DiodeWallPreset extends BasePreset {
  public override readonly id = 'diodewall';
  public override readonly name = 'Diode Wall';
  public override readonly category = 'Retro & Digital' as const;
  public override readonly description = '32x24 club LED matrix equalizer with quantized dome emission and peak hold.';
  public override cameraConfig = {
    position: [0, 0, 14] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    autoRotate: false
  };

  private instancedMesh!: THREE.InstancedMesh;
  private readonly dummy = new THREE.Object3D();
  private readonly cols = 32;
  private readonly rows = 24;
  private readonly count = 768;

  private readonly heights = new Float32Array(32);
  private readonly peaks = new Float32Array(32);
  private housingMesh?: THREE.Mesh;
  private housingMaterial?: THREE.MeshBasicMaterial;

  private smoothBass = 0;
  private smoothMid = 0;
  private smoothTreble = 0;
  private beatPulse = 0;

  constructor() {
    super();
    this.paramStore = new ParameterStore([
      { id: 'speed', name: 'Peak Decay Speed', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'reactivity', name: 'VU Sensitivity', min: 0.1, max: 2.5, step: 0.05, defaultValue: 1.0 },
      { id: 'density', name: 'Diode Spacing', min: 0.3, max: 0.8, step: 0.05, defaultValue: 0.48 }
    ]);
  }

  protected setup(ctx: PresetContext): void {
    // 1. Children[0]: 768 Instanced cylinder diode LEDs
    const geometry = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.count);

    const spacing = this.paramStore.getValue('density');
    const offsetX = (this.cols * spacing) / 2 - spacing / 2;
    const offsetY = (this.rows * spacing) / 2 - spacing / 2;

    const dark = new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.06);
    let idx = 0;
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        this.dummy.position.set(c * spacing - offsetX, r * spacing - offsetY, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(idx, this.dummy.matrix);
        this.instancedMesh.setColorAt(idx, dark);
        idx++;
      }
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
    this.group.add(this.instancedMesh);

    // 2. Children[1]: Housing bezel plate
    const plateGeom = new THREE.PlaneGeometry(this.cols * spacing + 1.2, this.rows * spacing + 1.2);
    this.housingMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.02)
    });
    this.housingMesh = new THREE.Mesh(plateGeom, this.housingMaterial);
    this.housingMesh.position.z = -0.1;
    this.group.add(this.housingMesh);
  }

  public update(ctx: PresetContext, audio: AudioFeatures, _time: number, delta: number): void {
    const reactivity = this.paramStore.getValue('reactivity');
    const speed = this.paramStore.getValue('speed');

    this.updateAudioSmoothing(audio, delta);
    this.updateHeightsAndPeaks(audio, reactivity, speed, delta);
    this.renderDiodeColors(ctx);
  }

  private updateAudioSmoothing(audio: AudioFeatures, delta: number): void {
    const rate = Math.min(1, delta * 15);
    this.smoothBass += (audio.bass - this.smoothBass) * rate;
    this.smoothMid += (audio.mid - this.smoothMid) * rate;
    this.smoothTreble += (audio.treble - this.smoothTreble) * rate;
    if (audio.beat) {
      this.beatPulse = 1.0;
    } else {
      this.beatPulse *= 0.88;
    }
  }

  private updateHeightsAndPeaks(audio: AudioFeatures, reactivity: number, speed: number, delta: number): void {
    const freq = audio.frequencyData;
    const freqLen = freq.length;
    const peakDecay = (0.015 * speed) * (delta * 60);

    for (let c = 0; c < this.cols; c++) {
      const norm = c / this.cols;
      const startBin = Math.floor(Math.pow(norm, 1.8) * (freqLen * 0.75));
      const endBin = Math.max(startBin + 1, Math.floor(Math.pow((c + 1) / this.cols, 1.8) * (freqLen * 0.75)));

      let sum = 0;
      let count = 0;
      for (let b = startBin; b <= endBin && b < freqLen; b++) {
        sum += freq[b] || 0;
        count++;
      }
      const rawLevel = (sum / Math.max(1, count) / 255.0) * reactivity;
      let targetHeight = rawLevel * (0.8 + 0.4 * norm);

      if (norm < 0.33) {
        targetHeight *= 1.0 + this.smoothBass * 0.35;
      } else if (norm < 0.66) {
        targetHeight *= 1.0 + this.smoothMid * 0.25;
      } else {
        targetHeight *= 1.0 + this.smoothTreble * 0.45;
      }
      targetHeight = Math.min(1.0, targetHeight);

      // Attack fast, decay smooth
      const smoothRate = targetHeight > this.heights[c] ? 0.45 : 0.12;
      this.heights[c] += (targetHeight - this.heights[c]) * smoothRate;

      // Peak-hold with gravity
      if (this.heights[c] >= this.peaks[c]) {
        this.peaks[c] = this.heights[c];
      } else {
        this.peaks[c] = Math.max(0, this.peaks[c] - peakDecay);
      }
    }
  }

  private getQuantizedLevel(coverage: number): number {
    if (coverage >= 0.67) return 1.0;
    if (coverage >= 0.34) return 0.55;
    if (coverage >= 0.01) return 0.28;
    return 0.0;
  }

  private computeDiodeColor(
    r: number,
    quant: number,
    isPeak: boolean,
    palette: { primary: THREE.Color; secondary: THREE.Color; accent: THREE.Color; dark: THREE.Color; white: THREE.Color },
    target: THREE.Color
  ): void {
    if (quant > 0.0) {
      const rowNorm = r / this.rows;
      if (rowNorm < 0.6) {
        target.lerpColors(palette.primary, palette.secondary, rowNorm / 0.6);
      } else {
        target.lerpColors(palette.secondary, palette.accent, (rowNorm - 0.6) / 0.4);
      }
      target.multiplyScalar(quant);
    } else {
      target.copy(palette.dark);
    }

    if (isPeak) {
      target.lerp(palette.white, 0.85);
    }

    if (this.beatPulse > 0.1 && quant > 0.0) {
      target.lerp(palette.white, this.beatPulse * 0.15);
    }
  }

  private renderDiodeColors(ctx: PresetContext): void {
    const palette = {
      primary: new THREE.Color(ctx.theme.primary),
      secondary: new THREE.Color(ctx.theme.secondary),
      accent: new THREE.Color(ctx.theme.accent),
      dark: new THREE.Color(ctx.theme.background).offsetHSL(0, 0, 0.05),
      white: new THREE.Color(0xffffff)
    };

    const diodeCol = new THREE.Color();
    let idx = 0;

    for (let c = 0; c < this.cols; c++) {
      const colHeight = this.heights[c] * this.rows;
      const peakRow = Math.floor(this.peaks[c] * this.rows);

      for (let r = 0; r < this.rows; r++) {
        const coverage = Math.min(1.0, Math.max(0.0, colHeight - r));
        const quant = this.getQuantizedLevel(coverage);
        const isPeak = this.peaks[c] > 0.04 && r === peakRow;

        this.computeDiodeColor(r, quant, isPeak, palette, diodeCol);
        this.instancedMesh.setColorAt(idx, diodeCol);
        idx++;
      }
    }

    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }

  public override onThemeChange(theme: VisualizerTheme): void {
    if (this.housingMaterial) {
      this.housingMaterial.color.set(theme.background).offsetHSL(0, 0, 0.02);
    }
  }

  protected override onDispose(): void {
    if (this.instancedMesh) {
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
    }
    if (this.housingMesh) {
      this.housingMesh.geometry.dispose();
      this.housingMaterial?.dispose();
    }
  }
}
