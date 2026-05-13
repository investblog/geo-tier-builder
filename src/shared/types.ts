export type Region = 'EUR' | 'CIS' | 'NA' | 'LATAM' | 'APAC' | 'MENA' | 'AFR' | 'OCE';

export type MetaGroup = 'EU' | 'EEA' | 'G7' | 'G20' | 'BRICS' | 'FIVE_EYES';

export type Tier = 'T1' | 'T2' | 'T3';

export type SelectionMode = 'allow' | 'block';

export interface Country {
  iso2: string;
  iso3: string;
  name_en: string;
  name_ru: string;
  region: Region;
  tier: Tier;
  tags: MetaGroup[];
  aliases: string[];
}

export interface SelectionState {
  mode: SelectionMode;
  include: string[];
  exclude: string[];
  favorites: string[];
}

export interface Preset {
  id: string;
  name: string;
  mode: SelectionMode;
  include: string[];
  exclude: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CustomTiers {
  [iso2: string]: Tier;
}

export interface Settings {
  theme: 'dark' | 'light' | 'auto';
  language: 'en' | 'ru';
  defaultMode: SelectionMode;
  defaultTemplate: string;
  customTiers: CustomTiers;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  inputType: TemplateInputType;
  description: string;
  render: (ctx: RenderContext) => string;
}

export type TemplateCategory = '301st' | 'generic' | 'cloudflare' | 'server';

export type TemplateInputType = 'country' | 'asn';

export interface RenderContext {
  mode: SelectionMode;
  include: string[];
  exclude: string[];
  countries: Country[];
  asnInclude: string[];
  asnExclude: string[];
  networks: AdNetwork[];
}

export type AsnCategory = 'social' | 'search' | 'native' | 'mobile' | 'cis';

export interface AdNetwork {
  asn: number;
  name: string;
  category: AsnCategory;
  platforms: string[];
  notes: string;
  disabled?: boolean;
}

export interface ParseResult {
  matched: string[];
  unknown: string[];
  suggestions: Map<string, string[]>;
}
