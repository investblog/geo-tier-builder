import { ALL_COUNTRIES, matchesQuery } from '@engine/countries';
import { ALL_SERP_LANGS, buildGoogleSerpUrl, getSerpLangs } from '@engine/serp';
import { createFlagIcon, createSvgIcon } from '@shared/dom';
import { t } from '@shared/i18n';
import { browser } from 'wxt/browser';
import { showToast } from './toast';

// Tracked link to 301.st (UTM for attribution).
const SERP_301_URL = 'https://301.st/?utm_source=geo-tier-builder&utm_medium=extension&utm_campaign=serp-preview';

const DEFAULT_ISO2 = 'US';

// 301.st logo (same path as the footer icon) — the card's decorative glyph.
const LOGO_301_GLYPH =
  'M13.295 18.57c-.013 1.026-.074 2.047-.438 3.026-.681 1.828-2.003 2.903-3.893 3.284a8.3 8.3 0 0 1-1.56.146c-2.42.024-4.839.025-7.259.034H0v-5.454h.214c2.22.01 4.442.017 6.662.003a4 4 0 0 0 1.058-.16 1.66 1.66 0 0 0 1.22-1.546c.034-.746.052-1.494.031-2.24-.028-1.03-.769-1.766-1.8-1.803-.854-.03-1.71-.032-2.565-.035-1.536-.005-3.072 0-4.607-.008H0V9.5h.196c2.104 0 4.208.005 6.313-.007.307-.002.628-.053.917-.154.608-.212.98-.81.986-1.5q.003-.573 0-1.146c-.002-.878-.595-1.475-1.467-1.475H.034V.936h.172C3.289.947 6.37.943 9.454.95c.638.001 1.283.03 1.86.35.68.38 1.116.956 1.157 1.743.049.917.039 1.837.04 2.755.001.645-.004 1.29-.036 1.934-.045.886-.27 1.72-.849 2.42-.472.573-1.058.98-1.794 1.146-.01.002-.016.014-.041.036.089.018.167.031.243.05 1.595.404 2.635 1.372 2.984 3.001.128.598.203 1.213.24 1.824.047.785.048 1.574.037 2.361m8.421.051c-.002 1.014-.14 2.011-.596 2.933-.86 1.734-2.254 2.807-4.108 3.298-.848.224-1.712.225-2.59.2v-4.084c.265-.02.528-.026.788-.058 1.106-.136 1.82-.776 2.238-1.78.278-.667.396-1.375.41-2.089.04-1.84.053-3.68.064-5.52a60 60 0 0 0-.035-2.542c-.03-.8-.128-1.591-.436-2.343-.431-1.049-1.256-1.616-2.387-1.628-.429-.005-.857-.001-1.293-.001V.955c.018-.007.033-.018.048-.018.776.01 1.556-.023 2.327.043a5.94 5.94 0 0 1 3.612 1.601 5.94 5.94 0 0 1 1.857 3.404c.066.379.104.767.104 1.151q.01 5.869-.003 11.738zM26 .96v24.087q-.08.008-.152.01-1.155.003-2.312 0-.145 0-.286-.033a.38.38 0 0 1-.31-.325c-.017-.112-.016-.227-.016-.341q.002-11.388-.006-22.775c0-.44.185-.619.62-.621q.94-.004 1.883-.002z';

/**
 * Standalone Google SERP geo-preview. Does NOT use the store / SelectionState —
 * it's a self-contained helper, like the regex panel.
 */
export function createSerpPanel(container: HTMLElement): { destroy(): void } {
  // ── Query ──
  const queryTitle = document.createElement('h3');
  queryTitle.className = 'settings-group__title';
  queryTitle.textContent = t('serpQueryLabel');

  const queryInput = document.createElement('input');
  queryInput.type = 'text';
  queryInput.className = 'search__input';
  queryInput.placeholder = t('serpQueryPlaceholder');

  // ── Country ──
  const countryTitle = document.createElement('h3');
  countryTitle.className = 'settings-group__title';
  countryTitle.textContent = t('serpCountryLabel');

  const countrySearch = document.createElement('input');
  countrySearch.type = 'text';
  countrySearch.className = 'search__input';
  countrySearch.placeholder = t('serpCountrySearch');

  const countryRow = document.createElement('div');
  countryRow.className = 'serp-panel__row';

  const flagWrap = document.createElement('span');
  flagWrap.className = 'serp-panel__flag-wrap';

  const countrySelect = document.createElement('select');
  countrySelect.className = 'drawer__select';
  const sorted = [...ALL_COUNTRIES].sort((a, b) => a.name_en.localeCompare(b.name_en));

  function rebuildCountryOptions(query: string): void {
    const prev = countrySelect.value;
    const list = query ? sorted.filter((c) => matchesQuery(c, query)) : sorted;
    countrySelect.replaceChildren();
    for (const c of list) {
      const opt = document.createElement('option');
      opt.value = c.iso2;
      opt.textContent = `${c.iso2} — ${c.name_en}`;
      countrySelect.appendChild(opt);
    }
    if (list.some((c) => c.iso2 === prev)) countrySelect.value = prev;
    syncCountry();
  }

  countryRow.append(flagWrap, countrySelect);

  // ── Language ──
  const langTitle = document.createElement('h3');
  langTitle.className = 'settings-group__title';
  langTitle.textContent = t('serpLanguageLabel');

  const langSelect = document.createElement('select');
  langSelect.className = 'drawer__select';

  // ── Open button ──
  const openBtn = document.createElement('button');
  openBtn.className = 'btn btn--primary btn--sm';
  openBtn.textContent = t('serpOpen');

  const actions = document.createElement('div');
  actions.className = 'drawer__actions';
  actions.append(openBtn);

  // ── Info card (approximation disclaimer + tracked link) ──
  const infoCard = document.createElement('div');
  infoCard.className = 'serp-card';
  infoCard.appendChild(createSvgIcon(LOGO_301_GLYPH, 'serp-card__glyph', '0 0 26 26'));

  const infoText = document.createElement('p');
  infoText.className = 'serp-card__text';
  infoText.textContent = t('serpHint');

  const infoLink = document.createElement('a');
  infoLink.className = 'serp-card__link';
  infoLink.href = SERP_301_URL;
  infoLink.target = '_blank';
  infoLink.rel = 'noopener';
  infoLink.textContent = t('serpLink');

  infoCard.append(infoText, infoLink);

  function rebuildLangs(iso2: string): void {
    langSelect.replaceChildren();
    const suggested = getSerpLangs(iso2);

    const suggestedGroup = document.createElement('optgroup');
    suggestedGroup.label = t('serpLangSuggested');
    for (const code of suggested) {
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code;
      suggestedGroup.appendChild(opt);
    }

    const allGroup = document.createElement('optgroup');
    allGroup.label = t('serpLangAll');
    for (const code of ALL_SERP_LANGS) {
      if (suggested.includes(code)) continue;
      const opt = document.createElement('option');
      opt.value = code;
      opt.textContent = code;
      allGroup.appendChild(opt);
    }

    langSelect.append(suggestedGroup, allGroup);
    langSelect.value = suggested[0];
  }

  function syncCountry(): void {
    const iso2 = countrySelect.value;
    if (iso2) {
      flagWrap.replaceChildren(createFlagIcon(iso2, 'serp-panel__flag'));
      rebuildLangs(iso2);
    } else {
      flagWrap.replaceChildren();
      langSelect.replaceChildren();
    }
    syncButton();
  }

  function syncButton(): void {
    openBtn.disabled = queryInput.value.trim() === '' || countrySelect.value === '';
  }

  async function open(): Promise<void> {
    const res = buildGoogleSerpUrl({ query: queryInput.value, iso2: countrySelect.value, hl: langSelect.value });
    if (!res.ok || !res.url) {
      showToast(t('serpOpenFailed'));
      return;
    }
    try {
      await browser.tabs.create({ url: res.url });
    } catch {
      showToast(t('serpOpenFailed'));
    }
  }

  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  countrySearch.addEventListener('input', () => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(() => rebuildCountryOptions(countrySearch.value.trim()), 150);
  });
  countrySelect.addEventListener('change', syncCountry);
  queryInput.addEventListener('input', syncButton);
  queryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !openBtn.disabled) void open();
  });
  openBtn.addEventListener('click', () => void open());

  container.append(
    queryTitle,
    queryInput,
    countryTitle,
    countrySearch,
    countryRow,
    langTitle,
    langSelect,
    actions,
    infoCard,
  );

  rebuildCountryOptions('');
  countrySelect.value = DEFAULT_ISO2;
  syncCountry();

  return {
    destroy() {
      if (searchTimer) clearTimeout(searchTimer);
      container.replaceChildren();
    },
  };
}
