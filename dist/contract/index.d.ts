import type { Asked } from '../capsule/index.ts';
import type { Request, Response } from '../wire/spec.ts';
export type { Request, Response } from '../wire/spec.ts';
type Answering = {
    readonly observe?: (bytes: Uint8Array, place: string, region?: string, files?: readonly {
        readonly place: string;
        readonly text: string;
    }[]) => readonly unknown[];
    readonly run?: (place: string, self: string, held: readonly (readonly [string, string])[], region?: string) => readonly unknown[];
    readonly render?: (asked: Asked) => readonly string[];
    readonly receipt?: (asked: Asked) => readonly unknown[];
};
/**
 * The one contract across processes, and the one serve: a module's one export answers each request, a reader's by
 * observing the file it is handed or, handed none, running the place it names, as the region asked when it holds several, a capsule's
 * by rendering a region, or by answering the claims of a receipt region, from the lines its own lock reads, parsed here and handed over. What throws is a refusal, what the module has no export for is an
 * abstention, and a reader that can only observe is refused when no file is handed: it never reads an empty one. The host reads and writes, this never does.
 */
export declare function answer(module: Answering, request: Request, self: string): Response;
/**
 * Observation is the contract's, not a global's: a runner listens once, and a harness hands each sample it loaded through
 * `observed`, which notes every field of a case a block reads by where the case came from; nobody listening, nothing is noted.
 */
export declare const listen: (note: ((at: string) => void) | undefined) => ((at: string) => void) | undefined;
export declare const observed: <T extends Readonly<Record<string, unknown>>>(held: T, at: string) => T;
export declare const respond: (module: Answering, input: string, self: string) => string;
export declare function responsesOf(printed: string, asked: number): readonly Response[];
