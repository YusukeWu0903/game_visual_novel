// Reduced adapter of Stardom's foot-anchor calibration model; no workbook writes.
import { resolvePortraitGeometry } from './runtime/core/DialogueStage.js';
import { PORTRAIT_PLACEMENT_DEFAULTS } from './portrait-placement-defaults.js';
export const PLACEMENT_KEY = 'vn-portrait-placement-v1';
export const placementKey = (characterId, sceneId) => `${characterId}@${sceneId ?? 'none'}`;
// Runtime-only projection. No matching profile means exactly the original geometry.
export function calibratedPortrait(presentation, character, stage, sceneId, profiles) {
  const saved = profiles[placementKey(character.id, sceneId)];
  if (!saved) return { presentation, character, stage };
  const p = validatePlacement(saved);
  return {
    presentation: { ...presentation, xPercent: presentation.xPercent + p.xOffset, yPercent: 100, scalePercent: p.scale },
    character: { ...character, portraitAnchorXPx: p.anchorX, portraitAnchorYPx: p.anchorY },
    stage: { ...stage, standingLineYPercent: p.ground },
  };
}
export function validatePlacement(p) {
  const fields = { ground: [0, 150], scale: [10, 300], xOffset: [-20, 20], anchorX: [-10000, 10000], anchorY: [-10000, 10000] };
  if (!p || Object.keys(p).some(k => !Object.hasOwn(fields, k))) throw Error('定位設定含未知欄位');
  for (const [key, [min, max]] of Object.entries(fields)) if (!Number.isFinite(p[key]) || p[key] < min || p[key] > max) throw Error(`定位數值無效：${key}`);
  return { ...p };
}
export function defaultPlacement(actor, scene = {}) {
  const body = actor.portraitBodyHeightPx ?? 840, ay = actor.portraitAnchorYPx ?? 840;
  const fraction = actor.portraitAnchorType === 0 ? 1 : actor.portraitAnchorType === 1 ? .5 : 0;
  const factor = (scene.portraitHeightPercent ?? 100) / 100 * (actor.heightCm ?? scene.portraitReferenceHeightCm ?? 170) / (scene.portraitReferenceHeightCm ?? 170);
  // Feet stay at the ground. Only scale down when the estimated head would leave the frame.
  const ground = Math.min(scene.standingLineYPercent ?? 100, 100);
  const fit = (ground / 100 - .05) * body / ((ay + body * fraction) * factor) * 100;
  return validatePlacement({ ground, scale: Math.max(10, Math.min(actor.defaultScalePercent ?? 100, fit)), xOffset: 0, anchorX: actor.portraitAnchorXPx ?? 180, anchorY: ay });
}
export function placedFrame(actor, position, scene = {}, saved) {
  const p = saved ? validatePlacement(saved) : defaultPlacement(actor, scene);
  const x = (position === 'left' ? 22 : position === 'right' ? 78 : 50) + p.xOffset;
  const calibrated = { ...actor, portraitAnchorXPx: p.anchorX, portraitAnchorYPx: p.anchorY };
  const geometry = resolvePortraitGeometry({ xPercent: x, yPercent: 100, scalePercent: p.scale }, calibrated, { ...scene, standingLineYPercent: p.ground });
  const s = geometry.scale, body = actor.portraitBodyHeightPx ?? actor.portraitCanvasHeightPx ?? 840;
  const fraction = actor.portraitAnchorType === 0 ? 1 : actor.portraitAnchorType === 1 ? .5 : 0;
  // Translate calibrated anchors into existing playback line fields. Shared actors stay immutable.
  const originalAnchorX = actor.portraitAnchorXPx ?? 180, originalAnchorY = actor.portraitAnchorYPx ?? 840;
  const anchorY = geometry.topPx + originalAnchorY * s + body * fraction * s;
  return { standingLineYPercent: p.ground, portraitXPercent: (geometry.leftPx + originalAnchorX * s) / 1280 * 100,
    portraitYPercent: 100 + anchorY / 666 * 100 - p.ground, portraitScalePercent: p.scale };
}
export function readPlacements(storage, catalog) {
  const raw = storage.getItem(PLACEMENT_KEY);
  if (!raw) return structuredClone(PORTRAIT_PLACEMENT_DEFAULTS);
  const doc = JSON.parse(raw);
  if (doc.version !== 1 || !doc.profiles || typeof doc.profiles !== 'object' || Array.isArray(doc.profiles)) throw Error('定位資料版本或格式無效');
  const validKeys = new Set(catalog.characters.flatMap(c => [null, ...catalog.scenes.map(s => s.id)].map(s => placementKey(c.id, s))));
  const result = structuredClone(PORTRAIT_PLACEMENT_DEFAULTS);
  for (const [key, value] of Object.entries(doc.profiles)) { if (!validKeys.has(key)) throw Error('定位資料含未知角色或場景'); result[key] = validatePlacement(value); }
  return result;
}
