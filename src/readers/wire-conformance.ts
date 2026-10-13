import {fromLine} from '../wire/claimline.ts';

/** A declared conformance observation, not admission of the input as a fact.
 * This maintained reader replaces the bundled stdin/echo sample. The host
 * supplies bytes and retains the resulting observations; no process is run. */
export function observe(bytes:Uint8Array) {
  let sample:{profile:string;scope:string;line:string;expected:{kind:string;why:string}};
  try{sample=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}
  catch{throw Error('REFUSE·wire conformance malformed input');}
  if(!sample||sample.profile!=='wire-conformance@1'||typeof sample.scope!=='string'||!sample.scope||typeof sample.line!=='string'||
    !sample.expected||!['fact','refuse','abstain'].includes(sample.expected.kind)||typeof sample.expected.why!=='string')
    throw Error('REFUSE·wire conformance declaration required');
  const answer=fromLine(sample.line,null),why=answer.kind==='fact'?'':answer.why??'';
  if(answer.kind!==sample.expected.kind||why!==sample.expected.why)
    throw Error('REFUSE·wire conformance observed result differs at '+sample.scope);
  const row=(measure:string,value:string)=>({scope:sample.scope,role:'writes' as const,measure,
    bound:{kind:'enumerated' as const,values:[value]}});
  return [row('input',sample.line),row('why',why),row('source-kind',answer.kind)];
}
