# User Story 46 — Enable collection of historical CPI contribution effects

## User story

As a dashboard maintainer, I want a reliable way to collect and validate historical CPI category contribution effects from official BLS releases, so that the repository can later build a five-year production dataset without approximating contributions from category inflation rates.

## Dependency and current status

Story 45 concluded with **Outcome B — not yet feasible**.

Story 45 established that:

- the repository does not currently contain the monthly history required for five-year contribution trends;
- ordinary CPI category series are not valid substitutes because they report category inflation rates rather than percentage-point effects on headline CPI;
- the required values appear in Table 7 of monthly BLS CPI releases;
- automated retrieval from BLS was not yet reliable in the existing environment;
- October 2025 must remain missing because no CPI release was published for that month;
- archived releases may represent release-vintage observations rather than a consistently revised historical series.

Story 46 exists to resolve that blocker.

Do not attempt to build the full five-year production dataset until this story establishes an approved collection method.

## Objective

Implement and validate the smallest sustainable method for obtaining historical monthly CPI contribution effects from official BLS releases.

The story must produce one of two explicit outcomes:

### Outcome A — Retrieval or curated collection enabled

Use this outcome only if the story establishes a sufficiently reliable method for collecting additional months.

Deliver:

- an approved official-source collection strategy;
- working tooling or a documented curated-ingestion workflow;
- a validated proof-of-concept covering representative releases;
- source provenance requirements;
- structural and arithmetic validation;
- explicit release-vintage semantics;
- clear instructions for collecting the full five-year history in Story 47;
- a statement that the production dataset story is unblocked.

### Outcome B — Still blocked

Use this outcome if no reliable method can be established within scope.

Deliver:

- exact methods attempted;
- exact failure modes;
- any partial tooling or validated fixtures;
- the recommended next technical or manual approach;
- no production history;
- a clear statement that the full dataset remains blocked.

Do not force Outcome A.

## Scope

### 1. Confirm the required source values

The required monthly values are the Table 7 percentage-point effects on All Items CPI for:

- Food;
- Energy;
- Shelter;
- Commodities less food and energy;
- Services less energy services.

Derive:

```text
Other services =
Services less energy services − Shelter
```

Do not substitute:

- category 12-month inflation rates;
- FRED component inflation series;
- current basket weights applied retroactively;
- third-party reconstructed values;
- manually estimated contributions.

### 2. Investigate retrieval-enablement paths

Test official BLS source access using the smallest practical set of approaches.

Evaluate, as applicable:

1. archived HTML release pages;
2. archived PDF releases;
3. downloadable spreadsheets or supplemental files;
4. BLS APIs or machine-readable feeds that may expose Table 7 effects;
5. an explicit release manifest combined with local ingestion;
6. user-supplied or manually downloaded official release files processed by repository tooling.

For each path, record:

- whether it exposes the required effect values;
- whether it is accessible from the repository environment;
- whether URLs are predictable or discoverable;
- whether the structure is stable enough to parse;
- whether the process can be repeated monthly;
- whether it preserves official provenance;
- whether it requires a manual download step;
- known failure modes.

Do not broaden the search to unofficial providers unless explicitly approved.

### 3. Prefer local parsing over fragile live scraping

If direct automated retrieval remains blocked but official release files can be downloaded manually, implement a local ingestion command that accepts an official BLS HTML, PDF-derived text file, CSV, spreadsheet, or other approved release artifact.

The preferred fallback is:

> manual acquisition of the official source file, followed by deterministic repository parsing and validation.

This is acceptable if:

- the manual step is explicit;
- the parser is repeatable;
- the extracted fields are structurally validated;
- provenance is retained;
- the workflow is documented;
- no values are manually retyped into production JSON without validation.

Do not pretend this workflow is fully automated.

### 4. Define the ingestion contract

Implement a staging schema for one monthly release.

A suitable shape may resemble:

```ts
interface InflationContributionReleaseInput {
  period: string
  sourceReleaseDate: string
  sourceUrl: string
  sourceFile?: string
  food: number
  energy: number
  shelter: number
  commoditiesLessFoodAndEnergy: number
  servicesLessEnergyServices: number
}
```

Derived output must include:

```ts
otherServices =
  servicesLessEnergyServices - shelter
```

The exact types should follow repository conventions.

Preserve:

- measured period;
- release date;
- official source URL;
- source artifact identity where applicable;
- release-vintage designation;
- unrounded numeric values;
- reconciliation status.

Do not store display-formatted strings.

### 5. Build a representative proof of concept

Validate the approved collection method against a bounded sample.

The sample should include, where official releases are available:

- a recent release;
- an older release near the beginning of the intended five-year period;
- a month containing at least one negative contribution;
- a release before any known table-format change;
- a release after that format change;
- September 2025;
- November 2025.

The proof of concept must confirm that October 2025 is absent and is not inferred.

The sample need not contain the entire five-year history.

### 6. Validate table identity and column selection

The parser or ingestion validator must confirm that values come from the correct Table 7 effect columns.

Validate:

- table title or equivalent structural marker;
- measured period;
- required category labels;
- correct “effect on All Items” column;
- sign;
- decimal placement;
- numeric parse success;
- uniqueness of each category;
- absence of duplicate periods.

Fail loudly when:

- a category label is missing;
- the table layout is ambiguous;
- the category inflation-rate column is selected instead of the effect column;
- a numeric cell cannot be interpreted;
- the source period conflicts with supplied metadata.

Do not accept plausible-looking values without structural confirmation.

### 7. Reconcile extracted contributions

For every proof-of-concept release:

- derive `Other services` from unrounded source values;
- sum the complete available contribution set;
- compare it with the published headline CPI effect or approved headline reference;
- use an explicit tolerance;
- retain the residual;
- distinguish ordinary source-rounding residuals from invalid mismatches;
- fail validation outside tolerance.

Do not alter source values to force reconciliation.

Do not allocate the residual to **Everything else**.

### 8. Preserve release-vintage semantics

Document that values extracted from archived releases represent the values published in those releases unless Story 46 discovers an official consistently revised historical source.

Requirements:

- retain source release date and URL;
- mark observations as release-vintage;
- do not silently mix revised and release-vintage values;
- explain any archive warning or revision limitation;
- state whether the future five-year dataset will be a collection of release vintages.

### 9. Implement the monthly collection workflow

If Outcome A is reached, provide a documented command or procedure for collecting one new month.

The workflow must include:

1. obtain or identify the official BLS release;
2. run the parser or ingestion command;
3. validate category identity and effect columns;
4. derive `Other services`;
5. reconcile to headline CPI;
6. review provenance;
7. emit a normalized staging record or fixture;
8. avoid overwriting existing valid data on failure.

The workflow may be:

- fully automated retrieval;
- semi-automated retrieval;
- manual source download plus automated local parsing;
- curated entry plus strict machine validation, only if parsing official source files remains impossible.

Prefer the least manual method that is reliable.

### 10. Curated-entry fallback

Use direct curated numeric entry only as the last acceptable fallback.

If chosen, require:

- official source URL;
- source release date;
- explicit measured period;
- exact category fields;
- two-pass human verification;
- machine reconciliation;
- sign and decimal validation;
- duplicate-period rejection;
- documentation that the values were manually transcribed;
- a process for preserving source screenshots or local artifacts only when repository policy permits.

A raw hand-edited JSON file without a validation workflow does not satisfy this story.

### 11. No full production history

Do not collect all five years of monthly releases in this story unless the approved method makes that work trivial and the story remains small and reviewable.

The default expectation is:

- establish the method;
- validate representative releases;
- document the workflow;
- leave full historical collection to Story 47.

### 12. No UI work

Do not implement:

- mini-trends;
- sparklines;
- chart models;
- card-layout changes;
- historical summary prose;
- changes to current compact-card visuals.

The current application should remain visually unchanged.

## Acceptance criteria

### Required in all outcomes

1. The required Table 7 contribution fields are identified explicitly.
2. Category inflation rates are rejected as substitutes.
3. Official BLS collection paths are investigated and documented.
4. At least one official-release extraction or ingestion proof of concept is attempted.
5. Validation distinguishes effect columns from category inflation-rate columns.
6. `Other services` is derived from unrounded source values.
7. Reconciliation uses an explicit tolerance.
8. October 2025 is confirmed as missing and is never inferred.
9. Release-vintage semantics are documented.
10. No UI changes are made.
11. No approximate production dataset is introduced.

### Outcome A criteria

12. A repeatable collection method is implemented or fully documented.
13. Representative releases are successfully ingested and validated.
14. Every proof-of-concept observation has official provenance.
15. Parser or ingestion failures preserve prior valid outputs.
16. A monthly update workflow is documented and tested.
17. Story 47 can collect the complete five-year production history without reopening the source-method decision.
18. The completion report states that the production dataset is unblocked.

### Outcome B criteria

12. Exact blockers and failed approaches are documented.
13. Partial tooling or fixtures are clearly nonproduction.
14. No unvalidated historical dataset is committed.
15. A concrete next approach is recommended.
16. Story 47 remains explicitly blocked.

## Testing and verification

### Parser or ingestion fixtures

Add compact fixtures for applicable cases:

- expected Table 7 structure;
- nearby inflation-rate and effect columns;
- negative contribution;
- missing category;
- duplicate category;
- malformed number;
- unexpected heading;
- changed column order;
- unavailable marker;
- source-period mismatch;
- duplicate month;
- retrieval failure;
- validation failure preserving prior output.

Ordinary tests must not depend on live BLS access.

### Derivation and validation tests

Cover:

- `Other services` arithmetic;
- unrounded calculation;
- sign preservation;
- reconciliation within tolerance;
- exact tolerance boundary;
- failure outside tolerance;
- provenance requirements;
- release-vintage metadata;
- October 2025 missing-state protection.

### Manual verification

For each proof-of-concept release:

- inspect the official source;
- verify the exact effect column;
- compare each extracted value cell by cell;
- confirm the measured month;
- confirm source URL and release date;
- record the reconciliation residual.

Include September and November 2025 in the review if those releases are accessible.

### Required repository checks

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Run every new story-specific parser, ingestion, or validation command.

Stop temporary servers and remove downloaded verification artifacts not intentionally retained as fixtures or documentation.

## Documentation

Update the authoritative data documentation with:

- source paths investigated;
- selected collection method;
- manual and automated steps;
- accepted input formats;
- category mapping;
- `Other services` derivation;
- reconciliation tolerance;
- provenance requirements;
- release-vintage policy;
- October 2025 treatment;
- proof-of-concept months;
- known limitations;
- Outcome A or Outcome B;
- whether Story 47 is unblocked.

Do not claim that a five-year dataset exists unless it is actually created.

Do not rewrite archived stories.

## Completion report

In addition to the standard `AGENTS.md` requirements, report:

- Outcome A or Outcome B;
- retrieval paths attempted;
- selected collection method;
- proof-of-concept months;
- source formats parsed;
- reconciliation results;
- manual steps still required;
- release-vintage policy;
- October 2025 handling;
- whether Story 47 is unblocked;
- recommended next story.

## Out of scope

- Full five-year production collection by default.
- Inflation-driver mini-trend UI.
- Category inflation-rate approximations.
- Derivation from CPI indexes and weights unless separately approved.
- Unofficial production sources.
- Changes to unrelated cards or datasets.
