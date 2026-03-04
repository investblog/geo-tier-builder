import type { Country, MetaGroup, Region } from '@shared/types';
import { BY_REGION, BY_TAG } from './countries';

export const REGIONS: readonly Region[] = ['EUR', 'CIS', 'NA', 'LATAM', 'APAC', 'MENA', 'AFR', 'OCE'];

export const REGION_NAMES: Record<Region, string> = {
  EUR: 'Europe',
  CIS: 'CIS',
  NA: 'North America',
  LATAM: 'Latin America',
  APAC: 'Asia-Pacific',
  MENA: 'Middle East & N. Africa',
  AFR: 'Africa',
  OCE: 'Oceania',
};

export const META_GROUPS: readonly MetaGroup[] = ['EU', 'EEA', 'G7', 'G20', 'BRICS', 'FIVE_EYES'];

export function getRegionCountries(region: Region): readonly Country[] {
  return BY_REGION.get(region) ?? [];
}

export function getTagCountries(tag: MetaGroup): readonly Country[] {
  return BY_TAG.get(tag) ?? [];
}

export function getRegionCodes(region: Region): string[] {
  return getRegionCountries(region).map((c) => c.iso2);
}

export function getTagCodes(tag: MetaGroup): string[] {
  return getTagCountries(tag).map((c) => c.iso2);
}
