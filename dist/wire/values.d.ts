import type { Bound } from './types.ts';
export declare function unpipe(value: string): readonly string[] | null;
/**
 * A number as the wire writes it, the only spelling it reads: decimal digits, a minus when negative and a fraction
 * when it has one, never an exponent, a hex prefix, a leading dot or padding. The digits are the shortest that read
 * back to the number, so a second head in any language writes the same bytes; a number that is not finite has none.
 */
export declare function decimal(n: number): string;
export interface FormGrammar {
    readonly form: string;
    readonly parse: (value: string) => Bound | null;
}
export declare function boundOf(form: string, value: string, grammars?: readonly FormGrammar[]): Bound | null;
export declare const BOUND_FORMS: readonly string[];
export declare const REF_RELATIONS: readonly ["within", "copies", "derives"];
