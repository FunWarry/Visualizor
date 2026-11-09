import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment } from '../harness/env';
import { StimsCatalogService } from '../../src/presets/stims/StimsCatalogService';
import { ActivePresetsManager } from '../../src/presets/stims/ActivePresetsManager';
import { DiscoveryModeModal, type SessionStatePayload } from '../../src/ui/DiscoveryModeModal';
import { MilkdropEngine } from '../../src/engine/MilkdropEngine';
import { AudioEngine } from '../../src/audio/AudioEngine';
import type { StimsPreset } from '../../src/presets/stims/types';

describe('Tier 4: Stims Discovery Mode E2E, Session Isolation & Audio Reactivity', () => {
  beforeEach(() => {
    setupTestEnvironment();
    localStorage.clear();
    StimsCatalogService.resetInstance();
    ActivePresetsManager.resetInstance();
  });

  test('T4.Discovery.1: Opening DiscoveryModeModal captures VisualizerSessionSnapshot and previews a live preset', async () => {
    let currentState: SessionStatePayload = {
      activePresetId: 'synthwave-terrain',
      isMilkdropActive: false,
      currentMilkdropPreset: null,
      tuningOverrides: { speed: 1.4, density: 64 }
    };
    const previewedHistory: StimsPreset[] = [];

    const modal = new DiscoveryModeModal({
      getSessionState: () => ({ ...currentState, tuningOverrides: { ...currentState.tuningOverrides } }),
      restoreSessionState: (snap) => {
        currentState = { ...snap, tuningOverrides: { ...snap.tuningOverrides } };
      },
      onPreviewPreset: (preset) => {
        previewedHistory.push(preset);
        currentState.isMilkdropActive = true;
        currentState.currentMilkdropPreset = preset.id;
      }
    });

    expect(modal.isOpen()).toBe(false);
    await modal.open();
    expect(modal.isOpen()).toBe(true);

    const snapshot = modal.getSessionSnapshot();
    expect(snapshot).not.toBeNull();
    expect(snapshot?.activePresetId).toBe('synthwave-terrain');
    expect(snapshot?.isMilkdropActive).toBe(false);
    expect(snapshot?.tuningOverrides.speed).toBe(1.4);

    // Live preview was triggered during open()
    expect(previewedHistory.length).toBeGreaterThanOrEqual(1);
    expect(modal.getPreviewedPreset()).not.toBeNull();
    expect(currentState.isMilkdropActive).toBe(true);

    // Cancel / Close with restoreSession: true rolls back to initial 3D preset and tuning overrides
    modal.close({ restoreSession: true });
    expect(modal.isOpen()).toBe(false);
    expect(currentState.activePresetId).toBe('synthwave-terrain');
    expect(currentState.isMilkdropActive).toBe(false);
    expect(currentState.currentMilkdropPreset).toBeNull();
    expect(currentState.tuningOverrides.speed).toBe(1.4);
  });

  test('T4.Discovery.2: Category chips, collection filters, search input, and random exploration work end-to-end', async () => {
    const catalog = StimsCatalogService.getInstance();
    await catalog.init({ eagerFullHydration: true });

    const previewedBox: { current: StimsPreset | null } = { current: null };
    const modal = new DiscoveryModeModal({
      getSessionState: () => ({
        activePresetId: 'wave',
        isMilkdropActive: false,
        currentMilkdropPreset: null,
        tuningOverrides: {}
      }),
      restoreSessionState: () => {},
      onPreviewPreset: (p) => {
        previewedBox.current = p;
      }
    });

    await modal.open();
    expect(modal.getFilteredPresets().length).toBe(1787);

    // Filter by category 'fractal'
    modal.selectCategory('fractal');
    expect(modal.getSelectedCategory()).toBe('fractal');
    const fractalResults = modal.getFilteredPresets();
    expect(fractalResults.length).toBeGreaterThan(0);
    expect(fractalResults.every(p => p.category === 'fractal' || p.tags.includes('category:fractal'))).toBe(true);

    // Roll random preset within 'fractal' category
    const randFractal = modal.pickRandomPreset();
    expect(randFractal).not.toBeNull();
    expect(randFractal?.category === 'fractal' || randFractal?.tags.includes('category:fractal')).toBe(true);
    expect(previewedBox.current?.id).toBe(randFractal?.id);

    // Filter by collection 'rovastar'
    modal.selectCategory('all');
    modal.selectCollection('rovastar');
    const rovastarResults = modal.getFilteredPresets();
    expect(rovastarResults.length).toBeGreaterThan(0);

    // Search query filtering
    modal.selectCollection('all');
    modal.setSearchQuery('geiss');
    const searchResults = modal.getFilteredPresets();
    expect(searchResults.length).toBeGreaterThan(0);

    modal.close({ restoreSession: true });
  });

  test('T4.Discovery.3: Add to Active Presets in Discovery Mode persists preset and syncs with ActivePresetsManager', async () => {
    const activeManager = ActivePresetsManager.getInstance();
    activeManager.init();

    const modal = new DiscoveryModeModal({
      getSessionState: () => ({
        activePresetId: 'wave',
        isMilkdropActive: false,
        currentMilkdropPreset: null,
        tuningOverrides: {}
      }),
      restoreSessionState: () => {},
      onPreviewPreset: () => {}
    });

    await modal.open();
    const previewed = modal.getPreviewedPreset();
    expect(previewed).not.toBeNull();

    const added = modal.addCurrentToActivePresets();
    expect(added).toBe(true);
    expect(activeManager.isPresetActive(previewed!.id)).toBe(true);
    expect(activeManager.getActivePresets().some(p => p.id === previewed!.id)).toBe(true);

    // Toggling removes it cleanly
    const toggledOff = modal.toggleActivePreset(previewed!);
    expect(toggledOff).toBe(false);
    expect(activeManager.isPresetActive(previewed!.id)).toBe(false);

    modal.close({ restoreSession: true });
  });

  test('T4.Discovery.4: MilkdropEngine dynamically resolves Stims preset IDs and handles malformed presets safely', () => {
    const milkCanvas = document.getElementById('milkdrop-canvas') as unknown as HTMLCanvasElement;
    const engine = new MilkdropEngine(milkCanvas);

    // Register custom preset and resolve key
    engine.registerCustomPreset('stims-custom-test', { baseVals: {} });
    expect(engine.resolvePresetKey('stims-custom-test')).toBe('stims-custom-test');

    // Deterministic fallback resolution for arbitrary Stims IDs
    const resolved = engine.resolvePresetKey('rovastar-parallel-universe-v2');
    expect(typeof resolved).toBe('string');
    expect(resolved.length).toBeGreaterThan(0);

    // Error boundary safety on loadPreset
    expect(() => {
      engine.loadPreset('rovastar-parallel-universe-v2', 1.5);
    }).not.toThrow();
    expect(engine.currentPresetName).toBe('rovastar-parallel-universe-v2');
  });

  test('T4.Discovery.5: AudioEngine strictly decouples speaker Volume from visual Audio Reactivity', () => {
    const audio = new AudioEngine();
    audio.getContext();

    // Set speaker volume to 0 (muted) while setting visual reactivity to 2.2 (220%)
    audio.setVolume(0);
    audio.setSensitivity(2.2);

    expect(audio.volume).toBe(0);
    expect(audio.getVolumeGainValue()).toBe(0);
    expect(audio.sensitivity).toBeCloseTo(2.2, 2);
    expect(audio.getReactivityGainValue()).toBeCloseTo(2.2, 2);

    // Changing speaker volume to 0.9 does not alter reactivity gain
    audio.setVolume(0.9);
    expect(audio.getVolumeGainValue()).toBeCloseTo(0.9, 2);
    expect(audio.getReactivityGainValue()).toBeCloseTo(2.2, 2);
  });
});
