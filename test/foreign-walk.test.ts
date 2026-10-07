import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash,sign,verify} from 'node:crypto';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {canonical,parse,signedBytes,formatSignature,parseSignature,wireAt,fromLine,validateObjectContext} from '../src/wire/index.ts';
import {intervalForm} from '../src/forms/interval.ts';
import {alphabetOfForm} from '../src/forms/alphabet.ts';
import {walkSnapshot,walkAt,walkHeaders,readForeignWalk} from '../src/walk.ts';
const hash=x=>'sha256:'+createHash('sha256').update(x).digest('hex');
const keys=generateKeyPairSync('ed25519');
const signed=(fields,epoch=2)=>{const f={...fields,epoch:String(epoch),by:'remote-device'};return canonical({...f,sig:formatSignature('ed25519:sample',sign(null,Buffer.from(signedBytes(f)),keys.privateKey).toString('base64'))})};
const auth=lines=>lines.every(line=>{const f=parse(line).value.fields,sig=parseSignature(f.sig);return f.by==='remote-device'&&sig&&verify(null,Buffer.from(signedBytes(f)),keys.publicKey,Buffer.from(sig.raw,'base64'))});
const wireFields=JSON.parse(readFileSync(new URL('../samples/walk/wire.json',import.meta.url))).map(line=>({...parse(line).value.fields,epoch:'1'}));
for(const [name,value] of [['era','sample'],['signature-algorithms','ed25519:sample'],['digest-algorithms','sha256'],['forms','alphabet|interval']])wireFields.push({scope:'wire/'+name,role:'writes',form:'alphabet',measure:'id',value,at:'policy:sample',by:'owner',epoch:'1'});
const fields=wireFields.find(f=>f.scope==='wire/fields').value.split('|').filter(f=>f!=='sig');
for(const [form,params,values] of [[intervalForm,{lo:0,hi:100},['20..40','30..50']],[alphabetOfForm,{tokens:['manual','source','test']},['manual|source','source|test']]])test('two clocks and isolated foreign history: '+form.id,()=>{
 const origin=hash('foreign ledger '+form.id),context=hash('historical wire + foreign keys + selected codec '+form.id),pin=hash('selected topos '+form.id);
 const cell=signed({type:'cell',scope:'B',id:'cell-B',restsOn:'none',topos:pin,form:form.id,params:hash('parameters'),measure:'id'},1);
 const mark=(id,value,epoch)=>signed({type:'mark',scope:'B',id,sign:'+1',pole:'ceiling',reach:'travels',value},epoch);
 const a=mark('a',values[0],2),b=mark('b',values[1],3);
 const records=[cell,a,b],own=walkSnapshot(records,fields,hash),empty=walkSnapshot([],fields,hash);
 assert.equal(walkAt(own,own,0).open,0);assert.equal(walkAt(own,own,8).records.length,0);
 const packet=walkAt(own,empty,8);assert.equal(packet.open,1);
 const headers=walkHeaders(packet,context,empty.root,true).map(line=>signed(parse(line).value.fields,4));
 const validate=lines=>{const objects=lines.map(line=>fromLine(line,wireAt(wireFields,Number(parse(line).value.fields.epoch))));if(objects.some(g=>g.kind!=='fact'||!('record' in g.value)))return false;return validateObjectContext(objects.map(g=>g.value),{admit:r=>auth([canonical(r.fields)]),resolve:()=>({digest:pin,form,params}),origin:()=>false,witness:()=>false}).kind==='fact'};
 const contract={origin,context,base:empty.root,previousPrefixes:[],fields,digest:hash,authenticatePrefix:auth,authenticateEvidence:auth,validateOriginHistory:validate};
 const received=readForeignWalk([...headers,...packet.records],contract);
 assert.deepEqual(received.records,packet.records);assert.equal(received.senderEpoch,4);
 assert.equal(parse(received.importReceiptProposal).value.fields.epoch,undefined,'receiver receipt awaits its own ordinary local act');
 assert.equal(parse(received.importReceiptProposal).value.fields.sig,undefined,'unsigned proposal is not a native receipt');
 const previous=[{...walkSnapshot([cell,a],fields,hash).regions[0],senderEpoch:2}];
 assert.deepEqual(readForeignWalk([...headers,...packet.records],{...contract,previousPrefixes:previous}).records,packet.records);
 const inserted=mark('inserted',values[0],2),insertedPacket=walkAt(walkSnapshot([cell,a,b,inserted],fields,hash),empty,8),insertedHeaders=walkHeaders(insertedPacket,context,empty.root,true).map(line=>signed(parse(line).value.fields,4));
 assert.throws(()=>readForeignWalk([...insertedHeaders,...insertedPacket.records],{...contract,previousPrefixes:previous}),/epoch does not match the verified prefix/);
 const omittedPacket=walkAt(walkSnapshot([cell,b],fields,hash),empty,8),omittedHeaders=walkHeaders(omittedPacket,context,empty.root,true).map(line=>signed(parse(line).value.fields,4));
 assert.throws(()=>readForeignWalk([...omittedHeaders,...omittedPacket.records],{...contract,previousPrefixes:previous}),/not an extension/);
 const replay=readForeignWalk([...headers,...packet.records],contract);assert.equal(replay.identity,received.identity,'delivery does not add an origin or alter import identity');
 const otherOrigin=readForeignWalk([...headers,...packet.records],{...contract,origin:hash('different ledger')});assert.notEqual(otherOrigin.identity,received.identity,'ledger identity is separate from key identity');
 assert.throws(()=>readForeignWalk([...headers.map(line=>line.replace('value=sha256:','value=sha256:0')),...packet.records],contract),/not authenticated/);
 assert.throws(()=>readForeignWalk([...headers,...packet.records.slice(1)],contract),/mismatch|partial/);
 // A signed later epoch must not enter an earlier cut even with matching digest/count metadata.
 const future=mark('future',values[0],5),futurePacket=walkAt(walkSnapshot([cell,future],fields,hash),empty,8),futureHeaders=walkHeaders(futurePacket,context,empty.root,true).map(line=>signed(parse(line).value.fields,4));
 assert.throws(()=>readForeignWalk([...futureHeaders,...futurePacket.records],contract),/outside the authenticated prefix/);
 // The actual Topos object-context validator receives foreign history only; a local ID cannot pay a foreign takes.
 const localOnly='local-only',withdraw=signed({type:'mark',scope:'B',id:'anti',sign:'-1',takes:localOnly},3),badPacket=walkAt(walkSnapshot([cell,withdraw],fields,hash),empty,8),badHeaders=walkHeaders(badPacket,context,empty.root,true).map(line=>signed(parse(line).value.fields,4));
 assert.throws(()=>readForeignWalk([...badHeaders,...badPacket.records],contract),/receiver does not admit/);
 const goodWithdraw=signed({type:'mark',scope:'B',id:'anti-a',sign:'-1',takes:'a'},3),goodPacket=walkAt(walkSnapshot([cell,a,goodWithdraw],fields,hash),empty,8),goodHeaders=walkHeaders(goodPacket,context,empty.root,true).map(line=>signed(parse(line).value.fields,4));
 const taken=readForeignWalk([...goodHeaders,...goodPacket.records],contract);assert.ok(taken.records.includes(a));assert.ok(taken.records.includes(goodWithdraw),'withdraw travels with its original target and bytes');
 assert.throws(()=>readForeignWalk([...headers,...packet.records],{...contract,authenticateEvidence:()=>false}),/receiver does not admit/);
 if(process.env.BOUND_WALK_SAMPLES){
  mkdirSync(process.env.BOUND_WALK_SAMPLES,{recursive:true});
  const common={status:'SDK fixture; not CLI walk acceptance',contract:'whole-region@1',origin,context,base:empty.root,identityFields:fields,senderPublicKey:keys.publicKey.export({type:'spki',format:'der'}).toString('base64'),historicalWire:wireFields};
  writeFileSync(join(process.env.BOUND_WALK_SAMPLES,form.id+'.json'),JSON.stringify({...common,lines:[...headers,...packet.records],expected:{identity:received.identity,senderEpoch:4,records:received.records,importReceiptProposal:received.importReceiptProposal}},null,2)+'\n');
  writeFileSync(join(process.env.BOUND_WALK_SAMPLES,form.id+'.no.json'),JSON.stringify({...common,lines:[...badHeaders,...badPacket.records],expected:{kind:'refuse',cause:'foreign exact-ID withdrawal has no target in its origin history'}},null,2)+'\n');
 }
});
