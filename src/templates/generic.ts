import type { Template } from '@shared/types';

export const genericIso2Csv: Template = {
  id: 'generic.iso2.csv',
  name: 'ISO2 CSV',
  category: 'generic',
  inputType: 'country',
  description: 'Comma-separated ISO2 codes',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    return codes.join(',');
  },
};

export const genericIso2Newline: Template = {
  id: 'generic.iso2.newline',
  name: 'ISO2 Newline',
  category: 'generic',
  inputType: 'country',
  description: 'One ISO2 code per line',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    return codes.join('\n');
  },
};

export const genericJsonArray: Template = {
  id: 'generic.json.array',
  name: 'JSON Array',
  category: 'generic',
  inputType: 'country',
  description: 'JSON array of ISO2 codes',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    return JSON.stringify(codes);
  },
};

export const genericKeyValue: Template = {
  id: 'generic.keyvalue',
  name: 'Key=Value',
  category: 'generic',
  inputType: 'country',
  description: 'allow=... and block=... lines',
  render(ctx) {
    const lines: string[] = [];
    if (ctx.include.length > 0) lines.push(`allow=${ctx.include.join(',')}`);
    if (ctx.exclude.length > 0) lines.push(`block=${ctx.exclude.join(',')}`);
    return lines.join('\n');
  },
};

export const genericAsnCsv: Template = {
  id: 'generic.asn.csv',
  name: 'ASN CSV',
  category: 'generic',
  inputType: 'asn',
  description: 'Comma-separated ASN numbers',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.asnInclude : ctx.asnExclude;
    return codes.join(',');
  },
};

export const genericAsnNewline: Template = {
  id: 'generic.asn.newline',
  name: 'ASN Newline',
  category: 'generic',
  inputType: 'asn',
  description: 'One ASN per line',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.asnInclude : ctx.asnExclude;
    return codes.join('\n');
  },
};

export const genericAsnJson: Template = {
  id: 'generic.asn.json',
  name: 'ASN JSON Array',
  category: 'generic',
  inputType: 'asn',
  description: 'JSON array of ASN numbers',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.asnInclude : ctx.asnExclude;
    return JSON.stringify(codes.map((c) => Number(c)));
  },
};
