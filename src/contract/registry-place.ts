import {byBytes,canonical,parse} from '../wire/line.ts';
import {decodeSourceCard,inspectSourceCard} from './source-card.ts';
import type {SourceCardCatalog} from './source-card.ts';
export const REGISTRY_PLACE_PROFILE='topos-registry-place/1' as const;
export interface RegistryHorizon {readonly clock:string;readonly unit:string;readonly from:number;readonly through:number}
export interface RegistryQuorum {readonly kind:'named-threshold@1';readonly eligible:readonly string[];readonly required:number}
export interface RegistryEntry {readonly kind:'admit-lineage'|'withdraw-exact';readonly place:string;readonly holder:string;readonly lineage:string;readonly shares?:readonly string[];readonly card?:string;readonly horizon?:RegistryHorizon;readonly quorum?:RegistryQuorum;readonly target?:string}
export interface RegistryContext {readonly artifacts:ReadonlyMap<string,Uint8Array>;readonly catalog:SourceCardCatalog;readonly digestBytes:(bytes:Uint8Array)=>string}
const fail=(s:string):never=>{throw Error('REFUSE·registry-place '+s);};
const text=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&!/[\u0000\r\n]/.test(x);
const hash=(x:unknown):x is string=>typeof x==='string'&&/^sha256:[0-9a-f]{64}$/.test(x);
const obj=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==='object'&&!Array.isArray(x);
function keys(x:object,names:readonly string[],cause:string){if(Object.keys(x).some(k=>!names.includes(k)))return fail(cause);}
function list(x:readonly string[],cause:string):readonly string[]{if(!Array.isArray(x)||x.some(v=>!text(v)))return fail(cause);return [...new Set(x)].sort(byBytes);}
function normalized(e:RegistryEntry):Record<string,string>{
 if(!obj(e))return fail('entry');keys(e,['kind','place','holder','lineage','shares','card','horizon','quorum','target'],'fields');
 for(const n of ['place','holder','lineage']as const)if(!text(e[n]))return fail('identity '+n);
 if(e.kind!=='admit-lineage'&&e.kind!=='withdraw-exact')return fail('kind');
 const f:Record<string,string>={kind:e.kind,place:e.place,holder:e.holder,lineage:e.lineage};
 if(e.kind==='admit-lineage'){
  if(e.target!==undefined)return fail('admission target');
  if(e.shares!==undefined)f.shares=JSON.stringify(list(e.shares,'shares'));
  if(e.card!==undefined){if(!hash(e.card))return fail('card digest');f.card=e.card;}
 }else {if(!hash(e.target))return fail('exact target digest');if(e.shares!==undefined||e.card!==undefined)return fail('withdrawal payload');f.target=e.target;}
 if(e.horizon!==undefined){const h=e.horizon;if(!obj(h))return fail('horizon');keys(h,['clock','unit','from','through'],'horizon fields');if(!text(h.clock)||!text(h.unit)||!Number.isSafeInteger(h.from)||!Number.isSafeInteger(h.through)||h.from<0||h.from>h.through)return fail('horizon');f.horizon=JSON.stringify({clock:h.clock,unit:h.unit,from:h.from,through:h.through});}
 if(e.quorum!==undefined){const q=e.quorum;if(!obj(q))return fail('quorum');keys(q,['kind','eligible','required'],'quorum fields');if(q.kind!=='named-threshold@1')return fail('quorum kind');const eligible=list(q.eligible,'quorum eligible');if(!eligible.length||eligible.length!==q.eligible.length||!Number.isSafeInteger(q.required)||q.required<1||q.required>eligible.length)return fail('quorum threshold');f.quorum=JSON.stringify({kind:q.kind,eligible,required:q.required});}
 return f;
}
export function encodeRegistryEntry(entry:RegistryEntry):string{return REGISTRY_PLACE_PROFILE+canonical(normalized(entry)).slice('bound-lock/1'.length);}
export function decodeRegistryEntry(line:string):RegistryEntry{
 if(!line.startsWith(REGISTRY_PLACE_PROFILE+' '))return fail('profile');const got=parse('bound-lock/1'+line.slice(REGISTRY_PLACE_PROFILE.length));if(got.kind!=='fact')return fail('record');const f=got.value.fields;keys(f,['kind','place','holder','lineage','shares','card','horizon','quorum','target'],'fields');const e:Record<string,unknown>={...f};for(const k of ['shares','horizon','quorum'])if(f[k]!==undefined)try{e[k]=JSON.parse(f[k]);}catch{return fail('JSON '+k);}if(encodeRegistryEntry(e as unknown as RegistryEntry)!==line)return fail('canonical bytes');return e as unknown as RegistryEntry;
}
/** Entry identity is SHA-256 of its canonical UTF-8 line plus one LF, with full holder/context retained. */
export function registryEntryBytes(entry:RegistryEntry):Uint8Array{return new TextEncoder().encode(encodeRegistryEntry(entry)+'\n');}
function one(bytes:Uint8Array):string{let s:string;try{s=new TextDecoder('utf8',{fatal:true}).decode(bytes);}catch{return fail('UTF-8');}if(!s.endsWith('\n')||s.slice(0,-1).includes('\n'))return fail('single line bytes');return s.slice(0,-1);}
function artifact(id:string,ctx:RegistryContext):Uint8Array|undefined{const b=ctx.artifacts.get(id);if(b!==undefined&&ctx.digestBytes(b)!==id)return fail('artifact digest');return b;}
export function inspectRegistryEntry(input:RegistryEntry,ctx:RegistryContext){
 const e=decodeRegistryEntry(encodeRegistryEntry(input)),needs:string[]=[];if(e.horizon===undefined)needs.push('horizon');if(e.quorum===undefined)needs.push('quorum');
 if(e.kind==='admit-lineage'){
  if(e.shares===undefined)needs.push('shares');if(e.card===undefined)needs.push('card');else{const bytes=artifact(e.card,ctx);if(bytes===undefined)needs.push('bytes/card:'+e.card);else inspectSourceCard(decodeSourceCard(one(bytes)),ctx.catalog);}
 }else{
  const bytes=artifact(e.target!,ctx);if(bytes===undefined)needs.push('bytes/target:'+e.target);else{const target=decodeRegistryEntry(one(bytes));if(target.kind!=='admit-lineage')return fail('target is not admission');if(target.place!==e.place||target.holder!==e.holder||target.lineage!==e.lineage)return fail('target attribution');}
 }
 const identity=ctx.digestBytes(registryEntryBytes(e));if(!hash(identity))return fail('digest algorithm');
 return {status:needs.length?'open' as const:'declared' as const,entry:e,identity,needs:needs.sort(byBytes),authority:'not established' as const,quorumDecision:'not evaluated' as const,horizonDecision:'not evaluated' as const,independence:'not established' as const};
}
/** Canonical inscriptions only. No admission, withdrawal application, expiry, quorum execution or history fold. */
export function registryLines(entries:readonly RegistryEntry[]):string{return [...new Set(entries.map(encodeRegistryEntry))].sort(byBytes).map(s=>s+'\n').join('');}
