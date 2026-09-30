import { violationsIn as lawsBrokenIn } from '@lapxo/obligations';
import { alphabet } from '../wire/grammar.ts';
import { fromLine } from '../wire/claimline.ts';
import { byBytes, canonical } from '../wire/line.ts';
import { decimal } from '../wire/values.ts';
import type { Interval, Lattice, Unit } from '@lapxo/obligations';

/**
 * A form of the wire is how a line writes a value and the lattice of the algebra that value is read in: an id, the
 * parameters that lattice takes, the text a line carries and the points every reading over forms samples. A form here
 * orders nothing of its own; each hands over a lattice the algebra already offers, parametrised, and what a form would
 * need that the algebra does not offer is the algebra's to add.
 */
export interface WireForm<T = unknown> {
  readonly id: string;
  lattice(params: unknown): Lattice<T>;
  parse(params: unknown, text: string): T;
  emit(params: unknown, value: T): string;
  show(params: unknown, value: T): string;
  points(params: unknown, seed: number, n: number): readonly T[];
}

export const violationsIn = (lattice: ReturnType<WireForm['lattice']>, points: ReturnType<WireForm['points']>): readonly string[] => lawsBrokenIn(lattice, points);

type Fields = Readonly<Record<string, unknown>>;

export const paramsOf = (params: unknown): Fields => (params !== null && typeof params === 'object' ? params as Fields : {});

export function refuseForm(id: string, why: string): never {
  throw new Error(`REFUSE·form ${id}: ${why}`);
}

export function numberAt(id: string, params: unknown, name: string): number {
  const held = paramsOf(params)[name];
  if (typeof held !== 'number' || !isFinite(held)) refuseForm(id, `takes ${name} as a number, and a value it is not given is not invented`);
  return held;
}

export function wordsAt(id: string, params: unknown, name: string): readonly string[] {
  const held = paramsOf(params)[name];
  if (!Array.isArray(held) || !held.length || held.some((one) => typeof one !== 'string')) refuseForm(id, `takes ${name} as a list of words`);
  return held as readonly string[];
}

export const written = (words: readonly string[]): string => alphabet({ polarity: 'permit', members: [...new Set(words)].sort(byBytes) });

/**
 * A band a line writes over an interval it is given: `lo..hi`, one end alone, `*` for an end left open, or `empty`.
 * Its ends are read by the wire's own interval form, the one a claim's value is read by, and one end alone is that end twice.
 */
export function bandOf(id: string, whole: Interval, text: string): Interval {
  if (text === 'empty') return { lo: whole.hi, hi: whole.lo };
  const read = (value: string): Interval | undefined => ((got) => (got.kind === 'fact' && got.value.bound.kind === 'interval' ? { lo: got.value.bound.lo ?? whole.lo, hi: got.value.bound.hi ?? whole.hi } : undefined))(fromLine(canonical({ form: 'interval', value }), null));
  return read(text) ?? read(`${text}..${text}`) ?? refuseForm(id, `\`${text}\` is not a band: lo..hi or one end, each a number or *`);
}

export const bandText = (value: Interval): string => ((end) => (value.lo > value.hi ? 'empty' : `${end(value.lo)}..${end(value.hi)}`))((n: number) => (isFinite(n) ? decimal(n) : '*'));

/** A band a line writes over levels it is given, `lo..hi` or one level alone: the band of them whose written text it is. */
export function levelsOf(id: string, held: readonly string[], text: string): Unit {
  if (held.some((level) => level.includes('..'))) refuseForm(id, 'a level holds no band mark `..`');
  const band = held.flatMap((floor) => held.map((ceiling) => ({ subject: '', floor, ceiling }))).find(({ floor, ceiling }) => text === `${floor}..${ceiling}`)
    ?? (text.includes('..') ? undefined : held.filter((level) => level === text).map((level) => ({ subject: '', floor: level, ceiling: level }))[0]);
  return band ?? refuseForm(id, `\`${text}\` is not one of its levels, nor two of them as lo..hi`);
}
