# Declared provider and host contracts

Provider-owned standing inputs are selected by offer-relative claims and handed separately from place lines. They never grant the place authority. Missing required inputs refuse; disagreements retain their coordinates.

A capsule may declare its region contract in standing-regions@1. Selection reads that descriptor without fetching or executing its artifact. A requested artifact must reproduce the declared regions, including their reads and roles.

Reader limits and input presence are declared policies. A completed empty answer differs from a missing required input; bounded-process@1 refuses incomplete, oversized or timed-out execution.

Content-request/1 asks a host mechanism for already pinned immutable bytes. Sources name locations; digests name content. The host verifies bytes before storage. Mutable observation and authenticated release lineage require separate contracts.


## Whole-region walk

The whole-region@1 contract exchanges authenticated history at three resolutions: @0 lists region identities; @1 gives signed region digests and exact counts; @8 carries only complete requested regions that differ. A digest is not a proof for an arbitrary slice or an unseen suffix. Verified regional prefixes retain all earlier records and reject insertion at already verified epochs.

Two clocks remain separate. Original signed records keep their origin-ledger epoch. They are evidence, never receiver authority or key coverage. The receiver creates its own signed import receipt through its declared signer, at its next local epoch. Evidence and receipt must become visible in one transaction; an interrupted pre-publication import admits neither. Exact replay retains one receipt and adds no lines or origins.

Withdrawals resolve against exact IDs within the same origin's authenticated history. They never target local lines merely sharing a scope or ID. Keys, snapshots and delivery copies do not establish independent object origins. The selected form/provider contract still decides attribution and independence; no extra meet or state is computed here.

walkSelection reads the four admitted wire/walk declarations. walkSnapshot reuses native receipt projection for exchange history, separate from semantic cell-region receipt identity. walkAt selects the requested resolution without transport. walkHeaders returns unsigned statements for the declared signer. readWalkHeaders checks authenticated framing. readForeignWalk verifies whole-region commitments and earlier prefixes against the selected origin contract, returning verified foreign evidence and an unsigned native-format import-receipt proposal. It never signs, lands, grants coverage or advances a clock.

The receiver authenticates the declared sender context, historical wire and provider before calling the SDK. The host verifies and signs the local proposal, then atomically publishes the foreign evidence, sender metadata and signed receiver receipt. Delivered payload bytes, protocol bytes and newly committed bytes are distinct measurements.


## Origin and authority inputs

walkOrigin reads exactly one declared walk/origin. It is the ledger attribution, not a key, snapshot or automatically independent object origin. walkAuthority reads explicit public keys, classes, coverage and resolution from a pinned origin context; journal identities without public keys are not signers. Sender signatures authenticate history under that snapshot and grant no receiver authority. Payload key declarations cannot replace the pinned context. Context rotation requires a separately declared lineage; the native profile refuses a changed context for an already received origin.

walkSnapshot may qualify regions with the declared origin. walkInventory joins verified region commitments, retaining distinct origin namespaces and refusing duplicate coordinates. A receiver announces already verified prefixes at @0; the sender still exports only its own history at @8. An acknowledged prefix transfers no semantic payload. Inventory commitments neither re-sign foreign history nor create independent origins.

## Wire declaration disagreement

Conflicting live declarations of one wire alphabet refuse by its wire coordinate. A writer may supersede its own earlier alphabet at a newer epoch under the existing admission contract; independently retained writers must agree. An ambiguous fields or required list never becomes an empty alphabet.
