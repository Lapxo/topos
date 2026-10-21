# Reference with optional location

Candidate profile: #topos-reference:1. This is separate from #bound:1, whose required source and historical bytes remain unchanged.

Identity fields are class=standing, algorithm=sha256, digest (semantic standing) and blob (exact canonical document bytes). Optional location and location-class must appear together. location-class is viewer or holder. Addresses are canonical absolute HTTP(S) URLs without credentials; holder addresses have no fragment; viewer fragments are preserved. Field order is class, algorithm, digest, blob, location, location-class; values use encodeURIComponent. Duplicate, unknown or malformed fields and unsupported profile versions refuse by name.

The content-identity projection excludes both location fields. Without handed bytes, the answer is needs/bytes, including an unavailable address or a viewer that is not a raw-byte endpoint. There is no network invocation or availability assertion. With bytes, the declared byte budget, blob integrity, canonical semantic-standing@1 wrapper and standing identity are checked. An integrity mismatch refuses; a syntactically valid locator does not repair it. SHA-256 is supplied through an explicit digest callback.

Inspection does not authenticate a signer, publisher, holder or origin, grant permission, certify independence or select a transport. Those operations remain outside this profile.
