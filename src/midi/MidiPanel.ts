import { MidiManager } from './MidiManager';
import { MidiDevice } from './types';

export class MidiPanel {
  private readonly manager: MidiManager;
  private readonly panel: HTMLElement | null;
  private statusIndicator: HTMLElement | null = null;
  private statusBadge: HTMLElement | null = null;
  private deviceCountEl: HTMLElement | null = null;
  private connectBtn: HTMLButtonElement | null = null;
  private connectBtnText: HTMLElement | null = null;
  private portsListEl: HTMLElement | null = null;
  private learnBoxEl: HTMLElement | null = null;
  private learnBadgeEl: HTMLElement | null = null;
  private activeTargetEl: HTMLElement | null = null;
  private learnPulseEl: HTMLElement | null = null;
  private cancelLearnBtn: HTMLButtonElement | null = null;
  private mappingCountEl: HTMLElement | null = null;
  private mappingsTableEl: HTMLElement | null = null;
  private resetDefaultsBtn: HTMLButtonElement | null = null;
  private refreshPortsBtn: HTMLButtonElement | null = null;

  constructor(manager: MidiManager, customPanel?: HTMLElement | null) {
    this.manager = manager;
    this.panel = customPanel ?? (typeof document !== 'undefined' ? document.getElementById('midiPanel') : null);
    this.bindDomElements();
    this.bindManagerEvents();
    this.bindUserInteractions();
    this.render();
  }

  public render(): void {
    this.renderStatus();
    this.renderPorts(this.manager.getDevices());
    this.renderLearnState();
    this.renderMappings();
  }

  public updateParameterValue(target: string, normalizedValue: number): void {
    if (!this.panel) return;
    const fill = this.panel.querySelector(`[data-fill-target="${target}"]`) as HTMLElement | null;
    if (fill) {
      const pct = Math.round(Math.max(0, Math.min(1, normalizedValue)) * 100);
      fill.style.width = `${pct}%`;
    }
  }

  private bindDomElements(): void {
    if (!this.panel) return;
    this.statusIndicator = this.panel.querySelector('#midiStatusIndicator');
    this.statusBadge = this.panel.querySelector('#midiStatusBadge');
    this.deviceCountEl = this.panel.querySelector('#midiDeviceCount');
    this.connectBtn = this.panel.querySelector('#midiConnectBtn');
    this.connectBtnText = this.panel.querySelector('#midiConnectBtnText');
    this.portsListEl = this.panel.querySelector('#midiPortsList');
    this.learnBoxEl = this.panel.querySelector('#midiLearnBox');
    this.learnBadgeEl = this.panel.querySelector('#midiLearnBadge');
    this.activeTargetEl = this.panel.querySelector('#midiLearnActiveTarget');
    this.learnPulseEl = this.panel.querySelector('#midiLearnPulse');
    this.cancelLearnBtn = this.panel.querySelector('#midiCancelLearnBtn');
    this.mappingCountEl = this.panel.querySelector('#midiMappingCount');
    this.mappingsTableEl = this.panel.querySelector('#midiMappingsTable');
    this.resetDefaultsBtn = this.panel.querySelector('#midiResetDefaultsBtn');
    this.refreshPortsBtn = this.panel.querySelector('#midiRefreshPortsBtn');
  }

  private bindManagerEvents(): void {
    this.manager.on('stateChange', () => {
      this.renderStatus();
      this.renderLearnState();
      this.renderMappings();
    });

    this.manager.on('deviceChange', (devices) => {
      this.renderPorts(devices);
      this.renderStatus();
    });

    this.manager.on('cc', (event) => {
      this.updateParameterValue(event.target, event.value);
    });
  }

  private bindUserInteractions(): void {
    this.connectBtn?.addEventListener('click', async () => {
      if (this.connectBtnText) this.connectBtnText.textContent = 'Connecting...';
      if (this.connectBtn) this.connectBtn.disabled = true;
      await this.manager.init();
      this.render();
    });

    this.refreshPortsBtn?.addEventListener('click', () => {
      this.renderPorts(this.manager.getDevices());
    });

    this.cancelLearnBtn?.addEventListener('click', () => {
      this.manager.stopLearn();
    });

    this.resetDefaultsBtn?.addEventListener('click', () => {
      this.manager.resetToDefaults();
    });
  }

  private renderStatus(): void {
    const { isConnected, isSupported, isLearning } = this.manager;
    this.updateStatusBadge(isConnected, isSupported, isLearning);
    this.updateStatusIndicator(isConnected, isLearning);
    this.updateConnectButton(isConnected, isSupported);

    if (this.deviceCountEl) {
      const count = this.manager.inputs.size;
      this.deviceCountEl.textContent = `${count} device${count === 1 ? '' : 's'} connected`;
    }
  }

  private updateStatusBadge(isConnected: boolean, isSupported: boolean, isLearning: boolean): void {
    if (!this.statusBadge) return;
    this.statusBadge.classList.remove('midi-connected', 'midi-disconnected', 'midi-learning');

    if (isLearning) {
      this.statusBadge.classList.add('midi-learning');
      this.statusBadge.textContent = 'Learning';
    } else if (isConnected) {
      this.statusBadge.classList.add('midi-connected');
      this.statusBadge.textContent = 'Connected';
    } else {
      this.statusBadge.classList.add('midi-disconnected');
      this.statusBadge.textContent = isSupported ? 'Disconnected' : 'Unsupported';
    }
  }

  private updateStatusIndicator(isConnected: boolean, isLearning: boolean): void {
    if (!this.statusIndicator) return;
    this.statusIndicator.classList.remove('connected', 'learning');

    if (isLearning) {
      this.statusIndicator.classList.add('learning');
    } else if (isConnected) {
      this.statusIndicator.classList.add('connected');
    }
  }

  private updateConnectButton(isConnected: boolean, isSupported: boolean): void {
    if (!this.connectBtn || !this.connectBtnText) return;

    if (isConnected) {
      this.connectBtnText.textContent = 'MIDI Connected';
      this.connectBtn.disabled = true;
      this.connectBtn.style.opacity = '0.7';
    } else {
      this.connectBtnText.textContent = 'Connect MIDI';
      this.connectBtn.disabled = !isSupported;
      this.connectBtn.style.opacity = '1.0';
    }
  }

  private renderPorts(devices: MidiDevice[]): void {
    if (!this.portsListEl) return;
    this.portsListEl.innerHTML = '';

    if (devices.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'midi-port-empty';
      empty.id = 'midiPortEmpty';
      empty.textContent = 'No MIDI devices detected. Click "Connect MIDI" to enable access.';
      this.portsListEl.appendChild(empty);
      return;
    }

    for (const dev of devices) {
      const item = document.createElement('div');
      item.className = 'midi-port-item';

      const name = document.createElement('span');
      name.className = 'midi-port-name';
      name.textContent = dev.name;

      const meta = document.createElement('span');
      meta.className = 'midi-port-meta';
      meta.textContent = dev.manufacturer || 'Connected';

      item.appendChild(name);
      item.appendChild(meta);
      this.portsListEl.appendChild(item);
    }
  }

  private renderLearnState(): void {
    const { isLearning, learningTarget } = this.manager;

    if (this.learnBoxEl) {
      this.learnBoxEl.classList.toggle('active', isLearning);
    }

    if (this.learnBadgeEl) {
      this.learnBadgeEl.style.display = isLearning ? 'inline-block' : 'none';
    }

    if (this.activeTargetEl) {
      if (isLearning && learningTarget) {
        this.activeTargetEl.textContent = this.manager.getParamLabel(learningTarget);
      } else {
        this.activeTargetEl.textContent = 'None (Click Learn on any parameter)';
      }
    }

    if (this.learnPulseEl) {
      this.learnPulseEl.style.display = isLearning ? 'flex' : 'none';
      this.learnPulseEl.classList.toggle('hidden', !isLearning);
    }

    if (this.cancelLearnBtn) {
      this.cancelLearnBtn.style.display = isLearning ? 'inline-flex' : 'none';
      this.cancelLearnBtn.classList.toggle('hidden', !isLearning);
    }
  }

  private getDisplayTargets(): Array<{ target: string; label: string }> {
    const canonicalOrder = [
      'audioSensitivity',
      'animationSpeed',
      'persistence',
      'cameraOrbit',
      'audioVolume',
      'colorSaturation',
      'resonance',
      'bloomStrength'
    ];

    const targets: Array<{ target: string; label: string }> = canonicalOrder.map(t => ({
      target: t,
      label: this.manager.getParamLabel(t)
    }));

    for (const target of this.manager.mappings.values()) {
      if (!canonicalOrder.includes(target) && !targets.some(x => x.target === target)) {
        targets.push({ target, label: this.manager.getParamLabel(target) });
      }
    }

    return targets;
  }

  private findCcForTarget(target: string): number | undefined {
    for (const [cc, t] of this.manager.mappings.entries()) {
      if (t === target) return cc;
    }
    return undefined;
  }

  private renderMappings(): void {
    if (!this.mappingsTableEl) return;
    this.mappingsTableEl.innerHTML = '';

    const targets = this.getDisplayTargets();
    let mappedCount = 0;

    for (const item of targets) {
      const boundCc = this.findCcForTarget(item.target);
      if (boundCc !== undefined) {
        mappedCount++;
      }
      const row = this.createMappingRow(item.target, item.label, boundCc);
      this.mappingsTableEl.appendChild(row);
    }

    if (this.mappingCountEl) {
      this.mappingCountEl.textContent = `${mappedCount} active`;
    }
  }

  private createMappingRow(target: string, label: string, cc?: number): HTMLElement {
    const isTargetLearning = this.manager.isLearning && this.manager.learningTarget === target;

    const row = document.createElement('div');
    row.className = `midi-mapping-row${isTargetLearning ? ' learning' : ''}`;
    row.dataset.targetId = target;

    const top = document.createElement('div');
    top.className = 'midi-mapping-top';

    const left = document.createElement('div');
    left.className = 'midi-mapping-left';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'midi-target-name';
    nameSpan.textContent = label;

    const ccBadge = document.createElement('span');
    ccBadge.className = 'midi-cc-badge';
    ccBadge.textContent = cc !== undefined ? `CC ${cc}` : 'Unassigned';

    left.appendChild(nameSpan);
    left.appendChild(ccBadge);

    const actions = this.createRowActions(target, cc, isTargetLearning);
    top.appendChild(left);
    top.appendChild(actions);

    const track = document.createElement('div');
    track.className = 'midi-value-track';
    const fill = document.createElement('div');
    fill.className = 'midi-value-fill';
    fill.dataset.fillTarget = target;

    const currentVal = this.manager.parameterValues.get(target) ?? 0;
    const pct = Math.round(Math.max(0, Math.min(1, currentVal)) * 100);
    fill.style.width = `${pct}%`;
    track.appendChild(fill);

    row.appendChild(top);
    row.appendChild(track);
    return row;
  }

  private createRowActions(target: string, cc?: number, isLearning?: boolean): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'midi-mapping-actions';

    const learnBtn = document.createElement('button');
    learnBtn.type = 'button';
    learnBtn.className = `midi-row-btn midi-row-btn--learn${isLearning ? ' active' : ''}`;
    learnBtn.textContent = isLearning ? 'Learning...' : 'Learn';
    learnBtn.addEventListener('click', () => {
      if (isLearning) {
        this.manager.stopLearn();
      } else {
        this.manager.startLearn(target);
      }
    });

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'midi-row-btn midi-row-btn--clear';
    clearBtn.textContent = 'Clear';
    clearBtn.disabled = cc === undefined;
    clearBtn.addEventListener('click', () => {
      if (cc !== undefined) {
        this.manager.removeMapping(cc);
      }
    });

    actions.appendChild(learnBtn);
    actions.appendChild(clearBtn);
    return actions;
  }
}

export function initMidiPanel(manager: MidiManager, panelElement?: HTMLElement | null): MidiPanel {
  return new MidiPanel(manager, panelElement);
}
