import {byBytes,canonical,parse} from '../wire/line.ts';
import {matches} from '../wire/classes.ts';
import {walkProjection,isWalkHeader} from '../walk.ts';
import type {WalkResolution} from '../walk.ts';
import {fromLine} from '../wire/claimline.ts';
export const REGION_READING_PROFILE='topos-region-reading/1' as const;
export interface RegionReadingRequest {
 readonly frame:'canonical-walk-headers@1';readonly inputDigest:string;
 readonly selectors:readonly string[];readonly measure:'all'|'count'|'digest';readonly resolution:number;readonly resolutionProfile:readonly WalkResolution[];
 readonly unit:'canonical-lines'|'declared-walk-count';readonly countUnit?:string;
 readonly evidence:{readonly keyClass:'attest';readonly producer:string;readonly provenance:string;readonly coverage:readonly string[]};
}
const fail=(s:string):never=>{throw Error('REFUSE·region-reading '+s);};
const hash=(x:unknown):x is string=>typeof x==='string'&&/^sha256:[0-9a-f]{64}$/.test(x);
const text=(x:unknown):x is string=>typeof x==='string'&&x.length>0&&!/[\u0000\r\n]/.test(x);
function selectors(xs:readonly string[],cause:string){if(!Array.isArray(xs)||!xs.length||xs.some(x=>!text(x)||/[\s?#\\]/.test(x)||x.split('/').some(k=>k===''||k==='.'||k==='..'))||new Set(xs).size!==xs.length)return fail(cause);}
export function readRegions(bytes:Uint8Array,request:RegionReadingRequest,digestBytes:(bytes:Uint8Array)=>string){
 if(request.frame!=='canonical-walk-headers@1')return fail('frame');if(!hash(request.inputDigest)||digestBytes(bytes)!==request.inputDigest)return fail('input digest');
 selectors(request.selectors,'selectors');if(!['all','count','digest'].includes(request.measure))return fail('measure selector');if(!Number.isSafeInteger(request.resolution)||request.resolution<0)return fail('resolution');
 if(!Array.isArray(request.resolutionProfile)||request.resolutionProfile.some(x=>x.depth!==undefined)||walkProjection(request.resolutionProfile,request.resolution)!=='inventory')return fail('inventory resolution');
 if(!['canonical-lines','declared-walk-count'].includes(request.unit)||request.unit==='declared-walk-count'&&!text(request.countUnit)||request.unit==='canonical-lines'&&request.countUnit!==undefined)return fail('unit');
 const e=request.evidence;if(!e||e.keyClass!=='attest'||!text(e.producer)||!text(e.provenance))return fail('attest declaration');selectors(e.coverage,'coverage');
 let document:string;try{document=new TextDecoder('utf8',{fatal:true}).decode(bytes);}catch{return fail('UTF-8');}
 if(!document.endsWith('\n'))return fail('document bytes');const lines=document.slice(0,-1).split('\n');if(lines.some(x=>!x)||new Set(lines).size!==lines.length||[...lines].sort(byBytes).join('\n')+'\n'!==document)return fail('document bytes');
 const records=lines.map(line=>{const p=parse(line);if(p.kind!=='fact'||canonical(p.value.fields,p.value.version)!==line||!isWalkHeader(line))return fail('walk header');return{line,fields:p.value.fields};});
 for(const r of records)if(r.fields.role!=='writes'||!['digest','count'].includes(r.fields.measure??'')||(r.fields.measure==='digest'?r.fields.form!=='alphabet'||!hash(r.fields.value):r.fields.form!=='interval'))return fail('walk header fields');const coordinates=records.map(r=>(r.fields.scope??'')+' '+r.fields.measure);if(new Set(coordinates).size!==coordinates.length)return fail('ambiguous walk coordinate');const roots=records.filter(x=>x.fields.scope==='walk/root');if(roots.length!==1||roots[0]!.fields.measure!=='digest'||!hash(roots[0]!.fields.value))return fail('walk root');const root=roots[0]!.fields.value;
 for(const r of records.filter(x=>x.fields.scope!=='walk/root'))if(!r.fields.scope?.startsWith('walk/regions/')||r.fields.condition!==root)return fail('walk frame condition');
 const selected=new Set<string>();for(const s of request.selectors){const found=records.filter(x=>matches(s,x.fields.scope??'')&&(request.measure==='all'||x.fields.measure===request.measure));if(!found.length)return fail('selector has no lines '+s);for(const x of found)selected.add(x.line);}
 const chosen=records.filter(x=>selected.has(x.line));for(const x of chosen)if(!e.coverage.some(mask=>matches(mask,x.fields.scope??'')))return fail('outside declared coverage '+x.fields.scope);
 let count=chosen.length;if(request.unit==='declared-walk-count'){
  count=0;for(const x of chosen){if(x.fields.measure!=='count'||x.fields.form!=='interval')return fail('count-only selector');const got=fromLine(x.line,null);if(got.kind!=='fact'||got.value.bound.kind!=='interval')return fail('count value');const b=got.value.bound;if(b.lo===null||b.hi===null||b.lo!==b.hi||!Number.isSafeInteger(b.lo)||b.lo<0)return fail('exact count');count+=b.lo;if(!Number.isSafeInteger(count))return fail('count range');}
 }
 const selectionDigest=digestBytes(new TextEncoder().encode(chosen.map(x=>x.line).join('\n')+'\n'));if(!hash(selectionDigest))return fail('digest algorithm');const matched=chosen.map(x=>({line:x.line,sha256:digestBytes(new TextEncoder().encode(x.line+'\n'))}));if(matched.some(x=>!hash(x.sha256)))return fail('digest algorithm');
 return {profile:REGION_READING_PROFILE,inputDigest:request.inputDigest,frame:request.frame,resolution:request.resolution,projection:'inventory' as const,walkRoot:root,selectors:[...request.selectors].sort(byBytes),measure:request.measure,unit:request.unit,...request.countUnit?{countUnit:request.countUnit}:{},count,matched,selectionDigest,evidence:e,authentication:'not established' as const,execution:'not established' as const,statisticalConfidence:'not applicable' as const};
}
/** Canonical result content is signable data; no signature or permission is supplied. */
export function encodeRegionReading(result:ReturnType<typeof readRegions>):string{
 const fields={profile:result.profile,input:result.inputDigest,frame:result.frame,resolution:String(result.resolution),projection:result.projection,root:result.walkRoot,selectors:JSON.stringify(result.selectors),measure:result.measure,unit:result.unit,count:String(result.count),matched:JSON.stringify(result.matched),selection:result.selectionDigest,evidence:JSON.stringify({keyClass:result.evidence.keyClass,producer:result.evidence.producer,provenance:result.evidence.provenance,coverage:[...result.evidence.coverage].sort(byBytes)}),authentication:result.authentication,execution:result.execution,confidence:result.statisticalConfidence,...result.countUnit?{'count-unit':result.countUnit}:{}};
 return REGION_READING_PROFILE+canonical(fields).slice('bound-lock/1'.length);
}
