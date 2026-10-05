import {parse} from './line.ts';
import {recordKind} from './record-kind.ts';
import {fromLine,wireAt} from './claimline.ts';
import {fact} from './outcome.ts';
import type {Outcome} from './outcome.ts';
import type {ObjectRecord} from './object-record.ts';
export interface ObjectHistory{readonly objects:readonly ObjectRecord[];readonly configuration:readonly Readonly<Record<string,string>>[]}
/** Historical grammar is selected by each record's epoch, before context admission. */
export function objectHistory(lines:readonly string[]):Outcome<ObjectHistory>{
 const parsed=[];for(const text of lines){const p=parse(text);if(p.kind!=='fact')return p;parsed.push(p.value.fields);}
 const objects:ObjectRecord[]=[],configuration:Readonly<Record<string,string>>[]=[];
 for(let i=0;i<lines.length;i++){
  const k=recordKind(lines[i]!);if(k.kind!=='fact')return k;
  if(k.value==='config'){configuration.push(parsed[i]!);continue;}
  const got=fromLine(lines[i]!,wireAt(parsed,Number(parsed[i]!.epoch)));
  if(got.kind!=='fact')return got;
  if(!('record'in got.value))throw Error('typed history returned configuration');objects.push(got.value);
 }
 return fact({objects,configuration});
}
