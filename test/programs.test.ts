import {test} from 'node:test';
import assert from 'node:assert/strict';
import {programsOf} from '../src/contract/index.ts';
import type {Program} from '../src/contract/index.ts';
const row=(scope:string,needs:readonly string[],restsOn:readonly string[]=[]):Program=>({scope,needs,restsOn});

for(const names of [['contract','artifact','optional'],['seed','harvest','survey']]) {
  test('evidence and dependencies carry the meaning: '+names[0],()=>{
    const [a,b,c]=names as [string,string,string];
    const programs=[row(b,['b-proof'],[a]),row(c,['c-proof']),row(a,['a-proof'])];
    const first=programsOf({programs,minimum:[a,b],evidence:new Map([['a-proof','met']]),ceiling:14});
    assert.equal(first.closed,false);assert.equal(first.deadline,'unread');
    assert.equal(first.rows.find(r=>r.scope===b)?.status,'unread');assert.ok(first.next.includes(b));
    const paid=programsOf({programs,minimum:[a,b],evidence:new Map([['a-proof','met'],['b-proof','met']]),elapsed:15,ceiling:14});
    assert.equal(paid.closed,true);assert.equal(paid.rows.find(r=>r.scope===c)?.carry,true);
    assert.equal(paid.rows.find(r=>r.scope===b)?.carry,false);
    const held=programsOf({programs,minimum:[a,b],evidence:new Map([['b-proof','met']])});
    assert.equal(held.rows.find(r=>r.scope===b)?.status,'blocked');
  });
}
test('absence and vacuity never certify a program',()=>{
  assert.throws(()=>programsOf({programs:[],minimum:[],evidence:new Map()}),/vacuity/);
  const result=programsOf({programs:[row('a',[])],minimum:['a'],evidence:new Map()});
  assert.equal(result.closed,false);assert.equal(result.rows[0]?.status,'unread');
});
test('a refused proof and a missing proof remain different causes',()=>{
  const result=programsOf({programs:[row('a',['rejected','absent'])],minimum:['a'],evidence:new Map([['rejected','refused']])});
  assert.deepEqual(result.rows[0]?.missing,['rejected']);assert.deepEqual(result.rows[0]?.unread,['absent']);
  assert.equal(result.closed,false);
});
test('cyclic, unknown or ambiguous declarations refuse with coordinates',()=>{
  assert.throws(()=>programsOf({programs:[row('a',['proof'],['missing'])],minimum:['a'],evidence:new Map()}),/unknown dependency missing/);
  assert.throws(()=>programsOf({programs:[row('a',['x'],['b']),row('b',['y'],['a'])],minimum:['a'],evidence:new Map()}),/dependency cycle a/);
  assert.throws(()=>programsOf({programs:[row('a',['x']),row('a',['y'])],minimum:['a'],evidence:new Map()}),/duplicate.*coordinate a/);
  assert.throws(()=>programsOf({programs:[row('a',['x','x'])],minimum:['a'],evidence:new Map()}),/requirement at a/);
});
test('declaration order is not dependency order or proof',()=>{
  const programs=[row('a',['x']),row('b',['y'],['a'])];
  const input={programs,minimum:['a','b'],evidence:new Map([['x','met'],['y','unmet']] as const)};
  assert.deepEqual(programsOf(input),programsOf({...input,programs:[...programs].reverse()}));
  assert.equal(programsOf(input).closed,false);
});
test('a deep declared plan does not depend on a language call-stack limit',()=>{
  const programs=Array.from({length:12000},(_,i)=>row(String(i),['proof'],i?[String(i-1)]:[]));
  const result=programsOf({programs,minimum:['11999'],evidence:new Map([['proof','met']])});
  assert.equal(result.closed,true);assert.equal(result.rows.length,programs.length);
});
