import * as THREE from 'three';
import { AudioFeatures } from '../types';
import {
  TextAnchor,
  TextAnimationMode,
  TextOverlayConfig,
  WatermarkConfig
} from './types';

interface TextLineEntry {
  layerId: string;
  text: string;
  size: number;
}

function clampNumber(val: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}

export class TextOverlayEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private readonly orthoCamera: THREE.OrthographicCamera;
  private readonly orthoScene: THREE.Scene;
  private readonly orthoQuad: THREE.Mesh;

  private width = 1920;
  private height = 1080;
  private dpr = 1;
  private elapsedTime = 0;
  private isDirty = true;

  private readonly glitchOffset = { x: 0, y: 0 };
  private scaleMultiplier = 1.0;
  private marqueeOffset = 0;

  private readonly config: TextOverlayConfig;
  private readonly watermarkConfig: WatermarkConfig;

  constructor(
    width = 1920,
    height = 1080,
    dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2)
  ) {
    const validW = typeof width === 'number' && Number.isFinite(width)
      ? Math.max(1, width)
      : 1920;
    const validH = typeof height === 'number' && Number.isFinite(height)
      ? Math.max(1, height)
      : 1080;
    const validDpr = typeof dpr === 'number' && Number.isFinite(dpr) && dpr > 0
      ? Math.min(dpr, 4)
      : 1;

    this.width = validW;
    this.height = validH;
    this.dpr = validDpr;

    this.canvas = document.createElement('canvas');
    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;

    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.orthoScene = new THREE.Scene();
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    this.orthoQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.orthoScene.add(this.orthoQuad);

    this.config = {
      layers: {
        title: '',
        artist: '',
        custom: ''
      },
      watermark: false,
      anchor: 'center',
      animation: 'pulse',
      fontSize: 32,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#ffffff',
      glowIntensity: 0.8,
      opacity: 1.0,
      animationIntensity: 0.5,
      bgShape: 'none',
      bgColor: '#000000',
      bgOpacity: 0.7
    };

    this.watermarkConfig = {
      enabled: false,
      text: 'VISUVAL',
      anchor: 'bottom-right',
      fontSize: 14,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: 'rgba(255, 255, 255, 0.45)',
      opacity: 0.45
    };
  }

  public getConfig(): TextOverlayConfig {
    return {
      layers: { ...this.config.layers },
      watermark: this.config.watermark,
      anchor: this.config.anchor,
      animation: this.config.animation,
      fontSize: this.config.fontSize,
      fontFamily: this.config.fontFamily,
      fontWeight: this.config.fontWeight,
      fontStyle: this.config.fontStyle,
      color: this.config.color,
      glowIntensity: this.config.glowIntensity,
      opacity: this.config.opacity,
      animationIntensity: this.config.animationIntensity,
      bgShape: this.config.bgShape,
      bgColor: this.config.bgColor,
      bgOpacity: this.config.bgOpacity
    };
  }

  public setTitle(text: string): void {
    this.config.layers.title = typeof text === 'string' ? text.trim().slice(0, 200) : '';
    this.isDirty = true;
  }

  public setArtist(text: string): void {
    this.config.layers.artist = typeof text === 'string' ? text.trim().slice(0, 200) : '';
    this.isDirty = true;
  }

  public setCustomText(text: string): void {
    this.config.layers.custom = typeof text === 'string' ? text.trim().slice(0, 200) : '';
    this.isDirty = true;
  }

  public setWatermark(enabled: boolean): void {
    this.config.watermark = Boolean(enabled);
    this.watermarkConfig.enabled = Boolean(enabled);
    this.isDirty = true;
  }

  public setAnchor(anchor: TextAnchor): void {
    this.config.anchor = anchor;
    this.isDirty = true;
  }

  public setAnimationMode(mode: TextAnimationMode): void {
    this.config.animation = mode;
    this.isDirty = true;
  }

  public setFontSize(size: number): void {
    const val = typeof size === 'number' && !isNaN(size) ? size : 32;
    this.config.fontSize = Math.max(12, Math.min(96, Math.round(val)));
    this.isDirty = true;
  }

  public setFontFamily(family: string): void {
    if (family && typeof family === 'string') {
      this.config.fontFamily = family;
      this.isDirty = true;
    }
  }

  public setColor(color: string): void {
    if (color && typeof color === 'string') {
      this.config.color = color;
      this.isDirty = true;
    }
  }

  public setGlowIntensity(intensity: number): void {
    const val = typeof intensity === 'number' && !isNaN(intensity) ? intensity : 0.8;
    this.config.glowIntensity = Math.max(0.0, Math.min(2.0, Number(val.toFixed(2))));
    this.isDirty = true;
  }

  public setOpacity(opacity: number): void {
    const val = typeof opacity === 'number' && !isNaN(opacity) ? opacity : 1.0;
    this.config.opacity = Math.max(0.0, Math.min(1.0, Number(val.toFixed(2))));
    this.isDirty = true;
  }

  public setAnimationIntensity(intensity: number): void {
    const val = typeof intensity === 'number' && !isNaN(intensity) ? intensity : 0.5;
    this.config.animationIntensity = Math.max(0.0, Math.min(1.0, Number(val.toFixed(2))));
    this.isDirty = true;
  }

  public clearAll(): void {
    this.config.layers.title = '';
    this.config.layers.artist = '';
    this.config.layers.custom = '';
    this.config.watermark = false;
    this.watermarkConfig.enabled = false;
    this.isDirty = true;
  }

  public getActiveLayers(): string[] {
    const active: string[] = [];
    if (this.config.layers.title.length > 0) active.push('title');
    if (this.config.layers.artist.length > 0) active.push('artist');
    if (this.config.layers.custom.length > 0) active.push('custom');
    return active;
  }

  public hasActiveContent(): boolean {
    return (
      this.config.watermark ||
      this.config.layers.title.length > 0 ||
      this.config.layers.artist.length > 0 ||
      this.config.layers.custom.length > 0
    );
  }

  public hasVisibleContent(): boolean {
    return this.hasActiveContent();
  }

  public getGlitchDisplacement(): { x: number; y: number } {
    return { ...this.glitchOffset };
  }

  public getScaleMultiplier(): number {
    return this.scaleMultiplier;
  }

  public resize(
    width: number,
    height: number,
    dpr = Math.min(typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1, 2)
  ): void {
    const validW = typeof width === 'number' && Number.isFinite(width)
      ? Math.max(1, width)
      : (this.width > 0 ? this.width : 1920);
    const validH = typeof height === 'number' && Number.isFinite(height)
      ? Math.max(1, height)
      : (this.height > 0 ? this.height : 1080);
    const validDpr = typeof dpr === 'number' && Number.isFinite(dpr) && dpr > 0
      ? Math.min(dpr, 4)
      : (this.dpr > 0 ? this.dpr : 1);

    this.width = validW;
    this.height = validH;
    this.dpr = validDpr;

    this.canvas.width = Math.max(1, Math.round(this.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(this.height * this.dpr));
    this.texture.dispose();
    this.texture.image = this.canvas;
    this.isDirty = true;
  }

  public update(
    audioOrDelta: AudioFeatures | number,
    deltaOrTime?: number,
    maybeAudio?: AudioFeatures
  ): void {
    const { audio, delta } = this.resolveUpdateParams(audioOrDelta, deltaOrTime, maybeAudio);
    this.elapsedTime += delta;

    this.updateAnimations(audio);

    if (!this.hasActiveContent()) {
      this.handleInactiveOverlay();
      return;
    }

    const effectiveOpacity = this.computeEffectiveOpacity(audio);

    this.renderCanvas(effectiveOpacity, audio);
    this.texture.needsUpdate = true;
    this.isDirty = false;
  }

  private resolveUpdateParams(
    audioOrDelta: AudioFeatures | number,
    deltaOrTime?: number,
    maybeAudio?: AudioFeatures
  ): { audio: AudioFeatures | undefined; delta: number } {
    if (typeof audioOrDelta === 'object' && audioOrDelta !== null) {
      return {
        audio: audioOrDelta,
        delta: clampNumber(deltaOrTime, 0.016, 0)
      };
    }
    return {
      audio: maybeAudio,
      delta: clampNumber(audioOrDelta, 0.016, 0)
    };
  }

  private handleInactiveOverlay(): void {
    if (this.isDirty && this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
      this.isDirty = false;
    }
  }

  private updateAnimations(audio?: AudioFeatures): void {
    this.updatePulse(audio);
    this.updateGlitch(audio);
    this.updateMarquee();
  }

  private updatePulse(audio?: AudioFeatures): void {
    if (this.config.animation !== 'pulse') {
      this.scaleMultiplier = 1.0;
      return;
    }
    const bass = clampNumber(audio?.bass, 0, 0);
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const beatBonus = audio?.beat ? 0.15 * intensity : 0;
    const computed = 1.0 + bass * intensity * 0.35 + beatBonus;
    this.scaleMultiplier = clampNumber(computed, 1.0, 0);
  }

  private updateGlitch(audio?: AudioFeatures): void {
    if (this.config.animation !== 'glitch') {
      this.glitchOffset.x = 0;
      this.glitchOffset.y = 0;
      return;
    }
    const safeBass = clampNumber(audio?.bass, 0, 0);
    const isKick = Boolean(audio?.beat) || safeBass > 0.6;
    const baseJitter = isKick ? 12.0 : 4.0;
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const time = clampNumber(this.elapsedTime, 0);
    this.glitchOffset.x = Math.sin(time * 35.0) * baseJitter * intensity;
    this.glitchOffset.y = Math.cos(time * 45.0) * (baseJitter * 0.6) * intensity;
  }

  private updateMarquee(): void {
    const anim = this.config.animation;
    if (anim !== 'marquee' && anim !== 'runningRow') {
      this.marqueeOffset = 0;
      return;
    }
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const speed = 40 + intensity * 160;
    const time = clampNumber(this.elapsedTime, 0);
    const span = Math.max(1, clampNumber(this.width, 1920, 1) + 500);
    this.marqueeOffset = clampNumber((time * speed) % span, 0, 0);
  }

  private computeEffectiveOpacity(audio?: AudioFeatures): number {
    const intensity = clampNumber(this.config.animationIntensity, 0.5, 0, 1);
    const baseOpacity = clampNumber(this.config.opacity, 1.0, 0, 1);

    if (this.config.animation === 'fade') {
      const time = clampNumber(this.elapsedTime, 0);
      const sine = (Math.sin(time * (1.5 + intensity * 2.5)) + 1) / 2;
      let opacity = baseOpacity * (0.35 + 0.65 * sine);
      if (audio?.beat) {
        opacity = Math.min(1.0, opacity + 0.2 * intensity);
      }
      return clampNumber(opacity, baseOpacity, 0, 1);
    }

    if (this.config.animation === 'glow') {
      const beatEnergy = clampNumber(audio?.beatEnergy, 0, 0, 1);
      return clampNumber(0.6 + 0.4 * beatEnergy * intensity, baseOpacity, 0, 1);
    }

    return baseOpacity;
  }

  private renderCanvas(effectiveOpacity: number, audio?: AudioFeatures): void {
    if (!this.ctx) return;

    if (this.ctx.save) this.ctx.save();
    if (this.ctx.setTransform) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    this.ctx.clearRect(0, 0, this.width, this.height);

    const activeEntries: TextLineEntry[] = [];
    if (this.config.layers.title) {
      activeEntries.push({ layerId: 'title', text: this.config.layers.title, size: this.config.fontSize });
    }
    if (this.config.layers.artist) {
      activeEntries.push({
        layerId: 'artist',
        text: this.config.layers.artist,
        size: Math.round(this.config.fontSize * 0.75)
      });
    }
    if (this.config.layers.custom) {
      activeEntries.push({
        layerId: 'custom',
        text: this.config.layers.custom,
        size: Math.round(this.config.fontSize * 0.65)
      });
    }

    if (activeEntries.length > 0) {
      this.renderTextLines(activeEntries, effectiveOpacity, audio);
    }

    if (this.config.watermark || this.watermarkConfig.enabled) {
      this.renderWatermark();
    }

    if (this.ctx.restore) this.ctx.restore();
  }

  private computeAnchorCoordinates(anchor: string): {
    baseX: number;
    baseY: number;
    align: CanvasTextAlign;
    baseline: CanvasTextBaseline;
  } {
    const margin = 40;
    let baseX = this.width / 2;
    let baseY = this.height / 2;
    let align: CanvasTextAlign = 'center';
    let baseline: CanvasTextBaseline = 'middle';

    const normalized = anchor
      .replace('middle-left', 'center-left')
      .replace('middle-center', 'center')
      .replace('middle-right', 'center-right');

    if (normalized.includes('left')) {
      baseX = margin;
      align = 'left';
    } else if (normalized.includes('right')) {
      baseX = this.width - margin;
      align = 'right';
    }

    if (normalized.startsWith('top')) {
      baseY = margin;
      baseline = 'top';
    } else if (normalized.startsWith('bottom')) {
      baseY = this.height - margin;
      baseline = 'bottom';
    }

    return { baseX, baseY, align, baseline };
  }

  private renderTextLines(
    lines: TextLineEntry[],
    effectiveOpacity: number,
    audio?: AudioFeatures
  ): void {
    const { baseX, baseY, align, baseline } = this.computeAnchorCoordinates(this.config.anchor);
    const totalLines = lines.length;
    const lineHeightRatio = 1.35;

    lines.forEach((lineItem, index) => {
      let posX = baseX + this.glitchOffset.x;
      let posY = baseY + (index - (totalLines - 1) / 2) * (lineItem.size * lineHeightRatio) + this.glitchOffset.y;

      if (this.config.anchor.startsWith('top')) {
        posY = baseY + index * (lineItem.size * lineHeightRatio) + this.glitchOffset.y;
      } else if (this.config.anchor.startsWith('bottom')) {
        posY = baseY - (totalLines - 1 - index) * (lineItem.size * lineHeightRatio) + this.glitchOffset.y;
      }

      let lineAlign = align;
      if (this.config.animation === 'marquee' || this.config.animation === 'runningRow') {
        posX = (this.width + 200) - this.marqueeOffset;
        lineAlign = 'left';
      }

      this.renderLine(lineItem, posX, posY, lineAlign, baseline, effectiveOpacity, audio);
    });
  }

  private renderLine(
    lineItem: TextLineEntry,
    posX: number,
    posY: number,
    align: CanvasTextAlign,
    baseline: CanvasTextBaseline,
    effectiveOpacity: number,
    audio?: AudioFeatures
  ): void {
    if (this.ctx.save) this.ctx.save();

    if (this.scaleMultiplier !== 1.0 && Number.isFinite(this.scaleMultiplier) && this.scaleMultiplier > 0 && this.ctx.translate && this.ctx.scale) {
      this.ctx.translate(posX, posY);
      this.ctx.scale(this.scaleMultiplier, this.scaleMultiplier);
      this.ctx.translate(-posX, -posY);
    }

    this.ctx.textAlign = align;
    this.ctx.textBaseline = baseline;
    this.ctx.font = `${this.config.fontWeight} ${this.config.fontStyle} ${lineItem.size}px ${this.config.fontFamily}`;
    this.ctx.fillStyle = this.config.color;
    this.ctx.globalAlpha = effectiveOpacity;

    if (this.config.glowIntensity > 0) {
      const safeGlow = clampNumber(this.config.glowIntensity, 0, 0);
      const safeBeatEnergy = clampNumber(audio?.beatEnergy, 0, 0);
      this.ctx.shadowColor = this.config.color;
      this.ctx.shadowBlur = Math.max(0, safeGlow * 12 + safeBeatEnergy * 10);
    }

    if (this.config.bgShape && this.config.bgShape !== 'none') {
      this.drawBadge(lineItem, posX, posY, align, baseline, effectiveOpacity);
    }

    this.ctx.fillText(lineItem.text, posX, posY);
    if (this.ctx.restore) this.ctx.restore();
  }

  private drawBadge(
    lineItem: TextLineEntry,
    posX: number,
    posY: number,
    align: CanvasTextAlign,
    baseline: CanvasTextBaseline,
    effectiveOpacity: number
  ): void {
    if (!('roundRect' in this.ctx) || typeof this.ctx.roundRect !== 'function') return;

    const textMetrics = this.ctx.measureText(lineItem.text);
    const textWidth = textMetrics.width || lineItem.text.length * lineItem.size * 0.6;
    const textHeight = lineItem.size * 1.25;
    const padX = lineItem.size * 0.4;
    const padY = lineItem.size * 0.2;

    let bgX = posX - padX;
    if (align === 'center') bgX = posX - textWidth / 2 - padX;
    if (align === 'right') bgX = posX - textWidth - padX;

    let bgY = posY - padY;
    if (baseline === 'middle') bgY = posY - textHeight / 2 - padY;
    if (baseline === 'bottom') bgY = posY - textHeight - padY;

    this.ctx.fillStyle = this.config.bgColor;
    this.ctx.globalAlpha = this.config.bgOpacity * effectiveOpacity;
    const radius = this.config.bgShape === 'pill' ? (textHeight + padY * 2) / 2 : 4;
    this.ctx.beginPath();
    this.ctx.roundRect(bgX, bgY, textWidth + padX * 2, textHeight + padY * 2, radius);
    this.ctx.fill();

    this.ctx.fillStyle = this.config.color;
    this.ctx.globalAlpha = effectiveOpacity;
  }

  private renderWatermark(): void {
    if (!this.ctx) return;
    const margin = 28;
    const x = this.width - margin;
    const y = this.height - margin;

    if (this.ctx.save) this.ctx.save();
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = this.watermarkConfig.color;
    this.ctx.globalAlpha = this.watermarkConfig.opacity;
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText(this.watermarkConfig.text, x, y);
    if (this.ctx.restore) this.ctx.restore();
  }

  public renderPass(renderer: THREE.WebGLRenderer): void {
    if (!this.hasActiveContent()) return;
    const prevAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.render(this.orthoScene, this.orthoCamera);
    renderer.autoClear = prevAutoClear;
  }

  public dispose(): void {
    this.orthoQuad.geometry.dispose();
    if (Array.isArray(this.orthoQuad.material)) {
      this.orthoQuad.material.forEach(m => m.dispose());
    } else {
      this.orthoQuad.material.dispose();
    }
    this.texture.dispose();
  }
}
