# Bind action context and reference identity to an existing native act receipt

One admitted signed record at the consumer-selected statement scope commits SHA256 of the canonical action statement plus LF. The native act receipt covers that record through the existing native verification contract. The packet names the native act identity and SHA256 of the receipt plus LF. No record is signed, admitted, persisted or committed by this API.

Reuse: `actResultOf`, `actIdentity`, `decodeLocatedReference`, `locatedReferenceIdentity`, `inspectLocatedReference`.

statement: verb, request/result digests, key/place/region, before/policy/catalog/standingContract digests

link: Emitter and region bind to the action. Result commits SHA256 of locatedReferenceIdentity plus LF. Location is excluded from that existing identity and remains unauthenticated; a replacement locator cannot replace content identity. Missing bytes remain needs/bytes/<blob>; corrupt bytes refuse integrity, never fork. Object-history authentication is separate.

Consumer obligations:

- Receiver selects native scope/context and expected statement; packets cannot choose trust keys or verifiers.
- Native consumer guarantees durable commit, recovery and no duplicate effect; parser repetition does not prove those properties.

Caller supplies byte and per-collection item budgets; no ambient clock, I/O, default verifier or universal region list.

Two receiver fixtures use public native act verification and the existing authority-at-epoch relation with disposable signature adapters. No production storage transaction is claimed.

Contract meaning only. Admission, production consumer verification and public delivery require their separate acta.
