# @lapxo/topos

Wire, forms and interpretation contracts for information that can be named, checked and carried between consumers.

Topos 0.2.4 uses Obligations 0.4.7 for the consumed constraint algebra. It describes declarations, contexts and evidence; Bound applies the admitted policy, while a host supplies bytes, trust and effects. A digest identifies content. It does not establish truth, authority, independence or availability.

## Install

```sh
npm install @lapxo/topos@0.2.4
```

The package provides JavaScript, TypeScript declarations, public contracts and executable vectors. It requires Node 22.12 or later for the declared Node environment; pure modules have no implicit network or filesystem access.

## Read a declaration

```js
import { parse, canonical } from '@lapxo/topos/wire';

const line = 'bound-lock/1 form=interval measure=count role=writes scope=stock value=2..4';
const parsed = parse(line);
if (parsed.kind === 'fact') console.log(canonical(parsed.value.fields));
// bound-lock/1 form=interval measure=count role=writes scope=stock value=2..4
```

Parsing checks the wire representation. A selected form interprets the value; parsing alone does not authenticate or admit a claim. Semantic standing separates the identity of information from the artifacts a host may execute.

## Reference and inspect

```js
import { encodeLocatedReference, inspectLocatedReference } from '@lapxo/topos/contract';

const reference = {
  class: 'standing', algorithm: 'sha256',
  digest: 'a'.repeat(64), blob: `sha256:${'b'.repeat(64)}`,
  location: 'https://example.org/place.json', 'location-class': 'holder'
};
console.log(encodeLocatedReference(reference).startsWith('#topos-reference:1?')); // true
console.log(inspectLocatedReference(reference, undefined, {
  maxBytes: 4096,
  digestBytes: () => { throw new Error('No bytes were supplied'); }
}).kind); // needs
```

These digests are illustrative. With content present, the receiver supplies a real SHA-256 function and verifies both blob and standing identities. A holder address can locate bytes; a viewer address names a presentation. Neither authenticates the content. The historical `#bound:1` profile is unchanged.

The separate [inline projection profile](docs/contracts/reference-compatibility.md) carries a bounded preview and declared relations. The receiver chooses the UTF-8 limit; overflow refuses without truncation. A preview never substitutes for the complete object. Page code can read URL fragments: do not put secrets inline.

## Contracts through `/contract`

| Surface | What it provides |
| --- | --- |
| [Reading witness](docs/contracts/reading-witness.md) | Model, input, selection, implementation, context, result and declared key or CI provenance. Verification and policy acceptance remain separate. |
| [Physical lines](docs/contracts/physical-lines.md) | Counts supplied files under declared selectors, including blanks and comments; overlaps and unmatched selectors remain visible. This differs from [walk-header readings](docs/contracts/region-reading.md). |
| [Projection chains](docs/contracts/projection-chain.md) | Finite deterministic chains under one declared prior, using Obligations. Arbitrary unrelated projections are refused. |
| [Authority card](docs/contracts/authority-card.md) | Context-bound allow/ask/deny supplied by the consumer's effective judgment, with explicit time, stale and missing-request results. |
| [Origin and refusal](docs/contracts/origin-refusal.md) | Attribution, externally verified coverage and written refusals by request digest; attribution is not authorization. |
| [Action and link](docs/contracts/action-link.md) | Native action-receipt and reference bindings, without executing or duplicating the action. |
| [Group and decision](docs/contracts/group-decision.md) | Group, membership, prior-group proposal and k-of-n forms. Effective threshold admission belongs to the native consumer; signatures do not imply independent causes. |
| [Portable birth](docs/contracts/portable-birth.md) | Public unsigned declarations, explicit collision needs, no signer, root installation or automatic admission. |
| [Source exhaustion](docs/contracts/source-exhaustion.md) | Attributed exhaustion events, clock/unit context and known or unknown recovery; no budget judge or retry scheduler. |
| [Profile composition](docs/contracts/profile-composition.md) | Parents by digest, selected field semantics and category pins. Widening retains authorization needs; witness parsing does not grant authority. |
| [Refusal catalog](docs/contracts/refusal-catalog.md) | Machine-readable producer/code metadata, implementation identity, meaning, next and executed vectors for the declared new-form surface. External producer demands remain named and open. |

The existing [source cards](docs/contracts/source-card.md), [module inventory](docs/contracts/module-inventory.md), [M0 measures](docs/contracts/measure-m0.md), [registry](docs/contracts/registry-place.md) and [CI declarations](docs/contracts/ci-form.md) remain available. A module inventory does not prove symbol reachability; M0 does not certify statistical premises or replace the separate chain contract.

## Explicit boundaries

Topos supplies forms and pure interpretation. It does not run a second permission fold, commit storage transactions, choose trust keys from a carrier, authenticate CI by its URL, or treat an unavailable object as an integrity failure. Effective k-of-n admission, production evidence authentication and host effects must be paid by the consuming operation.

The catalog's five external door-code demands and two world-contract demands remain open until their producers supply comparable contracts and vectors. Unapproved stochastic models and independent physical-machine portability are outside these form contracts.

## Verification and further reading

For the source checkout, use `npm ci --ignore-scripts`, `npm run build` and `npm test`. Bound can check a place once its declared providers and evidence are available; valid receipts are reused rather than reinterpreted as fresh executions. The exact installed release and public provider delivery are checked separately from individual form vectors.

Start with [the overview](docs/what.md), [wire](docs/wire.md), [contracts](docs/contracts.md), [algebra alignment](docs/contracts/algebra-alignment.md) and [wire compatibility](docs/contracts/wire-compatibility.md). Public profile encodings remain versioned; there is no implicit migration from one profile to another.
