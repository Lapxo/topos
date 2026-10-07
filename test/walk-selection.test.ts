import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonical,parse} from '../src/wire/index.ts';
import {walkProjection,walkSelection} from '../src/walk.ts';
const rows=JSON.parse(readFileSync(new URL('../samples/walk/declarations.json',import.meta.url),'utf8'));
test('walk exists only under its admitted explicit contract',()=>{
 const got=walkSelection(rows);assert.deepEqual(got.resolutions,[0,1,8]);assert.ok(got.fields.includes('epoch'));assert.ok(got.fields.includes('type'));assert.ok(got.fields.includes('takes'));assert.ok(!got.fields.includes('sig'));
 assert.throws(()=>walkSelection([]),/missing or conflicting/);assert.throws(()=>walkSelection([...rows,rows[0]]),/missing or conflicting/);
 const change=(scope,value)=>rows.map(line=>{const f=parse(line).value.fields;return f.scope===scope?canonical({...f,value}):line});
 assert.throws(()=>walkSelection(change('wire/walk/contract','unknown')),/unsupported declared exchange/);
 assert.throws(()=>walkSelection(change('wire/walk/resolutions','|1|8')),/invalid declared resolutions/);
 assert.throws(()=>walkSelection(change('wire/walk/fields','scope|value')),/incomplete history/);
 assert.throws(()=>walkSelection(change('wire/walk/metadata-fields','scope|value')),/unsupported metadata/);
});

test('resolution meaning is declared and can grow without a new numeric whitelist',()=>{
 const declare=(scope,value)=>canonical({scope,value,role:'writes',form:'alphabet',measure:'id',by:'target',at:'policy:sample'});
 const extend=rows.filter(line=>!['wire/walk/resolutions','wire/walk/projections'].includes(parse(line).value.fields.scope));
 const selected=walkSelection([...extend,declare('wire/walk/resolutions','2|4|6|4096'),declare('wire/walk/projections','2:inventory|4:summary|6:history|4096:history')]);
 assert.deepEqual(selected.resolutions,[2,4,6,4096]);assert.equal(walkProjection(selected.projections,undefined),'inventory');
 assert.throws(()=>walkProjection([...selected.projections,{resolution:9,projection:'inventory'}],undefined),/ambiguous resolution/);
 assert.equal(selected.projections.find(p=>p.resolution===6).projection,'history');
 for(const bad of ['2:inventory|4:summary|6:history','2:inventory|4:summary|6:history|6:history','2:inventory|4:summary|6:execute|4096:history'])
  assert.throws(()=>walkSelection([...extend,declare('wire/walk/resolutions','2|4|6|4096'),declare('wire/walk/projections',bad)]),/REFUSE·walk/);
});
