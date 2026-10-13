/** Prospective, opt-in pure contract. NOT exported/activated by the package yet.
 * local-act@1 is unchanged; caller trust comes from the admitted instrument. */
import {byBytes,canonical,parse,signedBytes} from './line.ts';
import {authorityAtEpoch,type Signer} from './claimline.ts';
export const PLACE_ACT_CONTEXT='place-act-context@1';
export interface ClockBudget {readonly bytes:number;readonly records:number;readonly placements:number;readonly policies:number;readonly proofs:number;readonly signers:number}
export interface RootContext {readonly namespace:string;readonly snapshot:string;readonly epoch:string;readonly prefix:string;readonly head:string;readonly policies:readonly string[]}
export interface OriginProof {readonly by:string;readonly signature:string}
export interface PlaceContext {readonly place:string;readonly previous:string;readonly epoch:string;readonly originPrefix:string;readonly records:readonly string[];readonly proofs:readonly OriginProof[]}
export interface PlaceAct {readonly root:RootContext;readonly places:readonly PlaceContext[]}
export interface PlaceReceipt {readonly by:string;readonly place:string;readonly signature:string}
export interface TrustedClockContract {
  readonly budget:ClockBudget;
  readonly root:RootContext;
  readonly signers:readonly Signer[];
  readonly places:readonly string[];
  readonly regionFamily:string;
  readonly receiptSigner:string;
  readonly receiptScope:string;
  /** These functions are instrument-selected, not packet-selected. Never an
   * arbitrary input boolean. They authenticate complete prefixes and namespaces. */
  readonly verifiesRootContext:(context:RootContext)=>boolean;
  readonly verifiesNamespaceAdmission:(place:string,root:RootContext)=>boolean;
  readonly verifiesNewLocalPrefix:(place:string,prefix:string,epoch:string,originals:readonly string[])=>boolean;
  readonly verifiesOriginal:(original:string,signer:Signer,root:RootContext)=>boolean;
  readonly verifiesProof:(bytes:string,signature:string,signer:Signer,root:RootContext)=>boolean;
  readonly digest:(bytes:string)=>string;
}
const refuse=(why:string):never=>{throw Error('REFUSE·place-act '+why)};
const exactString=(value:unknown):value is string=>typeof value==='string'&&value.length>0;
const clock=(value:unknown):string=>{if(!exactString(value)||!/^(0|[1-9][0-9]*)$/.test(value)||value.length>String(Number.MAX_SAFE_INTEGER).length||!Number.isSafeInteger(Number(value)))return refuse('unknown or invalid clock');return value};
const budget=(b:ClockBudget):void=>{if(!b||typeof b!=='object')refuse('missing resource budget');for(const name of ['bytes','records','placements','policies','proofs','signers'] as const)if(!Number.isSafeInteger(b[name])||b[name]<1)refuse('missing resource '+name)};
const bytes=(text:string)=>new TextEncoder().encode(text).byteLength;
const fields=(original:string):Readonly<Record<string,string>>=>{const got=parse(original);if(got.kind!=='fact')return refuse('noncanonical or unsigned original');if(canonical(got.value.fields,got.value.version)!==original||!got.value.fields.sig||!got.value.fields.by)return refuse('noncanonical or unsigned original');return got.value.fields};
const place=(p:string):void=>{if(p!=='.'&&(!p.endsWith('/TARGET.bound')||p.startsWith('/')||p.split('/').some(s=>s===''||s==='.'||s==='..')))refuse('unknown place coordinate')};
const frame=(value:readonly unknown[])=>JSON.stringify(value)+'\n';
const rootTuple=(r:RootContext)=>[r.namespace,r.snapshot,r.epoch,r.prefix,r.head,r.policies];
export function originContextBytes(root:RootContext,p:PlaceContext,by:string,b:ClockBudget):string {
 placeActContextBytes({root,places:[p]},b);if(!exactString(by))refuse('unknown origin signer');
 if(by.length>b.bytes)refuse('byte budget');const out=frame([PLACE_ACT_CONTEXT,'origin',by,p.place,p.epoch,p.originPrefix,root.snapshot,p.records]);if(by.length>b.bytes||bytes(out)>b.bytes)refuse('byte budget');return out;
}
export function placeActContextBytes(a:PlaceAct,b:ClockBudget):string {
 budget(b);if(!a||typeof a!=='object'||!a.root||!Array.isArray(a.places)||!Array.isArray(a.root.policies))refuse('incomplete context');
 if(a.places.some(p=>!p||!Array.isArray(p.records)||!Array.isArray(p.proofs)))refuse('incomplete place context');
 if(a.places.length>b.placements||a.root.policies.length>b.policies)refuse('dependency/placement budget');
 let count=0,proofs=0,total=0;
 const scalar=(value:unknown)=>{if(!exactString(value))return refuse('unknown context reference');if(value.length>b.bytes)refuse('byte budget');total+=value.length;if(total>b.bytes)refuse('byte budget')};
 for(const value of [a.root.namespace,a.root.snapshot,a.root.epoch,a.root.prefix,a.root.head,...a.root.policies])scalar(value);
 for(const p of a.places){count+=p.records.length;proofs+=p.proofs.length;if(count>b.records||proofs>b.proofs)refuse('record/proof budget');
   for(const value of [p.place,p.previous,p.epoch,p.originPrefix,...p.records])scalar(value);
   for(const proof of p.proofs){if(!proof||typeof proof!=='object')refuse('unknown origin proof');scalar(proof.by);scalar(proof.signature)}
 }
 const value=frame([PLACE_ACT_CONTEXT,'transaction',rootTuple(a.root),a.places.map(p=>[p.place,p.previous,p.epoch,p.originPrefix,p.records,p.proofs.map(proof=>[proof.by,proof.signature])])]);
 if(bytes(value)>b.bytes)refuse('byte budget');readPlaceActContext(value,b);return value;
}
/** Byte cap BEFORE JSON.parse; closed tuple shape/count caps BEFORE line parsing,
 * hashes/signatures/prefix callbacks. No recursive general JSON canonicalizer. */
export function readPlaceActContext(encoded:string,b:ClockBudget):PlaceAct {
 budget(b);if(typeof encoded!=='string'||bytes(encoded)>b.bytes)refuse('byte budget');
 let tuple:any;try{tuple=JSON.parse(encoded)}catch{return refuse('invalid framing')}
 if(!Array.isArray(tuple)||tuple.length!==4||tuple[0]!==PLACE_ACT_CONTEXT||tuple[1]!=='transaction')refuse('unsupported clock profile');
 const r=tuple[2],ps=tuple[3];if(!Array.isArray(r)||r.length!==6||!Array.isArray(r[5])||!Array.isArray(ps))refuse('incomplete context');
 if(r[5].length>b.policies||ps.length>b.placements)refuse('dependency/placement budget');
 let count=0,proofCount=0;
 for(const p of ps){if(!Array.isArray(p)||p.length!==6||!Array.isArray(p[4])||!Array.isArray(p[5]))refuse('incomplete place context');count+=p[4].length;proofCount+=p[5].length}
 if(count>b.records||proofCount>b.proofs)refuse('record/proof budget');
 if(!ps.length||!count)refuse('empty transaction');
 if(!r.slice(0,5).every(exactString)||!r[5].every(exactString))refuse('unknown authority context');clock(r[2]);
 if(new Set(r[5]).size!==r[5].length||r[5].some((v:string,i:number)=>i>0&&byBytes(r[5][i-1],v)>=0))refuse('noncanonical policy dependencies');
 const places:PlaceContext[]=ps.map((p:any)=>{if(!p.slice(0,4).every(exactString)||!p[4].every(exactString)||!p[4].length)refuse('unknown place context');place(p[0]);clock(p[2]);
   if(p[5].some((proof:any)=>!Array.isArray(proof)||proof.length!==2||!proof.every(exactString)))refuse('unknown origin proof');
   const proofs=p[5].map((proof:any)=>({by:proof[0],signature:proof[1]}));
   if(new Set(proofs.map((p:OriginProof)=>p.by)).size!==proofs.length||proofs.some((p:OriginProof,i:number)=>i>0&&byBytes(proofs[i-1].by,p.by)>=0))refuse('duplicate/noncanonical origin proofs');
   return {place:p[0],previous:p[1],epoch:p[2],originPrefix:p[3],records:p[4],proofs};});
 if(new Set(places.map(p=>p.place)).size!==places.length||places.some((p,i)=>i>0&&byBytes(places[i-1]!.place,p.place)>=0))refuse('duplicate/noncanonical places');
 const root={namespace:r[0],snapshot:r[1],epoch:r[2],prefix:r[3],head:r[4],policies:r[5]};
 if(frame([PLACE_ACT_CONTEXT,'transaction',rootTuple(root),ps])!==encoded)refuse('noncanonical framing');
 return {root,places};
}
function eligibility(f:Readonly<Record<string,string>>,p:PlaceContext,s:Signer,root:RootContext,family:string):void {
 const scope=p.place==='.'?f.scope!:[family,p.place.slice(0,-'/TARGET.bound'.length),f.scope].join('/');
 // Projection changes only the authorization coordinate, NEVER signature input.
 // The originating key-class gate is also checked on unchanged original scope.
 const verdict=authorityAtEpoch(f,s,Number(clock(root.epoch)),scope,'authority');
 if(verdict.kind!=='admitted')refuse('authority '+verdict.kind+' '+verdict.why);
}
/** Explicit root-clock authorization; NEVER alters signed epoch/bytes. Namespace
 * membership/authenticated prefix must have been established by the instrument. */
function verifyAuthenticatedOriginal(original:string,p:PlaceContext,contract:TrustedClockContract):void {
 const f=fields(original),signer=contract.signers.find(s=>s.id===f.by);
 if(!signer||contract.verifiesOriginal(original,signer,contract.root)!==true)return refuse('original signature');
 if(clock(f.epoch)!==p.epoch)refuse('origin clock mismatch');
 eligibility(f,p,signer,contract.root,contract.regionFamily);
}
export function verifyPlaceActContext(encoded:string,contract:TrustedClockContract):{readonly identity:string;readonly context:PlaceAct;readonly dependencies:RootContext} {
 if(!contract||typeof contract!=='object')refuse('missing instrument trust');
 const a=readPlaceActContext(encoded,contract.budget);
 for(const name of ['verifiesRootContext','verifiesNamespaceAdmission','verifiesNewLocalPrefix','verifiesOriginal','verifiesProof','digest'] as const)if(typeof contract[name]!=='function')refuse('missing instrument verifier '+name);
 if(!contract.root||!Array.isArray(contract.signers)||!Array.isArray(contract.places))refuse('missing authenticated context');
 if(new Set(contract.signers.map(s=>s.id)).size!==contract.signers.length)refuse('duplicate signer id');
 if(contract.signers.length>contract.budget.signers||!contract.places.length||!exactString(contract.regionFamily))refuse('trusted context budget/mapping');
 if(frame(rootTuple(a.root))!==frame(rootTuple(contract.root))||contract.verifiesRootContext(a.root)!==true)refuse('unauthenticated authority context');
 for(const p of a.places){
   if(!contract.places.includes(p.place)||contract.verifiesNamespaceAdmission(p.place,a.root)!==true)refuse('namespace not admitted');
   if(contract.verifiesNewLocalPrefix(p.place,p.originPrefix,p.epoch,p.records)!==true)refuse('origin prefix or legacy reinterpretation');
   const signers=[...new Set(p.records.map(line=>fields(line).by!))].sort(byBytes);
   if(signers.length!==p.proofs.length||signers.some((by,i)=>p.proofs[i]!.by!==by))refuse('missing/borrowed origin proof');
   for(const proof of p.proofs){const signer=contract.signers.find(s=>s.id===proof.by);if(!signer||contract.verifiesProof(originContextBytes(a.root,p,proof.by,contract.budget),proof.signature,signer,a.root)!==true)refuse('origin proof signature')}
   const identities=p.records.map(line=>contract.digest(signedBytes(fields(line))));if(new Set(identities).size!==identities.length)refuse('duplicate original');
   for(const line of p.records)verifyAuthenticatedOriginal(line,p,contract);
 }
 return {identity:contract.digest(encoded),context:a,dependencies:a.root};
}
export function placeReceiptBytes(identity:string,p:PlaceContext,root:RootContext,by:string,receiptScope:string,b:ClockBudget):string {
 placeActContextBytes({root,places:[p]},b);if(!exactString(identity)||!exactString(by)||!exactString(receiptScope))refuse('unknown receipt identity/signer');
 if(identity.length>b.bytes||by.length>b.bytes||receiptScope.length>b.bytes)refuse('byte budget');const out=frame([PLACE_ACT_CONTEXT,'receipt',by,receiptScope,identity,p.place,p.previous,p.epoch,root.snapshot]);if(bytes(out)>b.bytes)refuse('byte budget');return out;
}
export function placeActReceiptsOf(encoded:string,receipts:readonly PlaceReceipt[],contract:TrustedClockContract):{identity:string;places:readonly {place:string;epoch:string}[]} {
 if(!contract||typeof contract!=='object')refuse('missing instrument trust');budget(contract.budget);
 if(!Array.isArray(receipts))refuse('unknown receipt set');
 if(receipts.length>contract.budget.placements)refuse('receipt budget');
 let receiptSize=0;for(const r of receipts){if(!r||typeof r!=='object')refuse('unknown receiver receipt');for(const value of [r.by,r.place,r.signature]){if(!exactString(value)||value.length>contract.budget.bytes)refuse('receipt byte budget');receiptSize+=value.length}}
 if(receiptSize>contract.budget.bytes||bytes(JSON.stringify(receipts))>contract.budget.bytes)refuse('receipt byte budget');
 if(receipts.length>contract.budget.placements)refuse('receipt budget');
 if(!exactString(contract.receiptScope))refuse('unknown receiver scope');
 const result=verifyPlaceActContext(encoded,contract);
 if(receipts.length!==result.context.places.length||new Set(receipts.map(r=>r.place)).size!==receipts.length)refuse('incomplete/duplicate receiver receipts');
 const signer=contract.signers.find(s=>s.id===contract.receiptSigner);if(!signer)return refuse('unknown receiver signer');
 const receiverVerdict=authorityAtEpoch({scope:contract.receiptScope,by:signer.id},signer,Number(clock(contract.root.epoch)),contract.receiptScope,'authority');
 if(receiverVerdict.kind!=='admitted')refuse('receiver authority '+receiverVerdict.kind+' '+receiverVerdict.why);
 for(const p of result.context.places){const receipt=receipts.find(r=>r.place===p.place);if(!receipt||receipt.by!==contract.receiptSigner||contract.verifiesProof(placeReceiptBytes(result.identity,p,result.context.root,receipt.by,contract.receiptScope,contract.budget),receipt.signature,signer,contract.root)!==true)refuse('receiver receipt signature')}
 return {identity:result.identity,places:result.context.places.map(p=>({place:p.place,epoch:p.epoch}))};
}
/** Returns dependencies to a guarded HOST boundary, never a freshness permit.
 * Historical replay may inspect original context; a new admission must atomically
 * compare these heads AND each selected previous head at actual publication. */

/** Standalone public use has the SAME budgets, anchored context, namespace,
 * origin prefix/proofs and signatures as full transaction verification. */
export function verifyOriginalAtAuthorityContext(original:string,p:PlaceContext,contract:TrustedClockContract):void {
 if(!contract||typeof contract!=='object')refuse('missing instrument trust');budget(contract.budget);
 if(typeof original!=='string'||original.length>contract.budget.bytes||bytes(original)>contract.budget.bytes)refuse('byte budget');
 const encoded=placeActContextBytes({root:contract.root,places:[p]},contract.budget);
 if(!p.records.includes(original))refuse('original not in bound context');
 verifyPlaceActContext(encoded,contract);
}
