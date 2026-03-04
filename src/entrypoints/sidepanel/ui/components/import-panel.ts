import { BY_ISO2 } from '@engine/countries';
import { parseCountryInput } from '@engine/parser';
import { add } from '@engine/selection';
import type { Store } from '@engine/store';
import { createFlagIcon } from '@shared/dom';
import { showToast } from './toast';

export function createImportPanel(container: HTMLElement, store: Store): { destroy(): void } {
  const title = document.createElement('h3');
  title.className = 'import-panel__section-title';
  title.textContent = 'Import countries';

  const textarea = document.createElement('textarea');
  textarea.className = 'import-panel__textarea';
  textarea.placeholder = 'Paste country codes, names, or mixed list…';
  textarea.rows = 6;

  const parseBtn = document.createElement('button');
  parseBtn.className = 'btn btn--primary';
  parseBtn.textContent = 'Parse';

  const summary = document.createElement('div');
  summary.className = 'import-panel__summary';
  summary.style.display = 'none';

  const results = document.createElement('div');
  results.className = 'import-panel__results';
  results.style.display = 'none';

  const applyBtn = document.createElement('button');
  applyBtn.className = 'btn btn--primary';
  applyBtn.textContent = 'Apply to selection';
  applyBtn.style.display = 'none';

  let lastMatched: string[] = [];
  let lastUnknown: string[] = [];

  parseBtn.addEventListener('click', () => {
    const input = textarea.value.trim();
    if (!input) return;

    const parsed = parseCountryInput(input);
    lastMatched = parsed.matched;
    lastUnknown = parsed.unknown;
    results.innerHTML = '';
    results.style.display = 'flex';

    // Summary line
    summary.style.display = '';
    summary.textContent = `Matched ${parsed.matched.length}, Unknown ${parsed.unknown.length}`;

    // Matched section
    if (parsed.matched.length > 0) {
      const matchTitle = document.createElement('div');
      matchTitle.className = 'import-panel__section-title';
      matchTitle.textContent = `Matched (${parsed.matched.length})`;
      results.appendChild(matchTitle);

      const matchChips = document.createElement('div');
      matchChips.className = 'import-panel__matched';
      for (const iso2 of parsed.matched) {
        const country = BY_ISO2.get(iso2);
        const chip = document.createElement('span');
        chip.className = 'chip chip--active';
        const flag = createFlagIcon(iso2);
        flag.style.width = '16px';
        flag.style.height = '12px';
        chip.append(flag, document.createTextNode(` ${iso2}`));
        if (country) chip.title = country.name_en;
        matchChips.appendChild(chip);
      }
      results.appendChild(matchChips);
      applyBtn.style.display = '';
    } else {
      applyBtn.style.display = 'none';
    }

    // Unknown section
    if (parsed.unknown.length > 0) {
      const unknownHeader = document.createElement('div');
      unknownHeader.className = 'import-panel__header';

      const unknownTitle = document.createElement('div');
      unknownTitle.className = 'import-panel__section-title';
      unknownTitle.textContent = `Unknown (${parsed.unknown.length})`;

      const copyUnknownBtn = document.createElement('button');
      copyUnknownBtn.className = 'btn btn--sm';
      copyUnknownBtn.textContent = 'Copy unknown';
      copyUnknownBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(lastUnknown.join('\n'));
          showToast('Unknown tokens copied');
        } catch {
          showToast('Failed to copy');
        }
      });

      unknownHeader.append(unknownTitle, copyUnknownBtn);
      results.appendChild(unknownHeader);

      const unknownList = document.createElement('div');
      unknownList.className = 'import-panel__unknown';
      for (const token of parsed.unknown) {
        const item = document.createElement('div');
        item.className = 'import-panel__unknown-token';

        let html = `<span>${escapeHtml(token)}</span>`;
        const suggestions = parsed.suggestions.get(token);
        if (suggestions && suggestions.length > 0) {
          html += `<span class="import-panel__suggestion">Did you mean: ${suggestions.join(', ')}?</span>`;
        }
        item.innerHTML = html;
        unknownList.appendChild(item);
      }
      results.appendChild(unknownList);
    }
  });

  applyBtn.addEventListener('click', () => {
    if (lastMatched.length === 0) return;
    const current = store.getActiveList();
    store.setActiveList(add(current, lastMatched));
    showToast(`Added ${lastMatched.length} countries`);
  });

  container.append(title, textarea, parseBtn, summary, results, applyBtn);

  return {
    destroy() {
      container.innerHTML = '';
    },
  };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
