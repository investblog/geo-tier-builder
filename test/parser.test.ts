import { describe, expect, it } from 'vitest';
import { parseCountryInput } from '@engine/parser';

describe('parser', () => {
  describe('ISO2 matching', () => {
    it('matches uppercase ISO2', () => {
      const result = parseCountryInput('US,CA,GB');
      expect(result.matched).toEqual(['US', 'CA', 'GB']);
      expect(result.unknown).toEqual([]);
    });

    it('matches lowercase ISO2', () => {
      const result = parseCountryInput('us, ca');
      expect(result.matched).toContain('US');
      expect(result.matched).toContain('CA');
    });

    it('matches mixed case', () => {
      const result = parseCountryInput('Us,cA');
      expect(result.matched).toContain('US');
      expect(result.matched).toContain('CA');
    });
  });

  describe('ISO3 matching', () => {
    it('matches ISO3 codes', () => {
      const result = parseCountryInput('USA,DEU,GBR');
      expect(result.matched).toContain('US');
      expect(result.matched).toContain('DE');
      expect(result.matched).toContain('GB');
    });
  });

  describe('name matching', () => {
    it('matches English names', () => {
      const result = parseCountryInput('United States');
      expect(result.matched).toContain('US');
    });

    it('matches Russian names', () => {
      const result = parseCountryInput('Россия');
      expect(result.matched).toContain('RU');
    });

    it('matches aliases', () => {
      const result = parseCountryInput('America');
      expect(result.matched).toContain('US');
    });
  });

  describe('separators', () => {
    it('handles commas', () => {
      const result = parseCountryInput('US,CA,GB');
      expect(result.matched.length).toBe(3);
    });

    it('handles semicolons', () => {
      const result = parseCountryInput('US;CA;GB');
      expect(result.matched.length).toBe(3);
    });

    it('handles pipes', () => {
      const result = parseCountryInput('US|CA|GB');
      expect(result.matched.length).toBe(3);
    });

    it('handles newlines', () => {
      const result = parseCountryInput('US\nCA\nGB');
      expect(result.matched.length).toBe(3);
    });

    it('handles mixed separators', () => {
      const result = parseCountryInput('US, CA; GB|DE');
      expect(result.matched.length).toBe(4);
    });
  });

  describe('deduplication', () => {
    it('deduplicates same code', () => {
      const result = parseCountryInput('US, US, US');
      expect(result.matched).toEqual(['US']);
    });

    it('deduplicates ISO2 and ISO3 for same country', () => {
      const result = parseCountryInput('US, USA');
      expect(result.matched).toEqual(['US']);
    });
  });

  describe('unknown tokens', () => {
    it('reports unknown tokens', () => {
      const result = parseCountryInput('US, xyz, CA');
      expect(result.matched).toContain('US');
      expect(result.matched).toContain('CA');
      expect(result.unknown).toContain('xyz');
    });

    it('deduplicates unknown tokens', () => {
      const result = parseCountryInput('xyz, xyz');
      expect(result.unknown).toEqual(['xyz']);
    });
  });

  describe('empty input', () => {
    it('handles empty string', () => {
      const result = parseCountryInput('');
      expect(result.matched).toEqual([]);
      expect(result.unknown).toEqual([]);
    });

    it('handles whitespace only', () => {
      const result = parseCountryInput('   ');
      expect(result.matched).toEqual([]);
      expect(result.unknown).toEqual([]);
    });
  });

  describe('mixed input (acceptance test)', () => {
    it('parses messy input correctly', () => {
      const result = parseCountryInput('us, United States; DEU; Россия, xyz');
      expect(result.matched).toContain('US');
      expect(result.matched).toContain('DE');
      expect(result.matched).toContain('RU');
      expect(result.unknown).toContain('xyz');
      // "United" and "States" may be separate unknown tokens since tokenizer splits on spaces
    });
  });
});
