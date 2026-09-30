# Reference

27 laws, each a line of the lock with the sample that shows it and the module that decides it.

| law | what it says |
|---|---|
| a-no-is-run | a no is fixed only by a block that runs it |
| a-reader-receives-regions-never-a-place | a reader observes region bytes at a digest and a resolution and emits claims; it never lists, descends, opens a second file or follows an import — an import is a claim the fold resolves |
| a-view-is-a-list-of-regions | a text view is a signed line view/<name> whose value is an ordered alphabet of regions; render(fold, regions) writes them as markdown in that order; anyone signs a new view in their own lock. bound holds one render and no format; topos holds no template, only the alphabet of regions a fold can render. |
| assertion-is-a-sample | what a test compares against is read from a sample; zero and one are not values, they are identity and absence |
| block-names-its-law | each block names the law or offer it fixes |
| capsule-admitted-by-vectors | a place admits a capsule when its vectors pass; a capsule without vectors is not admitted |
| capsule-invents-no-default | a value a capsule invents is a default; a field is a line of the place or absent |
| capsule-reads-lines-and-receipts-only | capsule-reads-lines-and-receipts-only: a page is a function of the declared regions' lines and receipts; no regex over source, no path literal, no host literal, no law name, no placeholder token, no word table |
| capsule-reads-what-it-declares | a capsule sees only the parsed lines of the regions it declares, handed to it by the contract; never a lock, never a file |
| capsule-shape | a capsule is capsule.bound (uses topos by digest; the regions it reads; the leaves or claims it writes; its forms; its effects: none or network:<host>), one code file with one export (observe or render), vectors, and a README rendered by topos-doc — nothing else has a place to exist |
| customisation-is-the-places-lines | customisation-is-the-place's-lines: theme · prose (with lang) · notation/* · docs/regions order · sources/* · examples/dir · samples/dir — a person customises by signing lines, never by forking the capsule |
| exports-resolve | every export resolves in the packed tarball |
| forms-carry-generators | a form carries points(seed, n): the sample every reading over forms uses; no generator lives in test/ |
| forms-fail-when-broken | a form mutated three ways (meet as join, order reversed, one law removed) makes violationsIn fire; a form no mutation exposes is one the checker cannot see |
| forms-obey-lattice-axioms | every offered form is a lattice: meet and join obey the axioms on the points its own generator draws |
| generators-only | a module beside the tests only builds inputs |
| language-facts-come-from-the-language-capsule | language-facts-come-from-the-language-capsule: anything read off code (a cell in an example, an import, a signature, a doc head, a test block) is a receipt emitted by topos-<lang>, never parsed here |
| needs-that-name-nothing | a need names a leaf that is there |
| no-derives | no test derives what a vector states |
| one-contract | exactly one process protocol in the world: topos-s SPEC, Request to Response with refusal codes, no disk and no network inside a reader or a capsule; readers and render capsules speak it and nothing else — counted, it is 1 |
| one-harness | one module loads vectors and samples |
| one-serve | serve lives in topos/src/contract once; a second serve anywhere is bodies-written-twice — counted, it is 1 |
| place-is-closed | every line of the place resolves inside it |
| tests-import-by-name | a test imports the package by its name |
| tests-import-offers | a test imports only what an offer carries |
| views-without-descriptor | every view declares what it reads and what it writes (ViewDescriptor); a view with no descriptor is SHORT |
| wire-fields-are-claims | every field of the wire, its alphabet and its algorithm is a signed line in topos' own lock with an epoch: sig names an algorithm by digest that can be superseded; at carries only wire-level classes (origin, place, receipt, witness, policy) never an instrument's; needs is a region (coordinate prefix, resolution), never a path. A field the lock does not name is refused; a field whose epoch closed is read as history. The wire that reads a 2026 claim in 2076 does so by folding the lock of 2026, not by remembering it. |
