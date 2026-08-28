import { ALL_COUNTRIES } from '@engine/countries';
import { ALL_SERP_LANGS, buildGoogleSerpUrl, buildUule, getSerpLangs } from '@engine/serp';
import { COUNTRY_LANGS } from '@engine/serp-langs';
import { describe, expect, it } from 'vitest';

describe('serp', () => {
  describe('buildUule', () => {
    it('encodes the known Germany example', () => {
      expect(buildUule('Germany')).toBe('w+CAIQICIHR2VybWFueQ==');
    });

    it('prefixes every value with the fixed protobuf header', () => {
      expect(buildUule('United States')).toMatch(/^w\+CAIQICI/);
    });

    it('embeds the base64 of the canonical name', () => {
      const uule = buildUule('United States');
      expect(atob(uule.slice('w+CAIQICI'.length + 1))).toBe('United States');
    });

    it('returns empty string for an empty name', () => {
      expect(buildUule('')).toBe('');
    });

    it('returns empty string for names of 64+ bytes instead of throwing', () => {
      expect(buildUule('x'.repeat(64))).toBe('');
    });

    it('does not throw on non-ASCII names', () => {
      expect(() => buildUule('Curaçao')).not.toThrow();
      expect(buildUule('Curaçao')).toMatch(/^w\+CAIQICI/);
    });

    it('encodes every bundled country name', () => {
      for (const c of ALL_COUNTRIES) {
        expect(buildUule(c.name_en)).toMatch(/^w\+CAIQICI/);
      }
    });
  });

  describe('buildGoogleSerpUrl', () => {
    it('builds a full URL with gl, hl, uule and pws=0', () => {
      const res = buildGoogleSerpUrl({ query: 'promo signup', iso2: 'DE', hl: 'de' });
      expect(res.ok).toBe(true);
      const url = new URL(res.url ?? '');
      expect(url.origin + url.pathname).toBe('https://www.google.com/search');
      expect(url.searchParams.get('q')).toBe('promo signup');
      expect(url.searchParams.get('gl')).toBe('de');
      expect(url.searchParams.get('hl')).toBe('de');
      expect(url.searchParams.get('uule')).toBe('w+CAIQICIHR2VybWFueQ==');
      expect(url.searchParams.get('pws')).toBe('0');
    });

    it('accepts lowercase iso2 input', () => {
      const res = buildGoogleSerpUrl({ query: 'test', iso2: 'fr', hl: 'fr' });
      expect(res.ok).toBe(true);
      expect(new URL(res.url ?? '').searchParams.get('gl')).toBe('fr');
    });

    it('rejects an empty or whitespace-only query', () => {
      expect(buildGoogleSerpUrl({ query: '', iso2: 'US', hl: 'en' }).ok).toBe(false);
      expect(buildGoogleSerpUrl({ query: '   ', iso2: 'US', hl: 'en' }).ok).toBe(false);
    });

    it('rejects an unknown country code', () => {
      const res = buildGoogleSerpUrl({ query: 'test', iso2: 'ZZ', hl: 'en' });
      expect(res.ok).toBe(false);
      expect(res.error).toContain('ZZ');
    });

    it('percent-encodes special characters in the query', () => {
      const res = buildGoogleSerpUrl({ query: 'кофе & чай?', iso2: 'RU', hl: 'ru' });
      expect(res.ok).toBe(true);
      expect(new URL(res.url ?? '').searchParams.get('q')).toBe('кофе & чай?');
    });
  });

  describe('COUNTRY_LANGS', () => {
    it('covers every bundled country', () => {
      for (const c of ALL_COUNTRIES) {
        expect(COUNTRY_LANGS[c.iso2], `missing langs for ${c.iso2}`).toBeDefined();
        expect(COUNTRY_LANGS[c.iso2].length).toBeGreaterThan(0);
      }
    });

    it('uses valid Google hl codes', () => {
      for (const langs of Object.values(COUNTRY_LANGS)) {
        for (const code of langs) {
          expect(code).toMatch(/^[a-z]{2,3}(-[A-Z]{2})?$/);
        }
      }
    });
  });

  describe('getSerpLangs', () => {
    it('returns the country languages, default first', () => {
      expect(getSerpLangs('CH')).toEqual(['de', 'fr', 'it']);
      expect(getSerpLangs('BR')[0]).toBe('pt-BR');
    });

    it('accepts lowercase input', () => {
      expect(getSerpLangs('de')).toEqual(['de']);
    });

    it('falls back to English for unknown codes', () => {
      expect(getSerpLangs('ZZ')).toEqual(['en']);
    });
  });

  describe('ALL_SERP_LANGS', () => {
    it('is deduped and sorted', () => {
      expect(new Set(ALL_SERP_LANGS).size).toBe(ALL_SERP_LANGS.length);
      expect([...ALL_SERP_LANGS]).toEqual([...ALL_SERP_LANGS].sort());
    });

    it('contains the common defaults', () => {
      expect(ALL_SERP_LANGS).toContain('en');
      expect(ALL_SERP_LANGS).toContain('zh-CN');
    });
  });
});
