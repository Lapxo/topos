import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {canonical} from '../src/wire/line.ts';
import {standingBytes,readStanding,providerInputs} from '../src/topos/standing.ts';
import {answer} from '../src/contract/index.ts';
import {PROTOCOL} from '../src/wire/line.ts';
const hash=(bytes:string)=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const line=(scope:string,value:string,extra:Record<string,string>={})=>canonical({scope,value,form:'alphabet',role:'writes',measure:'id',...extra});
for(const namespace of ['policy','configuration'])test(`provider inputs under ${namespace} stay separate, byte ordered and complete`,()=>{
 const own=[line(`${namespace}/limit`,'small'),line(`${namespace}/limit`,'large',{at:'origin:second'}),line('unrelated/value','ignored')];
 const selectors=[line('audit/wire/provider-inputs','standing-projection@1'),line('offers/example/inputs/report',`${namespace}/**`,{measure:'reads',role:'demands'})];
 const world=(rows:readonly string[])=>readStanding(standingBytes(rows));
 const first=providerInputs(world([...selectors,...own]),'sha256:standing','offers/example','sha256:artifact','report',hash)!;
 const permuted=providerInputs(world([...own,...selectors].reverse()),'sha256:standing','offers/example','sha256:artifact','report',hash)!;
 assert.deepEqual(first,permuted);assert.equal(first.lines.length,2);assert.match(first.lines.join('\n'),/value=small/);assert.match(first.lines.join('\n'),/value=large/);assert.doesNotMatch(first.lines.join('\n'),/ignored/);
 const changed=providerInputs(world([...selectors,...own.map(row=>row.replace('value=ignored','value=other'))]),'sha256:standing','offers/example','sha256:artifact','report',hash)!;assert.equal(changed.digest,first.digest);
 const relevant=providerInputs(world([...selectors,...own.map(row=>row.replace('value=small','value=changed'))]),'sha256:standing','offers/example','sha256:artifact','report',hash)!;assert.notEqual(relevant.digest,first.digest);
 let called=0;
 const response=answer({render:asked=>{called++;assert.equal(asked.lines.length,1);assert.equal(asked.lines[0]?.value,'place');assert.equal(asked.provider?.lines.length,2);assert.equal(asked.provider?.digest,first.digest);return ['separate'];}}, {protocol:PROTOCOL,verb:'render',rootScope:'',files:[],region:'report',reads:[`${namespace}/**`],lines:[line(`${namespace}/limit`,'place')],provider:first},'fixture');
 assert.equal(response.kind,'fact');assert.equal(called,1);
 assert.throws(()=>providerInputs(world(selectors),'sha256:standing','offers/example','sha256:artifact','report',hash),/selects no required/);
});
test('historical providers do not receive invented inputs; optional empty and undeclared protocol remain distinct',()=>{
 const world=(rows:readonly string[])=>readStanding(standingBytes(rows));
 assert.equal(providerInputs(world([line('name','old')]),'pin','offers/old','artifact','report',hash),undefined);
 const selector=line('offers/old/inputs/report','absent/**',{measure:'reads',role:'reads'});
 assert.throws(()=>providerInputs(world([selector]),'pin','offers/old','artifact','report',hash),/need standing-projection/);
 const empty=providerInputs(world([line('wire/provider-inputs','standing-projection@1'),selector]),'pin','offers/old','artifact','report',hash)!;
 assert.deepEqual(empty.lines,[]);assert.equal(empty.digest,hash(''));
});

test('observe and run receive the same separate provider channel as rendering',()=>{
 const provider={standing:'sha256:standing',artifact:'sha256:artifact',digest:hash(''),lines:[]};
 const request={protocol:PROTOCOL,verb:'read' as const,rootScope:'place',files:[{place:'input',text:'bytes'}],region:'report',provider};
 let observed=false,ran=false;
 const observation=answer({observe:(bytes,place,region,files,context)=>{observed=true;assert.equal(new TextDecoder().decode(bytes),'bytes');assert.equal(place,'place');assert.equal(context?.provider?.standing,provider.standing);assert.deepEqual(context?.lines,[]);return ['observed'];}},request,'fixture');
 assert.equal(observation.kind,'fact');assert.equal(observed,true);
 const execution=answer({run:(place,self,held,region,context)=>{ran=true;assert.equal(context?.provider?.artifact,provider.artifact);assert.deepEqual(context?.provider?.lines,[]);return ['ran'];}},{...request,files:[]},'fixture');
 assert.equal(execution.kind,'fact');assert.equal(ran,true);
});
