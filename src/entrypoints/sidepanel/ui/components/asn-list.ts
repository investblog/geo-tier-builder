import {
  ASN_CATEGORIES,
  ASN_CATEGORY_LABELS,
  filterByCategory,
  getEffectiveNetworks,
  searchNetworks,
} from '@engine/asn';
import { toggle } from '@engine/selection';
import type { Store } from '@engine/store';
import type { AdNetwork, AsnCategory } from '@shared/types';
import builtinAdNetworks from '@/data/ad-networks.v1.json' with { type: 'json' };
import type { AsnToolbarState } from './asn-toolbar';

interface CategoryGroup {
  category: AsnCategory;
  networks: AdNetwork[];
}

function applyFilters(networks: AdNetwork[], filters: AsnToolbarState): AdNetwork[] {
  let list = networks;
  if (filters.activeCategories.size > 0) {
    list = list.filter((n) => filters.activeCategories.has(n.category));
  }
  if (filters.search) {
    list = searchNetworks(list, filters.search);
  }
  return list;
}

function groupByCategory(networks: AdNetwork[]): CategoryGroup[] {
  return ASN_CATEGORIES.map((c) => ({ category: c, networks: filterByCategory(networks, c) })).filter(
    (g) => g.networks.length > 0,
  );
}

export function createAsnList(
  container: HTMLElement,
  store: Store,
  bulkBar: HTMLElement,
): { update(filters: AsnToolbarState): void; destroy(): void } {
  const collapsedCategories = new Set<AsnCategory>();
  let currentFilters: AsnToolbarState = {
    search: '',
    activeCategories: new Set(),
  };
  let filteredAsns: string[] = [];

  function getActiveList(): string[] {
    return store.getActiveAsnList();
  }

  function getNetworks(): AdNetwork[] {
    return getEffectiveNetworks(builtinAdNetworks as AdNetwork[], store.current.customAdNetworks);
  }

  function render(): void {
    const networks = getNetworks();
    const filtered = applyFilters(networks, currentFilters);
    filteredAsns = filtered.map((n) => String(n.asn));
    const groups = groupByCategory(filtered);
    const activeList = getActiveList();
    const activeSet = new Set(activeList);

    container.replaceChildren();

    if (groups.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No ad networks match the current filters';
      container.appendChild(empty);
      updateBulkBar(activeSet.size);
      return;
    }

    for (const group of groups) {
      const section = document.createElement('div');
      section.className = 'region-group';

      const header = document.createElement('div');
      header.className = 'region-header';
      if (collapsedCategories.has(group.category)) header.classList.add('region-header--collapsed');

      const groupAsns = group.networks.map((n) => String(n.asn));
      const selectedInGroup = group.networks.filter((n) => activeSet.has(String(n.asn))).length;
      const allSelected = selectedInGroup === group.networks.length;
      const someSelected = selectedInGroup > 0 && !allSelected;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'region-header__checkbox';
      checkbox.checked = allSelected;
      checkbox.setAttribute('aria-label', `Select all ${ASN_CATEGORY_LABELS[group.category]}`);
      checkbox.tabIndex = -1;
      if (someSelected) checkbox.indeterminate = true;

      const nameSpan = document.createElement('span');
      nameSpan.className = 'region-header__name';
      nameSpan.textContent = ASN_CATEGORY_LABELS[group.category];

      const countSpan = document.createElement('span');
      countSpan.className = 'region-header__count';
      countSpan.textContent = String(group.networks.length);

      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.setAttribute('class', 'region-header__chevron');
      chevron.setAttribute('viewBox', '0 0 12 12');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('stroke', 'currentColor');
      chevron.setAttribute('stroke-width', '1.5');
      const chevronPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      chevronPath.setAttribute('d', 'M3 4.5l3 3 3-3');
      chevron.appendChild(chevronPath);

      header.append(checkbox, nameSpan, countSpan);
      if (selectedInGroup > 0) {
        const selSpan = document.createElement('span');
        selSpan.className = 'region-header__selected';
        selSpan.textContent = `${selectedInGroup} sel`;
        header.appendChild(selSpan);
      }
      header.appendChild(chevron);

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        const current = new Set(getActiveList());
        if (allSelected) {
          for (const asn of groupAsns) current.delete(asn);
        } else {
          for (const asn of groupAsns) current.add(asn);
        }
        store.setActiveAsnList([...current]);
      });

      header.addEventListener('click', () => {
        if (collapsedCategories.has(group.category)) {
          collapsedCategories.delete(group.category);
        } else {
          collapsedCategories.add(group.category);
        }
        render();
      });

      section.appendChild(header);

      if (!collapsedCategories.has(group.category)) {
        for (const net of group.networks) {
          const asnStr = String(net.asn);
          const isSelected = activeSet.has(asnStr);

          const row = document.createElement('div');
          row.className = 'asn-row';
          row.setAttribute('role', 'listitem');
          row.tabIndex = 0;
          if (isSelected) row.classList.add('asn-row--selected');

          const rowCheckbox = document.createElement('input');
          rowCheckbox.type = 'checkbox';
          rowCheckbox.className = 'country-row__checkbox';
          rowCheckbox.checked = isSelected;
          rowCheckbox.setAttribute('aria-label', `${net.name} (AS${net.asn})`);
          rowCheckbox.tabIndex = -1;

          const main = document.createElement('div');
          main.className = 'asn-row__main';

          const firstLine = document.createElement('div');
          firstLine.className = 'asn-row__line';
          const asnSpan = document.createElement('span');
          asnSpan.className = 'asn-row__asn';
          asnSpan.textContent = `AS${net.asn}`;
          const nameSpanRow = document.createElement('span');
          nameSpanRow.className = 'asn-row__name';
          nameSpanRow.textContent = net.name;
          firstLine.append(asnSpan, nameSpanRow);

          main.appendChild(firstLine);

          if (net.platforms.length > 0) {
            const platforms = document.createElement('div');
            platforms.className = 'asn-row__platforms';
            for (const p of net.platforms.slice(0, 4)) {
              const tag = document.createElement('span');
              tag.className = 'asn-row__platform';
              tag.textContent = p;
              platforms.appendChild(tag);
            }
            if (net.platforms.length > 4) {
              const more = document.createElement('span');
              more.className = 'asn-row__platform asn-row__platform--more';
              more.textContent = `+${net.platforms.length - 4}`;
              platforms.appendChild(more);
            }
            main.appendChild(platforms);
          }

          if (net.notes) {
            const notes = document.createElement('div');
            notes.className = 'asn-row__notes';
            notes.textContent = net.notes;
            main.appendChild(notes);
          }

          row.append(rowCheckbox, main);

          row.addEventListener('click', () => {
            store.setActiveAsnList(toggle(getActiveList(), asnStr));
          });

          row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              store.setActiveAsnList(toggle(getActiveList(), asnStr));
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              const next = row.nextElementSibling as HTMLElement | null;
              next?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const prev = row.previousElementSibling as HTMLElement | null;
              if (prev?.classList.contains('asn-row')) prev.focus();
            }
          });

          section.appendChild(row);
        }
      }

      container.appendChild(section);
    }

    updateBulkBar(activeSet.size);
  }

  function updateBulkBar(selectedCount: number): void {
    if (selectedCount === 0) {
      bulkBar.style.display = 'none';
      return;
    }
    bulkBar.style.display = 'flex';
    bulkBar.replaceChildren();

    const count = document.createElement('span');
    count.className = 'bulk-bar__count';
    count.textContent = `${selectedCount} ASN selected`;

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn--sm';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => store.setActiveAsnList([]));

    const invertBtn = document.createElement('button');
    invertBtn.className = 'btn btn--sm';
    invertBtn.textContent = 'Invert';
    invertBtn.addEventListener('click', () => {
      const current = new Set(getActiveList());
      const inverted = filteredAsns.filter((a) => !current.has(a));
      const outside = getActiveList().filter((a) => !filteredAsns.includes(a));
      store.setActiveAsnList([...outside, ...inverted]);
    });

    const selectFilteredBtn = document.createElement('button');
    selectFilteredBtn.className = 'btn btn--sm';
    selectFilteredBtn.textContent = 'Select filtered';
    selectFilteredBtn.addEventListener('click', () => {
      const set = new Set(getActiveList());
      for (const a of filteredAsns) set.add(a);
      store.setActiveAsnList([...set]);
    });

    bulkBar.append(count, clearBtn, invertBtn, selectFilteredBtn);
  }

  const unsub = store.subscribe(render);

  return {
    update(filters: AsnToolbarState) {
      currentFilters = filters;
      render();
    },
    destroy() {
      unsub();
      container.replaceChildren();
    },
  };
}
