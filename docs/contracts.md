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

## Typed cell, claim and mark records

The object profile is selected by admitted `wire/object/*` claims in a historical wire snapshot. The epoch of `wire/object/types` is its activation E; a typed record must have epoch >= E. An older record keeps the older grammar. Merely adding object words to `wire/fields` does not admit a typed profile.

`fromLine` selects grammar before validating required fields: a record without `type` remains configuration, retaining its required `at`, `role`, `form`, `measure` and `value`; a typed record selects its exact required/allowed row. Configuration cannot carry object-only fields. An incomplete typed record receives no configuration defaults. The parse result distinguishes configuration from cell/claim/mark. `sign=+1|-1` is an object act, `sig` its signature envelope, and a host sign operation produces that envelope.

The common object envelope is `type`, `scope`, `id`, `epoch`, `by`, `sig`. Object records reject `at`: epoch orders acts, and `widens` names a local join witness. The following is the shipped reference profile. The admitted row alphabets, not this table or a host decoder, are the source of required/allowed field permission.

| Row | Fields in addition to the common envelope | Meaning |
| --- | --- | --- |
| cell | form, measure, params, restsOn, topos | Define a cell and its selected form/context. |
| claim/positive | sign, origin, value | Observe an encoded span, sign=+1. |
| claim/negative | sign, takes | Withdraw an exact claim ID, sign=-1. |
| mark/travelling | sign, pole, reach, value | Ceiling sign: sign=+1, pole=ceiling, reach=travels. |
| mark/local | sign, pole, reach, value, widens | Local join: sign=+1, pole=ceiling, reach=local; another mark, retaining the travelling sign. |
| mark/floor-travelling | sign, pole, reach, value | Travelling require: sign=+1, pole=floor, reach=travels; no widens. |
| mark/negative | sign, takes | Withdraw an exact mark ID, sign=-1; no pole/reach/widens. |

Each row has both `wire/object/required/<row>` and `wire/object/allowed/<row>`. Unknown keys, missing required keys, floor/local, floor+widens, and travelling widening refuse without coercion. A configuration demand is unrelated to a floor mark. `by` authenticates a signing key; it is not an independent observation origin.

For a cell, `restsOn=none` represents no parents; otherwise it is a canonical byte-ordered alphabet of coordinates. Several parents are permitted. Only declared cell-coordinate edges form object rest; a directory prefix, a configuration artifact digest, and a host source location do not. Context validation rejects reachable cycles before algebraic parts are requested.

The cell's `topos` names folded standing, and its `params` identifies declared parameter bytes. A selected provider decodes values and supplies origin/witness authorization from admitted evidence. A host does not infer interval endpoints, map a key to an origin, or accept widens as its own witness. Missing pin, artifact, decoder, origin or witness refuses by cause. Cell definitions and pins are immutable in this profile; migration is not inferred.

`objectHistory` preserves typed history separately from configuration; `validateObjectContext` checks IDs, cell ownership, exact takes, witness order and declared rest under the selected context. Exact redelivery is idempotent; one ID with different canonical content refuses. Signature-envelope differences never bypass verification.

After admission, the instrument projects the acts into Obligations. Sign and require travel along declared rest; a witnessed join is local. Descendants inherit travelling marks without local widening. Live exact-ID withdrawals remain confined to their authenticated history. Keys, snapshots, signing devices and repeated receipts do not create independent origins. Compatible meets are not forks. Object states and their precedence come from Obligations; configuration folds do not compute object encounters.

The package's `samples/walk/interval.json`, `interval.no.json`, `alphabet.json` and `alphabet.no.json` carry exact historical wire declarations and signed positive/negative exchange records. They are examples of declared profiles, not a production activation epoch or a promise that their keys authorize another place. Host-native object output remains a separate product vector.

## Demands, evidence and declared dependencies

`@lapxo/topos/contract` exports `programsOf`, `programInputs` and `renderPrograms`. These project explicit program coordinates, their `needs`, their `restsOn` predecessors and admitted evidence. They do not admit lines, execute work or compute cell states.

`programsOf({programs, evidence, minimum, elapsed?, ceiling?})` takes programs with `scope`, `needs` and `restsOn`, plus an admitted evidence map. Evidence labels are `met`, `unmet`, `unread` and `refused`. The caller verifies evidence before passing it. A file at a requirement's coordinate does not establish its meaning or conformance.

A missing proof remains unread. An empty requirement is vacuous and never completes a program. An absent minimum refuses. Unknown coordinates, duplicate declarations and dependency cycles refuse by coordinate. An unmet predecessor blocks successors. `next` retains all eligible unresolved programs; presentation order cannot authorize a successor. Only explicitly optional programs carry over after a measured deadline; no version arithmetic or stage numbers are inferred. An absent elapsed reading keeps the deadline unread.

The native `admitted-demands@1` view profile reads its selectors from the selected provider's standing projection, separately from place lines. `wire/programs/{selection,minimum,evidence,elapsed,ceiling}` each names a coordinate or handed evidence region; `wire/programs/profile` names the profile. The selected demand lines provide their own `needs` and `restsOn`. Evidence statuses come from the declared region's receipts. Elapsed time also comes from that region, as an exact finite interval; a configured elapsed value is not an observation. The ceiling is a declared interval, and both measurements must use the same unit. `restsOn` here names program predecessors, never cell rest or artifact bytes.

A place chooses its view names and the offered regions. The instrument's historical `programs` summary need not be replaced: a declared `view/programs` may select this provider's demand projection. The provider performs no filesystem, network, signing or admission work. Its output names demands, prerequisites, missing or unread evidence and eligible next coordinates. None of these labels introduces another Obligatory state.

`samples/programs/yes.json` supplies two unrelated plans. `samples/programs/no.json` supplies ambiguous or cyclic inputs. `samples/programs/cli.vector.json` captures native programs/card requests in fresh isolated places, including unread evidence and named cycle refusals. These captures are evidence for that candidate reader and those provider bytes; they are not receipts for another place's work.

## Publication coverage

`@lapxo/topos/contract` also exports `publicationCoverage(rows, artifacts, proofs, digest)`. Each selected public coordinate declares members with the roles `contract`, `yes`, `vector` and `no`, each by digest. The artifact map supplies the corresponding bytes; the supplied digest implementation verifies them. A changed or corrupt member refuses by coordinate.

Proofs are conformance readings already admitted by the caller. Each proof records its exact quartet of input identities and its status. Stale input identities refuse. Four available members without an admitted proof remain unread; a refused or unmet proof cannot close the coordinate. Empty surface selection is vacuous and refuses. The result reports every unresolved coordinate and a missing count. This projection cannot create a receipt, run a vector or authenticate the observer. Those operations belong to the selected measurer and host admission boundary.

Supported operations and outstanding capability demands must be inventoried separately. A demand does not become an exported implementation because its name appears in a lock. Removing public support requires its explicit compatibility decision; missing documentation cannot be hidden by renaming or excluding an implemented surface.
