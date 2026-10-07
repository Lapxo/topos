# Declared provider and host contracts

Provider-owned standing inputs are selected by offer-relative claims and handed separately from place lines. They never grant the place authority. Missing required inputs refuse; disagreements retain their coordinates.

A capsule may declare its region contract in standing-regions@1. Selection reads that descriptor without fetching or executing its artifact. A requested artifact must reproduce the declared regions, including their reads and roles.

Reader limits and input presence are declared policies. A completed empty answer differs from a missing required input; bounded-process@1 refuses incomplete, oversized or timed-out execution.

Content-request/1 asks a host mechanism for already pinned immutable bytes. Sources name locations; digests name content. The host verifies bytes before storage. Mutable observation and authenticated release lineage require separate contracts.


## Whole-region walk

The whole-region@1 contract reads its resolution labels from wire/walk/resolutions and their projections from wire/walk/projections. Labels are nonnegative discrete coordinates, not hardcoded levels or a measure of information. This profile offers inventory (region identities), summary (digests and exact counts for differences), and history (complete requested regions that differ). The reference declaration maps @0 to inventory, @1 to summary and @8 to history; a place can declare @4, @6 or further labels without changing code. Every label needs exactly one declared projection; an undeclared label refuses rather than inventing detail. A digest is not a proof for an arbitrary slice or an unseen suffix. Verified regional prefixes retain all earlier records and reject insertion at already verified epochs.

Two clocks remain separate. Original signed records keep their origin-ledger epoch. They are evidence, never receiver authority or key coverage. The receiver creates its own signed import receipt through its declared signer, at its next local epoch. Evidence and receipt must become visible in one transaction; an interrupted pre-publication import admits neither. Exact replay retains one receipt and adds no lines or origins.

Withdrawals resolve against exact IDs within the same origin's authenticated history. They never target local lines merely sharing a scope or ID. Keys, snapshots and delivery copies do not establish independent object origins. The selected form/provider contract still decides attribution and independence; no extra meet or state is computed here.

walkSelection reads the admitted wire/walk declarations. walkSnapshot reuses native receipt projection for exchange history, separate from semantic cell-region receipt identity. walkAt selects the requested resolution without transport. walkHeaders returns unsigned statements for the declared signer. readWalkHeaders checks authenticated framing. readForeignWalk verifies whole-region commitments and earlier prefixes against the selected origin contract, returning verified foreign evidence and an unsigned native-format import-receipt proposal. It never signs, lands, grants coverage or advances a clock.

The receiver authenticates the declared sender context, historical wire and provider before calling the SDK. The host verifies and signs the local proposal, then atomically publishes the foreign evidence, sender metadata and signed receiver receipt. Delivered payload bytes, protocol bytes and newly committed bytes are distinct measurements.


## Origin and authority inputs

walkOrigin reads exactly one declared walk/origin. It is the ledger attribution, not a key, snapshot or automatically independent object origin. walkAuthority reads explicit public keys, classes, coverage and resolution from a pinned origin context; journal identities without public keys are not signers. Sender signatures authenticate history under that snapshot and grant no receiver authority. Payload key declarations cannot replace the pinned context. Context rotation requires a separately declared lineage; the native profile refuses a changed context for an already received origin.

walkSnapshot may qualify regions with the declared origin. walkInventory joins verified region commitments, retaining distinct origin namespaces, merging identical region commitments idempotently, and refusing different digests or counts for one coordinate. A receiver announces already verified prefixes at @0; the sender still exports only its own history at @8. An acknowledged prefix transfers no semantic payload. Inventory commitments neither re-sign foreign history nor create independent origins.

## Wire declaration disagreement

Conflicting live declarations of one wire alphabet refuse by its wire coordinate. A writer may supersede its own earlier alphabet at a newer epoch under the existing admission contract; independently retained writers must agree. An ambiguous fields or required list never becomes an empty alphabet.


## Profile boundaries

A resolution label does not count regions or create information. Inventory, summary and whole-history are the encodings implemented by this named exchange profile, not a universal alphabet of Topos offers. Without a partition declaration, historical whole-region@1 keeps its native receipt-family partition. The optional scope-coordinates@1 profile below refines exchange coordinates. It does not change semantic cell folds or their region contract.

Ledger origins are opaque identifiers. When projected into region coordinates their bytes are percent-encoded as one segment; slashes, spaces and percent signs cannot create a namespace collision. Context lineage, signatures, complete region commitments and origin-local exact withdrawals remain required. Numeric epochs, counts and resolution labels currently refuse values outside the implementation's exact integer range; no lossy conversion is accepted.


## Declared coordinate refinement

wire/walk/partition=scope-coordinates@1 selects complete signed history at each exact source scope as the exchange unit. Source scope segments and the opaque origin are escaped independently in receipt coordinates. New source coordinates create new units without a new alphabet or a fixed region count. This is a coordinate projection of authenticated history, not a filesystem traversal, a cell restsOn relation, or a new information measure.

wire/walk/refinements maps every declared resolution label to a positive coordinate depth or all. A depth groups complete coordinate commitments by that declared source prefix. all exposes the exact source coordinates. Groups fold canonical child-coordinate digest and count claims using the native receipt projection; they are not separately stored trees or artifacts. The root remains the same complete-coordinate inventory root at every detail. Raising a numeric label has no implicit effect: the declared cut determines the answer.

Inventory and summary can show declared groups or exact coordinates. Summary acknowledges verified regional inventory, including foreign evidence under its own origin namespace. History requires all and carries complete differing coordinate histories; a grouped digest cannot admit a record fragment. An equal verified group covers its children; an equal verified set of exact children covers their group. Differing groups can be refined before requesting history, and verified unchanged children are reused. No provider, transport or key material is invoked to compute a cut. Metadata is signed only through the existing declared signer.

The sender context pins the history field and partition contract. The receiver decodes under that context, not its own partition or fields. Earlier verified complete-coordinate prefixes remain required, with original epochs and exact-origin withdrawals unchanged. A previously unasked coordinate is not claimed to have a verified earlier prefix. Changing an admitted origin context still requires separately declared lineage; refinement labels do not migrate history or rewrite its signatures.

The shipped reference sample declares cuts at 0, 1, 4, 6 and 8, with 4 showing an intermediate coordinate depth and 6 carrying complete histories. These are example labels and depths, not limits. Other Topos partition interpretations require their own declared contract; scope-coordinates@1 does not claim to implement them.
