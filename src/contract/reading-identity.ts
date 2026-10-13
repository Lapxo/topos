import {byBytes} from '../wire/line.ts';

export interface ReadingIdentityContext {
  readonly instrument:string;
  readonly implementation:string;
  readonly policy:string;
  /** The host supplies the complete verified transitive input closure. */
  readonly inputs:readonly (readonly [coordinate:string,identity:string])[];
  /** Explicitly empty means no relevant environment; absence is unknown. */
  readonly environment:readonly (readonly [coordinate:string,identity:string])[];
}

const named=(value:unknown):value is string=>typeof value==='string'&&value.length>0;
const refuse=(why:string):never=>{throw Error('REFUSE·reading identity '+why);};
function references(values:ReadingIdentityContext['inputs'],family:string):readonly (readonly [string,string])[]{
  if(!Array.isArray(values))refuse('missing '+family);
  const seen=new Set<string>();
  for(const row of values){
    if(!Array.isArray(row)||row.length!==2||!named(row[0])||!named(row[1]))refuse('invalid '+family+' reference');
    if(seen.has(row[0]))refuse('duplicate '+family+' coordinate '+row[0]);
    seen.add(row[0]);
  }
  return [...values].sort((a,b)=>byBytes(a[0],b[0]));
}

/** Pure reading-context@1 projection. References are opaque admitted identities;
 * this operation cannot verify closure, authorize reuse or consult the host. */
export function readingIdentityBytes(context:ReadingIdentityContext):Uint8Array {
  if(!context)refuse('missing context');
  const fields=['instrument','implementation','policy','inputs','environment'];
  for(const field of Object.keys(context).sort(byBytes))
    if(!fields.includes(field))refuse('undeclared context field '+field);
  for(const field of ['instrument','implementation','policy'] as const)
    if(!named(context[field]))refuse('missing '+field);
  return new TextEncoder().encode(JSON.stringify(['reading-context@1',context.instrument,
    context.implementation,context.policy,references(context.inputs,'inputs'),
    references(context.environment,'environment')])+'\n');
}

export function readingIdentity(context:ReadingIdentityContext,digest:(bytes:Uint8Array)=>string):string {
  return digest(readingIdentityBytes(context));
}

/** Distinct results for one reading keep distinct receipt names. Time, signature
 * and execution diagnostics belong to an authenticated delivery envelope. The
 * result commitment includes the complete outcome, including refusal/failure. */
export function readingReceiptBytes(reading:string,result:string):Uint8Array {
  if(!named(reading)||!named(result))refuse('missing receipt reading or result');
  return new TextEncoder().encode(JSON.stringify(['reading-receipt@1',reading,result])+'\n');
}

export function readingReceiptIdentity(reading:string,result:string,digest:(bytes:Uint8Array)=>string):string {
  return digest(readingReceiptBytes(reading,result));
}
