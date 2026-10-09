import {parse} from '../wire/line.ts';
import {fields} from '../wire/grammar.ts';
import {semanticStandingBytes} from './semantic-projection.ts';

export interface ShadowProfile {
  readonly form:string;
  readonly resolution:string;
  readonly projections:ReadonlyMap<string,'commitment'|'shadow'>;
}
const resolution=(value:string):boolean=>/^(0|[1-9][0-9]*)$/.test(value);
const validate=(profile:ShadowProfile):void=>{
  if(!profile.form||/[@:\s]/.test(profile.form)||!resolution(profile.resolution))
    throw Error('REFUSE·shadow incomplete identity declaration');
  for(const [label,projection] of profile.projections)
    if(!resolution(label)||!['commitment','shadow'].includes(projection))
      throw Error('REFUSE·shadow invalid projection');
  if(profile.projections.get(profile.resolution)!=='shadow')
    throw Error('REFUSE·shadow resolution does not name the shadow');
};

/** Read the selected profile through the existing wire. Labels are exact text,
 * not machine numbers; a new label does not require another implementation. */
export function shadowProfile(lines:readonly string[]):ShadowProfile|undefined {
  const rows=lines.map(line=>{
    const result=parse(line);
    if(result.kind!=='fact')throw Error('REFUSE·shadow invalid profile line');
    return result.value.fields;
  });
  const own=(scope:string):string|undefined=>{
    const values=[...new Set(rows.filter(row=>row.scope===scope&&row.value!=='withdraw').map(row=>row.value))];
    if(values.length>1)throw Error(`REFUSE·shadow conflicting ${scope}`);
    return values[0];
  };
  const profile=own('wire/identity/profile');
  if(profile===undefined)return undefined;
  if(profile!=='semantic-standing@1')throw Error('REFUSE·shadow undeclared identity profile');
  const form=own('wire/identity/form'),at=own('wire/identity/shadow'),cuts=own('wire/identity/projections');
  if(!form||/[@:\s]/.test(form)||!at||!resolution(at)||!cuts)
    throw Error('REFUSE·shadow incomplete identity declaration');
  const projections=new Map<string,'commitment'|'shadow'>();
  for(const [label,projection] of fields(cuts)){
    if(!resolution(label)||projections.has(label)||!['commitment','shadow'].includes(projection))
      throw Error('REFUSE·shadow invalid or duplicate projection');
    projections.set(label,projection as 'commitment'|'shadow');
  }
  const result={form,resolution:at,projections};
  validate(result);
  return result;
}

/** The digest callback receives canonical UTF-8 bytes, never decoded arbitrary
 * bytes. The already folded live input order is supplied by the instrument. */
export function shadowAt(live:readonly string[],profile:ShadowProfile,at:string,
  digest:(bytes:Uint8Array)=>string):
  {readonly kind:'commitment';readonly identity:string}|{readonly kind:'shadow';readonly bytes:Uint8Array} {
  validate(profile);
  const projection=profile.projections.get(at);
  if(projection===undefined)throw Error(`REFUSE·shadow undeclared resolution ${at}`);
  const bytes=new TextEncoder().encode(semanticStandingBytes(live));
  if(projection==='shadow')return {kind:'shadow',bytes};
  const commitment=digest(bytes);
  if(!/^[a-z][a-z0-9-]*:[0-9a-f]+$/.test(commitment))throw Error('REFUSE·shadow invalid declared digest');
  return {kind:'commitment',identity:`${profile.form}@${profile.resolution}:${commitment}`};
}
