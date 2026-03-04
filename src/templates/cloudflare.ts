import type { Template } from '@shared/types';

export const cfWafIncludeSet: Template = {
  id: 'cf.waf.include_set',
  name: 'WAF Include Set',
  category: 'cloudflare',
  description: 'Cloudflare WAF expression: allow listed countries',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    if (codes.length === 0) return '';
    const quoted = codes.map((c) => `"${c}"`).join(' ');
    return `(ip.geoip.country in {${quoted}})`;
  },
};

export const cfWafExcludeSet: Template = {
  id: 'cf.waf.exclude_set',
  name: 'WAF Exclude Set',
  category: 'cloudflare',
  description: 'Cloudflare WAF expression: block listed countries',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    if (codes.length === 0) return '';
    const quoted = codes.map((c) => `"${c}"`).join(' ');
    return `not (ip.geoip.country in {${quoted}})`;
  },
};

export const cfWorkersSnippet: Template = {
  id: 'cf.workers.snippet',
  name: 'Workers Snippet',
  category: 'cloudflare',
  description: 'Cloudflare Workers geo check snippet',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    if (codes.length === 0) return '// No countries selected';
    const setItems = codes.map((c) => `'${c}'`).join(', ');

    if (ctx.mode === 'allow') {
      return `const ALLOW = new Set([${setItems}]);

export default {
  async fetch(request) {
    const country = request.cf?.country || '';
    if (!ALLOW.has(country)) {
      return new Response('Blocked', { status: 403 });
    }
    return fetch(request);
  },
};`;
    }

    return `const BLOCK = new Set([${setItems}]);

export default {
  async fetch(request) {
    const country = request.cf?.country || '';
    if (BLOCK.has(country)) {
      return new Response('Blocked', { status: 403 });
    }
    return fetch(request);
  },
};`;
  },
};
