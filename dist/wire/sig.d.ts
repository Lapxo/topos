/**
 * A signature is a value, not an act: `<algorithm>:<raw>` over the canonical bytes of every other field of a claim,
 * with the signer named. The algorithm is named by the digest of its definition, never by a name of its era, so no
 * alphabet of algorithms is closed here: which ones a wire admits, and from which epoch, is a signed line of its lock.
 * The raw part never holds a colon, so the last colon parts them; a digest may carry its own.
 */
interface SignatureValue {
    readonly algorithm: string;
    readonly raw: string;
}
export declare function formatSignature(algorithm: string, raw: string): string;
export declare function parseSignature(value: string): SignatureValue | null;
/** The fields a signature covers: every field but the signature itself, with the signer named. */
export declare function signedFieldsOf(fields: Readonly<Record<string, string>>, signer: string): Record<string, string>;
export {};
