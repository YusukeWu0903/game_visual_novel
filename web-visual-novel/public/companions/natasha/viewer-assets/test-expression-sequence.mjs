import test from 'node:test';
import assert from 'node:assert/strict';
import {advanceSequentialExpression,createExpressionSequenceState} from './expression-sequence.mjs';

const sequence={mode:'eyes-before-expression',neutral:'neutral',expression:'kiss',eyeCloseSeconds:.2,eyeOpenSeconds:.18};
const names=['neutral','kiss'];
const tick=(state,blend,target,dt=1/60)=>advanceSequentialExpression(state,blend,target,dt,12,sequence,names);

test('close eyes completely before morphing to kiss',()=>{
  let state=createExpressionSequenceState(0),blend={weights:[1,0],velocities:[0,0]};
  let out=tick(state,blend,1);state=out.state;blend=out.blend;
  assert.equal(state.phase,'close-eyes');assert.deepEqual(blend.weights,[1,0]);
  for(let i=0;i<12;i++){out=tick(state,blend,1);state=out.state;blend=out.blend;}
  assert.equal(state.phase,'to-expression');assert.equal(state.eyeClosure,1);assert.deepEqual(blend.weights,[1,0]);
  for(let i=0;i<120&&state.phase!=='idle';i++){
    out=tick(state,blend,1);state=out.state;blend=out.blend;
    if(state.phase==='to-expression')assert.equal(state.eyeClosure,1);
  }
  assert.equal(state.phase,'idle');assert.ok(blend.weights[1]>1-1e-5);
});

test('unpucker fully before opening eyes on return',()=>{
  let state=createExpressionSequenceState(1),blend={weights:[0,1],velocities:[0,0]};
  let out=tick(state,blend,0);state=out.state;blend=out.blend;
  assert.equal(state.phase,'to-neutral');assert.equal(state.eyeClosure,1);
  for(let i=0;i<120&&state.phase!=='open-eyes';i++){
    out=tick(state,blend,0);state=out.state;blend=out.blend;assert.equal(state.eyeClosure,1);
  }
  assert.equal(state.phase,'open-eyes');assert.ok(blend.weights[0]>1-1e-5);
  for(let i=0;i<20;i++){out=tick(state,blend,0);state=out.state;blend=out.blend;}
  assert.equal(state.phase,'idle');assert.equal(state.eyeClosure,0);
});

test('direction changes start from current closure without a jump',()=>{
  let state=createExpressionSequenceState(0),blend={weights:[1,0],velocities:[0,0]};
  let out=tick(state,blend,1,.08);state=out.state;blend=out.blend;
  const partial=state.eyeClosure;assert.ok(partial>0&&partial<1);
  out=tick(state,blend,0,0);state=out.state;blend=out.blend;
  assert.equal(state.phase,'open-eyes');assert.equal(state.eyeClosure,partial);
  const before=state.eyeClosure;out=tick(state,blend,1,0);state=out.state;blend=out.blend;
  assert.equal(state.phase,'close-eyes');assert.equal(state.eyeClosure,before);assert.deepEqual(blend.weights,[1,0]);
});
