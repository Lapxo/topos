# topos-source-exhaustion/1

Represent source exhaustion, attributed events and known/unknown recovery without implementing budgets or scheduling.

- Binds the exact source card, source, cost unit, observation evidence, explicit exhaustedAt and knownSince in a declared frame.
- Events have distinct IDs and evidence digests; duplication refuses rather than charging twice.
- Declared recovery names its time and evidence; unknown recovery has neither invented time nor evidence.
- Recovery cannot precede exhaustion; consumer-selected source, clock and time unit must match.
- Cost unit and time unit are distinct. No Date.now, network, mutable counters or retry scheduler.
- Source-card decoding names the declaration; source-card form conformance, observation authentication, actual budget exhaustion and acceptance remain consumer obligations.

## Consumer obligations

- Signature or provenance of events and exhaustion
- Source-card catalog/form conformance
- Ceiling comparison, eligibility to retry and credit resets

The native vector captures positive and negative declarations at catalog/items and orchard/harvest. Parsing or calculation establishes no authority, admission, stored effect or release approval.
