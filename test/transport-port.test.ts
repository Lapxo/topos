import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transportSelection,contentRequest} from '../src/wire/transport-port.ts';
const row=(scope:string,measure:string,value:string,form='alphabet')=>({scope,measure,value,form,role:'writes'});
const policy=[row('wire/transport','id','content-request/1'),row('transport/timeout','milliseconds','0..500','interval'),row('transport/response-bytes','bytes','0..8192','interval')];
test('transport names and limits come from declarations, not location names or command inference',()=>{
 for(const scheme of ['alpha','beta']){
  const selected=transportSelection([...policy,row(`transport/${scheme}`,'id','host-mechanism')],scheme)!;
  assert.equal(selected.name,'host-mechanism');assert.deepEqual(JSON.parse(contentRequest(`${scheme}:held`,'sha256:fixed',selected)),{protocol:'content-request/1',location:`${scheme}:held`,digest:'sha256:fixed',timeoutMs:500,responseBytes:8192});
 }
 assert.equal(transportSelection([],'alpha'),undefined);
 assert.throws(()=>transportSelection(policy,'alpha'),/missing or conflicting transport\/alpha/);
 assert.throws(()=>transportSelection([...policy,row('transport/alpha','id','one'),row('transport/alpha','id','two')],'alpha'),/conflicting/);
});
test('transport limits meet across instrument and place without weakening either ceiling',()=>{
 const mechanism=row('transport/alpha','id','host-mechanism');
 const narrower=[row('transport/timeout','milliseconds','0..100','interval'),row('transport/response-bytes','bytes','0..1024','interval')];
 assert.deepEqual(transportSelection([...policy,mechanism,...narrower],'alpha'),{name:'host-mechanism',timeoutMs:100,responseBytes:1024});
 assert.deepEqual(transportSelection([...narrower,mechanism,...policy],'alpha'),transportSelection([...policy,mechanism,...narrower],'alpha'));
 assert.throws(()=>transportSelection([...policy,mechanism,row('transport/timeout','milliseconds','600..700','interval')],'alpha'),/conflicting transport\/timeout/);
 assert.throws(()=>transportSelection([...policy,mechanism,row('transport/timeout','milliseconds','invalid','interval')],'alpha'),/invalid transport\/timeout/);
});
