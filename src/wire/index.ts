/** It answers the line, the forms' encodings, the names — how is a fact written? */
export { PROTOCOL } from './types.ts';
export type { Claim, Method } from './types.ts';
export { byBytes, canonical, parse, parseForSigning, signedBytes } from './line.ts';
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

export type { ObjectRecord, ObjectGrammar } from './object-record.ts';
export type { Wire } from './claimline.ts';

export { validateObjectContext } from './object-context.ts';
export type { ObjectContext, SelectedObjectForm } from './object-context.ts';

export {recordKind} from './record-kind.ts';
export type {RecordKind} from './record-kind.ts';
export {objectHistory} from './object-history.ts';
export {restCoordinates} from './object-record.ts';
export const OBJECT_VIEW='object' as const;
export {publicationOf,publicLock} from './publication.ts';
export { requestBytes as signerRequestBytes, responseBytes as signerResponseBytes,
  responseOf as signerResponseOf, signerSelection } from './signing-port.ts';
export {readerLifetime} from './reader-lifetime.ts';
export type {ReaderLifetime,ReaderReference} from './reader-lifetime.ts';
export {readerAllowsEmpty,assertReaderInputs} from './reader-lifetime.ts';
export {transportSelection,contentRequest} from './transport-port.ts';
export type {TransportSelection,ContentRequest} from './transport-port.ts';
export {actBytes,actIdentity,actResultOf,actResultProfile} from './act-result.ts';
export type {ActResult,ActResultContract,ActPlacement} from './act-result.ts';
