import {canonical,parse}from'../src/wire/line.ts';
import {fromLine,wireAt}from'../src/wire/claimline.ts';
export function observeWireCompatibility(input:any){let canonicalCases=0,fieldCases=0;
 for(const c of input.canonical.cases){const p=parse(c.input);if(c.refuse){if(p.kind!=='refuse'||!p.why.includes(c.refuse))throw Error('REFUSE·wire-compatibility/case');}else if(p.kind!=='fact'||canonical(p.value.fields,p.value.version)!==c.canonical)throw Error('REFUSE·wire-compatibility/case');canonicalCases++;}
 const lines=input.fields.lock.map((s:string)=>{const p=parse(s);if(p.kind!=='fact')throw Error('REFUSE·wire-compatibility/lock');return p.value.fields;});
 for(const c of input.fields.cases){const p=fromLine(c.line,wireAt(lines,c.epoch));if(p.kind!==c.read)throw Error('REFUSE·wire-compatibility/field');fieldCases++;}
 if(!canonicalCases||!fieldCases)throw Error('REFUSE·wire-compatibility/empty');return {canonicalCases,fieldCases,wireChanged:false,none:'existing contextual meaning preserved'};
}
