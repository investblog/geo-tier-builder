import { describe, expect, it } from 'vitest';
import {
  buildCatchAll,
  buildPathRegex,
  escapeRegexLiteral,
  extractPathname,
  normalizeSlug,
  parseSlugs,
  testPathname,
} from '@engine/tds-regex';

describe('tds-regex', () => {
  describe('normalizeSlug', () => {
    it('trims whitespace', () => {
      expect(normalizeSlug('  vavada  ')).toBe('vavada');
    });
    it('strips a single leading slash', () => {
      expect(normalizeSlug('/playfortuna')).toBe('playfortuna');
      expect(normalizeSlug('///x')).toBe('x');
    });
    it('strips trailing slashes', () => {
      expect(normalizeSlug('riobet/')).toBe('riobet');
    });
    it('preserves case (worker .test is case-sensitive)', () => {
      expect(normalizeSlug('PlayFortuna')).toBe('PlayFortuna');
    });
  });

  describe('escapeRegexLiteral', () => {
    it('escapes regex metacharacters', () => {
      expect(escapeRegexLiteral('a.b*c+d?')).toBe('a\\.b\\*c\\+d\\?');
      expect(escapeRegexLiteral('(x|y)[z]')).toBe('\\(x\\|y\\)\\[z\\]');
      expect(escapeRegexLiteral('a/b\\c')).toBe('a\\/b\\\\c');
    });
    it('leaves a plain slug unchanged', () => {
      expect(escapeRegexLiteral('playfortuna')).toBe('playfortuna');
    });
  });

  describe('parseSlugs', () => {
    it('splits on comma/newline/space and dedupes preserving order', () => {
      expect(parseSlugs('vavada, riobet\nplayfortuna vavada')).toEqual(['vavada', 'riobet', 'playfortuna']);
    });
    it('normalizes each entry and drops empties', () => {
      expect(parseSlugs(' /a/ ,, b ')).toEqual(['a', 'b']);
    });
  });

  describe('buildPathRegex', () => {
    it('returns empty string for no slugs (matches everything)', () => {
      expect(buildPathRegex([], 'exact')).toBe('');
    });
    it('exact single', () => {
      expect(buildPathRegex(['playfortuna'], 'exact')).toBe('^/playfortuna$');
    });
    it('exact multi (alternation)', () => {
      expect(buildPathRegex(['vavada', 'riobet', 'playfortuna'], 'exact')).toBe('^/(vavada|riobet|playfortuna)$');
    });
    it('prefix single / multi', () => {
      expect(buildPathRegex(['promo'], 'prefix')).toBe('^/promo');
      expect(buildPathRegex(['a', 'b'], 'prefix')).toBe('^/(a|b)');
    });
    it('contains single / multi', () => {
      expect(buildPathRegex(['casino'], 'contains')).toBe('/casino');
      expect(buildPathRegex(['a', 'b'], 'contains')).toBe('/(a|b)');
    });
    it('ends single / multi', () => {
      expect(buildPathRegex(['vavada'], 'ends')).toBe('/vavada$');
      expect(buildPathRegex(['a', 'b'], 'ends')).toBe('/(a|b)$');
    });
    it('escapes metachars inside slugs', () => {
      expect(buildPathRegex(['play.fortuna'], 'exact')).toBe('^/play\\.fortuna$');
    });
  });

  describe('buildCatchAll', () => {
    it('returns .*', () => {
      expect(buildCatchAll()).toBe('.*');
    });
  });

  describe('extractPathname', () => {
    it('extracts pathname from a full URL, dropping query and hash', () => {
      expect(extractPathname('https://go.bitcoincasino.cam/vavada?utm=1#x')).toBe('/vavada');
    });
    it('roots a bare slug', () => {
      expect(extractPathname('playfortuna')).toBe('/playfortuna');
    });
    it('keeps an already-rooted path and strips query', () => {
      expect(extractPathname('/riobet?a=1')).toBe('/riobet');
    });
    it('defaults empty input to /', () => {
      expect(extractPathname('   ')).toBe('/');
    });
  });

  describe('testPathname (worker semantics: unanchored .test on pathname)', () => {
    it('exact alternation matches the slug but not extensions', () => {
      const re = buildPathRegex(['vavada', 'riobet'], 'exact');
      expect(testPathname(re, '/vavada').matched).toBe(true);
      expect(testPathname(re, '/vavada/extra').matched).toBe(false);
      expect(testPathname(re, '/vavadax').matched).toBe(false);
    });
    it('prefix matches the slug and anything under it', () => {
      const re = buildPathRegex(['promo'], 'prefix');
      expect(testPathname(re, '/promo').matched).toBe(true);
      expect(testPathname(re, '/promo/abc').matched).toBe(true);
      expect(testPathname(re, '/x/promo').matched).toBe(false);
    });
    it('contains is an unanchored substring match (proves raw .test)', () => {
      const re = buildPathRegex(['casino'], 'contains');
      expect(testPathname(re, '/x/casino/y').matched).toBe(true);
    });
    it('catch-all matches everything including root', () => {
      const re = buildCatchAll();
      expect(testPathname(re, '/anything').matched).toBe(true);
      expect(testPathname(re, '/').matched).toBe(true);
    });
    it('ignores query string (pathname-only)', () => {
      const re = buildPathRegex(['vavada'], 'exact');
      expect(testPathname(re, 'https://x.com/vavada?utm=1').matched).toBe(true);
    });
    it('empty pattern matches every request', () => {
      expect(testPathname('', '/whatever').matched).toBe(true);
    });
    it('invalid regex returns ok:false instead of throwing', () => {
      const res = testPathname('^/(unclosed', '/x');
      expect(res.ok).toBe(false);
      expect(res.matched).toBe(false);
      expect(res.error).toBeTruthy();
    });
  });
});
