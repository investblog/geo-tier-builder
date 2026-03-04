import type { Template } from '@shared/types';

export const t301stIso2Csv: Template = {
  id: '301st.iso2.csv',
  name: '301.st ISO2 CSV',
  category: '301st',
  description: 'Comma-separated ISO2 codes for 301.st TDS geo/geo_exclude fields',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    return codes.join(',');
  },
};
