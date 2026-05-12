import type { AdNetwork, AsnCategory } from '@shared/types';

export const ASN_CATEGORIES: readonly AsnCategory[] = ['social', 'search', 'native', 'mobile', 'cis'];

export function getEffectiveNetworks(builtin: AdNetwork[], custom: AdNetwork[]): AdNetwork[] {
  const customByAsn = new Map(custom.map((n) => [n.asn, n]));
  const result: AdNetwork[] = [];
  for (const b of builtin) {
    const override = customByAsn.get(b.asn);
    if (override) {
      if (!override.disabled) result.push(override);
      customByAsn.delete(b.asn);
    } else {
      result.push(b);
    }
  }
  for (const c of customByAsn.values()) {
    if (!c.disabled) result.push(c);
  }
  return result;
}

export const ASN_CATEGORY_LABELS: Record<AsnCategory, string> = {
  social: 'Social',
  search: 'Search & Display',
  native: 'Native / Retargeting',
  mobile: 'Mobile Apps',
  cis: 'CIS',
};

export function filterByCategory(networks: AdNetwork[], category: AsnCategory): AdNetwork[] {
  return networks.filter((n) => n.category === category);
}

export function filterByPlatform(networks: AdNetwork[], platform: string): AdNetwork[] {
  const p = platform.toLowerCase();
  return networks.filter((n) => n.platforms.some((x) => x.toLowerCase() === p));
}

export function findByAsn(networks: AdNetwork[], asn: number): AdNetwork | undefined {
  return networks.find((n) => n.asn === asn);
}

export function searchNetworks(networks: AdNetwork[], query: string): AdNetwork[] {
  const q = query.trim().toLowerCase();
  if (!q) return networks;
  const asNum = Number(q);
  return networks.filter(
    (n) =>
      n.name.toLowerCase().includes(q) ||
      n.platforms.some((p) => p.toLowerCase().includes(q)) ||
      (!Number.isNaN(asNum) && n.asn === asNum),
  );
}
