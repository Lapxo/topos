import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonical,parse} from '../src/core.ts';

const vector=JSON.parse(readFileSync(new URL('../vectors/canonical-compatibility.json',import.meta.url),'utf8'));
test('the existing format retains its published lexical meaning',()=>{
  for(const sample of vector.cases){
    const result=parse(sample.input);
    if(sample.refuse){
      assert.equal(result.kind,'refuse',sample.name);
      if(result.kind==='refuse')assert.ok(result.why.includes(sample.refuse),sample.name);
    }else{
      assert.equal(result.kind,'fact',sample.name);
      if(result.kind==='fact')assert.equal(canonical(result.value.fields,result.value.version),sample.canonical,sample.name);
    }
  }
});
test('byte identity never silently becomes decoded-text identity',()=>{
  const hex=(bytes:Uint8Array)=>[...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  for(const sample of vector.bytes){
    if(sample.text!==undefined)assert.equal(hex(new TextEncoder().encode(sample.text)),sample.hex,sample.name);
    else{
      const bytes=Uint8Array.from(sample.hex.match(/../g).map((byte:string)=>parseInt(byte,16)));
      assert.throws(()=>new TextDecoder('utf-8',{fatal:true}).decode(bytes));
      assert.equal(hex(new TextEncoder().encode(sample.replacementText)),sample.replacementHex);
      assert.notEqual(sample.hex,sample.replacementHex);
    }
  }
  assert.notEqual(vector.bytes[0].hex,vector.bytes[1].hex,'normalization would change existing identities');
});
