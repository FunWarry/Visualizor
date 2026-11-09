/**
 * StimsCatalogService
 *
 * High-performance singleton service managing the Stims MilkDrop preset catalog.
 * Implements two-tier fast boot loading, O(1) category/collection pre-indexing,
 * tokenized keyword search, and photosensitivity-aware random sampling.
 */

import {
  type CategoryCount,
  type CollectionCount,
  type FlashRiskLevel,
  FLASH_RISK_SEVERITY,
  type IStimsCatalogService,
  STIMS_CATEGORIES,
  type StimsCategorySlug,
  CATEGORY_DISPLAY_NAMES,
  STIMS_COLLECTIONS,
  type StimsCollectionSlug,
  COLLECTION_DISPLAY_NAMES,
  COLLECTION_TAG_MAP,
  type StimsCatalogInitOptions,
  type StimsFilterOptions,
  type StimsPreset,
  type StimsSensoryProfile
} from './types';

// Constants for file paths and tags
const DEFAULT_BASE_PATH = '/presets/stims';
const PRESETS_STIMS_PREFIX = '/presets/stims/';
const STARTER_CATALOG_FILE = 'starter-catalog.json';
const FULL_CATALOG_FILE = 'catalog.json';
const DESCRIPTIONS_FILE = 'preset-descriptions.json';
const SEARCH_INDEX_FILE = 'search-index.json';
const CATEGORY_TAG_PREFIX = 'category:';
const COLLECTION_TAG_PREFIX = 'collection:';
const UNCATEGORIZED_SLUG = 'uncategorized';
const ROVASTAR_COLLECTION_TAG = 'collection:rovastar-and-collaborators';
const ROVASTAR_SHORT_SLUG = 'rovastar';

interface RawCatalogEntry {
  id: string;
  title?: string;
  author?: string;
  file?: string;
  tags?: string[];
  quality?: {
    score?: number;
  };
  sensoryProfile?: {
    flashRiskLevel?: FlashRiskLevel;
    maxTransitionsPerSecondEstimate?: number;
    meanLuminance?: number;
  };
}

interface RawCatalogDocument {
  presets?: RawCatalogEntry[];
}

interface SearchIndexDocument {
  [presetId: string]: {
    terms?: string[];
    combinedTerms?: string;
  };
}

interface DescriptionsDocument {
  descriptions?: Record<string, string>;
}

export class StimsCatalogService implements IStimsCatalogService {
  private static instance: StimsCatalogService | null = null;

  private basePath = DEFAULT_BASE_PATH;
  private customFetch?: StimsCatalogInitOptions['customFetch'];
  private initialized = false;
  private fullyHydrated = false;
  private initPromise: Promise<void> | null = null;
  private hydrationPromise: Promise<void> | null = null;

  private starterPresets: StimsPreset[] = [];
  private allPresets: StimsPreset[] = [];
  private readonly presetsMap = new Map<string, StimsPreset>();
  private readonly categoryIndex = new Map<string, StimsPreset[]>();
  private readonly collectionIndex = new Map<string, StimsPreset[]>();
  private readonly searchableTextCache = new Map<string, string>();
  private descriptions: Record<string, string> = {};
  private searchIndex: SearchIndexDocument | null = null;
  private readonly hydrationListeners: Array<() => void> = [];

  private constructor() {
    this.resetIndices();
  }

  public static getInstance(): StimsCatalogService {
    if (!StimsCatalogService.instance) {
      StimsCatalogService.instance = new StimsCatalogService();
    }
    return StimsCatalogService.instance;
  }

  /**
   * Resets singleton instance. Useful for isolated test cases.
   */
  public static resetInstance(): void {
    StimsCatalogService.instance = null;
  }

  // ==========================================================================
  // Initialization & Hydration Lifecycle
  // ==========================================================================

  public async init(options?: StimsCatalogInitOptions): Promise<void> {
    if (this.initialized && this.fullyHydrated) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.basePath = options?.basePath ?? DEFAULT_BASE_PATH;
    this.customFetch = options?.customFetch;

    this.initPromise = (async () => {
      // Step 1: Fast initial boot using starter-catalog.json
      await this.loadStarterCatalog();

      // Step 2: Hydration strategy
      const shouldEagerHydrate = options?.eagerFullHydration !== false;
      if (shouldEagerHydrate) {
        await this.hydrateFullCatalog();
      } else {
        // Kick off async background hydration without blocking init()
        void this.hydrateFullCatalog();
      }
    })();

    return this.initPromise;
  }

  public isReady(): boolean {
    return this.initialized;
  }

  public isFullyHydrated(): boolean {
    return this.fullyHydrated;
  }

  public onHydrated(listener: () => void): () => void {
    this.hydrationListeners.push(listener);
    if (this.fullyHydrated) {
      listener();
    }
    return () => {
      const idx = this.hydrationListeners.indexOf(listener);
      if (idx !== -1) {
        this.hydrationListeners.splice(idx, 1);
      }
    };
  }

  // ==========================================================================
  // Public Accessors
  // ==========================================================================

  public getStarterPresets(): StimsPreset[] {
    return [...this.starterPresets];
  }

  public getAllPresets(): StimsPreset[] {
    return [...this.allPresets];
  }

  public getPresetById(id: string): StimsPreset | null {
    if (typeof id !== 'string' || !id) {
      return null;
    }
    return this.presetsMap.get(id) ?? null;
  }

  public getCategories(): CategoryCount[] {
    return STIMS_CATEGORIES.map((slug) => ({
      slug,
      name: CATEGORY_DISPLAY_NAMES[slug],
      count: this.categoryIndex.get(slug)?.length ?? 0
    }));
  }

  public getCollections(): CollectionCount[] {
    return STIMS_COLLECTIONS.map((slug) => ({
      slug,
      name: COLLECTION_DISPLAY_NAMES[slug],
      count: this.collectionIndex.get(slug)?.length ?? 0
    }));
  }

  // ==========================================================================
  // Query, Filtering & Random Sampling
  // ==========================================================================

  public filterPresets(options?: StimsFilterOptions): StimsPreset[] {
    const opts = options && typeof options === 'object' ? options : {};
    const candidates = this.resolveInitialCandidates(opts);
    const searchTokens =
      typeof opts.searchQuery === 'string' && opts.searchQuery.trim().length > 0
        ? this.tokenizeQuery(opts.searchQuery)
        : null;
    const maxRiskScore = opts.maxFlashRisk
      ? FLASH_RISK_SEVERITY[opts.maxFlashRisk]
      : null;

    return candidates.filter((preset) => {
      if (opts.excludeId && preset.id === opts.excludeId) {
        return false;
      }

      if (typeof opts.category === 'string' && opts.category.trim().length > 0 && !this.presetMatchesCategory(preset, opts.category)) {
        return false;
      }

      if (typeof opts.collection === 'string' && opts.collection.trim().length > 0 && !this.presetMatchesCollection(preset, opts.collection)) {
        return false;
      }

      if (maxRiskScore !== null && !this.presetPassesFlashRisk(preset, maxRiskScore)) {
        return false;
      }

      return !searchTokens || this.presetMatchesTokens(preset, searchTokens);
    });
  }

  public getRandomPreset(options?: StimsFilterOptions): StimsPreset | null {
    const pool = options && typeof options === 'object' ? this.filterPresets(options) : this.allPresets;
    if (pool.length === 0) {
      return null;
    }
    if (pool.length === 1) {
      return pool[0];
    }
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] ?? null;
  }

  // ==========================================================================
  // Private Data Loading Pipelines
  // ==========================================================================

  private async loadStarterCatalog(): Promise<void> {
    const doc = await this.fetchJson<RawCatalogDocument>(STARTER_CATALOG_FILE);
    if (!doc?.presets || !Array.isArray(doc.presets)) {
      console.warn('[StimsCatalogService] Starter catalog missing or malformed; proceeding.');
      this.initialized = true;
      return;
    }

    const starterItems: StimsPreset[] = [];
    for (const raw of doc.presets) {
      const preset = this.mapRawEntry(raw);
      if (preset) {
        starterItems.push(preset);
      }
    }

    this.starterPresets = starterItems;
    if (this.allPresets.length === 0) {
      this.rebuildIndices(starterItems);
    }
    this.initialized = true;
  }

  private async hydrateFullCatalog(): Promise<void> {
    if (this.hydrationPromise) {
      return this.hydrationPromise;
    }

    this.hydrationPromise = (async () => {
      // Concurrently fetch catalog, descriptions, and search index
      const [catalogDoc, descDoc, searchDoc] = await Promise.all([
        this.fetchJson<RawCatalogDocument>(FULL_CATALOG_FILE),
        this.fetchJson<DescriptionsDocument>(DESCRIPTIONS_FILE),
        this.fetchJson<SearchIndexDocument>(SEARCH_INDEX_FILE)
      ]);

      if (descDoc?.descriptions) {
        this.descriptions = descDoc.descriptions;
      }
      if (searchDoc) {
        this.searchIndex = searchDoc;
      }

      if (catalogDoc?.presets && Array.isArray(catalogDoc.presets)) {
        const fullItems: StimsPreset[] = [];
        for (const raw of catalogDoc.presets) {
          const preset = this.mapRawEntry(raw);
          if (preset) {
            fullItems.push(preset);
          }
        }

        this.rebuildIndices(fullItems);
      }

      this.fullyHydrated = true;
      for (const listener of this.hydrationListeners) {
        try {
          listener();
        } catch (err) {
          console.error('[StimsCatalogService] Hydration listener failed:', err);
        }
      }
    })();

    return this.hydrationPromise;
  }

  private async fetchJson<T>(filename: string): Promise<T | null> {
    const cleanBase = this.basePath.replace(/\/+$/, '');
    const cleanFile = filename.replace(/^\/+/, '');
    const url = `${cleanBase}/${cleanFile}`;

    try {
      if (this.customFetch) {
        const res = await this.customFetch(url);
        if (res.ok) {
          return (await res.json()) as T;
        }
        return null;
      }

      if (typeof fetch === 'undefined') {
        return null;
      }

      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[StimsCatalogService] Failed to fetch ${url} (status: ${res.status})`);
        return null;
      }
      return (await res.json()) as T;
    } catch (err) {
      console.warn(`[StimsCatalogService] Network/parsing error fetching ${url}:`, err);
      return null;
    }
  }

  // ==========================================================================
  // Indexing & Mapping Helpers
  // ==========================================================================

  private resetIndices(): void {
    this.presetsMap.clear();
    this.categoryIndex.clear();
    this.collectionIndex.clear();
    this.searchableTextCache.clear();

    for (const cat of STIMS_CATEGORIES) {
      this.categoryIndex.set(cat, []);
    }
    for (const col of STIMS_COLLECTIONS) {
      this.collectionIndex.set(col, []);
    }
  }

  private rebuildIndices(presets: StimsPreset[]): void {
    this.resetIndices();
    this.allPresets = presets;

    for (const preset of presets) {
      this.presetsMap.set(preset.id, preset);

      // Pre-compute searchable string (including ID to support exact ID lookup)
      const searchTokens = this.searchIndex?.[preset.id]?.combinedTerms ?? '';
      const text = `${preset.id} ${preset.title} ${preset.author} ${preset.tags.join(' ')} ${preset.description ?? ''} ${searchTokens}`.toLowerCase();
      this.searchableTextCache.set(preset.id, text);

      // Index into categories
      this.indexPresetCategories(preset);

      // Index into collections
      this.indexPresetCollections(preset);
    }
  }

  private extractCategorySlugs(tags: string[]): string[] {
    if (!Array.isArray(tags)) {
      return [];
    }
    const slugs: string[] = [];
    for (const tag of tags) {
      if (typeof tag === 'string' && tag.startsWith(CATEGORY_TAG_PREFIX)) {
        slugs.push(tag.slice(CATEGORY_TAG_PREFIX.length).toLowerCase());
      }
    }
    return slugs;
  }

  private indexPresetCategories(preset: StimsPreset): void {
    const matchedCategories = new Set<string>();

    for (const catSlug of this.extractCategorySlugs(preset.tags)) {
      if (this.categoryIndex.has(catSlug)) {
        matchedCategories.add(catSlug);
      }
    }

    if (preset.category && preset.category !== UNCATEGORIZED_SLUG && this.categoryIndex.has(preset.category)) {
      matchedCategories.add(preset.category);
    }

    for (const cat of matchedCategories) {
      this.categoryIndex.get(cat)?.push(preset);
    }
  }

  private indexPresetCollections(preset: StimsPreset): void {
    if (!Array.isArray(preset.tags)) {
      return;
    }
    for (const tag of preset.tags) {
      if (typeof tag !== 'string') {
        continue;
      }
      if (tag.startsWith(COLLECTION_TAG_PREFIX)) {
        const rawSlug = tag.slice(COLLECTION_TAG_PREFIX.length).toLowerCase();
        const normalizedSlug = rawSlug === 'rovastar-and-collaborators' ? ROVASTAR_SHORT_SLUG : rawSlug;
        if (this.collectionIndex.has(normalizedSlug)) {
          this.collectionIndex.get(normalizedSlug)?.push(preset);
        }
      }
    }
  }

  private parseSensoryProfile(rawSensory: unknown): StimsSensoryProfile | undefined {
    if (!rawSensory || typeof rawSensory !== 'object') {
      return undefined;
    }
    const profile = rawSensory as {
      flashRiskLevel?: FlashRiskLevel;
      maxTransitionsPerSecondEstimate?: unknown;
      meanLuminance?: unknown;
    };
    if (!profile.flashRiskLevel) {
      return undefined;
    }
    return {
      flashRiskLevel: profile.flashRiskLevel,
      maxTransitionsPerSecondEstimate:
        typeof profile.maxTransitionsPerSecondEstimate === 'number'
          ? profile.maxTransitionsPerSecondEstimate
          : undefined,
      meanLuminance:
        typeof profile.meanLuminance === 'number'
          ? profile.meanLuminance
          : undefined
    };
  }

  private parseQualityScore(rawQuality: unknown): number | undefined {
    if (rawQuality && typeof rawQuality === 'object') {
      const q = rawQuality as { score?: unknown };
      if (typeof q.score === 'number') {
        return q.score;
      }
    }
    return undefined;
  }

  private mapRawEntry(raw: RawCatalogEntry): StimsPreset | null {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id.trim()) {
      return null;
    }

    const tags = Array.isArray(raw.tags)
      ? raw.tags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
    const primaryCategory = this.resolvePrimaryCategory(tags);
    const normalizedFile = this.normalizeFilePath(typeof raw.file === 'string' ? raw.file : '');
    const description = typeof raw.id === 'string' ? this.descriptions[raw.id] : undefined;

    return {
      id: raw.id,
      title: typeof raw.title === 'string' && raw.title.length > 0 ? raw.title : raw.id,
      author: typeof raw.author === 'string' && raw.author.length > 0 ? raw.author : 'Unknown',
      file: normalizedFile,
      category: primaryCategory,
      tags,
      description,
      qualityScore: this.parseQualityScore(raw.quality),
      sensoryProfile: this.parseSensoryProfile(raw.sensoryProfile)
    };
  }

  private resolvePrimaryCategory(tags: string[]): string {
    if (!Array.isArray(tags)) {
      return UNCATEGORIZED_SLUG;
    }
    for (const tag of tags) {
      if (typeof tag !== 'string') {
        continue;
      }
      if (tag.startsWith(CATEGORY_TAG_PREFIX)) {
        const cat = tag.slice(CATEGORY_TAG_PREFIX.length).toLowerCase();
        if (STIMS_CATEGORIES.includes(cat as StimsCategorySlug)) {
          return cat;
        }
      }
    }
    return UNCATEGORIZED_SLUG;
  }

  private normalizeFilePath(rawPath: string): string {
    if (!rawPath || typeof rawPath !== 'string') {
      return '';
    }
    // Replace legacy '/milkdrop-presets/' or 'milkdrop-presets/' with PRESETS_STIMS_PREFIX
    let clean = rawPath.replace(/^\/?milkdrop-presets\//, PRESETS_STIMS_PREFIX);
    if (!clean.startsWith(PRESETS_STIMS_PREFIX)) {
      clean = clean.startsWith('/') ? clean : `/${clean}`;
      if (!clean.startsWith(PRESETS_STIMS_PREFIX)) {
        clean = `${DEFAULT_BASE_PATH}${clean}`;
      }
    }
    return clean;
  }

  // ==========================================================================
  // Filtering Sub-Evaluators
  // ==========================================================================

  private resolveInitialCandidates(options: StimsFilterOptions): StimsPreset[] {
    if (typeof options.category === 'string' && options.category.trim().length > 0) {
      const catSlug = options.category.toLowerCase().replace(/^category:\s*/, '').trim();
      const list = this.categoryIndex.get(catSlug);
      if (list) {
        return list;
      }
    }

    if (typeof options.collection === 'string' && options.collection.trim().length > 0) {
      const colSlug = this.normalizeCollectionQuery(options.collection);
      const list = this.collectionIndex.get(colSlug);
      if (list) {
        return list;
      }
    }

    return this.allPresets;
  }

  private normalizeCollectionQuery(query: string): string {
    if (typeof query !== 'string') {
      return '';
    }
    const stripped = query.toLowerCase().replace(/^collection:\s*/, '').trim();
    if (stripped === 'rovastar-and-collaborators') {
      return ROVASTAR_SHORT_SLUG;
    }
    return stripped;
  }

  private presetMatchesCategory(preset: StimsPreset, categoryQuery: string): boolean {
    if (typeof categoryQuery !== 'string') {
      return false;
    }
    const slug = categoryQuery.toLowerCase().replace(/^category:\s*/, '').trim();
    if (typeof preset.category === 'string' && preset.category.toLowerCase() === slug) {
      return true;
    }
    const fullTag = `${CATEGORY_TAG_PREFIX}${slug}`;
    return Array.isArray(preset.tags) && preset.tags.some((t) => typeof t === 'string' && t.toLowerCase() === fullTag);
  }

  private presetMatchesCollection(preset: StimsPreset, collectionQuery: string): boolean {
    if (typeof collectionQuery !== 'string') {
      return false;
    }
    const slug = this.normalizeCollectionQuery(collectionQuery);
    const expectedTag = COLLECTION_TAG_MAP[slug as StimsCollectionSlug];
    if (expectedTag) {
      return Array.isArray(preset.tags) && preset.tags.includes(expectedTag);
    }
    if (slug === ROVASTAR_SHORT_SLUG) {
      return Array.isArray(preset.tags) && preset.tags.includes(ROVASTAR_COLLECTION_TAG);
    }
    const fallbackTag = `${COLLECTION_TAG_PREFIX}${slug}`;
    return Array.isArray(preset.tags) && preset.tags.includes(fallbackTag);
  }

  private presetPassesFlashRisk(preset: StimsPreset, maxRiskScore: number): boolean {
    const riskLevel: FlashRiskLevel = preset.sensoryProfile?.flashRiskLevel ?? 'none';
    const score = FLASH_RISK_SEVERITY[riskLevel] ?? 0;
    return score <= maxRiskScore;
  }

  private presetMatchesTokens(preset: StimsPreset, tokens: string[]): boolean {
    const cachedText = this.searchableTextCache.get(preset.id);
    if (!cachedText) {
      return false;
    }
    for (const token of tokens) {
      if (!cachedText.includes(token)) {
        return false;
      }
    }
    return true;
  }

  private tokenizeQuery(query: string): string[] {
    if (typeof query !== 'string') {
      return [];
    }
    return query
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((tok) => tok.length > 0);
  }
}

export const stimsCatalogService = StimsCatalogService.getInstance();
