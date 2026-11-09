/**
 * ActivePresetsManager
 *
 * Singleton state manager for user-curated Stims active presets.
 * Implements IActivePresetsManager with resilient localStorage persistence,
 * versioned envelope schema (v1), QuotaExceededError rollback, SecurityError
 * fallback, JSON corruption auto-recovery, and listener pub/sub.
 */

import {
  type ActivePresetsStorageEnvelope,
  type ActiveStimsPresetItem,
  type IActivePresetsManager,
  type StimsPreset
} from './types';

export const ACTIVE_PRESETS_STORAGE_KEY = 'visualizor_active_stims_presets';
export const ACTIVE_PRESETS_SCHEMA_VERSION = 1;

export class ActivePresetsManager implements IActivePresetsManager {
  private static instance: ActivePresetsManager | null = null;

  private initialized = false;
  private inMemoryOnly = false;
  private customStorage: Storage | null = null;

  private presets: ActiveStimsPresetItem[] = [];
  private readonly presetsMap = new Map<string, ActiveStimsPresetItem>();
  private readonly listeners = new Set<() => void>();

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ActivePresetsManager {
    if (!ActivePresetsManager.instance) {
      ActivePresetsManager.instance = new ActivePresetsManager();
    }
    return ActivePresetsManager.instance;
  }

  public static resetInstance(): void {
    ActivePresetsManager.instance = null;
  }

  // ==========================================================================
  // Lifecycle & Storage Initialization
  // ==========================================================================

  public init(customStorage?: Storage): void {
    if (customStorage) {
      this.customStorage = customStorage;
    }

    this.presets = [];
    this.presetsMap.clear();

    const rawJson = this.safeRead();
    if (!rawJson) {
      this.initialized = true;
      return;
    }

    try {
      const parsed: unknown = JSON.parse(rawJson);
      if (!this.isValidEnvelope(parsed)) {
        console.warn('[ActivePresetsManager] Storage envelope invalid; resetting to empty array.');
        this.initialized = true;
        return;
      }

      const validated = this.sanitizeEnvelopeItems(parsed.presets);
      this.presets = validated;
      for (const item of validated) {
        this.presetsMap.set(item.id, item);
      }
    } catch (err) {
      console.warn('[ActivePresetsManager] Corrupted storage JSON; resetting to empty array:', err);
      this.presets = [];
      this.presetsMap.clear();
    }

    this.initialized = true;
  }

  // ==========================================================================
  // Public Contract Methods
  // ==========================================================================

  public getActivePresets(): ActiveStimsPresetItem[] {
    if (!this.initialized) {
      this.init();
    }
    return [...this.presets];
  }

  public isPresetActive(id: string): boolean {
    if (!this.initialized) {
      this.init();
    }
    if (typeof id !== 'string' || !id.trim()) {
      return false;
    }
    return this.presetsMap.has(id.trim());
  }

  public addPreset(preset: StimsPreset): boolean {
    if (!this.initialized) {
      this.init();
    }
    if (!preset || typeof preset !== 'object' || typeof preset.id !== 'string') {
      return false;
    }
    const trimmedId = preset.id.trim();
    if (!trimmedId || this.presetsMap.has(trimmedId)) {
      return false;
    }

    const newItem = this.createPresetItem(preset, trimmedId);
    const nextPresets = [...this.presets, newItem];
    const envelope: ActivePresetsStorageEnvelope = {
      version: ACTIVE_PRESETS_SCHEMA_VERSION,
      presets: nextPresets,
      updatedAt: Date.now()
    };

    const persisted = this.safeWrite(envelope);
    if (!persisted && !this.inMemoryOnly) {
      return false;
    }

    this.presets = nextPresets;
    this.presetsMap.set(trimmedId, newItem);
    this.notifyListeners();
    return true;
  }

  public removePreset(id: string): boolean {
    if (!this.initialized) {
      this.init();
    }
    if (typeof id !== 'string' || !id.trim()) {
      return false;
    }
    const trimmedId = id.trim();
    if (!this.presetsMap.has(trimmedId)) {
      return false;
    }

    const nextPresets = this.presets.filter((p) => p.id !== trimmedId);
    const envelope: ActivePresetsStorageEnvelope = {
      version: ACTIVE_PRESETS_SCHEMA_VERSION,
      presets: nextPresets,
      updatedAt: Date.now()
    };

    const persisted = this.safeWrite(envelope);
    if (!persisted && !this.inMemoryOnly) {
      return false;
    }

    this.presets = nextPresets;
    this.presetsMap.delete(trimmedId);
    this.notifyListeners();
    return true;
  }

  public clearAll(): void {
    if (!this.initialized) {
      this.init();
    }
    const hadItems = this.presets.length > 0;
    this.presets = [];
    this.presetsMap.clear();

    const envelope: ActivePresetsStorageEnvelope = {
      version: ACTIVE_PRESETS_SCHEMA_VERSION,
      presets: [],
      updatedAt: Date.now()
    };

    this.safeWrite(envelope);
    if (hadItems) {
      this.notifyListeners();
    }
  }

  public onChanged(listener: () => void): () => void {
    if (typeof listener !== 'function') {
      return () => {};
    }
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // ==========================================================================
  // Private Sanitization & Helper Methods
  // ==========================================================================

  private createPresetItem(preset: StimsPreset, trimmedId: string): ActiveStimsPresetItem {
    return {
      id: trimmedId,
      title: typeof preset.title === 'string' && preset.title.trim() ? preset.title.trim() : trimmedId,
      author: typeof preset.author === 'string' && preset.author.trim() ? preset.author.trim() : 'Unknown',
      category: typeof preset.category === 'string' && preset.category.trim() ? preset.category.trim() : 'uncategorized',
      file: typeof preset.file === 'string' ? preset.file : '',
      addedAt: Date.now()
    };
  }

  private parseCandidateItem(candidate: Partial<ActiveStimsPresetItem>, trimmedId: string): ActiveStimsPresetItem {
    const title = typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : trimmedId;
    const author = typeof candidate.author === 'string' && candidate.author.trim() ? candidate.author.trim() : 'Unknown';
    const category = typeof candidate.category === 'string' && candidate.category.trim() ? candidate.category.trim() : 'uncategorized';
    const file = typeof candidate.file === 'string' ? candidate.file : '';
    const addedAt = typeof candidate.addedAt === 'number' && !Number.isNaN(candidate.addedAt) ? candidate.addedAt : Date.now();
    return { id: trimmedId, title, author, category, file, addedAt };
  }

  private sanitizeEnvelopeItems(rawList: unknown[]): ActiveStimsPresetItem[] {
    const seenIds = new Set<string>();
    const validated: ActiveStimsPresetItem[] = [];

    for (const item of rawList) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const candidate = item as Partial<ActiveStimsPresetItem>;
      const candidateId = typeof candidate.id === 'string' ? candidate.id.trim() : '';
      if (!candidateId || seenIds.has(candidateId)) {
        continue;
      }
      seenIds.add(candidateId);
      validated.push(this.parseCandidateItem(candidate, candidateId));
    }

    return validated;
  }

  private getStorage(): Storage | null {
    if (this.customStorage) {
      return this.customStorage;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage;
      }
    } catch {
      this.inMemoryOnly = true;
    }
    return null;
  }

  private safeRead(): string | null {
    try {
      const storage = this.getStorage();
      if (!storage) {
        return null;
      }
      return storage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    } catch (err) {
      console.warn('[ActivePresetsManager] SecurityError or access restriction reading storage:', err);
      this.inMemoryOnly = true;
      return null;
    }
  }

  private safeWrite(envelope: ActivePresetsStorageEnvelope): boolean {
    if (this.inMemoryOnly) {
      return true;
    }
    try {
      const storage = this.getStorage();
      if (!storage) {
        return false;
      }
      storage.setItem(ACTIVE_PRESETS_STORAGE_KEY, JSON.stringify(envelope));
      return true;
    } catch (err) {
      console.warn('[ActivePresetsManager] Storage write failure (QuotaExceededError or SecurityError):', err);
      return false;
    }
  }

  private isValidEnvelope(data: unknown): data is ActivePresetsStorageEnvelope {
    if (!data || typeof data !== 'object') {
      return false;
    }
    const envelope = data as Partial<ActivePresetsStorageEnvelope>;
    return (
      envelope.version === ACTIVE_PRESETS_SCHEMA_VERSION &&
      Array.isArray(envelope.presets)
    );
  }

  private notifyListeners(): void {
    const snapshot = Array.from(this.listeners);
    for (const listener of snapshot) {
      try {
        listener();
      } catch (err) {
        console.error('[ActivePresetsManager] Error in change listener:', err);
      }
    }
  }
}

export const activePresetsManager = ActivePresetsManager.getInstance();
