import butterchurn, { type ButterchurnVisualizer } from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

export interface MilkdropPresetItem {
  name: string;
  category: string;
}

export class MilkdropEngine {
  private visualizer: ButterchurnVisualizer | null = null;
  private canvas: HTMLCanvasElement;
  private audioNode: AudioNode | null = null;
  private presets: Record<string, unknown> = {};
  public presetNames: string[] = [];
  public currentPresetName: string = '';
  public isActive: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public init(audioContext: AudioContext, audioNode: AudioNode) {
    this.audioNode = audioNode;

    try {
      this.visualizer = butterchurn.createVisualizer(audioContext, this.canvas, {
        width: this.canvas.width || window.innerWidth,
        height: this.canvas.height || window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
      });

      if (this.audioNode && this.visualizer) {
        this.visualizer.connectAudio(this.audioNode);
      }

      this.presets = butterchurnPresets.getPresets();
      this.presetNames = Object.keys(this.presets);

      if (this.presetNames.length > 0) {
        // Pick a flagship Milkdrop / ProjectM preset
        const defaultName = this.presetNames.find(n => n.toLowerCase().includes('geiss')) || this.presetNames[0];
        this.loadPreset(defaultName, 0);
      }
    } catch (err) {
      console.warn('Milkdrop WebGL engine initialization note:', err);
    }
  }

  public loadPreset(name: string, blendTime = 2.0) {
    if (!this.visualizer || !this.presets[name]) return;
    this.currentPresetName = name;
    this.visualizer.loadPreset(this.presets[name], blendTime);
  }

  public loadCustomPreset(presetObj: unknown, blendTime = 2.0) {
    if (!this.visualizer) return;
    this.visualizer.loadPreset(presetObj, blendTime);
    this.currentPresetName = 'Custom ProjectM Preset';
  }

  public loadRandomPreset(blendTime = 2.0): string {
    if (this.presetNames.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * this.presetNames.length);
    const chosenName = this.presetNames[randomIndex];
    this.loadPreset(chosenName, blendTime);
    return chosenName;
  }

  public render() {
    if (!this.isActive || !this.visualizer) return;
    try {
      this.visualizer.render();
    } catch {
      // Ignore frame drop gracefully
    }
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.visualizer) {
      this.visualizer.setRendererSize(width, height);
    }
  }

  public setActive(active: boolean) {
    this.isActive = active;
    this.canvas.style.display = active ? 'block' : 'none';
  }
}
