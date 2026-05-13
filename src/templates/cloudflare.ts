import type { Template } from '@shared/types';

export const cfWafIncludeSet: Template = {
  id: 'cf.waf.include_set',
  name: 'WAF Include Set',
  category: 'cloudflare',
  inputType: 'country',
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
  inputType: 'country',
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
  inputType: 'country',
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

export const cfWafAsnIncludeSet: Template = {
  id: 'cf.waf.asn_include_set',
  name: 'WAF Include Set (ASN)',
  category: 'cloudflare',
  inputType: 'asn',
  description: 'Cloudflare WAF expression: allow listed ASNs',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.asnInclude : ctx.asnExclude;
    if (codes.length === 0) return '';
    const nums = codes.map((c) => Number(c)).filter((n) => Number.isFinite(n));
    return `(ip.geoip.asnum in {${nums.join(' ')}})`;
  },
};

export const cfWafAsnExcludeSet: Template = {
  id: 'cf.waf.asn_exclude_set',
  name: 'WAF Exclude Set (ASN)',
  category: 'cloudflare',
  inputType: 'asn',
  description: 'Cloudflare WAF expression: block listed ASNs',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.asnInclude : ctx.asnExclude;
    if (codes.length === 0) return '';
    const nums = codes.map((c) => Number(c)).filter((n) => Number.isFinite(n));
    return `not (ip.geoip.asnum in {${nums.join(' ')}})`;
  },
};

export const cfWorkersAsnSnippet: Template = {
  id: 'cf.workers.asn_snippet',
  name: 'Workers Snippet (ASN)',
  category: 'cloudflare',
  inputType: 'asn',
  description: 'Cloudflare Workers ASN check snippet',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.asnInclude : ctx.asnExclude;
    if (codes.length === 0) return '// No ASNs selected';
    const setItems = codes
      .map((c) => Number(c))
      .filter((n) => Number.isFinite(n))
      .join(', ');

    if (ctx.mode === 'allow') {
      return `const ALLOW_ASN = new Set([${setItems}]);

export default {
  async fetch(request) {
    const asn = request.cf?.asn;
    if (!ALLOW_ASN.has(asn)) {
      return new Response('Blocked', { status: 403 });
    }
    return fetch(request);
  },
};`;
    }

    return `const BLOCK_ASN = new Set([${setItems}]);

export default {
  async fetch(request) {
    const asn = request.cf?.asn;
    if (BLOCK_ASN.has(asn)) {
      return new Response('Blocked', { status: 403 });
    }
    return fetch(request);
  },
};`;
  },
};
