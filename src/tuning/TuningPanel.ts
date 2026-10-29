import { VisualizerPreset } from '../types';

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

  if (!params || params.length === 0) {
    const emptyNotice = document.createElement('div');
    emptyNotice.className = 'sidebar-item u-text-center u-py-24 u-color-muted u-text-13 tuning-fallback-notice';
    emptyNotice.style.cssText = 'text-align:center;padding:24px 12px;color:var(--text-muted);font-size:13px;';
    emptyNotice.textContent = 'No settings for this preset';
    content.appendChild(emptyNotice);
    return;
  }

  const desc = document.createElement('div');
  desc.style.cssText = 'font-size:11px;color:var(--text-muted);margin-bottom:14px;line-height:1.4;';
  desc.textContent = 'Dynamic parameter controls for real-time vertex deformation, speed, and particle density.';
  content.appendChild(desc);

  params.forEach(p => {
    const currentVal = (tunable && typeof tunable.getCustomParameterValue === 'function')
      ? (tunable.getCustomParameterValue(p.id) ?? p.defaultValue)
      : p.defaultValue;

    const row = document.createElement('div');
    row.className = 'control-row';

    const label = document.createElement('label');
    label.className = 'control-label';
    label.htmlFor = `tuning_${p.id}_slider`;

    const nameSpan = document.createElement('span');
    nameSpan.textContent = p.name;

    const valSpan = document.createElement('span');
    valSpan.id = `tuning_${p.id}_val`;
    valSpan.className = 'tuning-val-readout';
    valSpan.textContent = formatParamValue(currentVal, p.step);

    label.appendChild(nameSpan);
    label.appendChild(valSpan);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'ui-slider tuning-slider';
    slider.id = `tuning_${p.id}_slider`;
    slider.setAttribute('data-param-id', p.id);
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
      if (typeof tunable?.setCustomParameter === 'function') {
        tunable.setCustomParameter(p.id, numVal);
      }
      const updatedVal = (tunable && typeof tunable.getCustomParameterValue === 'function')
        ? (tunable.getCustomParameterValue(p.id) ?? numVal)
        : numVal;
      valSpan.textContent = formatParamValue(updatedVal, p.step);
    });

    row.appendChild(label);
    row.appendChild(slider);
    content.appendChild(row);
  });

  const actionsWrap = document.createElement('div');
  actionsWrap.style.cssText = 'margin-top:20px;display:flex;justify-content:flex-end;';

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
    if (typeof tunable?.resetCustomParameters === 'function') {
      tunable.resetCustomParameters();
    } else {
      for (const p of params) {
        tunable?.setCustomParameter?.(p.id, p.defaultValue);
      }
    }

    params.forEach(p => {
      const slider = content.querySelector(`#tuning_${p.id}_slider`) as HTMLInputElement | null;
      const valSpan = content.querySelector(`#tuning_${p.id}_val`) as HTMLElement | null;
      if (slider) slider.value = p.defaultValue.toString();
      if (valSpan) valSpan.textContent = formatParamValue(p.defaultValue, p.step);
    });
  });

  actionsWrap.appendChild(resetBtn);
  content.appendChild(actionsWrap);
}
