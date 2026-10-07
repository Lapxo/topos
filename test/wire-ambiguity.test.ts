import {test} from 'node:test';
import assert from 'node:assert/strict';
import {wireAt} from '../src/wire/index.ts';
const row=(by:string,epoch:string,value:string)=>({scope:'wire/fields',role:'writes',form:'alphabet',measure:'id',value,by,epoch,at:'policy:wire'});
test('a wire alphabet refuses disagreement by name and never becomes vacuous',()=>{
 for(const scope of ['wire/fields','wire/required']){
  const a={...row('one','2','scope|value'),scope},b={...row('two','3','scope|value|by'),scope};
  assert.throws(()=>wireAt([a,b],3),new RegExp('REFUSE·wire '+scope+' has conflicting live declarations'));
  assert.throws(()=>wireAt([a,{...b,by:'one',epoch:'2'}],2),/conflicting live declarations/);
  assert.deepEqual([...wireAt([a,{...b,by:'one'}],3)!.lists.get(scope.slice(5))!],['scope','value','by']);
  assert.deepEqual([...wireAt([a,{...b,value:a.value}],3)!.lists.get(scope.slice(5))!],['scope','value']);
 }
});
