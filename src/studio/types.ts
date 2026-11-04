/**
 * Visuval Studio Forge: Type Definitions & Schemas (Ticket #44)
 * Architecture based on reference engine specifications (chunk.VTHY24J4.js, chunk.2W3GG6R6.js)
 */

import { PostProcessingConfig } from '../types';

/**
 * 5 Engine Families available in Studio Forge
 */
export type EngineFamily = 'fluid' | 'chroma' | 'tunnel' | 'volume' | 'force';

export interface EngineFamilyMeta {
  id: EngineFamily;
  label: string;
  premium: boolean;
  blurb: string;
  defaultSeed: number;
}

export const ENGINE_FAMILIES_META: Record<EngineFamily, EngineFamilyMeta> = {
  fluid: { id: 'fluid', label: 'Liquid', premium: false, blurb: 'Soft fluid', defaultSeed: 2867 },
  chroma: { id: 'chroma', label: 'Chroma', premium: false, blurb: 'Vintage fringe', defaultSeed: 2443698462 },
  tunnel: { id: 'tunnel', label: 'Tunnel', premium: true, blurb: 'Deep corridor', defaultSeed: 3775842717 },
  volume: { id: 'volume', label: 'Volume', premium: true, blurb: 'Carved mass', defaultSeed: 2180893918 },
  force: { id: 'force', label: 'The Force', premium: true, blurb: 'Orbital pull', defaultSeed: 2814582287 }
};

export const CANONICAL_FAMILY_IDS: EngineFamily[] = ['fluid', 'chroma', 'tunnel', 'volume', 'force'];

/**
 * 11 Base continuous genes applied across all engines
 */
export interface BaseGenes {
  scale: number;
  octaves: number;
  warp: number;
  flow: number;
  filament: number;
  depth: number;
  spin: number;
  driveBand: number;
  kickGain: number;
  glow: number;
  breakup: number;
}

export const BASE_GENE_RANGES: Record<keyof BaseGenes, [number, number, number]> = {
  scale: [0.35, 2.4, 1.0],
  octaves: [0.0, 1.0, 0.55],
  warp: [0.0, 1.0, 0.45],
  flow: [0.0, 1.0, 0.4],
  filament: [0.0, 1.0, 0.5],
  depth: [0.0, 1.0, 0.45],
  spin: [0.0, 1.0, 0.3],
  driveBand: [0.0, 1.0, 0.35],
  kickGain: [0.0, 1.0, 0.55],
  glow: [0.0, 1.0, 0.4],
  breakup: [0.0, 1.0, 0.3]
};

export const BASE_GENE_DEFAULTS: BaseGenes = {
  scale: 1.0,
  octaves: 0.55,
  warp: 0.45,
  flow: 0.4,
  filament: 0.5,
  depth: 0.45,
  spin: 0.3,
  driveBand: 0.35,
  kickGain: 0.55,
  glow: 0.4,
  breakup: 0.3
};

/**
 * Family-specific gene defaults
 */
export const FAMILY_GENE_DEFAULTS: Record<EngineFamily, Record<string, number>> = {
  fluid: {
    curl: 0.12, caustic: 0.08, marble: 0.15, foam: 0.08, ripple: 0.06,
    oil: 0.05, blob: 0.4, drip: 0.08, sheets: 0.1, stretch: 0.12,
    meniscus: 0.1, grit: 0.08, boil: 0.08, gloss: 0.22, visc: 0.4,
    eddy: 0.35, edge: 0.32, medium: 0.0625
  },
  chroma: {
    figure: 0.03125, stagger: 0.35, plate: 0.45, axis: 0.35,
    carpet: 0.22, breath: 0.42, bloom: 0.48
  },
  tunnel: {
    sides: 0.12, twist: 0.32, lanes: 0.4, lattice: 0.22, flare: 0.42,
    bend: 0.2, hue: 0.0, cycle: 0.18, split: 0.12, sat: 0.55,
    star: 0.0, layers: 0.15, rings: 0.4, kaleido: 0.08, aperture: 0.48,
    pulse: 0.4, bore: 0.0625
  },
  volume: {
    cell: 0.22, gyre: 0.38, ridge: 0.28, hollow: 0.18, haze: 0.28,
    coil: 0.2, lamp: 0.4, form: 0.38, elongate: 0.5, span: 0.2,
    shift: 0.5, veil: 0.2
  },
  force: {
    wave: 0.3125, field: 0.0625, trail: 0.5, stamp: 0.5, mix: 0.12,
    orbit: 0.35, echo: 0.3125, alt: 0.5625, blend: 0.0, map: 0.0625,
    core: 0.125, fold: 0.0, offset: 0.5, count: 0.5, lace: 0.0
  }
};

/**
 * Stage (Background) Family Options
 */
export type StageBackdropType =
  | 'void' | 'nebula' | 'orbit' | 'aurora' | 'crystal' | 'lattice'
  | 'strata' | 'spokes' | 'dusk' | 'vortex' | 'hex' | 'plasma'
  | 'streaks' | 'disc' | 'polar' | 'plumes' | 'grid' | 'starfield' | 'horizon';

export interface StageConfig {
  backdrop: StageBackdropType;
  starfieldDensity: number; // 0.0 - 2.0
  gridVisible: boolean;
  gridOpacity: number;      // 0.0 - 1.0
  fogDensity: number;        // 0.0 - 1.0
  horizonTilt: number;       // -1.0 - 1.0
  spaceMode: '2d' | '3d';
  scale: number;            // 0.5 - 2.5
  dustDensity: number;      // 0.0 - 2.0
  lightIntensity: number;   // 0.2 - 3.0
}

export const DEFAULT_STAGE_CONFIG: StageConfig = {
  backdrop: 'void',
  starfieldDensity: 1.0,
  gridVisible: true,
  gridOpacity: 0.5,
  fogDensity: 0.2,
  horizonTilt: 0.0,
  spaceMode: '3d',
  scale: 1.0,
  dustDensity: 1.0,
  lightIntensity: 1.2
};

/**
 * Hero (Foreground) Geometry & Deformation Options
 */
export type HeroGeometryType =
  | 'oscilloscope' | 'starburst' | 'cross' | 'ring'
  | 'spiral' | 'diamond' | 'corridor' | 'lissajous'
  | 'sphere' | 'torus' | 'polyhedron' | 'dual-ring' | 'hypercube';

export type HeroShapeType =
  | 'inherit' | 'circle' | 'square' | 'hex'
  | 'triangle' | 'star' | 'heart' | 'diamond';

export type HeroRenderStyle = 'outline' | 'filled' | 'inverted' | 'double' | 'solid' | 'wireframe' | 'crystal' | 'neon';
export type HeroSymmetry = 'none' | 'radial4' | 'radial6' | 'radial8' | 'mirror';

export interface HeroConfig {
  geometry: HeroGeometryType;
  shape: HeroShapeType;
  renderStyle: HeroRenderStyle;
  symmetry: HeroSymmetry;
  scale: number;            // 0.4 - 2.5
  wireframe: boolean;
  wireframeThickness: number; // 0.1 - 2.0
  speedMultiplier: number;  // 0.1 - 3.0
  audioReactivity: number;  // 0.0 - 2.5
  deformation: number;      // 0.0 - 2.5
}

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  geometry: 'sphere',
  shape: 'circle',
  renderStyle: 'solid',
  symmetry: 'none',
  scale: 1.0,
  wireframe: false,
  wireframeThickness: 1.0,
  speedMultiplier: 1.0,
  audioReactivity: 1.0,
  deformation: 1.0
};

/**
 * Mood (Color, Lighting & Atmosphere) Options
 */
export interface MoodConfig {
  themeId: string;          // ID referencing 28 official themes
  brightness: number;       // 0.0 - 2.0
  contrast: number;         // 0.0 - 2.0
  ambientIntensity: number; // 0.0 - 2.0
  directionalIntensity: number; // 0.0 - 2.0
  beatLightingPulse: boolean;
  tint: number;             // 0.0 - 1.0
  accentGain: number;       // 0.0 - 2.0
  bloomIntensity: number;   // 0.0 - 3.0
  speedMultiplier: number;  // 0.2 - 3.0
  lightingVibe: 'neon' | 'cold' | 'warm' | 'dark';
}

export const DEFAULT_MOOD_CONFIG: MoodConfig = {
  themeId: 'ember',
  brightness: 1.0,
  contrast: 1.0,
  ambientIntensity: 0.8,
  directionalIntensity: 1.2,
  beatLightingPulse: true,
  tint: 0.0,
  accentGain: 1.0,
  bloomIntensity: 1.2,
  speedMultiplier: 1.0,
  lightingVibe: 'neon'
};

/**
 * Studio Engine Recipe (kind: 'engine')
 */
export interface EngineRecipe {
  kind: 'engine';
  engineVersion: 2;
  id: string;               // Unique ID: 'sc_${timestamp}_${rand}'
  name: string;             // 1-60 characters
  familyId: EngineFamily;
  seed: number;             // 32-bit unsigned integer
  stage?: StageConfig;
  hero?: HeroConfig;
  mood?: MoodConfig;
  genes: Record<string, number>;
  themeId?: string;
  postProcessing?: Partial<PostProcessingConfig>;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Studio Composite Recipe (kind: 'recipe')
 */
export interface CompositeRecipe {
  kind: 'recipe';
  id: string;
  name: string;
  space?: '2d' | '3d';
  background?: Record<string, unknown>;
  blend?: Record<string, unknown>;
  foreground?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

/**
 * Studio Recipe Discriminated Union
 */
export type StudioRecipe = EngineRecipe | CompositeRecipe;

/**
 * 3 Generation Modes
 */
export type GenerationMode = 'forge' | 'curated' | 'remix';

export interface GenerateRecipeOptions {
  mode: GenerationMode;
  familyId?: EngineFamily;
  prompt?: string;
  baseRecipe?: StudioRecipe;
}

/**
 * Clamps and sanitizes a numerical value, falling back if non-finite or NaN
 */
export function clampNumber(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || Number.isNaN(val) || !Number.isFinite(val)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, val));
}

/**
 * Deterministic FNV-1a 32-bit hash function matching reference chunk.VTHY24J4.js
 */
export function hashPromptToSeed(prompt: string): number {
  const clean = String(prompt || '').trim();
  if (!clean) {
    return (Math.random() * 0xffffffff) >>> 0;
  }
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < clean.length; i++) {
    hash ^= clean.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0;
}

/**
 * Deterministic Mulberry32 PRNG generator seeded with uint32
 */
export function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Canonical fingerprinting function matching reference chunk.2W3GG6R6.js
 */
function serializeGenes(genes?: Record<string, number>): string {
  if (!genes || typeof genes !== 'object') return '';
  return Object.keys(genes)
    .sort()
    .map(k => `${k}:${(genes[k] ?? 0).toFixed(4)}`)
    .join(',');
}

export function canonicalFingerprint(recipe: StudioRecipe): string {
  if (!recipe || typeof recipe !== 'object') return '';
  if (recipe.kind === 'engine') {
    return `engine|${recipe.familyId || ''}|${recipe.seed ?? ''}|${serializeGenes(recipe.genes)}`;
  }
  const bg = (recipe.background as Record<string, unknown>) || {};
  const blend = (recipe.blend as Record<string, unknown>) || {};
  const fg = (recipe.foreground as Record<string, unknown>) || {};
  const bgKey = bg.familyId
    ? `e:${String(bg.familyId)}:${String(bg.seed ?? '')}:${serializeGenes(bg.genes as Record<string, number>)}`
    : `${String(bg.presetId || '')}:${String(bg.mode || '')}`;
  const fgOverlay = (fg.imageOverlay as Record<string, unknown>) || {};
  const fgAsset = String(fgOverlay.imageAssetId || fgOverlay.assetId || '');
  return `recipe|${String(recipe.space || '')}|${bgKey}|${String(blend.presetId || '')}:${String(blend.progress ?? '')}|${String(fg.type || '')}:${String(fg.shapeId || '')}:${fgAsset}`;
}
