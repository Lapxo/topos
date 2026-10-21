# Physical lines on declared regions

`topos-physical-lines/1` consumes an explicit named-file snapshot, each file's bytes and digest, and region selectors. The host supplies bytes and a SHA-256 primitive. This pure function reads no files, clock, network or authority store. Its normative contract is `physical-lines.json`.

`readPhysicalLines(input, hash)` reuses the wire selector matcher and Obligations 0.4.7 `finiteRegionMeasure`. It does not reproduce the rational valuation, overlap or union algebra. An atom is a named file in the supplied snapshot, with its physical-line count. No set of region names is built in.

The text domain is valid UTF-8, with LF separators and CRLF accepted as one separator. Isolated CR refuses. An empty file is zero lines; otherwise LF bytes are counted and an unfinished final line adds one. Blank lines and comments count. A UTF-8 BOM is content; other Unicode separators are not LF.

Every region retains its scope, selectors, per-selector selection status and concrete member names. A matched union does not hide another unmatched selector: the consumer still sees its named `unmeasured` selection and must not use the union count to pay that selector’s demand. A selector with no members gives `unmeasured` and `selector-no-match`, with no numerical value. An existing empty file can give measured zero. Numeric valuation excludes unmatched regions; its aggregate does not discharge their obligations. Overlaps and unassigned files remain visible. A full-snapshot authority/completeness claim must come from the consumer; an input digest alone does not supply it.

Policies declare a byte budget and work-row budget. Preparation is outside the measured reader. Byte count is checked before digesting or decoding; selection work is declared separately from the Obligations input-row work. Exhaustion returns a named unmeasured result. These deterministic input units are not runtime promises or permission to widen a consumer ceiling.

The positive samples use JSON `text` as UTF-8 transport; a native adapter converts it to `Uint8Array`, verifies the declared byte digests and calls the same API. Negative samples alter text without changing its digest. Two unrelated sample namespaces exercise the same contract. Unit vectors additionally cover disjoint and nested supports, malformed selectors, duplicate files, invalid UTF-8, CR handling, final lines and budgets.

Bound owns ceiling comparison, witness acceptance, widening and `BLOCK`. Source tests are implementation evidence; the native quartet remains a separate region until its declared reader and binding produce receipts.
