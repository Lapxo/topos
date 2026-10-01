/** It answers the line, the forms' encodings, the names — how is a fact written? */
export { PROTOCOL } from "./types.js";
export { byBytes, canonical, parse, signedBytes } from "./line.js";
export { alphabet, atResolution, fields, requirement, steps } from "./grammar.js";
export { fromLine, signersOf, authorityOf, windowAt, roleClaimsOf, roleAt, namesAt, isKeyClaim, isWireClaim, wireAt, ENVELOPE } from "./claimline.js";
export { matches } from "./classes.js";
export { CAPSULE, EXTENSION, LOCK, RECEIPTS } from "./names.js";
export { decimal } from "./values.js";
export { combine } from "./measures.js";
export { weakest } from "./evidence.js";
export { formatSignature, parseSignature, signedFieldsOf } from "./sig.js";
