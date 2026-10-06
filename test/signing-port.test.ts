import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {signedBytes,signersOf,authorityOf,signerRequestBytes,signerResponseBytes,signerResponseOf,signerSelection} from '@lapxo/topos/wire';
const algorithm='ed25519:fixture',sig=algorithm+':'+Buffer.alloc(64).toString('base64');
const bytes=['one','two'].map(value=>signedBytes({scope:'unrelated/'+value,by:'device',epoch:'3',at:'policy:fixture',role:'writes',form:'alphabet',measure:'id',value}));
const lot={bytes,keyId:'device',algorithm};
const vector=JSON.parse(readFileSync(new URL('../vectors/signing-port.json',import.meta.url),'utf8'));

test('wire transport preserves payload order and rejects noncanonical requests and replies',()=>{
 assert.equal(signerRequestBytes(lot),bytes.join('\n')+'\n');
 for(const c of vector.cases){const framed=signerResponseBytes(bytes.map(()=>({keyId:c.responseBy,signature:sig})));if(c.valid)assert.equal(signerResponseOf(framed,lot).length,bytes.length);else assert.throws(()=>signerResponseOf(framed,lot),/REFUSE·signer/);}
 const records=bytes.map(()=>({keyId:'device',signature:sig}));const reply=signerResponseBytes(records);assert.deepEqual(signerResponseOf(reply,lot),records);
 for(const bad of [reply.slice(0,-1),reply+'\n',reply.replace('by=device','by=someone'),reply.replace('ed25519:fixture','ed25519:other'),reply.replace('by=device','by=device about=extra')])assert.throws(()=>signerResponseOf(bad,lot),/REFUSE·signer/);
 assert.throws(()=>signerRequestBytes({...lot,bytes:[bytes[0]+' sig=unexpected']}),/REFUSE·signer/);
});
const row=(scope:string,measure:string,value:string,form='alphabet')=>({scope,measure,value,form,role:'writes',by:'owner',sig:'test',epoch:'1',at:'policy:fixture'});
const declarations=[row('keys/device','signer','local'),row('signer/timeout','milliseconds','1000..1000','interval'),row('signer/response-bytes','bytes','4096..4096','interval')];
test('signer declaration is explicit and its limits are finite exact intervals',()=>{
 assert.deepEqual(signerSelection(declarations,'device'),{name:'local',timeoutMs:1000,responseBytes:4096});
 for(const bad of [[],declarations.slice(0,1),[...declarations,row('keys/device','signer','other')],declarations.map(f=>f.measure==='milliseconds'?{...f,value:'0..0'}:f),declarations.map(f=>f.measure==='milliseconds'?{...f,value:'1..*'}:f),declarations.map(f=>f.measure==='milliseconds'?{...f,form:'alphabet'}:f),declarations.map(f=>({...f,role:'demands'}))])assert.throws(()=>signerSelection(bad,'device'),/REFUSE·signer/);
});
test('transport metadata cannot grant key identity, coverage or authority',()=>{
 const root={id:'owner',keyClass:'authorize' as const,publicKey:'root',coverage:['*'],depth:{lo:1,hi:16},admittedBy:[]};
 const before=signersOf([],root,()=>true),after=signersOf(declarations,root,()=>true);assert.deepEqual(after,before);
 assert.notEqual(authorityOf({...row('unrelated/a','id','yes'),by:'device'},after.admitted,()=>true).kind,'admitted');
});
