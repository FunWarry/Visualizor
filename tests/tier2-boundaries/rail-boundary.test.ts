import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import { CANONICAL_15_RAIL_TOOLS } from '../harness/contracts';

class NavigationRailController {
  public activeTool: string | null = null;
  public isDrawerOpen = false;
  private readonly panels: Map<string, MockElement> = new Map();

  registerPanel(toolId: string, panelEl: MockElement): void {
    this.panels.set(toolId, panelEl);
  }

  toggleTool(toolId: string): void {
    if (this.activeTool === toolId) {
      // Close current drawer
      this.isDrawerOpen = false;
      this.activeTool = null;
      const panel = this.panels.get(toolId);
      panel?.classList.remove('open');
      return;
    }

    // Close previous
    if (this.activeTool) {
      const prev = this.panels.get(this.activeTool);
      prev?.classList.remove('open');
    }

    this.activeTool = toolId;
    this.isDrawerOpen = true;
    const next = this.panels.get(toolId);
    next?.classList.add('open');
  }
}

describe('Tier 2: UI Navigation Rail Boundary Cases', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T2.Rail.1: Rapid open/close toggling 30 times maintains synchronized state', () => {
    const controller = new NavigationRailController();
    const panel = new MockElement('DIV');
    controller.registerPanel('presets', panel);

    for (let i = 0; i < 30; i++) {
      controller.toggleTool('presets');
    }

    // 30 is even -> should be closed and inactive
    expect(controller.isDrawerOpen).toBe(false);
    expect(controller.activeTool).toBeNull();
    expect(panel.classList.contains('open')).toBe(false);
  });

  test('T2.Rail.2: Toggling tool with missing or unregistered panel handles null safely', () => {
    const controller = new NavigationRailController();
    // No panel registered for 'missingTool'
    controller.toggleTool('missingTool');

    expect(controller.activeTool).toBe('missingTool');
    expect(controller.isDrawerOpen).toBe(true);

    // Toggle off
    controller.toggleTool('missingTool');
    expect(controller.activeTool).toBeNull();
    expect(controller.isDrawerOpen).toBe(false);
  });

  test('T2.Rail.3: Rapid switching across all 15 tools sequentially leaves only last tool open', () => {
    const controller = new NavigationRailController();
    const panels: MockElement[] = [];

    for (const tool of CANONICAL_15_RAIL_TOOLS) {
      const p = new MockElement('DIV');
      controller.registerPanel(tool.id, p);
      panels.push(p);
    }

    // Activate each tool in sequence
    for (const tool of CANONICAL_15_RAIL_TOOLS) {
      controller.toggleTool(tool.id);
    }

    const lastTool = CANONICAL_15_RAIL_TOOLS[CANONICAL_15_RAIL_TOOLS.length - 1];
    expect(controller.activeTool).toBe(lastTool.id);
    expect(controller.isDrawerOpen).toBe(true);

    // Verify all other panels are closed
    for (let i = 0; i < CANONICAL_15_RAIL_TOOLS.length - 1; i++) {
      expect(panels[i].classList.contains('open')).toBe(false);
    }
    // Only last panel is open
    expect(panels[panels.length - 1].classList.contains('open')).toBe(true);
  });

  test('T2.Rail.4: Extreme mobile viewport (320x480) correctly activates mobile responsive layout flags', () => {
    const evaluateLayoutMode = (width: number, height: number): { isMobile: boolean; isCompactHeight: boolean } => {
      return {
        isMobile: width <= 640,
        isCompactHeight: height < 900
      };
    };

    const mobile = evaluateLayoutMode(320, 480);
    expect(mobile.isMobile).toBe(true);
    expect(mobile.isCompactHeight).toBe(true);

    const desktop4k = evaluateLayoutMode(3840, 2160);
    expect(desktop4k.isMobile).toBe(false);
    expect(desktop4k.isCompactHeight).toBe(false);
  });

  test('T2.Rail.5: Double-clicking an active rail button closes drawer and clears selection', () => {
    const controller = new NavigationRailController();
    const panel = new MockElement('DIV');
    controller.registerPanel('camera', panel);

    // First click: opens
    controller.toggleTool('camera');
    expect(controller.activeTool).toBe('camera');
    expect(controller.isDrawerOpen).toBe(true);

    // Second click: closes
    controller.toggleTool('camera');
    expect(controller.activeTool).toBeNull();
    expect(controller.isDrawerOpen).toBe(false);
  });
});
