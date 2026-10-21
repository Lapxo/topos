# Module inventory

Candidate profile: topos-inventory/1. This is a separate data profile, not a change to bound-lock/1. It reuses the existing lexical canonicalizer and UTF-8 byte order, without Unicode normalization.

Each reached-unit record declares source, version, holder, unit-kind=module, unit and reached-from. The current concrete reach producer selects an explicit exports path from exact package.json bytes: the manifest digest and canonical encoded selector identify reached-from; source/version must match the manifest and the selected value must equal the module path. Unselected/unreached modules emit no line. This proves the selected export edge, not execution, actual use, an import graph or symbol-level reachability.

With handed module bytes, SHA-256 computes a point digest. Without module bytes, a named open record retains the unit and holder with needs=digest; absence is not an empty file. Merely encoding or decoding a row is syntax inspection, not provenance or availability certification. The digest callback must implement the declared SHA-256.

Canonical bytes order fields and lines; only identical lines deduplicate. Distinct holders, distinct reached-from edges and conflicting handed digests remain distinct records. The sample has 18 public export paths, 15 selected runtime edges and 14 distinct module files.

Diff is exact line-set comparison with an explicit maximum and omitted count. It neither admits nor withdraws acts. There is no transport, signature creation, quorum, permission decision or history fold. Bound retains the fold; public API index integration remains a joint0.2.3 task.
