import type { Outcome } from './outcome.ts';
export declare const PROTOCOL: "bound-lock/1";
export interface Line {
    readonly version: string;
    readonly fields: Readonly<Record<string, string>>;
}
export declare function byBytes(a: string, b: string): number;
export declare function canonical(fields: Readonly<Record<string, string>>, version?: string): string;
export declare function signedBytes(fields: Readonly<Record<string, string>>, version?: string): string;
export declare function parse(text: string): Outcome<Line>;
