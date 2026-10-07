import type {providerFields} from '../topos/provider-inputs.ts';
import { alphabet } from '../wire/grammar.ts';

export type Handed = Readonly<Record<string, string>>;

interface Held {
  readonly lines: readonly Handed[];
  readonly receipts: readonly Handed[];
}

/**
 * What a render capsule is asked: one region of one place, at a resolution, the reads it was handed by and the lines
 * they gave, and for each region of the place it reads, that region's lines and its receipts; each handed as its
 * fields, never as its text.
 */
export interface Asked {
  readonly provider?: ReturnType<typeof providerFields>;
  readonly region: string;
  readonly at: number;
  readonly shape: string;
  readonly name: string;
  readonly reads: readonly string[];
  readonly lines: readonly Handed[];
  readonly regions: Readonly<Record<string, Held>>;
}

export const of = (line: Handed | undefined, field: string): string => line?.[field] ?? '';
export const found = (asked: Asked, scope: string): Handed | undefined => asked.lines.find((line) => of(line, 'scope') === scope);
export const value = (asked: Asked, scope: string): string | undefined => (found(asked, scope) === undefined ? undefined : of(found(asked, scope), 'value'));
export const listed = (asked: Asked, scope: string): readonly string[] => alphabet(value(asked, scope) ?? '').members;
export const lang = (asked: Asked): string => value(asked, 'lang') ?? '';
export const receipts = (asked: Asked, region: string): readonly Handed[] => asked.regions[region]?.receipts ?? [];
export const placeOf = (line: Handed): string => of(line, 'at').replace(/^[^:]*:/, '');
export const regionLines = (asked: Asked, region: string): readonly Handed[] => asked.regions[region]?.lines ?? [];
