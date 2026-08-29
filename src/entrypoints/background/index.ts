import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { setupNews } from '@/background/news';

const WELCOME_SEEN_KEY = 'geoTierBuilder:welcomeSeen';

/**
 * Show the welcome tab once per profile. Keyed on a storage flag rather than
 * `reason === 'install'` alone: reloading a temporary add-on (and some
 * reinstall paths) reports `update`, which would silently skip the page.
 */
async function openWelcomeOnce(reason: string): Promise<void> {
  try {
    const stored = await browser.storage.local.get(WELCOME_SEEN_KEY);
    if (stored[WELCOME_SEEN_KEY]) return;
    if (reason !== 'install' && reason !== 'update') return;
    await browser.storage.local.set({ [WELCOME_SEEN_KEY]: true });
    await browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
  } catch (e) {
    console.warn('welcome page failed to open', e);
  }
}

export default defineBackground(() => {
  // Registered FIRST: a throw anywhere below must not cost the welcome page.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    void openWelcomeOnce(reason);
  });

  setupNews();

  // Toolbar button: Chromium opens the side panel; Firefox opens the sidebar
  // directly from the click gesture (sidebarAction.open requires a user action).
  // setPanelBehavior runs on every worker start, not only on install.
  const b = browser as any;
  b.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true })?.catch?.(() => {});
  if (b.sidebarAction && b.browserAction) {
    b.browserAction.onClicked.addListener(() => {
      b.sidebarAction.open().catch(() => {});
    });
  }
});
