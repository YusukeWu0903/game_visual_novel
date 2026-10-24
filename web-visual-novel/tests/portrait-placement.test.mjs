import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultPlacement, placedFrame, validatePlacement, readPlacements, PLACEMENT_KEY, calibratedPortrait } from '../public/stardom/portrait-placement.js';
import { resolvePortraitGeometry } from '../public/stardom/runtime/core/DialogueStage.js';
import { CHARACTER_DATA } from '../public/stardom/runtime/data/charactersData.js';
import { SCENE_DATA } from '../public/stardom/runtime/data/scenesData.js';
import { compileStory } from '../public/stardom/story-contract.js';
const c = CHARACTER_DATA[0], s = SCENE_DATA[0];
test('fresh cloud origin gets approved full-precision calibration; local override takes priority', () => {
  const catalog = {characters:CHARACTER_DATA,scenes:SCENE_DATA};
  const defaults = readPlacements({getItem:()=>null},catalog);
  assert.equal(defaults['Character0001@Scene0001'].ground,137.994917994918);
  defaults['Character0001@Scene0001'].scale=90;
  assert.equal(readPlacements({getItem:()=>null},catalog)['Character0001@Scene0001'].scale,105);
  const changed = {...defaults['Character0001@Scene0001'],scale:80};
  assert.equal(readPlacements({getItem:()=>JSON.stringify({version:1,profiles:{'Character0001@Scene0001':changed}})},catalog)['Character0001@Scene0001'].scale,80);
});
test('formal projection matches AI compiler for left center right without double offsets or data mutation', () => {
  const p = {ground:137.99,scale:105,xOffset:-3.69,anchorX:178.25,anchorY:727};
  const before = JSON.stringify({c,s});
  for (const [pos,x] of [['left',22],['center',50],['right',78]]) {
    const original = {xPercent:x,yPercent:100,scalePercent:100};
    assert.deepEqual(calibratedPortrait(original,c,s,'other',{}), {presentation:original,character:c,stage:s});
    const projected = calibratedPortrait(original,c,s,s.id,{[`${c.id}@${s.id}`]:p});
    const runtime = resolvePortraitGeometry(projected.presentation,projected.character,projected.stage);
    const compiled = actual(placedFrame(c,pos,s,p));
    for (const key of ['leftPx','topPx','widthPx','heightPx']) assert.ok(Math.abs(runtime[key]-compiled[key])<.00001,key);
  }
  assert.equal(JSON.stringify({c,s}),before);
});
function actual(frame) { return resolvePortraitGeometry({xPercent:frame.portraitXPercent,yPercent:frame.portraitYPercent,scalePercent:frame.portraitScalePercent},c,{...s,standingLineYPercent:frame.standingLineYPercent}); }
test('default feet stay on the ground at opposite and intermediate positions', () => {
  for (const pos of ['left','center','right']) {
    const frame = placedFrame(c,pos,s), g = actual(frame);
    assert.ok(Math.abs(g.topPx+c.portraitAnchorYPx*g.scale-666)<.001);
    assert.ok(g.topPx>=666*.05-.001);
  }
});
test('scaling preserves calibrated feet; custom anchors compile to original renderer without mutation', () => {
  const before=JSON.stringify(c), p={...defaultPlacement(c,s),ground:90,anchorY:800,anchorX:160};
  for(const scale of [40,60,80]) {
    const g=actual(placedFrame(c,'center',s,{...p,scale}));
    assert.ok(Math.abs(g.topPx+p.anchorY*g.scale-666*.9)<.001);
    assert.ok(Math.abs(g.leftPx+p.anchorX*g.scale-640)<.001);
  }
  assert.equal(JSON.stringify(c),before);
});
test('versioned profiles round-trip and reject invalid or foreign data', () => {
  const doc={version:1,profiles:{'Character0001@Scene0001':defaultPlacement(c,s)}};
  assert.deepEqual(readPlacements({getItem:k=>k===PLACEMENT_KEY?JSON.stringify(doc):null},{characters:CHARACTER_DATA,scenes:SCENE_DATA}),doc.profiles);
  assert.throws(()=>validatePlacement({...defaultPlacement(c,s),scale:NaN}));
  assert.throws(()=>readPlacements({getItem:()=>JSON.stringify({version:1,profiles:{'unknown@Scene0001':doc.profiles['Character0001@Scene0001']}})},{characters:CHARACTER_DATA,scenes:SCENE_DATA}));
});
test('story compiler applies the selected character-scene profile, not unrelated profiles', () => {
  const input={version:'vn-story/1',script:{eventId:'test',nodes:[{id:'one',kind:'dialogue',speakerId:c.id,text:'定位套用測試。',next:null,stage:{actorId:c.id,command:'show',backgroundSceneId:s.id}}]},review:[]};
  const profile={...defaultPlacement(c,s),ground:85,scale:50,anchorY:810};
  const result=compileStory(input,{characters:CHARACTER_DATA,scenes:SCENE_DATA,graphics:[],audio:[],expressions:[]},{[`${c.id}@${s.id}`]:profile});
  const line=result.runtime.dialogue[0], geometry=actual(line);
  assert.ok(Math.abs(geometry.topPx+profile.anchorY*geometry.scale-666*.85)<.001);
  assert.equal(line.standingLineYPercent,85);
});
