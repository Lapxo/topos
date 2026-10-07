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
 assert.equal(walkAt(a,together,8).records.length,0);assert.equal(walkAt(b,together,8).records.length,0);
 assert.throws(()=>walkInventory([a.regions,a.regions],digest),/ambiguous inventory/);
 assert.throws(()=>walkOrigin([{scope:'keys/a',measure:'public-key',value:'key'}]),/declared ledger origin/);
 const origin={scope:'walk/origin',role:'writes',form:'alphabet',measure:'id',value:'one-ledger'};
 assert.equal(walkOrigin([origin]),'one-ledger');assert.throws(()=>walkOrigin([origin,origin]),/conflicting declared ledger origin/);
});
