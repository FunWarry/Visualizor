import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import { ParameterDefinition } from '../harness/contracts';
import { VisualizerPreset } from '../../src/types';
import { createMockPresetContext } from '../harness/fixtures';
import { renderTuningPanel, updateTuningButtonState } from '../../src/tuning/TuningPanel';
import { WaveFormPreset } from '../../src/presets/WaveForm';
import { ParticleFieldPreset } from '../../src/presets/ParticleField';
import { CircularSpectrumPreset } from '../../src/presets/CircularSpectrum';
import { FerrofluidPreset } from '../../src/presets/Ferrofluid';
import { ObsidianPolyPreset } from '../../src/presets/ObsidianPoly';
import { NeonTunnelPreset } from '../../src/presets/NeonTunnel';
import { StarfieldPreset } from '../../src/presets/Starfield';
import { ThreeDBarsPreset } from '../../src/presets/ThreeDBars';
import { SynthwaveTerrainPreset } from '../../src/presets/SynthwaveTerrain';
import { MilkDropPreset } from '../../src/presets/MilkDrop';

interface TunablePreset extends VisualizerPreset {
  getCustomParameters?(): ParameterDefinition[];
  setCustomParameter?(id: string, value: number): void;
}

class SampleTunablePreset implements TunablePreset {
  id = 'sample-tunable';
  name = 'Sample Tunable';
  category = 'Structures' as const;
  description = 'Preset with custom fine-tuning parameters.';

  public parameters: Record<string, number> = {
    waveHeight: 0.35,
    animSpeed: 0.5,
    metalness: 0.25,
    particleDensity: 1.0
  };

  init(): void {}
  update(): void {}
  dispose(): void {}

  getCustomParameters(): ParameterDefinition[] {
    return [
      { id: 'waveHeight', name: 'Wave Height', min: 0.0, max: 1.0, step: 0.05, defaultValue: 0.35 },
      { id: 'animSpeed', name: 'Speed', min: 0.1, max: 2.0, step: 0.1, defaultValue: 0.5 },
      { id: 'metalness', name: 'Metalness', min: 0.0, max: 1.0, step: 0.05, defaultValue: 0.25 },
      { id: 'particleDensity', name: 'Particle Density', min: 0.0, max: 2.0, step: 0.1, defaultValue: 1.0 }
    ];
  }

  setCustomParameter(id: string, value: number): void {
    const param = this.getCustomParameters().find(p => p.id === id);
    if (!param) return;
    const clamped = Math.max(param.min, Math.min(param.max, value));
    this.parameters[id] = clamped;
  }
}

class NonTunablePreset implements TunablePreset {
  id = 'non-tunable';
  name = 'Non Tunable';
  category = 'Structures' as const;
  description = 'Preset without custom parameters.';
  init(): void {}
  update(): void {}
  dispose(): void {}
}

describe('Tier 1: Preset Fine-Tuning (#41)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Tuning.1: Preset declares valid parameter definitions conforming to schema', () => {
    const preset = new SampleTunablePreset();
    const params = preset.getCustomParameters();

    expect(params.length).toBe(4);
    for (const p of params) {
      expect(typeof p.id).toBe('string');
      expect(typeof p.name).toBe('string');
      expect(p.min).toBeLessThanOrEqual(p.max);
      expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
      expect(p.defaultValue).toBeLessThanOrEqual(p.max);
    }
  });

  test('T1.Tuning.2: Setting parameter value clamps to min and max boundaries', () => {
    const preset = new SampleTunablePreset();

    // Below minimum
    preset.setCustomParameter('waveHeight', -5.0);
    expect(preset.parameters.waveHeight).toBe(0.0);

    // Above maximum
    preset.setCustomParameter('animSpeed', 10.0);
    expect(preset.parameters.animSpeed).toBe(2.0);

    // Valid intermediate value
    preset.setCustomParameter('metalness', 0.75);
    expect(preset.parameters.metalness).toBe(0.75);
  });

  test('T1.Tuning.3: Non-tunable preset reports no parameters, triggering UI collapsed state', () => {
    const nonTunable: TunablePreset = new NonTunablePreset();
    const params = nonTunable.getCustomParameters ? nonTunable.getCustomParameters() : [];

    expect(params).toHaveLength(0);
    const shouldCollapse = params.length === 0;
    expect(shouldCollapse).toBe(true);
  });

  test('T1.Tuning.4: setCustomParameter ignores unknown parameter IDs gracefully', () => {
    const preset = new SampleTunablePreset();
    const initialParams = { ...preset.parameters };

    preset.setCustomParameter('unknown_parameter_xyz', 99.0);
    expect(preset.parameters).toEqual(initialParams);
  });

  test('T1.Tuning.5: Active preset parameter synchronization preserves values during execution', () => {
    const preset = new SampleTunablePreset();
    preset.init();

    preset.setCustomParameter('particleDensity', 1.8);
    expect(preset.parameters.particleDensity).toBe(1.8);

    preset.update();
    expect(preset.parameters.particleDensity).toBe(1.8);
    preset.dispose();
  });

  test('T1.Tuning.6: Real preset catalog entries declare valid parameters conforming to schema', () => {
    const presetsToVerify: VisualizerPreset[] = [
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

    for (const preset of presetsToVerify) {
      expect(typeof preset.getCustomParameters).toBe('function');
      const params = preset.getCustomParameters!();
      expect(params.length).toBeGreaterThanOrEqual(3);

      for (const p of params) {
        expect(typeof p.id).toBe('string');
        expect(typeof p.name).toBe('string');
        expect(p.min).toBeLessThanOrEqual(p.max);
        expect(p.defaultValue).toBeGreaterThanOrEqual(p.min);
        expect(p.defaultValue).toBeLessThanOrEqual(p.max);
        expect(p.step).toBeGreaterThan(0);
      }
    }
  });

  test('T1.Tuning.7: Dynamic slider DOM generation in #tuningPanel matches active preset parameters', () => {
    const railBtn = new MockElement('BUTTON');
    railBtn.id = 'presetSettingsRailBtn';
    railBtn.className = 'rail-btn preset-settings-link is-collapsed';
    document.body.appendChild(railBtn as unknown as HTMLElement);

    const tuningPanel = new MockElement('DIV');
    tuningPanel.id = 'tuningPanel';
    tuningPanel.className = 'drawer-panel detail-panel';

    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    tuningPanel.appendChild(content);
    document.body.appendChild(tuningPanel as unknown as HTMLElement);

    const preset = new WaveFormPreset();
    updateTuningButtonState(preset, railBtn, tuningPanel);
    renderTuningPanel(preset, content);

    // Rail button becomes visible (uncollapsed)
    expect(railBtn.classList.contains('is-collapsed')).toBe(false);

    // Sliders are rendered in content
    const sliders = content.querySelectorAll('.tuning-slider');
    const params = preset.getCustomParameters();
    expect(sliders.length).toBe(params.length);

    params.forEach(p => {
      const slider = content.querySelector(`#tuning_${p.id}_slider`) as MockElement;
      expect(slider).toBeDefined();
      expect(slider.getAttribute('data-param-id')).toBe(p.id);
      expect(Number(slider.getAttribute('min'))).toBe(p.min);
      expect(Number(slider.getAttribute('max'))).toBe(p.max);
      expect(Number(slider.getAttribute('step'))).toBe(p.step);
      expect(Number(slider.value)).toBe(p.defaultValue);
    });
  });

  test('T1.Tuning.8: Live slider input event propagates to preset and updates value readout immediately', () => {
    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    document.body.appendChild(content as unknown as HTMLElement);

    const preset = new WaveFormPreset();
    renderTuningPanel(preset, content);

    const speedSlider = content.querySelector('#tuning_speed_slider') as MockElement;
    const speedReadout = content.querySelector('#tuning_speed_val') as MockElement;
    expect(speedSlider).toBeDefined();
    expect(speedReadout).toBeDefined();

    // Simulate slider drag to 2.4
    speedSlider.value = '2.4';
    speedSlider.dispatchEvent(new Event('input'));

    // Check preset state updated
    expect(preset.getCustomParameterValue('speed')).toBe(2.4);
    // Check readout text updated
    expect(speedReadout.textContent).toBe('2.4');
  });

  test('T1.Tuning.9: Reset button restores default parameter values and DOM elements', () => {
    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    document.body.appendChild(content as unknown as HTMLElement);

    const preset = new WaveFormPreset();
    renderTuningPanel(preset, content);

    const speedSlider = content.querySelector('#tuning_speed_slider') as MockElement;
    const speedReadout = content.querySelector('#tuning_speed_val') as MockElement;

    // Mutate speed to 2.5
    speedSlider.value = '2.5';
    speedSlider.dispatchEvent(new Event('input'));
    expect(preset.getCustomParameterValue('speed')).toBe(2.5);

    // Click Reset to Defaults
    const resetBtn = content.querySelector('#resetTuningBtn') as MockElement;
    expect(resetBtn).toBeDefined();
    resetBtn.click();

    // Verify restored to default 1.0
    expect(preset.getCustomParameterValue('speed')).toBe(1.0);
    expect(Number(speedSlider.value)).toBe(1.0);
    expect(speedReadout.textContent).toBe('1.0');
  });

  test('T1.Tuning.10: Non-tunable preset displays fallback notice and collapses rail button', () => {
    const railBtn = new MockElement('BUTTON');
    railBtn.id = 'presetSettingsRailBtn';
    railBtn.className = 'rail-btn preset-settings-link';
    document.body.appendChild(railBtn as unknown as HTMLElement);

    const tuningPanel = new MockElement('DIV');
    tuningPanel.id = 'tuningPanel';
    tuningPanel.className = 'drawer-panel detail-panel open';

    const content = new MockElement('DIV');
    content.id = 'presetSettingsContent';
    tuningPanel.appendChild(content);
    document.body.appendChild(tuningPanel as unknown as HTMLElement);

    const milkdrop = new MilkDropPreset();
    updateTuningButtonState(milkdrop, railBtn, tuningPanel);
    renderTuningPanel(milkdrop, content);

    // Rail button collapsed
    expect(railBtn.classList.contains('is-collapsed')).toBe(true);
    // Drawer closed
    expect(tuningPanel.classList.contains('open')).toBe(false);

    // Fallback notice rendered
    const fallbackNotice = content.querySelector('.tuning-fallback-notice') as MockElement;
    expect(fallbackNotice).toBeDefined();
    expect(fallbackNotice.textContent).toBe('No settings for this preset');

    // Zero sliders rendered
    const sliders = content.querySelectorAll('.tuning-slider');
    expect(sliders.length).toBe(0);
  });
});
