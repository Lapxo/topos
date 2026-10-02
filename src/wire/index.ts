/** It answers the line, the forms' encodings, the names — how is a fact written? */
export { PROTOCOL } from './types.ts';
export type { Claim, Method } from './types.ts';
export { byBytes, canonical, parse, signedBytes } from './line.ts';
export { alphabet, atResolution, fields, requirement, steps } from './grammar.ts';
export type { Alphabet, Field, Requirement, Resolution } from './grammar.ts';
export { fromLine, signersOf, authorityOf, windowAt, roleClaimsOf, roleAt, namesAt, isKeyClaim, isWireClaim, wireAt, ENVELOPE } from './claimline.ts';
export type { Published, Signer, SignerVerdict, CoordinateRole, RoleClaim } from './claimline.ts';
export { matches } from './classes.ts';
export { CAPSULE, EXTENSION, LOCK, RECEIPTS } from './names.ts';
export { decimal } from './values.ts';
export { combine } from './measures.ts';
export { weakest } from './evidence.ts';
export { formatSignature, parseSignature, signedFieldsOf } from './sig.ts';
