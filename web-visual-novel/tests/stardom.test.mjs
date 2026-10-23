import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createDialogueSave, SAVE_KEY } from '../public/stardom/dialogue-save.js';
import { restoreRoute } from '../public/stardom/restore-route.js';
import { DialogueFlowSession } from '../public/stardom/runtime/core/DialogueFlowSession.js';
import { DIALOGUE_DATA } from '../public/stardom/runtime/data/dialogueData.js';
import { DIALOGUE_OPTION_DATA } from '../public/stardom/runtime/data/dialogueOptionsData.js';
import { DIALOGUE_REWARD_DATA } from '../public/stardom/runtime/data/dialogueRewardsData.js';
import { GRAPHIC_ASSETS } from '../public/stardom/runtime/data/graphicsData.js';
import { CHARACTER_DATA } from '../public/stardom/runtime/data/charactersData.js';
import { SCENE_DATA } from '../public/stardom/runtime/data/scenesData.js';
import { fitGameViewport } from '../public/stardom/runtime/core/GameViewport.js';
const memory = () => { const m=new Map(); return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)}; };
const ordered = event => DIALOGUE_DATA.filter(l=>l.eventId===event).sort((a,b)=>a.lineOrder-b.lineOrder);
for (const choice of DIALOGUE_OPTION_DATA.filter(o=>o.choiceDialogueId==='Dialogue0059')) {
  test('branch '+choice.id+' rejoins and survives save/restore', () => {
    const storage=memory(), ctrl=createDialogueSave(storage); ctrl.start('Event0003');
    let session=new DialogueFlowSession('Event0003',ordered('Event0003'),DIALOGUE_OPTION_DATA,DIALOGUE_REWARD_DATA,ctrl);
    for(let n=0;n<3;n++){const l=session.enterCurrentLine();session.completeLine(l);}
    assert.equal(session.currentLine.id,'Dialogue0059');
    assert.equal(session.choose(session.currentLine,choice),true);
    const restored=createDialogueSave(storage); assert.equal(restored.restore(),'Event0003');
    session=new DialogueFlowSession('Event0003',ordered('Event0003'),DIALOGUE_OPTION_DATA,DIALOGUE_REWARD_DATA,restored);
    assert.equal(session.currentLine.id,choice.responseDialogueId);
    const route=restoreRoute(ordered('Event0003'),DIALOGUE_OPTION_DATA,restored.snapshot().dialogueChoices,session.currentLine.id);
    assert.equal(route.at(-1).id,'Dialogue0059');
    const {nextId}=session.completeLine(session.enterCurrentLine()); assert.equal(nextId,'Dialogue0063');
    const receipt=restored.snapshot().pendingDialogueReward;
    if(receipt){assert.deepEqual(restored.grantDialogueRewards('Event0003',DIALOGUE_REWARD_DATA),receipt);restored.acknowledgeDialogueReward('Event0003');}
    while(session.currentLine){const l=session.enterCurrentLine();const out=session.completeLine(l);if(out.receipt)session.acknowledgeReward();if(!out.nextId)break;}
    session.finish(); assert.equal(restored.snapshot().completed,true);
    assert.equal(createDialogueSave(storage).restore(),null);
  });
}
test('unfinished play remains resumable; rejected overwrite cannot replace locked branch',()=>{
  const storage=memory(),ctrl=createDialogueSave(storage);ctrl.start('Event0004');ctrl.recordDialogueProgress('Event0004','Dialogue0067');ctrl.completeEvent('Event0004');
  assert.equal(createDialogueSave(storage).restore(),'Event0004');
  ctrl.chooseDialogueOption('Event0004','choice','one','Dialogue0067');assert.equal(ctrl.chooseDialogueOption('Event0004','choice','two','Dialogue0068'),false);
});
test('receipt persists across restart and cannot grant twice',()=>{
  const storage=memory(),ctrl=createDialogueSave(storage);ctrl.start('Event0003');
  const reward={id:'reward',rewardType:'trait',targetId:'test',targetName:'test',amount:1};
  ctrl.grantDialogueRewards('Event0003',[reward]);const restored=createDialogueSave(storage);restored.restore();
  assert.deepEqual(restored.snapshot().pendingDialogueReward.rewardIds,['reward']);restored.acknowledgeDialogueReward('Event0003');
  assert.equal(restored.grantDialogueRewards('Event0003',[reward]),null);
});
test('restore rejects unreachable nodes and cycles',()=>{
  assert.throws(()=>restoreRoute(ordered('Event0003'),DIALOGUE_OPTION_DATA,{},'Dialogue0062'));
  assert.throws(()=>restoreRoute([{id:'a',nodeType:'line',nextDialogueId:'a'}],[],{},'b'));
});
test('all demo graphics and nested motion references are present',async()=>{
  const graphics=new Map(GRAPHIC_ASSETS.map(g=>[g.id,g]));const visited=new Set();
  async function graphic(id){if(!id||id==='0'||visited.has(id))return;visited.add(id);const g=graphics.get(id);assert.ok(g,id);const url=new URL('../public/assets/graphics/'+g.assetPath,import.meta.url);await access(url);if(g.assetPath.endsWith('.json'))for(const ref of (await readFile(url,'utf8')).match(/Graphic\d+/g)||[])await graphic(ref);}
  for(const c of CHARACTER_DATA){await graphic(c.portraitGraphicId);await graphic(c.motionManifestGraphicId);}
  for(const l of DIALOGUE_DATA.filter(l=>['Event0003','Event0004','Event0005'].includes(l.eventId))){await graphic(l.cgGraphicId);if(l.backgroundSceneId&&l.backgroundSceneId!=='0')await graphic(SCENE_DATA.find(s=>s.id===l.backgroundSceneId)?.backgroundGraphicId);}
  assert.ok(visited.size>30);
});
test('desktop/intermediate/phone landscape use the same 16:9 stage',()=>{
  for(const [w,h]of [[1920,1080],[1024,768],[844,390],[640,360]]){const fit=fitGameViewport(w,h);assert.equal(fit.supported,true);assert.ok(Math.abs(fit.width/fit.height-16/9)<1e-9);assert.ok(fit.width<=w&&fit.height<=h);}
  assert.equal(fitGameViewport(390,844).supported,false);
});
test('malformed save is rejected',()=>{const s=memory();s.setItem(SAVE_KEY,JSON.stringify({version:1,eventId:'unknown'}));assert.equal(createDialogueSave(s).restore(),null);});
