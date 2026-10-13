import {test} from 'node:test';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';import {readFileSync} from 'node:fs';import {canonical} from '../src/wire/line.ts';import {readStanding,standingBytes} from '../src/topos/standing.ts';import {placeInputs,withPlaceInputs} from '../src/topos/place-inputs.ts';import {readingIdentityBytes} from '../src/contract/reading-identity.ts';
const hash=(bytes:Uint8Array)=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const row=(scope:string,value:string,more:Record<string,string>={})=>canonical({scope,value,role:'writes',form:'alphabet',measure:'id',at:'policy:test',...more});
const offer='offers/test';
const world=(masks='proof/retained-members',role='demands',profile='admitted-place-inputs@1')=>readStanding(standingBytes([row('wire/place-inputs',profile),row(offer+'/place-inputs/reading',masks,{role,measure:'reads'})]));
const reference=row('proof/retained-members','sha256:'+ '1'.repeat(64),{measure:'digest',needs:'references.json'}),other=row('unrelated/value','one');
test('selected canonical inputs preserve order and scope without whole-place invalidation',()=>{
 const first=placeInputs(world(),offer,'reading',[reference,other],hash)!;
 assert.equal(first.lines.length,1);assert.equal(placeInputs(world(),offer,'reading',[reference,row('unrelated/value','two')],hash)?.digest,first.digest);
 assert.notEqual(placeInputs(world(),offer,'reading',[reference.replace('1'.repeat(64),'2'.repeat(64)),other],hash)?.digest,first.digest);
 assert.equal(placeInputs(world(),offer,'reading',[reference,reference,other],hash)?.digest,first.digest);
 const contextual=withPlaceInputs({instrument:'instrument',implementation:'implementation',policy:'policy',inputs:[['transitive','kept']],environment:[['env','kept']]},'place/reading',first);assert.equal(contextual.inputs.length,2);assert.equal(contextual.environment[0]?.[1],'kept');assert.ok(readingIdentityBytes(contextual).length);
 assert.throws(()=>withPlaceInputs(contextual,'place/reading',first),/duplicate inputs coordinate/);
 const a=row('proof/a','2..3',{form:'interval',measure:'bounds'}),b=row('proof/b','5..6',{form:'interval',measure:'bounds'});
 assert.notEqual(placeInputs(world('proof/**'),offer,'reading',[a,b],hash)?.digest,placeInputs(world('proof/**'),offer,'reading',[b,a],hash)?.digest);
});
test('missing opt-in and required/malformed inputs retain named refusals',()=>{
 assert.equal(placeInputs(world(),offer,'not-declared',[reference],hash),undefined);
 assert.throws(()=>placeInputs(world(),offer,'reading',[other],hash),/required member absent/);
 assert.throws(()=>placeInputs(world('proof/**','writes'),offer,'reading',[reference],hash),/invalid selector role/);
 assert.throws(()=>placeInputs(world('proof/**','demands','unknown'),offer,'reading',[reference],hash),/missing or conflicting profile/);
 assert.throws(()=>placeInputs(world(),offer,'reading',[row('proof/retained-members','withdraw')],hash),/history is not standing/);
 assert.deepEqual(placeInputs(world('absent/**','reads'),offer,'reading',[reference],hash)?.lines,[],'optional absence is an empty selected projection, not a met proof');
 const fork=row('proof/retained-members','sha256:'+'2'.repeat(64),{measure:'digest',needs:'references.json'});assert.equal(placeInputs(world(),offer,'reading',[reference,fork],hash)?.lines.length,2,'a conflicting source is preserved, not first-wins');
});
test('language-independent captured vectors use existing semantic canonicalization',()=>{
 const yes=JSON.parse(readFileSync(new URL('../samples/place-inputs/yes.json',import.meta.url),'utf8'));
 for(const c of yes.cases){const selected=placeInputs(readStanding(standingBytes(c.world)),c.offer,c.region,c.live,hash);assert.deepEqual(selected,c.expected,c.name);}
 const no=JSON.parse(readFileSync(new URL('../samples/place-inputs/no.json',import.meta.url),'utf8'));
 for(const c of no.cases)assert.throws(()=>placeInputs(readStanding(standingBytes(c.world)),c.offer,c.region,c.live,hash),new RegExp(c.refusal),c.name);
});

test('optional request/asked place projection survives framing and shell without merging channels',async()=>{
 const {shell,receiptShell}=await import('../src/capsule/shell.ts');
 const place=placeInputs(world(),offer,'reading',[reference],hash)!;
 const request={protocol:'bound-lock/1',verb:'render',rootScope:'root',files:[],region:'reading',place,lines:[other],provider:{profile:'standing-projection@1',lines:['provider-only']}};
 const framed=JSON.parse(JSON.stringify(request));assert.deepEqual(framed.place,place);assert.deepEqual(framed.lines,[other]);
 const asked={region:'reading',at:1,shape:'lines',name:'reading',reads:[],lines:[{scope:'other'}],regions:{},place:framed.place};
 assert.deepEqual(shell({reading:{reads:[],region:q=>q.place!.lines}})(asked),place.lines);
 assert.deepEqual(receiptShell({reading:{reads:[],region:q=>[{scope:'kept',value:q.place!.digest}]}})(asked),[{scope:'kept',value:place.digest}]);
 const absent={...asked};delete (absent as {place?:unknown}).place;assert.equal(shell({reading:{reads:[],region:q=>[String(q.place)]}})(absent)[0],'undefined');
});
