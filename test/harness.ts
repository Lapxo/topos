import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { observed } from '@lapxo/topos/contract';

export type Vector = Readonly<Record<string, unknown>>;

/** The one module that loads what a block compares against: a vector by its name, a sample by its side and name, handed through the contract's observation. */
export const load = (name: string): Vector => JSON.parse(readFileSync(join(import.meta.dirname, '..', 'vectors', `${name}.json`), 'utf8')) as Vector;
export const sample = (side: 'yes' | 'no', name: string): Vector => observed(JSON.parse(readFileSync(join(import.meta.dirname, '..', 'samples', side, `${name}.json`), 'utf8')) as Vector, `samples/${side}/${name}`);
