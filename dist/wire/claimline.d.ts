import type { Outcome } from './outcome.ts';
import type { Claim } from './types.ts';
import type { FormGrammar } from './values.ts';
import type { KeyClass } from '../authority/motion.ts';
export declare const ENVELOPE: ReadonlySet<string>;
interface Wire {
    readonly epoch: number;
    readonly fields: ReadonlySet<string>;
    readonly required: ReadonlySet<string>;
    readonly roles: ReadonlySet<string>;
    readonly forms: ReadonlySet<string>;
    readonly classes: ReadonlySet<string>;
    readonly digests: ReadonlySet<string>;
    readonly signatures: ReadonlySet<string>;
    readonly formOf: ReadonlyMap<string, string>;
    readonly lists: ReadonlyMap<string, ReadonlySet<string>>;
}
export declare function isWireClaim(fields: Readonly<Record<string, string>>): boolean;
export declare function wireAt(lines: readonly Readonly<Record<string, string>>[], epoch: number): Wire | null;
export declare function fromLine(text: string, wire: Wire | null, grammars?: readonly FormGrammar[]): Outcome<Claim>;
export interface Signer {
    readonly id: string;
    readonly keyClass: KeyClass;
    readonly publicKey: string;
    readonly coverage: readonly string[];
    readonly spans?: readonly {
        readonly globs: readonly string[];
        readonly from: number;
        readonly to: number | null;
    }[];
    readonly depth: {
        readonly lo: number;
        readonly hi: number;
    };
    readonly admittedBy: readonly string[];
    readonly epoch?: {
        readonly start: number;
        readonly close: number | null;
    };
    readonly windows?: readonly {
        readonly lo: number;
        readonly hi: number;
        readonly from: number;
        readonly to: number | null;
    }[];
}
type Verify = (fields: Readonly<Record<string, string>>, publicKey: string) => boolean;
export type SignerVerdict = {
    readonly kind: 'admitted';
    readonly signer: string;
} | {
    readonly kind: 'grey';
    readonly why: string;
} | {
    readonly kind: 'refuse';
    readonly why: string;
    readonly named: string;
};
export declare function isKeyClaim(fields: Readonly<Record<string, string>>): boolean;
export declare function windowAt(signer: Signer, epoch: number): {
    readonly start: number;
    readonly close: number | null;
};
export declare function signersOf(lines: readonly Readonly<Record<string, string>>[], root: Signer, verify: Verify): {
    readonly admitted: readonly Signer[];
    readonly potential: readonly string[];
};
export declare function authorityOf(fields: Readonly<Record<string, string>>, signers: readonly Signer[], verify: Verify): SignerVerdict;
declare const COORDINATE_ROLES: readonly ["source", "derived", "observed", "foreign"];
export type CoordinateRole = (typeof COORDINATE_ROLES)[number];
export interface RoleClaim {
    readonly name: string;
    readonly role: CoordinateRole;
}
export declare function roleClaimsOf(lines: readonly Readonly<Record<string, string>>[]): readonly RoleClaim[];
export declare function namesAt(at: string, name: string): boolean;
export declare function roleAt(at: string, claims: readonly RoleClaim[]): CoordinateRole;
export {};
