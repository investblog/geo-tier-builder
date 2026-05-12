import { ASN_CATEGORIES, ASN_CATEGORY_LABELS } from '@engine/asn';
import type { Store } from '@engine/store';
import type { AsnCategory } from '@shared/types';

export interface AsnToolbarState {
  search: string;
  activeCategories: Set<AsnCategory>;
}

export type AsnToolbarChangeHandler = (state: AsnToolbarState) => void;

export function createAsnToolbar(
  container: HTMLElement,
  store: Store,
  onChange: AsnToolbarChangeHandler,
): { getState(): AsnToolbarState; destroy(): void } {
  const state: AsnToolbarState = {
    search: '',
    activeCategories: new Set(),
  };

  let searchTimer: ReturnType<typeof setTimeout> | null = null;

  function emit(): void {
    onChange({ ...state, activeCategories: new Set(state.activeCategories) });
  }

  const row1 = document.createElement('div');
  row1.className = 'toolbar__row';

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
  searchInput.placeholder = 'Search by name, ASN, or platform…';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'search__clear';
  clearBtn.setAttribute('aria-label', 'Clear');
  const clearSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  clearSvg.setAttribute('viewBox', '0 0 24 24');
  clearSvg.setAttribute('fill', 'none');
  clearSvg.setAttribute('stroke', 'currentColor');
  clearSvg.setAttribute('stroke-width', '2');
  clearSvg.setAttribute('stroke-linecap', 'round');
  clearSvg.setAttribute('stroke-linejoin', 'round');
  const clearPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  clearPath.setAttribute('d', 'M18 6L6 18M6 6l12 12');
  clearSvg.appendChild(clearPath);
  clearBtn.appendChild(clearSvg);

  searchWrap.append(searchIcon, searchInput, clearBtn);

  searchInput.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchWrap.classList.toggle('has-value', searchInput.value.length > 0);
    searchTimer = setTimeout(() => {
      state.search = searchInput.value.trim();
      emit();
    }, 150);
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchWrap.classList.remove('has-value');
    state.search = '';
    searchInput.focus();
    emit();
  });

  // Mode toggle — shared with countries via store
  const modeToggle = document.createElement('div');
  modeToggle.className = 'mode-toggle';

  const btnAllow = document.createElement('button');
  btnAllow.className = 'mode-toggle__btn';
  btnAllow.textContent = 'Allow';

  const btnBlock = document.createElement('button');
  btnBlock.className = 'mode-toggle__btn';
  btnBlock.textContent = 'Block';

  function updateModeUI(): void {
    const isAllow = store.current.mode === 'allow';
    btnAllow.classList.toggle('mode-toggle__btn--active', isAllow);
    btnBlock.classList.toggle('mode-toggle__btn--active', !isAllow);
  }

  btnAllow.addEventListener('click', () => store.setMode('allow'));
  btnBlock.addEventListener('click', () => store.setMode('block'));

  modeToggle.append(btnAllow, btnBlock);
  row1.append(searchWrap, modeToggle);

  // Row 2: category chips
  const row2 = document.createElement('div');
  row2.className = 'toolbar__row';

  const chips = document.createElement('div');
  chips.className = 'chips';

  for (const category of ASN_CATEGORIES) {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = ASN_CATEGORY_LABELS[category];
    chip.addEventListener('click', () => {
      if (state.activeCategories.has(category)) {
        state.activeCategories.delete(category);
      } else {
        state.activeCategories.add(category);
      }
      chip.classList.toggle('chip--active', state.activeCategories.has(category));
      emit();
    });
    chips.appendChild(chip);
  }

  row2.appendChild(chips);
  container.append(row1, row2);

  updateModeUI();
  const unsub = store.subscribe(updateModeUI);

  return {
    getState: () => state,
    destroy() {
      unsub();
      container.replaceChildren();
    },
  };
}
