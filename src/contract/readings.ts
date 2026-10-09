import {canonical,parse,byBytes} from '../wire/line.ts';

const fieldsOf=(line:string):Readonly<Record<string,string>>=>{
  const got=parse(line,{preserveKeys:true});
  if(got.kind!=='fact'||canonical(got.value.fields,got.value.version)!==line)
    throw Error('REFUSE·reading noncanonical line');
  return got.value.fields;
};

export interface WorldReading {
  readonly world:string;
  readonly region:string;
  readonly lines:readonly string[];
}
export interface ReadingUnion {
  readonly lines:readonly string[];
  /** Attribution is delivery provenance, never independent object origins. */
  readonly attribution:readonly {readonly line:string;readonly worlds:readonly string[]}[];
  readonly disagreements:readonly {readonly coordinate:string;readonly lines:readonly string[]}[];
}

/** Every selected reader contributes; an empty answer cannot suppress another.
 * This is a union of readings, never a meet or an object-state computation. */
export function unionReadings(readings:readonly WorldReading[]):ReadingUnion {
  const attribution=new Map<string,Set<string>>(),coordinates=new Map<string,Set<string>>();
  for(const reading of readings){
    if(!reading.world||!reading.region)throw Error('REFUSE·reading missing world or region attribution');
    for(const line of reading.lines){
      const fields=fieldsOf(line);
      const sources=attribution.get(line)??new Set<string>();sources.add(reading.world);attribution.set(line,sources);
      const coordinate=canonical({region:reading.region,scope:fields.scope??'',role:fields.role??'',measure:fields.measure??''});
      const held=coordinates.get(coordinate)??new Set<string>();held.add(line);coordinates.set(coordinate,held);
    }
  }
  const lines=[...attribution.keys()].sort(byBytes);
  return {lines,attribution:lines.map(line=>({line,worlds:[...attribution.get(line)!].sort(byBytes)})),
    disagreements:[...coordinates].flatMap(([coordinate,held])=>{
      // This reports alternate value encodings at one reading coordinate.
      // It cannot decide compatibility or permission: the selected form does.
      // Different origin, signer and delivery metadata are not disagreements.
      const meanings=new Set([...held].map(line=>{
        const fields=fieldsOf(line);return canonical({form:fields.form??'',value:fields.value??'',kind:fields.kind??''});
      }));
      return meanings.size>1?[{coordinate,lines:[...held].sort(byBytes)}]:[];
    }).sort((a,b)=>byBytes(a.coordinate,b.coordinate))};
}

/** A file is materialized by one explicitly declared writer. Even identical
 * output from two writers does not silently choose authority by array order. */
export function renderWriter(coordinate:string,writers:readonly string[]):string {
  const distinct=[...new Set(writers)];
  if(!coordinate||distinct.length!==1||!distinct[0])throw Error(`REFUSE·render ${coordinate||'(absent)'} needs one writer`);
  return distinct[0];
}

export interface EvidenceProjectionContract {
  /** Historical authentication supplied by the instrument. Foreign history
   * stays evidence and is never folded into local authority. */
  readonly classification:(line:string)=>'local'|'foreign'|'unadmitted';
  /** The existing instrument fold, not another decoder or rule engine. */
  readonly fold:(authenticated:readonly string[])=>readonly string[];
}
export function foldedEvidence(history:readonly string[],contract:EvidenceProjectionContract):{
  readonly standing:readonly string[];readonly history:readonly string[];readonly foreign:readonly string[];readonly unadmitted:readonly string[];
} {
  const local:string[]=[],foreign:string[]=[],unadmitted:string[]=[];
  for(const line of new Set(history)){
    fieldsOf(line);
    const classification=contract.classification(line);
    (classification==='local'?local:classification==='foreign'?foreign:unadmitted).push(line);
  }
  const folded=contract.fold(local),held=new Set(local);
  if(folded.some(line=>!held.has(line)))throw Error('REFUSE·evidence fold returned an unauthenticated inscription');
  return {standing:folded.filter(line=>fieldsOf(line).value!=='withdraw'),history:local,foreign,unadmitted};
}
