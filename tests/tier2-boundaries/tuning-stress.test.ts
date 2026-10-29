import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import { createMockPresetContext, createBeatDropAudioFeatures, createMockTheme } from '../harness/fixtures';
import { renderTuningPanel, updateTuningButtonState, formatParamValue } from '../../src/tuning/TuningPanel';
import { ParameterStore } from '../../src/tuning/ParameterStore';
import { VisualizerPreset, ParameterDefinition } from '../../src/types';

import { CircularSpectrumPreset } from '../../src/presets/CircularSpectrum';
import { WaveFormPreset } from '../../src/presets/WaveForm';
import { ThreeDBarsPreset } from '../../src/presets/ThreeDBars';
import { ObsidianPolyPreset } from '../../src/presets/ObsidianPoly';
import { FerrofluidPreset } from '../../src/presets/Ferrofluid';
import { NeonTunnelPreset } from '../../src/presets/NeonTunnel';
import { StarfieldPreset } from '../../src/presets/Starfield';
import { ParticleFieldPreset } from '../../src/presets/ParticleField';
import { SynthwaveTerrainPreset } from '../../src/presets/SynthwaveTerrain';
import { MilkDropPreset } from '../../src/presets/MilkDrop';
import { DNAHelixPreset } from '../../src/presets/DNAHelix';

function getTunablePresets(): VisualizerPreset[] {
  return [
    new WaveFormPreset(),
    new ParticleFieldPreset(),
    new CircularSpectrumPreset(),
    new FerrofluidPreset(),
    new ObsidianPolyPreset(),
    new NeonTunnelPreset(),
    new StarfieldPreset(),
    new ThreeDBarsPreset(),
    new SynthwaveTerrainPreset()
  ];
}

describe('Tier 2: Preset Tuning Empirical Stress & Boundary Hardening (#41)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.TuningStress.1: ParameterStore core boundary handling (NaN, Infinity, extremes, types)', () => {
    const schema: ParameterDefinition[] = [
      { id: 'p1', name: 'Param 1', min: 0.1, max: 2.5, step: 0.1, defaultValue: 1.0 },
      { id: 'p2', name: 'Param 2', min: -5.0, max: 5.0, step: 0.5, defaultValue: 0.0 },
      { id: 'p3', name: 'Param 3', min: 10, max: 100, step: 5, defaultValue: 50 }
    ];
    const store = new ParameterStore(schema);

    // Initial defaults
    expect(store.getValue('p1')).toBe(1.0);
    expect(store.getValue('p2')).toBe(0.0);
    expect(store.getValue('p3')).toBe(50);

    // Negative extreme (-1e9)
    store.setValue('p1', -1e9);
    expect(store.getValue('p1')).toBe(0.1);
    store.setValue('p2', -1e9);
    expect(store.getValue('p2')).toBe(-5.0);

    // Positive extreme (+1e9)
    store.setValue('p1', 1e9);
    expect(store.getValue('p1')).toBe(2.5);
    store.setValue('p2', 1e9);
    expect(store.getValue('p2')).toBe(5.0);

    // NaN fallback
    store.setValue('p1', NaN);
    expect(store.getValue('p1')).toBe(1.0);

    // Infinity and -Infinity fallback
    store.setValue('p2', Infinity);
    expect(store.getValue('p2')).toBe(0.0);
    store.setValue('p2', -Infinity);
    expect(store.getValue('p2')).toBe(0.0);

    // Negative zero (-0)
    store.setValue('p2', -0);
    expect(store.getValue('p2')).toBe(0);

    // Non-number types (undefined, strings, null, objects)
    store.setValue('p1', undefined as unknown as number);
    expect(store.getValue('p1')).toBe(1.0);
    store.setValue('p1', '999' as unknown as number);
    expect(store.getValue('p1')).toBe(1.0);
    store.setValue('p1', null as unknown as number);
    expect(store.getValue('p1')).toBe(1.0);

    // Unknown IDs
    store.setValue('unknown_id', 99.0);
    expect(store.getValue('unknown_id')).toBe(0);
    store.setValue('__proto__', 99.0);
    expect(store.getValue('__proto__')).toBe(0);
  });

  test('T2.TuningStress.2: Extreme boundary values (-1e9, 1e9, NaN, Infinity, -0, undefined, strings) on all 9 presets', () => {
    const presets = getTunablePresets();
    expect(presets.length).toBe(9);

    for (const p of presets) {
      const params = p.getCustomParameters?.();
      expect(params).toBeDefined();
      expect(params!.length).toBeGreaterThanOrEqual(3);

      for (const def of params!) {
        // Clamping min
        p.setCustomParameter!(def.id, -1e9);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.min);

        // Clamping max
        p.setCustomParameter!(def.id, 1e9);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.max);

        // NaN fallback
        p.setCustomParameter!(def.id, NaN);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);

        // Infinity fallback
        p.setCustomParameter!(def.id, Infinity);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);

        // -Infinity fallback
        p.setCustomParameter!(def.id, -Infinity);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);

        // -0 handling
        p.setCustomParameter!(def.id, -0);
        const valNegZero = p.getCustomParameterValue!(def.id)!;
        expect(Number.isFinite(valNegZero)).toBe(true);
        expect(valNegZero).toBeGreaterThanOrEqual(def.min);
        expect(valNegZero).toBeLessThanOrEqual(def.max);

        // undefined fallback
        p.setCustomParameter!(def.id, undefined as unknown as number);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);

        // string fallback
        p.setCustomParameter!(def.id, 'abc' as unknown as number);
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);
      }
    }
  });

  test('T2.TuningStress.3: Step resolution snapping generator across random floats', () => {
    const presets = getTunablePresets();

    for (const p of presets) {
      const params = p.getCustomParameters?.() || [];
      for (const def of params) {
        for (let i = 1; i <= 10; i++) {
          const factor = i / 11;
          const testVal = def.min + factor * (def.max - def.min);
          p.setCustomParameter!(def.id, testVal);

          const storedVal = p.getCustomParameterValue!(def.id)!;
          expect(storedVal).toBeGreaterThanOrEqual(def.min);
          expect(storedVal).toBeLessThanOrEqual(def.max);

          const stepsCount = (storedVal - def.min) / def.step;
          const roundDiff = Math.abs(stepsCount - Math.round(stepsCount));
          expect(roundDiff).toBeLessThan(1e-4);
        }
      }
    }
  });

  test('T2.TuningStress.4: 10,000 rapid parameter mutations throughput and stability', () => {
    const presets = getTunablePresets();
    const iterations = 10000;
    const startTime = Date.now();

    for (let i = 0; i < iterations; i++) {
      const preset = presets[i % presets.length];
      const params = preset.getCustomParameters!();
      const param = params[i % params.length];
      const val = param.min + ((i % 100) / 100) * (param.max - param.min);
      preset.setCustomParameter!(param.id, val);
    }

    const durationMs = Date.now() - startTime;
    expect(durationMs).toBeLessThan(1000);
  });

  test('T2.TuningStress.5: 60 FPS live frame modulation stability across all 9 presets', () => {
    const presets = getTunablePresets();
    const audio = createBeatDropAudioFeatures();
    const theme = createMockTheme();

    for (const preset of presets) {
      const ctx = createMockPresetContext(theme);
      preset.init(ctx);

      const params = preset.getCustomParameters!();
      for (let frame = 0; frame < 60; frame++) {
        const time = frame * (1 / 60);
        const delta = 1 / 60;

        for (const p of params) {
          const val = p.min + Math.sin(frame * 0.2 + 1) * 0.5 * (p.max - p.min) + 0.5 * (p.max - p.min);
          preset.setCustomParameter!(p.id, val);
        }

        audio.bass = 0.5 + 0.5 * Math.sin(frame * 0.1);
        audio.beat = frame % 15 === 0;

        preset.update(ctx, audio, time, delta);
      }

      preset.dispose();
    }
  });

  test('T2.TuningStress.6: Mount and unmount #tuningPanel 50 times in rapid succession', () => {
    const railBtn = new MockElement('BUTTON');
    railBtn.id = 'presetSettingsRailBtn';
    railBtn.className = 'rail-btn preset-settings-link is-collapsed';
    document.body.appendChild(railBtn as unknown as HTMLElement);

    const tuningPanel = new MockElement('DIV');
    tuningPanel.id = 'tuningPanel';
    tuningPanel.className = 'drawer-panel detail-panel';
    document.body.appendChild(tuningPanel as unknown as HTMLElement);

    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    tuningPanel.appendChild(content);

    const testCatalog: Array<VisualizerPreset | null> = [
      new WaveFormPreset(),
      new ParticleFieldPreset(),
      new MilkDropPreset(),
      new CircularSpectrumPreset(),
      null,
      new FerrofluidPreset(),
      new DNAHelixPreset(),
      new ObsidianPolyPreset(),
      new NeonTunnelPreset(),
      new StarfieldPreset(),
      new ThreeDBarsPreset(),
      new SynthwaveTerrainPreset()
    ];

    for (let cycle = 1; cycle <= 50; cycle++) {
      const preset = testCatalog[cycle % testCatalog.length];
      const isTunable = Boolean(
        preset &&
        typeof preset.getCustomParameters === 'function' &&
        (preset.getCustomParameters()?.length ?? 0) > 0
      );

      updateTuningButtonState(preset, railBtn, tuningPanel);
      renderTuningPanel(preset, content);

      if (isTunable) {
        expect(railBtn.classList.contains('is-collapsed')).toBe(false);

        const params = preset!.getCustomParameters!();
        const sliders = content.querySelectorAll('.tuning-slider');
        expect(sliders.length).toBe(params.length);

        const readouts = content.querySelectorAll('.tuning-val-readout');
        expect(readouts.length).toBe(params.length);

        for (const p of params) {
          const slider = content.querySelector(`#tuning_${p.id}_slider`) as MockElement;
          const readout = content.querySelector(`#tuning_${p.id}_val`) as MockElement;
          expect(slider).toBeDefined();
          expect(readout).toBeDefined();

          const currentVal = preset!.getCustomParameterValue!(p.id) ?? p.defaultValue;
          expect(Number(slider.value)).toBe(currentVal);
          expect(readout.textContent).toBe(formatParamValue(currentVal, p.step));
        }
      } else {
        expect(railBtn.classList.contains('is-collapsed')).toBe(true);
        expect(tuningPanel.classList.contains('open')).toBe(false);

        const notice = content.querySelector('.tuning-fallback-notice');
        expect(notice).toBeDefined();
        expect(notice!.textContent).toBe('No settings for this preset');

        const sliders = content.querySelectorAll('.tuning-slider');
        expect(sliders.length).toBe(0);
      }
    }
  });

  test('T2.TuningStress.7: Event listener leak check and slider recreation verification', () => {
    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    document.body.appendChild(content as unknown as HTMLElement);

    const wavePreset = new WaveFormPreset();
    renderTuningPanel(wavePreset, content);

    const initialSpeedSlider = content.querySelector('#tuning_speed_slider') as MockElement;
    expect(initialSpeedSlider).toBeDefined();

    initialSpeedSlider.value = '2.3';
    initialSpeedSlider.dispatchEvent(new Event('input'));
    expect(wavePreset.getCustomParameterValue('speed')).toBe(2.3);

    // Re-render with ParticleFieldPreset
    const particlePreset = new ParticleFieldPreset();
    renderTuningPanel(particlePreset, content);

    const particleSpeedSlider = content.querySelector('#tuning_speed_slider') as MockElement;
    expect(particleSpeedSlider).toBeDefined();
    expect(particleSpeedSlider !== initialSpeedSlider).toBe(true);

    // Discarded slider event should not leak
    initialSpeedSlider.value = '0.4';
    initialSpeedSlider.dispatchEvent(new Event('input'));
    expect(particlePreset.getCustomParameterValue('speed')).toBe(1.0);

    // Active slider event updates properly
    particleSpeedSlider.value = '1.7';
    particleSpeedSlider.dispatchEvent(new Event('input'));
    expect(particlePreset.getCustomParameterValue('speed')).toBe(1.7);
  });

  test('T2.TuningStress.8: Reset to defaults restores exact initial values in preset and DOM across all 9 presets', () => {
    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    document.body.appendChild(content as unknown as HTMLElement);

    const presets = getTunablePresets();

    for (const p of presets) {
      const params = p.getCustomParameters!();

      // Mutate
      for (const def of params) {
        p.setCustomParameter!(def.id, def.max);
      }

      // Direct reset
      p.resetCustomParameters!();
      for (const def of params) {
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);
      }

      // Mutate again and test via DOM Reset Button
      for (const def of params) {
        p.setCustomParameter!(def.id, def.min);
      }

      renderTuningPanel(p, content);

      const resetBtn = content.querySelector('#resetTuningBtn') as MockElement;
      expect(resetBtn).toBeDefined();
      resetBtn.click();

      for (const def of params) {
        expect(p.getCustomParameterValue!(def.id)).toBe(def.defaultValue);
        const slider = content.querySelector(`#tuning_${def.id}_slider`) as MockElement;
        expect(Number(slider.value)).toBe(def.defaultValue);
        const readout = content.querySelector(`#tuning_${def.id}_val`) as MockElement;
        expect(readout.textContent).toBe(formatParamValue(def.defaultValue, def.step));
      }
    }
  });
});
