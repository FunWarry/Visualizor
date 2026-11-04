/**
 * Text Overlay & Typography Engine Interface Contracts (Ticket #43)
 */

export type TextAnchor =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'middle-left'
  | 'middle-center'
  | 'middle-right';

export type TextAnimationMode =
  | 'none'
  | 'pulse'
  | 'glow'
  | 'fade'
  | 'runningRow'
  | 'marquee'
  | 'static'
  | 'glitch';

export type TextBgShape = 'none' | 'pill' | 'square';
export type MarqueeDirection = 'left' | 'right';

export interface TextLayerConfig {
  id: string; // 'title' | 'artist' | 'custom'
  text: string;
  enabled: boolean;
  anchor: TextAnchor;
  offsetX: number; // Normalized -1.0 to 1.0 (or 0.0 to 1.0)
  offsetY: number; // Normalized -1.0 to 1.0 (or 0.0 to 1.0)
  fontSize: number; // 8 to 120 (default 32)
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string; // Hex color code
  opacity: number; // 0.0 to 1.0
  glow: number; // 0.0 to 2.0
  glowColor?: string;
  bgShape: TextBgShape;
  bgColor: string;
  bgOpacity: number;
  animation: TextAnimationMode;
  animationIntensity: number; // 0.0 to 1.0
  animationDirection: MarqueeDirection;
}

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  anchor: TextAnchor;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
}

export interface TextOverlayConfig {
  layers: {
    title: string;
    artist: string;
    custom: string;
  };
  watermark: boolean;
  anchor: TextAnchor;
  animation: TextAnimationMode;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  color: string;
  glowIntensity: number;
  opacity: number;
  animationIntensity: number;
  bgShape: TextBgShape;
  bgColor: string;
  bgOpacity: number;
}

export interface FontDefinition {
  id: string;
  name: string;
  tag: string;
  family: string;
  supportsBold: boolean;
  supportsItalic: boolean;
}

export const FONT_CATALOG: FontDefinition[] = [
  {
    id: 'sans',
    name: 'Modern Sans',
    tag: 'Calm',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    supportsBold: true,
    supportsItalic: true
  },
  {
    id: 'mono',
    name: 'Cyber Monospace',
    tag: 'Artistic',
    family: "'Fira Code', 'Courier New', monospace",
    supportsBold: true,
    supportsItalic: false
  },
  {
    id: 'impact',
    name: 'Impact Heavy',
    tag: 'Loud',
    family: "'Impact', 'Arial Black', sans-serif",
    supportsBold: true,
    supportsItalic: false
  },
  {
    id: 'futuristic',
    name: 'Sci-Fi Display',
    tag: 'Vintage',
    family: "'Orbitron', 'Trebuchet MS', sans-serif",
    supportsBold: true,
    supportsItalic: true
  },
  {
    id: 'serif',
    name: 'Editorial Serif',
    tag: 'Cute',
    family: "'Georgia', 'Times New Roman', serif",
    supportsBold: true,
    supportsItalic: true
  }
];

export const CANONICAL_9_TEXT_ANCHORS: TextAnchor[] = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right'
];

export const CANONICAL_5_TEXT_ANIMATIONS: TextAnimationMode[] = [
  'pulse',
  'marquee',
  'fade',
  'static',
  'glitch'
];
