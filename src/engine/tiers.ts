import type { Country, CustomTiers, Tier } from '@shared/types';
import { ALL_COUNTRIES, BY_ISO2 } from './countries';

export const TIERS: readonly Tier[] = ['T1', 'T2', 'T3'];

export function getTier(iso2: string, customTiers: CustomTiers): Tier {
  if (customTiers[iso2]) return customTiers[iso2];
  const country = BY_ISO2.get(iso2);
  return country?.tier ?? 'T3';
}

export function getResolvedTier(country: Country, customTiers: CustomTiers): Tier {
  return customTiers[country.iso2] ?? country.tier;
}

export function getCountriesByResolvedTier(tier: Tier, customTiers: CustomTiers): Country[] {
  return ALL_COUNTRIES.filter((c) => getResolvedTier(c, customTiers) === tier);
}
