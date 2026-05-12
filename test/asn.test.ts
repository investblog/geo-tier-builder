import { describe, expect, it } from 'vitest';
import adNetworks from '../src/data/ad-networks.v1.json' with { type: 'json' };
import {
  ASN_CATEGORIES,
  ASN_CATEGORY_LABELS,
  filterByCategory,
  filterByPlatform,
  findByAsn,
  searchNetworks,
} from '@engine/asn';
import type { AdNetwork, AsnCategory } from '@shared/types';

const networks = adNetworks as AdNetwork[];

describe('asn dataset', () => {
  it('loads ad-networks.v1.json', () => {
    expect(Array.isArray(networks)).toBe(true);
    expect(networks.length).toBeGreaterThan(0);
  });

  it('every entry has required fields with valid types', () => {
    for (const n of networks) {
      expect(typeof n.asn).toBe('number');
      expect(n.asn).toBeGreaterThan(0);
      expect(typeof n.name).toBe('string');
      expect(n.name.length).toBeGreaterThan(0);
      expect(ASN_CATEGORIES).toContain(n.category);
      expect(Array.isArray(n.platforms)).toBe(true);
      expect(typeof n.notes).toBe('string');
    }
  });

  it('has no duplicate ASN numbers', () => {
    const asns = networks.map((n) => n.asn);
    expect(new Set(asns).size).toBe(asns.length);
  });

  it('includes core social platforms', () => {
    expect(findByAsn(networks, 32934)?.name).toBe('Meta');
    expect(findByAsn(networks, 13414)?.name).toBe('X (Twitter)');
  });

  it('includes core search platforms', () => {
    expect(findByAsn(networks, 15169)?.name).toBe('Google');
    expect(findByAsn(networks, 8075)?.name).toBe('Microsoft');
  });

  it('includes CIS coverage', () => {
    expect(findByAsn(networks, 47764)?.name).toContain('Mail.ru');
    expect(findByAsn(networks, 13238)?.name).toBe('Yandex');
  });
});

describe('asn engine', () => {
  describe('filterByCategory', () => {
    it('returns only matching category', () => {
      const social = filterByCategory(networks, 'social');
      expect(social.length).toBeGreaterThan(0);
      expect(social.every((n) => n.category === 'social')).toBe(true);
    });

    it('returns empty array for category with no entries', () => {
      const synthetic: AdNetwork[] = [
        { asn: 1, name: 'A', category: 'social', platforms: [], notes: '' },
      ];
      expect(filterByCategory(synthetic, 'mobile')).toEqual([]);
    });
  });

  describe('filterByPlatform', () => {
    it('finds network by exact platform tag', () => {
      const result = filterByPlatform(networks, 'tiktok');
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((n) => n.platforms.includes('tiktok'))).toBe(true);
    });

    it('is case-insensitive', () => {
      const a = filterByPlatform(networks, 'TikTok');
      const b = filterByPlatform(networks, 'tiktok');
      expect(a.map((n) => n.asn).sort()).toEqual(b.map((n) => n.asn).sort());
    });

    it('returns empty for unknown platform', () => {
      expect(filterByPlatform(networks, 'no-such-platform-xyz')).toEqual([]);
    });
  });

  describe('findByAsn', () => {
    it('returns the entry by numeric asn', () => {
      expect(findByAsn(networks, 32934)?.category).toBe('social');
    });

    it('returns undefined for unknown asn', () => {
      expect(findByAsn(networks, 999999999)).toBeUndefined();
    });
  });

  describe('searchNetworks', () => {
    it('matches by name substring', () => {
      const r = searchNetworks(networks, 'goog');
      expect(r.some((n) => n.name === 'Google')).toBe(true);
    });

    it('matches by platform tag', () => {
      const r = searchNetworks(networks, 'youtube');
      expect(r.some((n) => n.asn === 15169)).toBe(true);
    });

    it('matches by ASN number string', () => {
      const r = searchNetworks(networks, '32934');
      expect(r).toHaveLength(1);
      expect(r[0].name).toBe('Meta');
    });

    it('returns full list for empty query', () => {
      expect(searchNetworks(networks, '').length).toBe(networks.length);
      expect(searchNetworks(networks, '   ').length).toBe(networks.length);
    });
  });

  describe('ASN_CATEGORY_LABELS', () => {
    it('has a label for every category', () => {
      for (const c of ASN_CATEGORIES) {
        expect(ASN_CATEGORY_LABELS[c as AsnCategory]).toBeTruthy();
      }
    });
  });
});
