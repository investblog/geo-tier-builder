import { META_GROUPS, REGIONS } from '@engine/regions';
import type { Store } from '@engine/store';
import { TIERS } from '@engine/tiers';
import type { MetaGroup, Region, Tier } from '@shared/types';

export interface ToolbarState {
  search: string;
  activeRegions: Set<Region>;
  activeTiers: Set<Tier>;
  activeTags: Set<MetaGroup>;
  showFavorites: boolean;
}

export type ToolbarChangeHandler = (state: ToolbarState) => void;

const REGION_LABELS: Record<Region, string> = {
  EUR: 'EUR',
  CIS: 'CIS',
  NA: 'NA',
  LATAM: 'LATAM',
  APAC: 'APAC',
  MENA: 'MENA',
  AFR: 'AFR',
  OCE: 'OCE',
};

const TAG_LABELS: Record<MetaGroup, string> = {
  EU: 'EU',
  EEA: 'EEA',
  G7: 'G7',
  G20: 'G20',
  BRICS: 'BRICS',
  FIVE_EYES: '5 Eyes',
};

export function createToolbar(
  container: HTMLElement,
  store: Store,
  onChange: ToolbarChangeHandler,
): { getState(): ToolbarState; destroy(): void } {
  const state: ToolbarState = {
    search: '',
    activeRegions: new Set(),
    activeTiers: new Set(),
    activeTags: new Set(),
    showFavorites: false,
  };

  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  function emit(): void {
    onChange({
      ...state,
      activeRegions: new Set(state.activeRegions),
      activeTiers: new Set(state.activeTiers),
      activeTags: new Set(state.activeTags),
    });
  }

  // Build DOM
  // Row 1: search + mode toggle
  const row1 = document.createElement('div');
  row1.className = 'toolbar__row';

  // Search
  const searchWrap = document.createElement('div');
  searchWrap.className = 'search';

  const searchIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  searchIcon.setAttribute('class', 'search__icon');
  searchIcon.setAttribute('viewBox', '0 0 16 16');
  searchIcon.setAttribute('fill', 'none');
  searchIcon.setAttribute('stroke', 'currentColor');
  searchIcon.setAttribute('stroke-width', '1.5');
  const searchPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  searchPath.setAttribute('d', 'M6.5 11a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM14.5 14.5l-4-4');
  searchIcon.appendChild(searchPath);

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'search__input';
  searchInput.placeholder = 'Search countries…';

  const searchKbd = document.createElement('kbd');
  searchKbd.className = 'search__kbd';
  searchKbd.textContent = 'Ctrl+K';

  searchWrap.append(searchIcon, searchInput, searchKbd);

  searchInput.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      emit();
    }, 150);
  });

  // Mode toggle
  const modeToggle = document.createElement('div');
  modeToggle.className = 'mode-toggle';

  const btnAllow = document.createElement('button');
  btnAllow.className = 'mode-toggle__btn mode-toggle__btn--active';
  btnAllow.textContent = 'Allow';

  const btnBlock = document.createElement('button');
  btnBlock.className = 'mode-toggle__btn';
  btnBlock.textContent = 'Block';

  function updateModeUI(): void {
    const isAllow = store.current.mode === 'allow';
    btnAllow.classList.toggle('mode-toggle__btn--active', isAllow);
    btnBlock.classList.toggle('mode-toggle__btn--active', !isAllow);
  }

  btnAllow.addEventListener('click', () => {
    store.setMode('allow');
    updateModeUI();
  });

  btnBlock.addEventListener('click', () => {
    store.setMode('block');
    updateModeUI();
  });

  modeToggle.append(btnAllow, btnBlock);
  row1.append(searchWrap, modeToggle);

  // Row 2: filter chips (regions)
  const row2 = document.createElement('div');
  row2.className = 'toolbar__row';

  const regionChips = document.createElement('div');
  regionChips.className = 'chips';

  for (const region of REGIONS) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = REGION_LABELS[region];
    chip.addEventListener('click', () => {
      if (state.activeRegions.has(region)) {
        state.activeRegions.delete(region);
      } else {
        state.activeRegions.add(region);
      }
      chip.classList.toggle('chip--active', state.activeRegions.has(region));
      emit();
    });
    regionChips.appendChild(chip);
  }

  row2.appendChild(regionChips);

  // Row 3: tier + meta-group + favorites chips
  const row3 = document.createElement('div');
  row3.className = 'toolbar__row';

  const filterChips = document.createElement('div');
  filterChips.className = 'chips';

  // Tier chips
  for (const tier of TIERS) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = tier;
    chip.addEventListener('click', () => {
      if (state.activeTiers.has(tier)) {
        state.activeTiers.delete(tier);
      } else {
        state.activeTiers.add(tier);
      }
      chip.classList.toggle('chip--active', state.activeTiers.has(tier));
      emit();
    });
    filterChips.appendChild(chip);
  }

  // Separator
  const sep = document.createElement('span');
  sep.style.cssText = 'width:1px;height:16px;background:var(--border-default);margin:0 2px;flex-shrink:0';
  filterChips.appendChild(sep);

  // Meta-group chips
  for (const tag of META_GROUPS) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = TAG_LABELS[tag];
    chip.addEventListener('click', () => {
      if (state.activeTags.has(tag)) {
        state.activeTags.delete(tag);
      } else {
        state.activeTags.add(tag);
      }
      chip.classList.toggle('chip--active', state.activeTags.has(tag));
      emit();
    });
    filterChips.appendChild(chip);
  }

  // Separator
  const sep2 = document.createElement('span');
  sep2.style.cssText = 'width:1px;height:16px;background:var(--border-default);margin:0 2px;flex-shrink:0';
  filterChips.appendChild(sep2);

  // Favorites chip
  const favChip = document.createElement('button');
  favChip.className = 'chip';
  favChip.textContent = '★ Fav';
  favChip.addEventListener('click', () => {
    state.showFavorites = !state.showFavorites;
    favChip.classList.toggle('chip--active', state.showFavorites);
    emit();
  });
  filterChips.appendChild(favChip);

  row3.appendChild(filterChips);

  container.append(row1, row2, row3);

  // Subscribe to store for mode changes
  const unsub = store.subscribe(updateModeUI);

  // Keyboard shortcut
  function onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      state.search = '';
      searchInput.blur();
      emit();
    }
  }

  document.addEventListener('keydown', onKeydown);

  return {
    getState: () => state,
    destroy() {
      unsub();
      document.removeEventListener('keydown', onKeydown);
      container.innerHTML = '';
    },
  };
}
