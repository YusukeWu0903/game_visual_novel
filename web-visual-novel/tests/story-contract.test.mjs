import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileStory, STORY_VERSION, safePortraitFrame } from '../public/stardom/story-contract.js';
import { resolvePortraitGeometry } from '../public/stardom/runtime/core/DialogueStage.js';
import { CHARACTER_DATA } from '../public/stardom/runtime/data/charactersData.js';
import { SCENE_DATA } from '../public/stardom/runtime/data/scenesData.js';
import { DialogueFlowSession } from '../public/stardom/runtime/core/DialogueFlowSession.js';
import { createDialogueSave } from '../public/stardom/dialogue-save.js';
const catalog = { characters: [{ id: 'actor', name: '測試角色', portraitGraphicId: 'portrait' }], scenes: [], graphics: [], audio: [], expressions: [] };
const sample = () => ({ version: STORY_VERSION, script: { eventId: 'test', nodes: [
  { id: 'a', kind: 'dialogue', speakerId: 'actor', text: '嗯。', next: 'b' },
  { id: 'b', kind: 'narration', text: '旁白'.repeat(80), next: 'c' },
  { id: 'c', kind: 'choice', text: '如何回答？', next: null, options: [{ id: 'yes', text: '答應', next: 'd' }, { id: 'no', text: '先問清楚', next: 'e' }] },
  { id: 'd', kind: 'dialogue', speakerId: 'actor', text: '好。', next: 'f' },
  { id: 'e', kind: 'dialogue', speakerId: 'actor', text: '等等！', next: 'f' },
  { id: 'f', kind: 'narration', text: '對話暫告一段落。', next: null },
] }, review: [{ nodeId: 'a', message: '保留短句，呈現猶豫。' }] });
test('short speech passes as advice; long narration and options require layout review', () => {
  const result = compileStory(sample(), catalog);
  assert.equal(result.runtime.dialogue.length, 6);
  assert.equal(result.runtime.dialogueOptions.length, 2);
  assert.equal(result.warnings.length, 3);
  assert.equal(result.layoutCheck.status, 'required');
  assert.ok(result.readingDraft.includes('嗯。'));
  assert.ok(!JSON.stringify(result.runtime).includes('保留短句'));
});
for (const option of ['yes', 'no']) test(`compiled ${option} branch runs through existing game session`, () => {
  const { runtime } = compileStory(sample(), catalog);
  const memory = new Map(), storage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  const ctrl = createDialogueSave(storage); ctrl.start('test');
  const session = new DialogueFlowSession('test', runtime.dialogue, runtime.dialogueOptions, [], ctrl);
  session.completeLine(session.enterCurrentLine()); session.completeLine(session.enterCurrentLine());
  assert.equal(session.currentLine.id, 'c');
  session.choose(session.currentLine, runtime.dialogueOptions.find(o => o.id === option));
  assert.equal(session.currentLine.id, option === 'yes' ? 'd' : 'e');
  session.completeLine(session.enterCurrentLine()); assert.equal(session.currentLine.id, 'f');
});
test('unknown asset, unsupported expression, missing target, cycles, and extra state mutations rejected', () => {
  for (const mutate of [
    s => { s.script.nodes[0].stage = { backgroundSceneId: 'invented' }; },
    s => { s.script.nodes[0].stage = { expression: 99 }; },
    s => { s.script.nodes[0].next = 'missing'; },
    s => { s.script.nodes[0].next = 'a'; },
    s => { s.script.nodes[0].affection = 100; },
  ]) { const s = sample(); mutate(s); assert.throws(() => compileStory(s, catalog)); }
});
test('safe candidate framing fits left/center/right in all authored scenes without catalog mutation', () => {
  const before = JSON.stringify({ CHARACTER_DATA, SCENE_DATA });
  for (const actor of CHARACTER_DATA.filter(a => a.portraitGraphicId)) for (const pos of ['left', 'center', 'right']) {
    const frame = safePortraitFrame(actor, pos, SCENE_DATA);
    for (const scene of [{}, ...SCENE_DATA]) {
      const g = resolvePortraitGeometry({ xPercent: frame.portraitXPercent, yPercent: frame.portraitYPercent, scalePercent: frame.portraitScalePercent }, actor, { ...scene, standingLineYPercent: frame.standingLineYPercent });
      assert.ok(g.topPx >= 666 * .05 - .001, `${actor.id}/${scene.id}/${pos}: top`);
      assert.ok(g.topPx + g.heightPx <= 666 * .95 + .001, `${actor.id}/${scene.id}/${pos}: bottom`);
      assert.ok(g.leftPx >= 1280 * .03 - .001);
      assert.ok(g.leftPx + g.widthPx <= 1280 * .97 + .001);
    }
  }
  assert.equal(JSON.stringify({ CHARACTER_DATA, SCENE_DATA }), before);
});
