import type { Country, MetaGroup, Region, Tier } from '@shared/types';
import rawData from '../data/countries.v1.json';

const countries: Country[] = rawData as Country[];

export const ALL_COUNTRIES: readonly Country[] = Object.freeze(countries);

export const BY_ISO2: ReadonlyMap<string, Country> = new Map(countries.map((c) => [c.iso2, c]));

export const BY_ISO3: ReadonlyMap<string, Country> = new Map(countries.map((c) => [c.iso3, c]));

const regionIndex = new Map<Region, Country[]>();
const tierIndex = new Map<Tier, Country[]>();
const tagIndex = new Map<MetaGroup, Country[]>();
const aliasIndex = new Map<string, Country>();

for (const c of countries) {
  // Region index
  let regionList = regionIndex.get(c.region);
  if (!regionList) {
    regionList = [];
    regionIndex.set(c.region, regionList);
  }
  regionList.push(c);

  // Tier index
  let tierList = tierIndex.get(c.tier);
  if (!tierList) {
    tierList = [];
    tierIndex.set(c.tier, tierList);
  }
  tierList.push(c);

  // Tag index
  for (const tag of c.tags) {
    let tagList = tagIndex.get(tag);
    if (!tagList) {
      tagList = [];
      tagIndex.set(tag, tagList);
    }
    tagList.push(c);
  }

  // Alias index (lowercase)
  aliasIndex.set(c.name_en.toLowerCase(), c);
  if (c.name_ru) {
    aliasIndex.set(c.name_ru.toLowerCase(), c);
  }
  for (const alias of c.aliases) {
    aliasIndex.set(alias.toLowerCase(), c);
  }
}

export const BY_REGION: ReadonlyMap<Region, readonly Country[]> = regionIndex;
export const BY_TIER: ReadonlyMap<Tier, readonly Country[]> = tierIndex;
export const BY_TAG: ReadonlyMap<MetaGroup, readonly Country[]> = tagIndex;
export const BY_ALIAS: ReadonlyMap<string, Country> = aliasIndex;

export function getCountry(iso2: string): Country | undefined {
  return BY_ISO2.get(iso2.toUpperCase());
}

export function getCountryByIso3(iso3: string): Country | undefined {
  return BY_ISO3.get(iso3.toUpperCase());
}

export function findByAlias(text: string): Country | undefined {
  return aliasIndex.get(text.toLowerCase());
}
