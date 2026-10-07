import {projections} from './walk-profile.ts';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {walkOrigin,walkSnapshot,walkAt,walkInventory} from '../src/walk.ts';
import {canonical} from '../src/wire/index.ts';
test('inventories retain contextual regions; acknowledging a prefix sends no payload',()=>{
 const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex'),fields=['scope','role','form','measure','value','by','at','epoch'];
 const fixture=(by,value)=>canonical({scope:'sample/reading',role:'writes',form:'alphabet',measure:'id',value,by,epoch:'2',at:'origin:sample',sig:'fixture'});
 const a=walkSnapshot([fixture('a','one')],fields,digest,'origin-a'),b=walkSnapshot([fixture('b','other')],fields,digest,'origin-b');
 const together=walkInventory([a.regions,b.regions],digest);assert.equal(together.regions.length,2);assert.equal(together.root,walkInventory([b.regions,a.regions],digest).root);
 assert.equal(walkAt(a,together,8,projections).records.length,0);assert.equal(walkAt(b,together,8,projections).records.length,0);
 assert.deepEqual(walkInventory([a.regions,a.regions],digest),walkInventory([a.regions],digest),'duplicate verified commitments are the same set');
 assert.throws(()=>walkInventory([a.regions,a.regions.map(r=>({...r,digest:digest('different')}))],digest),/ambiguous inventory/);
 assert.throws(()=>walkInventory([a.regions,a.regions.map(r=>({...r,count:r.count+1}))],digest),/ambiguous inventory/);
 assert.throws(()=>walkOrigin([{scope:'keys/a',measure:'public-key',value:'key'}]),/declared ledger origin/);
 const origin={scope:'walk/origin',role:'writes',form:'alphabet',measure:'id',value:'one-ledger'};
 assert.equal(walkOrigin([origin]),'one-ledger');assert.throws(()=>walkOrigin([origin,origin]),/conflicting declared ledger origin/);
});

test('opaque ledger names are escaped as one region coordinate segment',()=>{
 const digest=bytes=>'sha256:'+createHash('sha256').update(bytes).digest('hex');
 const f={scope:'walk/origin',role:'writes',form:'alphabet',measure:'id',value:'team/a b%'};assert.equal(walkOrigin([f]),f.value);
 const line=canonical({scope:'sample/value',role:'writes',form:'alphabet',measure:'id',value:'kept',by:'a',epoch:'2',at:'origin:sample',sig:'fixture'});
 const fields=['scope','role','form','measure','value','by','epoch','at'];
 const own=walkSnapshot([line],fields,digest,f.value),other=walkSnapshot([line],fields,digest,'team%2Fa b%');assert.notEqual(own.regions[0].scope,other.regions[0].scope);
 assert.equal(own.regions[0].scope,'receipts/team%2Fa%20b%25/sample');
});
