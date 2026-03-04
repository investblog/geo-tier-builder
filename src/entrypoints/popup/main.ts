import { browser } from 'wxt/browser';

document.getElementById('open-sidebar')?.addEventListener('click', async () => {
  const b = browser as any;
  try {
    if (b.sidebarAction?.open) {
      await b.sidebarAction.open();
      window.close();
      return;
    }
    if (b.sidebarAction?.toggle) {
      await b.sidebarAction.toggle();
      window.close();
      return;
    }
  } catch {
    // noop
  }
  // Fallback: open as tab
  await browser.tabs.create({ url: browser.runtime.getURL('/sidepanel.html') });
  window.close();
});
