import type { Store } from '@engine/store';
import type { Preset } from '@shared/types';
import { showToast } from './toast';

export function createPresetsPanel(container: HTMLElement, store: Store): { destroy(): void } {
  let draftName = '';
  let renameId: string | null = null;
  let renameValue = '';

  function render(): void {
    container.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 'presets-panel__header';

    const title = document.createElement('h3');
    title.className = 'import-panel__section-title';
    title.textContent = 'Saved presets';

    const headerActions = document.createElement('div');
    headerActions.className = 'presets-panel__actions';

    const importBtn = document.createElement('button');
    importBtn.className = 'btn btn--sm';
    importBtn.textContent = 'Import';
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const imported = JSON.parse(text);
          if (Array.isArray(imported)) {
            store.setPresets([...store.current.presets, ...imported]);
            showToast(`Imported ${imported.length} presets`);
            render();
          }
        } catch {
          showToast('Invalid JSON file');
        }
      });
      input.click();
    });

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn--sm';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => {
      const json = JSON.stringify(store.current.presets, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'geo-tier-presets.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    headerActions.append(importBtn, exportBtn);
    header.append(title, headerActions);

    // Inline save row
    const saveRow = document.createElement('div');
    saveRow.className = 'presets-panel__save';

    const saveInput = document.createElement('input');
    saveInput.className = 'presets-panel__input';
    saveInput.placeholder = 'Preset name';
    saveInput.value = draftName;
    saveInput.addEventListener('input', () => {
      draftName = saveInput.value;
    });

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn--primary btn--sm';
    saveBtn.textContent = 'Save current';

    function doSave(): void {
      const name = draftName.trim();
      if (!name) {
        showToast('Enter a preset name');
        return;
      }
      const preset: Preset = {
        id: crypto.randomUUID(),
        name,
        mode: store.current.mode,
        include: [...store.current.include],
        exclude: [...store.current.exclude],
        pinned: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      store.setPresets([...store.current.presets, preset]);
      draftName = '';
      showToast(`Preset "${name}" saved`);
      render();
    }

    saveInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSave();
      }
    });
    saveBtn.addEventListener('click', doSave);

    saveRow.append(saveInput, saveBtn);
    container.append(header, saveRow);

    // Presets list
    const presets = store.current.presets;
    if (presets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No presets saved yet';
      container.appendChild(empty);
      return;
    }

    const sorted = [...presets].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

    for (const preset of sorted) {
      const item = document.createElement('div');
      item.className = 'preset-item';

      const pin = document.createElement('button');
      pin.className = `btn-icon preset-item__pin ${preset.pinned ? 'preset-item__pin--active' : ''}`;
      pin.textContent = '📌';
      pin.title = preset.pinned ? 'Unpin' : 'Pin';
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = presets.map((p) => (p.id === preset.id ? { ...p, pinned: !p.pinned } : p));
        store.setPresets(updated);
        render();
      });

      const content = document.createElement('div');
      content.className = 'preset-item__content';

      if (renameId === preset.id) {
        // Inline rename input
        const renameInput = document.createElement('input');
        renameInput.className = 'presets-panel__input presets-panel__input--inline';
        renameInput.value = renameValue;
        renameInput.addEventListener('input', () => {
          renameValue = renameInput.value;
        });
        renameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = renameValue.trim();
            if (!trimmed) return;
            const updated = presets.map((p) =>
              p.id === preset.id ? { ...p, name: trimmed, updatedAt: Date.now() } : p,
            );
            store.setPresets(updated);
            renameId = null;
            renameValue = '';
            showToast(`Renamed to "${trimmed}"`);
            render();
          }
          if (e.key === 'Escape') {
            renameId = null;
            renameValue = '';
            render();
          }
        });
        content.appendChild(renameInput);
        // Focus after append
        requestAnimationFrame(() => renameInput.focus());
      } else {
        const name = document.createElement('span');
        name.className = 'preset-item__name';
        name.textContent = preset.name;

        const meta = document.createElement('span');
        meta.className = 'preset-item__meta';
        meta.textContent = `${preset.mode} · ${preset.include.length + preset.exclude.length} countries`;

        content.append(name, meta);
      }

      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn btn--sm';
      loadBtn.textContent = 'Load';
      loadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        store.setMode(preset.mode);
        store.setInclude([...preset.include]);
        store.setExclude([...preset.exclude]);
        showToast(`Loaded "${preset.name}"`);
      });

      const renameBtn = document.createElement('button');
      renameBtn.className = 'btn btn--sm';
      renameBtn.textContent = renameId === preset.id ? 'Cancel' : 'Rename';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (renameId === preset.id) {
          renameId = null;
          renameValue = '';
        } else {
          renameId = preset.id;
          renameValue = preset.name;
        }
        render();
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn--sm';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const updated = presets.filter((p) => p.id !== preset.id);
        store.setPresets(updated);
        showToast(`Deleted "${preset.name}"`);
        render();
      });

      item.append(pin, content, loadBtn, renameBtn, deleteBtn);
      container.appendChild(item);
    }
  }

  const unsub = store.subscribe(render);
  render();

  return {
    destroy() {
      unsub();
      container.innerHTML = '';
    },
  };
}
