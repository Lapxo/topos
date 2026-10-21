import {byBytes} from '../wire/line.ts';
import {normalizeRegistryHorizon,normalizeRegistryQuorum,type RegistryHorizon,type RegistryQuorum} from './registry-place.ts';
import {recordObject,recordText,recordCoordinate,recordDigest,recordList,recordNames,recordLine,recordFields,recordJSON,recordCanonical,recordFail,type RecordBudget} from './record.ts';
export const GOVERNANCE_RECORD_PROFILE='topos-governance-record/1' as const;
export interface GovernanceGroup {readonly kind:'group';readonly place:string;readonly snapshot:string;readonly name:string;readonly regions:readonly string[];readonly previous?:string}
export interface GovernanceMember {readonly kind:'member';readonly place:string;readonly group:string;readonly key:string;readonly horizon:RegistryHorizon;readonly evidence:string}
export interface GovernanceDecision {readonly kind:'decision';readonly place:string;readonly group:string;readonly membership:string;readonly proposal:string;readonly context:string;readonly quorum:RegistryQuorum;readonly horizon:RegistryHorizon;readonly proofs:readonly {readonly key:string;readonly evidence:string}[]}
export type GovernanceRecord=GovernanceGroup|GovernanceMember|GovernanceDecision;
function checked(input:GovernanceRecord,b:RecordBudget):GovernanceRecord{
 if(input?.kind==='group'){
  const r=recordObject(input,['kind','place','snapshot','name','regions'],['previous']);recordCoordinate(r.place);recordText(r.name);recordDigest(r.snapshot);if(r.previous!==undefined)recordDigest(r.previous);
  return {...input,regions:recordNames(r.regions,b,recordCoordinate)};
 }
 if(input?.kind==='member'){
  const r=recordObject(input,['kind','place','group','key','horizon','evidence']);recordCoordinate(r.place);recordText(r.key);recordDigest(r.group);recordDigest(r.evidence);return {...input,horizon:normalizeRegistryHorizon(input.horizon)};
 }
 if(input?.kind==='decision'){
  const r=recordObject(input,['kind','place','group','membership','proposal','context','quorum','horizon','proofs']);recordCoordinate(r.place);for(const k of ['group','membership','proposal','context'])recordDigest(r[k]);
  const proofs=recordList(r.proofs,b,x=>{const p=recordObject(x,['key','evidence']);return {key:recordText(p.key),evidence:recordDigest(p.evidence)};}).sort((a,c)=>byBytes(a.key,c.key));
  if(new Set(proofs.map(p=>p.key)).size!==proofs.length)return recordFail('governance/duplicate-proof-key');
  recordList(input.quorum?.eligible,b,recordText);const quorum=normalizeRegistryQuorum(input.quorum);
  return {...input,proofs,quorum,horizon:normalizeRegistryHorizon(input.horizon)};
 }
 return recordFail('governance/kind');
}
export function encodeGovernanceRecord(input:GovernanceRecord,b:RecordBudget){const r=checked(input,b);return recordLine(GOVERNANCE_RECORD_PROFILE,Object.fromEntries(Object.entries(r).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)])),b);}
export function decodeGovernanceRecord(line:string,b:RecordBudget):GovernanceRecord{
 const f=recordFields(GOVERNANCE_RECORD_PROFILE,line,b),r:Record<string,unknown>={...f};for(const k of ['regions','horizon','quorum','proofs'])if(f[k]!==undefined)r[k]=recordJSON(f[k]!);
 const result=checked(r as unknown as GovernanceRecord,b);recordCanonical(encodeGovernanceRecord(result,b),line);return result;
}
/** Signature validity, eligibility, expiry and actual quorum remain the native consumer's obligations. */
export function inspectGovernanceRecord(input:GovernanceRecord,b:RecordBudget){
 const record=decodeGovernanceRecord(encodeGovernanceRecord(input,b),b);
 const needs=record.kind==='group'?['governance/admission-under-prior-authority']:record.kind==='member'?['needs/bytes/'+record.group,'governance/member-signature-and-validity']:['needs/bytes/'+record.group,'needs/bytes/'+record.membership,'needs/bytes/'+record.proposal,'governance/verified-eligibility-signatures-and-deadline','governance/native-threshold-admission'];
 return {status:'declared' as const,record,needs,authority:'not established' as const,quorumDecision:'not evaluated' as const,independence:'not established' as const};
}
/** Checks only the immutable proposal's predecessor binding. No membership or admission decision is made here. */
export function inspectGroupChange(previous:GovernanceGroup,next:GovernanceGroup,decision:GovernanceDecision,digest:(bytes:string)=>string,b:RecordBudget){
 const p=checked(previous,b),n=checked(next,b),d=checked(decision,b);if(p.kind!=='group'||n.kind!=='group'||d.kind!=='decision')return recordFail('governance/change-kind');
 const before=recordDigest(digest(encodeGovernanceRecord(p,b)+'\n')),after=recordDigest(digest(encodeGovernanceRecord(n,b)+'\n'));
 if(n.previous!==before||d.group!==before||d.proposal!==after||p.place!==n.place||p.place!==d.place||p.name!==n.name)return recordFail('governance/prior-group-binding');
 return {status:'declared-change' as const,previous:before,next:after,needs:['governance/native-threshold-admission'],authority:'not established' as const};
}
