# @lapxo/topos

Wire, forms, authority and views for interpreting declared information.

Topos 0.2.3 supplies the interpretation contracts used by Bound and other consumers. Obligations 0.4.6 supplies its constraint algebra. A digest identifies bytes or a semantic projection; it does not establish truth, authority, independence or availability.

## Install

```sh
npm install @lapxo/topos@0.2.3
```

## Read a declaration

```js
import { parse, canonical } from '@lapxo/topos/wire';

const line = 'bound-lock/1 form=interval measure=count role=writes scope=stock value=2..4';
const parsed = parse(line);
if (parsed.kind === 'fact') console.log(canonical(parsed.value.fields));
```

Wire validates the declaration; a selected form interprets its value. Semantic standing identifies live claims separately from the artifacts a host may execute. See [the overview](docs/what.md), [wire](docs/wire.md) and [contracts](docs/contracts.md).

## Public profiles

All seven profiles are exported through `@lapxo/topos/contract`.

| Profile | What it declares or inspects |
| --- | --- |
| [Reference with location](docs/contracts/reference-location.md) | Content identity with an optional viewer or holder address, separate from the unchanged `#bound:1` profile. |
| [Module inventory](docs/contracts/module-inventory.md) | Module bytes and selected-export provenance; it does not discover transitive imports or symbol reachability. |
| [Source card](docs/contracts/source-card.md) | Named capabilities and provenance under a supplied catalog, without granting authority. |
| [M0 measures](docs/contracts/measure-m0.md) | Model premises, numerical declarations and explicit unmeasured results; values are not recomputed or statistically certified. |
| [Region readings](docs/contracts/region-reading.md) | Bounded selection of canonical walk headers with declared units and coverage. |
| [Governed registry](docs/contracts/registry-place.md) | Membership, proposals and quorum declarations under an explicit horizon and context. |
| [CI declarations](docs/contracts/ci-form.md) | Pinned workflow selections and reported evidence, without turning pipeline settings into authority. |

```js
import { encodeLocatedReference, locatedReferenceIdentity } from '@lapxo/topos/contract';

const reference = {
  class: 'standing', algorithm: 'sha256',
  digest: 'a'.repeat(64), blob: `sha256:${'b'.repeat(64)}`,
  location: 'https://example.org/place.json', 'location-class': 'holder'
};
console.log(encodeLocatedReference(reference));
console.log(locatedReferenceIdentity(reference));
```

The example uses illustrative digests. A host obtains bytes separately and supplies a SHA-256 function and byte budget to `inspectLocatedReference`. A location is an unauthenticated acquisition hint, not the signer or an authority source. URL fragments can be read by the page; do not put secrets in them. Missing bytes remain a named need.

## Boundaries and verification

Generic aggregation and projection-chain measures are not part of the M0 profile. CI witness names containing `/` require explicit migration; response framing does not validate the response protocol version. These [compatibility conditions](docs/contracts/cross-verification.md) must be handled by downstream consumers rather than inferred from matching examples.

Run `npm ci --ignore-scripts`, `npm run build` and `npm test` to check the source. A place with the declared public providers and valid receipts can also be checked with Bound. Installed examples, profiles and native vectors are delivered with the package; runtime observations remain separate from declarations. See [consumed algebra](docs/contracts/consumed-algebra.md), [canonical bytes](docs/contracts/canonical-bytes.md) and [integrated package](docs/contracts/integrated-package.md).
