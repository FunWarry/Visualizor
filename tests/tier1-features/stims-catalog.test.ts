import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { StimsCatalogService } from '../../src/presets/stims/StimsCatalogService';
import {
  STIMS_CATEGORIES,
  STIMS_COLLECTIONS,
  type FlashRiskLevel
} from '../../src/presets/stims/types';

describe('Tier 1: Stims Catalog Service & Assets Embedding', () => {
  beforeEach(() => {
    setupTestEnvironment();
    StimsCatalogService.resetInstance();
  });

  test('T1.StimsCatalog.1: Physical Asset Presence — 2,686 .milk files and 10 PNG textures exist on disk', () => {
    const stimsRoot = path.resolve(process.cwd(), 'public/presets/stims');
    expect(fs.existsSync(stimsRoot)).toBe(true);

    const countMilkFiles = (dir: string): number => {
      let count = 0;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          count += countMilkFiles(fullPath);
        } else if (entry.name.endsWith('.milk')) {
          count++;
        }
      }
      return count;
    };

    const totalMilkFiles = countMilkFiles(stimsRoot);
    expect(totalMilkFiles).toBe(2686);

    const textureDir = path.join(stimsRoot, 'textures');
    expect(fs.existsSync(textureDir)).toBe(true);
    const textureFiles = fs.readdirSync(textureDir).filter((f) => f.endsWith('.png'));
    expect(textureFiles.length).toBe(10);

    // Image file validity check (valid binary image payload with JPEG SOI or PNG header)
    for (const tex of textureFiles) {
      const texPath = path.join(textureDir, tex);
      const buffer = fs.readFileSync(texPath);
      expect(buffer.length).toBeGreaterThan(1000);
      const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
      const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
      expect(isJpeg || isPng).toBe(true);
    }
  });

  test('T1.StimsCatalog.2: Referential Integrity — 100% of 1,787 catalog presets point to existing .milk files', () => {
    const stimsRoot = path.resolve(process.cwd(), 'public/presets/stims');
    const catalogPath = path.join(stimsRoot, 'catalog.json');
    const catalogRaw = fs.readFileSync(catalogPath, 'utf8');
    const catalog = JSON.parse(catalogRaw) as { presets: Array<{ id: string; file: string }> };

    expect(catalog.presets.length).toBe(1787);

    let missingCount = 0;
    for (const p of catalog.presets) {
      const relativeFile = p.file.replace(/^\/?presets\/stims\//, '');
      const absPath = path.join(stimsRoot, relativeFile);
      if (!fs.existsSync(absPath)) {
        missingCount++;
      }
    }

    expect(missingCount).toBe(0);
  });

  test('T1.StimsCatalog.3: JSON Catalogs Schema — catalog.json, starter-catalog.json, descriptions, search-index', () => {
    const stimsRoot = path.resolve(process.cwd(), 'public/presets/stims');

    const starterPath = path.join(stimsRoot, 'starter-catalog.json');
    const starter = JSON.parse(fs.readFileSync(starterPath, 'utf8')) as { presets: Array<{ id: string }> };
    expect(Array.isArray(starter.presets)).toBe(true);
    expect(starter.presets.length).toBe(25);

    const descPath = path.join(stimsRoot, 'preset-descriptions.json');
    const descDoc = JSON.parse(fs.readFileSync(descPath, 'utf8')) as { descriptions: Record<string, string> };
    expect(typeof descDoc.descriptions).toBe('object');
    expect(Object.keys(descDoc.descriptions).length).toBeGreaterThanOrEqual(1786);

    const searchPath = path.join(stimsRoot, 'search-index.json');
    const searchDoc = JSON.parse(fs.readFileSync(searchPath, 'utf8')) as Record<string, { terms: string[]; combinedTerms: string }>;
    expect(typeof searchDoc).toBe('object');
    expect(Object.keys(searchDoc).length).toBeGreaterThanOrEqual(1787);
  });

  test('T1.StimsCatalog.4: Fast Boot — starter catalog returns 25 flagship presets immediately', async () => {
    const service = StimsCatalogService.getInstance();
    expect(service.isReady()).toBe(false);

    await service.init({ eagerFullHydration: false });

    expect(service.isReady()).toBe(true);
    const starterPresets = service.getStarterPresets();
    expect(starterPresets.length).toBe(25);

    for (const p of starterPresets) {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.title).toBe('string');
      expect(typeof p.author).toBe('string');
      expect(typeof p.file).toBe('string');
      expect(p.file.endsWith('.milk')).toBe(true);
      expect(typeof p.category).toBe('string');
    }
  });

  test('T1.StimsCatalog.5: Full Hydration — getAllPresets returns exactly 1,787 unique presets', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init({ eagerFullHydration: true });

    expect(service.isFullyHydrated()).toBe(true);
    const all = service.getAllPresets();
    expect(all.length).toBe(1787);

    const idSet = new Set(all.map((p) => p.id));
    expect(idSet.size).toBe(1787);

    // Verify visual description was merged into presets
    const described = all.filter((p) => p.description && p.description.length > 0);
    expect(described.length).toBeGreaterThanOrEqual(1786);
  });

  test('T1.StimsCatalog.6: 10 Canonical Categories — getCategories returns all 10 categories with accurate counts', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const categories = service.getCategories();
    expect(categories.length).toBe(10);

    const slugs = categories.map((c) => c.slug);
    for (const expectedSlug of STIMS_CATEGORIES) {
      expect(slugs).toContain(expectedSlug);
    }

    const catMap = new Map(categories.map((c) => [c.slug, c.count]));
    expect((catMap.get('waveform') ?? 0)).toBe(1488);
    expect((catMap.get('particles') ?? 0)).toBe(1364);
    expect((catMap.get('geometric') ?? 0)).toBe(394);
    expect((catMap.get('fractal') ?? 0)).toBe(215);
    expect((catMap.get('sparkle') ?? 0)).toBe(60);
    expect((catMap.get('reaction') ?? 0)).toBe(31);
    expect((catMap.get('supernova') ?? 0)).toBe(15);
    expect((catMap.get('dancer') ?? 0)).toBe(3);

    // Filter by single category
    const waveformPresets = service.filterPresets({ category: 'waveform' });
    expect(waveformPresets.length).toBe(1488);
    for (const p of waveformPresets) {
      const matches = p.category === 'waveform' || p.tags.includes('category:waveform');
      expect(matches).toBe(true);
    }
  });

  test('T1.StimsCatalog.7: 6 Curated Collections — getCollections returns accurate collection tallies', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const collections = service.getCollections();
    expect(collections.length).toBe(6);

    const slugs = collections.map((c) => c.slug);
    for (const expectedSlug of STIMS_COLLECTIONS) {
      expect(slugs).toContain(expectedSlug);
    }

    const hofPresets = service.filterPresets({ collection: 'hall-of-fame' });
    expect(hofPresets.length).toBe(16);

    const cropPresets = service.filterPresets({ collection: 'cream-of-the-crop' });
    expect(cropPresets.length).toBe(42);

    const butterchurnPresets = service.filterPresets({ collection: 'butterchurn' });
    expect(butterchurnPresets.length).toBe(1744);

    const audioReactivePresets = service.filterPresets({ collection: 'audio-reactive' });
    expect(audioReactivePresets.length).toBe(1477);
  });

  test('T1.StimsCatalog.8: Multi-Criteria Filtering — category + collection intersection filtering', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const result = service.filterPresets({
      category: 'particles',
      collection: 'hall-of-fame'
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(16);

    for (const p of result) {
      const hasPartTag = p.category === 'particles' || p.tags.includes('category:particles');
      expect(hasPartTag).toBe(true);
      expect(p.tags).toContain('collection:hall-of-fame');
    }
  });

  test('T1.StimsCatalog.9: Search Engine — title, author, and description keyword queries', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    // Title search
    const glowsticks = service.filterPresets({ searchQuery: 'glowsticks' });
    expect(glowsticks.length).toBeGreaterThan(0);
    const foundEos = glowsticks.some((p) => p.id === 'eos-glowsticks-v2-03-music');
    expect(foundEos).toBe(true);

    // Author search
    const rovastar = service.filterPresets({ searchQuery: 'rovastar' });
    expect(rovastar.length).toBeGreaterThan(0);

    // Multi-token query
    const multiMatch = service.filterPresets({ searchQuery: 'shifter glassworms' });
    expect(multiMatch.length).toBeGreaterThan(0);
    expect(multiMatch.some((p) => p.id === 'shifter-glassworms-flare')).toBe(true);
  });

  test('T1.StimsCatalog.10: Search Resilience — whitespace, uppercase, and regex character handling', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    // Uppercase
    const upper = service.filterPresets({ searchQuery: 'GLOWSTICKS' });
    const lower = service.filterPresets({ searchQuery: 'glowsticks' });
    expect(upper.length).toBe(lower.length);

    // Whitespace
    const padded = service.filterPresets({ searchQuery: '   glowsticks   ' });
    expect(padded.length).toBe(lower.length);

    // Special regex characters
    const regexSafe = service.filterPresets({ searchQuery: '[*+?^${}()|[\\]' });
    expect(Array.isArray(regexSafe)).toBe(true);

    // Empty query returns full catalog
    const emptyQuery = service.filterPresets({ searchQuery: '' });
    expect(emptyQuery.length).toBe(1787);
  });

  test('T1.StimsCatalog.11: Sensory Safety / Photosensitivity Filtering', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const noneRisk = service.filterPresets({ maxFlashRisk: 'none' });
    expect(noneRisk.length).toBeGreaterThan(0);

    for (const p of noneRisk) {
      const risk: FlashRiskLevel = p.sensoryProfile?.flashRiskLevel ?? 'none';
      expect(risk).toBe('none');
    }

    const lowRisk = service.filterPresets({ maxFlashRisk: 'low' });
    expect(lowRisk.length).toBeGreaterThanOrEqual(noneRisk.length);
    for (const p of lowRisk) {
      const risk = p.sensoryProfile?.flashRiskLevel ?? 'none';
      expect(risk === 'none' || risk === 'low').toBe(true);
    }
  });

  test('T1.StimsCatalog.12: Random Sampling — category-constrained random selection with distribution check', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const randomAny = service.getRandomPreset();
    expect(randomAny).toBeDefined();
    expect(randomAny).not.toBeNull();

    const randomFractal = service.getRandomPreset({ category: 'fractal' });
    expect(randomFractal).not.toBeNull();
    const isFractal = randomFractal!.category === 'fractal' || randomFractal!.tags.includes('category:fractal');
    expect(isFractal).toBe(true);

    const randomHof = service.getRandomPreset({ collection: 'hall-of-fame' });
    expect(randomHof).not.toBeNull();
    expect(randomHof!.tags).toContain('collection:hall-of-fame');

    // Sampling 50 times produces distinct presets
    const sampledIds = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const p = service.getRandomPreset();
      if (p) sampledIds.add(p.id);
    }
    expect(sampledIds.size).toBeGreaterThanOrEqual(15);

    // Non-existent category returns null
    const nonExistent = service.getRandomPreset({ category: 'non_existent_category_xyz' });
    expect(nonExistent).toBeNull();
  });

  test('T1.StimsCatalog.13: ID Lookup — O(1) preset retrieval and null fallback for unknown IDs', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const preset = service.getPresetById('eos-glowsticks-v2-03-music');
    expect(preset).not.toBeNull();
    expect(preset!.id).toBe('eos-glowsticks-v2-03-music');
    expect(preset!.title).toBe('Eo.S. - Glowsticks v2 03 Music');
    expect(preset!.author).toBe('Eo.S.');
    expect(preset!.file).toBe('/presets/stims/eos-glowsticks-v2-03-music.milk');

    const unknown = service.getPresetById('unknown-id-xyz-12345');
    expect(unknown).toBeNull();
  });
});
