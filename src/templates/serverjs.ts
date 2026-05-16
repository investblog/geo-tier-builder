import type { Template } from '@shared/types';

export const nginxMap: Template = {
  id: 'server.nginx.map',
  name: 'nginx map',
  category: 'server',
  inputType: 'country',
  description: 'nginx geo map block',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    if (codes.length === 0) return '# No countries selected';

    const entries = codes.map((c) => `    ${c} 1;`).join('\n');
    const varName = ctx.mode === 'allow' ? '$geo_allow' : '$geo_block';

    return `map $geoip2_data_country_code ${varName} {
    default 0;
${entries}
}`;
  },
};

export const jsCondition: Template = {
  id: 'js.condition',
  name: 'JS Condition',
  category: 'server',
  inputType: 'country',
  description: 'JavaScript Set-based country check',
  render(ctx) {
    const codes = ctx.mode === 'allow' ? ctx.include : ctx.exclude;
    if (codes.length === 0) return '// No countries selected';

    const setItems = codes.map((c) => `'${c}'`).join(', ');
    const setName = ctx.mode === 'allow' ? 'ALLOWED' : 'BLOCKED';

    return `const ${setName} = new Set([${setItems}]);

if (${ctx.mode === 'allow' ? '!' : ''}${setName}.has(countryCode)) {
  // ${ctx.mode === 'allow' ? 'Country not in allowlist' : 'Country is blocked'}
}`;
  },
};
