import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    const b = browser as any;
    if (b.sidePanel) {
      b.sidePanel.setPanelBehavior?.({ openPanelOnActionClick: true });
    }
  });
});
