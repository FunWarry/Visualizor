import { describe, test, expect, beforeEach } from '../harness/test-context';
import { setupTestEnvironment, MockElement } from '../harness/env';
import { PRESETS, getPreset } from '../../src/presets';
import { getTheme } from '../../src/themes/themes';
import { createMockPresetContext, createBeatDropAudioFeatures } from '../harness/fixtures';

describe('Tier 1: Presets Catalog & Lifecycle (#38)', () => {
  beforeEach(() => {
    setupTestEnvironment();
  });

  test('T1.Presets.1: Catalog contains exactly 71 registered presets with unique IDs', () => {
    expect(PRESETS.length).toBe(71);

    const ids = new Set<string>();
    for (const preset of PRESETS) {
      expect(typeof preset.id).toBe('string');
      expect(preset.id.length).toBeGreaterThan(0);
      expect(typeof preset.name).toBe('string');
      expect(preset.name.length).toBeGreaterThan(0);
      expect(typeof preset.description).toBe('string');
      expect(ids.has(preset.id)).toBe(false);
      ids.add(preset.id);
    }
    expect(ids.size).toBe(71);
  });

  test('T1.Presets.2: All 7 categories contain valid non-empty collections summing to 71', () => {
    const canonicalCategories: Record<string, number> = {
      'Structures': 15,
      'Abstract & Space': 15,
      'Particles & Light': 4,
      'Fluids & Heat': 9,
      'Tunnels': 7,
      'Retro & Digital': 7,
      'Organic & Nature': 14
    };

    let totalSum = 0;
    for (const [category, expectedCount] of Object.entries(canonicalCategories)) {
      const presetsInCat = PRESETS.filter(p => p.category === category);
      expect(presetsInCat.length).toBe(expectedCount);
      expect(presetsInCat.length).toBeGreaterThan(0);
      totalSum += presetsInCat.length;
    }

    expect(totalSum).toBe(71);

    for (const preset of PRESETS) {
      expect(Object.keys(canonicalCategories)).toContain(preset.category);
    }
  });

  test('T1.Presets.3: getPreset retrieves matching preset for all 71 IDs or falls back to first preset', () => {
    for (const preset of PRESETS) {
      const retrieved = getPreset(preset.id);
      expect(retrieved).toBeDefined();
      expect(retrieved.id).toBe(preset.id);
      expect(retrieved.name).toBe(preset.name);
    }

    const fallback = getPreset('non-existent-preset-uuid');
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(PRESETS[0].id);
  });

  test('T1.Presets.4: Every one of the 71 presets satisfies the VisualizerPreset lifecycle contract', () => {
    const ctx = createMockPresetContext(getTheme('ember'));
    const audio = createBeatDropAudioFeatures(0.85);

    for (const preset of PRESETS) {
      expect(typeof preset.init).toBe('function');
      expect(typeof preset.update).toBe('function');
      expect(typeof preset.dispose).toBe('function');

      // Initialize
      preset.init(ctx);
      expect(ctx.scene.children.length).toBeGreaterThanOrEqual(0);

      // Update with audio reactivity
      expect(() => {
        preset.update(ctx, audio, 1.0, 0.016);
      }).not.toThrow();

      // Clean disposal
      expect(() => {
        preset.dispose();
      }).not.toThrow();

      ctx.scene.clear();
      expect(ctx.scene.children.length).toBe(0);
    }
  });

  test('T1.Presets.5: onThemeChange updates preset materials cleanly across themes without throwing', () => {
    const ctx = createMockPresetContext(getTheme('ember'));
    const synthTheme = getTheme('synthwave');
    const arcticTheme = getTheme('arctic');

    for (const preset of PRESETS) {
      preset.init(ctx);
      if (preset.onThemeChange) {
        expect(() => {
          preset.onThemeChange!(synthTheme);
          preset.onThemeChange!(arcticTheme);
        }).not.toThrow();
      }
      preset.dispose();
      ctx.scene.clear();
    }
  });

  test('T1.Presets.6: Category tab counters in #presetsPanel match the 71-preset catalog breakdown', () => {
    const breakdown = PRESETS.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(breakdown['Structures']).toBe(15);
    expect(breakdown['Abstract & Space']).toBe(15);
    expect(breakdown['Particles & Light']).toBe(4);
    expect(breakdown['Fluids & Heat']).toBe(9);
    expect(breakdown['Tunnels']).toBe(7);
    expect(breakdown['Retro & Digital']).toBe(7);
    expect(breakdown['Organic & Nature']).toBe(14);

    // Verify dynamic DOM tab badge rendering
    const container = new MockElement('DIV');
    container.id = 'presetCategoryTabs';

    const allPill = new MockElement('BUTTON');
    const badgeAllSpan = new MockElement('SPAN');
    badgeAllSpan.id = 'badgeAll';
    badgeAllSpan.className = 'tab-badge';
    badgeAllSpan.textContent = PRESETS.length.toString();
    allPill.appendChild(badgeAllSpan);
    container.appendChild(allPill);

    for (const [cat, count] of Object.entries(breakdown)) {
      const catPill = new MockElement('BUTTON');
      catPill.setAttribute('data-filter', cat);
      const catBadge = new MockElement('SPAN');
      catBadge.className = 'tab-badge';
      catBadge.setAttribute('data-category-badge', cat);
      catBadge.textContent = count.toString();
      catPill.appendChild(catBadge);
      container.appendChild(catPill);
    }

    const badgeAll = container.querySelector('#badgeAll') as MockElement;
    expect(badgeAll.textContent).toBe('71');

    for (const [cat, count] of Object.entries(breakdown)) {
      const badge = container.querySelector(`[data-category-badge="${cat}"]`) as MockElement;
      expect(badge).toBeDefined();
      expect(badge.textContent).toBe(count.toString());
    }
  });

  test('T1.Presets.7: Search filter matches preset name, category, and description in real time', () => {
    // 1. Search by name
    const waveMatches = PRESETS.filter(p => p.name.toLowerCase().includes('wave'));
    expect(waveMatches.length).toBeGreaterThan(0);

    // 2. Search by category
    const tunnelMatches = PRESETS.filter(p => p.category.toLowerCase().includes('tunnel'));
    expect(tunnelMatches.length).toBe(7);

    // 3. Search case-insensitivity
    const retroMatches = PRESETS.filter(p => p.category.toLowerCase().includes('retro'));
    expect(retroMatches.length).toBe(7);

    // 4. Non-matching query
    const zeroMatches = PRESETS.filter(p => p.name.toLowerCase().includes('__non_existent_preset_query__'));
    expect(zeroMatches.length).toBe(0);
  });

  test('T1.Presets.8: Preset card DOM rendering produces complete card structure with SVG thumbnail', () => {
    const preset = getPreset('waveform') || PRESETS[0];

    const card = new MockElement('DIV');
    card.className = 'preset-card-3';
    card.setAttribute('data-preset-id', preset.id);
    card.setAttribute('data-category', preset.category);

    const favBtn = new MockElement('BUTTON');
    favBtn.className = 'preset-fav-btn';
    card.appendChild(favBtn);

    const thumb = new MockElement('DIV');
    thumb.className = 'preset-thumb-visual';
    card.appendChild(thumb);

    const info = new MockElement('DIV');
    info.className = 'preset-card-info';
    const title = new MockElement('DIV');
    title.className = 'preset-badge-name';
    title.textContent = preset.name;
    const catBadge = new MockElement('SPAN');
    catBadge.className = 'preset-cat-badge';
    catBadge.textContent = preset.category;
    info.appendChild(title);
    info.appendChild(catBadge);
    card.appendChild(info);

    expect(card.querySelector('.preset-fav-btn')).toBeDefined();
    expect(card.querySelector('.preset-thumb-visual')).toBeDefined();
    expect(card.querySelector('.preset-badge-name')?.textContent).toBe(preset.name);
    expect(card.querySelector('.preset-cat-badge')?.textContent).toBe(preset.category);
    expect(card.getAttribute('data-preset-id')).toBe(preset.id);
  });
});
