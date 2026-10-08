import { byBytes, canonical, parse, signedBytes } from './line.ts';
import { parseSignature } from './sig.ts';

export interface ActResultContract {
  /** Receipt coordinate and context come from the admitted profile. */
  readonly scope: string;
  readonly context: string;
  readonly digest: (bytes: string) => string;
  /** The caller checks admitted keys, signature, coverage and epoch window. */
  readonly admitsRecord: (line: string, localEpoch: number) => boolean;
  /** Evidence verification is separate from configuration authority.
   * The profile and provenance decide whether the native receipt needs a signature.
   */
  readonly verifiesReceipt: (line: string) => boolean;
  readonly placements?: readonly ActPlacement[];
  readonly localEpoch?:number;
}
export interface ActPlacement {readonly place:string;readonly records:readonly string[]}

export interface ActResult {
  readonly identity: string;
  readonly epoch: number;
  readonly records: readonly string[];
  readonly receipt: string;
}

const refuse = (why: string): never => { throw new Error(`REFUSE·act ${why}`); };
const fieldsOf = (line: string, signed = true): Readonly<Record<string, string>> => {
  const got = parse(line);
  if (got.kind !== 'fact' || canonical(got.value.fields) !== line) return refuse('noncanonical record');
  const fields = got.value.fields;
  if (!fields['by'] || (signed && !parseSignature(fields['sig'] ?? ''))
    || (fields['sig'] !== undefined && !parseSignature(fields['sig']))) return refuse('unsigned or invalid record');
  return fields;
};
const epochOf = (fields: Readonly<Record<string, string>>): number => {
  const text = fields['epoch'] ?? '';
  const epoch = Number(text);
  if (!/^(0|[1-9][0-9]*)$/.test(text) || !Number.isSafeInteger(epoch)) return refuse('invalid local epoch');
  return epoch;
};

/** An act is ordered signed payload, not a standing or an unordered set.
 * Only sig is excluded; by, epoch and every signed field remain covered.
 * Re-delivery does not add a record; duplicate payloads inside a lot refuse.
 */
export function actBytes(records: readonly string[]): string {
  if (!records.length) return refuse('empty lot');
  const payloads = records.map(line => signedBytes(fieldsOf(line)));
  if (new Set(payloads).size !== payloads.length) return refuse('duplicate record');
  for (const line of records) epochOf(fieldsOf(line));
  return payloads.join('\n') + '\n';
}

/** The declared receiving coordinate/context separates deliveries of the same
 * payload to different places. This header is identity framing, not an admitted
 * claim or a receipt. It contains logical coordinates, never display paths.
 */
export function actIdentity(records: readonly string[], contract: Pick<ActResultContract,'scope'|'context'|'digest'|'placements'|'localEpoch'>): string {
  if (!contract.scope || !contract.context) return refuse('missing receipt contract');
  const payload=actBytes(records);
  const placements=contract.placements;
  let routing='';
  if(placements!==undefined){
    const assigned=new Set<string>(),places=new Set<string>(),all=new Set(records);
    for(const placement of placements){
      if(!placement.place || places.has(placement.place)
        || (placement.place!=='.' && (placement.place.startsWith('/')||placement.place.split('/').some(step=>!step||step==='.'||step==='..'))))return refuse('invalid receiving coordinate');
      places.add(placement.place);
      for(const record of placement.records){if(!all.has(record))return refuse('placement contains an uncommitted record');assigned.add(record)}
    }
    if(assigned.size!==all.size)return refuse('unassigned committed record');
    routing=[...placements].sort((a,b)=>byBytes(a.place,b.place)).map(placement=>canonical({
      scope:placement.place,role:'writes',form:'alphabet',measure:'digest',
      value:contract.digest(actBytes(placement.records)),at:contract.context,by:'target',
    })).join('\n')+'\n';
  }
  if(contract.localEpoch!==undefined&&(!Number.isSafeInteger(contract.localEpoch)||contract.localEpoch<0))return refuse('invalid commit epoch');
  return contract.digest(canonical({scope:contract.scope,at:contract.context,...(contract.localEpoch===undefined?{}:{epoch:String(contract.localEpoch)})})+'\n'+payload+routing);
}

/** Authenticate the public projection of a committed local act, using the
 * existing native digest receipt. This neither commits storage nor proves
 * conformance; the host publishes the records and receipt atomically.
 * Foreign history belongs to ingress and keeps its separate clock.
 */
export function actResultOf(records: readonly string[], receipt: string, contract: ActResultContract): ActResult {
  const identity = actIdentity(records, contract);
  const fields = fieldsOf(receipt, false);
  const epoch = epochOf(fields);
  if (fields['scope'] !== contract.scope || fields['at'] !== contract.context
    || fields['role'] !== 'writes' || fields['form'] !== 'alphabet'
    || fields['measure'] !== 'digest' || fields['value'] !== identity) return refuse('receipt does not bind this act');
  // The receipt carries the local commit clock. Record clocks remain signed,
  // immutable inputs; admission checks their kind under that local clock.
  for (const line of records) if (contract.admitsRecord(line,epoch) !== true) return refuse('record not admitted');
  if (contract.verifiesReceipt(receipt) !== true) return refuse('receipt does not verify');
  return { identity, epoch, records: [...records], receipt };
}

/** Select only an explicitly admitted native result profile. Historical locks
 * without this selector retain their existing publication contract. */
export function actResultProfile(lines:readonly string[]):{scope:string;context:string}|undefined{
  const value=(scope:string):string|undefined=>{
    const values=[...new Set(lines.flatMap(line=>{const p=parse(line);return p.kind==='fact'&&p.value.fields['scope']===scope&&p.value.fields['role']==='writes'&&p.value.fields['value']!=='withdraw'?[p.value.fields['value']!]:[]}))];
    if(values.length>1)return refuse('conflicting '+scope);
    return values[0];
  };
  const profile=value('wire/act-result');
  if(profile===undefined)return undefined;
  if(profile!=='local-act@1')return refuse('unsupported result profile');
  const scope=value('wire/act-result-scope'),context=value('wire/act-result-context');
  if(!scope||!context)return refuse('incomplete result profile');
  return {scope,context};
}
