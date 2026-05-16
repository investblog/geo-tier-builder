import type { Template, TemplateCategory, TemplateInputType } from '@shared/types';
import { cfWafExcludeSet, cfWafIncludeSet, cfWorkersSnippet } from './cloudflare';
import { genericIso2Csv, genericIso2Newline, genericJsonArray, genericKeyValue } from './generic';
import { jsCondition, nginxMap } from './serverjs';
import { t301stIso2Csv } from './t301st';

export const ALL_TEMPLATES: readonly Template[] = [
  t301stIso2Csv,
  genericIso2Csv,
  genericIso2Newline,
  genericJsonArray,
  genericKeyValue,
  cfWafIncludeSet,
  cfWafExcludeSet,
  cfWorkersSnippet,
  nginxMap,
  jsCondition,
];

const templateMap = new Map<string, Template>(ALL_TEMPLATES.map((t) => [t.id, t]));

export const CATEGORIES: readonly TemplateCategory[] = ['301st', 'generic', 'cloudflare', 'server'];

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  '301st': '301.st TDS',
  generic: 'Generic',
  cloudflare: 'Cloudflare',
  server: 'Server / JS',
};

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return ALL_TEMPLATES.filter((t) => t.category === category);
}

export function getTemplatesByCategoryAndInput(category: TemplateCategory, inputType: TemplateInputType): Template[] {
  return ALL_TEMPLATES.filter((t) => t.category === category && t.inputType === inputType);
}

export function getCategoriesForInputType(inputType: TemplateInputType): TemplateCategory[] {
  return CATEGORIES.filter((c) => ALL_TEMPLATES.some((t) => t.category === c && t.inputType === inputType));
}

export function getTemplate(id: string): Template | undefined {
  return templateMap.get(id);
}
