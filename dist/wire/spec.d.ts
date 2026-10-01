import { PROTOCOL } from './index.ts';
export interface Request {
    readonly protocol: typeof PROTOCOL;
    readonly verb: 'describe' | 'read' | 'render';
    readonly rootScope: string;
    readonly files: readonly {
        readonly place: string;
        readonly text: string;
    }[];
    readonly held?: readonly (readonly [string, string])[];
    readonly region?: string;
    readonly at?: number;
    readonly name?: string;
    readonly lines?: readonly string[];
    readonly reads?: readonly string[];
    readonly shape?: string;
    readonly regions?: Readonly<Record<string, {
        readonly lines: readonly string[];
        readonly receipts: readonly string[];
    }>>;
}
export interface Response {
    readonly protocol: typeof PROTOCOL;
    readonly kind: 'fact' | 'abstain' | 'refuse';
    readonly claims?: readonly unknown[];
    readonly lines?: readonly string[];
    readonly why?: string;
}
