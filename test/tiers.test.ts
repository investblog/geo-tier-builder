import { describe, expect, it } from 'vitest';
import { ALL_COUNTRIES, BY_ISO2 } from '@engine/countries';
import { getCountriesByResolvedTier, getResolvedTier, getTier } from '@engine/tiers';

describe('tiers', () => {
  describe('getTier', () => {
    it('returns builtin tier when no custom override', () => {
      expect(getTier('US', {})).toBe('T1');
      expect(getTier('PL', {})).toBe('T2');
    });

    it('returns custom tier when override exists', () => {
      expect(getTier('RU', { RU: 'T1' })).toBe('T1');
    });

    it('defaults to T3 for unknown iso2', () => {
      expect(getTier('XX', {})).toBe('T3');
    });
  });

  describe('getResolvedTier', () => {
    it('uses custom override over builtin', () => {
      const us = BY_ISO2.get('US')!;
      expect(getResolvedTier(us, { US: 'T3' })).toBe('T3');
    });

    it('falls back to builtin when no override', () => {
      const us = BY_ISO2.get('US')!;
      expect(getResolvedTier(us, {})).toBe('T1');
    });
  });

  describe('getCountriesByResolvedTier', () => {
    it('returns T1 countries', () => {
      const t1 = getCountriesByResolvedTier('T1', {});
      const codes = t1.map((c) => c.iso2);
      expect(codes).toContain('US');
      expect(codes).toContain('GB');
      expect(codes).toContain('JP');
      expect(codes).not.toContain('RU');
    });

    it('includes custom overrides', () => {
      const t1 = getCountriesByResolvedTier('T1', { RU: 'T1' });
      expect(t1.map((c) => c.iso2)).toContain('RU');
    });

    it('excludes demoted countries', () => {
      const t1 = getCountriesByResolvedTier('T1', { US: 'T3' });
      expect(t1.map((c) => c.iso2)).not.toContain('US');
    });
  });

  describe('builtin tier counts', () => {
    it('has ~24 T1 countries', () => {
      const t1 = ALL_COUNTRIES.filter((c) => c.tier === 'T1');
      expect(t1.length).toBeGreaterThanOrEqual(20);
      expect(t1.length).toBeLessThanOrEqual(30);
    });

    it('has ~43 T2 countries', () => {
      const t2 = ALL_COUNTRIES.filter((c) => c.tier === 'T2');
      expect(t2.length).toBeGreaterThanOrEqual(35);
      expect(t2.length).toBeLessThanOrEqual(55);
    });
  });
});
