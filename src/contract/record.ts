import {canonical,parse,byBytes} from '../wire/line.ts';
export interface RecordBudget {readonly bytes:number;readonly items:number}
export const recordFail=(cause:string):never=>{throw Error('REFUSE·'+cause);};
export function recordObject(value:unknown,required:readonly string[],optional:readonly string[]=[]) : Record<string,unknown>{
 if(value===null||typeof value!=='object'||Array.isArray(value))return recordFail('record/object');
 const r=value as Record<string,unknown>;
 if(required.some(k=>!Object.prototype.hasOwnProperty.call(r,k))||Object.keys(r).some(k=>![...required,...optional].includes(k)))return recordFail('record/fields');return r;
}
export function recordText(value:unknown):string {if(typeof value!=='string'||!value||/[\u0000-\u0020\u007f]/.test(value))return recordFail('record/name');return value;}
export function recordCoordinate(value:unknown):string {const s=recordText(value);if(s!=='.'&&(s.startsWith('/')||s.includes('\\')||s.split('/').some(p=>!p||p==='.'||p==='..')))return recordFail('record/coordinate');return s;}
export function recordDigest(value:unknown):string {const s=recordText(value);if(!/^sha256:[a-f0-9]{64}$/.test(s))return recordFail('record/digest');return s;}
export function recordBudget(b:RecordBudget){if(!b||!Number.isSafeInteger(b.bytes)||b.bytes<1||!Number.isSafeInteger(b.items)||b.items<0)return recordFail('record/budget');}
export function recordList<T>(value:unknown,b:RecordBudget,read:(x:unknown)=>T):T[]{recordBudget(b);if(!Array.isArray(value)||value.length>b.items)return recordFail('record/items');return value.map(read);}
export function recordNames(value:unknown,b:RecordBudget,read=recordText):string[]{const xs=recordList(value,b,read);if(new Set(xs).size!==xs.length)return recordFail('record/duplicate');return xs.sort(byBytes);}
export function recordLine(profile:string,fields:Record<string,string>,b:RecordBudget):string{
 recordBudget(b);if(Object.values(fields).some(x=>x.length>b.bytes))return recordFail('record/bytes');const line=profile+canonical(fields).slice('bound-lock/1'.length);if(line.length>b.bytes||new TextEncoder().encode(line).length>b.bytes)return recordFail('record/bytes');return line;
}
export function recordFields(profile:string,line:string,b:RecordBudget):Record<string,string>{
 recordBudget(b);if(typeof line!=='string'||line.length>b.bytes||new TextEncoder().encode(line).length>b.bytes)return recordFail('record/bytes');
 if(!line.startsWith(profile+' '))return recordFail('record/profile');const got=parse('bound-lock/1'+line.slice(profile.length));if(got.kind!=='fact')return recordFail('record/line');return {...got.value.fields};
}
export function recordJSON(text:string):unknown {try{return JSON.parse(text);}catch{return recordFail('record/json');}}
export function recordCanonical(actual:string,expected:string){if(actual!==expected)return recordFail('record/canonical');}
