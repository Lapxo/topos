import type { Claim } from '../wire/types.ts';
import type { ToposDescriptor } from '../wire/descriptor.ts';
import type { Bindings } from './bindings.ts';
/** A seen row has no origin: the SDK stamps by= and at= from what it handed over, and observe(bytes, digest) turns bytes into seen rows with no files, no store, no clock and no network. */
type Seen = {
    readonly scope: string;
    readonly measure: string;
    readonly role: Claim['role'];
    readonly bound: Claim['bound'];
    readonly unit?: string;
};
type Observe = (bytes: Uint8Array, digest: string) => readonly Seen[];
export interface DefinedTopos {
    readonly kind: 'defined';
    readonly id: string;
    readonly includes: readonly string[];
    readonly members: readonly unknown[];
    readonly claims: readonly Claim[];
    readonly descriptor: ToposDescriptor;
    readonly bindings: Bindings;
    readonly domain?: readonly string[];
    readonly observe?: Observe;
}
/** A region's cost is a fold of what was observed: the join of the spans its runs took, and none while it is only declared. */
export declare const costOf: (observed: readonly (readonly [number, number])[]) => {
    readonly cost?: readonly [number, number];
};
export declare function defineTopos(opts: {
    readonly id: string;
    readonly includes?: readonly string[];
    readonly members?: readonly unknown[];
    readonly by?: string;
    readonly bindings?: Bindings;
    readonly domain?: readonly string[];
    readonly observe?: Observe;
}): DefinedTopos;
export {};
