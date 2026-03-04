import type { Store } from '@engine/store';
import type { Preset } from '@shared/types';
import { showToast } from './toast';

export function createPresetsPanel(container: HTMLElement, store: Store): { destroy(): void } {
  function render(): void {
    container.innerHTML = '';

    // Title + save button row
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)';

    const title = document.createElement('h3');
    title.className = 'import-panel__section-title';
    title.textContent = 'Saved presets';

    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display:flex;gap:var(--space-2)';

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn--primary btn--sm';
    saveBtn.textContent = 'Save current';
    saveBtn.addEventListener('click', () => {
      const name = prompt('Preset name:');
      if (!name) return;
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
      showToast(`Preset "${name}" saved`);
      render();
    });

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

    headerActions.append(importBtn, exportBtn, saveBtn);
    header.append(title, headerActions);
    container.appendChild(header);

    // Presets list
    const presets = store.current.presets;
    if (presets.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No presets saved yet';
      container.appendChild(empty);
      return;
    }

    // Sort: pinned first, then by updatedAt desc
    const sorted = [...presets].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

    for (const preset of sorted) {
      const item = document.createElement('div');
      item.className = 'preset-item';

      const name = document.createElement('span');
      name.className = 'preset-item__name';
      name.textContent = preset.name;

      const meta = document.createElement('span');
      meta.className = 'preset-item__meta';
      meta.textContent = `${preset.mode} · ${preset.include.length + preset.exclude.length} countries`;

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
      renameBtn.textContent = 'Rename';
      renameBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newName = prompt('New name:', preset.name);
        if (!newName) return;
        const updated = presets.map((p) => (p.id === preset.id ? { ...p, name: newName, updatedAt: Date.now() } : p));
        store.setPresets(updated);
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

      item.append(pin, name, meta, loadBtn, renameBtn, deleteBtn);
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
