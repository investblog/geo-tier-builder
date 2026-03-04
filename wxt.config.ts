import { resolve } from 'node:path';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',

  alias: {
    '@': resolve('src'),
    '@shared': resolve('src/shared'),
    '@engine': resolve('src/engine'),
  },

  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    version: '0.1.0',
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
      sidebar_action: {
        default_panel: 'sidepanel.html',
        default_title: '__MSG_extName__',
        default_icon: { 16: 'icons/16.png', 32: 'icons/32.png' },
      },
    }),

    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'geo-tier-builder@301.st',
          strict_min_version: '109.0',
        },
      },
    }),
  }),

  browser: 'chrome',
});
