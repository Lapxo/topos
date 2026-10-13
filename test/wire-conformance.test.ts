import {test} from 'node:test';
import assert from 'node:assert/strict';
import {observe} from '../src/readers/wire-conformance.ts';
import {fromLine} from '../src/wire/claimline.ts';

test('wire conformance retains the actual input, refusal and source kind without a subprocess',()=>{
  const line='bound-lock/1 at=witness:case by=target form=ghost measure=count role=reads scope=reading/unknown value=1..2';
  const answer=fromLine(line,null);assert.notEqual(answer.kind,'fact');
  const why=answer.kind==='fact'?'':answer.why??'';
  const sample={profile:'wire-conformance@1',scope:'capture/wire/one',line,expected:{kind:answer.kind,why}};
  const rows=observe(new TextEncoder().encode(JSON.stringify(sample)));
  assert.deepEqual(rows.map(r=>[r.scope,r.measure,r.bound.values[0]]),[
    [sample.scope,'input',line],[sample.scope,'why',why],[sample.scope,'source-kind',answer.kind]]);
  assert.throws(()=>observe(new TextEncoder().encode(JSON.stringify({...sample,expected:{kind:'fact',why:''}}))),/observed result differs/);
  assert.throws(()=>observe(new Uint8Array([255])),/malformed input/);
  assert.throws(()=>observe(new TextEncoder().encode('{}')),/declaration required/);
});
