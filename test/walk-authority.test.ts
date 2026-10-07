import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,verify} from 'node:crypto';
import {walkAuthority} from '../src/walk.ts';
import {canonical,signedBytes,formatSignature,parseSignature} from '../src/wire/index.ts';
test('pinned context authenticates declared keys only; journal identities do not become signers',()=>{
 const pair=generateKeyPairSync('ed25519'),publicKey=pair.publicKey.export({type:'spki',format:'der'}).toString('base64');
 const row=(scope,measure,value,form='alphabet')=>({scope,measure,value,form,role:'writes',at:'policy:context'});
 const parts=[row('wire/signature-algorithms','id','ed25519:sample'),row('keys/device','class','authorize'),row('keys/device','coverage','sample|walk'),row('keys/device','public-key',publicKey),row('keys/device','resolution','1..16','interval'),row('keys/journal','class','read')];
 const verifier=(f,key,algorithms)=>{const sig=parseSignature(f.sig);return sig&&algorithms.includes(sig.algorithm)&&verify(null,Buffer.from(signedBytes(f)),{key:Buffer.from(key,'base64'),type:'spki',format:'der'},Buffer.from(sig.raw,'base64'));};
 const auth=walkAuthority(parts,verifier);
 const signed=scope=>{const f={...row(scope,'id','observed'),by:'device',epoch:'4'};return canonical({...f,sig:formatSignature('ed25519:sample',sign(null,Buffer.from(signedBytes(f)),pair.privateKey).toString('base64'))})};
 assert.equal(auth.authenticate([signed('sample/reading')]),true);assert.equal(auth.authenticate([signed('keys/other')]),false);
 assert.equal(auth.authenticate([signed('sample/reading').replace('value=observed','value=changed')]),false);
 assert.throws(()=>walkAuthority(parts.filter(f=>f.measure!=='coverage'),verifier),/missing or conflicting coverage/);
 assert.throws(()=>walkAuthority([...parts,row('keys/device','public-key','other')],verifier),/conflicting public-key/);
});
