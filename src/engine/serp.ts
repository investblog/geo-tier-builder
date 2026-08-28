/**
 * Google SERP geo-preview URL builder (pure, no DOM).
 *
 * Google has ignored ccTLDs for region since 2017 — localization is driven
 * entirely by params on google.com/search:
 *   gl    — country bias (lowercase ISO2)
 *   hl    — result/interface language
 *   uule  — encoded canonical location name; without it `gl` alone is weak
 *   pws=0 — disable personalization
 * The country-level uule is the protobuf `08 02 10 20 22 <len> <name>`
 * wrapped as 'w+' + base64, which reduces to the well-known formula:
 *   'w+CAIQICI' + KEY[byteLength(name)] + base64(utf8(name))
 * where KEY is the base64 alphabet indexed by the name's byte length.
 * The rendered SERP is an approximation — the real IP still influences
 * local pack and ads.
 */

import { getCountry } from './countries';
import { COUNTRY_LANGS } from './serp-langs';

const UULE_PREFIX = 'w+CAIQICI';
const UULE_KEY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/**
 * Encode a canonical location name ("Germany") into a uule value.
 * Returns '' for names of 64+ UTF-8 bytes (outside the single-char length
 * key) — callers then omit the param instead of throwing.
 */
export function buildUule(canonicalName: string): string {
  const bytes = new TextEncoder().encode(canonicalName);
  if (bytes.length === 0 || bytes.length >= UULE_KEY.length) return '';
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return UULE_PREFIX + UULE_KEY[bytes.length] + btoa(bin);
}

export interface SerpUrlResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/** Build the google.com/search URL for a query as seen from a country. */
export function buildGoogleSerpUrl(opts: { query: string; iso2: string; hl: string }): SerpUrlResult {
  const query = opts.query.trim();
  if (!query) return { ok: false, error: 'empty query' };

  const country = getCountry(opts.iso2);
  if (!country) return { ok: false, error: `unknown country: ${opts.iso2}` };

  const params = new URLSearchParams();
  params.set('q', query);
  params.set('gl', country.iso2.toLowerCase());
  params.set('hl', opts.hl);
  const uule = buildUule(country.name_en);
  if (uule) params.set('uule', uule);
  params.set('pws', '0');
  return { ok: true, url: `https://www.google.com/search?${params.toString()}` };
}

/** Suggested search languages for a country, default first. Falls back to English. */
export function getSerpLangs(iso2: string): string[] {
  return COUNTRY_LANGS[iso2.toUpperCase()] ?? ['en'];
}

/** Every language code used across COUNTRY_LANGS, deduped and sorted. */
export const ALL_SERP_LANGS: readonly string[] = Object.freeze(
  [...new Set(Object.values(COUNTRY_LANGS).flat())].sort(),
);
