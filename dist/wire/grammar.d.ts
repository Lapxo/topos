export interface Alphabet {
    readonly polarity: 'permit' | 'forbid';
    readonly members: readonly string[];
}
export type Field = readonly [key: string, value: string];
export interface Resolution {
    readonly name: string;
    readonly at?: number | '*';
}
export interface Requirement {
    readonly name: string;
    readonly range: string;
}
/**
 * The grammars inside a value, one function each: handed the text a line carries it reads the value, handed the value
 * it writes the canonical text, and what it writes reads back to what it was handed. A value is read after its line has
 * unquoted it, and nothing outside the wire splits one.
 */
export declare function alphabet(text: string): Alphabet;
export declare function alphabet(value: Alphabet): string;
export declare function fields(text: string): readonly Field[];
export declare function fields(value: readonly Field[]): string;
export declare function steps(text: string): readonly string[];
export declare function steps(value: readonly string[]): string;
export declare function atResolution(text: string): Resolution;
export declare function atResolution(value: Resolution): string;
export declare function requirement(text: string): Requirement;
export declare function requirement(value: Requirement): string;
