import { type AnchorMode, buildCatchAll, buildPathRegex, parseSlugs, testPathname } from '@engine/tds-regex';
import { t } from '@shared/i18n';
import { showToast } from './toast';

const ANCHORS: { mode: AnchorMode; key: string }[] = [
  { mode: 'exact', key: 'regexAnchorExact' },
  { mode: 'prefix', key: 'regexAnchorPrefix' },
  { mode: 'contains', key: 'regexAnchorContains' },
  { mode: 'ends', key: 'regexAnchorEnds' },
];

// Tracked deep-link to the 301.st TDS path-matching docs (UTM for attribution).
const TDS_DOCS_URL =
  'https://301.st/docs-tds.html?utm_source=geo-tier-builder&utm_medium=extension&utm_campaign=regex-helper';

/**
 * Standalone TDS path-regex helper. Does NOT use the store / SelectionState —
 * it's a self-contained generator, like the import/presets panels.
 */
export function createRegexPanel(container: HTMLElement): { destroy(): void } {
  let slugsRaw = '';
  let anchor: AnchorMode = 'exact';
  let catchAll = false;

  // ── Slugs input ──
  const slugTitle = document.createElement('h3');
  slugTitle.className = 'settings-group__title';
  slugTitle.textContent = t('regexSlugsLabel');

  const slugInput = document.createElement('textarea');
  slugInput.className = 'import-panel__textarea';
  slugInput.placeholder = t('regexSlugsPlaceholder');
  slugInput.rows = 4;

  // ── Anchor chips ──
  const anchorChips = document.createElement('div');
  anchorChips.className = 'regex-anchor';
  const chipEls = ANCHORS.map(({ mode, key }) => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.dataset.anchor = mode;
    c.textContent = t(key);
    if (mode === anchor) c.classList.add('chip--active');
    c.addEventListener('click', () => {
      anchor = mode;
      catchAll = false;
      recompute();
    });
    return c;
  });
  anchorChips.append(...chipEls);

  // ── Catch-all ──
  const catchAllBtn = document.createElement('button');
  catchAllBtn.className = 'btn btn--sm';
  catchAllBtn.textContent = t('regexCatchAll');
  catchAllBtn.addEventListener('click', () => {
    catchAll = true;
    recompute();
  });

  const warn = document.createElement('p');
  warn.className = 'regex-hint regex-hint--warn';
  warn.style.display = 'none';

  // ── Output ──
  const outLabel = document.createElement('h3');
  outLabel.className = 'settings-group__title';
  outLabel.textContent = t('regexOutputLabel');

  const out = document.createElement('textarea');
  out.className = 'drawer__textarea';
  out.readOnly = true;
  out.rows = 2;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn--primary btn--sm';
  copyBtn.textContent = t('outputCopy');
  copyBtn.addEventListener('click', async () => {
    if (!out.value) return;
    try {
      await navigator.clipboard.writeText(out.value);
      showToast(t('outputCopied'));
    } catch {
      showToast(t('regexCopyFailed'));
    }
  });

  // ── Live tester ──
  const testLabel = document.createElement('h3');
  testLabel.className = 'settings-group__title';
  testLabel.textContent = t('regexTesterLabel');

  const testInput = document.createElement('textarea');
  testInput.className = 'import-panel__textarea';
  testInput.placeholder = t('regexTesterPlaceholder');
  testInput.rows = 4;

  const testResults = document.createElement('div');
  testResults.className = 'regex-tester';

  // ── Info card (TDS contract + tracked docs link) ──
  const infoCard = document.createElement('div');
  infoCard.className = 'regex-card';

  const infoText = document.createElement('p');
  infoText.className = 'regex-card__text';
  infoText.textContent = t('regexHint');

  const infoLink = document.createElement('a');
  infoLink.className = 'regex-card__link';
  infoLink.href = TDS_DOCS_URL;
  infoLink.target = '_blank';
  infoLink.rel = 'noopener';
  infoLink.textContent = t('regexTdsLink');

  infoCard.append(infoText, infoLink);

  function currentRegex(): string {
    return catchAll ? buildCatchAll() : buildPathRegex(parseSlugs(slugsRaw), anchor);
  }

  function recompute(): void {
    for (const c of chipEls) c.classList.toggle('chip--active', !catchAll && c.dataset.anchor === anchor);

    const regex = currentRegex();
    out.value = regex;

    if (catchAll) {
      warn.textContent = t('regexCatchAllWarning');
      warn.style.display = '';
    } else if (regex === '') {
      warn.textContent = t('regexEmptyWarning');
      warn.style.display = '';
    } else {
      warn.style.display = 'none';
    }

    renderTests(regex);
  }

  function renderTests(regex: string): void {
    testResults.replaceChildren();
    const lines = testInput.value
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    for (const line of lines) {
      const res = testPathname(regex, line);
      const row = document.createElement('div');
      row.className = `regex-tester__row regex-tester__row--${res.ok ? (res.matched ? 'match' : 'nomatch') : 'invalid'}`;
      const mark = document.createElement('span');
      mark.className = 'regex-tester__mark';
      mark.textContent = res.ok ? (res.matched ? '✓' : '–') : '!';
      const path = document.createElement('span');
      path.className = 'regex-tester__path';
      path.textContent = res.ok ? line : `${line} — ${t('regexInvalid')}`;
      row.append(mark, path);
      testResults.appendChild(row);
    }
  }

  // Separate timers: typing in the test box must not cancel a pending recompute
  // of the slug-derived regex (the value the user copies).
  let slugTimer: ReturnType<typeof setTimeout> | null = null;
  let testTimer: ReturnType<typeof setTimeout> | null = null;
  slugInput.addEventListener('input', () => {
    slugsRaw = slugInput.value;
    catchAll = false;
    if (slugTimer) clearTimeout(slugTimer);
    slugTimer = setTimeout(recompute, 150);
  });
  testInput.addEventListener('input', () => {
    if (testTimer) clearTimeout(testTimer);
    testTimer = setTimeout(() => renderTests(currentRegex()), 150);
  });

  const outActions = document.createElement('div');
  outActions.className = 'drawer__actions';
  outActions.append(copyBtn);

  container.append(
    slugTitle,
    slugInput,
    anchorChips,
    catchAllBtn,
    warn,
    outLabel,
    out,
    outActions,
    testLabel,
    testInput,
    testResults,
    infoCard,
  );

  recompute();

  return {
    destroy() {
      if (slugTimer) clearTimeout(slugTimer);
      if (testTimer) clearTimeout(testTimer);
      container.replaceChildren();
    },
  };
}
