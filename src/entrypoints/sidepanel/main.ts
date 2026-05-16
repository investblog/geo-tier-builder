import { Store } from '@engine/store';
import { initTheme, toggleTheme } from '@shared/theme';
import { createCountryList } from './ui/components/country-list';
import { createImportPanel } from './ui/components/import-panel';
import { createOutputPanel } from './ui/components/output-panel';
import { createPresetsPanel } from './ui/components/presets-panel';
import { createRegexPanel } from './ui/components/regex-panel';
import { createSettingsPanel } from './ui/components/settings-panel';
import { createToolbar } from './ui/components/toolbar';

// Init theme + toggle (sync, no store dependency)
initTheme();
document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);

// Tab navigation (sync, no store dependency)
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

// Init store (async — everything below depends on store data)
const store = new Store();

async function init(): Promise<void> {
  await store.init();

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

  // TDS regex helper tab
  const regexPanelEl = document.getElementById('regex-panel')!;
  createRegexPanel(regexPanelEl);

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
