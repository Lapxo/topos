import {parse} from './line.ts';
import {fact,refuse} from './outcome.ts';
import type {Outcome} from './outcome.ts';
export type RecordKind='config'|'cell'|'claim'|'mark';
/** Lexical kind is explicit; it grants no admission and supplies no legacy defaults. */
export function recordKind(text:string):Outcome<RecordKind>{
 const got=parse(text,{preserveKeys:true});if(got.kind!=='fact')return got;
 if(!got.value.keys!.includes('type'))return fact('config');
 const type=got.value.fields.type;
 return type==='cell'||type==='claim'||type==='mark'?fact(type):refuse('an explicit type names cell, claim or mark','type');
}
