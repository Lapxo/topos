import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonical,parse} from '../src/wire/index.ts';
import {walkSelection} from '../src/walk.ts';
const rows=JSON.parse(readFileSync(new URL('../samples/walk/declarations.json',import.meta.url),'utf8'));
test('walk exists only under its admitted explicit contract',()=>{
 const got=walkSelection(rows);assert.deepEqual(got.resolutions,[0,1,8]);assert.ok(got.fields.includes('epoch'));assert.ok(got.fields.includes('type'));assert.ok(got.fields.includes('takes'));assert.ok(!got.fields.includes('sig'));
 assert.throws(()=>walkSelection([]),/missing or conflicting/);assert.throws(()=>walkSelection([...rows,rows[0]]),/missing or conflicting/);
 const change=(scope,value)=>rows.map(line=>{const f=parse(line).value.fields;return f.scope===scope?canonical({...f,value}):line});
 assert.throws(()=>walkSelection(change('wire/walk/contract','unknown')),/unsupported declared exchange/);
 assert.throws(()=>walkSelection(change('wire/walk/resolutions','|1|8')),/unsupported declared resolutions/);
 assert.throws(()=>walkSelection(change('wire/walk/fields','scope|value')),/incomplete history/);
 assert.throws(()=>walkSelection(change('wire/walk/metadata-fields','scope|value')),/unsupported metadata/);
});
