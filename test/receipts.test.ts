import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {createHash} from 'node:crypto';
import {receiptProjection} from '@lapxo/topos/receipts';
import {canonical} from '@lapxo/topos/wire';
const hash = (text:string) => 'sha256:' + createHash('sha256').update(text).digest('hex');
const fields = ['scope','role','measure','form','value','at'];
const line = (value:string, by='observer', epoch='1') => canonical({scope:'domain/a',role:'writes',form:'alphabet',measure:'id',value,at:'place:evidence',by,epoch});
test('receipt projection excludes delivery envelope and deduplicates semantic evidence', () => {
 const one=receiptProjection([line('yes')],fields,hash);
 assert.deepEqual(receiptProjection([line('yes'),line('yes','other','22')],fields,hash),one);
 assert.notEqual(receiptProjection([line('no')],fields,hash).root,one.root);
});
test('receipt projection requires its field contract and rejects excluded evidence',()=>{
 assert.throws(()=>receiptProjection([line('yes')],[],hash),/field contract/);
 assert.throws(()=>receiptProjection([line('yes')],fields,hash,['observer']),/excluded evidence/);
});
