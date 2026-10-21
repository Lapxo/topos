# Group, member and decision forms with declared k-of-n and prior-authority binding

Group names a set of regions and a snapshot. Member references a group by digest, named key, validity horizon and evidence. Decision references prior group, separate membership snapshot, exact proposal, context, threshold, horizon and proof references. Duplicate proof keys and impossible declared thresholds refuse structurally; proofs are not counted as verified votes.

Reuse: `normalizeRegistryQuorum`, `normalizeRegistryHorizon`, `existing named-threshold@1 syntax`.

identityBoundary: The group does not contain hashes of members that hash the group again. Membership is a separately named snapshot. A next-group proposal excludes a backlink to its authorizing decision. The decision names prior-group and next-proposal digests.

Consumer obligations:

- Native consumer resolves bytes, admitted member bindings, valid distinct signatures and eligibility at the declared deadline.
- Group change is authorized under the prior group, never the proposed group.
- Native consumer retains comparable admitted incompatible decisions as a named fork; opposed votes, corrupt bytes and distinct unverified declarations do not establish that fork.
- If native threshold admission is absent, keep governance/native-threshold-admission open.

Caller supplies byte and per-collection item budgets; no ambient clock, I/O, default verifier or universal region list.

Two places demonstrate declared predecessor binding and reject self-authorization. Actual quorum execution, admission and independence remain not established.

Contract meaning only. Admission, production consumer verification and public delivery require their separate acta.
