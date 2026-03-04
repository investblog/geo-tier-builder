export function toggle(list: string[], code: string): string[] {
  return list.includes(code) ? list.filter((c) => c !== code) : [...list, code];
}

export function add(list: string[], codes: string[]): string[] {
  const set = new Set(list);
  for (const c of codes) set.add(c);
  return [...set];
}

export function remove(list: string[], codes: string[]): string[] {
  const toRemove = new Set(codes);
  return list.filter((c) => !toRemove.has(c));
}

export function clear(): string[] {
  return [];
}

export function invert(list: string[], universe: string[]): string[] {
  const set = new Set(list);
  return universe.filter((c) => !set.has(c));
}

export function selectFiltered(list: string[], filtered: string[]): string[] {
  return add(list, filtered);
}

export function isSelected(list: string[], code: string): boolean {
  return list.includes(code);
}

export function toggleFavorite(favorites: string[], code: string): string[] {
  return toggle(favorites, code);
}
