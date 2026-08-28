import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { setupNews } from '@/background/news';

export default defineBackground(() => {
  setupNews();

  // Chrome: open side panel on action click
  const b = browser as any;
  if (b.sidePanel) {
    browser.runtime.onInstalled.addListener(() => {
      b.sidePanel.setPanelBehavior?.({ openPanelOnActionClick: true });
    });
  }

  // First install only (never on updates): open the welcome page.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      void browser.tabs.create({ url: browser.runtime.getURL('/welcome.html') });
    }
  });
});
