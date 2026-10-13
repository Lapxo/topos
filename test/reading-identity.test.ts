import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readingIdentityBytes,readingIdentity,readingReceiptBytes,readingReceiptIdentity,
  type ReadingIdentityContext} from '../src/contract/reading-identity.ts';

const text=(bytes:Uint8Array)=>new TextDecoder().decode(bytes);
const vectors=JSON.parse(readFileSync(new URL('../vectors/reading-identity.json',import.meta.url),'utf8'));
for(const sample of vectors.yes as {name:string;context:ReadingIdentityContext;expected:string}[]){
  test('reading context has the declared canonical bytes: '+sample.name,()=>{
    assert.equal(text(readingIdentityBytes(sample.context)),sample.expected);
    assert.equal(readingIdentity(sample.context,text),sample.expected);
    for(const key of ['inputs','environment'] as const)
      assert.equal(text(readingIdentityBytes({...sample.context,[key]:[...sample.context[key]].reverse()})),sample.expected);
    for(const key of ['instrument','implementation','policy'] as const)
      assert.notEqual(text(readingIdentityBytes({...sample.context,[key]:sample.context[key]+'-changed'})),sample.expected);
    for(const key of ['inputs','environment'] as const)
      assert.notEqual(text(readingIdentityBytes({...sample.context,[key]:[...sample.context[key],['extra','changed']]})),sample.expected);
  });
}
for(const sample of vectors.no as {name:string;context:ReadingIdentityContext;refusal:string}[]){
  test('reading context refuses '+sample.name,()=>{
    assert.throws(()=>readingIdentityBytes(sample.context),(error:unknown)=>
      error instanceof Error&&error.message===sample.refusal);
  });
}
test('a reading name does not erase a differing result or authorize its reuse',()=>{
  const same=readingReceiptIdentity('reading-a','result-a',text);
  assert.equal(same,'["reading-receipt@1","reading-a","result-a"]\n');
  assert.equal(text(readingReceiptBytes('reading-a','result-a')),same);
  assert.notEqual(readingReceiptIdentity('reading-a','result-b',text),same);
  assert.notEqual(readingReceiptIdentity('reading-b','result-a',text),same);
  assert.throws(()=>readingReceiptBytes('','result-a'),/missing receipt/);
  assert.throws(()=>readingReceiptBytes('reading-a',''),/missing receipt/);
});
