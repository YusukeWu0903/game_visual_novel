// Versioned AI authoring envelope. Reviews never enter the playback tables.
import { placedFrame, placementKey } from './portrait-placement.js';
export const STORY_VERSION = 'vn-story/1';
const keys = (value, allowed, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(`${label}: expected object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw Error(`${label}: unsupported field ${key}`);
};
const requiredText = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) throw Error(`${label}: text required`);
  if (/[<>\u0000-\u0008]/u.test(value)) throw Error(`${label}: markup/control characters not allowed`);
  return value;
};
const oneOf = (value, values, label) => {
  if (!values.includes(value)) throw Error(`${label}: unsupported value ${value}`);
  return value;
};
const cell = value => String(value ?? '無').replace(/\|/g, '｜').replace(/\r?\n/g, '<br>');

// Previous whole-canvas projection retained only for comparison/rollback tests.
// compileStory now uses the grounded, manually calibratable placedFrame adapter.
export function safePortraitFrame(actor, position, scenes = []) {
  const width = 1280, height = 666, margin = height * .05;
  const cw = actor.portraitCanvasWidthPx ?? 360, ch = actor.portraitCanvasHeightPx ?? 840;
  const body = actor.portraitBodyHeightPx ?? ch;
  const ax = actor.portraitAnchorXPx ?? cw / 2, ay = actor.portraitAnchorYPx ?? ch;
  const anchorFraction = actor.portraitAnchorType === 0 ? 1 : actor.portraitAnchorType === 1 ? .5 : 0;
  const x = position === 'left' ? 22 : position === 'right' ? 78 : 50;
  const profiles = [{}, ...scenes];
  const factors = profiles.map(s => height * (s.portraitHeightPercent ?? 100) / 100 * (actor.heightCm ?? s.portraitReferenceHeightCm ?? 170) / (s.portraitReferenceHeightCm ?? 170) / body);
  // Find the largest scale for which every possible authored scene fits the canvas.
  let low = 0, high = Math.min(actor.defaultScalePercent ?? 100, 100);
  const bounds = percent => {
    const scales = factors.map(f => f * percent / 100);
    return { lower: Math.max(...scales.map(s => margin + (ay + body * anchorFraction) * s)),
      upper: Math.min(...scales.map(s => height - margin - (ch - ay - body * anchorFraction) * s)),
      horizontal: scales.every(s => x * width / 100 - ax * s >= width * .03 && x * width / 100 + (cw - ax) * s <= width * .97) };
  };
  for (let i = 0; i < 40; i++) { const mid = (low + high) / 2, b = bounds(mid); if (b.horizontal && b.lower <= b.upper) low = mid; else high = mid; }
  if (!(low > 0) || !Number.isFinite(low)) throw Error('Invalid portrait geometry for safe framing');
  const b = bounds(low);
  return { standingLineYPercent: 95, portraitXPercent: x, portraitYPercent: 100 + ((b.lower + b.upper) / 2 / height * 100) - 95, portraitScalePercent: low };
}

export function compileStory(envelope, catalog, placements = {}) {
  keys(envelope, ['version', 'script', 'review'], 'envelope');
  if (envelope.version !== STORY_VERSION) throw Error('Unsupported story version');
  keys(envelope.script, ['eventId', 'nodes'], 'script');
  const eventId = requiredText(envelope.script.eventId, 'eventId');
  const nodes = envelope.script.nodes;
  if (!Array.isArray(nodes) || !nodes.length) throw Error('Script requires nodes');
  if (!Array.isArray(envelope.review)) throw Error('review must be an array');
  const ids = new Set();
  for (const node of nodes) {
    keys(node, ['id', 'kind', 'speakerId', 'text', 'next', 'stage', 'options'], 'node');
    requiredText(node.id, 'node.id');
    if (ids.has(node.id)) throw Error(`Duplicate node ${node.id}`);
    ids.add(node.id);
  }
  const reference = id => { if (!ids.has(id)) throw Error(`Unknown node ${id}`); return id; };
  const lookup = (rows, id, label) => {
    if (id == null || id === '0') return null;
    const found = rows.find(row => row.id === id);
    if (!found) throw Error(`Unknown ${label} ${id}`);
    return found;
  };
  const warnings = [], dialogue = [], dialogueOptions = [], review = [];
  const storyScenes = catalog.scenes.filter(s => nodes.some(n => n.stage?.backgroundSceneId === s.id));
  const optionIds = new Set();
  for (const item of envelope.review) {
    keys(item, ['nodeId', 'message'], 'review');
    if (item.nodeId != null) reference(item.nodeId);
    review.push({ nodeId: item.nodeId ?? null, message: requiredText(item.message, 'review.message') });
  }
  for (const [index, node] of nodes.entries()) {
    oneOf(node.kind, ['dialogue', 'narration', 'choice'], 'kind');
    requiredText(node.text, `${node.id}.text`);
    const speaker = lookup(catalog.characters, node.speakerId, 'character');
    if (node.kind === 'dialogue' && !speaker) throw Error('Dialogue requires speakerId');
    if (node.kind !== 'dialogue' && node.speakerId != null) throw Error('Narration/choice speakerId must be null');
    const count = [...node.text.replace(/\s/gu, '')].length;
    if (node.kind === 'dialogue' && (count < 15 || count > 30)) warnings.push({ nodeId: node.id, code: 'dialogue-length-advice', message: `${count}字；15–30字僅為建議，保留短句與自然語氣。` });
    const stage = node.stage ?? {};
    keys(stage, ['actorId', 'command', 'position', 'movement', 'expression', 'backgroundSceneId', 'cgGraphicId', 'bgmAudioId', 'sfxAudioId', 'loopSfxAudioId'], 'stage');
    const actor = lookup(catalog.characters, stage.actorId ?? node.speakerId, 'portrait character');
    const command = oneOf(stage.command ?? 'keep', ['keep', 'show', 'move', 'hide'], 'command');
    if (command !== 'keep' && !actor) throw Error('Portrait command requires actor');
    if (command === 'show' && !actor.portraitGraphicId && !actor.motionManifestGraphicId) throw Error('Character has no portrait asset');
    const expression = stage.expression ?? null;
    if (expression != null && (!Number.isInteger(expression) || expression < 0)) throw Error('Invalid expression code');
    if (expression && !catalog.expressions.some(row => row.characterId === actor?.id && row.expressionCode === expression && row.motionManifestGraphicId === actor.motionManifestGraphicId)) throw Error('Unsupported character expression');
    lookup(catalog.scenes, stage.backgroundSceneId, 'scene');
    lookup(catalog.graphics, stage.cgGraphicId, 'graphic');
    for (const field of ['bgmAudioId', 'sfxAudioId', 'loopSfxAudioId']) lookup(catalog.audio, stage[field], 'audio');
    if (!Object.hasOwn(node, 'next')) throw Error('Every node must explicitly specify next');
    if (node.next != null) reference(node.next);
    if (node.next == null && node.kind !== 'choice' && index !== nodes.length - 1) throw Error('Only the final ordered node can terminate in this runtime');
    if (node.kind === 'choice') {
      if (node.next !== null || !Array.isArray(node.options) || node.options.length < 2) throw Error('Choice requires options and null next');
      for (const [order, option] of node.options.entries()) {
        keys(option, ['id', 'text', 'next'], 'option');
        requiredText(option.id, 'option.id');
        if (optionIds.has(option.id)) throw Error('Duplicate option ID');
        optionIds.add(option.id);
        dialogueOptions.push({ id: option.id, choiceDialogueId: node.id, optionOrder: order + 1, text: requiredText(option.text, 'option.text'), responseDialogueId: reference(option.next) });
      }
    } else if (node.options !== undefined) throw Error('Only choice nodes may have options');
    const scene = catalog.scenes.find(s => s.id === stage.backgroundSceneId) ?? (storyScenes.length === 1 ? storyScenes[0] : null);
    if (actor && ['show', 'move'].includes(command) && storyScenes.length > 1 && !stage.backgroundSceneId) throw Error('多場景立繪出場需明確指定背景，才能套用場景定位');
    const frame = actor && ['show', 'move'].includes(command) ? placedFrame(actor, stage.position ?? actor.defaultPosition ?? 'center', scene ?? {}, placements[placementKey(actor.id, scene?.id)]) : {};
    dialogue.push({ id: node.id, eventId, lineOrder: index + 1, nodeType: node.kind === 'choice' ? 'choice' : 'line', nextDialogueId: node.next,
      presentationType: node.kind === 'narration' ? 1 : 0, characterId: speaker?.id ?? null, text: node.text,
      portraitCharacterId: actor?.id ?? null, portraitCommand: command,
      portraitPosition: stage.position == null ? null : oneOf(stage.position, ['left', 'center', 'right'], 'position'),
      movement: oneOf(stage.movement ?? 'none', ['none', 'enter-left', 'enter-right', 'exit-left', 'exit-right'], 'movement'), portraitExpression: expression,
      backgroundSceneId: stage.backgroundSceneId ?? null, cgGraphicId: stage.cgGraphicId ?? null,
      standingLineYPercent: null, portraitXPercent: null, portraitYPercent: null, portraitScalePercent: null, portraitZIndex: null, portraitDepthBlurPx: null, backgroundParallaxPercent: null,
      ...frame,
      bgmAudioId: stage.bgmAudioId ?? null, bgmFadeInSeconds: 0, sfxAudioId: stage.sfxAudioId ?? null, sfxFadeInSeconds: 0, loopSfxAudioId: stage.loopSfxAudioId ?? null, loopSfxFadeInSeconds: 0 });
  }
  const visited = new Set(), active = new Set();
  const walk = id => {
    if (active.has(id)) throw Error('Cycles are not supported in generated stories');
    if (visited.has(id)) return;
    active.add(id); visited.add(id);
    const node = nodes.find(row => row.id === id);
    for (const target of node.kind === 'choice' ? node.options.map(o => o.next) : node.next == null ? [] : [node.next]) walk(target);
    active.delete(id);
  };
  walk(nodes[0].id);
  if (visited.size !== nodes.length) throw Error('Unreachable story nodes');
  const lines = ['| 分鏡編號 | 角色 | 純台詞 / 旁白文字 | 表情動作 | 背景資產 |', '| --- | --- | --- | --- | --- |'];
  for (const [index, node] of nodes.entries()) {
    const role = node.kind === 'narration' ? '旁白' : node.kind === 'choice' ? '選項' : catalog.characters.find(c => c.id === node.speakerId).name;
    const text = node.kind === 'choice' ? `${node.text}\n${node.options.map(o => `${o.text} → ${o.next}`).join('\n')}` : node.text;
    lines.push(`| ${index + 1} | ${cell(role)} | ${cell(text)} | ${cell(JSON.stringify(node.stage ?? {}))} | ${cell(node.stage?.backgroundSceneId)} |`);
  }
  return { runtime: { dialogue, dialogueOptions, dialogueRewards: [] }, readingDraft: lines.join('\n'), review, warnings,
    layoutCheck: { status: 'required', message: '旁白、台詞及每個選項必須在實際遊戲版面檢查；不以字數推定通過。' } };
}
