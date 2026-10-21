# bound-lock/1-compatibility

Reuse existing lexical and epoch-sensitive wire expectations; no wire or algebra change.

- Golden lexical cases, UTF-8 distinction and effective-epoch field cases use the existing parser, canonicalizer and wireAt/fromLine implementation.
- No new field, grammar or old-profile extension is introduced by the new contract profiles.
- An altered expected canonical byte string refuses rather than accepting a new baseline.
- Retirement/publication mechanics are retained evidence, not a newly invented inverse or syntax.

## External obligations

- A producer not represented by these fixtures must provide its own exact compatibility vector
