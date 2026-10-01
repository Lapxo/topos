import type { Asked } from './asked.ts';
type Region = (asked: Asked) => readonly string[];
/**
 * The shell a capsule's rendered index hands its regions to: a region is answered only when it was handed every read
 * its own line declares, and one handed less is refused — the no every render capsule carries without writing it.
 * Handed the url of a world's index instead, each shell only names where the world lies: its host reads the own lock
 * beside it once and loads each region by name and role.
 */
export declare function shell(regions: Readonly<Record<string, {
    readonly reads: readonly string[];
    readonly region: Region;
}>> | string): Region;
type Handed = readonly {
    readonly place: string;
    readonly text: string;
}[];
type Observe = (bytes: Uint8Array, place: string, files: Handed) => readonly unknown[];
type Run = (place: string, self: string, held: readonly (readonly [string, string])[]) => readonly unknown[];
type Reading = {
    readonly reads: readonly string[];
    readonly observe?: Observe;
    readonly run?: Run;
};
/**
 * The shell a reader capsule's rendered index hands its readers to: each is asked as the region its own line names, and
 * reads only what that line declares it reads — a region fits a read when some tail of its steps matches the read's glob,
 * and what follows its `@` is the resolution it is handed at. A region no line names is refused, and so is a file of another shape.
 */
export declare function readers(regions: Readonly<Record<string, Reading>> | string): {
    readonly observe: (bytes: Uint8Array, place: string, region?: string, files?: Handed) => readonly unknown[];
    readonly run: (place: string, self: string, held: readonly (readonly [string, string])[], region?: string) => readonly unknown[];
};
type Measured = {
    readonly scope: string;
    readonly measure: string;
    readonly role: 'reads';
    readonly bound: {
        readonly kind: 'interval';
        readonly lo: number;
        readonly hi: number;
    };
};
export declare const counted: (asked: Asked, what: string, n: number, measure: string) => readonly Measured[];
/**
 * The shell a capsule's rendered index hands its receipt regions to: a region answers claims, and only when it was
 * handed every read its own line declares; one handed less is refused, as a render is. A reading it answers is `counted`:
 * a count, named by the region that read it and by what it counted.
 */
export declare function receiptShell(regions: Readonly<Record<string, {
    readonly reads: readonly string[];
    readonly region: (asked: Asked) => readonly unknown[];
}>> | string): (asked: Asked) => readonly unknown[];
export {};
