import { ALL_COUNTRIES, BY_TAG } from '@engine/countries';
import { REGIONS } from '@engine/regions';
import { toggle, toggleFavorite } from '@engine/selection';
import type { Store } from '@engine/store';
import { getResolvedTier } from '@engine/tiers';
import { createFlagIcon } from '@shared/dom';
import type { Country, Region } from '@shared/types';
import type { ToolbarState } from './toolbar';

const REGION_LABELS: Record<Region, string> = {
  EUR: 'Europe',
  CIS: 'CIS',
  NA: 'North America',
  LATAM: 'Latin America',
  APAC: 'Asia-Pacific',
  MENA: 'Middle East & N. Africa',
  AFR: 'Africa',
  OCE: 'Oceania',
};

interface RegionGroup {
  region: Region;
  countries: Country[];
}

function filterCountries(filters: ToolbarState, store: Store): Country[] {
  let list = [...ALL_COUNTRIES];

  // Search filter
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.iso2.toLowerCase().includes(q) ||
        c.iso3.toLowerCase().includes(q) ||
        c.name_en.toLowerCase().includes(q) ||
        c.name_ru.toLowerCase().includes(q) ||
        c.aliases.some((a) => a.toLowerCase().includes(q)),
    );
  }

  // Region filter
  if (filters.activeRegions.size > 0) {
    list = list.filter((c) => filters.activeRegions.has(c.region));
  }

  // Tier filter
  if (filters.activeTiers.size > 0) {
    list = list.filter((c) => filters.activeTiers.has(getResolvedTier(c, store.current.customTiers)));
  }

  // Tag filter
  if (filters.activeTags.size > 0) {
    const tagCodes = new Set<string>();
    for (const tag of filters.activeTags) {
      const members = BY_TAG.get(tag);
      if (members) {
        for (const m of members) tagCodes.add(m.iso2);
      }
    }
    list = list.filter((c) => tagCodes.has(c.iso2));
  }

  // Favorites filter
  if (filters.showFavorites) {
    const favSet = new Set(store.current.favorites);
    list = list.filter((c) => favSet.has(c.iso2));
  }

  return list;
}

function groupByRegion(countries: Country[]): RegionGroup[] {
  const map = new Map<Region, Country[]>();
  for (const c of countries) {
    let list = map.get(c.region);
    if (!list) {
      list = [];
      map.set(c.region, list);
    }
    list.push(c);
  }

  // Maintain region order
  return REGIONS.filter((r) => map.has(r)).map((r) => ({ region: r, countries: map.get(r)! }));
}

export function createCountryList(
  container: HTMLElement,
  store: Store,
  bulkBar: HTMLElement,
): { update(filters: ToolbarState): void; destroy(): void } {
  const collapsedRegions = new Set<Region>();
  let currentFilters: ToolbarState = {
    search: '',
    activeRegions: new Set(),
    activeTiers: new Set(),
    activeTags: new Set(),
    showFavorites: false,
  };
  let filteredCodes: string[] = [];

  function getActiveList(): string[] {
    return store.getActiveList();
  }

  function render(): void {
    const filtered = filterCountries(currentFilters, store);
    filteredCodes = filtered.map((c) => c.iso2);
    const groups = groupByRegion(filtered);
    const activeList = getActiveList();
    const activeSet = new Set(activeList);
    const favSet = new Set(store.current.favorites);

    container.innerHTML = '';

    if (groups.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No countries match the current filters';
      container.appendChild(empty);
      updateBulkBar(activeSet.size);
      return;
    }

    for (const group of groups) {
      const section = document.createElement('div');
      section.className = 'region-group';

      // Region header
      const header = document.createElement('div');
      header.className = 'region-header';
      if (collapsedRegions.has(group.region)) header.classList.add('region-header--collapsed');

      const selectedInRegion = group.countries.filter((c) => activeSet.has(c.iso2)).length;

      header.innerHTML = `
        <span class="region-header__name">${REGION_LABELS[group.region]}</span>
        <span class="region-header__count">${group.countries.length}</span>
        ${selectedInRegion > 0 ? `<span class="region-header__selected">${selectedInRegion} sel</span>` : ''}
        <svg class="region-header__chevron" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 4.5l3 3 3-3"/></svg>
      `;

      header.addEventListener('click', () => {
        if (collapsedRegions.has(group.region)) {
          collapsedRegions.delete(group.region);
        } else {
          collapsedRegions.add(group.region);
        }
        render();
      });

      section.appendChild(header);

      // Country rows (skip if collapsed)
      if (!collapsedRegions.has(group.region)) {
        for (const country of group.countries) {
          const isSelected = activeSet.has(country.iso2);
          const isFav = favSet.has(country.iso2);
          const tier = getResolvedTier(country, store.current.customTiers);

          const row = document.createElement('div');
          row.className = 'country-row';
          row.setAttribute('role', 'listitem');
          row.tabIndex = 0;
          if (isSelected) row.classList.add('country-row--selected');

          row.innerHTML = `
            <input type="checkbox" class="country-row__checkbox" ${isSelected ? 'checked' : ''} aria-label="${country.name_en}" tabindex="-1">
            <span class="country-row__iso">${country.iso2}</span>
            <span class="country-row__name">${country.name_en}</span>
            <span class="country-row__tier country-row__tier--${tier}">${tier}</span>
            <span class="country-row__star ${isFav ? 'country-row__star--active' : ''}" role="button" aria-label="Toggle favorite" tabindex="-1">★</span>
          `;
          row.insertBefore(createFlagIcon(country.iso2), row.children[1]);

          // Click row to toggle selection
          row.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('country-row__star')) {
              store.setFavorites(toggleFavorite(store.current.favorites, country.iso2));
              render();
              return;
            }
            store.setActiveList(toggle(getActiveList(), country.iso2));
            render();
          });

          // Keyboard: Enter/Space to toggle, arrows to navigate
          row.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              store.setActiveList(toggle(getActiveList(), country.iso2));
              render();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              const next = row.nextElementSibling as HTMLElement | null;
              next?.focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              const prev = row.previousElementSibling as HTMLElement | null;
              if (prev?.classList.contains('country-row')) prev.focus();
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
    bulkBar.innerHTML = '';

    const count = document.createElement('span');
    count.className = 'bulk-bar__count';
    count.textContent = `${selectedCount} selected`;

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn--sm';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => {
      store.setActiveList([]);
      render();
    });

    const invertBtn = document.createElement('button');
    invertBtn.className = 'btn btn--sm';
    invertBtn.textContent = 'Invert';
    invertBtn.addEventListener('click', () => {
      const current = new Set(getActiveList());
      const inverted = filteredCodes.filter((c) => !current.has(c));
      const outside = getActiveList().filter((c) => !filteredCodes.includes(c));
      store.setActiveList([...outside, ...inverted]);
      render();
    });

    const selectFilteredBtn = document.createElement('button');
    selectFilteredBtn.className = 'btn btn--sm';
    selectFilteredBtn.textContent = 'Select filtered';
    selectFilteredBtn.addEventListener('click', () => {
      const set = new Set(getActiveList());
      for (const code of filteredCodes) set.add(code);
      store.setActiveList([...set]);
      render();
    });

    bulkBar.append(count, clearBtn, invertBtn, selectFilteredBtn);
  }

  // Subscribe to store changes for external updates
  const unsub = store.subscribe(render);

  return {
    update(filters: ToolbarState) {
      currentFilters = filters;
      render();
    },
    destroy() {
      unsub();
      container.innerHTML = '';
    },
  };
}
