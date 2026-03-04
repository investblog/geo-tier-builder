import { describe, expect, it } from 'vitest';
import { add, clear, invert, isSelected, remove, selectFiltered, toggle, toggleFavorite } from '@engine/selection';

describe('selection', () => {
  describe('toggle', () => {
    it('adds code if not present', () => {
      expect(toggle([], 'US')).toEqual(['US']);
    });

    it('removes code if present', () => {
      expect(toggle(['US', 'CA'], 'US')).toEqual(['CA']);
    });
  });

  describe('add', () => {
    it('adds new codes', () => {
      expect(add(['US'], ['CA', 'GB'])).toEqual(['US', 'CA', 'GB']);
    });

    it('deduplicates', () => {
      expect(add(['US', 'CA'], ['CA', 'GB'])).toEqual(['US', 'CA', 'GB']);
    });

    it('handles empty input', () => {
      expect(add(['US'], [])).toEqual(['US']);
    });
  });

  describe('remove', () => {
    it('removes specified codes', () => {
      expect(remove(['US', 'CA', 'GB'], ['US', 'GB'])).toEqual(['CA']);
    });

    it('handles codes not in list', () => {
      expect(remove(['US'], ['CA'])).toEqual(['US']);
    });
  });

  describe('clear', () => {
    it('returns empty array', () => {
      expect(clear()).toEqual([]);
    });
  });

  describe('invert', () => {
    it('inverts selection within universe', () => {
      const universe = ['US', 'CA', 'GB', 'DE'];
      expect(invert(['US', 'DE'], universe)).toEqual(['CA', 'GB']);
    });

    it('selects all when empty', () => {
      expect(invert([], ['US', 'CA'])).toEqual(['US', 'CA']);
    });

    it('clears when all selected', () => {
      expect(invert(['US', 'CA'], ['US', 'CA'])).toEqual([]);
    });
  });

  describe('selectFiltered', () => {
    it('adds all filtered to existing selection', () => {
      expect(selectFiltered(['US'], ['CA', 'GB'])).toEqual(['US', 'CA', 'GB']);
    });
  });

  describe('isSelected', () => {
    it('returns true for present code', () => {
      expect(isSelected(['US', 'CA'], 'US')).toBe(true);
    });

    it('returns false for absent code', () => {
      expect(isSelected(['US', 'CA'], 'GB')).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('adds favorite', () => {
      expect(toggleFavorite([], 'US')).toEqual(['US']);
    });

    it('removes favorite', () => {
      expect(toggleFavorite(['US', 'CA'], 'US')).toEqual(['CA']);
    });
  });
});
