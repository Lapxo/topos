# Distinguish attributed source, authenticated covering proof and written refusal

A named admitted key and unsigned origin line do not authenticate an author. A covering proof binds the canonical origin statement; its own evidence digest is excluded to avoid self-reference. Authenticated attribution is not authorization. A refusal names producer, code, request digest, scope, context and next action; decoding does not authenticate its producer.

Reuse: `existing canonical wire`, `receiver-selected coverage verifier`.

Consumer obligations:

- Actual key admission and signature/coverage under the selected context.
- Real key-material-request refusal is emitted by its consumer; Topos represents it and never owns the private signer.

Caller supplies byte and per-collection item budgets; no ambient clock, I/O, default verifier or universal region list.

Two fixtures verify origin covering signatures with receiver-pinned public keys; sample refusal codes are attributed fixture declarations, not an admission or hijack verdict.

Contract meaning only. Admission, production consumer verification and public delivery require their separate acta.
