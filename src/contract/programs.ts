import {byBytes} from '../wire/line.ts';

export type EvidenceStatus = 'met' | 'unmet' | 'unread' | 'refused';
export interface Program {
  readonly scope: string;
  readonly needs: readonly string[];
  readonly restsOn: readonly string[];
}
export interface ProgramInputs {
  readonly programs: readonly Program[];
  /** Evidence already admitted by the caller. A file name is not evidence. */
  readonly evidence: ReadonlyMap<string, EvidenceStatus>;
  readonly minimum: readonly string[];
  readonly elapsed?: number;
  readonly ceiling?: number;
}

/** Demand dependency projection. No admission, I/O, stage names or release arithmetic. */
export function programsOf(input: ProgramInputs) {
  const fail = (why: string): never => {throw Error('REFUSE·program '+why);};
  const unique = (values: readonly string[], name: string): void => {
    if(values.some(value=>!value)||new Set(values).size!==values.length)fail('duplicate or empty '+name);
  };
  if(!input.minimum.length)fail('minimum is absent; vacuity cannot close a program');
  unique(input.minimum,'minimum coordinate');
  for(const [coordinate,status] of input.evidence) {
    if(!coordinate||!['met','unmet','unread','refused'].includes(status))fail('unsupported evidence status '+coordinate);
  }
  const declared=new Map<string,Program>();
  for(const program of input.programs) {
    if(!program.scope||declared.has(program.scope))fail('duplicate or empty coordinate '+program.scope);
    unique(program.needs,'requirement at '+program.scope);
    unique(program.restsOn,'dependency at '+program.scope);
    declared.set(program.scope,program);
  }
  for(const scope of input.minimum)if(!declared.has(scope))fail('unknown minimum '+scope);
  const colour=new Map<string,number>(),order:string[]=[];
  // Explicit stack: depth is data, not the JavaScript call-stack limit.
  for(const scope of [...declared.keys()].sort(byBytes)) {
    const pending:{scope:string;exit:boolean}[]=[{scope,exit:false}];
    while(pending.length) {
      const next=pending.pop()!;
      if(next.exit){colour.set(next.scope,2);order.push(next.scope);continue;}
      if(colour.get(next.scope)===2)continue;
      if(colour.get(next.scope)===1)fail('dependency cycle '+next.scope);
      const program=declared.get(next.scope);
      if(!program)fail('unknown dependency '+next.scope);
      colour.set(next.scope,1);pending.push({...next,exit:true});
      for(const parent of [...program!.restsOn].sort(byBytes).reverse())pending.push({scope:parent,exit:false});
    }
  }
  for(const [name,value] of [['elapsed',input.elapsed],['ceiling',input.ceiling]] as const) {
    if(value!==undefined&&(!Number.isFinite(value)||value<0))fail('invalid '+name+' reading');
  }
  const deadline=input.elapsed===undefined||input.ceiling===undefined?'unread':input.elapsed>input.ceiling?'over':'within';
  const minimum=new Set(input.minimum),states=new Map<string,string>();
  const rows=order.map(scope=>{
    const program=declared.get(scope)!;
    const blocked=program.restsOn.filter(parent=>states.get(parent)!=='met').sort(byBytes);
    const missing=program.needs.filter(coordinate=>['unmet','refused'].includes(input.evidence.get(coordinate)??'')).sort(byBytes);
    const unread=program.needs.filter(coordinate=>!input.evidence.has(coordinate)||input.evidence.get(coordinate)==='unread').sort(byBytes);
    const status=blocked.length?'blocked':missing.length?'unmet':unread.length||!program.needs.length?'unread':'met';
    states.set(scope,status);
    return {scope,status,blocked,missing,unread,carry:deadline==='over'&&!minimum.has(scope)&&status!=='met'};
  });
  return {deadline,rows,next:rows.filter(row=>row.status!=='met'&&!row.blocked.length&&!row.carry).map(row=>row.scope),closed:input.minimum.every(scope=>states.get(scope)==='met')};
}
