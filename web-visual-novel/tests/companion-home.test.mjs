import {test} from 'node:test';
import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
import {COMPANIONS,shuffleBag,dwellTime,fadeWeights} from '../public/stardom/companion-roster.js';
test('all six requested characters have local entries',async()=>{
  assert.deepEqual(COMPANIONS.map(c=>c.name),['Maru','Sophia','Eris','Miffy','Mimi','Natasha']);
  for(const c of COMPANIONS)await access(new URL('../public'+c.url.split('?')[0],import.meta.url));
});
test('every shuffle cycle includes everyone and never repeats across cycles',()=>{
  let seed=12345;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
  const ids=COMPANIONS.map(c=>c.id);let previous;
  for(let i=0;i<100;i++){const bag=shuffleBag(ids,previous,random);assert.equal(new Set(bag).size,6);assert.notEqual(bag[0],previous);previous=bag.at(-1);}
});
test('agreed 12–18 second dwell and opposite/intermediate opacity',()=>{
  assert.equal(dwellTime(()=>0),12000);assert.equal(dwellTime(()=>1),18000);
  for(const [p,expected]of [[0,[1,0]],[.25,[.75,.25]],[.5,[.5,.5]],[.75,[.25,.75]],[1,[0,1]]])assert.deepEqual(fadeWeights(p),expected);
});
test('Natasha exact authored assembly remains present, not a substituted character',async()=>{
  const path='../public/companions/natasha/layers/seethrough_local/Natasha_PSD_20260929/';
  const rig=JSON.parse(await readFile(new URL(path+'_review/motion_v62_casual02_rb_leg/rig.json',import.meta.url),'utf8'));
  assert.equal(rig.characterName,'Natasha');assert.equal(rig.layerCount,16);
  const assemblyBytes=await readFile(new URL(path+rig.assembly,import.meta.url));
  const {createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(assemblyBytes).digest('hex').toUpperCase(),rig.assemblySha256);
  const assembly=JSON.parse(assemblyBytes);for(const e of assembly.drawOrder)await access(new URL(path+(e.asset||e.file),import.meta.url));
});
