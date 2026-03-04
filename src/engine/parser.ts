import type { ParseResult } from '@shared/types';
import { BY_ISO2, BY_ISO3, findByAlias } from './countries';

const PHRASE_SEPARATOR = /[,;|\n]+/;
const WORD_SEPARATOR = /\s+/;

function matchToken(token: string): string | null {
  const trimmed = token.trim();
  if (!trimmed) return null;
  const upper = trimmed.toUpperCase();

  // ISO2 exact
  if (upper.length === 2 && BY_ISO2.has(upper)) return upper;

  // ISO3 exact
  if (upper.length === 3 && BY_ISO3.has(upper)) return BY_ISO3.get(upper)!.iso2;

  // Name/alias (case-insensitive)
  const byAlias = findByAlias(trimmed);
  if (byAlias) return byAlias.iso2;

  return null;
}

export function parseCountryInput(input: string): ParseResult {
  // Phase 1: split on delimiters to preserve multi-word names
  const phrases = input
    .split(PHRASE_SEPARATOR)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const matched = new Set<string>();
  const unknown: string[] = [];
  const suggestions = new Map<string, string[]>();

  for (const phrase of phrases) {
    // Try the whole phrase first (handles "United States", "Россия", etc.)
    const phraseMatch = matchToken(phrase);
    if (phraseMatch) {
      matched.add(phraseMatch);
      continue;
    }

    // If phrase has multiple words, try splitting into individual tokens
    const words = phrase.split(WORD_SEPARATOR).filter((w) => w.length > 0);
    if (words.length > 1) {
      // Try each word individually
      let anyMatched = false;
      const phraseUnknowns: string[] = [];

      for (const word of words) {
        const wordMatch = matchToken(word);
        if (wordMatch) {
          matched.add(wordMatch);
          anyMatched = true;
        } else {
          phraseUnknowns.push(word);
        }
      }

      // If no words matched, report the whole phrase as unknown (better UX)
      if (!anyMatched) {
        if (!unknown.includes(phrase)) {
          unknown.push(phrase);
          const sugg = findSuggestions(phrase);
          if (sugg.length > 0) suggestions.set(phrase, sugg);
        }
      } else {
        // Report unmatched words
        for (const w of phraseUnknowns) {
          if (!unknown.includes(w)) {
            unknown.push(w);
            const sugg = findSuggestions(w);
            if (sugg.length > 0) suggestions.set(w, sugg);
          }
        }
      }
    } else {
      // Single word, not matched
      if (!unknown.includes(phrase)) {
        unknown.push(phrase);
        const sugg = findSuggestions(phrase);
        if (sugg.length > 0) suggestions.set(phrase, sugg);
      }
    }
  }

  return {
    matched: [...matched],
    unknown,
    suggestions,
  };
}

function findSuggestions(token: string): string[] {
  const lower = token.toLowerCase();
  const results: string[] = [];

  for (const [, country] of BY_ISO2) {
    if (
      country.name_en.toLowerCase().includes(lower) ||
      country.name_ru.toLowerCase().includes(lower) ||
      country.aliases.some((a) => a.toLowerCase().includes(lower))
    ) {
      results.push(country.iso2);
      if (results.length >= 3) break;
    }
  }

  return results;
}
