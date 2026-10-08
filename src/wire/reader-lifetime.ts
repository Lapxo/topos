import {boundOf} from './values.ts';
import {intervals} from '@lapxo/obligations';

export interface ReaderLifetime {readonly timeoutMs:number;readonly responseBytes:number}
/** Declaration identity and executable location are separate policy coordinates. */
export interface ReaderReference {readonly id:string;readonly module:string}
/** Policy selection is part of the wire. Historical unbounded profiles are not a bounded-reading certificate. */
export function readerLifetime(lines:readonly Readonly<Record<string,string>>[],reference:string|ReaderReference):ReaderLifetime|undefined {
 const contract=lines.filter(f=>(f.scope==='wire/reader-lifetime'||f.scope==='audit/wire/reader-lifetime')&&f.value!=='withdraw');
 if(!contract.length)return undefined;
 const profiles=new Set(contract.map(f=>f.value));
 if(profiles.size!==1)throw Error('REFUSE·wire conflicting reader lifetime profiles');
 const profile=contract[0]!.value;
 if(!['bounded-process@1','bounded-process@2'].includes(profile??''))throw Error('REFUSE·wire unsupported reader lifetime');
 // @1 retains its historical module coordinate; @2 selects the declared reader.
 const reader=typeof reference==='string'?reference:profile==='bounded-process@1'?reference.module:reference.id;
 const limit=(name:string,measure:string):number=>{
  const scopes=[`reader/${name}`,`reader/${reader}/${name}`];
  const rows=lines.filter(f=>scopes.includes(f.scope??'')&&f.measure===measure&&f.value!=='withdraw'&&f.role==='writes');
  if(!rows.length)throw Error(`REFUSE·reader ${reader} no declared ${name}`);
  const values=rows.map(f=>{
   const bound=f.form==='interval'?boundOf('interval',f.value??''):undefined;
   if(!bound||bound.kind!=='interval'||bound.hi===null||!Number.isSafeInteger(bound.hi)||bound.hi<=0||bound.lo===null||bound.lo<0||bound.lo>bound.hi)throw Error(`REFUSE·reader ${reader} invalid ${f.scope}`);
   return {lo:bound.lo,hi:bound.hi};
  });
  // The historical profile used upper ceilings only. Its meaning remains fixed.
  if(profile==='bounded-process@1')return Math.min(...values.map(value=>value.hi));
  const lattice=intervals(0,Infinity);
  const bound=values.reduce((held,value)=>lattice.meet(held,value),lattice.top);
  if(!lattice.inhabited(bound))throw Error(`REFUSE·reader ${reader} conflicting ${name}`);
  return bound.hi;
 };
 return {timeoutMs:limit('timeout','milliseconds'),responseBytes:limit('response-bytes','bytes')};
}

/** Completed empty output requires an explicit permission; absence of input is a separate unanswered demand. */
export function readerAllowsEmpty(lines:readonly Readonly<Record<string,string>>[],reader:string):boolean {
 const contract=lines.filter(f=>(f.scope==='wire/reader-empty'||f.scope==='audit/wire/reader-empty')&&f.value!=='withdraw');
 if(!contract.length)return false;
 if(contract.some(f=>f.value!=='declared-empty@1'))throw Error('REFUSE·wire unsupported empty-reading contract');
 const rows=lines.filter(f=>[ 'reader/empty',`reader/${reader}/empty` ].includes(f.scope??'')&&f.measure==='id'&&f.role==='writes'&&f.value!=='withdraw');
 if(!rows.length)return false;
 if(rows.some(f=>f.form!=='alphabet'||!['allow','required'].includes(f.value??'')))throw Error(`REFUSE·reader ${reader} invalid empty policy`);
 return rows.every(f=>f.value==='allow');
}

/** The host supplies selection cardinality; the wire decides whether absence leaves a demand. */
export function assertReaderInputs(lines:readonly Readonly<Record<string,string>>[],reader:string,count:number):void {
 const contract=lines.filter(f=>(f.scope==='wire/reader-inputs'||f.scope==='audit/wire/reader-inputs')&&f.value!=='withdraw');
 if(!contract.length)return;
 if(contract.some(f=>f.value!=='declared-presence@1'))throw Error('REFUSE·wire unsupported reader input presence');
 const rows=lines.filter(f=>['reader/inputs',`reader/${reader}/inputs`].includes(f.scope??'')&&f.measure==='id'&&f.role==='writes'&&f.value!=='withdraw');
 if(!rows.length||rows.some(f=>f.form!=='alphabet'||!['required','optional'].includes(f.value??'')))throw Error(`REFUSE·reader ${reader} no valid input presence policy`);
 if(count===0&&rows.some(f=>f.value==='required'))throw Error(`REFUSE·reader ${reader} required input selection is empty`);
}
