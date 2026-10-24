import { createDialogueSave } from './dialogue-save.js';
import { restoreRoute } from './restore-route.js';
import { installCompanionHome } from './companion-home.js';
import { calibratedPortrait, readPlacements } from './portrait-placement.js';
import { compileStory } from './story-contract.js';
import { CHARACTER_DATA } from './runtime/data/charactersData.js';
import { SCENE_DATA } from './runtime/data/scenesData.js';
import { GRAPHIC_ASSETS } from './runtime/data/graphicsData.js';
import { AUDIO_ASSETS } from './runtime/data/audioData.js';
import { CHARACTER_EXPRESSIONS } from './runtime/data/portraitExpressionsData.js';
const catalog = { characters: CHARACTER_DATA, scenes: SCENE_DATA, graphics: GRAPHIC_ASSETS, audio: AUDIO_ASSETS, expressions: CHARACTER_EXPRESSIONS };
const base = '/stardom/runtime/';
const load = name => import(/* @vite-ignore */ base + name);
const menu = document.querySelector('#start-screen');
installCompanionHome(menu);
const status = document.querySelector('#menu-status');
const select = document.querySelector('#story-select');
const start = document.querySelector('#start-btn'), resume = document.querySelector('#load-btn');
let playing = false;
try {
  const { setLocale } = await load('core/localization.js'); setLocale('zh-Hant');
  const { installGameViewport } = await load('platform/browser/GameViewport.js'); installGameViewport();
  const [{ EventDialoguePlayback }, { DialogueAudio }, { DIALOGUE_DATA }, { DIALOGUE_OPTION_DATA }, { DIALOGUE_REWARD_DATA }, { APPEARANCE_DATA }, { resolveAppearance }] = await Promise.all([
    load('view/EventDialoguePlayback.js'), load('platform/browser/DialogueAudio.js'), load('data/dialogueData.js'), load('data/dialogueOptionsData.js'), load('data/dialogueRewardsData.js'), load('data/appearancesData.js'), load('core/Wardrobe.js'),
  ]);
  const ctrl = createDialogueSave(localStorage, id => resolveAppearance(id, {}, APPEARANCE_DATA));
  const audio = new DialogueAudio();
  let placements = {};
  const playback = new EventDialoguePlayback(document.querySelector('#modal-root'), ctrl, audio,
    (presentation, character, stage, sceneId) => calibratedPortrait(presentation, character, stage, sceneId, placements));
  async function play(restoring) {
    if (playing) return;
    try {
      placements = readPlacements(localStorage, catalog);
      const eventId = restoring ? ctrl.restore() : select.value;
      if (!eventId) { status.textContent = '尚無可繼續的進度。'; return; }
      const lines = DIALOGUE_DATA.filter(l => l.eventId === eventId).sort((a,b) => a.lineOrder-b.lineOrder);
      const cursor = restoring ? ctrl.getDialogueProgress(eventId) : null;
      if (cursor && cursor !== '__end__' && !lines.some(l => l.id === cursor)) throw Error('Saved dialogue ID unavailable');
      if (!restoring) ctrl.start(eventId);
      select.value = eventId;
      playing = true; menu.hidden = true;
      const event = { id: eventId, category: 'main', title: select.selectedOptions[0].textContent };
      const options = DIALOGUE_OPTION_DATA.filter(o => lines.some(l => l.id === o.choiceDialogueId));
      const restoreLines = restoring ? restoreRoute(lines, options, ctrl.snapshot().dialogueChoices, cursor) : [];
      await playback.play(event, '', lines, options, DIALOGUE_REWARD_DATA.filter(r => r.eventId === eventId), null, { restoreLines });
      status.textContent = ctrl.snapshot().completed ? '演出結束，可選擇另一段示範。' : '進度已保存，可按「讀取進度」繼續。';
    } catch (error) { console.error(error); status.textContent = '無法播放或讀取進度，請重新開始。'; }
    finally { audio.stopAll(); playing = false; menu.hidden = false; start.focus(); }
  }
  start.addEventListener('click', () => void play(false));
  resume.addEventListener('click', () => void play(true));
  const aiFile = document.querySelector('#ai-story-file');
  document.querySelector('#ai-story-btn').addEventListener('click', () => { if (!playing) aiFile.click(); });
  aiFile.addEventListener('change', async () => {
    const file = aiFile.files[0];
    aiFile.value = '';
    if (!file || playing) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw Error('劇本檔超過 2MB');
      const compiled = compileStory(JSON.parse(await file.text()), catalog, readPlacements(localStorage, catalog));
      // Imported scripts are isolated from the demonstration save and its rewards.
      const memory = new Map();
      const isolated = createDialogueSave({ getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) }, id => resolveAppearance(id, {}, APPEARANCE_DATA));
      const eventId = compiled.runtime.dialogue[0].eventId;
      isolated.start(eventId);
      playing = true; menu.hidden = true;
      const aiPlayback = new EventDialoguePlayback(document.querySelector('#modal-root'), isolated, audio);
      await aiPlayback.play({ id: eventId, category: 'main', title: 'AI 劇本' }, '', compiled.runtime.dialogue, compiled.runtime.dialogueOptions, [], null, { showLineNumbers: true });
      status.textContent = 'AI 劇本播放結束；示範劇情進度未修改。';
    } catch (error) { console.error(error); status.textContent = 'AI 劇本無法播放：' + error.message; }
    finally { audio.stopAll(); playing = false; menu.hidden = false; start.focus(); }
  });
  window.addEventListener('pagehide', () => audio.stopAll());
} catch (error) {
  console.error(error); status.textContent = '對話系統載入失敗，請重新整理。'; start.disabled = true; resume.disabled = true;
}
