import {strict as assert} from 'node:assert';
import {cellInputs,cellReceiptContract} from '@lapxo/topos/cell-inputs';
import type {ObjectRecord} from '@lapxo/topos/wire';
const record=(record:ObjectRecord['record'],fields:Record<string,string>):ObjectRecord=>({record,fields}) as ObjectRecord;
const definitions=[record('cell',{scope:'root',id:'root',epoch:'1',restsOn:'none',topos:'sha256:selected',form:'span'}),record('cell',{scope:'child',id:'child',epoch:'1',restsOn:'root',topos:'sha256:selected',form:'span'})];
const travel=record('mark',{scope:'root',id:'sign',epoch:'2',sign:'+1',pole:'ceiling',reach:'travels',value:'narrow'});
const join=record('mark',{scope:'root',id:'join',epoch:'3',sign:'+1',pole:'ceiling',reach:'local',widens:'witness',value:'wide'});
test('semantic receipt inputs distinguish local join from travelling sign',()=>{
 const before=cellInputs([...definitions,travel]);const local=cellInputs([...definitions,travel,join]);
 assert.notDeepEqual(local.get('root'),before.get('root'));assert.deepEqual(local.get('child'),before.get('child'));
 const changed=cellInputs([...definitions,{...travel,fields:{...travel.fields,value:'changed'}}]);
 assert.notDeepEqual(changed.get('child'),before.get('child'));
 assert.deepEqual(cellInputs([...definitions,travel,travel]),before);
});
test('receipt inputs use live claims and selected identity, excluding delivery metadata',()=>{
 const claim=record('claim',{scope:'child',id:'observation',epoch:'4',sign:'+1',origin:'independent',value:'observed'});
 const before=cellInputs([...definitions,travel]);const observed=cellInputs([...definitions,travel,claim]);
 const withdrawn=cellInputs([...definitions,travel,claim,record('claim',{scope:'child',id:'withdrawal',epoch:'5',sign:'-1',takes:'observation'})]);
 assert.notDeepEqual(observed.get('child'),before.get('child'));assert.deepEqual(withdrawn,before);
 assert.deepEqual(cellInputs([...definitions,{...travel,fields:{...travel.fields,by:'delivery',epoch:'20',sig:'delivery',shape:'host-path'}}]),before);
 const other=cellInputs(definitions.map(d=>({...d,fields:{...d.fields,topos:'sha256:other'}})));assert.notDeepEqual(other,cellInputs(definitions));
});
test('receipt contract requires semantic identity without inventing valuation',()=>{
 const identity={scope:'wire/receipt-inputs',value:'semantic-live@1'};
 assert.deepEqual(cellReceiptContract([identity]),{valuation:'unknown'});
 assert.throws(()=>cellReceiptContract([]),/REFUSE·receipt/);
 assert.throws(()=>cellReceiptContract([identity,{scope:'valuation/cells',value:'0'}]),/REFUSE·valuation/);
});

test('ordered profile keeps the native sign/join counterexample distinct without redefining the set profile',()=>{
 const signThenJoin=[...definitions,travel,join];
 const joinThenSign=[...definitions,{...join,fields:{...join.fields,epoch:'2'}},{...travel,fields:{...travel.fields,epoch:'3'}}];
 assert.deepEqual(cellInputs(signThenJoin),cellInputs(joinThenSign),'legacy set meaning is unchanged');
 assert.notDeepEqual(cellInputs(signThenJoin,'semantic-live@2').get('root'),cellInputs(joinThenSign,'semantic-live@2').get('root'));
 assert.deepEqual(cellInputs(signThenJoin,'semantic-live@2').get('child'),cellInputs(joinThenSign,'semantic-live@2').get('child'),'the local join does not travel');
 const withoutJoin=cellInputs([...definitions,travel],'semantic-live@2');
 assert.deepEqual(withoutJoin.get('child'),cellInputs(signThenJoin,'semantic-live@2').get('child'));
 assert.deepEqual(cellInputs([...signThenJoin,join],'semantic-live@2'),cellInputs(signThenJoin,'semantic-live@2'));
 assert.deepEqual(cellInputs([...definitions,join,travel],'semantic-live@2'),cellInputs(signThenJoin,'semantic-live@2'),'delivery order cannot replace the logical order');
});
