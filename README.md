<p align="center"><img src="docs/img/logo.svg" alt="Topos" width="88"></p>

# Topos

Topos defines how information is read: its wire, forms, authority and views. Bound admits and folds the records; Obligatory supplies the operations on cells. A selected topos gives those operations a concrete interpretation.

<p align="center"><img src="docs/img/world.svg" alt="Wire, forms, classes and views compose a topos standing; the host resolves its artifacts" width="720"></p>

## Read a record

```js
import { parse, canonical } from '@lapxo/topos/wire';

const record = parse('bound-lock/1 scope=temperature role=writes form=interval measure=celsius value=18..24 by=target at=policy:example');
if (record.kind === 'fact') {
  console.log(canonical(record.value.fields));
}
```

<p align="center"><img src="docs/img/line.svg" alt="One configuration record, shown field by field" width="640"></p>

Parsing reads the syntax. Admission also requires the selected wire grammar, authority and context; parsing alone does not authorize a record.

## Select by standing

A topos is the fold of its lock over its declared regions. Its identity is the digest of canonical live claims, excluding the signing envelope and host projection. A changed form, class, view or offer changes that identity. Re-signing does not. Artifact digests in `restsOn` close the required bytes.

`uses/<name>` selects that standing by digest. An npm package supplies SDK code; its version or archive digest is a different identity. A capsule is an executable offer of a topos. Forms, classes and views need no capsule to be selected.

## Publish a lock

`publicationOf(live)` projects already admitted, folded configuration claims into a public lock. It removes delivery envelopes, preserves signed public-key records and orders canonical lines by wire bytes. It neither folds history nor grants authority. Withdrawals and typed object history require their own semantic projection and are refused.

`publicLock(lines)` recognizes that representation for a reader. Signed delivery history returns to the ordinary authority reader; unsigned delivery envelopes are refused. Recognition does not verify public keys or grant authority.

## Build a domain

- Use `@lapxo/topos/forms` to define how domain values are decoded and compared.
- Use `@lapxo/topos/contract` for readers and renderers over declared regions.
- Use `@lapxo/topos/standing` to encode an already admitted, folded standing.
- Use `@lapxo/topos/cells-view` and `@lapxo/topos/cell-inputs` for cells rendering and semantic receipt inputs.
- Keep transport, storage and execution in the host.

A sensor domain can choose units and spans; a repository domain can expose checks; a view can present the same cells differently. Bound does not infer those choices from directory names.

## Compare evidence

A domain supplies opaque values and the evidence it admits. The SDK compares references and values; it does not choose an attester, start a verifier, count origins or decide a release. Missing or unadmitted evidence cannot become equality. Those decisions belong to the selected contract and its caller.

## Interpret values

<p align="center"><img src="docs/img/fold.svg" alt="An example of intersecting intervals, interpreted by the selected form" width="640"></p>

Forms define how values are decoded and compared. Cell operations and their four states remain in Obligatory; a view only presents the result.

## Keep the boundary

<p align="center"><img src="docs/img/refuses.svg" alt="A missing declared artifact is refused without substituting local bytes" width="720"></p>

Selecting a standing does not authorize a record or execute an artifact. The host verifies the named bytes; the selected contract determines what can be interpreted.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) and the [wire reference](docs/wire.md).
