import { CHARACTER_DATA } from './runtime/data/charactersData.js';
import { SCENE_DATA } from './runtime/data/scenesData.js';
import { getGraphicAssetUrl } from './runtime/platform/browser/GraphicUrls.js';
import { resolvePortraitGeometry } from './runtime/core/DialogueStage.js';
import { MaruIdleMotion } from './runtime/view/MaruIdleMotion.js';
import { LayeredPortraitMotion } from './runtime/platform/browser/LayeredPortraitMotion.js';
import { APPEARANCE_DATA } from './runtime/data/appearancesData.js';
import { resolveAppearance } from './runtime/core/Wardrobe.js';
import { loadAppearanceProfile } from './runtime/platform/browser/CharacterAppearance.js';
import { defaultPlacement, validatePlacement, readPlacements, placementKey, PLACEMENT_KEY } from './portrait-placement.js';
const $ = id => document.getElementById(id), catalog = { characters: CHARACTER_DATA, scenes: SCENE_DATA };
let profiles = {}, p, g, motion, actorId, drag;
try { profiles = readPlacements(localStorage, catalog); } catch (error) { $('status').textContent = '未載入定位：' + error.message; }
for (const c of CHARACTER_DATA.filter(c => c.portraitGraphicId)) $('character').add(new Option(c.name, c.id));
for (const s of SCENE_DATA) $('scene').add(new Option(s.editorName ?? s.id, s.id));
const actor = () => CHARACTER_DATA.find(c => c.id === $('character').value);
const scene = () => SCENE_DATA.find(s => s.id === $('scene').value);
const key = () => placementKey(actor().id, scene().id);
const controls = { scale: 'scale', groundValue: 'ground', xOffset: 'xOffset', anchorX: 'anchorX', anchorY: 'anchorY' };
function sync() { for (const [id, field] of Object.entries(controls)) $(id).value = String(Math.round(p[field] * 100) / 100); }
function draw(freeze = false) {
  const c = actor(), s = scene(), position = $('position').value;
  const x = (position === 'left' ? 22 : position === 'right' ? 78 : 50) + p.xOffset;
  const metrics = { ...c, portraitAnchorXPx: p.anchorX, portraitAnchorYPx: p.anchorY };
  if (!freeze) {
    g = resolvePortraitGeometry({ xPercent: x, yPercent: 100, scalePercent: p.scale }, metrics, { ...s, standingLineYPercent: p.ground });
    Object.assign($('actor').style, { left: g.leftPx + 'px', top: g.topPx + 'px', width: g.widthPx + 'px', height: g.heightPx + 'px' });
  }
  $('ground').style.top = 666 * p.ground / 100 + 'px';
  $('anchor').style.left = g.leftPx + p.anchorX * g.scale + 'px';
  $('anchor').style.top = g.topPx + p.anchorY * g.scale + 'px';
  $('world').style.backgroundImage = `url("${getGraphicAssetUrl(s.backgroundGraphicId)}")`;
  $('warning').textContent = [g.topPx < 0 ? '頭部可能裁切，請縮小角色或調整地面。' : '', p.anchorY > (c.portraitCanvasHeightPx ?? 840) ? '目前使用畫布外虛擬腳底；素材未補畫。' : '', c.portraitMetricsEstimated ? '原素材錨點仍為估算，請用紅點目視校準腳底。' : ''].filter(Boolean).join(' ');
}
async function load() {
  p = { ...(profiles[key()] ?? defaultPlacement(actor(), scene())) }; sync(); draw(); $('save').disabled = false;
  if (actorId !== actor().id) {
    actorId = actor().id; motion?.dispose(); $('actor').replaceChildren();
    const appearance = resolveAppearance(actorId, {}, APPEARANCE_DATA), c = { ...actor(), ...appearance };
    const img = new Image(); img.className = 'dialogue-portrait-fallback'; img.src = getGraphicAssetUrl(c.portraitGraphicId); img.alt = c.name; $('actor').append(img);
    if (c.motionProfileId === 'maru-idle-v4') { motion = new MaruIdleMotion($('actor'), true, undefined, undefined, undefined, () => loadAppearanceProfile(c.motionManifestGraphicId)); }
    else if (c.motionProfileId === 'layered-idle-v1') motion = new LayeredPortraitMotion($('actor'), c.motionManifestGraphicId);
  }
  $('status').textContent = profiles[key()] ? '已載入此角色＋場景的本機定位。' : '未校準：採腳底落地的初始定位，請目視調整後保存。';
}
for (const id of ['character', 'scene']) $(id).addEventListener('change', () => { void load(); });
$('position').addEventListener('change', () => draw());
$('show-guide').addEventListener('change', () => { $('dialogue-guide').hidden = !$('show-guide').checked; });
for (const [id, field] of Object.entries(controls)) $(id).addEventListener('input', () => {
  try { const candidate = validatePlacement({ ...p, [field]: Number($(id).value) }); p = candidate; draw(); $('save').disabled = false; $('status').textContent = '尚未保存'; }
  catch (error) { $('save').disabled = true; $('status').textContent = error.message; }
});
$('layer').addEventListener('pointerdown', event => {
  const mode = event.target.closest('#anchor') ? 'anchor' : event.target.closest('#ground') ? 'ground' : event.target.closest('#actor') ? 'actor' : null;
  if (!mode) return; event.preventDefault(); $('layer').setPointerCapture(event.pointerId);
  drag = { mode, x: event.clientX, y: event.clientY, p: { ...p }, screenScale: $('world').getBoundingClientRect().width / 1280, assetScale: g.scale };
});
$('layer').addEventListener('pointermove', event => {
  if (!drag) return;
  const dx = (event.clientX - drag.x) / drag.screenScale, dy = (event.clientY - drag.y) / drag.screenScale;
  const candidate = { ...drag.p };
  if (drag.mode === 'anchor') { candidate.anchorX += dx / drag.assetScale; candidate.anchorY += dy / drag.assetScale; }
  else { candidate.ground += dy / 666 * 100; if (drag.mode === 'actor') candidate.xOffset += dx / 1280 * 100; }
  try { p = validatePlacement(candidate); sync(); draw(drag.mode === 'anchor'); $('save').disabled = false; $('status').textContent = '尚未保存'; } catch { /* Keep the last valid drag point. */ }
});
for (const name of ['pointerup', 'pointercancel']) $('layer').addEventListener(name, () => { if (drag) { drag = null; draw(); } });
$('save').addEventListener('click', () => {
  try {
    const latest = readPlacements(localStorage, catalog); latest[key()] = validatePlacement(p);
    const previous = localStorage.getItem(PLACEMENT_KEY); if (previous) localStorage.setItem(PLACEMENT_KEY + ':previous', previous);
    localStorage.setItem(PLACEMENT_KEY, JSON.stringify({ version: 1, profiles: latest })); profiles = latest;
    $('status').textContent = '已保存此角色＋場景。下次正式遊戲播放會套用；AI 試播頁請重新檢查劇本。劇情內容與進度存檔未修改。';
  } catch (error) { $('status').textContent = '未保存：' + error.message; }
});
$('reset').addEventListener('click', () => { p = defaultPlacement(actor(), scene()); sync(); draw(); $('save').disabled = false; $('status').textContent = '已恢復自動落地，尚未保存。'; });
$('export').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, profiles }, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'portrait-placement.json'; a.click(); URL.revokeObjectURL(url);
});
$('import').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', async () => {
  try { const text = await $('file').files[0].text(); const imported = readPlacements({ getItem: () => text }, catalog); profiles = { ...profiles, ...imported }; await load(); $('status').textContent = '備份已載入草稿；此角色＋場景須按保存才生效。'; }
  catch (error) { $('status').textContent = '匯入失敗：' + error.message; } finally { $('file').value = ''; }
});
new ResizeObserver(() => { const s = $('preview').clientWidth / 1280; $('world').style.transform = `scale(${s})`; $('preview').style.height = 720 * s + 'px'; }).observe($('preview'));
window.addEventListener('beforeunload', () => motion?.dispose());
void load();
