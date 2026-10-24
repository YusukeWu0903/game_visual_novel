import { compileStory } from './story-contract.js';
import { CHARACTER_DATA } from './runtime/data/charactersData.js';
import { SCENE_DATA } from './runtime/data/scenesData.js';
import { GRAPHIC_ASSETS } from './runtime/data/graphicsData.js';
import { AUDIO_ASSETS } from './runtime/data/audioData.js';
import { CHARACTER_EXPRESSIONS } from './runtime/data/portraitExpressionsData.js';
import { EventDialoguePlayback } from './runtime/view/EventDialoguePlayback.js';
import { DialogueAudio } from './runtime/platform/browser/DialogueAudio.js';
import { createDialogueSave } from './dialogue-save.js';
import { installGameViewport } from './runtime/platform/browser/GameViewport.js';
import { setLocale } from './runtime/core/localization.js';
import { APPEARANCE_DATA } from './runtime/data/appearancesData.js';
import { resolveAppearance } from './runtime/core/Wardrobe.js';
import { readPlacements, PLACEMENT_KEY } from './portrait-placement.js';
setLocale('zh-Hant'); installGameViewport();
const $ = id => document.getElementById(id);
const catalog = { characters: CHARACTER_DATA, scenes: SCENE_DATA, graphics: GRAPHIC_ASSETS, audio: AUDIO_ASSETS, expressions: CHARACTER_EXPRESSIONS };
let compiled, busy = false;
$('source').value = JSON.stringify({ version: 'vn-story/1', script: { eventId: 'format-preview', nodes: [
  { id: 'preview-1', kind: 'dialogue', speakerId: 'Character0001', text: '嗯。', next: 'preview-2', stage: { actorId: 'Character0001', command: 'show', position: 'left' } },
  { id: 'preview-2', kind: 'narration', text: '這是獨立格式測試，不是正式劇情。旁白不設字數硬上限，但仍需要在實際遊戲畫面檢查是否能完整顯示。', next: 'preview-3' },
  { id: 'preview-3', kind: 'choice', text: '選擇一條測試路線。', next: null, options: [{ id: 'preview-option-1', text: '保留短句', next: 'preview-4' }, { id: 'preview-option-2', text: '先確認完整語意，再檢查選項是否能完整顯示', next: 'preview-4' }] },
  { id: 'preview-4', kind: 'dialogue', speakerId: 'Character0001', text: '兩條路線在這裡回接，這段測試不會寫入你的存檔。', next: null }
] }, review: [{ nodeId: 'preview-1', message: '短句可保留；此意見不會成為角色台詞。' }] }, null, 2);
$('source').addEventListener('input', () => { compiled = null; $('play').disabled = true; });
$('check').addEventListener('click', () => {
  try {
    compiled = compileStory(JSON.parse($('source').value), catalog, readPlacements(localStorage, catalog));
    $('draft').textContent = compiled.readingDraft;
    $('review').textContent = compiled.review.map(r => `${r.nodeId ?? '整體'}：${r.message}`).join('\n');
    $('status').textContent = '結構檢查通過；尚待逐頁版面驗收。\n' + compiled.warnings.map(w => `${w.nodeId}：${w.message}`).join('\n');
    $('play').disabled = false;
  } catch (error) {
    compiled = null; $('play').disabled = true; $('draft').textContent = ''; $('review').textContent = '';
    $('status').textContent = '拒收：' + error.message;
  }
});
const layoutMessages = new Set();
const measure = () => {
  for (const el of $('modal-root').querySelectorAll('.event-dialogue-text,.dialogue-choice-option')) {
    if (!el.getClientRects().length || !el.textContent.trim()) continue;
    const clipped = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
    const message = `${clipped ? '溢出，需調整' : '目前文字框未溢出（仍需目視確認）'}：${el.textContent}`;
    layoutMessages.add(message);
  }
  for (const actor of $('modal-root').querySelectorAll('.event-dialogue-portrait.is-visible:not(.is-entering)')) {
    if (!actor.getClientRects().length || !actor.parentElement.getClientRects().length) continue;
    const a = actor.getBoundingClientRect(), p = actor.parentElement.getBoundingClientRect();
    if (p.width === 0 || p.height === 0) continue;
    // A calibrated foot can sit above transparent padding or virtual missing legs.
    // Do not move the actor upward merely to fit the canvas bottom into the frame.
    const clipped = a.top < p.top - 1 || a.left < p.left - 1 || a.right > p.right + 1;
    layoutMessages.add(`${clipped ? '立繪頭部或左右邊界可能裁切' : '頭部及左右邊界正常（腳底依定位設定，仍需目視校準）'}：${actor.dataset.characterId ?? '角色'}／${$('frame-size').value}`);
  }
  $('layout').textContent = [...layoutMessages].slice(-30).join('\n');
};
let pending;
new MutationObserver(() => { clearTimeout(pending); pending = setTimeout(measure, 300); }).observe($('modal-root'), { childList: true, subtree: true, characterData: true });
window.addEventListener('resize', measure);
$('frame-size').addEventListener('change', () => {
  const [w, h] = $('frame-size').value.split('x');
  document.documentElement.style.setProperty('--review-width', w === 'auto' ? '100vw' : w + 'px');
  document.documentElement.style.setProperty('--review-height', h ? h + 'px' : '100vh');
  setTimeout(measure, 900);
});
$('play').addEventListener('click', async () => {
  if (!compiled || busy) return;
  busy = true; $('play').disabled = true; clearTimeout(pending); layoutMessages.clear(); $('layout').textContent = '';
  const memory = new Map();
  const ctrl = createDialogueSave({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }, id => resolveAppearance(id, {}, APPEARANCE_DATA));
  const audio = new DialogueAudio();
  try {
    const data = compiled.runtime;
    await new EventDialoguePlayback($('modal-root'), ctrl, audio).play({ id: data.dialogue[0].eventId, category: 'main', title: '格式測試' }, '', data.dialogue, data.dialogueOptions, [], null, { nonPersisting: true, showLineNumbers: true });
  } catch (error) { $('status').textContent = '試播失敗：' + error.message; }
  finally { audio.stopAll(); busy = false; $('play').disabled = !compiled; }
});
window.addEventListener('storage', event => {
  if (event.key === PLACEMENT_KEY) { compiled = null; $('play').disabled = true; $('status').textContent = '定位設定已更新，請重新按檢查格式後試播。'; }
});
