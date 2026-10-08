import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,createPublicKey,verify} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const root=process.env.TOPOS_SAMPLE_PACKAGE?pathToFileURL(resolve(process.env.TOPOS_SAMPLE_PACKAGE)+'/'):new URL('../',import.meta.url);
const wire=await import(process.env.TOPOS_SAMPLE_PACKAGE?new URL('dist/wire/index.js',root).href:new URL('../src/wire/index.ts',import.meta.url).href);
const json=(path:string)=>JSON.parse(readFileSync(new URL(path,root),'utf8'));
test('published public-boundary samples reproduce the captured SDK vector',()=>{
 const yes=json('samples/public-boundary/yes.json'),no=json('samples/public-boundary/no.json'),vector=json('vectors/public-boundary.json');
 const key=createPublicKey({key:Buffer.from(yes.publicKey,'base64'),format:'der',type:'spki'});
 const authentic=(line:string)=>{const parsed=wire.parse(line);if(parsed.kind!=='fact')return false;const f=parsed.value.fields;return f.by==='fixture'&&typeof f.sig==='string'&&f.sig.startsWith('ed25519:')&&verify(null,Buffer.from(wire.signedBytes(f)),key,Buffer.from(f.sig.slice(8),'base64'));};
 const digest=(bytes:string)=>'sha256:'+createHash('sha256').update(bytes).digest('hex'),output:unknown[]=[];
 for(const [i,c]of yes.acts.entries()){
  const scopes=new Set(c.records.map((line:string)=>wire.parse(line).value.fields.scope));
  const contract={...c,digest,admitsRecord:(line:string,epoch:number)=>authentic(line)&&scopes.has(wire.parse(line).value.fields.scope)&&wire.parse(line).value.fields.epoch===String(epoch),verifiesReceipt:authentic};
  const result=wire.actResultOf(c.records,c.receipt,contract);output.push({kind:'act',case:i,identity:result.identity,epoch:result.epoch,records:result.records.length});
  assert.deepEqual(wire.actResultOf(c.records,c.receipt,contract),result,'repeated projection adds no act');
  for(const n of no.acts.filter((n:any)=>n.case===i)){
   assert.throws(()=>wire.actResultOf(n.change==='reverse-records'?[...c.records].reverse():c.records,c.receipt,{...contract,...(n.change==='foreign-receipt-context'?{context:'receipt:foreign'}:{}),...(n.change==='deny-record-authority'?{admitsRecord:()=>false}:{})}), (error:Error)=>{assert.match(error.message,/^REFUSE·act/);output.push({kind:'refuse',case:i,change:n.change,why:error.message});return true;});
  }
 }
 const policy=wire.readerLifetime(yes.reader.lines,yes.reader.reference);assert.deepEqual(policy,yes.reader.expected);output.push({kind:'reader',value:policy});
 assert.throws(()=>wire.readerLifetime(no.reader.lines,no.reader.reference),(error:Error)=>{assert.match(error.message,/^REFUSE·reader/);output.push({kind:'refuse',change:'disjoint-reader-limits',why:error.message});return true;});
 assert.deepEqual(output,vector.output);
});
