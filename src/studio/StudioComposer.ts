import * as THREE from 'three';
import { VisualizerPreset, PresetContext, AudioFeatures, VisualizerTheme, ParameterDefinition } from '../types';
import {
  EngineFamily,
  EngineRecipe,
  StudioRecipe,
  StageConfig,
  HeroConfig,
  MoodConfig,
  ENGINE_FAMILIES_META,
  BASE_GENE_DEFAULTS,
  FAMILY_GENE_DEFAULTS,
  DEFAULT_STAGE_CONFIG,
  DEFAULT_HERO_CONFIG,
  DEFAULT_MOOD_CONFIG,
  clampNumber,
  hashPromptToSeed,
  createPrng
} from './types';

export interface StudioStageConfig {
  chromaIntensity: number;   // 0.0 - 2.0
  liquidWarp: number;        // 0.0 - 2.0
  tunnelDepth: number;       // 0.0 - 2.0
  volumeDensity: number;     // 0.0 - 2.0
  theForceAttraction: number;// -2.0 - 2.0 (repulsion to attraction)
}

const STORAGE_KEY_CREATIONS = 'visuval_studio_creations';
const STORAGE_KEY_RECIPES = 'visuval_studio_recipes_v2';
const STORAGE_KEY_ACTIVE = 'visuval_studio_active_recipe_v2';

/**
 * Creates default initial genes for an engine family
 */
export function createDefaultGenes(family: EngineFamily): Record<string, number> {
  return {
    ...BASE_GENE_DEFAULTS,
    ...(FAMILY_GENE_DEFAULTS[family] || {})
  };
}

/**
 * Creates a default EngineRecipe
 */
export function createDefaultRecipe(family: EngineFamily = 'force', name?: string): EngineRecipe {
  const meta = ENGINE_FAMILIES_META[family];
  return {
    kind: 'engine',
    engineVersion: 2,
    id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || `${meta.label} Space 1`,
    familyId: family,
    seed: meta.defaultSeed,
    stage: { ...DEFAULT_STAGE_CONFIG },
    hero: { ...DEFAULT_HERO_CONFIG },
    mood: { ...DEFAULT_MOOD_CONFIG },
    genes: createDefaultGenes(family),
    themeId: 'ember',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
}

/**
 * Studio Recipe Manager handles state, generation modes, and persistence
 */
export class StudioRecipeManager {
  private activeRecipe: StudioRecipe;
  private draftRecipe: StudioRecipe;
  private savedRecipes: StudioRecipe[] = [];
  private onActiveRecipeChange?: (recipe: StudioRecipe) => void;

  constructor(listener?: (recipe: StudioRecipe) => void) {
    this.onActiveRecipeChange = listener;
    this.activeRecipe = createDefaultRecipe('force');
    this.draftRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    this.loadFromStorage();
  }

  public setChangeListener(listener: (recipe: StudioRecipe) => void) {
    this.onActiveRecipeChange = listener;
  }

  public getActiveRecipe(): StudioRecipe {
    return this.activeRecipe;
  }

  public getDraftRecipe(): StudioRecipe {
    return this.draftRecipe;
  }

  public getSavedRecipes(): StudioRecipe[] {
    return [...this.savedRecipes];
  }

  public setEngineFamily(family: EngineFamily): void {
    if (this.activeRecipe.kind === 'engine') {
      this.activeRecipe.familyId = family;
      this.activeRecipe.genes = createDefaultGenes(family);
      this.activeRecipe.seed = ENGINE_FAMILIES_META[family]?.defaultSeed || 2867;
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    this.notifyChange();
    this.persistActive();
  }

  public setGene(key: string, value: number): void {
    const clamped = clampNumber(value, -2.0, 3.0, 1.0);
    if (this.activeRecipe.kind === 'engine') {
      this.activeRecipe.genes[key] = clamped;
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    this.notifyChange();
    this.persistActive();
  }

  public setStage(stage: Partial<StageConfig>): void {
    if (this.activeRecipe.kind === 'engine' && this.activeRecipe.stage) {
      Object.assign(this.activeRecipe.stage, stage);
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    this.notifyChange();
    this.persistActive();
  }

  public setHero(hero: Partial<HeroConfig>): void {
    if (this.activeRecipe.kind === 'engine' && this.activeRecipe.hero) {
      Object.assign(this.activeRecipe.hero, hero);
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    this.notifyChange();
    this.persistActive();
  }

  public setMood(mood: Partial<MoodConfig>): void {
    if (this.activeRecipe.kind === 'engine' && this.activeRecipe.mood) {
      Object.assign(this.activeRecipe.mood, mood);
      this.activeRecipe.updatedAt = Date.now();
    }
    this.draftRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    this.notifyChange();
    this.persistActive();
  }

  /**
   * Generation Mode 1: Auto-Forge (Create)
   * Randomized 32-bit uint seed and bounded parameter exploration
   */
  public generateRandomRecipe(family?: EngineFamily): StudioRecipe {
    const families: EngineFamily[] = ['chroma', 'fluid', 'tunnel', 'volume', 'force'];
    const chosenFamily = family || families[Math.floor(Math.random() * families.length)];
    const seed = (Math.random() * 0xffffffff) >>> 0;
    const rng = createPrng(seed);

    const recipe = createDefaultRecipe(chosenFamily, `Forged ${ENGINE_FAMILIES_META[chosenFamily].label} #${seed.toString(16).slice(-4).toUpperCase()}`);
    recipe.seed = seed;

    // Randomize base genes
    recipe.genes.scale = +(0.5 + rng() * 1.5).toFixed(2);
    recipe.genes.warp = +(rng()).toFixed(2);
    recipe.genes.flow = +(rng()).toFixed(2);
    recipe.genes.filament = +(rng()).toFixed(2);
    recipe.genes.depth = +(rng()).toFixed(2);
    recipe.genes.spin = +(rng()).toFixed(2);
    recipe.genes.glow = +(0.2 + rng() * 0.8).toFixed(2);
    recipe.genes.kickGain = +(0.3 + rng() * 0.7).toFixed(2);

    // Randomize family genes
    const famDefaults = FAMILY_GENE_DEFAULTS[chosenFamily];
    if (famDefaults) {
      for (const k of Object.keys(famDefaults)) {
        recipe.genes[k] = +(rng()).toFixed(3);
      }
    }

    if (recipe.stage) {
      recipe.stage.scale = +(0.6 + rng() * 1.4).toFixed(1);
      recipe.stage.dustDensity = +(rng() * 2.0).toFixed(1);
      recipe.stage.lightIntensity = +(0.5 + rng() * 2.0).toFixed(1);
    }
    if (recipe.hero) {
      recipe.hero.deformation = +(rng() * 2.0).toFixed(1);
      recipe.hero.scale = +(0.6 + rng() * 1.4).toFixed(1);
    }
    if (recipe.mood) {
      recipe.mood.bloomIntensity = +(0.5 + rng() * 2.0).toFixed(1);
      recipe.mood.speedMultiplier = +(0.5 + rng() * 1.5).toFixed(1);
    }

    this.applyRecipe(recipe);
    return recipe;
  }

  /**
   * Generation Mode 2: Curated (Complex / Prompt)
   * Uses FNV-1a hash to deterministically derive harmonic seed and genes from prompt
   */
  public generateCuratedRecipe(prompt: string = '', family?: EngineFamily): StudioRecipe {
    const seed = hashPromptToSeed(prompt || 'Visuval Harmonic Synthesis');
    const rng = createPrng(seed);
    const families: EngineFamily[] = ['chroma', 'fluid', 'tunnel', 'volume', 'force'];
    const chosenFamily = family || families[seed % families.length];

    const label = prompt.trim() || `${ENGINE_FAMILIES_META[chosenFamily].label} Curated`;
    const recipe = createDefaultRecipe(chosenFamily, label);
    recipe.seed = seed;

    // Deterministic harmonic derivation
    recipe.genes.scale = +(0.8 + rng() * 0.8).toFixed(2);
    recipe.genes.warp = +(0.2 + rng() * 0.6).toFixed(2);
    recipe.genes.flow = +(0.2 + rng() * 0.6).toFixed(2);
    recipe.genes.depth = +(0.3 + rng() * 0.6).toFixed(2);
    recipe.genes.glow = +(0.4 + rng() * 0.6).toFixed(2);
    recipe.genes.kickGain = +(0.4 + rng() * 0.5).toFixed(2);

    const famDefaults = FAMILY_GENE_DEFAULTS[chosenFamily];
    if (famDefaults) {
      for (const k of Object.keys(famDefaults)) {
        recipe.genes[k] = +(0.2 + rng() * 0.6).toFixed(3);
      }
    }

    this.applyRecipe(recipe);
    return recipe;
  }

  /**
   * Generation Mode 3: Guided Remix (Enhance)
   * Controlled stochastic perturbation (±10% to ±25%) of current active recipe
   */
  public remixCurrent(): StudioRecipe {
    const base = JSON.parse(JSON.stringify(this.activeRecipe)) as StudioRecipe;
    if (base.kind === 'engine') {
      base.id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      base.name = `Remix of ${base.name}`;
      base.seed = (Math.imul(base.seed || 12345, 1664525) + 1013904223) >>> 0;
      base.updatedAt = Date.now();

      const rng = createPrng(base.seed);
      // Perturb ~40% of gene parameters by +/- 15-25%
      for (const [key, val] of Object.entries(base.genes)) {
        if (rng() < 0.45) {
          const delta = (rng() * 2 - 1) * 0.22;
          base.genes[key] = +(clampNumber(val + delta, 0.0, 2.5, val)).toFixed(3);
        }
      }

      if (base.stage) {
        base.stage.scale = +(clampNumber(base.stage.scale + (rng() - 0.5) * 0.4, 0.5, 2.5, 1.0)).toFixed(1);
        base.stage.dustDensity = +(clampNumber(base.stage.dustDensity + (rng() - 0.5) * 0.4, 0.0, 2.0, 1.0)).toFixed(1);
      }
      if (base.hero) {
        base.hero.deformation = +(clampNumber(base.hero.deformation + (rng() - 0.5) * 0.4, 0.0, 2.5, 1.0)).toFixed(1);
      }
      if (base.mood) {
        base.mood.bloomIntensity = +(clampNumber(base.mood.bloomIntensity + (rng() - 0.5) * 0.4, 0.0, 3.0, 1.2)).toFixed(1);
      }
    }

    this.applyRecipe(base);
    return base;
  }

  public applyRecipe(recipe: StudioRecipe): void {
    if (!recipe || typeof recipe !== 'object') return;
    this.activeRecipe = JSON.parse(JSON.stringify(recipe));
    this.draftRecipe = JSON.parse(JSON.stringify(recipe));
    this.notifyChange();
    this.persistActive();
  }

  public saveRecipe(name: string): StudioRecipe {
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      throw new Error('Recipe title is required to save');
    }

    const saved: StudioRecipe = JSON.parse(JSON.stringify(this.activeRecipe));
    saved.id = `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    saved.name = trimmed.slice(0, 60);
    saved.createdAt = Date.now();
    saved.updatedAt = Date.now();

    const existingIdx = this.savedRecipes.findIndex(r => r.name.toLowerCase() === saved.name.toLowerCase());
    if (existingIdx >= 0) {
      this.savedRecipes[existingIdx] = saved;
    } else {
      this.savedRecipes.unshift(saved);
    }

    this.persistAll();
    this.applyRecipe(saved);
    return saved;
  }

  public loadRecipe(id: string): boolean {
    const found = this.savedRecipes.find(r => r.id === id);
    if (!found) return false;
    this.applyRecipe(found);
    return true;
  }

  public deleteRecipe(id: string): boolean {
    const lenBefore = this.savedRecipes.length;
    this.savedRecipes = this.savedRecipes.filter(r => r.id !== id);
    if (this.savedRecipes.length !== lenBefore) {
      this.persistAll();
      return true;
    }
    return false;
  }

  public exportRecipeJson(recipe?: StudioRecipe): string {
    const target = recipe || this.activeRecipe;
    return JSON.stringify(target, null, 2);
  }

  public importRecipeJson(jsonStr: string): StudioRecipe | null {
    if (typeof jsonStr !== 'string') return null;
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') return null;
      if (!parsed.name || typeof parsed.name !== 'string') return null;

      const family: EngineFamily = ['chroma', 'fluid', 'tunnel', 'volume', 'force'].includes(parsed.familyId)
        ? parsed.familyId
        : 'force';

      const imported: EngineRecipe = {
        kind: 'engine',
        engineVersion: 2,
        id: `sc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: String(parsed.name).trim().slice(0, 60),
        familyId: family,
        seed: Number(parsed.seed) >>> 0 || ENGINE_FAMILIES_META[family]?.defaultSeed || 2867,
        stage: { ...DEFAULT_STAGE_CONFIG, ...(parsed.stage || {}) },
        hero: { ...DEFAULT_HERO_CONFIG, ...(parsed.hero || {}) },
        mood: { ...DEFAULT_MOOD_CONFIG, ...(parsed.mood || {}) },
        genes: { ...createDefaultGenes(family), ...(parsed.genes || {}) },
        createdAt: Number(parsed.createdAt) || Date.now(),
        updatedAt: Date.now()
      };

      // Sanitize all numeric genes
      for (const [k, v] of Object.entries(imported.genes)) {
        imported.genes[k] = clampNumber(v, -2.0, 3.0, 1.0);
      }

      this.savedRecipes.unshift(imported);
      this.persistAll();
      this.applyRecipe(imported);
      return imported;
    } catch {
      return null;
    }
  }

  private notifyChange(): void {
    if (this.onActiveRecipeChange) {
      this.onActiveRecipeChange(this.activeRecipe);
    }
  }

  private persistActive(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ACTIVE, JSON.stringify(this.activeRecipe));
      }
    } catch {
      // Graceful fallback on quota errors
    }
  }

  private persistAll(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const data = JSON.stringify(this.savedRecipes);
        localStorage.setItem(STORAGE_KEY_CREATIONS, data);
        localStorage.setItem(STORAGE_KEY_RECIPES, data);
        this.persistActive();
      }
    } catch {
      // Graceful fallback on quota errors
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;

      const rawSaved = localStorage.getItem(STORAGE_KEY_CREATIONS) || localStorage.getItem(STORAGE_KEY_RECIPES);
      if (rawSaved) {
        const parsed = JSON.parse(rawSaved);
        if (Array.isArray(parsed)) {
          this.savedRecipes = parsed.filter(item => item && typeof item === 'object' && item.name);
        }
      }

      const rawActive = localStorage.getItem(STORAGE_KEY_ACTIVE);
      if (rawActive) {
        const parsedActive = JSON.parse(rawActive);
        if (parsedActive && typeof parsedActive === 'object' && parsedActive.name) {
          this.activeRecipe = parsedActive;
          this.draftRecipe = JSON.parse(JSON.stringify(parsedActive));
        }
      }
    } catch {
      // Corrupted storage fallback: keep defaults without throwing
      this.savedRecipes = [];
    }
  }
}

/**
 * Visualizer Studio Composer Preset (Ticket #44)
 */
export class StudioComposerPreset implements VisualizerPreset {
  id = 'studio-composer';
  name = 'Visualizer Studio';
  category = 'Structures' as const;
  description = 'Multi-layer stage composer blending Chroma, Liquid, Tunnel, Volume, and The Force.';

  public config: StudioStageConfig = {
    chromaIntensity: 1.0,
    liquidWarp: 1.0,
    tunnelDepth: 1.0,
    volumeDensity: 1.0,
    theForceAttraction: 1.0
  };

  private readonly recipeManager: StudioRecipeManager;
  private group!: THREE.Group;

  // Layer 1: Liquid Warp Plane
  private liquidMesh!: THREE.Mesh;
  private liquidMaterial!: THREE.ShaderMaterial;

  // Layer 2: Tunnel Corridor Frames
  private tunnelGroup!: THREE.Group;
  private readonly tunnelFrames: THREE.LineLoop[] = [];
  private readonly frameCount = 16;

  // Layer 3: Volume Particle Cloud & The Force Physics
  private volumeParticles!: THREE.Points;
  private volumePositions!: Float32Array;
  private volumeVelocities!: Float32Array;
  private volumeMaterial!: THREE.PointsMaterial;
  private readonly particleCount = 2000;

  // Layer 4: The Force Singularity Attractor
  private forceCore!: THREE.Mesh;
  private forceMaterial!: THREE.MeshStandardMaterial;

  constructor() {
    this.recipeManager = new StudioRecipeManager(recipe => this.syncFromRecipe(recipe));
    this.syncFromRecipe(this.recipeManager.getActiveRecipe());
  }

  public getRecipeManager(): StudioRecipeManager {
    return this.recipeManager;
  }

  public getActiveRecipe(): StudioRecipe {
    return this.recipeManager.getActiveRecipe();
  }

  public getDraftRecipe(): StudioRecipe {
    return this.recipeManager.getDraftRecipe();
  }

  public getSavedRecipes(): StudioRecipe[] {
    return this.recipeManager.getSavedRecipes();
  }

  public setEngineFamily(family: EngineFamily): void {
    this.recipeManager.setEngineFamily(family);
  }

  public setGene(key: string, value: number): void {
    this.recipeManager.setGene(key, value);
  }

  public setStage(stage: Partial<StageConfig>): void {
    this.recipeManager.setStage(stage);
  }

  public setHero(hero: Partial<HeroConfig>): void {
    this.recipeManager.setHero(hero);
  }

  public setMood(mood: Partial<MoodConfig>): void {
    this.recipeManager.setMood(mood);
  }

  public generateRandomRecipe(family?: EngineFamily): StudioRecipe {
    return this.recipeManager.generateRandomRecipe(family);
  }

  public generateCuratedRecipe(prompt?: string, family?: EngineFamily): StudioRecipe {
    return this.recipeManager.generateCuratedRecipe(prompt || '', family);
  }

  public remixCurrent(): StudioRecipe {
    return this.recipeManager.remixCurrent();
  }

  public applyRecipe(recipe: StudioRecipe): void {
    this.recipeManager.applyRecipe(recipe);
    this.syncFromRecipe(recipe);
  }

  public saveRecipe(name: string): StudioRecipe {
    return this.recipeManager.saveRecipe(name);
  }

  public loadRecipe(id: string): boolean {
    const success = this.recipeManager.loadRecipe(id);
    if (success) {
      this.syncFromRecipe(this.recipeManager.getActiveRecipe());
    }
    return success;
  }

  public deleteRecipe(id: string): boolean {
    return this.recipeManager.deleteRecipe(id);
  }

  public exportRecipeJson(recipe?: StudioRecipe): string {
    return this.recipeManager.exportRecipeJson(recipe);
  }

  public importRecipeJson(jsonStr: string): StudioRecipe | null {
    const imported = this.recipeManager.importRecipeJson(jsonStr);
    if (imported) {
      this.syncFromRecipe(imported);
    }
    return imported;
  }

  private syncFromEngineConfig(conf: Record<string, unknown>): void {
    if (typeof conf.chromaIntensity === 'number') {
      this.config.chromaIntensity = clampNumber(conf.chromaIntensity, 0.0, 2.0, 1.0);
    }
    if (typeof conf.liquidWarp === 'number') {
      this.config.liquidWarp = clampNumber(conf.liquidWarp, 0.0, 2.0, 1.0);
    }
    if (typeof conf.tunnelDepth === 'number') {
      this.config.tunnelDepth = clampNumber(conf.tunnelDepth, 0.0, 2.0, 1.0);
    }
    if (typeof conf.volumeDensity === 'number') {
      this.config.volumeDensity = clampNumber(conf.volumeDensity, 0.0, 2.0, 1.0);
    }
    if (typeof conf.theForceAttraction === 'number') {
      this.config.theForceAttraction = clampNumber(conf.theForceAttraction, -2.0, 2.0, 1.0);
    }
  }

  private syncFromGenes(genes: Record<string, number>): void {
    this.config.chromaIntensity = clampNumber(genes.bloom ?? genes.glow ?? 1.0, 0.0, 2.0, 1.0);
    this.config.liquidWarp = clampNumber((genes.warp ?? 0.45) * 2.0, 0.0, 2.0, 1.0);
    this.config.tunnelDepth = clampNumber((genes.depth ?? 0.45) * 2.0, 0.0, 2.0, 1.0);
    this.config.volumeDensity = clampNumber(genes.filament ?? genes.scale ?? 1.0, 0.0, 2.0, 1.0);
    this.config.theForceAttraction = clampNumber((genes.spin ?? 0.3) * 4.0 - 2.0, -2.0, 2.0, 1.0);
  }

  private syncFromRecipe(recipe: StudioRecipe | Record<string, unknown>): void {
    if (!recipe || typeof recipe !== 'object') return;

    const anyRecipe = recipe as Record<string, unknown>;
    const engineConf = (anyRecipe.engine || anyRecipe.stageConfig) as Record<string, unknown> | undefined;
    if (engineConf && typeof engineConf === 'object') {
      this.syncFromEngineConfig(engineConf);
      return;
    }

    if ('genes' in anyRecipe && anyRecipe.genes && typeof anyRecipe.genes === 'object') {
      this.syncFromGenes(anyRecipe.genes as Record<string, number>);
    }
  }

  // Milestone 3 Fine-Tuning Drawer integration
  getCustomParameters(): ParameterDefinition[] {
    return [
      { id: 'chromaIntensity', name: 'Chroma Intensity', min: 0.0, max: 2.0, step: 0.1, defaultValue: 1.0, currentValue: this.config.chromaIntensity },
      { id: 'liquidWarp', name: 'Liquid Warp', min: 0.0, max: 2.0, step: 0.1, defaultValue: 1.0, currentValue: this.config.liquidWarp },
      { id: 'tunnelDepth', name: 'Tunnel Depth', min: 0.0, max: 2.0, step: 0.1, defaultValue: 1.0, currentValue: this.config.tunnelDepth },
      { id: 'volumeDensity', name: 'Volume Density', min: 0.0, max: 2.0, step: 0.1, defaultValue: 1.0, currentValue: this.config.volumeDensity },
      { id: 'theForceAttraction', name: 'The Force Attraction', min: -2.0, max: 2.0, step: 0.2, defaultValue: 1.0, currentValue: this.config.theForceAttraction }
    ];
  }

  setCustomParameter(id: string, value: number): void {
    const val = clampNumber(value, -2.0, 2.0, 1.0);
    switch (id) {
      case 'chromaIntensity': this.config.chromaIntensity = clampNumber(val, 0.0, 2.0, 1.0); break;
      case 'liquidWarp': this.config.liquidWarp = clampNumber(val, 0.0, 2.0, 1.0); break;
      case 'tunnelDepth': this.config.tunnelDepth = clampNumber(val, 0.0, 2.0, 1.0); break;
      case 'volumeDensity': this.config.volumeDensity = clampNumber(val, 0.0, 2.0, 1.0); break;
      case 'theForceAttraction': this.config.theForceAttraction = clampNumber(val, -2.0, 2.0, 1.0); break;
    }
  }

  getCustomParameterValue(id: string): number | undefined {
    switch (id) {
      case 'chromaIntensity': return this.config.chromaIntensity;
      case 'liquidWarp': return this.config.liquidWarp;
      case 'tunnelDepth': return this.config.tunnelDepth;
      case 'volumeDensity': return this.config.volumeDensity;
      case 'theForceAttraction': return this.config.theForceAttraction;
      default: return undefined;
    }
  }

  resetCustomParameters(): void {
    this.config = {
      chromaIntensity: 1.0,
      liquidWarp: 1.0,
      tunnelDepth: 1.0,
      volumeDensity: 1.0,
      theForceAttraction: 1.0
    };
  }

  init(ctx: PresetContext) {
    this.group = new THREE.Group();

    // 1. Layer: Liquid Warp Background
    const liquidGeom = new THREE.PlaneGeometry(30, 20, 40, 40);
    this.liquidMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uWarp: { value: 1.0 },
        uColor1: { value: new THREE.Color(ctx.theme.primary) },
        uColor2: { value: new THREE.Color(ctx.theme.secondary) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPos;
        uniform float uTime;
        uniform float uBass;
        uniform float uWarp;

        void main() {
          vUv = uv;
          vec3 p = position;
          p.z -= 10.0;
          p.z += sin(p.x * 0.5 + uTime * 2.0) * cos(p.y * 0.5 + uTime) * (1.5 * uWarp + uBass);
          vPos = p;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform float uTime;
        varying vec2 vUv;

        void main() {
          vec3 col = mix(uColor1 * 0.3, uColor2 * 0.5, sin(vUv.x * 4.0 + uTime) * 0.5 + 0.5);
          gl_FragColor = vec4(col, 0.6);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.liquidMesh = new THREE.Mesh(liquidGeom, this.liquidMaterial);
    this.group.add(this.liquidMesh);

    // 2. Layer: Tunnel Corridor Frames
    this.tunnelGroup = new THREE.Group();
    const frameMat = new THREE.LineBasicMaterial({
      color: new THREE.Color(ctx.theme.accent),
      transparent: true,
      opacity: 0.6
    });

    for (let i = 0; i < this.frameCount; i++) {
      const size = 3.5;
      const pts = [
        new THREE.Vector3(-size, -size, 0),
        new THREE.Vector3(size, -size, 0),
        new THREE.Vector3(size, size, 0),
        new THREE.Vector3(-size, size, 0)
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const loop = new THREE.LineLoop(geom, frameMat);
      loop.position.z = -i * 2.5;
      this.tunnelFrames.push(loop);
      this.tunnelGroup.add(loop);
    }
    this.group.add(this.tunnelGroup);

    // 3. Layer: Volume Particle Cloud & The Force Attractor
    const particleGeom = new THREE.BufferGeometry();
    this.volumePositions = new Float32Array(this.particleCount * 3);
    this.volumeVelocities = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      this.volumePositions[idx] = (Math.random() - 0.5) * 14;
      this.volumePositions[idx + 1] = (Math.random() - 0.5) * 10;
      this.volumePositions[idx + 2] = (Math.random() - 0.5) * 14;

      this.volumeVelocities[idx] = (Math.random() - 0.5) * 0.2;
      this.volumeVelocities[idx + 1] = (Math.random() - 0.5) * 0.2;
      this.volumeVelocities[idx + 2] = (Math.random() - 0.5) * 0.2;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(this.volumePositions, 3));

    this.volumeMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(ctx.theme.accent),
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });
    this.volumeParticles = new THREE.Points(particleGeom, this.volumeMaterial);
    this.group.add(this.volumeParticles);

    // 4. Layer: The Force Center Singularity
    const forceGeom = new THREE.SphereGeometry(1.2, 32, 32);
    this.forceMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(ctx.theme.primary),
      emissive: new THREE.Color(ctx.theme.accent),
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.85
    });
    this.forceCore = new THREE.Mesh(forceGeom, this.forceMaterial);
    this.forceCore.position.z = -4;
    this.group.add(this.forceCore);

    ctx.scene.add(this.group);
  }

  private computeDriveEnergy(audio: AudioFeatures): number {
    const active = this.recipeManager.getActiveRecipe();
    let driveEnergy = audio.bass;
    if (active.kind === 'engine' && active.genes) {
      const band = Math.floor(clampNumber(active.genes.driveBand, 0, 1, 0.35) * 4);
      if (band === 0) driveEnergy = audio.subBass;
      else if (band === 1) driveEnergy = audio.bass;
      else if (band === 2) driveEnergy = audio.mid;
      else driveEnergy = audio.treble;
    }
    return clampNumber(driveEnergy, 0.0, 1.0, 0.0);
  }

  private updateLiquidLayer(time: number, driveEnergy: number): void {
    if (this.liquidMaterial && this.liquidMaterial.uniforms) {
      this.liquidMaterial.uniforms.uTime.value = time;
      this.liquidMaterial.uniforms.uBass.value = driveEnergy;
      this.liquidMaterial.uniforms.uWarp.value = this.config.liquidWarp;
    }
  }

  private updateTunnelLayer(driveEnergy: number, safeDelta: number, isBeat: boolean): void {
    const speed = (6.0 + driveEnergy * 8.0) * safeDelta * this.config.tunnelDepth;
    this.tunnelFrames.forEach(frame => {
      frame.position.z += speed;
      if (frame.position.z > 2) {
        frame.position.z = -this.frameCount * 2.5 + 2;
      }
      frame.scale.setScalar(isBeat ? 1.08 : 1.0);
    });
  }

  private updateVolumeParticles(driveEnergy: number, safeDelta: number): void {
    if (!this.volumeParticles || !this.volumeParticles.geometry) return;
    const pos = (this.volumeParticles.geometry as THREE.BufferGeometry).attributes.position.array as Float32Array;
    const forceStrength = this.config.theForceAttraction * (1.0 + driveEnergy * 2.0);
    const attractorZ = -4.0;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const px = pos[idx];
      const py = pos[idx + 1];
      const pz = pos[idx + 2] - attractorZ;

      const distSq = px * px + py * py + pz * pz + 0.5;
      const f = (forceStrength / distSq) * safeDelta;

      this.volumeVelocities[idx] -= px * f;
      this.volumeVelocities[idx + 1] -= py * f;
      this.volumeVelocities[idx + 2] -= pz * f;

      this.volumeVelocities[idx] += -py * f * 1.5;
      this.volumeVelocities[idx + 1] += px * f * 1.5;

      this.volumeVelocities[idx] *= 0.96;
      this.volumeVelocities[idx + 1] *= 0.96;
      this.volumeVelocities[idx + 2] *= 0.96;

      pos[idx] += this.volumeVelocities[idx];
      pos[idx + 1] += this.volumeVelocities[idx + 1];
      pos[idx + 2] += this.volumeVelocities[idx + 2];

      if (Math.abs(pos[idx]) > 12 || Math.abs(pos[idx + 1]) > 10 || Math.abs(pos[idx + 2]) > 14) {
        pos[idx] = (Math.random() - 0.5) * 10;
        pos[idx + 1] = (Math.random() - 0.5) * 8;
        pos[idx + 2] = (Math.random() - 0.5) * 10;
      }
    }
    this.volumeParticles.geometry.attributes.position.needsUpdate = true;
    this.volumeMaterial.size = 0.12 * Math.max(0.0, this.config.volumeDensity);
  }

  private updateForceCore(driveEnergy: number, isBeat: boolean, safeDelta: number): void {
    if (!this.forceCore || !this.forceMaterial) return;
    const kickFactor = isBeat ? 1.4 : 1.0;
    const coreScale = (1.0 + driveEnergy * 0.4 + (isBeat ? 0.3 : 0)) * kickFactor;
    this.forceCore.scale.set(coreScale, coreScale, coreScale);
    this.forceCore.rotation.y += safeDelta * 0.5;

    if (isBeat) {
      this.forceMaterial.emissiveIntensity = 1.8 * this.config.chromaIntensity;
    } else {
      this.forceMaterial.emissiveIntensity *= 0.94;
    }
  }

  update(_ctx: PresetContext, audio: AudioFeatures, time: number, delta: number) {
    const safeDelta = clampNumber(delta, 0.001, 0.1, 0.016);
    const driveEnergy = this.computeDriveEnergy(audio);

    this.updateLiquidLayer(time, driveEnergy);
    this.updateTunnelLayer(driveEnergy, safeDelta, audio.beat);
    this.updateVolumeParticles(driveEnergy, safeDelta);
    this.updateForceCore(driveEnergy, audio.beat, safeDelta);
  }

  onThemeChange(theme: VisualizerTheme) {
    if (this.liquidMaterial && this.liquidMaterial.uniforms) {
      this.liquidMaterial.uniforms.uColor1.value.set(theme.primary);
      this.liquidMaterial.uniforms.uColor2.value.set(theme.secondary);
    }
    if (this.volumeMaterial) {
      this.volumeMaterial.color.set(theme.accent);
    }
    if (this.forceMaterial) {
      this.forceMaterial.color.set(theme.primary);
      this.forceMaterial.emissive.set(theme.accent);
    }
  }

  dispose() {
    if (this.liquidMesh) {
      this.liquidMesh.geometry.dispose();
      this.liquidMaterial.dispose();
    }
    this.tunnelFrames.forEach(f => {
      f.geometry.dispose();
      (f.material as THREE.Material).dispose();
    });
    this.tunnelFrames.length = 0;

    if (this.volumeParticles) {
      this.volumeParticles.geometry.dispose();
      this.volumeMaterial.dispose();
    }
    if (this.forceCore) {
      this.forceCore.geometry.dispose();
      this.forceMaterial.dispose();
    }
    if (this.group) {
      this.group.removeFromParent();
    }
  }
}
