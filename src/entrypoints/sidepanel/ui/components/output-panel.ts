import { ALL_COUNTRIES } from '@engine/countries';
import type { Store } from '@engine/store';
import type { RenderContext, TemplateCategory, TemplateInputType } from '@shared/types';
import {
  ALL_TEMPLATES,
  CATEGORY_LABELS,
  getCategoriesForInputType,
  getTemplatesByCategoryAndInput,
} from '../../../../templates';
import { showToast } from './toast';

export function createOutputPanel(
  container: HTMLElement,
  store: Store,
  defaultTemplateId = '301st.iso2.csv',
  inputType: TemplateInputType = 'country',
): { destroy(): void } {
  const defaultTemplate = ALL_TEMPLATES.find((t) => t.id === defaultTemplateId);
  let currentCategory: TemplateCategory = defaultTemplate?.category ?? '301st';
  let currentTemplateId = defaultTemplateId;
  const availableCategories = getCategoriesForInputType(inputType);

  container.classList.add('drawer');

  // Drag handle — grip bar to expand/collapse textarea
  const handle = document.createElement('div');
  handle.className = 'drawer__handle';
  handle.title = 'Drag to resize or click to toggle';
  const grip = document.createElement('div');
  grip.className = 'drawer__grip';
  handle.appendChild(grip);

  // Body
  const body = document.createElement('div');
  body.className = 'drawer__body';

  // Selects row
  const selects = document.createElement('div');
  selects.className = 'drawer__selects';

  const catSelect = document.createElement('select');
  catSelect.className = 'drawer__select';
  for (const cat of availableCategories) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = CATEGORY_LABELS[cat];
    catSelect.appendChild(opt);
  }

  const tplSelect = document.createElement('select');
  tplSelect.className = 'drawer__select';

  function updateTemplateSelect(): void {
    tplSelect.replaceChildren();
    const templates = getTemplatesByCategoryAndInput(currentCategory, inputType);
    for (const tpl of templates) {
      const opt = document.createElement('option');
      opt.value = tpl.id;
      opt.textContent = tpl.name;
      tplSelect.appendChild(opt);
    }
    if (!templates.some((t) => t.id === currentTemplateId) && templates.length > 0) {
      currentTemplateId = templates[0].id;
    }
    tplSelect.value = currentTemplateId;
    updateOutput();
  }

  catSelect.value = currentCategory;

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
  textarea.className = 'drawer__textarea';
  textarea.readOnly = true;
  textarea.placeholder = 'Select countries to generate output';

  // Actions row
  const actions = document.createElement('div');
  actions.className = 'drawer__actions';

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

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn btn--danger btn--sm';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => {
    store.setActiveList([]);
  });

  actions.append(copyBtn, downloadBtn, clearBtn);

  body.append(selects, textarea, actions);
  container.append(handle, body);

  // Click grip to toggle expanded
  handle.addEventListener('click', () => {
    container.classList.toggle('drawer--expanded');
  });

  // Drag grip to resize textarea
  let dragging = false;
  let startY = 0;
  let startH = 0;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    startY = e.clientY;
    startH = textarea.offsetHeight;
    e.preventDefault();
  });

  function onMouseMove(e: MouseEvent): void {
    if (!dragging) return;
    const delta = startY - e.clientY;
    const newH = Math.max(40, Math.min(startH + delta, window.innerHeight * 0.6));
    container.style.setProperty('--drawer-textarea-h', `${newH}px`);
    container.classList.add('drawer--expanded');
  }

  function onMouseUp(): void {
    if (!dragging) return;
    dragging = false;
  }

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

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

  const unsub = store.subscribe(updateOutput);
  updateTemplateSelect();

  return {
    destroy() {
      unsub();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      container.replaceChildren();
    },
  };
}
