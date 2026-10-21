import {test} from 'node:test';
import {deepStrictEqual as equal, throws, ok} from 'node:assert/strict';
import {measureProjectionChain, PROJECTION_CHAIN_PROFILE, type ProjectionChain} from '../src/contract/projection-chain.ts';
const chain = (prefix:string): ProjectionChain => ({profile:PROJECTION_CHAIN_PROFILE,
 atoms:['a','b','c','d'].map(x=>prefix+x),
 f:[['a','left'],['b','left'],['c','right'],['d','right']].map(([x,y])=>[prefix+x,prefix+y]),
 g:[[prefix+'left',prefix+'all'],[prefix+'right',prefix+'all']],
 prior:{kind:'uniform'},policy:{logarithm:'binary64-log2',budget:'10'}});
for (const place of ['reservoir/','shipping/']) {
 test(`${place} finite chain evaluates through the public measure`,()=>{
  const input=chain(place), output=measureProjectionChain(input);
  equal(output.status,'measured');
  if(output.status!=='measured') throw Error('missing measurement');
  equal(output.loss,{xy:1,yz:1,xz:2}); equal(output.residualBits,0);
  equal(measureProjectionChain({...input,atoms:[...input.atoms].reverse(),f:[...input.f].reverse(),g:[...input.g].reverse()}),output);
 });
 test(`${place} arbitrary projections, changed priors and randomized maps refuse`,()=>{
  const input=chain(place);
  throws(()=>measureProjectionChain({...input,direct:input.atoms.map((x,i)=>[x,place+String(i%2)])}),/projection\/non-chain/);
  throws(()=>measureProjectionChain({...input,priorY:{kind:'uniform'}} as ProjectionChain),/projection\/changed-prior/);
  throws(()=>measureProjectionChain({...input,f:[[input.atoms[0],['random','choice']]] as unknown as ProjectionChain['f']}),/projection\/(non-chain|randomized-map)/);
  throws(()=>measureProjectionChain({...input,f:input.f.map((row,i)=>i===0?[row[0],['random','choice'] as unknown as string]:row)}),/projection\/randomized-map/);
 });
}
test('missing prior and exhausted work remain unmeasured',()=>{
 const {prior,...input}=chain('x/');
 equal(measureProjectionChain(input).status,'unmeasured');
 equal(measureProjectionChain(input).cause,'mix-loss/prior-required');
 equal(measureProjectionChain({...input,policy:{logarithm:'binary64-log2',budget:'0'}}).cause,'mix-loss/work-budget');
});
test('zero mass, exact nonuniform pushforward and injectivity',()=>{
 const input=chain('x/');
 const prior={kind:'explicit' as const,probabilities:input.atoms.map((configuration,i)=>({configuration,p:i===0?'1':'0'}))};
 const output=measureProjectionChain({...input,prior});
 equal(output.status,'measured');
 if(output.status!=='measured') throw Error('missing measurement');
 equal(output.loss,{xy:0,yz:0,xz:0});
 const varied=measureProjectionChain({...input,prior:{kind:'explicit',probabilities:input.atoms.map((configuration,i)=>({configuration,p:['1/2','1/4','1/8','1/8'][i]}))}});
 if(varied.status!=='measured') throw Error('missing measurement');
 ok(Math.abs(varied.residualBits)<=1e-12);
 throws(()=>measureProjectionChain({...input,prior:{kind:'explicit',probabilities:input.atoms.map(configuration=>({configuration,p:'1'}))}}),/REFUSE/);
});
