import { VisualizerPreset, ParameterDefinition } from '../types';
import {
  saveTuning,
  clearSavedTuning,
  hasSavedTuning,
  isPresetLocked,
  setPresetLocked,
  isParamLocked,
  setParamLocked,
  getRandomizeBounds,
  setRandomizeBounds,
  isAutoRandomizeEnabled,
  setAutoRandomizeEnabled,
  randomizePreset
} from './PresetTuningManager';

export function formatParamValue(val: number, step: number): string {
  if (Number.isInteger(step)) return Math.round(val).toString();
  const decimals = step < 0.1 ? 2 : 1;
  return val.toFixed(decimals);
}

export function updateTuningButtonState(
  preset: VisualizerPreset | null,
  customBtn?: HTMLElement | null,
  customPanel?: HTMLElement | null,
  onClose?: () => void
): boolean {
  const tuningBtn = customBtn ?? (document.querySelector('.preset-settings-link') as HTMLElement | null);
  const panel = customPanel ?? (document.getElementById('tuningPanel') as HTMLElement | null);
  if (!tuningBtn) return false;

  const tunable = preset as VisualizerPreset | null;
  const hasParams = Boolean(
    tunable &&
    typeof tunable.getCustomParameters === 'function' &&
    (tunable.getCustomParameters()?.length ?? 0) > 0
  );

  if (hasParams) {
    tuningBtn.classList.remove('is-collapsed');
  } else {
    tuningBtn.classList.add('is-collapsed');
    if (panel && panel.classList.contains('open')) {
      panel.classList.remove('open');
      tuningBtn.classList.remove('active');
      if (onClose) {
        onClose();
      }
    }
  }

  return hasParams;
}

function renderToolbar(preset: VisualizerPreset, content: HTMLElement): void {
  const toolbar = document.createElement('div');
  toolbar.className = 'tuning-toolbar';

  const locked = isPresetLocked(preset.id);
  const lockBtn = document.createElement('button');
  lockBtn.type = 'button';
  lockBtn.id = 'togglePresetLockBtn';
  lockBtn.className = `btn-pill tuning-lock-btn ${locked ? 'locked' : ''}`;
  lockBtn.title = locked ? 'Preset is locked (Auto-cycle will not change preset)' : 'Click to lock preset during Auto-cycle';
  lockBtn.innerHTML = locked
    ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Preset Locked</span>`
    : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg><span>Lock Preset</span>`;

  lockBtn.addEventListener('click', () => {
    const nowLocked = !isPresetLocked(preset.id);
    setPresetLocked(preset.id, nowLocked);
    lockBtn.className = `btn-pill tuning-lock-btn ${nowLocked ? 'locked' : ''}`;
    lockBtn.title = nowLocked ? 'Preset is locked (Auto-cycle will not change preset)' : 'Click to lock preset during Auto-cycle';
    lockBtn.innerHTML = nowLocked
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>Preset Locked</span>`
      : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg><span>Lock Preset</span>`;
  });

  const savedBadge = document.createElement('span');
  savedBadge.className = 'tuning-saved-badge';
  savedBadge.textContent = 'Custom Saved ✓';
  savedBadge.style.display = hasSavedTuning(preset.id) ? 'inline-block' : 'none';

  toolbar.appendChild(lockBtn);
  toolbar.appendChild(savedBadge);
  content.appendChild(toolbar);
}

function renderParameterRow(
  preset: VisualizerPreset,
  p: ParameterDefinition,
  content: HTMLElement
): void {
  const currentVal = (typeof preset.getCustomParameterValue === 'function')
    ? (preset.getCustomParameterValue(p.id) ?? p.defaultValue)
    : p.defaultValue;

  const row = document.createElement('div');
  row.className = 'control-row';

  const label = document.createElement('label');
  label.className = 'control-label';
  label.htmlFor = `tuning_${p.id}_slider`;

  const leftWrap = document.createElement('div');
  leftWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

  const isLocked = isParamLocked(preset.id, p.id);
  const lockToggle = document.createElement('button');
  lockToggle.type = 'button';
  lockToggle.className = `tuning-param-lock-btn ${isLocked ? 'locked' : ''}`;
  lockToggle.id = `tuning_${p.id}_lock`;
  lockToggle.title = isLocked ? 'Parameter locked against randomization' : 'Lock parameter against randomization';
  lockToggle.innerHTML = isLocked
    ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
    : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;

  lockToggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newLock = !isParamLocked(preset.id, p.id);
    setParamLocked(preset.id, p.id, newLock);
    lockToggle.className = `tuning-param-lock-btn ${newLock ? 'locked' : ''}`;
    lockToggle.title = newLock ? 'Parameter locked against randomization' : 'Lock parameter against randomization';
    lockToggle.innerHTML = newLock
      ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
      : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`;
  });

  const nameSpan = document.createElement('span');
  nameSpan.textContent = p.name;

  leftWrap.appendChild(lockToggle);
  leftWrap.appendChild(nameSpan);

  const valSpan = document.createElement('span');
  valSpan.id = `tuning_${p.id}_val`;
  valSpan.className = 'tuning-val-readout';
  valSpan.textContent = formatParamValue(currentVal, p.step);

  label.appendChild(leftWrap);
  label.appendChild(valSpan);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'ui-slider tuning-slider';
  slider.id = `tuning_${p.id}_slider`;
  slider.dataset.paramId = p.id;
  slider.min = p.min.toString();
  slider.max = p.max.toString();
  slider.step = p.step.toString();
  slider.setAttribute('min', p.min.toString());
  slider.setAttribute('max', p.max.toString());
  slider.setAttribute('step', p.step.toString());
  slider.value = currentVal.toString();
  slider.setAttribute('aria-label', p.name);

  slider.addEventListener('input', (e) => {
    const target = (e.target ?? slider) as HTMLInputElement;
    const numVal = Number(target.value);
    if (typeof preset.setCustomParameter === 'function') {
      preset.setCustomParameter(p.id, numVal);
    }
    const updatedVal = (typeof preset.getCustomParameterValue === 'function')
      ? (preset.getCustomParameterValue(p.id) ?? numVal)
      : numVal;
    valSpan.textContent = formatParamValue(updatedVal, p.step);
  });

  row.appendChild(label);
  row.appendChild(slider);
  content.appendChild(row);
}

function renderRandomizeCard(
  preset: VisualizerPreset,
  params: ParameterDefinition[],
  content: HTMLElement
): void {
  const card = document.createElement('div');
  card.className = 'tuning-random-card';

  const bounds = getRandomizeBounds(preset.id);
  let minP = bounds.minPercent;
  let maxP = bounds.maxPercent;

  const header = document.createElement('div');
  header.className = 'tuning-random-header';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'tuning-random-title';
  titleSpan.textContent = 'Auto Margin & Variation';

  const randBtn = document.createElement('button');
  randBtn.type = 'button';
  randBtn.className = 'btn-pill';
  randBtn.id = 'randomizePresetParamsBtn';
  randBtn.style.cssText = 'font-size:11px;padding:4px 10px;gap:4px;background:rgba(255,92,0,0.18);border-color:rgba(255,92,0,0.5);color:#ffaa66;';
  randBtn.innerHTML = `<span>🎲 Randomize</span>`;

  randBtn.addEventListener('click', () => {
    const newVals = randomizePreset(preset, minP, maxP);
    for (const [id, val] of Object.entries(newVals)) {
      const slider = content.querySelector(`#tuning_${id}_slider`) as HTMLInputElement | null;
      const valSpan = content.querySelector(`#tuning_${id}_val`) as HTMLElement | null;
      const p = params.find(param => param.id === id);
      if (slider) slider.value = val.toString();
      if (valSpan && p) valSpan.textContent = formatParamValue(val, p.step);
    }
  });

  header.appendChild(titleSpan);
  header.appendChild(randBtn);
  card.appendChild(header);

  // Range Slider Row
  const rangeDesc = document.createElement('div');
  rangeDesc.className = 'tuning-range-labels';
  const rangeReadout = document.createElement('span');
  rangeReadout.className = 'tuning-range-readout';
  rangeReadout.textContent = `Margin: ${minP}% — ${maxP}%`;
  rangeDesc.textContent = 'Randomize Bounds: ';
  rangeDesc.appendChild(rangeReadout);
  card.appendChild(rangeDesc);

  const boundsRow = document.createElement('div');
  boundsRow.className = 'tuning-bounds-row';

  const minSlider = document.createElement('input');
  minSlider.type = 'range';
  minSlider.className = 'ui-slider tuning-bound-slider';
  minSlider.min = '0';
  minSlider.max = '100';
  minSlider.step = '5';
  minSlider.value = minP.toString();
  minSlider.title = 'Minimum Randomization Margin (%)';

  const maxSlider = document.createElement('input');
  maxSlider.type = 'range';
  maxSlider.className = 'ui-slider tuning-bound-slider';
  maxSlider.min = '0';
  maxSlider.max = '100';
  maxSlider.step = '5';
  maxSlider.value = maxP.toString();
  maxSlider.title = 'Maximum Randomization Margin (%)';

  const onBoundsChange = () => {
    minP = Math.min(Number(minSlider.value), Number(maxSlider.value));
    maxP = Math.max(Number(minSlider.value), Number(maxSlider.value));
    rangeReadout.textContent = `Margin: ${minP}% — ${maxP}%`;
    setRandomizeBounds(preset.id, minP, maxP);
  };

  minSlider.addEventListener('input', onBoundsChange);
  maxSlider.addEventListener('input', onBoundsChange);

  boundsRow.appendChild(minSlider);
  boundsRow.appendChild(maxSlider);
  card.appendChild(boundsRow);

  // Auto-Randomize in Auto Mode Checkbox
  const autoRow = document.createElement('label');
  autoRow.className = 'tuning-auto-toggle-row';
  const autoCheckbox = document.createElement('input');
  autoCheckbox.type = 'checkbox';
  autoCheckbox.checked = isAutoRandomizeEnabled();
  autoCheckbox.style.cssText = 'accent-color:var(--primary);cursor:pointer;';
  autoCheckbox.addEventListener('change', () => {
    setAutoRandomizeEnabled(autoCheckbox.checked);
  });
  const autoLabel = document.createElement('span');
  autoLabel.textContent = '⚡ Mutate within margin in Auto Mode';
  autoRow.appendChild(autoCheckbox);
  autoRow.appendChild(autoLabel);
  card.appendChild(autoRow);

  content.appendChild(card);
}

function renderTuningActions(
  preset: VisualizerPreset,
  params: ParameterDefinition[],
  content: HTMLElement
): void {
  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'tuning-actions-wrap';

  // Save Preset Button
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.id = 'saveTuningBtn';
  saveBtn.className = 'btn-pill tuning-save-btn';
  saveBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    <span>Save Preset</span>
  `;

  saveBtn.addEventListener('click', () => {
    const values: Record<string, number> = {};
    for (const p of params) {
      values[p.id] = (typeof preset.getCustomParameterValue === 'function')
        ? (preset.getCustomParameterValue(p.id) ?? p.defaultValue)
        : p.defaultValue;
    }
    saveTuning(preset.id, values);

    saveBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      <span style="color:#22c55e;">Saved ✓</span>
    `;
    const savedBadge = content.querySelector('.tuning-saved-badge') as HTMLElement | null;
    if (savedBadge) {
      savedBadge.style.display = 'inline-block';
    }
    setTimeout(() => {
      saveBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        <span>Save Preset</span>
      `;
    }, 1800);
  });

  // Reset to Defaults Button
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.id = 'resetTuningBtn';
  resetBtn.className = 'btn-pill';
  resetBtn.style.cssText = 'font-size:11px;padding:5px 12px;gap:5px;';
  resetBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    <span>Reset to Defaults</span>
  `;

  resetBtn.addEventListener('click', () => {
    if (typeof preset.resetCustomParameters === 'function') {
      preset.resetCustomParameters();
    } else {
      for (const p of params) {
        preset.setCustomParameter?.(p.id, p.defaultValue);
      }
    }
    clearSavedTuning(preset.id);

    params.forEach(p => {
      const slider = content.querySelector(`#tuning_${p.id}_slider`) as HTMLInputElement | null;
      const valSpan = content.querySelector(`#tuning_${p.id}_val`) as HTMLElement | null;
      if (slider) slider.value = p.defaultValue.toString();
      if (valSpan) valSpan.textContent = formatParamValue(p.defaultValue, p.step);
    });

    const savedBadge = content.querySelector('.tuning-saved-badge') as HTMLElement | null;
    if (savedBadge) savedBadge.style.display = 'none';
  });

  actionsWrap.appendChild(saveBtn);
  actionsWrap.appendChild(resetBtn);
  content.appendChild(actionsWrap);
}

export function renderTuningPanel(
  preset: VisualizerPreset | null,
  customContent?: HTMLElement | null
): void {
  const content = customContent ?? (document.getElementById('presetSettingsContent') as HTMLElement | null);
  if (!content) return;

  const tunable = preset as VisualizerPreset | null;
  const params = (tunable && typeof tunable.getCustomParameters === 'function')
    ? tunable.getCustomParameters()
    : undefined;

  content.innerHTML = '';

  if (!tunable || !params || params.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.className = 'sidebar-item u-text-center u-py-24 u-color-muted u-text-13 tuning-fallback-notice';
    emptyNotice.style.cssText = 'text-align:center;padding:24px 12px;color:var(--text-muted);font-size:13px;';
    emptyNotice.textContent = 'No settings for this preset';
    content.appendChild(emptyNotice);
    return;
  }

  renderToolbar(tunable, content);

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.4;';
  desc.textContent = 'Dynamic parameter controls for real-time vertex deformation, speed, and particle density.';
  content.appendChild(desc);

  params.forEach(p => {
    renderParameterRow(tunable, p, content);
  });

  renderRandomizeCard(tunable, params, content);
  renderTuningActions(tunable, params, content);
}
