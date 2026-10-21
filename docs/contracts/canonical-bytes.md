# Canonical bytes and legacy reference

UTF-8 byte-ordered fields; no Unicode normalization. Values retain numeric text. Unknown lexical fields survive; profile permissions are separate. Explicit line versions; unsupported versions abstain. Escapes are backslash, quote and newline. Canonical lines exclude terminal LF; collection framing is separate. Explicit absence is rejected for signing.

The published #bound:1 profile is unchanged: class, algorithm, digest, blob and source are required, in that order, with exact encodeURIComponent round trip. No optional location is added to this profile.
