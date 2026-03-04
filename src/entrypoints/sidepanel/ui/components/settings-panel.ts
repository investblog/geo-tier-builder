import { ALL_COUNTRIES } from '@engine/countries';
import type { Store } from '@engine/store';
import { TIERS } from '@engine/tiers';
import { setThemePreference, type ThemePreference } from '@shared/theme';
import type { CustomTiers, Tier } from '@shared/types';
import { showToast } from './toast';

export function createSettingsPanel(container: HTMLElement, store: Store): { destroy(): void } {
  // Theme setting
  const themeGroup = createGroup('Appearance');

  const themeRow = createRow('Theme');
  const themeSelect = document.createElement('select');
  for (const [value, label] of [
    ['dark', 'Dark'],
    ['light', 'Light'],
    ['auto', 'System'],
  ] as const) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    themeSelect.appendChild(opt);
  }
  themeSelect.addEventListener('change', () => {
    setThemePreference(themeSelect.value as ThemePreference);
  });
  themeRow.appendChild(themeSelect);
  themeGroup.appendChild(themeRow);

  // Default mode
  const defaultsGroup = createGroup('Defaults');

  const modeRow = createRow('Default mode');
  const modeSelect = document.createElement('select');
  for (const [value, label] of [
    ['allow', 'Allowlist'],
    ['block', 'Blocklist'],
  ] as const) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    modeSelect.appendChild(opt);
  }
  modeSelect.addEventListener('change', () => {
    store.setMode(modeSelect.value as 'allow' | 'block');
  });
  modeRow.appendChild(modeSelect);
  defaultsGroup.appendChild(modeRow);

  // Custom tiers
  const tiersGroup = createGroup('Custom tier overrides');

  const tiersDesc = document.createElement('p');
  tiersDesc.style.cssText = 'font-size:var(--fs-xs);color:var(--text-subtle);margin-bottom:var(--space-2)';
  tiersDesc.textContent = 'Override default tier assignments for specific countries';
  tiersGroup.appendChild(tiersDesc);

  const tiersContainer = document.createElement('div');
  tiersGroup.appendChild(tiersContainer);

  // Add override button
  const addOverrideRow = document.createElement('div');
  addOverrideRow.style.cssText = 'display:flex;gap:var(--space-2);align-items:center;margin-top:var(--space-2)';

  const countryInput = document.createElement('input');
  countryInput.type = 'text';
  countryInput.placeholder = 'ISO2 code (e.g. RU)';
  countryInput.className = 'search__input';
  countryInput.style.cssText = 'width:100px;padding-left:var(--control-pad-x)';

  const tierSelect = document.createElement('select');
  for (const tier of TIERS) {
    const opt = document.createElement('option');
    opt.value = tier;
    opt.textContent = tier;
    tierSelect.appendChild(opt);
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'btn btn--sm btn--primary';
  addBtn.textContent = 'Add';
  addBtn.addEventListener('click', () => {
    const code = countryInput.value.trim().toUpperCase();
    if (!code || code.length !== 2) {
      showToast('Enter a valid 2-letter ISO code');
      return;
    }
    const tier = tierSelect.value as Tier;
    store.setCustomTiers({ ...store.current.customTiers, [code]: tier });
    countryInput.value = '';
    renderTiersTable();
  });

  addOverrideRow.append(countryInput, tierSelect, addBtn);

  // Reset button
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn btn--sm';
  resetBtn.textContent = 'Reset to defaults';
  resetBtn.style.marginTop = 'var(--space-2)';
  resetBtn.addEventListener('click', () => {
    store.setCustomTiers({});
    showToast('Tier overrides reset');
    renderTiersTable();
  });

  function renderTiersTable(): void {
    tiersContainer.innerHTML = '';
    const customs = store.current.customTiers;
    const entries = Object.entries(customs);

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-size:var(--fs-xs);color:var(--text-subtle);padding:var(--space-2) 0';
      empty.textContent = 'No custom overrides';
      tiersContainer.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'tiers-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>Country</th><th>Default</th><th>Custom</th><th></th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (const [iso2, tier] of entries.sort((a, b) => a[0].localeCompare(b[0]))) {
      const country = ALL_COUNTRIES.find((c) => c.iso2 === iso2);
      const tr = document.createElement('tr');

      const tdCountry = document.createElement('td');
      tdCountry.textContent = country ? `${iso2} — ${country.name_en}` : iso2;

      const tdDefault = document.createElement('td');
      tdDefault.textContent = country?.tier ?? '—';

      const tdCustom = document.createElement('td');
      const select = document.createElement('select');
      for (const t of TIERS) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        if (t === tier) opt.selected = true;
        select.appendChild(opt);
      }
      select.addEventListener('change', () => {
        store.setCustomTiers({ ...store.current.customTiers, [iso2]: select.value as Tier });
      });
      tdCustom.appendChild(select);

      const tdRemove = document.createElement('td');
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn--sm';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        const updated: CustomTiers = { ...store.current.customTiers };
        delete updated[iso2];
        store.setCustomTiers(updated);
        renderTiersTable();
      });
      tdRemove.appendChild(removeBtn);

      tr.append(tdCountry, tdDefault, tdCustom, tdRemove);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    tiersContainer.appendChild(table);
  }

  tiersGroup.append(addOverrideRow, resetBtn);
  container.append(themeGroup, defaultsGroup, tiersGroup);

  renderTiersTable();

  return {
    destroy() {
      container.innerHTML = '';
    },
  };
}

function createGroup(title: string): HTMLElement {
  const group = document.createElement('div');
  group.className = 'settings-group';
  const h = document.createElement('h3');
  h.className = 'settings-group__title';
  h.textContent = title;
  group.appendChild(h);
  return group;
}

function createRow(label: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'settings-row';
  const lbl = document.createElement('span');
  lbl.className = 'settings-row__label';
  lbl.textContent = label;
  row.appendChild(lbl);
  return row;
}
