import {receiptProjection, type ReceiptRegion} from './receipts.ts';
import {parse,canonical,byBytes,PROTOCOL} from './wire/line.ts';
import {fromLine} from './wire/claimline.ts';
import {authorityOf} from './wire/claimline.ts';
import type {Signer} from './wire/claimline.ts';
import {wireAt} from './wire/claimline.ts';

export interface WalkRegion extends ReceiptRegion {readonly records: readonly string[]}
export interface WalkSnapshot {readonly root: string; readonly regions: readonly WalkRegion[]}
export interface WalkSummary {readonly root: string; readonly regions: readonly {readonly scope: string; readonly digest: string}[]}
export interface Walk {readonly root: string; readonly regions: readonly ReceiptRegion[]; readonly records: readonly string[]; readonly touched: number; readonly open: number}
export type Digest = (bytes: string) => string;
export type Authenticate = (lines: readonly string[]) => boolean;
const refuse = (why: string): never => {throw Error('REFUSE·walk '+why)};
const record = (line: string) => {const got=parse(line);if(got.kind!=='fact')return refuse('invalid canonical record');return got.value};

/** Ledger identity is explicit context data. Neither a key nor a snapshot mints it. */
export function walkOrigin(parts:readonly Readonly<Record<string,string>>[]):string {
 const rows=parts.filter(f=>f.scope==='walk/origin'&&f.role==='writes'&&f.form==='alphabet'&&f.measure==='id'&&f.value!=='withdraw');
 if(rows.length!==1||!rows[0]!.value||/[\s/]/.test(rows[0]!.value!))return refuse('missing or conflicting declared ledger origin');
 return rows[0]!.value!;
}

/** A pinned authority snapshot authenticates this origin only. It grants no receiver coverage.
 * Each key's class, coverage, public key and resolution must be explicit and unambiguous.
 * Historical key changes require their own selected snapshot; payload key claims cannot alter this one.
 */
export function walkAuthority(parts: readonly Readonly<Record<string,string>>[], verify: (fields: Readonly<Record<string,string>>, key: string, algorithms: readonly string[]) => boolean) {
 const wire=wireAt(parts,Number.MAX_SAFE_INTEGER);if(!wire||!wire.signatures.size)return refuse('origin context has no signature contract');
 const algorithms=[...wire.signatures];
 const ids=[...new Set(parts.filter(f=>f.scope?.startsWith('keys/')&&f.measure==='public-key').map(f=>f.scope!.slice(5)))];
 const signers:Signer[]=ids.map(id=>{
  const said=(measure:string)=>{const values=parts.filter(f=>f.scope==='keys/'+id&&f.measure===measure&&f.value!=='withdraw');if(values.length!==1)return refuse('origin key '+id+' has missing or conflicting '+measure);return values[0]!.value!;};
  const className=said('class'),coverage=said('coverage').split('|'),publicKey=said('public-key');
  if(!className||!publicKey||coverage.some(value=>!value))refuse('incomplete origin key '+id);
  const depth=fromLine(canonical({scope:'keys/'+id,role:'writes',form:'interval',measure:'resolution',value:said('resolution'),by:'target',at:'policy:walk'}),null);
  if(depth.kind!=='fact'||depth.value.bound.kind!=='interval'||depth.value.bound.lo===null||depth.value.bound.hi===null)return refuse('origin key '+id+' has no bounded resolution');
  return {id,keyClass:className==='authorize'?'authorize':'attest',publicKey,coverage,depth:{lo:depth.value.bound.lo,hi:depth.value.bound.hi},admittedBy:[]};
 });
 if(!signers.length)refuse('origin context has no keys');
 const of=(line:string)=>{const got=record(line);return authorityOf(got.fields,signers,(f,key)=>verify(f,key,algorithms));};
 return {of,authenticate:(lines:readonly string[])=>lines.every(line=>of(line).kind==='admitted'),wire};
}

/** The caller selects authenticated history under its declared region contract. This is not cell-receipt identity. */
export function walkSnapshot(records: readonly string[], fields: readonly string[], digest: Digest, origin?:string): WalkSnapshot {
 const complete=[...new Set(records.map(line=>{
  const got=record(line);
  if(canonical(got.fields,got.version)!==line)refuse('noncanonical record');
  if(!got.fields.sig)refuse('unsigned evidence');
  for(const key of Object.keys(got.fields))if(key!=='sig'&&!fields.includes(key))refuse('identity omits '+key);
  return line;
 }))].sort(byBytes);
 const projection=receiptProjection(complete,fields,digest);
 const regions=projection.regions.map(region=>({...region,records:complete.filter(line=>record(line).fields.scope!.split('/')[0]===region.scope.slice('receipts/'.length)),scope:origin?'receipts/'+origin+'/'+region.scope.slice('receipts/'.length):region.scope}));
 return {root:origin?walkInventory([regions],digest).root:projection.root,regions};
}

/** Inventory acknowledges verified origin-qualified prefixes. It is not a new
 * origin, an authority grant, or a digest of a Topos. No payload is re-signed.
 */
export function walkInventory(groups:readonly (readonly ReceiptRegion[])[],digest:Digest):WalkSnapshot {
 const regions=new Map<string,ReceiptRegion>();
 for(const group of groups)for(const region of group){if(regions.has(region.scope))refuse('ambiguous inventory region '+region.scope);regions.set(region.scope,region)}
 const ordered=[...regions.values()].sort((a,b)=>byBytes(a.scope,b.scope));
 const claims=ordered.flatMap(region=>[canonical({scope:region.scope,role:'writes',form:'alphabet',measure:'digest',value:region.digest,by:'target',at:'receipt:walk'}),canonical({scope:region.scope,role:'writes',form:'interval',measure:'count',value:`${region.count}..${region.count}`,by:'target',at:'receipt:walk'})]);
 return {root:receiptProjection(claims,['scope','role','form','measure','value'],digest).root,regions:ordered.map(region=>({...region,records:[]}))};
}

/** Peer summaries must be authenticated before selection. Selection performs no transport or invocation. */
export function walkAt(own: WalkSnapshot, peer: WalkSummary, resolution: number, requested?: readonly string[]): Walk {
 if(![0,1,8].includes(resolution))refuse('unsupported resolution');
 const known=new Map<string,string>();
 for(const region of peer.regions){if(known.has(region.scope))refuse('ambiguous peer region '+region.scope);known.set(region.scope,region.digest)}
 const differences=own.regions.filter(region=>known.get(region.scope)!==region.digest);
 const wanted=requested??differences.map(region=>region.scope);
 if(new Set(wanted).size!==wanted.length)refuse('duplicate requested region');
 for(const name of wanted)if(!differences.some(region=>region.scope===name))refuse('region is not an open requested difference '+name);
 const selected=differences.filter(region=>wanted.includes(region.scope));
 return {root:own.root,regions:(resolution===0?own.regions:selected).map(({records,...region})=>region),records:resolution===8?[...new Set(selected.flatMap(region=>region.records))].sort(byBytes):[],touched:resolution===8?selected.length:0,open:differences.length};
}

/** Completeness precedes the receiver's whole-lot boundary. This operation never commits or grants coverage. */
export function walkPayload(records: readonly string[], expected: readonly ReceiptRegion[], fields: readonly string[], digest: Digest, admit: Authenticate, origin?:string): readonly string[] {
 const actual=walkSnapshot(records,fields,digest,origin);
 if(new Set(expected.map(region=>region.scope)).size!==expected.length)refuse('ambiguous expected region');
 if(actual.regions.length!==expected.length)refuse('partial or extra payload');
 for(const wanted of expected){const got=actual.regions.find(region=>region.scope===wanted.scope);if(!got||got.digest!==wanted.digest||got.count!==wanted.count)refuse('region digest or count mismatch '+wanted.scope)}
 if(admit(records)!==true)refuse('receiver does not admit evidence');
 return [...new Set(records)].sort(byBytes);
}

const ROOT='walk/root',REGIONS='walk/regions/';
/** A discriminator of protocol metadata only, never a replacement for the wire admission grammar. */
export function isWalkHeader(line: string): boolean {const f=record(line).fields;return !f.type&&(f.scope===ROOT||Boolean(f.scope?.startsWith(REGIONS)))}
export function walkHeaders(walk: Walk, context: string, base: string, withCounts: boolean): readonly string[] {
 const row=(scope: string,form: string,measure: string,value: string,condition: string)=>canonical({scope,form,measure,value,condition,role:'writes',at:'receipt:'+context,by:'target'});
 return [row(ROOT,'alphabet','digest',walk.root,base),...walk.regions.flatMap(region=>[row(REGIONS+region.scope,'alphabet','digest',region.digest,walk.root),...(withCounts?[row(REGIONS+region.scope,'interval','count',`${region.count}..${region.count}`,walk.root)]:[])])].sort(byBytes);
}
export interface WalkHeaderRegion {readonly scope: string; readonly digest: string; readonly count?: number}
export interface WalkHeaders {readonly root: string; readonly context: string; readonly base: string; readonly signer: string; readonly regions: readonly WalkHeaderRegion[]}
/** Authentication is separate from receiver coverage. The context names the admitted interpretation and authority. */
export function readWalkHeaders(lines: readonly string[], context: string, base: string, authenticate: Authenticate): WalkHeaders {
 if(!lines.length||authenticate(lines)!==true)refuse('metadata is not authenticated');
 const allowed=['scope','role','form','measure','value','condition','by','at','epoch','sig'];
 const records=lines.map(line=>{
  const got=record(line),f=got.fields;
  if(got.version!==PROTOCOL.split('/').at(-1)||!isWalkHeader(line))refuse('unknown metadata record');
  if(Object.keys(f).some(key=>!allowed.includes(key))||allowed.some(key=>f[key]===undefined))refuse('missing or extra metadata field');
  if(canonical(f)!==line||f.role!=='writes'||f.at!=='receipt:'+context)refuse('metadata context or canonical bytes differ');
  return f;
 });
 const roots=records.filter(f=>f.scope===ROOT);if(roots.length!==1)refuse('missing or ambiguous root');
 const root=roots[0]!;
 if(root.form!=='alphabet'||root.measure!=='digest'||root.condition!==base)refuse('stale base or wrong root grammar');
 if(records.some(f=>f.by!==root.by||f.epoch!==root.epoch))refuse('metadata mixes signers or epochs');
 const regions=new Map<string,{scope: string; digest?: string; count?: number}>();
 for(const f of records.filter(f=>f.scope!==ROOT)){
  const scope=f.scope!.slice(REGIONS.length);if(!scope||f.condition!==root.value)refuse('region does not rest on the authenticated root');
  const region=regions.get(scope)??{scope};
  if(f.form==='alphabet'&&f.measure==='digest'){if(region.digest!==undefined)refuse('ambiguous region digest');region.digest=f.value!}
  else if(f.form==='interval'&&f.measure==='count'){
   const decoded=fromLine(canonical(f),null);
   if(decoded.kind!=='fact')return refuse('count has no declared interval encoding');
   if(decoded.value.bound.kind!=='interval')return refuse('count has no declared interval encoding');
   const {lo,hi}=decoded.value.bound;
   if(lo===null)return refuse('count is ambiguous or not discrete');
   if(region.count!==undefined||lo!==hi||!Number.isSafeInteger(lo)||lo<0)return refuse('count is ambiguous or not discrete');
   region.count=lo;
  }else refuse('unknown region grammar');
  regions.set(scope,region);
 }
 if([...regions.values()].some(region=>region.digest===undefined))refuse('region digest absent');
 return {root:root.value!,context,base,signer:root.by!,regions:[...regions.values()].map(region=>({...region,digest:region.digest!})).sort((a,b)=>byBytes(a.scope,b.scope))};
}
export interface WalkAdmission {readonly context: string; readonly base: string; readonly fields: readonly string[]; readonly digest: Digest; readonly authenticateMetadata: Authenticate; readonly admitBatch: Authenticate}
/** Preserved historical epochs require an explicit receiver contract; the ordinary local-act epoch rule is not relaxed here. */
export function readWalkPayload(lines: readonly string[], options: WalkAdmission) {
 const headers=lines.filter(isWalkHeader),payload=lines.filter(line=>!isWalkHeader(line));
 const metadata=readWalkHeaders(headers,options.context,options.base,options.authenticateMetadata);
 if(metadata.regions.some(region=>region.count===undefined))refuse('payload was offered without its summary');
 const expected=metadata.regions.map(region=>({...region,count:region.count!}));
 const records=walkPayload(payload,expected,options.fields,options.digest,records=>options.admitBatch([...headers,...records])===true);
 return {metadata,records,headers};
}

export interface ForeignWalkContract {
 /** Admitted identity of the foreign place/ledger; a signing key is not this identity or an independent object origin. */
 readonly origin: string;
 /** Explicit contextual namespace, when the admitted caller exchanges qualified region inventories. */
 readonly regionOrigin?:string;
 readonly context: string;
 readonly base: string;
 readonly fields: readonly string[];
 readonly digest: Digest;
 /** Verify @1 against that origin's declared historical keys/standing. Receiver coverage is not consulted or granted. */
 readonly authenticatePrefix: Authenticate;
 /** Verified prior complete regional prefixes, retained per foreign origin. No local records belong here. */
 readonly previousPrefixes: readonly (WalkRegion & {readonly senderEpoch: number})[];
 readonly authenticateEvidence: Authenticate;
 /** Decode the historical wire and validate exact-ID targets using this origin's history only. */
 readonly validateOriginHistory: Authenticate;
}
export interface ForeignWalkEvidence {
 readonly origin: string;
 readonly senderEpoch: number;
 readonly records: readonly string[];
 readonly headers: readonly string[];
 readonly identity: string;
 /** An unsigned proposal, not a receipt: the receiver's ordinary signer/next epoch must produce and atomically commit the native import receipt. */
 readonly importReceiptProposal: string;
}

/** Verify complete selected-region history at a signed sender cut. A flat digest proves no arbitrary subrange or missing unseen suffix. */
export function readForeignWalk(lines: readonly string[], contract: ForeignWalkContract): ForeignWalkEvidence {
 if(!contract.origin)refuse('foreign origin identity absent');
 if(contract.regionOrigin!==undefined&&contract.regionOrigin!==contract.origin)refuse('region origin differs from authenticated origin');
 const headers=lines.filter(isWalkHeader),payload=lines.filter(line=>!isWalkHeader(line));
 const metadata=readWalkHeaders(headers,contract.context,contract.base,contract.authenticatePrefix);
 const senderEpochText=record(headers[0]!).fields.epoch!;
 if(!/^(0|[1-9][0-9]*)$/.test(senderEpochText))refuse('invalid sender prefix epoch');
 const senderEpoch=Number(senderEpochText);
 if(!Number.isSafeInteger(senderEpoch))refuse('invalid sender prefix epoch');
 for(const line of payload){
  const epochText=record(line).fields.epoch;
  if(epochText===undefined||!/^(0|[1-9][0-9]*)$/.test(epochText)||!Number.isSafeInteger(Number(epochText))||Number(epochText)>senderEpoch)refuse('foreign epoch is outside the authenticated prefix');
 }
 if(metadata.regions.some(region=>region.count===undefined))refuse('prefix was offered without its summary');
 const expected=metadata.regions.map(region=>({...region,count:region.count!}));
 const records=walkPayload(payload,expected,contract.fields,contract.digest,records=>contract.authenticateEvidence(records)===true&&contract.validateOriginHistory(records)===true,contract.regionOrigin);
 const current=walkSnapshot(records,contract.fields,contract.digest,contract.regionOrigin);
 for(const region of current.regions){
  const previous=contract.previousPrefixes.filter(prefix=>prefix.scope===region.scope);
  if(previous.length>1)refuse('ambiguous previous origin prefix');
  const prior=previous[0];if(!prior)continue;
  if(senderEpoch<prior.senderEpoch)refuse('sender cut precedes the verified origin prefix');
  const old=new Set(prior.records.map(line=>canonical(Object.fromEntries(Object.entries(record(line).fields).filter(([key])=>key!=='sig')))));
  const fresh=new Set(region.records.map(line=>canonical(Object.fromEntries(Object.entries(record(line).fields).filter(([key])=>key!=='sig')))));
  if([...old].some(line=>!fresh.has(line)))refuse('foreign history is not an extension of its verified prefix');
  for(const line of region.records){const got=record(line);const semantic=canonical(Object.fromEntries(Object.entries(got.fields).filter(([key])=>key!=='sig')));if(Number(got.fields.epoch)<=prior.senderEpoch&&!old.has(semantic))refuse('foreign epoch does not match the verified prefix');}
 }
 const identityInputs=[canonical({scope:'receipts/import',role:'writes',form:'alphabet',measure:'digest',value:metadata.root,condition:contract.origin,at:'receipt:'+contract.context,by:'target'}),...expected.flatMap(region=>[canonical({scope:region.scope,role:'writes',form:'alphabet',measure:'digest',value:region.digest,at:'receipt:'+contract.context,by:'target'}),canonical({scope:region.scope,role:'writes',form:'interval',measure:'count',value:`${region.count}..${region.count}`,at:'receipt:'+contract.context,by:'target'})])];
 const identity=receiptProjection(identityInputs,['scope','role','form','measure','value','condition','at'],contract.digest).root;
 return {origin:contract.origin,senderEpoch,records,headers,identity,importReceiptProposal:canonical({scope:'receipts',role:'writes',form:'alphabet',measure:'digest',value:identity,at:'receipt:'+contract.context,by:'target'})};
}

export interface WalkSelection {readonly contract: 'whole-region@1'; readonly fields: readonly string[]; readonly metadataFields: readonly string[]; readonly resolutions: readonly number[]}
/** Read an already folded, admitted contract. These claims grant no signer coverage and select no transport. */
export function walkSelection(standing: readonly string[]): WalkSelection {
 const at=(scope: string): string=>{
  const found=standing.map(record).map(got=>got.fields).filter(f=>f.scope===scope&&f.value!=='withdraw');
  if(found.length!==1||found[0]!.form!=='alphabet'||found[0]!.measure!=='id'||found[0]!.role!=='writes')return refuse('missing or conflicting declaration '+scope);
  return found[0]!.value!;
 };
 if(at('wire/walk/contract')!=='whole-region@1')refuse('unsupported declared exchange contract');
 const fields=at('wire/walk/fields').split('|'),metadataFields=at('wire/walk/metadata-fields').split('|'),resolutionTokens=at('wire/walk/resolutions').split('|');
 if(resolutionTokens.some(token=>!['0','1','8'].includes(token)))refuse('unsupported declared resolutions');
 const resolutions=resolutionTokens.map(Number);
 if(new Set(fields).size!==fields.length||['scope','by','epoch'].some(key=>!fields.includes(key))||fields.some(key=>!key||key==='sig'))refuse('incomplete history identity field contract');
 const required=['scope','role','form','measure','value','condition','by','at','epoch','sig'];
 if(metadataFields.length!==required.length||new Set(metadataFields).size!==metadataFields.length||required.some(key=>!metadataFields.includes(key)))refuse('unsupported metadata field contract');
 if(resolutions.length!==3||new Set(resolutions).size!==3||[0,1,8].some(n=>!resolutions.includes(n)))refuse('unsupported declared resolutions');
 return {contract:'whole-region@1',fields,metadataFields,resolutions};
}
