import {canonical,parse,byBytes} from '../wire/line.ts';

/** Delivery metadata locates admitted bytes; it is neither a standing nor proof
 * that a release belongs to an authenticated predecessor chain. */
export interface ReleaseDelivery {
 readonly standing:string;
 readonly blob:string;
 readonly predecessor?:string;
}
const digest=(value:unknown):value is string=>typeof value==='string'&&/^(?:[^\s:@]+@[0-9]+:)?[a-z][a-z0-9-]*:[0-9a-f]+$/.test(value);
export function readReleaseDelivery(text:string):ReleaseDelivery {
 let row:unknown;
 try{row=JSON.parse(text);}catch{throw Error('REFUSE·release invalid delivery metadata');}
 if(!row||typeof row!=='object'||Array.isArray(row))throw Error('REFUSE·release missing delivery record');
 const fields=row as Record<string,unknown>;
 if(Object.keys(fields).some(name=>!['standing','blob','predecessor'].includes(name))
   ||!digest(fields.standing)||!digest(fields.blob)
   ||(fields.predecessor!==undefined&&!digest(fields.predecessor)))
  throw Error('REFUSE·release invalid delivery digests or fields');
 return {standing:fields.standing,blob:fields.blob,
  ...(fields.predecessor===undefined?{}:{predecessor:fields.predecessor})};
}

export interface PlaceRequirement {
 readonly world:string;
 readonly coordinate:string;
 /** Desired semantic declaration, never a borrowed signature or local act. */
 readonly line:string;
}
/** A selected world's requirements are explicit data for a host repair view.
 * The caller authenticates the standing. The host checks the place's grammar,
 * coverage and conflicts before proposing; a person must sign admission. */
export function placeRequirements(world:string,standing:readonly string[]):readonly PlaceRequirement[] {
 if(!digest(world))throw Error('REFUSE·adoption missing selected standing digest');
 const rows=[...new Set(standing)].map(line=>{
  const result=parse(line);
  if(result.kind!=='fact')throw Error('REFUSE·adoption invalid standing line');
  return result.value.fields;
 });
 const profiles=rows.filter(r=>r.scope==='wire/adoption/profile');
 const requirements=rows.filter(r=>r.scope?.startsWith('needs/place/'));
 if(!profiles.length){
  if(requirements.length)throw Error('REFUSE·adoption requirements have no declared profile');
  return [];
 }
 if(profiles.some(row=>row.value!=='place-requirements@1'))
  throw Error('REFUSE·adoption conflicting or unsupported profile');
 return requirements.map(row=>{
  if(row.role!=='demands'||row.measure!=='line'||!row.scope!.slice('needs/place/'.length))
   throw Error(`REFUSE·adoption invalid requirement ${row.scope}`);
  const result=parse(row.value??'');
  if(result.kind!=='fact'||canonical(result.value.fields)!==row.value)
   throw Error(`REFUSE·adoption noncanonical requirement ${row.scope}`);
  const desired=result.value.fields;
  if(!desired.scope||desired.value==='withdraw'||['sig','by','epoch','expires','repo'].some(field=>field in desired))
   throw Error(`REFUSE·adoption borrowed history at ${row.scope}`);
  return {world,coordinate:row.scope!,line:row.value!};
 }).sort((a,b)=>byBytes(a.coordinate,b.coordinate)||byBytes(a.line,b.line));
}
