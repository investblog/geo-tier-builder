import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  // Chrome: open side panel on action click
  const b = browser as any;
  if (b.sidePanel) {
    browser.runtime.onInstalled.addListener(() => {
      b.sidePanel.setPanelBehavior?.({ openPanelOnActionClick: true });
    });
  }
});
