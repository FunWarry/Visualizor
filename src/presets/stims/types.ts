/**
 * Stims Preset Catalog Domain Types & Contracts
 *
 * Provides unified interfaces for the Stims MilkDrop preset catalog,
 * category taxonomy, search index, sensory profiles, and active presets storage.
 */

// ============================================================================
// 1. Taxonomy & Category Definitions
// ============================================================================

export const STIMS_CATEGORIES = [
  'dancer',
  'drawing',
  'fractal',
  'geometric',
  'hypnotic',
  'particles',
  'reaction',
  'sparkle',
  'supernova',
  'waveform'
] as const;

export type StimsCategorySlug = (typeof STIMS_CATEGORIES)[number];

export const CATEGORY_DISPLAY_NAMES: Record<StimsCategorySlug, string> = {
  dancer: 'Dancer',
  drawing: 'Drawing',
  fractal: 'Fractal',
  geometric: 'Geometric',
  hypnotic: 'Hypnotic',
  particles: 'Particles',
  reaction: 'Reaction',
  sparkle: 'Sparkle',
  supernova: 'Supernova',
  waveform: 'Waveform'
};

export const STIMS_COLLECTIONS = [
  'hall-of-fame',
  'audio-reactive',
  'butterchurn',
  'cream-of-the-crop',
  'classic-milkdrop',
  'rovastar'
] as const;

export type StimsCollectionSlug = (typeof STIMS_COLLECTIONS)[number];

export const COLLECTION_TAG_MAP: Record<StimsCollectionSlug, string> = {
  'hall-of-fame': 'collection:hall-of-fame',
  'audio-reactive': 'collection:audio-reactive',
  'butterchurn': 'collection:butterchurn',
  'cream-of-the-crop': 'collection:cream-of-the-crop',
  'classic-milkdrop': 'collection:classic-milkdrop',
  'rovastar': 'collection:rovastar-and-collaborators'
};

export const COLLECTION_DISPLAY_NAMES: Record<StimsCollectionSlug, string> = {
  'hall-of-fame': 'Hall of Fame',
  'audio-reactive': 'Audio-Reactive',
  'butterchurn': 'Butterchurn',
  'cream-of-the-crop': 'Cream of the Crop',
  'classic-milkdrop': 'Classic MilkDrop',
  'rovastar': 'Rovastar & Co.'
};

// ============================================================================
// 2. Sensory Safety & Photosensitivity (WCAG 2.3.1)
// ============================================================================

export type FlashRiskLevel = 'none' | 'low' | 'medium' | 'high';

export const FLASH_RISK_SEVERITY: Record<FlashRiskLevel, number> = {
  none: 0,
  low: 1,
  medium: 2,
  high: 3
};

export interface StimsSensoryProfile {
  flashRiskLevel: FlashRiskLevel;
  maxTransitionsPerSecondEstimate?: number;
  meanLuminance?: number;
}

// ============================================================================
// 3. Preset Domain Model
// ============================================================================

export interface StimsPreset {
  id: string;
  title: string;
  author: string;
  file: string;
  category: string;
  tags: string[];
  description?: string;
  qualityScore?: number;
  sensoryProfile?: StimsSensoryProfile;
}

// ============================================================================
// 4. Query & Filter Interfaces
// ============================================================================

export interface StimsFilterOptions {
  category?: string;
  collection?: string;
  searchQuery?: string;
  maxFlashRisk?: FlashRiskLevel;
  excludeId?: string;
}

export interface CategoryCount {
  slug: string;
  name: string;
  count: number;
}

export interface CollectionCount {
  slug: string;
  name: string;
  count: number;
}

// ============================================================================
// 5. Catalog Service Contract & Init Options
// ============================================================================

export interface StimsCatalogInitOptions {
  /** Base asset URL path (defaults to '/presets/stims') */
  basePath?: string;
  /** Whether to eagerly hydrate full catalog during init(). Defaults to true. */
  eagerFullHydration?: boolean;
  /** Custom fetch implementation for unit testing or headless environments */
  customFetch?: (url: string) => Promise<{
    ok: boolean;
    status?: number;
    json(): Promise<unknown>;
    text?(): Promise<string>;
  }>;
}

export interface IStimsCatalogService {
  init(options?: StimsCatalogInitOptions): Promise<void>;
  getStarterPresets(): StimsPreset[];
  getAllPresets(): StimsPreset[];
  getCategories(): CategoryCount[];
  getCollections(): CollectionCount[];
  filterPresets(options?: StimsFilterOptions): StimsPreset[];
  getRandomPreset(options?: StimsFilterOptions): StimsPreset | null;
  getPresetById(id: string): StimsPreset | null;
  isReady(): boolean;
  isFullyHydrated(): boolean;
}

// ============================================================================
// 6. Active Presets Persistence Contract (Milestone 2)
// ============================================================================

export interface ActiveStimsPresetItem {
  id: string;
  title: string;
  author: string;
  category: string;
  file: string;
  addedAt: number;
}

export interface ActivePresetsStorageEnvelope {
  version: number;
  presets: ActiveStimsPresetItem[];
  updatedAt: number;
}

export interface IActivePresetsManager {
  init(): void;
  getActivePresets(): ActiveStimsPresetItem[];
  addPreset(preset: StimsPreset): boolean;
  removePreset(id: string): boolean;
  isPresetActive(id: string): boolean;
  clearAll(): void;
  onChanged(listener: () => void): () => void;
}

// ============================================================================
// 7. Discovery Mode & Visualizer Session Snapshot (Milestone 4)
// ============================================================================

export interface VisualizerSessionSnapshot {
  activePresetId: string;
  isMilkdropActive: boolean;
  currentMilkdropPreset: string | null;
  tuningOverrides: Record<string, unknown>;
  restore(): void;
}

export interface DiscoveryState {
  currentPreset: StimsPreset | null;
  selectedCategory: string | null;
  selectedCollection: string | null;
  searchQuery: string;
  reduceFlashing: boolean;
  isPlaying: boolean;
}
