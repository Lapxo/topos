import {cell,live,restOf} from '@lapxo/obligations/views/field';
import {canonical,byBytes} from '../wire/line.ts';
import {restCoordinates} from '../wire/object-record.ts';
import type {ObjectRecord} from '../wire/object-record.ts';
/** Encoded semantic inputs: no span decoding, propagation algebra or filesystem identity. */
export type CellInputProfile='semantic-live@1'|'semantic-live@2';
export function cellInputs(records:readonly ObjectRecord[],profile:CellInputProfile='semantic-live@1'):ReadonlyMap<string,readonly string[]>{
 if(!['semantic-live@1','semantic-live@2'].includes(profile))throw Error('REFUSE·receipt undeclared semantic input profile');
 const definitions=records.filter(r=>r.record==='cell');
 const world=new Map(definitions.map(r=>[r.fields.scope!,cell(r.fields.scope!,Number(r.fields.epoch),[],restCoordinates(r.fields.restsOn!)!)]));
 const encode=(r:ObjectRecord)=>{const f={...r.fields};for(const key of ['sig','by','epoch','expires','repo','shape'])delete f[key];return canonical(f);};
 const acts=(scope:string,kind:'mark'|'claim')=>{
  const rs=records.filter(r=>r.record===kind&&r.fields.scope===scope);
  const byID=new Map(rs.map(r=>[r.fields.id!,r]));
  const surviving=live(rs.map(r=>({id:r.fields.id!,at:Number(r.fields.epoch),...(r.fields.takes?{takes:r.fields.takes}:{})}))).map(r=>byID.get(r.id!)!);
  // Epoch text is not a delivery identity input, but its effective ordering
  // determines whether a local opening precedes or follows a travelling sign.
  return profile==='semantic-live@2'?surviving.sort((a,b)=>Number(a.fields.epoch)-Number(b.fields.epoch)):surviving;
 };
 return new Map(definitions.map(def=>{
  const name=def.fields.scope!,ancestors=restOf(world.get(name)!,world);
  const parentDefs=ancestors.map(name=>definitions.find(r=>r.fields.scope===name)!);
  const travelling=ancestors.flatMap(name=>acts(name,'mark').filter(r=>r.fields.reach==='travels'&&!r.fields.widens));
  const own=[...acts(name,'mark'),...acts(name,'claim')];
  const lines=[def,...parentDefs,...travelling,...own].map(encode);
  const distinct=[...new Set(lines)];
  return [name,profile==='semantic-live@1'?distinct.sort(byBytes):distinct] as const;
 }));
}

/** Absent valuation and the legacy unquantified declaration both supply no quantum. */
export function cellReceiptContract(configuration:readonly Readonly<Record<string,string>>[]):{valuation:'unknown'}{
 cellInputProfile(configuration);
 const values=configuration.filter(f=>f.scope==='valuation/cells');
 if(values.some(value=>value.value!=='unquantified'))throw Error('REFUSE·valuation cells have an unsupported valuation; no discrete quantum is invented');
 return {valuation:'unknown'};
}

/** Explicit opt-in preserves the published set profile's meaning. The host
 * binds the selected profile as well as its implementation in receipt identity. */
export function cellInputProfile(configuration:readonly Readonly<Record<string,string>>[]):CellInputProfile{
 const rows=configuration.filter(f=>f.scope==='wire/receipt-inputs');
 if(rows.length!==1||!['semantic-live@1','semantic-live@2'].includes(rows[0]!.value!))throw Error('REFUSE·receipt wire/receipt-inputs has no admitted semantic input contract');
 return rows[0]!.value as CellInputProfile;
}
