import {alphabet} from '../wire/grammar.ts';
import {byBytes} from '../wire/line.ts';
import {programsOf} from '../contract/programs.ts';
import type {EvidenceStatus, ProgramInputs} from '../contract/programs.ts';
import type {Asked, Handed} from '../capsule/asked.ts';
import {bandOf} from '../forms/form.ts';

/** Selectors are supplied by the selected Topos; place lines cannot redefine them. */
export function programInputs(asked: Asked): ProgramInputs {
  const provider=asked.provider?.lines??[];
  const select=(name:string):string=>{
    const rows=provider.filter(f=>f.scope==='wire/programs/'+name&&f.measure==='id');
    if(rows.length!==1||!rows[0]!.value)throw Error('REFUSE·program missing or conflicting selector '+name);
    return rows[0]!.value!;
  };
  if(select('profile')!=='admitted-demands@1')throw Error('REFUSE·program unsupported projection profile');
  const one=(scope:string):Handed|undefined=>{
    const rows=asked.lines.filter(f=>f.scope===scope);
    if(rows.length>1)throw Error('REFUSE·program conflicting input '+scope);
    return rows[0];
  };
  const list=(text:string):readonly string[]=>alphabet(text).members;
  const selection=one(select('selection'));
  if(!selection)throw Error('REFUSE·program no declared selection');
  const programs=list(selection.value??'').map(scope=>{
    const row=one(scope);
    if(!row||row.role!=='demands')throw Error('REFUSE·program selected coordinate is not a demand '+scope);
    return {scope,needs:list(row.needs??'none'),restsOn:list(row.restsOn??'none')};
  });
  const minimum=one(select('minimum'));
  const region=select('evidence');
  const supplied=asked.regions[region]?.receipts;
  if(supplied===undefined)throw Error('REFUSE·program evidence region was not handed '+region);
  const evidence=new Map<string,EvidenceStatus>();
  for(const reading of supplied.filter(f=>f.measure==='status')) {
    const scope=reading.scope??'',status=reading.value??'';
    if(!['met','unmet','unread','refused'].includes(status))throw Error('REFUSE·program unsupported evidence status '+scope);
    if(evidence.has(scope)&&evidence.get(scope)!==status)throw Error('REFUSE·program conflicting evidence '+scope);
    evidence.set(scope,status as EvidenceStatus);
  }
  const elapsedScope=select('elapsed');
  const elapsedRows=supplied.filter(f=>f.scope===elapsedScope);
  if(elapsedRows.length>1)throw Error('REFUSE·program conflicting elapsed reading '+elapsedScope);
  const ceilingRow=one(select('ceiling'));
  const elapsedRow=elapsedRows[0];
  if(elapsedRow&&ceilingRow&&elapsedRow.measure!==ceilingRow.measure)throw Error('REFUSE·program elapsed and ceiling units differ');
  const measure=(row:Handed|undefined,exact:boolean):number|undefined=>{
    if(!row)return undefined;
    if(row.form!=='interval')throw Error('REFUSE·program time input is not an interval '+row.scope);
    const span=bandOf('interval',{lo:0,hi:Infinity},row.value??'');
    if(!Number.isFinite(span.hi)||exact&&span.lo!==span.hi)throw Error('REFUSE·program time input is not an exact finite reading '+row.scope);
    return span.hi;
  };
  return {programs,evidence,minimum:list(minimum?.value??'none'),elapsed:measure(elapsedRow,true),ceiling:measure(ceilingRow,false)};
}

/** Projection labels are demands and their evidence, never object states. */
export function renderPrograms(asked: Asked): readonly string[] {
  const result=programsOf(programInputs(asked));
  return [
    `PROGRAM deadline=${result.deadline} closed=${result.closed}`,
    ...result.rows.map(row=>`DEMAND ${row.scope} ${row.status} blocked=${row.blocked.join('|')||'none'} missing=${row.missing.join('|')||'none'} unread=${row.unread.join('|')||'none'} carry=${row.carry}`),
    ...result.next.sort(byBytes).map(scope=>'NEXT '+scope),
  ];
}
