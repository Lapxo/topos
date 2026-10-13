import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {observe} from './place-act-context-support.ts';
import * as core from '@lapxo/topos/core';
import * as wire from '@lapxo/topos/wire';
const sample=JSON.parse(readFileSync(new URL('../samples/place-act-context/yes.json',import.meta.url),'utf8'));
const budget=sample.budget;
const evaluate=(s:unknown)=>observe(new TextEncoder().encode(JSON.stringify(s)));
test('public context API preserves original signed bytes',()=>{
 for(const name of ['placeActContextBytes','readPlaceActContext','originContextBytes','verifyOriginalAtAuthorityContext','verifyPlaceActContext','placeReceiptBytes','placeActReceiptsOf'] as const)assert.equal(core[name],wire[name]);
 assert.equal(core.PLACE_ACT_CONTEXT,'place-act-context@1');assert.equal(evaluate(sample).length,1);
 assert.equal(wire.placeActContextBytes(wire.readPlaceActContext(sample.context,budget),budget),sample.context);
 const p=wire.readPlaceActContext(sample.context,budget).places[0];assert.equal(p.records[0],sample.original);assert.equal(p.epoch,'2');
});
test('receiver statement scope is cryptographically bound',()=>assert.throws(()=>evaluate({...sample,receipts:sample.scopeSubstitutionReceipts}),/receiver receipt signature/));
test('origin routing and root checkpoint tampering refuse',()=>{
 const act=wire.readPlaceActContext(sample.context,budget);act.places[0].originPrefix=act.places[1].originPrefix;
 assert.throws(()=>evaluate({...sample,context:wire.placeActContextBytes(act,budget)}),/origin prefix|legacy reinterpretation/);
 assert.throws(()=>evaluate({...sample,rootProof:sample.rootProof.slice(0,-4)+(sample.rootProof.at(-4)==='A'?'B':'A')+sample.rootProof.slice(-3)}),/unauthenticated authority context/);
});
test('parse and constructors bound work before authentication',()=>{
 assert.throws(()=>wire.readPlaceActContext(sample.context,{...budget,bytes:1}),/byte budget/);
 assert.throws(()=>wire.readPlaceActContext(sample.context,undefined as any),/missing resource budget/);
 const act=wire.readPlaceActContext(sample.context,budget);
 assert.throws(()=>wire.placeActContextBytes({...act,root:{...act.root,namespace:'x'.repeat(budget.bytes+1)}},budget),/byte budget/);
 assert.throws(()=>wire.placeReceiptBytes(sample.expected.identity,act.places[0],act.root,'owner','receipts',undefined as any),/missing resource budget/);
});
