import { BY_ISO2 } from '@engine/countries';
import { parseCountryInput } from '@engine/parser';
import { add } from '@engine/selection';
import type { Store } from '@engine/store';
import { showToast } from './toast';

export function createImportPanel(container: HTMLElement, store: Store): { destroy(): void } {
  // Title
  const title = document.createElement('h3');
  title.className = 'import-panel__section-title';
  title.textContent = 'Import countries';

  // Textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'import-panel__textarea';
  textarea.placeholder = 'Paste country codes, names, or mixed list…';
  textarea.rows = 6;

  // Parse button
  const parseBtn = document.createElement('button');
  parseBtn.className = 'btn btn--primary';
  parseBtn.textContent = 'Parse';

  // Results area
  const results = document.createElement('div');
  results.className = 'import-panel__results';
  results.style.display = 'none';

  // Apply button
  const applyBtn = document.createElement('button');
  applyBtn.className = 'btn btn--primary';
  applyBtn.textContent = 'Apply to selection';
  applyBtn.style.display = 'none';

  let lastMatched: string[] = [];

  parseBtn.addEventListener('click', () => {
    const input = textarea.value.trim();
    if (!input) return;

    const parsed = parseCountryInput(input);
    lastMatched = parsed.matched;
    results.innerHTML = '';
    results.style.display = 'flex';

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
        chip.innerHTML = `<svg class="country-row__flag" style="width:16px;height:12px"><use href="#flag-${iso2.toLowerCase()}"></use></svg> ${iso2}`;
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
      const unknownTitle = document.createElement('div');
      unknownTitle.className = 'import-panel__section-title';
      unknownTitle.textContent = `Unknown (${parsed.unknown.length})`;
      results.appendChild(unknownTitle);

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

  container.append(title, textarea, parseBtn, results, applyBtn);

  return {
    destroy() {
      container.innerHTML = '';
    },
  };
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
