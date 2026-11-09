import butterchurn, { type ButterchurnVisualizer } from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

export interface MilkdropPresetItem {
  name: string;
  category: string;
}

export class MilkdropEngine {
  private visualizer: ButterchurnVisualizer | null = null;
  private readonly canvas: HTMLCanvasElement;
  private audioNode: AudioNode | null = null;
  private presets: Record<string, unknown> = {};
  public presetNames: string[] = [];
  public currentPresetName: string = '';
  public isActive: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    try {
      if (this.presetNames.length === 0) {
        this.presets = butterchurnPresets.getPresets();
        this.presetNames = Object.keys(this.presets);
      }
    } catch {
      // Safe fallback if presets package not yet ready
    }
  }

  public init(audioContext: AudioContext, audioNode: AudioNode) {
    this.audioNode = audioNode;

    try {
      const width = window.innerWidth || 1920;
      const height = window.innerHeight || 1080;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

      this.canvas.width = Math.round(width * pixelRatio);
      this.canvas.height = Math.round(height * pixelRatio);

      this.visualizer = butterchurn.createVisualizer(audioContext, this.canvas, {
        width,
        height,
        pixelRatio,
        textureRatio: 1,
        meshWidth: 64,
        meshHeight: 48,
        outputFXAA: true
      });

      if (this.visualizer?.setOutputAA) {
        this.visualizer.setOutputAA(true);
      }
      if (this.visualizer?.setInternalMeshSize) {
        this.visualizer.setInternalMeshSize(64, 48);
      }

      if (this.audioNode && this.visualizer) {
        this.visualizer.connectAudio(this.audioNode);
      }

      if (this.presetNames.length === 0) {
        this.presets = butterchurnPresets.getPresets();
        this.presetNames = Object.keys(this.presets);
      }

      if (this.presetNames.length > 0) {
        // Pick a flagship Milkdrop / ProjectM preset
        const defaultName = this.presetNames.find(n => n.toLowerCase().includes('geiss')) || this.presetNames[0];
        this.loadPreset(defaultName, 0);
      }
    } catch (err) {
      console.warn('Milkdrop WebGL engine initialization note:', err);
    }
  }

  public loadPreset(name: string, blendTime = 2.0): boolean {
    if (!name || typeof name !== 'string') return false;

    const resolvedKey = this.resolvePresetKey(name);
    const presetObj = this.presets[name] ?? (resolvedKey ? this.presets[resolvedKey] : undefined);

    this.currentPresetName = name;

    if (!this.visualizer || !presetObj) {
      return Boolean(presetObj);
    }

    try {
      this.visualizer.loadPreset(presetObj, blendTime);
      return true;
    } catch (err) {
      console.warn('MilkdropEngine loadPreset fallback note:', err);
      // Fallback to first safe preset if custom/resolved preset failed compilation
      if (this.presetNames.length > 0) {
        try {
          const safeKey = this.presetNames[0];
          this.visualizer.loadPreset(this.presets[safeKey], blendTime);
          return true;
        } catch {
          // Ignore secondary fallback error
        }
      }
      return false;
    }
  }

  public registerCustomPreset(id: string, presetObj: unknown): void {
    if (!id || !presetObj || typeof presetObj !== 'object') return;
    this.presets[id] = presetObj;
    if (!this.presetNames.includes(id)) {
      this.presetNames.push(id);
    }
  }

  public resolvePresetKey(nameOrId: string): string {
    if (!nameOrId) return this.presetNames[0] || '';
    if (this.presets[nameOrId]) return nameOrId;
    if (this.presetNames.length === 0) return '';

    const normalizedTarget = nameOrId.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const targetTokens = normalizedTarget.split(/\s+/).filter(t => t.length > 2);

    let bestKey = '';
    let bestScore = 0;

    for (const key of this.presetNames) {
      const normKey = key.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
      if (normKey === normalizedTarget || normKey.includes(normalizedTarget)) {
        return key;
      }
      let score = 0;
      for (const token of targetTokens) {
        if (normKey.includes(token)) {
          score += token.length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    if (bestKey && bestScore >= 4) {
      return bestKey;
    }

    // Deterministic hash fallback into available Butterchurn presets so Stims IDs always render live shaders
    let hash = 0;
    for (let i = 0; i < nameOrId.length; i++) {
      hash = ((hash << 5) - hash + (nameOrId.codePointAt(i) ?? 0)) | 0;
    }
    const idx = Math.abs(hash) % this.presetNames.length;
    return this.presetNames[idx];
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
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
    if (this.visualizer) {
      this.visualizer.setRendererSize(width, height, {
        pixelRatio,
        textureRatio: 1,
        meshWidth: 64,
        meshHeight: 48
      });
      if (this.visualizer.setOutputAA) {
        this.visualizer.setOutputAA(true);
      }
    }
  }

  public setActive(active: boolean) {
    this.isActive = active;
    this.canvas.style.display = active ? 'block' : 'none';
    if (active) {
      this.resize(window.innerWidth || 1920, window.innerHeight || 1080);
    }
  }
}
