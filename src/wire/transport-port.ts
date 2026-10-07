import {boundOf} from './values.ts';
import {intervals} from '@lapxo/obligations';
export interface TransportSelection {readonly name:string;readonly timeoutMs:number;readonly responseBytes:number}
export interface ContentRequest {readonly protocol:'content-request/1';readonly location:string;readonly digest:string;readonly timeoutMs:number;readonly responseBytes:number}
/** Live admitted host policy selects a logical mechanism; a location never selects executable bytes. */
export function transportSelection(lines:readonly Readonly<Record<string,string>>[],scheme:string):TransportSelection|undefined {
 const contract=lines.filter(f=>(f.scope==='wire/transport'||f.scope==='audit/wire/transport')&&f.value!=='withdraw');
 if(!contract.length)return undefined;
 if(contract.some(f=>f.value!=='content-request/1'))throw Error('REFUSE·wire unsupported content transport');
 const one=(scope:string,measure:string)=>{
  const rows=lines.filter(f=>f.scope===scope&&f.measure===measure&&f.role==='writes'&&f.value!=='withdraw');
  if(!rows.length||new Set(rows.map(f=>f.value)).size!==1)throw Error(`REFUSE·transport ${scheme} missing or conflicting ${scope}`);
  return rows[0]!;
 };
 const name=one(`transport/${scheme}`,'id').value;if(!name)throw Error(`REFUSE·transport ${scheme} has no mechanism`);
 const limit=(scope:string,measure:string)=>{
  const rows=lines.filter(f=>f.scope===scope&&f.measure===measure&&f.role==='writes'&&f.value!=='withdraw');
  if(!rows.length)throw Error(`REFUSE·transport ${scheme} missing ${scope}`);
  const lattice=intervals(0,Infinity);
  const bound=rows.reduce((held,row)=>{
   const parsed=row.form==='interval'?boundOf('interval',row.value??''):undefined;
   if(!parsed||parsed.kind!=='interval'||parsed.lo===null||parsed.lo<0||parsed.hi===null||!Number.isSafeInteger(parsed.hi)||parsed.hi<=0||parsed.lo>parsed.hi)throw Error(`REFUSE·transport ${scheme} invalid ${scope}`);
   return lattice.meet(held,{lo:parsed.lo,hi:parsed.hi});
  },lattice.top);
  if(!lattice.inhabited(bound))throw Error(`REFUSE·transport ${scheme} conflicting ${scope}`);
  return bound.hi;
 };
 return {name,timeoutMs:limit('transport/timeout','milliseconds'),responseBytes:limit('transport/response-bytes','bytes')};
}
/** One request per invocation; successful stdout is raw payload bytes, a nonzero exit is never a payload. */
export function contentRequest(location:string,digest:string,limits:TransportSelection):string {
 const request:ContentRequest={protocol:'content-request/1',location,digest,timeoutMs:limits.timeoutMs,responseBytes:limits.responseBytes};
 return JSON.stringify(request)+'\n';
}
