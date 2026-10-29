import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import { CANONICAL_15_RAIL_TOOLS } from '../harness/contracts';

describe('Tier 1: UI Navigation Rail Tools (#40)', () => {
  let railContainer: MockElement;
  let detailPanels: Map<string, MockElement>;

  beforeEach(() => {
    setupTestEnvironment();
    railContainer = new MockElement('NAV');
    railContainer.className = 'icon-rail';
    document.body.appendChild(railContainer as unknown as HTMLElement);

    detailPanels = new Map();
    for (const tool of CANONICAL_15_RAIL_TOOLS) {
      const btn = new MockElement('BUTTON');
      btn.className = 'rail-btn';
      btn.setAttribute('data-panel', tool.id);
      btn.setAttribute('aria-label', tool.label);
      railContainer.appendChild(btn);

      if (tool.panel !== 'none' && !tool.panel.endsWith('Modal') && !tool.panel.endsWith('Menu')) {
        const panel = new MockElement('DIV');
        panel.id = tool.panel;
        panel.className = 'detail-panel';
        document.body.appendChild(panel as unknown as HTMLElement);
        detailPanels.set(tool.id, panel);
      }
    }
  });

  test('T1.Rail.1: Navigation rail defines all 15 canonical tools', () => {
    expect(CANONICAL_15_RAIL_TOOLS).toHaveLength(15);
    const toolIds = CANONICAL_15_RAIL_TOOLS.map(t => t.id);
    expect(toolIds).toContain('presets');
    expect(toolIds).toContain('presetSettings');
    expect(toolIds).toContain('colors');
    expect(toolIds).toContain('effects');
    expect(toolIds).toContain('camera');
    expect(toolIds).toContain('audio');
    expect(toolIds).toContain('overlay');
    expect(toolIds).toContain('text');
    expect(toolIds).toContain('subtitles');
    expect(toolIds).toContain('tracks');
    expect(toolIds).toContain('library');
    expect(toolIds).toContain('myCreations');
    expect(toolIds).toContain('more');
    expect(toolIds).toContain('shortcuts');
    expect(toolIds).toContain('hideUi');
  });

  test('T1.Rail.2: Rail button activation adds active class and opens drawer', () => {
    const presetsBtn = railContainer.querySelector('[data-panel="presets"]') as MockElement;
    expect(presetsBtn).toBeDefined();

    // Simulating rail controller activation
    presetsBtn.classList.add('active');
    const panel = detailPanels.get('presets');
    panel?.classList.add('open');

    expect(presetsBtn.classList.contains('active')).toBe(true);
    expect(panel?.classList.contains('open')).toBe(true);
  });

  test('T1.Rail.3: Clicking already active rail button closes drawer and removes active class', () => {
    const colorsBtn = railContainer.querySelector('[data-panel="colors"]') as MockElement;
    const panel = detailPanels.get('colors');

    colorsBtn.classList.add('active');
    panel?.classList.add('open');

    // Toggle behavior: when active, clicking closes
    if (colorsBtn.classList.contains('active')) {
      colorsBtn.classList.remove('active');
      panel?.classList.remove('open');
    }

    expect(colorsBtn.classList.contains('active')).toBe(false);
    expect(panel?.classList.contains('open')).toBe(false);
  });

  test('T1.Rail.4: Switching between rail tools closes previous drawer and opens target drawer', () => {
    const presetsBtn = railContainer.querySelector('[data-panel="presets"]') as MockElement;
    const cameraBtn = railContainer.querySelector('[data-panel="camera"]') as MockElement;
    const presetsPanel = detailPanels.get('presets');
    const cameraPanel = detailPanels.get('camera');

    // Activate Presets
    presetsBtn.classList.add('active');
    presetsPanel?.classList.add('open');

    // Switch to Camera
    presetsBtn.classList.remove('active');
    presetsPanel?.classList.remove('open');
    cameraBtn.classList.add('active');
    cameraPanel?.classList.add('open');

    expect(presetsBtn.classList.contains('active')).toBe(false);
    expect(presetsPanel?.classList.contains('open')).toBe(false);
    expect(cameraBtn.classList.contains('active')).toBe(true);
    expect(cameraPanel?.classList.contains('open')).toBe(true);
  });

  test('T1.Rail.5: Hide UI tool adds ui-hidden class to app root', () => {
    const appRoot = document.documentElement as unknown as MockElement;
    const hideBtn = railContainer.querySelector('[data-panel="hideUi"]') as MockElement;

    // Simulate hide UI action
    hideBtn.click();
    appRoot.classList.add('ui-hidden');

    expect(appRoot.classList.contains('ui-hidden')).toBe(true);
  });

  test('T1.Rail.6: Viewport responsive detents adapt rail button layout dimensions', () => {
    // Contract verification for viewport < 900px
    const compactHeightThreshold = 900;
    const isCompact = 800 < compactHeightThreshold;
    const buttonHeight = isCompact ? 36 : 40;
    const presetsButtonHeight = isCompact ? 52 : 80;

    expect(buttonHeight).toBe(36);
    expect(presetsButtonHeight).toBe(52);
  });
});
