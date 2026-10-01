import type { Bound, MeetSemilattice } from './types.ts';
export type Kind = 'claims' | 'forms' | 'readers' | 'views';
export interface FormBody<T> {
    lattice(): MeetSemilattice<T>;
    readonly helly: boolean;
}
export interface FileInput {
    readonly place: string;
    readonly text: string;
}
export type ReaderMethod = 'exact' | 'statistics';
export type ReaderInputKind = "bytes" | "session" | "execution" | "stream";
export interface ViewBody<T> {
    to(bound: Bound): T;
    from(shown: T): Bound | null;
}
export declare function matches(glob: string, place: string): boolean;
