# Source card

Candidate profile: topos-source-card/1. This standalone shape uses the existing lexical canonicalizer and selected Topos forms; it changes neither bound-lock/1 nor #bound:1.

A card declares source, publisher, catalog identity, form, canonical JSON parameters, resolution, authority reference, cost, cost-unit, cost-limit, needs and optional shares. API, sensor, CSV, model and person use the same interpretation. Authority is a declaration, not authentication or a permission grant. The canonical UTF-8 line is the signable content; key selection, signing, verification and transport remain protocol operations.

The selected provider supplies the catalog identity and actual form decoders. A digest alone cannot authenticate their binding. This fixture pins published Topos0.2.2 interval and budget modules. Unknown forms and missing authority refuse by name. Resolution is parsed through that selected form and must be canonical and nonempty. Cost reuses budgetForm over [0,cost-limit], with explicit unit; it is a resource bound, not a statistical measure.

Within identical attribution, catalog, form parameters, units, needs, shares and opaque extensions, refinement is the product order of the selected resolution lattice and the existing budget lattice. Different attribution is incomparable; there is no cross-source aggregation or authority precedence. Order is supplied by Obligations0.4.6 via these existing forms, not reimplemented here.

Absent shares yields unknown-shared-cause and independence not established. Present shares is only a declaration, including the word none; neither case proves independence or supplies M0 weights. Needs uses none for an explicitly empty list. Declared lists deduplicate and sort; opaque string fields are preserved and affect content identity and refinement compatibility. Protocol envelope fields are refused. There is no Unicode normalization.

Vectors specify exact UTF-8 bytes, five source kinds, narrower and incompatible refinements, two public sample places and named negative cases. Native captures, selected reader binding, admission and central public exports remain pending. No algebraic law, successful external consumer or public availability is asserted from these fixtures.
