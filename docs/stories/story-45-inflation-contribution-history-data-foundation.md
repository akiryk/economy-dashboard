# User Story 45 — Establish a reliable historical inflation-contribution data source

## User story

As a dashboard maintainer, I want a documented and reproducible method for obtaining historical CPI category contributions to headline inflation, so that future compact-card trends can use correct percentage-point contribution data rather than category inflation rates or manually improvised approximations.

## Background

The redesigned **What is driving inflation?** card uses current category contributions to headline year-over-year CPI inflation.

The repository currently contains only two contribution observations:

- June 2025
- June 2026

A proposed follow-up card enhancement would show approximately five years of monthly contribution histories for:

- Food
- Energy
- Shelter
- Commodities less food and energy
- Other services

`Other services` is derived as:

```text
Services less energy services − Shelter
```

The desired values are not the category inflation rates. They are each category’s percentage-point **effect on the All Items CPI**, as published in Table 7 of the monthly BLS CPI news release.

Ordinary CPI component series are therefore not substitutes. A category can have a high inflation rate but a smaller contribution because contribution depends on both price movement and the category’s weight in the CPI basket.

The required history is not currently available through the repository’s ordinary FRED refresh path as a simple time series. Historical values appear to be distributed across archived monthly CPI releases.

October 2025 must remain an explicit missing observation because no October 2025 CPI release was published during the federal-government appropriations lapse. Do not interpolate, estimate, or carry another month’s value into that period.

Archived releases may represent release-vintage values rather than a single consistently revised historical vintage. Any adopted source strategy must document that distinction clearly.

## Objective

Determine and, where feasible, implement the smallest reliable data foundation that can provide monthly historical CPI contribution effects for the compact inflation-driver card.

This story must answer:

1. Can the required historical contribution values be retrieved reproducibly from an official BLS source?
2. Which source format and retrieval method are most maintainable?
3. Can the required category definitions be produced consistently across the target history?
4. How should source gaps, revisions, validation, and refreshes be handled?
5. Is a five-year production dataset ready for a later visualization story?

This is a data-foundation story, not a chart story.

## Required output

The story must end in one of two explicit outcomes.

### Outcome A — Feasible and implemented

Use this outcome only if an official-source method can be implemented and validated reliably within the story’s scope.

Deliver:

- a reproducible retrieval or ingestion path;
- a committed, validated contribution-history dataset;
- documented source provenance;
- documented release-vintage semantics;
- explicit missing-period handling;
- tests and refresh instructions;
- a clear statement that the dataset is ready for a later mini-trend visualization story.

### Outcome B — Not yet feasible

Use this outcome if official-source retrieval cannot be made sufficiently reliable or maintainable within the story’s scope.

Deliver:

- a written feasibility report;
- attempted source paths and exact failure modes;
- any validated proof-of-concept extraction;
- a recommended next data-engineering approach;
- a clear statement that the mini-trend visualization remains blocked;
- no fabricated or approximate production dataset.

Do not force Outcome A merely to complete the story.

## Scope

### 1. Inventory the required fields

Define the required monthly output schema before implementing retrieval.

Each observation should support at least:

```ts
interface InflationContributionObservation {
  period: string
  headlineCpiEffectTotal: number | null
  food: number | null
  energy: number | null
  shelter: number | null
  commoditiesLessFoodAndEnergy: number | null
  servicesLessEnergyServices: number | null
  otherServices: number | null
  sourceReleaseDate: string | null
  sourceUrl: string
  vintage: 'release'
}
```

The exact repository type may differ, but preserve these concepts:

- measured month;
- published headline reference value where available;
- source-published category effects;
- derived `otherServices`;
- release identity and source URL;
- explicit release-vintage metadata;
- nulls for genuinely unavailable observations.

Do not store rounded display strings as source data.

### 2. Investigate official BLS source paths

Evaluate official BLS sources in this order unless repository evidence justifies another sequence:

1. machine-readable BLS data or downloadable supplemental files;
2. stable archived CPI news-release HTML tables;
3. archived release PDFs or spreadsheets;
4. a curated static snapshot sourced from official archived releases.

For each candidate source, record:

- official URL pattern or endpoint;
- available history;
- whether Table 7 contribution effects are present;
- accessibility from repository tooling;
- HTML or file-structure stability;
- rate limits or blocking behavior;
- revision/vintage semantics;
- extraction complexity;
- update workflow;
- validation possibilities.

Do not use category inflation rates as a proxy for contribution effects.

Do not use third-party reconstructed values as the authoritative production source unless explicitly approved in a later story.

### 3. Build a bounded proof of concept

Before collecting the full target history, test the preferred method on a small, deliberately varied sample of releases.

The sample should include, where available:

- a recent release;
- an older release near the beginning of the intended five-year window;
- a month with a negative category contribution;
- a month before and after any relevant table-format change;
- September 2025;
- November 2025, confirming that October 2025 remains absent rather than inferred.

The proof of concept must extract the source-published values for:

- Food;
- Energy;
- Shelter;
- Commodities less food and energy;
- Services less energy services.

Then derive:

```text
Other services =
Services less energy services − Shelter
```

Retain unrounded arithmetic internally.

### 4. Validate extracted values

For every proof-of-concept release:

- verify category labels against the source table;
- verify signs;
- verify decimal placement;
- verify that percentage-point effects were extracted rather than 12-month category inflation rates;
- calculate `Other services` from unrounded available values;
- reconcile the complete available category contribution set to the published All Items effect or headline CPI reference within an explicit tolerance;
- record any residual caused by source rounding;
- fail loudly when labels, columns, or expected table structure do not match.

Where practical, independently review the extracted sample against the source document.

Do not silently continue after a parse ambiguity.

### 5. Decide the historical data strategy

After the proof of concept, choose one of the following strategies and document the rationale.

#### Strategy 1 — Automated archived-release extraction

Choose this only if archived releases can be retrieved and parsed reproducibly.

Requirements:

- deterministic archive discovery or explicit release manifest;
- robust parsing with structural validation;
- safe refresh behavior;
- no browser-side provider requests;
- preservation of the existing valid dataset when retrieval or validation fails;
- clear diagnostics for changed BLS markup or missing tables.

#### Strategy 2 — Curated official-source snapshot

Choose this only if automated retrieval is blocked but a manually curated dataset is judged worthwhile and maintainable.

Requirements:

- one source URL per release;
- a documented two-pass transcription or verification procedure;
- machine validation of schema, periods, signs, and reconciliation;
- explicit release-vintage labeling;
- instructions for adding the next monthly release;
- no undocumented copying from screenshots or secondary sources.

A curated snapshot must not be presented as automatically refreshed.

#### Strategy 3 — Derivation from component indexes and weights

Do not fully implement this strategy inside this story unless it proves unexpectedly small and well documented.

If recommended, the feasibility report must identify:

- required component indexes;
- required historical relative-importance weights;
- weight-change treatment;
- BLS contribution methodology;
- expected differences from published Table 7 effects;
- validation releases;
- likely implementation scope.

This strategy should normally become a separate data-engineering story.

#### Strategy 4 — Defer

Choose this if no reliable method is currently justified.

Document exactly what blocks implementation and what new information or capability would unblock it.

### 6. Production dataset, if feasible

If the selected strategy supports Outcome A, create the monthly history required for a later visualization story.

Target period:

- approximately five years ending at the latest available contribution month;
- use exact calendar months;
- include October 2025 as an explicit null gap or absent observation according to the repository’s established data-model convention;
- do not interpolate;
- do not forward-fill;
- do not substitute nearby releases.

The dataset must contain all source fields needed to reproduce the compact contribution categories and derivations.

Do not reduce the series to annual observations.

### 7. Refresh behavior, if feasible

Integrate with the repository’s data-refresh architecture only when the chosen strategy supports a reliable refresh.

Requirements:

- provider retrieval and parsing remain outside React;
- committed validated data remains the browser source;
- failed refreshes preserve the previous valid dataset;
- source and derivation metadata are documented;
- the refresh can add a new monthly release without rewriting historical values unintentionally;
- duplicate periods fail validation;
- a changed release URL or table structure produces a useful error;
- October 2025 remains missing.

If using a curated snapshot, provide a validation command and documented manual update procedure rather than pretending the source is automated.

### 8. Data semantics and revisions

Document the adopted vintage policy explicitly.

If archived Table 7 releases are used:

- state that each observation reflects the value published in that month’s archived release;
- do not describe the dataset as a consistently revised historical series;
- do not combine later revised historical values with release-vintage observations without an explicit rule;
- retain release dates and source URLs;
- explain the BLS archive warning in the data documentation.

If a revised-vintage source is discovered, document how and when revisions occur.

### 9. No visualization work

Do not implement:

- mini-trends;
- sparklines;
- new compact-card layout;
- chart options;
- new card prose based on the histories.

A later story will consume this dataset only after this story establishes that it is production-ready.

## Acceptance criteria

### Feasibility and source evaluation

1. The required contribution fields and category derivations are defined explicitly.
2. Official BLS source options are evaluated and documented.
3. Ordinary category inflation rates are explicitly rejected as substitutes.
4. A bounded proof of concept covers multiple release conditions, including the 2025 gap boundary.
5. Proof-of-concept values are verified as percentage-point effects from Table 7 or an equivalent official BLS source.
6. `Other services` is derived from unrounded `Services less energy services − Shelter`.
7. Validation detects sign, column, label, period, and reconciliation errors.
8. Release-vintage semantics are documented.

### Outcome A requirements

If the story concludes that the data product is feasible:

9. A reproducible or explicitly curated official-source ingestion method is committed.
10. The target five-year monthly dataset is committed.
11. October 2025 is preserved as missing.
12. No values are interpolated, forward-filled, or approximated from category inflation rates.
13. Every observation has source provenance.
14. The complete available contribution set reconciles within an explicit tolerance, or any documented exception fails or is qualified.
15. Refresh or update instructions are complete and tested.
16. The dataset is declared ready for a later visualization story.

### Outcome B requirements

If the story concludes that the data product is not yet feasible:

9. No unvalidated production dataset is committed.
10. The exact blockers and attempted approaches are documented.
11. Any proof-of-concept data is clearly separated from production data.
12. A concrete next data-engineering recommendation is provided.
13. The historical mini-trend story is explicitly marked blocked.

### Repository integrity

17. No provider requests are added to React or browser runtime code.
18. Existing valid datasets are preserved on refresh failure.
19. No unrelated card or architecture work is included.
20. Current inflation-driver card behavior remains unchanged by this story.

## Testing and verification

### Source and parser tests

Where an automated or semi-automated extraction exists, add fixtures covering:

- expected Table 7 structure;
- changed or missing headings;
- shifted columns;
- negative effects;
- em dash or unavailable values;
- malformed numeric cells;
- duplicate periods;
- absent release;
- missing October 2025;
- source-page retrieval failure;
- parse failure preserving the prior valid dataset.

Use compact committed fixtures rather than live provider calls in ordinary unit tests.

### Derivation tests

Cover:

- `Other services` calculation;
- null propagation;
- sign preservation;
- unrounded arithmetic;
- reconciliation tolerance boundaries;
- failure outside tolerance;
- period sorting;
- duplicate-period rejection;
- release provenance requirements.

### Manual verification

For the proof-of-concept sample:

- inspect each official source release;
- compare extracted values cell by cell;
- confirm the correct Table 7 columns;
- confirm no category inflation-rate column was substituted;
- confirm October 2025 remains missing;
- record verification evidence in the story completion notes or current data documentation.

### Required repository checks

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Run any story-specific refresh or validation command introduced by this story.

Stop temporary servers and remove downloaded or generated verification artifacts that are not intended repository files.

## Documentation

Update the relevant current documentation, including `docs/data-refresh.md` or its repository equivalent, with:

- official source and archive location;
- exact Table 7 fields used;
- category mapping;
- `Other services` derivation;
- historical coverage;
- missing-period policy;
- release-vintage policy;
- reconciliation tolerance;
- refresh or curated-update procedure;
- known limitations;
- feasibility outcome;
- readiness or blocked status for the later mini-trend story.

Update the product or architecture documentation only if this story changes their current factual inventory.

Do not rewrite archived historical stories.

## Completion report

In addition to the standard `AGENTS.md` completion requirements, report:

- Outcome A or Outcome B;
- source paths investigated;
- selected strategy;
- proof-of-concept months reviewed;
- historical coverage obtained, if any;
- missing periods;
- reconciliation results;
- vintage policy;
- whether the mini-trend visualization is now unblocked;
- any recommended follow-up story.

## Out of scope

- Inflation-driver mini-trend UI.
- Category inflation-rate charts presented as contribution charts.
- Forecasting category contributions.
- Causal analysis of inflation drivers.
- Third-party data as an undisclosed authoritative source.
- Full implementation of a complex index-and-weight reconstruction method unless separately approved.
- Changes to unrelated datasets or cards.
