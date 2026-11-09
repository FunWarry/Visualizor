import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { StimsCatalogService } from '../../src/presets/stims/StimsCatalogService';

describe('Tier 2: Stims Catalog Boundary & Corner Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
    StimsCatalogService.resetInstance();
  });

  test('T2.StimsBoundary.1: Corrupted Catalog JSON — graceful degradation without throwing', async () => {
    const service = StimsCatalogService.getInstance();

    // Custom fetch providing valid starter but broken full catalog
    const customFetch = async (url: string) => {
      if (url.includes('starter-catalog.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            presets: [
              { id: 'flagship-1', title: 'Flagship 1', file: '/presets/stims/flagship-1.milk', tags: ['category:fractal'] }
            ]
          })
        };
      }
      if (url.includes('catalog.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => {
            throw new Error('Malformed JSON syntax in catalog payload');
          }
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      };
    };

    // Should not throw uncaught error
    await service.init({ customFetch, eagerFullHydration: true });

    expect(service.isReady()).toBe(true);
    expect(service.getStarterPresets().length).toBe(1);
    expect(service.getAllPresets().length).toBe(1);
  });

  test('T2.StimsBoundary.2: Network 404/500 Failure — service handles failed fetch cleanly', async () => {
    const service = StimsCatalogService.getInstance();

    const failingFetch = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });

    // Should handle 404 without uncaught promise rejection
    await service.init({ customFetch: failingFetch });

    expect(service.isReady()).toBe(true);
    expect(service.getStarterPresets().length).toBe(0);
    expect(service.getAllPresets().length).toBe(0);
    expect(service.getCategories().length).toBe(10);
    expect(service.getCollections().length).toBe(6);
  });

  test('T2.StimsBoundary.3: Presets with Missing Optional Fields — robust defaults', async () => {
    const service = StimsCatalogService.getInstance();

    const sparseFetch = async (url: string) => {
      if (url.includes('starter-catalog.json') || url.includes('catalog.json')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            presets: [
              { id: 'bare-bones-preset' },
              { id: 'preset-with-no-tags', title: 'No Tags', author: 'Test' }
            ]
          })
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({})
      };
    };

    await service.init({ customFetch: sparseFetch });

    const p1 = service.getPresetById('bare-bones-preset');
    expect(p1).not.toBeNull();
    expect(p1!.id).toBe('bare-bones-preset');
    expect(p1!.title).toBe('bare-bones-preset'); // falls back to id
    expect(p1!.author).toBe('Unknown'); // falls back to Unknown
    expect(p1!.category).toBe('uncategorized'); // falls back to uncategorized
    expect(p1!.tags).toEqual([]);
    expect(p1!.qualityScore).toBeUndefined();
    expect(p1!.sensoryProfile).toBeUndefined();
  });

  test('T2.StimsBoundary.4: Impossible Filter Combinations — returns empty array, never crashes', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const impossible = service.filterPresets({
      category: 'dancer',
      collection: 'classic-milkdrop',
      searchQuery: 'nonexistentkeywordxyz123456789'
    });

    expect(Array.isArray(impossible)).toBe(true);
    expect(impossible.length).toBe(0);

    const randomImpossible = service.getRandomPreset({
      category: 'dancer',
      collection: 'classic-milkdrop',
      searchQuery: 'nonexistentkeywordxyz123456789'
    });
    expect(randomImpossible).toBeNull();
  });

  test('T2.StimsBoundary.5: Rapid Concurrent Invocations — multiple concurrent init() share single Promise', async () => {
    const service = StimsCatalogService.getInstance();

    // Call init 5 times in parallel
    const promises = [
      service.init(),
      service.init(),
      service.init(),
      service.init(),
      service.init()
    ];

    await Promise.all(promises);

    expect(service.isReady()).toBe(true);
    expect(service.isFullyHydrated()).toBe(true);
    expect(service.getAllPresets().length).toBe(1787);
  });

  test('T2.StimsBoundary.6: excludeId Filtering — excludes specified preset ID from candidates', async () => {
    const service = StimsCatalogService.getInstance();
    await service.init();

    const targetId = 'eos-glowsticks-v2-03-music';
    const before = service.filterPresets({ searchQuery: 'glowsticks' });
    const hasTarget = before.some((p) => p.id === targetId);
    expect(hasTarget).toBe(true);

    const after = service.filterPresets({
      searchQuery: 'glowsticks',
      excludeId: targetId
    });
    const stillHasTarget = after.some((p) => p.id === targetId);
    expect(stillHasTarget).toBe(false);
  });

  test('T2.StimsBoundary.7: onHydrated Listener Callbacks and Unsubscribe', async () => {
    const service = StimsCatalogService.getInstance();
    let listenerFired = false;

    const unsubscribe = service.onHydrated(() => {
      listenerFired = true;
    });

    await service.init({ eagerFullHydration: true });

    expect(listenerFired).toBe(true);
    expect(service.isFullyHydrated()).toBe(true);

    // Calling listener after already hydrated triggers immediately
    let secondFired = false;
    service.onHydrated(() => {
      secondFired = true;
    });
    expect(secondFired).toBe(true);

    // Unsubscribe removes listener
    unsubscribe();
  });
});
