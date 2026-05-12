import { browser } from 'wxt/browser';
import type { AdNetwork, CustomTiers, Preset, SelectionMode, Settings } from './types';

const PREFIX = 'geoTierBuilder:';

function key(name: string): string {
  return `${PREFIX}${name}`;
}

async function get<T>(name: string, fallback: T): Promise<T> {
  const k = key(name);
  const result = await browser.storage.local.get({ [k]: fallback });
  return result[k] as T;
}

async function set<T>(name: string, value: T): Promise<void> {
  await browser.storage.local.set({ [key(name)]: value });
}

export const storage = {
  async getMode(): Promise<SelectionMode> {
    return get('mode', 'allow');
  },
  async setMode(mode: SelectionMode): Promise<void> {
    await set('mode', mode);
  },

  async getInclude(): Promise<string[]> {
    return get('include', []);
  },
  async setInclude(codes: string[]): Promise<void> {
    await set('include', codes);
  },

  async getExclude(): Promise<string[]> {
    return get('exclude', []);
  },
  async setExclude(codes: string[]): Promise<void> {
    await set('exclude', codes);
  },

  async getFavorites(): Promise<string[]> {
    return get('favorites', []);
  },
  async setFavorites(codes: string[]): Promise<void> {
    await set('favorites', codes);
  },

  async getPresets(): Promise<Preset[]> {
    return get('presets', []);
  },
  async setPresets(presets: Preset[]): Promise<void> {
    await set('presets', presets);
  },

  async getCustomTiers(): Promise<CustomTiers> {
    return get('customTiers', {});
  },
  async setCustomTiers(tiers: CustomTiers): Promise<void> {
    await set('customTiers', tiers);
  },

  async getCustomAdNetworks(): Promise<AdNetwork[]> {
    return get('customAdNetworks', []);
  },
  async setCustomAdNetworks(networks: AdNetwork[]): Promise<void> {
    await set('customAdNetworks', networks);
  },

  async getAsnInclude(): Promise<string[]> {
    return get('asnInclude', []);
  },
  async setAsnInclude(codes: string[]): Promise<void> {
    await set('asnInclude', codes);
  },

  async getAsnExclude(): Promise<string[]> {
    return get('asnExclude', []);
  },
  async setAsnExclude(codes: string[]): Promise<void> {
    await set('asnExclude', codes);
  },

  async getSettings(): Promise<Settings> {
    return get('settings', {
      theme: 'auto',
      language: 'en',
      defaultMode: 'allow',
      defaultTemplate: '301st.iso2.csv',
      customTiers: {},
    });
  },
  async setSettings(settings: Settings): Promise<void> {
    await set('settings', settings);
  },
};
