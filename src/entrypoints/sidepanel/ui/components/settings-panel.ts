import { ASN_CATEGORIES, ASN_CATEGORY_LABELS, findByAsn } from '@engine/asn';
import { ALL_COUNTRIES } from '@engine/countries';
import type { Store } from '@engine/store';
import { TIERS } from '@engine/tiers';
import { setThemePreference, type ThemePreference } from '@shared/theme';
import type { AdNetwork, AsnCategory, CustomTiers, Tier } from '@shared/types';
import builtinAdNetworks from '@/data/ad-networks.v1.json' with { type: 'json' };
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
    tiersContainer.replaceChildren();
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
    const headRow = document.createElement('tr');
    for (const label of ['Country', 'Default', 'Custom', '']) {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
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

  // ASN overrides
  const asnGroup = createGroup('Custom ad-network overrides');

  const asnDesc = document.createElement('p');
  asnDesc.style.cssText = 'font-size:var(--fs-xs);color:var(--text-subtle);margin-bottom:var(--space-2)';
  asnDesc.textContent =
    'Add custom ASN entries or override builtin ones (override by matching ASN; disable to hide a builtin)';
  asnGroup.appendChild(asnDesc);

  const asnContainer = document.createElement('div');
  asnContainer.className = 'asn-overrides';

  const asnFormWrap = document.createElement('div');
  asnFormWrap.className = 'asn-overrides__form';

  const asnInput = document.createElement('input');
  asnInput.type = 'text';
  asnInput.placeholder = 'ASN (e.g. 32934)';
  asnInput.className = 'search__input';

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Network name';
  nameInput.className = 'search__input';

  const catSelectAsn = document.createElement('select');
  for (const c of ASN_CATEGORIES) {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = ASN_CATEGORY_LABELS[c];
    catSelectAsn.appendChild(opt);
  }

  asnFormWrap.append(asnInput, nameInput, catSelectAsn);

  const asnFormRow2 = document.createElement('div');
  asnFormRow2.className = 'asn-overrides__form-row';

  const platformsInput = document.createElement('input');
  platformsInput.type = 'text';
  platformsInput.placeholder = 'Platforms (comma-separated, optional)';
  platformsInput.className = 'search__input';

  const asnAddBtn = document.createElement('button');
  asnAddBtn.className = 'btn btn--sm btn--primary';
  asnAddBtn.textContent = 'Add';

  asnAddBtn.addEventListener('click', () => {
    const asnNum = Number(asnInput.value.trim());
    if (!Number.isInteger(asnNum) || asnNum <= 0) {
      showToast('Enter a valid ASN number');
      return;
    }
    const name = nameInput.value.trim();
    if (!name) {
      showToast('Enter a network name');
      return;
    }
    const platforms = platformsInput.value
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .filter(Boolean);
    const newEntry: AdNetwork = {
      asn: asnNum,
      name,
      category: catSelectAsn.value as AsnCategory,
      platforms,
      notes: '',
    };
    const filtered = store.current.customAdNetworks.filter((n) => n.asn !== asnNum);
    store.setCustomAdNetworks([...filtered, newEntry]);
    asnInput.value = '';
    nameInput.value = '';
    platformsInput.value = '';
    renderAsnList();
    showToast(findByAsn(builtinAdNetworks as AdNetwork[], asnNum) ? 'Override added' : 'New ASN added');
  });

  asnFormRow2.append(platformsInput, asnAddBtn);

  const asnListEl = document.createElement('div');
  asnListEl.className = 'asn-overrides__list';

  const asnResetBtn = document.createElement('button');
  asnResetBtn.className = 'btn btn--sm';
  asnResetBtn.textContent = 'Reset all overrides';
  asnResetBtn.style.marginTop = 'var(--space-2)';
  asnResetBtn.addEventListener('click', () => {
    if (store.current.customAdNetworks.length === 0) return;
    store.setCustomAdNetworks([]);
    showToast('ASN overrides reset');
    renderAsnList();
  });

  function renderAsnList(): void {
    asnListEl.replaceChildren();
    const overrides = store.current.customAdNetworks;
    if (overrides.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'font-size:var(--fs-xs);color:var(--text-subtle);padding:var(--space-2) 0';
      empty.textContent = 'No custom overrides';
      asnListEl.appendChild(empty);
      return;
    }

    const sorted = [...overrides].sort((a, b) => a.asn - b.asn);
    for (const item of sorted) {
      const isBuiltinOverride = !!findByAsn(builtinAdNetworks as AdNetwork[], item.asn);
      const row = document.createElement('div');
      row.className = 'asn-override-item';
      if (item.disabled) row.classList.add('asn-override-item--disabled');

      const main = document.createElement('div');
      main.className = 'asn-override-item__main';

      const titleLine = document.createElement('div');
      titleLine.className = 'asn-override-item__title';
      const asnLabel = document.createElement('span');
      asnLabel.className = 'asn-override-item__asn';
      asnLabel.textContent = `AS${item.asn}`;
      const nameLabel = document.createElement('span');
      nameLabel.className = 'asn-override-item__name';
      nameLabel.textContent = item.name;
      titleLine.append(asnLabel, nameLabel);

      const meta = document.createElement('div');
      meta.className = 'asn-override-item__meta';
      const parts: string[] = [ASN_CATEGORY_LABELS[item.category]];
      if (isBuiltinOverride) parts.push('overrides builtin');
      if (item.disabled) parts.push('disabled');
      if (item.platforms.length > 0) parts.push(item.platforms.join(', '));
      meta.textContent = parts.join(' · ');

      main.append(titleLine, meta);

      const actions = document.createElement('div');
      actions.className = 'asn-override-item__actions';

      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn btn--sm';
      toggleBtn.textContent = item.disabled ? 'Enable' : 'Disable';
      toggleBtn.addEventListener('click', () => {
        const updated = store.current.customAdNetworks.map((n) =>
          n.asn === item.asn ? { ...n, disabled: !n.disabled } : n,
        );
        store.setCustomAdNetworks(updated);
        renderAsnList();
      });

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn btn--sm';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove override';
      removeBtn.addEventListener('click', () => {
        store.setCustomAdNetworks(store.current.customAdNetworks.filter((n) => n.asn !== item.asn));
        renderAsnList();
      });

      actions.append(toggleBtn, removeBtn);
      row.append(main, actions);
      asnListEl.appendChild(row);
    }
  }

  asnContainer.append(asnFormWrap, asnFormRow2, asnListEl);
  asnGroup.append(asnContainer, asnResetBtn);

  container.append(themeGroup, defaultsGroup, tiersGroup, asnGroup);

  renderTiersTable();
  renderAsnList();

  return {
    destroy() {
      container.replaceChildren();
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
