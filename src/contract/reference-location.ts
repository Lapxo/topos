import {readSemanticStanding,semanticStandingBytes} from '../topos/semantic-projection.ts';

/** A separate, explicit content-reference profile. It does not fetch or authenticate. */
export const LOCATION_REFERENCE_PROFILE = '#topos-reference:1?' as const;
export interface LocatedReference {
 readonly class:'standing'; readonly algorithm:'sha256'; readonly digest:string; readonly blob:string;
 readonly location?:string; readonly 'location-class'?:'viewer'|'holder';
}
const required=['class','algorithm','digest','blob'] as const;
const optional=['location','location-class'] as const;
const fail=(cause:string):never=>{throw Error('REFUSE·reference-location '+cause);};
const owns=(o:object,k:string)=>Object.prototype.hasOwnProperty.call(o,k);
const hex=/^[0-9a-f]{64}$/;
export function checkLocatedReference(value:unknown):LocatedReference {
 if(value===null||typeof value!=='object'||Array.isArray(value))return fail('record');
 const r=value as Record<string,unknown>,keys=Object.keys(r);
 if(required.some(k=>!owns(r,k))||keys.some(k=>![...required,...optional].includes(k as typeof required[number])))return fail('fields');
 if(r.class!=='standing')return fail('class');
 if(r.algorithm!=='sha256')return fail('algorithm');
 if(typeof r.digest!=='string'||!hex.test(r.digest)||typeof r.blob!=='string'||!/^sha256:[0-9a-f]{64}$/.test(r.blob))return fail('digest');
 const has=owns(r,'location'),hasClass=owns(r,'location-class');
 if(has!==hasClass)return fail('location pair');
 if(has){
  if(r['location-class']!=='viewer'&&r['location-class']!=='holder')return fail('location class');
  if(typeof r.location!=='string'||!r.location)return fail('location URL');
  let u:URL;try{u=new URL(r.location);}catch{return fail('location URL');}
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password||(u.hash&&r['location-class']==='holder'))return fail('location URL');
  if(u.href!==r.location)return fail('noncanonical location');
 }
 return Object.freeze({...r}) as unknown as LocatedReference;
}
export function encodeLocatedReference(input:LocatedReference):string {
 const r=checkLocatedReference(input);
 return LOCATION_REFERENCE_PROFILE+[...required,...optional].filter(k=>owns(r,k)).map(k=>k+'='+encodeURIComponent(r[k]!)).join('&');
}
export function decodeLocatedReference(fragment:string):LocatedReference {
 if(!fragment.startsWith(LOCATION_REFERENCE_PROFILE))return fail('profile');
 const parameters=new URLSearchParams(fragment.slice(LOCATION_REFERENCE_PROFILE.length));
 if(new Set(parameters.keys()).size!==[...parameters].length)return fail('duplicate field');
 const r=checkLocatedReference(Object.fromEntries(parameters));
 if(encodeLocatedReference(r)!==fragment)return fail('noncanonical encoding');
 return r;
}
/** Content identity excludes every locator; neither identity authenticates an origin. */
export function locatedReferenceIdentity(input:LocatedReference):string {
 const r=checkLocatedReference(input);
 return encodeLocatedReference({class:r.class,algorithm:r.algorithm,digest:r.digest,blob:r.blob});
}
export interface ReferenceInspection {
 readonly maxBytes:number;
 /** Must compute the declared SHA-256, returning 64 lowercase hexadecimal digits. */
 readonly digestBytes:(bytes:Uint8Array)=>string;
}
export type LocatedInspection =
 | {readonly kind:'needs';readonly needs:'bytes';readonly identity:string}
 | {readonly kind:'present';readonly identity:string;readonly standing:string;readonly lines:readonly string[];readonly authentication:'not demonstrated'};
export function inspectLocatedReference(input:LocatedReference,bytes:Uint8Array|undefined,contract:ReferenceInspection):LocatedInspection {
 const r=checkLocatedReference(input),identity=locatedReferenceIdentity(r);
 if(!Number.isSafeInteger(contract.maxBytes)||contract.maxBytes<=0)return fail('bytes budget');
 if(bytes===undefined)return {kind:'needs',needs:'bytes',identity};
 if(bytes.byteLength>contract.maxBytes)return fail('bytes budget');
 if(contract.digestBytes(bytes)!==r.blob.slice(7))return fail('blob integrity');
 let document:unknown,text:string;
 try{text=new TextDecoder('utf8',{fatal:true}).decode(bytes);document=JSON.parse(text);}catch{return fail('document');}
 if(document===null||typeof document!=='object'||Array.isArray(document))return fail('document');
 const d=document as Record<string,unknown>;
 if(Object.keys(d).length!==2||d.profile!=='semantic-standing@1'||typeof d.standing!=='string')return fail('document profile');
 if(text!==JSON.stringify({profile:d.profile,standing:d.standing}))return fail('document encoding');
 let lines:readonly string[];try{lines=readSemanticStanding(d.standing);}catch{return fail('standing bytes');}
 const standing=semanticStandingBytes(lines);
 if(contract.digestBytes(new TextEncoder().encode(standing))!==r.digest)return fail('standing integrity');
 return {kind:'present',identity,standing,lines,authentication:'not demonstrated'};
}
