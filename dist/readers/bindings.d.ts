/**
 * Local, non-serialisable bindings. The descriptor travels; these stay here.
 */
import type { Claim, Outcome } from '../wire/types.ts';
import type { FileInput, FormBody, ViewBody } from '../wire/classes.ts';
interface ActivationContext {
    readonly capabilities?: ReadonlySet<string>;
    readonly store?: {
        get(hash: string): {
            readonly bytes: Uint8Array;
        } | undefined;
    };
}
export interface Bindings {
    readonly readers?: Readonly<Record<string, (file: FileInput) => Outcome<readonly Claim[]>>>;
    readonly accepts?: Readonly<Record<string, (place: string) => boolean>>;
    readonly views?: Readonly<Record<string, ViewBody<unknown>>>;
    readonly forms?: Readonly<Record<string, FormBody<unknown>>>;
    readonly activate?: (context: ActivationContext) => unknown;
}
export {};
