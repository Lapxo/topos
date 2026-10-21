import {canonical,parse,byBytes} from '../wire/line.ts';
import {recordObject,recordCoordinate,recordDigest,recordText,recordList,recordLine,recordFields,recordJSON,recordCanonical,recordFail,type RecordBudget} from './record.ts';
export const PORTABLE_BIRTH_PROFILE='topos-portable-birth/1' as const;
/** Public unsigned declarations only. Not an authority, ledger, filesystem or admission export. */
export interface PortableBirth {readonly origin:string;readonly declarations:readonly string[]}
const fields=['scope','role','form','measure','value','at','needs','shape','about','restsOn'];
function checked(input:PortableBirth,b:RecordBudget):PortableBirth{
 const r=recordObject(input,['origin','declarations']);recordDigest(r.origin);
 const declarations=recordList(r.declarations,b,x=>{
  const text=recordTextLine(x,b),p=parse(text);if(p.kind!=='fact')return recordFail('pack/declaration');const f=p.value.fields;
  if(Object.keys(f).some(k=>!fields.includes(k))||!f.scope||!f.measure||f.value===undefined||f.role!=='writes'||f.form!=='alphabet')return recordFail('pack/envelope');
  recordCoordinate(f.scope);recordText(f.measure);if(f.value==='withdraw'||/^(?:keys|authority|grants|coverage|root|store|derived)(?:\/|$)/.test(f.scope)||['public-key','key-class','coverage','grant','signature','private-key'].includes(f.measure))return recordFail('pack/authority-material');
  if(canonical(f)!==text)return recordFail('pack/canonical-declaration');return text;
 }).sort(byBytes);
 if(!declarations.length)return recordFail('pack/empty');if(new Set(declarations).size!==declarations.length)return recordFail('pack/duplicate');
 return {origin:r.origin as string,declarations};
}
function recordTextLine(x:unknown,b:RecordBudget){if(typeof x!=='string'||x.length>b.bytes||/[\r\n\0]/.test(x))return recordFail('pack/declaration');return x;}
export function encodePortableBirth(input:PortableBirth,b:RecordBudget){const x=checked(input,b);return recordLine(PORTABLE_BIRTH_PROFILE,{origin:x.origin,declarations:JSON.stringify(x.declarations)},b);}
export function decodePortableBirth(line:string,b:RecordBudget){const f=recordFields(PORTABLE_BIRTH_PROFILE,line,b);recordObject(f,['origin','declarations']);const x=checked({origin:f.origin!,declarations:recordJSON(f.declarations!) as string[]},b);recordCanonical(encodePortableBirth(x,b),line);return x;}
/** No bytes are installed or admitted. The recipient explicitly supplies its occupied coordinates. */
export function inspectPortableBirth(input:PortableBirth,occupied:readonly string[],b:RecordBudget){const pack=decodePortableBirth(encodePortableBirth(input,b),b),seen=new Set(recordList(occupied,b,recordCoordinate));const scopes=pack.declarations.map(x=>{const p=parse(x);if(p.kind!=='fact')return recordFail('pack/declaration');return p.value.fields.scope!;});const collisions=[...new Set(scopes.filter(x=>seen.has(x)))].sort(byBytes);return {status:collisions.length?'open' as const:'declared' as const,pack,collisions,needs:collisions.map(x=>'pack/collision/'+x),admission:'not performed' as const,authority:'not transferred' as const};}
