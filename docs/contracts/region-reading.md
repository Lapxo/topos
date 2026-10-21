# Region reading of a walk

Candidate profile: topos-region-reading/1. This structural form reuses Topos0.2.2 walkInventory, walkAt, walkHeaders, walkProjection, lexical canonicalization, scope matching and count interpretation. It changes no existing wire or protocol. The concrete producer is the existing pure inventory walk on a synthetic three-region fixture; no consumer application is implemented.

The exact handed UTF-8 walk-header document is bound by SHA-256. Its lines are canonical, unique, byte-sorted and LF-terminated. Exactly one root and unambiguous scope/measure coordinates are required; each region row refers to that root. The frame is declared canonical-walk-headers@1 with an explicit inventory resolution profile. No projection is inferred from a numeric resolution label.

Selectors use the existing scope matcher, plus the explicit measure filter all/count/digest. Every selector must match at least one line after that filter; an empty selection refuses and never becomes zero. Overlapping selections union exact lines once. The result names every matched line and its SHA-256 of line+LF, and binds the complete selection digest. SHA-256 callback correctness is a caller premise.

Unit canonical-lines counts selected canonical records. Unit declared-walk-count sums exact nonnegative count intervals and requires an explicit count unit; mixed digest/count selections refuse. It reports counts stated in the handed inventory, not independently verified physical contents. A nonempty selected count record with value0..0 legitimately yields zero. Ambiguous coordinates, unknown units, malformed frames and missing coverage refuse.

An evidence declaration includes keyClass=attest, producer, provenance and finite selected-scope coverage. Each selected scope must fall inside that declared coverage. The class label does not authenticate the producer, verify a CI run, authorize transport or establish unrestricted coverage. Authentication and execution remain not established; statistical confidence is not applicable. A wider selector reading is not a grant of authority.

Golden vectors independently identify matched lines/counts and exact output bytes for the actual existing producer output. Two places are used for candidate checks. Native reader captures, admission, integrated public exports and real downstream consumer/CI verification remain pending. The three original statistical cards and empirical unmeasured state remain open.
