import { STRING_CATALOG } from '../data/localizationData.js';
let stringCatalog = STRING_CATALOG;
let catalog = new Map();
function rebuildCatalog() {
    catalog = new Map(stringCatalog.map((entry) => [entry.id, { 'zh-Hant': entry['zh-Hant'], 'zh-Hans': entry['zh-Hans'] }]));
}
rebuildCatalog();
let locale = 'zh-Hant';
export function t(id) { return catalog.get(id)?.[locale] || id; }
export function setStringCatalog(entries) {
    stringCatalog = entries;
    rebuildCatalog();
}
export function setLocale(next) {
    locale = next;
}
export function getLocale() { return locale; }
export function auditStringCatalog() { return stringCatalog.filter((item) => !item['zh-Hant'] || !item['zh-Hans']).map((item) => item.id); }
