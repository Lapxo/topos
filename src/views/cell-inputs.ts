import {cell,live,restOf} from '@lapxo/obligations/views/field';
import {canonical,byBytes} from '../wire/line.ts';
import {restCoordinates} from '../wire/object-record.ts';
import type {ObjectRecord} from '../wire/object-record.ts';
/** Encoded semantic inputs: no span decoding, propagation algebra or filesystem identity. */
export function cellInputs(records:readonly ObjectRecord[]):ReadonlyMap<string,readonly string[]>{
 const definitions=records.filter(r=>r.record==='cell');
 const world=new Map(definitions.map(r=>[r.fields.scope!,cell(r.fields.scope!,Number(r.fields.epoch),[],restCoordinates(r.fields.restsOn!)!)]));
 const encode=(r:ObjectRecord)=>{const f={...r.fields};for(const key of ['sig','by','epoch','expires','repo','shape'])delete f[key];return canonical(f);};
 const acts=(scope:string,kind:'mark'|'claim')=>{
  const rs=records.filter(r=>r.record===kind&&r.fields.scope===scope);
  const byID=new Map(rs.map(r=>[r.fields.id!,r]));
  return live(rs.map(r=>({id:r.fields.id!,at:Number(r.fields.epoch),...(r.fields.takes?{takes:r.fields.takes}:{})}))).map(r=>byID.get(r.id!)!);
 };
 return new Map(definitions.map(def=>{
  const name=def.fields.scope!,ancestors=restOf(world.get(name)!,world);
  const parentDefs=ancestors.map(name=>definitions.find(r=>r.fields.scope===name)!);
  const travelling=ancestors.flatMap(name=>acts(name,'mark').filter(r=>r.fields.reach==='travels'&&!r.fields.widens));
  const own=[...acts(name,'mark'),...acts(name,'claim')];
  const lines=[def,...parentDefs,...travelling,...own].map(encode);
  return [name,[...new Set(lines)].sort(byBytes)] as const;
 }));
}

/** Absent valuation and the legacy unquantified declaration both supply no quantum. */
export function cellReceiptContract(configuration:readonly Readonly<Record<string,string>>[]):{valuation:'unknown'}{
 const rows=configuration.filter(f=>f.scope==='wire/receipt-inputs');
 if(rows.length!==1||rows[0]!.value!=='semantic-live@1')throw Error('REFUSE·receipt wire/receipt-inputs has no admitted semantic-live@1 contract');
 const values=configuration.filter(f=>f.scope==='valuation/cells');
 if(values.some(value=>value.value!=='unquantified'))throw Error('REFUSE·valuation cells have an unsupported valuation; no discrete quantum is invented');
 return {valuation:'unknown'};
}
