/**
 * Three arms, and there is no fourth. Isolated so the line kernel
 * does not import the rest of the wire.
 */
export type Outcome<T> = {
    readonly kind: 'fact';
    readonly value: T;
} | {
    readonly kind: 'abstain';
    readonly why: string;
} | {
    readonly kind: 'refuse';
    readonly why: string;
    readonly named?: string;
};
export declare const fact: <T>(value: T) => Outcome<T>;
export declare const abstain: <T>(why: string) => Outcome<T>;
export declare const refuse: <T>(why: string, named?: string) => Outcome<T>;
