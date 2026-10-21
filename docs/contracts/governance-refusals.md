# Refusal producer catalog

Generated from `vectors/governance-refusals.json`. Each entry retains its producer, class, meaning, next action and vector reference. The verification field names remaining per-code coverage rather than implying catalog admission. External producer demands remain open.

| Producer | Code | Meaning | Next action |
| --- | --- | --- | --- |
| Topos | `action/bytes` | Native records and receipt exceed the caller evidence byte budget. | `supply-valid-declared-context` |
| Topos | `action/consumer-context` | The receiver did not supply the native act-verification contract. | `supply-valid-declared-context` |
| Topos | `action/context` | The action statement differs from the receiver expected statement. | `supply-valid-declared-context` |
| Topos | `action/link-binding` | Emitter, region or content-reference identity differs from the committed action. | `supply-valid-declared-context` |
| Topos | `action/receipt-binding` | Declared act identity or receipt evidence digest differs from verified native evidence. | `supply-valid-declared-context` |
| Topos | `action/records` | Native evidence contains a non-string record. | `supply-valid-declared-context` |
| Topos | `action/statement-binding` | The native act does not contain exactly the required signed statement commitment. | `supply-valid-declared-context` |
| Topos | `authority-card/clock` | Card issue time is invalid or outside its declared horizon. | `supply-valid-declared-context` |
| Topos | `authority-card/consumer-context` | The consumer did not supply explicit time and judgment-verification context. | `supply-valid-declared-context` |
| Topos | `authority-card/decision` | Card decision is outside the declared allow/ask/deny alphabet. | `supply-valid-declared-context` |
| Topos | `authority-card/duplicate-action` | The card contains repeated entries for one exact request. | `supply-valid-declared-context` |
| Topos | `card-stale` | The card does not match the selected authority context or explicit clock | `refresh-card` |
| Topos | `governance/change-kind` | The predecessor/successor/decision tuple has incompatible record kinds. | `supply-valid-declared-context` |
| Topos | `governance/duplicate-proof-key` | More than one proof reference names the same signer key. | `supply-valid-declared-context` |
| Topos | `governance/kind` | The governance inscription is not a declared group, member or decision. | `supply-valid-declared-context` |
| Topos | `governance/prior-group-binding` | The successor and proposal do not bind the prior group under one place/name. | `supply-valid-declared-context` |
| Topos | `not-in-card` | The exact request digest is absent from this card | `request-card-entry` |
| Topos | `origin/consumer-context` | The receiver did not supply its coverage-verification port. | `supply-valid-declared-context` |
| Topos | `origin/context` | Attributed key or context differs from the receiver-selected context. | `supply-valid-declared-context` |
| Topos | `record/budget` | Caller byte and collection budgets are missing or invalid. | `supply-valid-declared-context` |
| Topos | `record/bytes` | Encoded record exceeds the caller byte budget. | `supply-valid-declared-context` |
| Topos | `record/canonical` | The supplied bytes differ from the selected canonical encoding. | `supply-valid-declared-context` |
| Topos | `record/coordinate` | Expected a logical coordinate, without absolute paths or traversal segments. | `supply-valid-declared-context` |
| Topos | `record/digest` | Expected a lowercase SHA-256 identifier with 64 hexadecimal digits. | `supply-valid-declared-context` |
| Topos | `record/duplicate` | A named collection member occurs more than once. | `supply-valid-declared-context` |
| Topos | `record/fields` | A required field is missing or an undeclared field was supplied. | `supply-valid-declared-context` |
| Topos | `record/items` | Expected an array within the caller collection budget. | `supply-valid-declared-context` |
| Topos | `record/json` | A structured record field is not valid JSON. | `supply-valid-declared-context` |
| Topos | `record/line` | The underlying canonical wire record cannot be parsed. | `supply-valid-declared-context` |
| Topos | `record/name` | Expected a nonempty name without whitespace or control characters. | `supply-valid-declared-context` |
| Topos | `record/object` | Expected a record object, not null, a scalar or an array. | `supply-valid-declared-context` |
| Topos | `record/profile` | The record does not use the selected versioned profile prefix. | `supply-valid-declared-context` |

External Head codes are demands, not Topos emissions or authenticated decisions.
