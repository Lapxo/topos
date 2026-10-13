/** Validation WORLD support, not SDK runtime or public executor. */
import {createHash,verify,createPublicKey} from 'node:crypto';
const FIXTURE_ANCHOR={"id":"owner","publicKey":"MCowBQYDK2VwAyEAafzF/Ch8FOs30s6ktPN6gGfJQiLJ4Z1sQU5s27ggrmc=","keyClass":"authorize","coverage":["*"],"depth":{"lo":1,"hi":16},"admittedBy":[]} as const;

import {readPlaceActContext,verifyPlaceActContext,placeActReceiptsOf,type TrustedClockContract} from '../src/wire/place-act-context.ts';
import {parse,signedBytes,parseSignature,signersOf} from '../src/wire/index.ts';
const digest=(text:string)=>'sha256:'+createHash('sha256').update(text).digest('hex');
const verifies=(text:string,signature:string,key:string)=>{const s=parseSignature(signature);return s?.algorithm==='ed25519:sample'&&verify(null,Buffer.from(text),createPublicKey({key:Buffer.from(key,'base64'),format:'der',type:'spki'}),Buffer.from(s.raw,'base64'))};
const budget={bytes:65536,records:16,placements:2,policies:4,proofs:8,signers:4};
export function observe(bytes:Uint8Array){
 const sample=JSON.parse(new TextDecoder().decode(bytes));
 const decoded=readPlaceActContext(sample.context,budget),root=decoded.root;
 const fields=(line:string)=>{const got=parse(line);if(got.kind!=='fact')throw Error('REFUSE·world malformed original');return got.value.fields};
 const signed=(f:any,key:string)=>verifies(signedBytes(f),f.sig,key);
 const anchor=FIXTURE_ANCHOR;if(JSON.stringify(sample.rootAnchor)!==JSON.stringify(anchor))throw Error('REFUSE·world fixture anchor mismatch');
 // Anchor is public fixture DATA pinned in this validation world's compiled
 // bytes, never chosen by an input packet. This world judges its declared samples;
 // it never grants Bound keys or authenticates a consumer's real authority.
 const prefixDigest=digest(sample.rootPrefix.join('\n')+'\n');
 const signers=signersOf(sample.rootPrefix.map(fields),anchor,signed).admitted;
 const places=['catalog/TARGET.bound','inventory/TARGET.bound'];
 const contract:TrustedClockContract={budget,root,signers,places,regionFamily:'region',receiptSigner:anchor.id,receiptScope:'receipts',digest,
  verifiesRootContext:c=>c.prefix===prefixDigest&&c.head===prefixDigest&&verifies(JSON.stringify(c)+'\n',sample.rootProof,anchor.publicKey)&&sample.rootPrefix.every((line:string)=>signed(fields(line),anchor.publicKey)),
  verifiesNamespaceAdmission:place=>sample.rootPrefix.some((line:string)=>{const f=fields(line),name=place.slice(0,-'/TARGET.bound'.length);return f.scope==='region/'+name&&f.value===name+'/**'&&signed(f,anchor.publicKey)}),
  verifiesNewLocalPrefix:(place,prefix,epoch,originals)=>epoch==='2'&&prefix===digest('origin:'+place+':2')&&originals.length===1&&originals[0]===sample.original&&!sample.rootPrefix.includes(originals[0]),
  verifiesOriginal:(line,key)=>signed(fields(line),key.publicKey),verifiesProof:(text,signature,key)=>verifies(text,signature,key.publicKey),};
 const result=placeActReceiptsOf(sample.context,sample.receipts,contract);
 if(result.identity!==sample.expected.identity||JSON.stringify(result.places)!==JSON.stringify(sample.expected.places))throw Error('REFUSE·world exact result differs');
 return [{scope:'conformance/place-act-context/result',role:'reads',measure:'result',bound:{kind:'enumerated',values:[JSON.stringify(result)]}}];
}
