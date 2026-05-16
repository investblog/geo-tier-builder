import { type AnchorMode, buildCatchAll, buildPathRegex, parseSlugs, testPathname } from '@engine/tds-regex';
import { showToast } from './toast';

const ANCHORS: { mode: AnchorMode; label: string }[] = [
  { mode: 'exact', label: 'Exact  ^/x$' },
  { mode: 'prefix', label: 'Prefix  ^/x' },
  { mode: 'contains', label: 'Contains  /x' },
  { mode: 'ends', label: 'Ends  /x$' },
];

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
  slugTitle.textContent = 'Path slugs';

  const slugInput = document.createElement('textarea');
  slugInput.className = 'import-panel__textarea';
  slugInput.placeholder = 'One slug per line or comma-separated, e.g.\nvavada\nriobet\nplayfortuna';
  slugInput.rows = 4;

  // ── Anchor chips ──
  const anchorChips = document.createElement('div');
  anchorChips.className = 'regex-anchor';
  const chipEls = ANCHORS.map(({ mode, label }) => {
    const c = document.createElement('button');
    c.className = 'chip';
    c.dataset.anchor = mode;
    c.textContent = label;
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
  catchAllBtn.textContent = 'Catch-all (.*)';
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
  outLabel.textContent = 'Regex for the TDS path field';

  const out = document.createElement('textarea');
  out.className = 'drawer__textarea';
  out.readOnly = true;
  out.rows = 2;

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn--primary btn--sm';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    if (!out.value) return;
    try {
      await navigator.clipboard.writeText(out.value);
      showToast('Copied!');
    } catch {
      showToast('Failed to copy');
    }
  });

  // ── Live tester ──
  const testLabel = document.createElement('h3');
  testLabel.className = 'settings-group__title';
  testLabel.textContent = 'Test against sample paths';

  const testInput = document.createElement('textarea');
  testInput.className = 'import-panel__textarea';
  testInput.placeholder =
    'Paste pathnames or full URLs, one per line:\n/vavada\nhttps://go.example.com/promo/abc?utm=1';
  testInput.rows = 4;

  const testResults = document.createElement('div');
  testResults.className = 'regex-tester';

  const hint = document.createElement('p');
  hint.className = 'regex-hint';
  hint.textContent =
    'TDS runs new RegExp(path).test(url.pathname) — substring match on the pathname only (no query/host). Rules evaluate by priority DESC; the first match wins.';

  function currentRegex(): string {
    return catchAll ? buildCatchAll() : buildPathRegex(parseSlugs(slugsRaw), anchor);
  }

  function recompute(): void {
    for (const c of chipEls) c.classList.toggle('chip--active', !catchAll && c.dataset.anchor === anchor);

    const regex = currentRegex();
    out.value = regex;

    if (catchAll) {
      warn.textContent =
        'Catch-all matches every request. This rule MUST have the lowest priority (rules evaluate priority DESC, first match wins).';
      warn.style.display = '';
    } else if (regex === '') {
      warn.textContent = 'Empty pattern — leaving the TDS path field blank matches every request.';
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
      path.textContent = res.ok ? line : `${line} — invalid regex`;
      row.append(mark, path);
      testResults.appendChild(row);
    }
  }

  let debounce: ReturnType<typeof setTimeout> | null = null;
  slugInput.addEventListener('input', () => {
    slugsRaw = slugInput.value;
    catchAll = false;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(recompute, 150);
  });
  testInput.addEventListener('input', () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => renderTests(currentRegex()), 150);
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
    hint,
  );

  recompute();

  return {
    destroy() {
      if (debounce) clearTimeout(debounce);
      container.replaceChildren();
    },
  };
}
