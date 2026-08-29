import { createSvgIcon } from '@shared/dom';
import { t } from '@shared/i18n';
import { getNewsEnabled, NEWS_ENABLED_KEY, toggleNews } from '@shared/news';
import { initTheme } from '@shared/theme';
import { browser } from 'wxt/browser';

// Tracked link to 301.st (UTM for attribution — own campaign per surface).
const WELCOME_301_URL = 'https://301.st/?utm_source=geo-tier-builder&utm_medium=extension&utm_campaign=welcome';
const GITHUB_URL = 'https://github.com/investblog/geo-tier-builder';

declare const __REVIEW_URL__: string;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

const BELL_ON =
  'M21 19v1H3v-1l2-2v-6c0-3.1 2.03-5.83 5-6.71V4a2 2 0 0 1 4 0v.29c2.97.88 5 3.61 5 6.71v6zm-7 2a2 2 0 0 1-4 0z';
const BELL_OFF =
  'M20.84 22.73 18.11 20H3v-1l2-2v-6c0-1.14.29-2.23.79-3.18L1.11 3l1.28-1.27 19.72 19.73zM19 15.8V11c0-3.1-2.03-5.83-5-6.71V4a2 2 0 0 0-4 0v.29c-.61.18-1.18.44-1.7.78zM12 23a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2';

// The side panel's own tab icons, kept identical so this list reads as a legend
// for the toolbar the user is about to see (source: sidepanel/index.html).
const PANEL_TABS: { name: string; key: string; viewBox: string; icon: string }[] = [
  {
    name: 'List',
    key: 'welTabList',
    viewBox: '0 0 20 20',
    icon: 'm10 14.465 7.36-5.73L19 7.465l-9-7-9 7 1.63 1.27m7.37 8.27-7.38-5.73L1 12.535l9 7 9-7-1.63-1.27z',
  },
  {
    name: 'Regex',
    key: 'welTabRegex',
    viewBox: '0 0 24 24',
    icon: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z',
  },
  {
    name: 'SERP',
    key: 'welTabSerp',
    viewBox: '0 0 24 24',
    icon: 'M17.9 17.39c-.26-.8-1.01-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8M11 19.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1a2 2 0 0 0 2 2m1-16A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2',
  },
  {
    name: 'Import',
    key: 'welTabImport',
    viewBox: '0 0 23 20',
    icon: 'M3 0v6H1V0zM1 20h2v-6H1zm3-10a2 2 0 1 0-2 2c1.11 0 2-.89 2-2m19-6v12c0 1.11-.89 2-2 2H9a2 2 0 0 1-2-2v-4l-2-2 2-2V4a2 2 0 0 1 2-2h12c1.11 0 2 .89 2 2m-5 7h-8v2h8zm2-4H10v2h10z',
  },
  {
    name: 'Presets',
    key: 'welTabPresets',
    viewBox: '0 0 20 20',
    icon: 'M.485 9.01a.94.94 0 0 1-.352-1.305L1.561 5.24a.9.9 0 0 1 .448-.4L9.464.65a.9.9 0 0 1 .543-.171c.2 0 .39.057.542.171l7.522 4.228a.93.93 0 0 1 .42.438l1.38 2.399a.946.946 0 0 1-.343 1.295l-.952.552v4.723c0 .361-.2.676-.505.838L10.55 19.35a.9.9 0 0 1-.542.171c-.2 0-.39-.057-.543-.17l-7.522-4.228a.94.94 0 0 1-.505-.838V9.01a.97.97 0 0 1-.952 0m9.522-6.484v6.38l5.675-3.19zM3.342 13.723l5.713 3.218v-6.389L3.342 7.344zm13.33 0v-3.066l-4.761 2.761a1 1 0 0 1-.952.01v3.513zm-4.904-2.428 5.98-3.456-.553-.962-5.98 3.456z',
  },
  {
    name: 'Settings',
    key: 'welTabSettings',
    viewBox: '0 0 20 20',
    icon: 'M9.73 13.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7m7.43-2.53c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46a.49.49 0 0 0-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98L12.23.42a.506.506 0 0 0-.5-.42h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L2.3 9c-.04.34-.07.67-.07 1s.03.65.07.97L.19 12.63c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64z',
  },
];

const PANEL_ICON = 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m10 2H4v14h10zm2 0v14h4V5z';
const PIN_ICON = 'M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z';

const svgIcon = (path: string): SVGSVGElement => createSvgIcon(path, '');

function newsBellRow(): HTMLElement {
  const row = el('p', 'welcome__news');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'welcome-bell';
  let enabled = false;

  const paint = (): void => {
    btn.replaceChildren(svgIcon(enabled ? BELL_ON : BELL_OFF));
    btn.title = t(enabled ? 'newsTitleOn' : 'newsTitleOff');
    btn.setAttribute('aria-pressed', String(enabled));
    btn.setAttribute('aria-label', t(enabled ? 'newsAriaOn' : 'newsAriaOff'));
  };

  btn.addEventListener('click', () => {
    // toggleNews must be the first call — Firefox accepts permissions.request
    // only while the user-input handler is still on the stack.
    const result = toggleNews(enabled);
    btn.disabled = true;
    void result
      .then((on) => {
        enabled = on;
        paint();
      })
      .finally(() => {
        btn.disabled = false;
      });
  });

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !(NEWS_ENABLED_KEY in changes)) return;
    enabled = Boolean(changes[NEWS_ENABLED_KEY]?.newValue);
    paint();
  });
  void getNewsEnabled().then((on) => {
    enabled = on;
    paint();
  });

  paint();
  row.append(btn, el('span', 'welcome__news-text', t('welNews')));
  return row;
}

// Cached at load: sidePanel.open must run while the click's user gesture is
// still active, so the handler cannot afford an await before calling it.
let currentWindowId: number | undefined;
void browser.windows?.getCurrent().then((win) => {
  currentWindowId = win.id;
});

async function openPanel(): Promise<void> {
  const b = browser as any;
  try {
    if (b.sidePanel?.open && currentWindowId !== undefined) {
      await b.sidePanel.open({ windowId: currentWindowId });
      return;
    }
    if (b.sidebarAction?.open) {
      await b.sidebarAction.open();
      return;
    }
  } catch {
    // fall through to tab fallback
  }
  await browser.tabs.create({ url: browser.runtime.getURL('/sidepanel.html') });
}

function render(app: HTMLElement): void {
  // ── Header ──
  const header = el('header', 'welcome__header');
  const icon = document.createElement('img');
  icon.className = 'welcome__icon';
  icon.src = '/icons/48.png';
  icon.alt = '';
  const headText = document.createElement('div');
  headText.append(el('h1', 'welcome__title', t('welTitle')), el('p', 'welcome__tagline', t('welTagline')));
  header.append(icon, headText);

  // ── Hero ──
  const hero = el('section', 'welcome-card');
  const openBtn = el('button', 'welcome-btn');
  openBtn.append(svgIcon(PANEL_ICON), document.createTextNode(t('welOpenPanel')));
  openBtn.addEventListener('click', () => void openPanel());
  const pinHint = el('p', 'welcome__pin-hint');
  pinHint.append(svgIcon(PIN_ICON), el('span', '', t('welPinHint')));
  hero.append(
    el('h2', 'welcome-card__title', t('welHeroTitle')),
    el('p', 'welcome-card__text', t('welHeroText')),
    openBtn,
    pinHint,
  );

  // ── Steps ──
  const steps = el('section', 'welcome__steps');
  const stepData: [string, string][] = [
    [t('welStep1Title'), t('welStep1Text')],
    [t('welStep2Title'), t('welStep2Text')],
    [t('welStep3Title'), t('welStep3Text')],
  ];
  stepData.forEach(([title, text], i) => {
    const step = el('div', 'welcome-step');
    step.append(
      el('div', 'welcome-step__num', String(i + 1)),
      el('h3', 'welcome-step__title', title),
      el('p', 'welcome-step__text', text),
    );
    steps.appendChild(step);
  });

  // ── Tabs overview ──
  const tabsCard = el('section', 'welcome-card');
  tabsCard.appendChild(el('h2', 'welcome-card__title', t('welTabsTitle')));
  const tabsList = el('ul', 'welcome__tabs');
  for (const tab of PANEL_TABS) {
    const li = document.createElement('li');
    li.appendChild(createSvgIcon(tab.icon, 'welcome__tab-icon', tab.viewBox));
    const body = document.createElement('span');
    const strong = document.createElement('strong');
    strong.textContent = tab.name;
    body.append(strong, ` — ${t(tab.key)}`);
    li.appendChild(body);
    tabsList.appendChild(li);
  }
  tabsCard.appendChild(tabsList);

  // ── Privacy ──
  const privacy = el('section', 'welcome-card');
  privacy.append(
    el('h2', 'welcome-card__title', t('welPrivacyTitle')),
    el('p', 'welcome-card__text', t('welPrivacyText')),
    newsBellRow(),
  );
  const links = el('div', 'welcome__links');
  const linkData: [string, string][] = [
    [t('welLinkSite'), WELCOME_301_URL],
    ['GitHub', GITHUB_URL],
    [t('welLinkRate'), __REVIEW_URL__],
  ];
  for (const [label, url] of linkData) {
    const a = el('a', 'welcome-chip', label);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    links.appendChild(a);
  }
  privacy.appendChild(links);

  app.append(header, hero, steps, tabsCard, privacy);
}

initTheme();
document.title = t('welTitle') || 'Geo Tier Builder';
render(document.getElementById('app')!);
