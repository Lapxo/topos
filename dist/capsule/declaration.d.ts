import type { Handed } from './asked.ts';
export interface Declaration {
    readonly domain: string;
    readonly runtime?: string;
    readonly holds?: string;
    readonly pins: Readonly<Record<string, string>>;
    readonly renders: readonly string[];
    readonly reads: readonly string[];
    readonly regions: Readonly<Record<string, readonly string[]>>;
    readonly writes: Readonly<Record<string, string>>;
    readonly effects: readonly string[];
}
/**
 * What a capsule's own lock says of it: the domain it serves, the runtime the host starts it with, where its world holds
 * its values, the release it pins of each package it bundles, and one line per region — what the region reads, and its
 * role: a render writes a page, a receipt is a reader's claims. The paths a place's regions cover are lines of another
 * measure and no region of the capsule. A lock of the older shape names its regions in one list and their reads one line
 * each; one that reads as one is read as one. A region no line names reads nothing and is refused.
 */
export declare function declarationOf(lines: readonly string[]): Declaration;
export declare const readsOf: (declaration: Declaration, region: string) => readonly string[] | undefined;
/**
 * The lines a capsule sees, handed by the contract: the standing lines of the place that lie in a region its own lock
 * reads, parsed by the wire. Nothing else of the lock reaches it, and no file does.
 */
export declare function handed(reads: readonly string[], lines: readonly string[]): readonly Handed[];
