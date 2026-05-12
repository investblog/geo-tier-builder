import { storage } from '@shared/storage';
import type { AdNetwork, CustomTiers, Preset, SelectionMode } from '@shared/types';

export interface StoreState {
  mode: SelectionMode;
  include: string[];
  exclude: string[];
  favorites: string[];
  customTiers: CustomTiers;
  customAdNetworks: AdNetwork[];
  asnInclude: string[];
  asnExclude: string[];
  presets: Preset[];
}

type Listener = () => void;

export class Store {
  private state: StoreState = {
    mode: 'allow',
    include: [],
    exclude: [],
    favorites: [],
    customTiers: {},
    customAdNetworks: [],
    asnInclude: [],
    asnExclude: [],
    presets: [],
  };

  private listeners = new Set<Listener>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DELAY = 300;

  get current(): Readonly<StoreState> {
    return this.state;
  }

  async init(): Promise<void> {
    const [mode, include, exclude, favorites, customTiers, customAdNetworks, asnInclude, asnExclude, presets] =
      await Promise.all([
        storage.getMode(),
        storage.getInclude(),
        storage.getExclude(),
        storage.getFavorites(),
        storage.getCustomTiers(),
        storage.getCustomAdNetworks(),
        storage.getAsnInclude(),
        storage.getAsnExclude(),
        storage.getPresets(),
      ]);
    this.state = {
      mode,
      include,
      exclude,
      favorites,
      customTiers,
      customAdNetworks,
      asnInclude,
      asnExclude,
      presets,
    };
    this.notify();
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }

  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persist(), this.SAVE_DELAY);
  }

  private async persist(): Promise<void> {
    await Promise.all([
      storage.setMode(this.state.mode),
      storage.setInclude(this.state.include),
      storage.setExclude(this.state.exclude),
      storage.setFavorites(this.state.favorites),
      storage.setCustomTiers(this.state.customTiers),
      storage.setCustomAdNetworks(this.state.customAdNetworks),
      storage.setAsnInclude(this.state.asnInclude),
      storage.setAsnExclude(this.state.asnExclude),
      storage.setPresets(this.state.presets),
    ]);
  }

  setMode(mode: SelectionMode): void {
    this.state = { ...this.state, mode };
    this.notify();
    this.scheduleSave();
  }

  setInclude(include: string[]): void {
    this.state = { ...this.state, include };
    this.notify();
    this.scheduleSave();
  }

  setExclude(exclude: string[]): void {
    this.state = { ...this.state, exclude };
    this.notify();
    this.scheduleSave();
  }

  setFavorites(favorites: string[]): void {
    this.state = { ...this.state, favorites };
    this.notify();
    this.scheduleSave();
  }

  setCustomTiers(customTiers: CustomTiers): void {
    this.state = { ...this.state, customTiers };
    this.notify();
    this.scheduleSave();
  }

  setCustomAdNetworks(customAdNetworks: AdNetwork[]): void {
    this.state = { ...this.state, customAdNetworks };
    this.notify();
    this.scheduleSave();
  }

  setAsnInclude(asnInclude: string[]): void {
    this.state = { ...this.state, asnInclude };
    this.notify();
    this.scheduleSave();
  }

  setAsnExclude(asnExclude: string[]): void {
    this.state = { ...this.state, asnExclude };
    this.notify();
    this.scheduleSave();
  }

  getActiveAsnList(): string[] {
    return this.state.mode === 'allow' ? this.state.asnInclude : this.state.asnExclude;
  }

  setActiveAsnList(codes: string[]): void {
    if (this.state.mode === 'allow') {
      this.setAsnInclude(codes);
    } else {
      this.setAsnExclude(codes);
    }
  }

  setPresets(presets: Preset[]): void {
    this.state = { ...this.state, presets };
    this.notify();
    this.scheduleSave();
  }

  getActiveList(): string[] {
    return this.state.mode === 'allow' ? this.state.include : this.state.exclude;
  }

  setActiveList(codes: string[]): void {
    if (this.state.mode === 'allow') {
      this.setInclude(codes);
    } else {
      this.setExclude(codes);
    }
  }
}
