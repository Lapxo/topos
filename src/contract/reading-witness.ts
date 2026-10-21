import {canonical, parse} from '../wire/line.ts';

/** Representation of evidence to be verified by the consuming operation. */
export const READING_WITNESS_PROFILE = 'topos-reading-witness/1' as const;
interface ReadingContext {
 readonly class:'attest';
 readonly reading:string; readonly contract:string; readonly model:string; readonly params:string;
 readonly inputs:string; readonly selection:string; readonly unit:string; readonly scale:string;
 readonly resolution:string; readonly reader:string; readonly implementation:string;
 readonly context:string; readonly run:string; readonly result:string;
}
export type ReadingWitness = ReadingContext & (
 | {readonly authentication:'key-covered'; readonly key:string; readonly coverage:string; readonly evidence:string}
 | {readonly authentication:'ci-run-unkeyed'; readonly repository:string; readonly commit:string;
    readonly workflow:string; readonly attempt:string; readonly evidence:string}
);
const base = ['class','reading','contract','model','params','inputs','selection','unit','scale','resolution','reader','implementation','context','run','result','authentication','evidence'] as const;
const digests = ['reading','contract','model','params','inputs','selection','scale','resolution','reader','implementation','context','result','evidence'] as const;
const fail = (cause:string):never => {throw Error('REFUSE·reading-witness/'+cause);};
const word = (v:unknown):v is string => typeof v==='string' && v.length>0 && !/[\u0000-\u0020\u007f]/.test(v);
const digest = (v:unknown):v is string => typeof v==='string' && /^sha256:[0-9a-f]{64}$/.test(v);
function fields(input:ReadingWitness):Record<string,string> {
 if(input===null || typeof input!=='object' || Array.isArray(input))return fail('record');
 const r=input as unknown as Record<string,unknown>;
 let extra:readonly string[];
 if(r.authentication==='key-covered')extra=['key','coverage'];
 else if(r.authentication==='ci-run-unkeyed')extra=['repository','commit','workflow','attempt'];
 else return fail('authentication-profile');
 const allowed:readonly string[]=[...base,...extra];
 if(allowed.some(k=>!Object.prototype.hasOwnProperty.call(r,k)) || Object.keys(r).some(k=>!allowed.includes(k)))return fail('fields');
 if(Object.values(r).some(v=>!word(v)))return fail('field-value');
 if(r.class!=='attest')return fail('reading-class');
 if(digests.some(k=>!digest(r[k])))return fail('digest');
 if(r.authentication==='key-covered') {
  if(!digest(r.coverage))return fail('coverage');
 } else {
  // Commit is a named source identity, not an assumed SHA-1/SHA-256 or proof of provenance.
  if(!digest(r.workflow) || typeof r.attempt!=='string' || !/^[1-9][0-9]*$/.test(r.attempt))return fail('ci-context');
 }
 return {...r} as Record<string,string>;
}
/** Bytes that a covering proof binds, excluding the proof's own digest to avoid self-reference. */
export function readingWitnessStatementBytes(input:ReadingWitness):string {
 const {evidence,...statement}=fields(input);
 return 'topos-reading-statement/1'+canonical(statement).slice('bound-lock/1'.length);
}
/** Canonical bytes are the full identity preimage; digesting and checking source bytes belong to the host. */
export function encodeReadingWitness(input:ReadingWitness):string {
 return READING_WITNESS_PROFILE+canonical(fields(input)).slice('bound-lock/1'.length);
}
export function decodeReadingWitness(line:string):ReadingWitness {
 if(typeof line!=='string' || !line.startsWith(READING_WITNESS_PROFILE+' '))return fail('profile');
 const got=parse('bound-lock/1'+line.slice(READING_WITNESS_PROFILE.length));
 if(got.kind!=='fact')return fail('record');
 const value=got.value.fields as unknown as ReadingWitness;
 if(encodeReadingWitness(value)!==line)return fail('canonical-bytes');
 return Object.freeze({...value});
}
/** No signature, CI provenance, result, scale law or authorization is certified by parsing. */
export function inspectReadingWitness(input:ReadingWitness) {
 const bytes=encodeReadingWitness(input), witness=decodeReadingWitness(bytes);
 return {status:'declared' as const, witness, bytes, statementBytes:readingWitnessStatementBytes(witness), authentication:'not verified' as const,
  authorization:'not established' as const,
  needsVerification:[
   'reading/model/input/selection/implementation/context/result digest bindings',
   'declared unit, scale composition law and resolution',
   witness.authentication==='key-covered' ? 'key signature and admitted coverage over this reading' : 'CI evidence binds repository, commit, workflow, run, attempt and output',
   'consuming policy accepts this evidence for the requested obligation',
  ]};
}
