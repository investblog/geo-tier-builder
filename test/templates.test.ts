import { describe, expect, it } from 'vitest';
import type { RenderContext } from '@shared/types';
import { ALL_TEMPLATES, getTemplate, getTemplatesByCategory } from '../src/templates';

function makeCtx(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    mode: 'allow',
    include: ['US', 'CA', 'GB'],
    exclude: ['RU', 'BY'],
    countries: [],
    ...overrides,
  };
}

describe('templates', () => {
  describe('registry', () => {
    it('has all templates registered', () => {
      expect(ALL_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    });

    it('getTemplate returns correct template', () => {
      const tpl = getTemplate('301st.iso2.csv');
      expect(tpl).toBeDefined();
      expect(tpl!.category).toBe('301st');
    });

    it('getTemplatesByCategory returns correct subset', () => {
      const generic = getTemplatesByCategory('generic');
      expect(generic.length).toBe(4);
      expect(generic.every((t) => t.category === 'generic')).toBe(true);
    });
  });

  describe('301st.iso2.csv', () => {
    it('renders include in allow mode', () => {
      const tpl = getTemplate('301st.iso2.csv')!;
      expect(tpl.render(makeCtx())).toBe('US,CA,GB');
    });

    it('renders exclude in block mode', () => {
      const tpl = getTemplate('301st.iso2.csv')!;
      expect(tpl.render(makeCtx({ mode: 'block' }))).toBe('RU,BY');
    });

    it('renders empty for no selection', () => {
      const tpl = getTemplate('301st.iso2.csv')!;
      expect(tpl.render(makeCtx({ include: [] }))).toBe('');
    });

    it('renders single country', () => {
      const tpl = getTemplate('301st.iso2.csv')!;
      expect(tpl.render(makeCtx({ include: ['DE'] }))).toBe('DE');
    });
  });

  describe('generic.iso2.csv', () => {
    it('renders comma-separated', () => {
      const tpl = getTemplate('generic.iso2.csv')!;
      expect(tpl.render(makeCtx())).toBe('US,CA,GB');
    });
  });

  describe('generic.iso2.newline', () => {
    it('renders newline-separated', () => {
      const tpl = getTemplate('generic.iso2.newline')!;
      expect(tpl.render(makeCtx())).toBe('US\nCA\nGB');
    });
  });

  describe('generic.json.array', () => {
    it('renders JSON array', () => {
      const tpl = getTemplate('generic.json.array')!;
      expect(tpl.render(makeCtx())).toBe('["US","CA","GB"]');
    });
  });

  describe('generic.keyvalue', () => {
    it('renders both allow and block lines', () => {
      const tpl = getTemplate('generic.keyvalue')!;
      const result = tpl.render(makeCtx());
      expect(result).toContain('allow=US,CA,GB');
      expect(result).toContain('block=RU,BY');
    });

    it('omits empty lines', () => {
      const tpl = getTemplate('generic.keyvalue')!;
      const result = tpl.render(makeCtx({ exclude: [] }));
      expect(result).toBe('allow=US,CA,GB');
      expect(result).not.toContain('block');
    });
  });

  describe('cf.waf.include_set', () => {
    it('renders WAF include expression', () => {
      const tpl = getTemplate('cf.waf.include_set')!;
      expect(tpl.render(makeCtx())).toBe('(ip.geoip.country in {"US" "CA" "GB"})');
    });

    it('returns empty for no selection', () => {
      const tpl = getTemplate('cf.waf.include_set')!;
      expect(tpl.render(makeCtx({ include: [] }))).toBe('');
    });
  });

  describe('cf.waf.exclude_set', () => {
    it('renders WAF exclude expression', () => {
      const tpl = getTemplate('cf.waf.exclude_set')!;
      expect(tpl.render(makeCtx())).toBe('not (ip.geoip.country in {"US" "CA" "GB"})');
    });
  });

  describe('cf.workers.snippet', () => {
    it('renders Workers allow snippet', () => {
      const tpl = getTemplate('cf.workers.snippet')!;
      const result = tpl.render(makeCtx());
      expect(result).toContain('const ALLOW = new Set(');
      expect(result).toContain("'US'");
      expect(result).toContain('!ALLOW.has(country)');
    });

    it('renders Workers block snippet', () => {
      const tpl = getTemplate('cf.workers.snippet')!;
      const result = tpl.render(makeCtx({ mode: 'block' }));
      expect(result).toContain('const BLOCK = new Set(');
      expect(result).toContain('BLOCK.has(country)');
    });
  });

  describe('server.nginx.map', () => {
    it('renders nginx map block', () => {
      const tpl = getTemplate('server.nginx.map')!;
      const result = tpl.render(makeCtx());
      expect(result).toContain('map $geoip2_data_country_code $geo_allow');
      expect(result).toContain('US 1;');
      expect(result).toContain('CA 1;');
      expect(result).toContain('default 0;');
    });
  });

  describe('js.condition', () => {
    it('renders JS condition for allow', () => {
      const tpl = getTemplate('js.condition')!;
      const result = tpl.render(makeCtx());
      expect(result).toContain('const ALLOWED = new Set(');
      expect(result).toContain('!ALLOWED.has(countryCode)');
    });

    it('renders JS condition for block', () => {
      const tpl = getTemplate('js.condition')!;
      const result = tpl.render(makeCtx({ mode: 'block' }));
      expect(result).toContain('const BLOCKED = new Set(');
      expect(result).toContain('BLOCKED.has(countryCode)');
    });
  });
});
