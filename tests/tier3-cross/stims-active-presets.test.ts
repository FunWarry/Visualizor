import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { ActivePresetsManager, ACTIVE_PRESETS_STORAGE_KEY } from '../../src/presets/stims/ActivePresetsManager';
import { StimsCatalogService } from '../../src/presets/stims/StimsCatalogService';
import type { StimsPreset } from '../../src/presets/stims/types';

describe('Tier 3: Active Presets Store & LocalStorage Persistence', () => {
  const mockPresetA: StimsPreset = {
    id: 'flagship-alpha',
    title: 'Flagship Alpha',
    author: 'Stims Core Team',
    category: 'fractal',
    file: '/presets/stims/flagship-alpha.milk',
    tags: ['category:fractal', 'collection:hall-of-fame']
  };

  const mockPresetB: StimsPreset = {
    id: 'flagship-beta',
    title: 'Flagship Beta',
    author: 'Rovastar',
    category: 'waveform',
    file: '/presets/stims/flagship-beta.milk',
    tags: ['category:waveform', 'collection:classic-milkdrop']
  };

  const mockPresetC: StimsPreset = {
    id: 'flagship-gamma',
    title: 'Flagship Gamma',
    author: 'Geiss',
    category: 'particles',
    file: '/presets/stims/flagship-gamma.milk',
    tags: ['category:particles']
  };

  beforeEach(() => {
    setupTestEnvironment();
    localStorage.clear();
    ActivePresetsManager.resetInstance();
  });

  // ==========================================================================
  // Section 1: In-Memory State & LocalStorage Updates
  // ==========================================================================

  test('T3.StimsActive.1: Initial empty state on clean storage', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    expect(manager.getActivePresets()).toHaveLength(0);
    expect(manager.isPresetActive('flagship-alpha')).toBe(false);
  });

  test('T3.StimsActive.2: Singleton instance lifecycle and resetInstance', () => {
    const instance1 = ActivePresetsManager.getInstance();
    const instance2 = ActivePresetsManager.getInstance();
    expect(instance1).toBe(instance2);

    ActivePresetsManager.resetInstance();
    const instance3 = ActivePresetsManager.getInstance();
    expect(instance3).not.toBe(instance1);
  });

  test('T3.StimsActive.3: Adding presets updates in-memory array and localStorage envelope', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    const added = manager.addPreset(mockPresetA);
    expect(added).toBe(true);

    // Verify in-memory state
    const presets = manager.getActivePresets();
    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe('flagship-alpha');
    expect(presets[0].title).toBe('Flagship Alpha');
    expect(presets[0].author).toBe('Stims Core Team');
    expect(presets[0].category).toBe('fractal');
    expect(presets[0].file).toBe('/presets/stims/flagship-alpha.milk');
    expect(presets[0].addedAt).toBeGreaterThan(0);
    expect(manager.isPresetActive('flagship-alpha')).toBe(true);

    // Verify localStorage payload
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    expect(rawStorage).toBeDefined();
    expect(rawStorage).not.toBeNull();

    const envelope = JSON.parse(rawStorage ?? '{}') as {
      version: number;
      presets: Array<{ id: string; title: string }>;
      updatedAt: number;
    };
    expect(envelope.version).toBe(1);
    expect(envelope.presets).toHaveLength(1);
    expect(envelope.presets[0].id).toBe('flagship-alpha');
    expect(envelope.updatedAt).toBeGreaterThan(0);

    // Add second preset
    const addedB = manager.addPreset(mockPresetB);
    expect(addedB).toBe(true);
    expect(manager.getActivePresets()).toHaveLength(2);
    expect(manager.isPresetActive('flagship-beta')).toBe(true);
  });

  // ==========================================================================
  // Section 2: Removal & Clear Operations
  // ==========================================================================

  test('T3.StimsActive.4: Removing a preset deletes it from storage and updates in-memory list', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    manager.addPreset(mockPresetA);
    manager.addPreset(mockPresetB);
    expect(manager.getActivePresets()).toHaveLength(2);

    // Remove preset A
    const removed = manager.removePreset('flagship-alpha');
    expect(removed).toBe(true);

    const remaining = manager.getActivePresets();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('flagship-beta');
    expect(manager.isPresetActive('flagship-alpha')).toBe(false);
    expect(manager.isPresetActive('flagship-beta')).toBe(true);

    // Verify localStorage
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? '{}') as { presets: Array<{ id: string }> };
    expect(envelope.presets).toHaveLength(1);
    expect(envelope.presets[0].id).toBe('flagship-beta');

    // Removing non-existent preset returns false without mutating state
    const removedMissing = manager.removePreset('non-existent-preset');
    expect(removedMissing).toBe(false);
    expect(manager.getActivePresets()).toHaveLength(1);
  });

  test('T3.StimsActive.5: clearAll empties in-memory list and writes empty presets envelope to storage', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();
    manager.addPreset(mockPresetA);
    manager.addPreset(mockPresetB);
    expect(manager.getActivePresets()).toHaveLength(2);

    manager.clearAll();
    expect(manager.getActivePresets()).toHaveLength(0);
    expect(manager.isPresetActive('flagship-alpha')).toBe(false);
    expect(manager.isPresetActive('flagship-beta')).toBe(false);

    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? '{}') as { presets: unknown[] };
    expect(envelope.presets).toHaveLength(0);
  });

  // ==========================================================================
  // Section 3: Persistence Across Re-initialization
  // ==========================================================================

  test('T3.StimsActive.6: Presets persist across re-initialization of ActivePresetsManager', () => {
    // Stage 1: Add presets using manager instance 1
    const manager1 = ActivePresetsManager.getInstance();
    manager1.init();
    manager1.addPreset(mockPresetA);
    manager1.addPreset(mockPresetB);
    const addedAtA = manager1.getActivePresets()[0].addedAt;

    // Stage 2: Simulate page reload by resetting singleton
    ActivePresetsManager.resetInstance();

    // Stage 3: Cold boot instance 2 and initialize
    const manager2 = ActivePresetsManager.getInstance();
    manager2.init();

    const restoredPresets = manager2.getActivePresets();
    expect(restoredPresets).toHaveLength(2);

    expect(restoredPresets[0].id).toBe('flagship-alpha');
    expect(restoredPresets[0].title).toBe('Flagship Alpha');
    expect(restoredPresets[0].author).toBe('Stims Core Team');
    expect(restoredPresets[0].category).toBe('fractal');
    expect(restoredPresets[0].file).toBe('/presets/stims/flagship-alpha.milk');
    expect(restoredPresets[0].addedAt).toBe(addedAtA);

    expect(restoredPresets[1].id).toBe('flagship-beta');
    expect(manager2.isPresetActive('flagship-alpha')).toBe(true);
    expect(manager2.isPresetActive('flagship-beta')).toBe(true);
  });

  // ==========================================================================
  // Section 4: De-duplication Logic
  // ==========================================================================

  test('T3.StimsActive.7: De-duplication prevents duplicate preset insertions', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    const addedFirst = manager.addPreset(mockPresetA);
    expect(addedFirst).toBe(true);
    expect(manager.getActivePresets()).toHaveLength(1);

    // Attempt duplicate addition with same ID
    const addedDuplicate = manager.addPreset(mockPresetA);
    expect(addedDuplicate).toBe(false);
    expect(manager.getActivePresets()).toHaveLength(1);

    // Attempt duplicate addition with slightly mutated metadata but same ID
    const mutatedDuplicate: StimsPreset = {
      ...mockPresetA,
      title: 'Flagship Alpha (Renamed)',
      author: 'Different Author'
    };
    const addedMutated = manager.addPreset(mutatedDuplicate);
    expect(addedMutated).toBe(false);
    expect(manager.getActivePresets()).toHaveLength(1);
    expect(manager.getActivePresets()[0].title).toBe('Flagship Alpha');

    // Storage envelope contains exactly 1 preset
    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? '{}') as { presets: unknown[] };
    expect(envelope.presets).toHaveLength(1);
  });

  // ==========================================================================
  // Section 5: Event Pub/Sub (onChanged Listeners)
  // ==========================================================================

  test('T3.StimsActive.8: onChanged listener fires on add, remove, and clear operations', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    let notificationCount = 0;
    const unsubscribe = manager.onChanged(() => {
      notificationCount++;
    });

    // Add preset -> listener triggers
    manager.addPreset(mockPresetA);
    expect(notificationCount).toBe(1);

    // Duplicate add -> no-op, listener does not trigger
    manager.addPreset(mockPresetA);
    expect(notificationCount).toBe(1);

    // Add second preset -> listener triggers
    manager.addPreset(mockPresetB);
    expect(notificationCount).toBe(2);

    // Remove non-existent preset -> no-op, listener does not trigger
    manager.removePreset('non-existent');
    expect(notificationCount).toBe(2);

    // Remove existing preset -> listener triggers
    manager.removePreset('flagship-alpha');
    expect(notificationCount).toBe(3);

    // Clear all -> listener triggers
    manager.clearAll();
    expect(notificationCount).toBe(4);

    // Unsubscribe -> subsequent operations do not notify
    unsubscribe();
    manager.addPreset(mockPresetC);
    expect(notificationCount).toBe(4);
    expect(manager.getActivePresets()).toHaveLength(1);
  });

  test('T3.StimsActive.9: Multiple listeners and listener error isolation', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    // Faulty listener that throws an uncaught error
    manager.onChanged(() => {
      throw new Error('Listener error simulation');
    });

    // Well-behaved listener that records notification
    let secondListenerFired = false;
    manager.onChanged(() => {
      secondListenerFired = true;
    });

    // addPreset should not throw and should still notify second listener
    const added = manager.addPreset(mockPresetA);
    expect(added).toBe(true);
    expect(secondListenerFired).toBe(true);
  });

  // ==========================================================================
  // Section 6: Boundary Resilience (Corrupted Data & Quotas)
  // ==========================================================================

  test('T3.StimsActive.10: Corrupted JSON in localStorage falls back safely to empty array', () => {
    // Seed corrupted JSON syntax
    localStorage.setItem(ACTIVE_PRESETS_STORAGE_KEY, '<<<NOT-VALID-JSON-SYNTAX>>>{');

    const manager = ActivePresetsManager.getInstance();
    manager.init();

    // Must not throw uncaught error; falls back cleanly to empty array
    expect(manager.getActivePresets()).toHaveLength(0);

    // Subsequent addPreset works normally and overwrites corrupted storage with valid payload
    const added = manager.addPreset(mockPresetA);
    expect(added).toBe(true);
    expect(manager.getActivePresets()).toHaveLength(1);

    const rawStorage = localStorage.getItem(ACTIVE_PRESETS_STORAGE_KEY);
    const envelope = JSON.parse(rawStorage ?? '{}') as { version: number; presets: unknown[] };
    expect(envelope.version).toBe(1);
    expect(envelope.presets).toHaveLength(1);
  });

  test('T3.StimsActive.11: Malformed envelope schemas recover gracefully', () => {
    // Case A: Storage payload is a primitive number
    localStorage.setItem(ACTIVE_PRESETS_STORAGE_KEY, '12345');
    const managerA = ActivePresetsManager.getInstance();
    managerA.init();
    expect(managerA.getActivePresets()).toHaveLength(0);

    ActivePresetsManager.resetInstance();

    // Case B: Storage payload has presets property that is not an array
    localStorage.setItem(ACTIVE_PRESETS_STORAGE_KEY, JSON.stringify({ version: 1, presets: 'invalid-string' }));
    const managerB = ActivePresetsManager.getInstance();
    managerB.init();
    expect(managerB.getActivePresets()).toHaveLength(0);
  });

  test('T3.StimsActive.12: QuotaExceededError handling prevents crashing', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    const originalSetItem = localStorage.setItem.bind(localStorage);

    // Simulate quota exceeded exception
    localStorage.setItem = () => {
      const err = new Error('QuotaExceededError: Storage quota has been exceeded');
      err.name = 'QuotaExceededError';
      throw err;
    };

    try {
      // Must not throw uncaught error
      const result = manager.addPreset(mockPresetA);
      expect(typeof result).toBe('boolean');
    } finally {
      localStorage.setItem = originalSetItem;
    }
  });

  test('T3.StimsActive.13: SecurityError / LocalStorage inaccessible handles private browsing cleanly', () => {
    const originalGetItem = localStorage.getItem.bind(localStorage);

    // Simulate SecurityError in restricted browsing environment
    localStorage.getItem = () => {
      const secErr = new Error('SecurityError: The operation is insecure');
      secErr.name = 'SecurityError';
      throw secErr;
    };

    try {
      const manager = ActivePresetsManager.getInstance();
      manager.init();
      expect(manager.getActivePresets()).toHaveLength(0);
    } finally {
      localStorage.getItem = originalGetItem;
    }
  });

  // ==========================================================================
  // Section 7: Cross-Subsystem Integration (Catalog -> ActivePresets -> Drawer)
  // ==========================================================================

  test('T3.StimsActive.14: StimsCatalogService starter presets convert accurately to active preset items', async () => {
    const catalogService = StimsCatalogService.getInstance();
    await catalogService.init({ eagerFullHydration: false });

    const starterPresets = catalogService.getStarterPresets();
    expect(starterPresets.length).toBeGreaterThan(0);

    const selectedPreset = starterPresets[0];
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    const added = manager.addPreset(selectedPreset);
    expect(added).toBe(true);

    const activeItem = manager.getActivePresets()[0];
    expect(activeItem.id).toBe(selectedPreset.id);
    expect(activeItem.title).toBe(selectedPreset.title);
    expect(activeItem.author).toBe(selectedPreset.author);
    expect(activeItem.file).toBe(selectedPreset.file);
    expect(activeItem.category).toBe(selectedPreset.category);
    expect(activeItem.addedAt).toBeGreaterThan(0);
  });

  test('T3.StimsActive.15: Missing optional preset fields receive safe default fallbacks', () => {
    const manager = ActivePresetsManager.getInstance();
    manager.init();

    const sparsePreset = {
      id: 'sparse-preset-01',
      file: '/presets/stims/sparse.milk'
    } as StimsPreset;

    const added = manager.addPreset(sparsePreset);
    expect(added).toBe(true);

    const activeItem = manager.getActivePresets()[0];
    expect(activeItem.id).toBe('sparse-preset-01');
    expect(activeItem.title).toBe('sparse-preset-01');
    expect(activeItem.author).toBe('Unknown');
    expect(activeItem.category).toBe('uncategorized');
    expect(activeItem.file).toBe('/presets/stims/sparse.milk');
  });
});
