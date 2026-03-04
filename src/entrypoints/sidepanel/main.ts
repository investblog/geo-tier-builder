import { Store } from '@engine/store';
import { initTheme, toggleTheme } from '@shared/theme';
import { browser } from 'wxt/browser';
import { createCountryList } from './ui/components/country-list';
import { createImportPanel } from './ui/components/import-panel';
import { createOutputPanel } from './ui/components/output-panel';
import { createPresetsPanel } from './ui/components/presets-panel';
import { createSettingsPanel } from './ui/components/settings-panel';
import { createToolbar } from './ui/components/toolbar';

// Init theme
initTheme();

// Init store
const store = new Store();

async function loadFlagsSprite(): Promise<void> {
  const url = browser.runtime.getURL('/flags-sprite.svg');
  const resp = await fetch(url);
  const text = await resp.text();
  const container = document.getElementById('flags-sprite');
  if (container) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'image/svg+xml');
    const svg = doc.documentElement;
    // Move all symbols into our container
    while (svg.firstChild) {
      container.appendChild(document.importNode(svg.firstChild, true));
    }
  }
}

async function init(): Promise<void> {
  await Promise.all([store.init(), loadFlagsSprite()]);

  // Tab navigation
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tabs__btn');
  const panels = document.querySelectorAll<HTMLElement>('.panel');

  function activateTab(tab: HTMLButtonElement): void {
    const target = tab.dataset.tab;
    for (const t of tabs) {
      const isActive = t === tab;
      t.classList.toggle('tabs__btn--active', isActive);
      t.setAttribute('aria-selected', String(isActive));
      t.tabIndex = isActive ? 0 : -1;
    }
    for (const p of panels) p.classList.toggle('panel--active', p.id === `panel-${target}`);
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', (e) => {
      const tabArr = [...tabs];
      const idx = tabArr.indexOf(tab);
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = tabArr[(idx + 1) % tabArr.length];
        next.focus();
        activateTab(next);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = tabArr[(idx - 1 + tabArr.length) % tabArr.length];
        prev.focus();
        activateTab(prev);
      }
    });
  }

  // Theme toggle
  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);

  // Toolbar
  const toolbarEl = document.getElementById('toolbar')!;
  const bulkBarEl = document.getElementById('bulk-bar')!;
  const countryListEl = document.getElementById('country-list')!;

  const countryList = createCountryList(countryListEl, store, bulkBarEl);

  createToolbar(toolbarEl, store, (filters) => {
    countryList.update(filters);
  });

  // Output panel
  const outputPanelEl = document.getElementById('output-panel')!;
  createOutputPanel(outputPanelEl, store);

  // Import panel
  const importPanelEl = document.getElementById('import-panel')!;
  createImportPanel(importPanelEl, store);

  // Presets panel
  const presetsPanelEl = document.getElementById('presets-panel')!;
  createPresetsPanel(presetsPanelEl, store);

  // Settings panel
  const settingsPanelEl = document.getElementById('settings-panel')!;
  createSettingsPanel(settingsPanelEl, store);

  // Initial render
  countryList.update({
    search: '',
    activeRegions: new Set(),
    activeTiers: new Set(),
    activeTags: new Set(),
    showFavorites: false,
  });
}

init().catch(console.error);
