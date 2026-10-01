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
    readonly region: string;
    readonly at: number;
    readonly shape: string;
    readonly name: string;
    readonly reads: readonly string[];
    readonly lines: readonly Handed[];
    readonly regions: Readonly<Record<string, Held>>;
}
export declare const of: (line: Handed | undefined, field: string) => string;
export declare const found: (asked: Asked, scope: string) => Handed | undefined;
export declare const value: (asked: Asked, scope: string) => string | undefined;
export declare const listed: (asked: Asked, scope: string) => readonly string[];
export declare const lang: (asked: Asked) => string;
export declare const receipts: (asked: Asked, region: string) => readonly Handed[];
export declare const placeOf: (line: Handed) => string;
export declare const regionLines: (asked: Asked, region: string) => readonly Handed[];
export {};
