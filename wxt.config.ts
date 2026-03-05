import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PluginOption } from 'vite';
import { defineConfig } from 'wxt';

/**
 * Vite plugin: injects flags-sprite.svg content directly into the HTML
 * at build time, replacing the placeholder `<svg id="flags-sprite">` element.
 * This avoids fetch/XHR issues in extension side panel context.
 */
function inlineFlagsSprite(): PluginOption {
  const SPRITE_PATH = resolve('src/assets/flags-sprite.svg');

  return {
    name: 'inline-flags-sprite',
    transformIndexHtml(html) {
      const svg = readFileSync(SPRITE_PATH, 'utf-8');
      // Extract inner content (symbols) from the sprite SVG wrapper
      const inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
      // Replace our placeholder with the populated sprite container
      return html.replace(
        /<svg[^>]*id="flags-sprite"[^>]*>.*?<\/svg>/s,
        `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" id="flags-sprite">${inner}</svg>`,
      );
    },
  };
}

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  alias: {
    '@': resolve('src'),
    '@shared': resolve('src/shared'),
    '@engine': resolve('src/engine'),
  },

  vite: ({ browser }) => ({
    plugins: [inlineFlagsSprite()],
    define: {
      __REVIEW_URL__: JSON.stringify(
        browser === 'firefox'
          ? '#' // TODO: addons.mozilla.org link
          : browser === 'edge'
            ? '#' // TODO: microsoftedge.microsoft.com link
            : '#', // TODO: chromewebstore.google.com link
      ),
      __TARGET_BROWSER__: JSON.stringify(browser),
    },
  }),

  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    version: '0.1.1',
    author: '301.st — Smart Traffic <support@301.st>',
    homepage_url: 'https://301.st',

    ...(browser === 'chrome' && { minimum_chrome_version: '116' }),

    permissions: browser === 'firefox' ? ['storage'] : ['storage', 'sidePanel'],

    icons: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      128: 'icons/128.png',
    },

    ...(browser !== 'firefox' && {
      side_panel: {
        default_path: 'sidepanel.html',
      },
    }),

    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'geo-tier-builder@301.st',
          strict_min_version: '142.0',
          data_collection_permissions: {
            required: ['none'],
          },
        },
      },
    }),
  }),

  browser: 'chrome',
});
