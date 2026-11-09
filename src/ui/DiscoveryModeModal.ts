/**
 * DiscoveryModeModal (Milestone 4)
 *
 * Interactive Stims Preset Discovery Mode UI with:
 * - 10 Visual Style Category chips & 6 Curated Collection filters
 * - Real-time tokenized keyword search
 * - Dynamic random exploration ("🎲 Random Preset")
 * - Live background audio-reactive MilkDrop preview stage
 * - Strict session isolation via VisualizerSessionSnapshot (rollback on cancel/close)
 * - Direct "Add to Active Presets" persistence with instant feedback
 */

import {
  type IActivePresetsManager,
  type IStimsCatalogService,
  type StimsPreset,
  type VisualizerSessionSnapshot,
  STIMS_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  STIMS_COLLECTIONS,
  COLLECTION_DISPLAY_NAMES
} from '../presets/stims/types';
import { StimsCatalogService } from '../presets/stims/StimsCatalogService';
import { ActivePresetsManager } from '../presets/stims/ActivePresetsManager';

export type { VisualizerSessionSnapshot } from '../presets/stims/types';

export interface SessionStatePayload {
  activePresetId: string;
  isMilkdropActive: boolean;
  currentMilkdropPreset: string | null;
  tuningOverrides: Record<string, unknown>;
}

export interface DiscoveryModeCallbacks {
  getSessionState: () => SessionStatePayload;
  restoreSessionState: (snapshot: SessionStatePayload) => void;
  onPreviewPreset: (preset: StimsPreset) => void;
  onKeepPreset?: (preset: StimsPreset) => void;
  onClose?: (restored: boolean) => void;
}

export class DiscoveryModeModal {
  private readonly catalogService: IStimsCatalogService;
  private readonly activeManager: IActivePresetsManager;
  private readonly callbacks: DiscoveryModeCallbacks;

  private isOpenState = false;
  private isPeekMode = false;
  private selectedCategory: string | null = null;
  private selectedCollection: string | null = null;
  private searchQuery = '';
  private previewedPreset: StimsPreset | null = null;
  private sessionSnapshot: VisualizerSessionSnapshot | null = null;
  private filteredPresets: StimsPreset[] = [];
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    callbacks: DiscoveryModeCallbacks,
    catalogService: IStimsCatalogService = StimsCatalogService.getInstance(),
    activeManager: IActivePresetsManager = ActivePresetsManager.getInstance()
  ) {
    this.callbacks = callbacks;
    this.catalogService = catalogService;
    this.activeManager = activeManager;

    this.ensureDomStructure();
    this.bindEvents();

    if ('onHydrated' in this.catalogService && typeof (this.catalogService as StimsCatalogService).onHydrated === 'function') {
      (this.catalogService as StimsCatalogService).onHydrated(() => {
        if (this.isOpenState) {
          this.refreshCatalogResults();
        }
      });
    }

    this.activeManager.onChanged(() => {
      if (this.isOpenState) {
        this.updatePreviewStageUI();
        this.renderPresetCards();
      }
    });
  }

  public isOpen(): boolean {
    return this.isOpenState;
  }

  public getSessionSnapshot(): VisualizerSessionSnapshot | null {
    return this.sessionSnapshot;
  }

  public getPreviewedPreset(): StimsPreset | null {
    return this.previewedPreset;
  }

  public getSelectedCategory(): string | null {
    return this.selectedCategory;
  }

  public getSelectedCollection(): string | null {
    return this.selectedCollection;
  }

  public getSearchQuery(): string {
    return this.searchQuery;
  }

  public getFilteredPresets(): StimsPreset[] {
    return [...this.filteredPresets];
  }

  public createSessionSnapshot(): VisualizerSessionSnapshot {
    const state = this.callbacks.getSessionState();
    const clonedOverrides = { ...state.tuningOverrides };
    const snapshot: VisualizerSessionSnapshot = {
      activePresetId: state.activePresetId,
      isMilkdropActive: state.isMilkdropActive,
      currentMilkdropPreset: state.currentMilkdropPreset,
      tuningOverrides: clonedOverrides,
      restore: () => {
        this.callbacks.restoreSessionState({
          activePresetId: snapshot.activePresetId,
          isMilkdropActive: snapshot.isMilkdropActive,
          currentMilkdropPreset: snapshot.currentMilkdropPreset,
          tuningOverrides: { ...snapshot.tuningOverrides }
        });
      }
    };
    return snapshot;
  }

  public async open(): Promise<void> {
    this.ensureDomStructure();

    if (!this.isOpenState) {
      this.sessionSnapshot = this.createSessionSnapshot();
    }

    this.isOpenState = true;
    this.isPeekMode = false;

    const modalEl = document.getElementById('stimsDiscoveryModal');
    if (modalEl) {
      modalEl.classList.add('open');
      modalEl.classList.remove('peek-mode');
      modalEl.style.display = 'flex';
    }

    if (!this.catalogService.isReady()) {
      await this.catalogService.init({ eagerFullHydration: false });
    }

    this.refreshCatalogResults();

    if (!this.previewedPreset) {
      const initialPreset = this.catalogService.getRandomPreset() || this.filteredPresets[0] || null;
      if (initialPreset) {
        this.previewPreset(initialPreset);
      }
    } else {
      this.previewPreset(this.previewedPreset);
    }
  }

  public close(options?: { restoreSession?: boolean }): void {
    if (!this.isOpenState) return;
    const shouldRestore = options?.restoreSession !== false;

    this.isOpenState = false;
    this.isPeekMode = false;

    const modalEl = document.getElementById('stimsDiscoveryModal');
    if (modalEl) {
      modalEl.classList.remove('open');
      modalEl.classList.remove('peek-mode');
      modalEl.style.display = 'none';
    }

    if (shouldRestore && this.sessionSnapshot) {
      this.sessionSnapshot.restore();
    } else if (!shouldRestore && this.previewedPreset) {
      this.callbacks.onKeepPreset?.(this.previewedPreset);
    }

    this.sessionSnapshot = null;
    this.callbacks.onClose?.(shouldRestore);
  }

  public selectCategory(categorySlug: string | null): void {
    const normalized = !categorySlug || categorySlug === 'all' ? null : categorySlug;
    this.selectedCategory = normalized;
    this.refreshCatalogResults();
  }

  public selectCollection(collectionSlug: string | null): void {
    const normalized = !collectionSlug || collectionSlug === 'all' ? null : collectionSlug;
    this.selectedCollection = normalized;
    this.refreshCatalogResults();
  }

  public setSearchQuery(query: string): void {
    this.searchQuery = query;
    const searchInput = document.getElementById('discoverySearchInput') as HTMLInputElement | null;
    if (searchInput && searchInput.value !== query) {
      searchInput.value = query;
    }
    this.refreshCatalogResults();
  }

  public pickRandomPreset(): StimsPreset | null {
    const randomPreset = this.catalogService.getRandomPreset({
      category: this.selectedCategory ?? undefined,
      collection: this.selectedCollection ?? undefined,
      searchQuery: this.searchQuery || undefined,
      excludeId: this.previewedPreset?.id
    });

    if (randomPreset) {
      this.previewPreset(randomPreset);
    }
    return randomPreset;
  }

  public previewPreset(preset: StimsPreset): void {
    this.previewedPreset = preset;
    this.callbacks.onPreviewPreset(preset);
    this.updatePreviewStageUI();
    this.highlightActiveCard();
  }

  public toggleActivePreset(preset?: StimsPreset): boolean {
    const target = preset ?? this.previewedPreset;
    if (!target) return false;

    const alreadyActive = this.activeManager.isPresetActive(target.id);
    if (alreadyActive) {
      this.activeManager.removePreset(target.id);
      this.showToast(`Removed "${target.title}" from Active Presets`);
      this.updatePreviewStageUI();
      this.renderPresetCards();
      return false;
    } else {
      this.activeManager.addPreset(target);
      this.showToast(`✨ Added "${target.title}" to Active Presets!`);
      this.updatePreviewStageUI();
      this.renderPresetCards();
      return true;
    }
  }

  public addCurrentToActivePresets(): boolean {
    if (!this.previewedPreset) return false;
    if (this.activeManager.isPresetActive(this.previewedPreset.id)) {
      this.showToast(`✓ "${this.previewedPreset.title}" is already in Active Presets`);
      return false;
    }
    const added = this.activeManager.addPreset(this.previewedPreset);
    if (added) {
      this.showToast(`✨ Added "${this.previewedPreset.title}" to Active Presets!`);
      this.updatePreviewStageUI();
      this.renderPresetCards();
    }
    return added;
  }

  private refreshCatalogResults(): void {
    this.filteredPresets = this.catalogService.filterPresets({
      category: this.selectedCategory ?? undefined,
      collection: this.selectedCollection ?? undefined,
      searchQuery: this.searchQuery || undefined
    });

    this.renderCategoryChips();
    this.renderCollectionChips();
    this.renderPresetCards();
    this.updatePreviewStageUI();

    const countEl = document.getElementById('discoveryResultsCount');
    if (countEl) {
      const total = this.catalogService.getAllPresets().length;
      countEl.textContent = `${this.filteredPresets.length} / ${total} presets`;
    }
  }

  private ensureDomStructure(): void {
    let modal = document.getElementById('stimsDiscoveryModal');
    if (modal) return;

    modal = document.createElement('div');
    modal.id = 'stimsDiscoveryModal';
    modal.className = 'discovery-modal-overlay';
    modal.style.display = 'none';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'discoveryModalTitle');

    modal.innerHTML = `
      <div class="discovery-modal-shell glass-panel">
        <div class="discovery-header">
          <div class="discovery-header-left">
            <span class="discovery-badge-pill">STIMS CATALOG</span>
            <h2 id="discoveryModalTitle" class="discovery-title">Discovery Mode</h2>
            <span id="discoveryResultsCount" class="discovery-results-count">0 presets</span>
          </div>
          <div class="discovery-header-actions">
            <button type="button" class="btn-pill discovery-peek-btn" id="discoveryPeekBtn" title="Peek full-screen live canvas">
              👁 Peek Canvas
            </button>
            <button type="button" class="btn-pill btn-pill-dice" id="discoveryRandomBtn" title="Pick a random preset in current category">
              🎲 Discover Random
            </button>
            <button type="button" class="btn-icon" id="discoveryCloseBtn" aria-label="Close Discovery Mode" title="Cancel and restore previous preset (Esc)">✕</button>
          </div>
        </div>

        <div class="discovery-Preview-Stage" id="discoveryPreviewStage">
          <div class="discovery-preview-meta">
            <div class="discovery-preview-kicker">LIVE AUDIO-REACTIVE PREVIEW (ISOLATED SESSION)</div>
            <div class="discovery-preview-title" id="discoveryPreviewTitle">Select or roll a preset</div>
            <div class="discovery-preview-sub">
              <span id="discoveryPreviewAuthor">by Unknown</span>
              <span class="discovery-dot">•</span>
              <span class="discovery-cat-tag" id="discoveryPreviewCategory">fractal</span>
            </div>
            <div class="discovery-preview-desc" id="discoveryPreviewDesc">
              Audio-reactive MilkDrop shader rendered live in the background.
            </div>
          </div>
          <div class="discovery-preview-cta">
            <button type="button" class="btn-primary discovery-add-active-btn" id="discoveryAddActiveBtn">
              ＋ Add to Active Presets
            </button>
            <div class="discovery-secondary-actions">
              <button type="button" class="btn-pill" id="discoveryKeepBtn" title="Keep playing this preset and exit Discovery Mode">
                ▶ Use & Exit
              </button>
              <button type="button" class="btn-pill" id="discoveryCancelBtn" title="Restore previous visualizer preset">
                ↺ Restore Previous
              </button>
            </div>
          </div>
        </div>

        <div class="discovery-controls-bar">
          <div class="discovery-search-wrap">
            <input type="text" id="discoverySearchInput" class="drawer-search" placeholder="🔍 Search 1,787+ Stims presets by title, author, vibe, or tag..." aria-label="Search Stims catalog">
          </div>
          <div class="discovery-categories-row" id="discoveryCategoriesRow" role="tablist" aria-label="Stims visual categories"></div>
          <div class="discovery-collections-row" id="discoveryCollectionsRow" aria-label="Stims curated collections"></div>
        </div>

        <div class="discovery-grid-scroll" id="discoveryGridScroll">
          <div class="discovery-presets-grid" id="discoveryPresetsGrid"></div>
        </div>

        <div class="discovery-toast" id="discoveryToast" style="display:none;"></div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  private bindEvents(): void {
    const closeBtn = document.getElementById('discoveryCloseBtn');
    closeBtn?.addEventListener('click', () => {
      this.close({ restoreSession: true });
    });

    const cancelBtn = document.getElementById('discoveryCancelBtn');
    cancelBtn?.addEventListener('click', () => {
      this.close({ restoreSession: true });
    });

    const keepBtn = document.getElementById('discoveryKeepBtn');
    keepBtn?.addEventListener('click', () => {
      if (this.previewedPreset) {
        this.activeManager.addPreset(this.previewedPreset);
      }
      this.close({ restoreSession: false });
    });

    const randomBtn = document.getElementById('discoveryRandomBtn');
    randomBtn?.addEventListener('click', () => {
      this.pickRandomPreset();
    });

    const addActiveBtn = document.getElementById('discoveryAddActiveBtn');
    addActiveBtn?.addEventListener('click', () => {
      this.toggleActivePreset();
    });

    const peekBtn = document.getElementById('discoveryPeekBtn');
    peekBtn?.addEventListener('click', () => {
      this.isPeekMode = !this.isPeekMode;
      const modal = document.getElementById('stimsDiscoveryModal');
      modal?.classList.toggle('peek-mode', this.isPeekMode);
      if (peekBtn) {
        peekBtn.textContent = this.isPeekMode ? '🗖 Show Catalog' : '👁 Peek Canvas';
      }
    });

    const searchInput = document.getElementById('discoverySearchInput') as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => {
      this.setSearchQuery(searchInput.value);
    });
  }

  private renderCategoryChips(): void {
    const row = document.getElementById('discoveryCategoriesRow');
    if (!row) return;
    row.innerHTML = '';

    const categories = this.catalogService.getCategories();
    const totalCount = this.catalogService.getAllPresets().length;

    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `discovery-cat-chip ${this.selectedCategory === null ? 'active' : ''}`;
    allBtn.setAttribute('data-stims-category', 'all');
    allBtn.innerHTML = `<span>All</span><span class="chip-count">${totalCount}</span>`;
    allBtn.addEventListener('click', () => this.selectCategory(null));
    row.appendChild(allBtn);

    for (const slug of STIMS_CATEGORIES) {
      const catInfo = categories.find(c => c.slug === slug);
      const count = catInfo ? catInfo.count : 0;
      const label = CATEGORY_DISPLAY_NAMES[slug] || slug;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `discovery-cat-chip ${this.selectedCategory === slug ? 'active' : ''}`;
      btn.setAttribute('data-stims-category', slug);
      btn.innerHTML = `<span>${label}</span><span class="chip-count">${count}</span>`;
      btn.addEventListener('click', () => this.selectCategory(slug));
      row.appendChild(btn);
    }
  }

  private renderCollectionChips(): void {
    const row = document.getElementById('discoveryCollectionsRow');
    if (!row) return;
    row.innerHTML = '';

    const collections = this.catalogService.getCollections();

    const allColBtn = document.createElement('button');
    allColBtn.type = 'button';
    allColBtn.className = `discovery-col-chip ${this.selectedCollection === null ? 'active' : ''}`;
    allColBtn.setAttribute('data-stims-collection', 'all');
    allColBtn.textContent = 'All Collections';
    allColBtn.addEventListener('click', () => this.selectCollection(null));
    row.appendChild(allColBtn);

    for (const slug of STIMS_COLLECTIONS) {
      const colInfo = collections.find(c => c.slug === slug);
      const count = colInfo ? colInfo.count : 0;
      const label = COLLECTION_DISPLAY_NAMES[slug] || slug;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `discovery-col-chip ${this.selectedCollection === slug ? 'active' : ''}`;
      btn.setAttribute('data-stims-collection', slug);
      btn.textContent = `${label} (${count})`;
      btn.addEventListener('click', () => this.selectCollection(slug));
      row.appendChild(btn);
    }
  }

  private renderPresetCards(): void {
    const grid = document.getElementById('discoveryPresetsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const displaySlice = this.filteredPresets.slice(0, 60);

    if (displaySlice.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'discovery-empty-state';
      empty.textContent = 'No presets match the current filter criteria.';
      grid.appendChild(empty);
      return;
    }

    for (const preset of displaySlice) {
      const isPreviewing = this.previewedPreset?.id === preset.id;
      const isAdded = this.activeManager.isPresetActive(preset.id);

      const card = document.createElement('div');
      card.className = `discovery-preset-card ${isPreviewing ? 'previewing' : ''} ${isAdded ? 'is-added' : ''}`;
      card.setAttribute('data-discovery-preset-id', preset.id);
      card.setAttribute('data-category', preset.category);

      const titleEl = document.createElement('div');
      titleEl.className = 'discovery-card-title';
      titleEl.textContent = preset.title;

      const authorEl = document.createElement('div');
      authorEl.className = 'discovery-card-author';
      authorEl.textContent = `by ${preset.author}`;

      const footerEl = document.createElement('div');
      footerEl.className = 'discovery-card-footer';

      const catBadge = document.createElement('span');
      catBadge.className = 'discovery-card-cat';
      catBadge.textContent = preset.category;

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = `discovery-card-add-btn ${isAdded ? 'added' : ''}`;
      addBtn.setAttribute('data-add-preset-id', preset.id);
      addBtn.textContent = isAdded ? '✓ Active' : '＋ Add';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleActivePreset(preset);
      });

      footerEl.appendChild(catBadge);
      footerEl.appendChild(addBtn);

      card.appendChild(titleEl);
      card.appendChild(authorEl);
      card.appendChild(footerEl);

      card.addEventListener('click', () => {
        this.previewPreset(preset);
      });

      grid.appendChild(card);
    }
  }

  private updatePreviewStageUI(): void {
    const titleEl = document.getElementById('discoveryPreviewTitle');
    const authorEl = document.getElementById('discoveryPreviewAuthor');
    const catEl = document.getElementById('discoveryPreviewCategory');
    const descEl = document.getElementById('discoveryPreviewDesc');
    const addBtn = document.getElementById('discoveryAddActiveBtn');

    if (!this.previewedPreset) {
      if (titleEl) titleEl.textContent = 'Select or roll a preset';
      if (authorEl) authorEl.textContent = 'by Stims Community';
      if (catEl) catEl.textContent = 'all';
      if (descEl) descEl.textContent = 'Click any card below or click "Discover Random" to preview live.';
      return;
    }

    const p = this.previewedPreset;
    if (titleEl) titleEl.textContent = p.title;
    if (authorEl) authorEl.textContent = `by ${p.author}`;
    if (catEl) catEl.textContent = p.category;
    if (descEl) {
      descEl.textContent = p.description || `Audio-reactive ${p.category} visualizer preset (${p.file}).`;
    }

    if (addBtn) {
      const isAdded = this.activeManager.isPresetActive(p.id);
      addBtn.textContent = isAdded ? '✓ In Active Presets (Click to Remove)' : '＋ Add to Active Presets';
      addBtn.classList.toggle('is-active-preset', isAdded);
    }
  }

  private highlightActiveCard(): void {
    const grid = document.getElementById('discoveryPresetsGrid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.discovery-preset-card');
    cards.forEach(card => {
      const id = card.getAttribute('data-discovery-preset-id');
      card.classList.toggle('previewing', id === this.previewedPreset?.id);
    });
  }

  private showToast(msg: string): void {
    const toast = document.getElementById('discoveryToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      toast.style.display = 'none';
    }, 2400);
  }
}
