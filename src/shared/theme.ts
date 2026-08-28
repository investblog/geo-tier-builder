/**
 * Theme management — dark | light | auto (system), via `data-theme` on <html>.
 * `auto` stamps the resolved *system* theme into the attribute (and follows OS
 * changes) — the attribute is never left unset after init, so a toggle always
 * reads the actually-rendered theme and flips it on the first click.
 */

const THEME_STORAGE_KEY = 'geoTierBuilder_theme';

export type Theme = 'dark' | 'light';
export type ThemePreference = Theme | 'auto';

const systemTheme = (): Theme => (window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark');

export function getTheme(): Theme {
  const explicit = document.documentElement.dataset.theme as Theme | undefined;
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return systemTheme();
}

export function getThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light' || stored === 'auto') return stored;
  } catch {
    /* localStorage may be blocked */
  }
  return 'auto';
}

export function setTheme(theme: Theme | null): void {
  document.documentElement.dataset.theme = theme ?? systemTheme();
  document.dispatchEvent(new CustomEvent('themechange', { detail: getTheme() }));
}

export function setThemePreference(preference: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* localStorage may be blocked */
  }
  setTheme(preference === 'auto' ? null : preference);
}

export function toggleTheme(): void {
  setThemePreference(getTheme() === 'dark' ? 'light' : 'dark');
}

export function initTheme(): void {
  const apply = (): void => {
    const preference = getThemePreference();
    setTheme(preference === 'auto' ? null : preference);
  };
  apply();
  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (getThemePreference() === 'auto') setTheme(null);
    });
  } catch {
    /* matchMedia may not be available */
  }
  // All extension pages share one origin, so a toggle in the side panel must
  // reach a welcome page that is already open. The storage event fires only in
  // the OTHER documents.
  window.addEventListener('storage', (e) => {
    if (e.key === THEME_STORAGE_KEY || e.key === null) apply();
  });
}
