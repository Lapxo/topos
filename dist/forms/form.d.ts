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
export declare const violationsIn: (lattice: ReturnType<WireForm["lattice"]>, points: ReturnType<WireForm["points"]>) => readonly string[];
type Fields = Readonly<Record<string, unknown>>;
export declare const paramsOf: (params: unknown) => Fields;
export declare function refuseForm(id: string, why: string): never;
export declare function numberAt(id: string, params: unknown, name: string): number;
export declare function wordsAt(id: string, params: unknown, name: string): readonly string[];
export declare const written: (words: readonly string[]) => string;
/**
 * A band a line writes over an interval it is given: `lo..hi`, one end alone, `*` for an end left open, or `empty`.
 * Its ends are read by the wire's own interval form, the one a claim's value is read by, and one end alone is that end twice.
 */
export declare function bandOf(id: string, whole: Interval, text: string): Interval;
export declare const bandText: (value: Interval) => string;
/** A band a line writes over levels it is given, `lo..hi` or one level alone: the band of them whose written text it is. */
export declare function levelsOf(id: string, held: readonly string[], text: string): Unit;
export {};
