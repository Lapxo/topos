import {byBytes} from '../wire/line.ts';

export type PublicationRole='contract'|'yes'|'vector'|'no';
export interface PublicationMember {readonly role:PublicationRole;readonly digest:string}
export interface PublicationRow {readonly scope:string;readonly members:readonly PublicationMember[]}
export interface PublicationProof {
  readonly status:'met'|'unmet'|'unread'|'refused';
  /** The exact inputs the admitted measurement read. */
  readonly members:readonly PublicationMember[];
}
const roles:readonly PublicationRole[]=['contract','yes','vector','no'];

/** Authentic members plus admitted conformance evidence; member presence is insufficient. */
export function publicationCoverage(
  rows:readonly PublicationRow[],
  artifacts:ReadonlyMap<string,Uint8Array>,
  proofs:ReadonlyMap<string,PublicationProof>,
  digest:(bytes:Uint8Array)=>string,
) {
  const fail=(why:string):never=>{throw Error('REFUSE·publication '+why);};
  if(!rows.length)fail('empty public surface is not conformance');
  const seen=new Set<string>();
  const result=[...rows].sort((a,b)=>byBytes(a.scope,b.scope)).map(row=>{
    if(!row.scope||seen.has(row.scope))fail('duplicate or empty coordinate '+row.scope);
    seen.add(row.scope);
    const members=new Map<PublicationRole,string>();
    for(const member of row.members) {
      if(!roles.includes(member.role)||members.has(member.role)||!member.digest)fail('ambiguous member at '+row.scope);
      members.set(member.role,member.digest);
    }
    const missing=roles.filter(role=>!members.has(role)||!artifacts.has(members.get(role)!));
    for(const [role,id] of members) {
      const bytes=artifacts.get(id);
      if(bytes&&digest(bytes)!==id)fail('member digest differs at '+row.scope+'/'+role);
    }
    const proof=proofs.get(row.scope);
    if(proof) {
      if(!['met','unmet','unread','refused'].includes(proof.status))fail('unsupported proof status '+row.scope);
      const recorded=new Map<PublicationRole,string>();
      for(const member of proof.members) {
        if(!roles.includes(member.role)||recorded.has(member.role))fail('ambiguous proof inputs '+row.scope);
        recorded.set(member.role,member.digest);
      }
      if(recorded.size!==members.size||[...members].some(([role,id])=>recorded.get(role)!==id))fail('proof input identity differs at '+row.scope);
    }
    const status=missing.length?'missing':!proof||proof.status==='unread'?'unread':proof.status==='met'?'met':'unmet';
    return {scope:row.scope,status,missing};
  });
  return {rows:result,missing:result.filter(row=>row.status!=='met').length,closed:result.every(row=>row.status==='met')};
}
