import { alphabet } from './grammar.ts';
import { byBytes } from './line.ts';
import { fact, refuse } from './outcome.ts';
import type { Outcome } from './outcome.ts';

export interface ObjectRecord {
  readonly record: 'cell' | 'claim' | 'mark';
  readonly fields: Readonly<Record<string, string>>;
}

export interface ObjectGrammar {
  readonly activation: number;
  readonly types: ReadonlySet<string>;
  readonly common: ReadonlySet<string>;
  readonly configuration: ReadonlySet<string>;
  readonly reserved: ReadonlySet<string>;
  readonly required: ReadonlyMap<string, ReadonlySet<string>>;
  readonly allowed: ReadonlyMap<string, ReadonlySet<string>>;
}

export function coordinateText(value: string): boolean {
  return value !== '' && !/[\s\\|]/.test(value) && value.split('/').every((s) => s !== '' && s !== '.' && s !== '..' && s !== '*' && s !== '**');
}

export function restCoordinates(text: string): readonly string[] | undefined {
  try {
    const read = alphabet(text);
    if (read.polarity !== 'permit' || read.members.some((one) => !coordinateText(one))) return undefined;
    const sorted = [...new Set(read.members)].sort(byBytes);
    if (alphabet({polarity: 'permit', members: sorted}) !== text) return undefined;
    return sorted;
  } catch { return undefined; }
}

const COMMON = ['type','scope','id','epoch','by','sig'] as const;

/** Typed records retain encoded values; only the selected codec interprets them. */
export function objectFromFields(fields: Readonly<Record<string,string>>, keys: readonly string[], schema: ObjectGrammar, globalFields: ReadonlySet<string>, forms: ReadonlySet<string>): Outcome<ObjectRecord> {
  const bad = (why: string, key?: string): Outcome<ObjectRecord> => refuse(why,key);
  if (keys.includes('at')) return bad('object records carry no at: order is epoch and a local join witness is widens','at');
  const type = fields.type;
  if (!schema.types.has(type ?? '') || !['cell','claim','mark'].includes(type ?? '')) return bad('an object record names a declared type: cell, claim or mark','type');
  if (!/^(0|[1-9][0-9]*)$/.test(fields.epoch ?? '') || !Number.isSafeInteger(Number(fields.epoch))) return bad('an object record carries an exactly supported logical epoch','epoch');
  if (Number(fields.epoch) < schema.activation) return bad(`an object epoch precedes typed-wire activation ${schema.activation}`,'epoch');
  let row: string;
  if (type === 'cell') row = 'cell';
  else if (fields.sign === '-1') row = `${type}/negative`;
  else if (fields.sign !== '+1') return bad('a claim or mark names sign=+1 or sign=-1','sign');
  else if (type === 'claim') row = 'claim/positive';
  else if (fields.pole === 'floor' && fields.reach === 'travels' && fields.widens === undefined) row = 'mark/floor-travelling';
  else if (fields.pole === 'ceiling' && fields.reach === 'travels' && fields.widens === undefined) row = 'mark/travelling';
  else if (fields.pole === 'ceiling' && fields.reach === 'local') row = 'mark/local';
  else return bad('a positive mark is ceiling/travels, ceiling/local with widens, or floor/travels without widens','pole');
  const required = schema.required.get(row);
  const allowed = schema.allowed.get(row);
  if (!required || !allowed || schema.common.size===0 || schema.configuration.size===0 || [...schema.common].some(k=>!required.has(k)||!allowed.has(k)) || [...required].some(k=>!allowed.has(k))) return bad(`typed wire has no complete required/allowed contract for ${row}`,'type');
  // These are intrinsic envelope identities, not a copy of each row's field alphabet.
  for(const key of COMMON) if(fields[key]===undefined||fields[key]==='') return bad(`an object record has no ${key}`,key);
  for (const key of keys) if (!globalFields.has(key) || !allowed.has(key)) return bad(`\`${key}=\` is not allowed on ${row}`,key);
  for (const key of required) if (!allowed.has(key) || fields[key] === undefined || fields[key] === '') return bad(`a ${row} record has no declared required \`${key}\``,key);
  if (!coordinateText(fields.scope!)) return bad('scope is a canonical cell coordinate','scope');
  if (type === 'cell') {
    if (!forms.has(fields.form!)) return bad('the cell names no admitted form','form');
    if (restCoordinates(fields.restsOn!) === undefined) return bad('cell restsOn is none or a canonical alphabet of coordinates','restsOn');
  }
  return fact({record:type as ObjectRecord['record'],fields:{...fields}});
}
