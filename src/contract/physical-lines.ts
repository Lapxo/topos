import {finiteRegionMeasure} from '@lapxo/obligations/measures';
import {matches} from '../wire/classes.ts';
import {byBytes} from '../wire/line.ts';

export const PHYSICAL_LINES_PROFILE = 'topos-physical-lines/1' as const;
export const PHYSICAL_LINES_MODEL = {name:'finite-nonnegative-atomic-valuation@1',contract:'sha256:636ace16eeaa46eafb7b07c28d1d57916bc9108b188e96b5a8bf7bed6dc15707',implementation:'sha256:ef7e39d0ac44b0dd3d4b68220d3c381f737eb2729d0017ed3271ce119d408b13'} as const;
export interface PhysicalLinesInput {
  readonly profile: typeof PHYSICAL_LINES_PROFILE;
  /** Supplied snapshot identity; this function does not authenticate its authority or completeness. */
  readonly snapshot: string;
  readonly files: readonly {readonly name: string; readonly digest: string; readonly bytes: Uint8Array}[];
  readonly regions: readonly {readonly scope: string; readonly selectors: readonly string[]}[];
  readonly policy: {readonly byteBudget: string; readonly rowBudget: string};
}
const refuse = (cause: string): never => {throw Error('REFUSE·physical-lines/'+cause);};
const digest = (x: unknown): x is string => typeof x==='string' && /^sha256:[0-9a-f]{64}$/.test(x);
const name = (x: unknown): x is string => typeof x==='string' && x.length>0 && !/[\u0000-\u001f\u007f]/.test(x);
const path = (x: unknown): x is string => name(x) && !x.includes('\\') && x.split('/').every(s=>s!==''&&s!=='.'&&s!=='..');
const integer = (x: unknown): x is string => typeof x==='string' && /^(0|[1-9][0-9]*)$/.test(x);
const fields = (x: object, allowed: readonly string[]) => Object.keys(x).every(k=>allowed.includes(k));
/** Pure physical-line reader. Hashing is an injected host primitive, not a source of authority. */
export function readPhysicalLines(input: PhysicalLinesInput, hash: (bytes: Uint8Array)=>string) {
  if (typeof hash!=='function') return refuse('digest-port');
  if (!input || input.profile!==PHYSICAL_LINES_PROFILE || !fields(input,['profile','snapshot','files','regions','policy']) || !digest(input.snapshot)) return refuse('profile');
  if (!Array.isArray(input.files) || !Array.isArray(input.regions) || !input.policy || !fields(input.policy,['byteBudget','rowBudget']) || !integer(input.policy.byteBudget) || !integer(input.policy.rowBudget)) return refuse('policy');
  let byteCount=0n;
  const names=new Set<string>(), scopes=new Set<string>();
  for (const file of input.files) {
    if (!file || !fields(file,['name','digest','bytes']) || !path(file.name) || file.name.includes('*') || !digest(file.digest) || !(file.bytes instanceof Uint8Array)) return refuse('file');
    if (names.has(file.name)) return refuse('duplicate-file');
    names.add(file.name); byteCount+=BigInt(file.bytes.length);
  }
  for (const region of input.regions) {
    if (!region || !fields(region,['scope','selectors']) || !name(region.scope) || !Array.isArray(region.selectors) || !region.selectors.length || !region.selectors.every((s:unknown)=>path(s)&&s.split('/').every(p=>!p.includes('**')||p==='**'))) return refuse('selector');
    if (scopes.has(region.scope)) return refuse('duplicate-region');
    scopes.add(region.scope);
  }
  if (byteCount>BigInt(input.policy.byteBudget)) return {status:'unmeasured' as const,cause:'physical-lines/byte-budget' as const,required:String(byteCount),workUnit:'input-bytes' as const};
  // Bound the existing matcher's candidate work, including selector text, before it runs.
  const selectionWork=input.regions.reduce((n:bigint,r:PhysicalLinesInput['regions'][number])=>n+r.selectors.reduce((m:bigint,s:string)=>m+BigInt(s.length),0n)*BigInt(input.files.length+1),0n);
  if (selectionWork>BigInt(input.policy.rowBudget)) return {status:'unmeasured' as const,cause:'physical-lines/selection-budget' as const,required:String(selectionWork),workUnit:'selector-code-units-times-candidates' as const};
  const files=[...input.files].sort((a,b)=>byBytes(a.name,b.name));
  const atoms=files.map(file=>{
    if (hash(file.bytes)!==file.digest) return refuse('integrity');
    try {new TextDecoder('utf-8',{fatal:true}).decode(file.bytes);} catch {return refuse('utf8');}
    let count=0n;
    for (let i=0;i<file.bytes.length;i++) {
      if (file.bytes[i]===13 && file.bytes[i+1]!==10) return refuse('isolated-cr');
      if (file.bytes[i]===10) count++;
    }
    if (file.bytes.length && file.bytes[file.bytes.length-1]!==10) count++;
    return {id:file.name,value:String(count)};
  });
  const selected=[...input.regions].sort((a,b)=>byBytes(a.scope,b.scope)).map((region:PhysicalLinesInput['regions'][number])=>{
    const selectors=[...new Set<string>(region.selectors)].sort(byBytes);
    const selections=selectors.map(selector=>{
      const members=files.filter(file=>matches(selector,file.name)).map(file=>file.name);
      return members.length?{selector,members,status:'selected' as const}:{selector,members,status:'unmeasured' as const,cause:'selector-no-match' as const};
    });
    return {scope:region.scope,selectors,selections,members:[...new Set(selections.flatMap(s=>s.members))].sort(byBytes)};
  });
  const valuation=finiteRegionMeasure({model:'finite-nonnegative-atomic-valuation@1',unit:'physical-lines/utf8-lf@1',atoms,regions:selected.filter(r=>r.members.length).map(r=>({id:r.scope,members:r.members}))},{budget:input.policy.rowBudget});
  if (valuation.status==='unmeasured') return valuation;
  return {status:'read' as const,profile:PHYSICAL_LINES_PROFILE,snapshot:input.snapshot,model:PHYSICAL_LINES_MODEL,
    policy:{...input.policy},textDomain:'utf8-lf-crlf-reject-isolated-cr@1' as const,
    inputFiles:files.map(f=>({name:f.name,digest:f.digest})),
    regions:selected.map(r=>r.members.length?{...r,status:'measured' as const,value:valuation.readings.find(v=>v.region===r.scope)!.value}:{...r,status:'unmeasured' as const,cause:'selector-no-match' as const}),
    valuation,work:{inputBytes:String(byteCount),selectionUnits:String(selectionWork)},
    verification:'supplied inventory and snapshot; authority and completeness are consumer obligations' as const};
}
