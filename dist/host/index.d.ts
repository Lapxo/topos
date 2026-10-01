import type { Handed } from '../capsule/asked.ts';
type Module = Readonly<Record<string, unknown>>;
/**
 * A located index names only where its world lies, so its host loads the world in its place: handed the world's own lock
 * parsed and folded, as it stands, it imports each region from its one file by name and role into the shell of its kind,
 * a render's `render`, a law's `receipt`, a reader's `observe` and `run`, a region with a line of what it writes being a
 * reader. A world with no region of a kind has no shell of it; an index that still hands its regions to its shells is
 * answered as it is.
 */
export declare function locate(entry: string, lock: readonly Handed[], regions: string, ext: string): Promise<Module>;
export {};
