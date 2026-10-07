import {test} from 'node:test';
import assert from 'node:assert/strict';
import {programInputs,renderPrograms} from '../src/contract/index.ts';
import type {Asked,Handed} from '../src/capsule/index.ts';
const field=(scope:string,value:string,extra:Handed={}):Handed=>({scope,value,measure:'id',...extra});
const fixture=():Asked=>({region:'demand-status',at:8,shape:'',name:'',reads:['**','region/proofs'],
  provider:{standing:'pin',artifact:'artifact',digest:'projection',lines:Object.entries({profile:'admitted-demands@1',selection:'tasks/selection',minimum:'tasks/minimum',evidence:'proofs',elapsed:'clock/elapsed',ceiling:'clock/ceiling'}).map(([name,value])=>field('wire/programs/'+name,value))},
  lines:[field('tasks/selection','a|b'),field('tasks/minimum','a|b'),field('a','present',{role:'demands',needs:'proof/a'}),field('b','present',{role:'demands',needs:'proof/b',restsOn:'a'}),field('clock/ceiling','0..14',{form:'interval',measure:'days'})],
  regions:{proofs:{lines:[],receipts:[field('proof/a','met',{measure:'status'}),field('proof/b','unread',{measure:'status'})]}}});
test('native view selects only provider-owned coordinates and handed evidence',()=>{
  const asked=fixture();
  const impostor=field('wire/programs/minimum','malicious');
  assert.deepEqual(programInputs(asked),programInputs({...asked,lines:[...asked.lines,impostor]}));
  const output=renderPrograms(asked).join('\n');
  assert.match(output,/DEMAND a met/);assert.match(output,/DEMAND b unread/);assert.match(output,/NEXT b/);
  assert.doesNotMatch(output,/closed=true/);
});
test('configured elapsed time is not an observation; exact time and units are required',()=>{
  const asked=fixture();
  assert.equal(programInputs({...asked,lines:[...asked.lines,field('clock/elapsed','15..15',{form:'interval',measure:'days'})]}).elapsed,undefined);
  const reading=(value:string,measure='days')=>({...asked,regions:{proofs:{lines:[],receipts:[...asked.regions.proofs!.receipts,field('clock/elapsed',value,{form:'interval',measure})]}}});
  assert.equal(programInputs(reading('15..15')).elapsed,15);
  assert.throws(()=>programInputs(reading('1..15')),/not an exact finite reading/);
  assert.throws(()=>programInputs(reading('15..15','seconds')),/units differ/);
});
test('missing or conflicting evidence is never interpreted as no missing work',()=>{
  const asked=fixture();
  assert.throws(()=>programInputs({...asked,regions:{}}),/evidence region was not handed proofs/);
  assert.throws(()=>programInputs({...asked,regions:{proofs:{lines:[],receipts:[field('proof/a','met',{measure:'status'}),field('proof/a','unmet',{measure:'status'})]}}}),/conflicting evidence proof\/a/);
  assert.throws(()=>programInputs({...asked,lines:[...asked.lines,field('a','other',{role:'demands'})]}),/conflicting input a/);
});
