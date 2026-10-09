import type {MeetSemilattice} from '@lapxo/obligations/lattice';

export interface PolicyField<T> {
  readonly coordinate:string;
  readonly mode:'meet'|'exact'|'own';
  /** Values are interpreted by the selected form. Algebra is supplied by
   * Obligations, never reconstructed with interval endpoints here. */
  readonly decode:(value:string)=>T;
  readonly lattice:MeetSemilattice<T>;
  readonly inhabited:(value:T)=>boolean;
}
export interface PolicyValue {readonly source:string;readonly value:string;readonly own:boolean}

export function composePolicy<T>(field:PolicyField<T>,values:readonly PolicyValue[]):{
  readonly kind:'compatible'|'incompatible'|'unread';readonly value?:T;readonly evidence:readonly PolicyValue[];
} {
  if(!field.coordinate)throw Error('REFUSE·policy missing field coordinate');
  if(!['meet','exact','own'].includes(field.mode))throw Error(`REFUSE·policy ${field.coordinate} undeclared composition`);
  const unique=values.filter((value,index)=>values.findIndex(other=>other.source===value.source&&other.value===value.value&&other.own===value.own)===index);
  if(!unique.length)return {kind:'unread',evidence:[]};
  if(unique.some(value=>!value.source))throw Error(`REFUSE·policy ${field.coordinate} missing attribution`);
  const own=unique.filter(value=>value.own);
  const selected=field.mode==='own'&&own.length?own:unique;
  if(field.mode!=='meet'){
    // Only a declared non-meet field may prefer own values. It cannot erase a
    // parent's constraint in a meet field or resolve conflicting own values.
    if(new Set(selected.map(value=>value.value)).size!==1)return {kind:'incompatible',evidence:unique};
    const value=field.decode(selected[0]!.value);
    return {kind:field.inhabited(value)?'compatible':'incompatible',value,evidence:unique};
  }
  const bound=selected.map(value=>field.decode(value.value)).reduce((a,b)=>field.lattice.meet(a,b));
  return {kind:field.inhabited(bound)?'compatible':'incompatible',value:bound,evidence:unique};
}

/** A widening verdict is not authorization. The existing coverage/witness
 * boundary must pay it before an instrument admits the proposed change. */
export function policyTransition<T>(field:PolicyField<T>,before:T,after:T):
  'compatible'|'incompatible'|'narrowing'|'widening-needs-authority'|'non-meet' {
  if(field.mode!=='meet')return 'non-meet';
  if(!field.inhabited(after))return 'incompatible';
  const leq=field.lattice.leq;
  if(leq(before,after)&&leq(after,before))return 'compatible';
  if(leq(after,before))return 'narrowing';
  return 'widening-needs-authority';
}
