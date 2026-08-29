import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { setupNews } from '@/background/news';

export default defineBackground(() => {
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

  // First install only (never on updates): open the welcome page.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    }
  });
});
