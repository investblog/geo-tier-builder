import { browser } from 'wxt/browser';

export function t(key: string, ...substitutions: string[]): string {
  const msg = browser.i18n.getMessage(key as any, substitutions.length > 0 ? substitutions : undefined);
  return msg || key;
}

export function tPlural(count: number, oneKey: string, otherKey: string): string {
  return t(count === 1 ? oneKey : otherKey, String(count));
}
