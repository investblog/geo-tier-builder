import { ALL_COUNTRIES } from '@engine/countries';
import type { Store } from '@engine/store';
import type { RenderContext, TemplateCategory } from '@shared/types';
import { ALL_TEMPLATES, CATEGORIES, CATEGORY_LABELS, getTemplatesByCategory } from '../../../../templates';
import { showToast } from './toast';

export function createOutputPanel(container: HTMLElement, store: Store): { destroy(): void } {
  let currentCategory: TemplateCategory = '301st';
  let currentTemplateId = '301st.iso2.csv';

  // Category select
  const selects = document.createElement('div');
  selects.className = 'output-panel__selects';

  const catSelect = document.createElement('select');
  catSelect.className = 'output-panel__select';
  for (const cat of CATEGORIES) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = CATEGORY_LABELS[cat];
    catSelect.appendChild(opt);
  }

  const tplSelect = document.createElement('select');
  tplSelect.className = 'output-panel__select';

  function updateTemplateSelect(): void {
    tplSelect.innerHTML = '';
    const templates = getTemplatesByCategory(currentCategory);
    for (const tpl of templates) {
      const opt = document.createElement('option');
      opt.value = tpl.id;
      opt.textContent = tpl.name;
      tplSelect.appendChild(opt);
    }
    if (templates.length > 0) {
      currentTemplateId = templates[0].id;
      tplSelect.value = currentTemplateId;
    }
    updateOutput();
  }

  catSelect.addEventListener('change', () => {
    currentCategory = catSelect.value as TemplateCategory;
    updateTemplateSelect();
  });

  tplSelect.addEventListener('change', () => {
    currentTemplateId = tplSelect.value;
    updateOutput();
  });

  selects.append(catSelect, tplSelect);

  // Textarea
  const textarea = document.createElement('textarea');
  textarea.className = 'output-panel__textarea';
  textarea.readOnly = true;
  textarea.placeholder = 'Select countries to generate output';

  // Actions row
  const actions = document.createElement('div');
  actions.className = 'output-panel__actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn btn--primary btn--sm';
  copyBtn.textContent = 'Copy';
  copyBtn.addEventListener('click', async () => {
    const text = textarea.value;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch {
      showToast('Failed to copy');
    }
  });

  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'btn btn--sm';
  downloadBtn.textContent = 'Download';
  downloadBtn.addEventListener('click', () => {
    const text = textarea.value;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentTemplateId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const sponsor = document.createElement('span');
  sponsor.className = 'output-panel__sponsor';
  sponsor.innerHTML = 'Built for <a href="https://301.st" target="_blank" rel="noopener">301.st</a>';

  actions.append(copyBtn, downloadBtn, sponsor);

  container.append(selects, textarea, actions);

  function updateOutput(): void {
    const template = ALL_TEMPLATES.find((t) => t.id === currentTemplateId);
    if (!template) {
      textarea.value = '';
      return;
    }

    const ctx: RenderContext = {
      mode: store.current.mode,
      include: store.current.include,
      exclude: store.current.exclude,
      countries: ALL_COUNTRIES as any,
    };

    textarea.value = template.render(ctx);
  }

  // Subscribe to store changes
  const unsub = store.subscribe(updateOutput);

  // Initial state
  updateTemplateSelect();

  return {
    destroy() {
      unsub();
      container.innerHTML = '';
    },
  };
}
