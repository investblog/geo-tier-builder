/**
 * TDS path-regex helper (pure, no DOM).
 *
 * The 301.st TDS worker evaluates a rule's `path` condition as:
 *   new RegExp(conditions.path).test(url.pathname)
 * i.e. an UNANCHORED substring test against the pathname only (no query,
 * no host). Rules run priority DESC and the FIRST match wins; an empty
 * `path` matches every request. This module generates correct patterns
 * for that contract and tests them with the exact same semantics.
 */

export type AnchorMode = 'exact' | 'prefix' | 'contains' | 'ends';

const META = /[.*+?^${}()|[\]\\/]/g;

/** Escape regex metacharacters (and `/`) in a literal slug segment. */
export function escapeRegexLiteral(s: string): string {
  return s.replace(META, '\\$&');
}

/**
 * Trim whitespace and a single leading/trailing slash. Case is preserved —
 * the worker's `.test()` is case-sensitive against `url.pathname`.
 */
export function normalizeSlug(raw: string): string {
  return raw.trim().replace(/^\/+/, '').replace(/\/+$/, '');
}

/** Parse a free-form slug field (comma/newline/space separated), dedupe, keep order. */
export function parseSlugs(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\s,\n]+/)) {
    const slug = normalizeSlug(part);
    if (slug && !seen.has(slug)) {
      seen.add(slug);
      out.push(slug);
    }
  }
  return out;
}

/**
 * Build a TDS `path` regex from cleaned slugs.
 *   0 slugs           -> '' (empty = matches everything)
 *   exact   1 / N     -> ^/<e>$            / ^/(<a>|<b>)$
 *   prefix  1 / N     -> ^/<e>             / ^/(<a>|<b>)
 *   contains 1 / N    -> /<e>              / /(<a>|<b>)
 *   ends    1 / N     -> /<e>$             / /(<a>|<b>)$
 * The leading `/` is always inside the pattern (TDS matches url.pathname,
 * which always starts with `/`).
 */
export function buildPathRegex(slugs: string[], anchor: AnchorMode): string {
  if (slugs.length === 0) return '';
  const escaped = slugs.map(escapeRegexLiteral);
  const body = escaped.length === 1 ? escaped[0] : `(${escaped.join('|')})`;
  switch (anchor) {
    case 'exact':
      return `^/${body}$`;
    case 'prefix':
      return `^/${body}`;
    case 'ends':
      return `/${body}$`;
    default:
      return `/${body}`;
  }
}

/** Catch-all pattern. Pair with a UI note: this rule must have the LOWEST priority. */
export function buildCatchAll(): string {
  return '.*';
}

/**
 * Reduce a user-pasted value to what the worker actually tests: `url.pathname`.
 * Accepts a full URL ("https://x.com/a/b?q#h" -> "/a/b"), a bare slug
 * ("vavada" -> "/vavada"), or an already-rooted path ("/x" -> "/x").
 */
export function extractPathname(input: string): string {
  const v = input.trim();
  if (!v) return '/';
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(v)) return new URL(v).pathname || '/';
  } catch {
    // fall through to manual handling
  }
  // strip query/hash, ensure leading slash
  const noFrag = v.split(/[?#]/)[0];
  return noFrag.startsWith('/') ? noFrag : `/${noFrag}`;
}

export interface TestResult {
  ok: boolean;
  matched: boolean;
  error?: string;
}

/**
 * Mirror the worker EXACTLY: raw `new RegExp(src).test(pathname)` — no added
 * anchors, pathname-only. Invalid regex returns { ok:false } instead of throwing.
 */
export function testPathname(regexSource: string, pathnameInput: string): TestResult {
  const pathname = extractPathname(pathnameInput);
  try {
    return { ok: true, matched: new RegExp(regexSource).test(pathname) };
  } catch (e) {
    return { ok: false, matched: false, error: e instanceof Error ? e.message : String(e) };
  }
}
