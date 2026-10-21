import {test} from 'node:test';
import {deepStrictEqual as equal,throws} from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readPhysicalLines,PHYSICAL_LINES_PROFILE,type PhysicalLinesInput} from '../src/contract/physical-lines.ts';
const hash=(bytes:Uint8Array)=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
const file=(name:string,text:string)=>{const bytes=new TextEncoder().encode(text);return {name,bytes,digest:hash(bytes)};};
function fixture(place:string):PhysicalLinesInput {return {profile:PHYSICAL_LINES_PROFILE,snapshot:hash(new TextEncoder().encode(place)),files:[file(place+'/code.txt','// comment\r\n\nlast'),file(place+'/empty.txt',''),file(place+'/unassigned.txt','one\n')],regions:[{scope:place+'/source',selectors:[place+'/code.txt']},{scope:place+'/nested',selectors:[place+'/code.txt']},{scope:place+'/empty',selectors:[place+'/empty.txt']},{scope:place+'/absent',selectors:[place+'/missing*']}],policy:{byteBudget:'10000',rowBudget:'10000'}};}
for(const place of ['weather-notes','museum-inventory']){
 test(place+' physical counts, overlap, unassigned and no-match are distinct',()=>{
  const input=fixture(place),got=readPhysicalLines(input,hash); if(got.status!=='read')throw Error('missing read');
  const region=(suffix:string)=>got.regions.find(r=>r.scope===place+'/'+suffix)!;
  equal(region('source').value,{numerator:'3',denominator:'1'});
  equal(region('empty').value,{numerator:'0',denominator:'1'});
  equal(region('absent').status,'unmeasured');equal(region('absent').cause,'selector-no-match');
  equal(got.valuation.overlapExcess,{numerator:'3',denominator:'1'});equal(got.valuation.unassigned,[place+'/unassigned.txt']);
  equal(readPhysicalLines({...input,files:[...input.files].reverse(),regions:[...input.regions].reverse()},hash),got);
 });
 test(place+' disjoint selection is exactly combined by Obligations',()=>{
  const input=fixture(place);const got=readPhysicalLines({...input,regions:[{scope:'one',selectors:[place+'/code.txt']},{scope:'two',selectors:[place+'/unassigned.txt']}]},hash);
  if(got.status!=='read')throw Error('missing read');equal(got.valuation.disjointBySupport,true);equal(got.valuation.union.value,{numerator:'4',denominator:'1'});
 });
 test(place+' altered bytes, malformed selection and duplicate names refuse',()=>{
  const input=fixture(place);
  throws(()=>readPhysicalLines({...input,files:[{...input.files[0]!,bytes:new TextEncoder().encode('altered')}]},hash),/physical-lines\/integrity/);
  throws(()=>readPhysicalLines({...input,regions:[{scope:'bad',selectors:['../*']}]},hash),/physical-lines\/selector/);
  throws(()=>readPhysicalLines({...input,files:[input.files[0]!,input.files[0]!]},hash),/physical-lines\/duplicate-file/);
 });
}
test('text domain, byte and selection budgets are explicit',()=>{
 const base=fixture('text');
 for(const text of ['a\rb','\r'])throws(()=>readPhysicalLines({...base,files:[file('text/x',text)]},hash),/physical-lines\/isolated-cr/);
 const invalid=new Uint8Array([255]);throws(()=>readPhysicalLines({...base,files:[{name:'text/x',bytes:invalid,digest:hash(invalid)}]},hash),/physical-lines\/utf8/);
 equal(readPhysicalLines({...base,policy:{...base.policy,byteBudget:'0'}},hash).status,'unmeasured');
 equal(readPhysicalLines({...base,policy:{...base.policy,rowBudget:'0'}},hash).status,'unmeasured');
 for(const [text,n] of [['','0'],['\n','1'],['\r\n','1'],['x','1'],['x\n','1'],['\n\n','2']] as const){const got=readPhysicalLines({...base,files:[file('text/x',text)],regions:[{scope:'x',selectors:['text/*']}]},hash);if(got.status!=='read')throw Error('missing read');equal(got.regions[0]!.value,{numerator:n,denominator:'1'});}
});

test('a partially matched union retains each unmatched selector by name',()=>{
 const input=fixture('partial');
 const got=readPhysicalLines({...input,regions:[{scope:'mixed',selectors:['partial/code.txt','partial/no-such-file']}]},hash);
 if(got.status!=='read')throw Error('missing read');
 equal(got.regions[0]!.status,'measured');
 equal(got.regions[0]!.selections[1],{selector:'partial/no-such-file',members:[],status:'unmeasured',cause:'selector-no-match'});
});
