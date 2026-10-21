# Contextual reading witness

`topos-reading-witness/1` represents a reading, its context and references to evidence. It is a candidate public form; parsing does not authenticate, authorize, execute or admit a reading.

All fields are nonempty strings without whitespace/control characters. Digests use lowercase `sha256:` plus 64 hexadecimal digits. The class is `attest`. Required digests identify the reading, contract, model, parameters, inputs, selection, scale, resolution, reader, implementation, context, result and evidence. `unit` names the measurement unit; `run` names the producer execution. The digests identify exact referenced bytes; the host must supply and verify those bytes and their bindings. The contract, parameter, scale and resolution records remain distinct: writing their names does not establish a composition law or infer independence.

Two explicit authentication profiles are represented:

- `key-covered`: a named `key`, `coverage` digest and `evidence` digest. The consumer verifies the covering signature, admitted key and coverage under the actual selected protocol.
- `ci-run-unkeyed`: repository, source commit identity, workflow digest, producer run and positive decimal attempt, plus the evidence digest. The consumer verifies those bindings and result bytes through its declared CI trust path. Neither a copied run URL nor a class label is proof. This profile does not invent a signature by a place key.

`encodeReadingWitness` and `decodeReadingWitness` reuse canonical wire field encoding. They reject missing, extra, malformed or noncanonical fields. The canonical encoded witness is the complete identity preimage; the host hashes it using the declared algorithm. Property insertion order does not change these bytes. A changed input, context, result or proof reference changes the witness bytes.

`readingWitnessStatementBytes` gives the canonical `topos-reading-statement/1` preimage containing every witness field except `evidence`. A covering proof must bind this statement according to its declared evidence protocol. Excluding the proof digest avoids a circular signature/hash. The complete witness includes that digest and therefore commits to the exact proof reference. Topos does not sign or verify this statement.

`inspectReadingWitness` returns the canonical witness and statement bytes, `status=declared`, `authentication=not verified`, `authorization=not established`, and the outstanding checks: digest bindings, model/unit/scale/resolution, provenance and consuming policy. It never accepts a caller-supplied `verified` flag. A valid CI witness may still be rejected by the consuming operation's policy. Reuse preserves the original producer run; a later verifier cannot relabel it as newly produced evidence.

The samples are synthetic form vectors in two unrelated contexts; their digests deliberately identify no delivered proof. They pay schema/canonicality tests only. Native consumer verification of actual byte/provenance bindings, admission, receipts and public delivery remain separate obligations. No owner or private key is needed for this form test.
