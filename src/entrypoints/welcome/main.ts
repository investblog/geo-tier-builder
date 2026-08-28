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

const PANEL_ICON = 'M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m10 2H4v14h10zm2 0v14h4V5z';
const PIN_ICON = 'M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z';

function svgIcon(path: string): SVGSVGElement {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('fill', 'currentColor');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

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
  const tabData: [string, string][] = [
    ['List', t('welTabList')],
    ['Regex', t('welTabRegex')],
    ['SERP', t('welTabSerp')],
    ['Import', t('welTabImport')],
    ['Presets', t('welTabPresets')],
    ['Settings', t('welTabSettings')],
  ];
  for (const [name, text] of tabData) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = name;
    li.append(strong, ` — ${text}`);
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
