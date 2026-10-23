import { STRING_CATALOG } from '../data/localizationData.js';

export type Locale = 'zh-Hant' | 'zh-Hans';
type StringCatalogEntry = { id: string; context?: string; 'zh-Hant': string; 'zh-Hans': string };
let stringCatalog: readonly StringCatalogEntry[] = STRING_CATALOG;
let catalog = new Map<string, { 'zh-Hant': string; 'zh-Hans': string }>();
function rebuildCatalog(): void {
  catalog = new Map(stringCatalog.map((entry) => [entry.id, { 'zh-Hant': entry['zh-Hant'], 'zh-Hans': entry['zh-Hans'] }]));
}
rebuildCatalog();
let locale: Locale = 'zh-Hant';

export function t(id: string): string { return catalog.get(id)?.[locale] || id; }
export function setStringCatalog(entries: readonly StringCatalogEntry[]): void {
  stringCatalog = entries;
  rebuildCatalog();
}
export function setLocale(next: Locale): void {
  locale = next;
}
export function getLocale(): Locale { return locale; }
export function auditStringCatalog(): string[] { return stringCatalog.filter((item) => !item['zh-Hant'] || !item['zh-Hans']).map((item) => item.id); }
