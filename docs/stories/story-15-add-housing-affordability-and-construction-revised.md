# Story 15: Add Housing Affordability and Construction

## Status

Complete.

## User story

As a dashboard reader, I want to understand whether a median-income household can afford a typical home and whether the economy is adding new housing supply, so that I can distinguish the financial accessibility of housing from the pace of residential construction.

## Product questions

This story adds two separate cards to a new **Housing** section because affordability and construction answer materially different questions.

### Affordability

**Can a median-income household afford a typical home?**

### Construction

**How much new housing is being started?**

Do not combine these measures into one chart or imply that construction immediately determines affordability. New supply can affect housing conditions over time, but affordability also depends on home prices, mortgage rates, incomes, taxes, insurance, and other ownership costs.

## Source decision

### Housing affordability

Use the Federal Reserve Bank of Atlanta’s **Home Ownership Affordability Monitor (HOAM)** national measure from the official downloadable workbook.

HOAM is preferred because it estimates the ability of a median-income household to absorb the annual costs of owning a median-priced home, including principal and interest, property taxes, homeowners insurance, and other ownership costs. The official national series provides monthly history beginning in January 2005, which is sufficient for the dashboard’s historical views.

Do not use FRED `FIXHAI` as the primary historical affordability series. Although it is a recognizable affordability index, FRED exposes only a short recent window. That conflicts with the dashboard’s requirement to show full useful historical context.

The committed dataset should contain only the national HOAM output observations and the provenance required by the dashboard. Do not copy or redistribute the workbook’s proprietary input datasets, underlying vendor records, metro data, or county data. Attribute the measure to the Federal Reserve Bank of Atlanta and link to the official HOAM page and methodology.

Proceed with the official download unless:

- the download becomes technically unavailable;
- its structure changes so that the national series cannot be identified reliably;
- an explicit source notice prohibits the intended use of the published national output;
- a new credential or manual browser interaction becomes necessary; or
- the retrieved measure materially differs from the story’s stated economic meaning.

Do not pause merely because HOAM incorporates third-party inputs or because general website terms reserve rights. Those facts should be documented as provenance and methodology context, not treated as an automatic implementation blocker.

### Housing construction

Use the Census Bureau and Department of Housing and Urban Development housing-starts series available through FRED:

- **FRED series:** `HOUST`
- **Provider title:** New Privately-Owned Housing Units Started: Total Units
- **Underlying publishers:** U.S. Census Bureau and U.S. Department of Housing and Urban Development
- **Frequency:** Monthly
- **Units:** Thousands of units
- **Seasonal adjustment:** Seasonally adjusted annual rate
- **Transformation:** Provider-published level; no local economic transformation
- **History policy:** Full useful available history

A housing start occurs when excavation begins for the footings or foundation. For a multifamily building, all housing units in the building count as started when excavation begins.

Use total housing units rather than only single-family starts. The Phase 1 question is whether the country is adding housing supply broadly, including multifamily housing. Do not add separate single-family and multifamily cards in this story.

## Scope

Create a new **Housing** dashboard section containing exactly two cards:

1. a home-ownership affordability card based on the Atlanta Fed HOAM national measure;
2. a housing-construction card based on FRED `HOUST`.

This story must also:

- add the required refresh and validation paths;
- register the generated datasets in the local repository;
- add explicit presentation copy;
- document each source, transformation, and limitation;
- update Epic 02 to mark Story 14 complete and Story 15 complete only after verification, commit, and push.

Do not add:

- rents or rental affordability;
- home prices as a standalone card;
- mortgage rates as a standalone card;
- existing-home sales;
- new-home sales;
- permits, completions, or housing inventory;
- regional or metropolitan comparisons;
- homeowner or rental vacancy;
- homeownership rates;
- construction employment;
- financial-condition indicators assigned to Story 18.

## Product rationale

Affordability and construction are complementary but not interchangeable.

The affordability card should capture the combined effect of:

- home prices;
- mortgage financing costs;
- household income;
- property taxes;
- homeowners insurance;
- other modeled ownership costs included by HOAM.

The construction card should show the current pace at which privately owned housing units begin construction.

The dashboard must not imply:

- that an affordability measure describes every buyer or household;
- that the median household necessarily buys the median-priced home;
- that a national value describes local housing markets;
- that more starts immediately make homes affordable;
- that a decline in starts proves housing demand is weak;
- that a high annualized starts rate guarantees equivalent completed supply.

## Housing section

Add a new visible **Housing** section only when both cards have real, validated datasets and can render successfully under the existing independent-card architecture.

Recommended section description:

> Housing conditions reflect both what households can afford and how quickly new supply is entering construction. These measures can move differently because prices, financing costs, income, and building activity respond on different timelines.

Place the affordability card first and the construction card second. This ordering starts with the household-facing question and then adds supply context.

Do not render empty placeholders for future housing indicators.

## Affordability card

### Question and measure label

Recommended question:

> Can a median-income household afford a typical home?

Recommended concise measure label:

> Home-ownership affordability

The exact latest-value label must match the selected HOAM field.

Prefer a directly interpretable national measure such as:

- estimated annual home-ownership cost as a percent of median household income; or
- the official HOAM affordability index, if that is the stable downloadable national series.

Do not choose between these representations until the source schema and methodology have been inspected.

### Selection rule

If both an affordability index and a cost-to-income percentage are available from the same official source, prefer the measure that is easiest for a non-specialist to interpret without hiding its assumptions.

A cost-to-income percentage is preferable when it is directly supplied or can be reproduced exactly from documented source fields. An index may be used when it is the canonical official output and has materially better historical continuity.

Do not locally reverse, rebase, or rescale the measure merely to make “up” visually mean “better.” Preserve the official measure and explain its direction clearly.

### Presentation copy

The explanation must state:

- the measure represents a modeled median-income household purchasing a median-priced home;
- the estimate includes the ownership-cost components documented by the Atlanta Fed;
- the measure is national and can conceal large geographic differences;
- it does not describe current homeowners with older mortgages;
- it does not describe every first-time buyer, down payment, credit profile, tax situation, or insurance cost;
- it is an affordability model, not a count of households that can or cannot buy.

If the selected value is a cost share, explain that a higher percentage means modeled ownership costs consume more income.

If the selected value is an index, explain exactly what 100 means and whether higher values indicate greater or lesser affordability.

Do not label the latest value “affordable,” “unaffordable,” “healthy,” “crisis,” “good,” or “bad” unless that language follows directly from an explicit source-defined threshold and the card clearly identifies it as the source’s convention rather than the dashboard’s judgment.

### Latest-value callout

Show one latest national value and its observation period.

The display precision must suit the source measure:

- percentage: generally one decimal place;
- index: generally one decimal place unless source precision supports another established convention.

Do not add a second equally prominent number for home price, mortgage rate, or income. Those are inputs or explanatory factors, not separate indicators in this story.

### Chart behavior

Use the existing shared single-series chart path if it supports the selected units and frequency without misleading behavior.

The card must:

- display actual source observations without smoothing;
- preserve missing observations as gaps;
- support every existing range for which the source has sufficient history;
- make Maximum show the fullest permissible, comparable source history;
- use an axis policy appropriate to the selected level measure;
- avoid a zero reference line unless zero is substantively meaningful and visually useful;
- avoid red-versus-green treatment;
- provide an accessible factual summary;
- provide a semantic recent-observations table;
- isolate loading and failure behavior from every other card.

If HOAM’s official history does not support one or more existing range buttons, use the repository’s established behavior for unavailable ranges if one exists. Do not fabricate earlier observations, repeat the earliest value backward, or silently relabel a shorter period as 20 years.

### Suggested repository identity

Use a slug and filename that describe the displayed measure rather than the source product generally.

Examples:

```text
home-ownership-cost-share
home-ownership-cost-share.json
```

or:

```text
home-ownership-affordability-index
home-ownership-affordability-index.json
```

Choose the final identity only after selecting the exact source field.

## Housing-construction card

### Question and measure label

Use:

> How much new housing is being started?

Recommended concise measure label:

> Housing starts

The explanatory copy must state that the value is a seasonally adjusted annual rate expressed in thousands of housing units.

Explain “annual rate” carefully: the latest value is the annualized pace implied by that month’s activity, not the literal number of units started during that month and not a forecast of the final annual total.

### Latest-value callout

Show the latest monthly `HOUST` value using a human-readable annualized unit count.

For example, a source value of `1,392` thousand units may be displayed as:

```text
1.39 million
```

with a nearby label such as:

```text
seasonally adjusted annual rate
```

Preserve the full source value in the semantic table and tooltip under the project’s existing formatting conventions.

Do not describe the measure as growth unless a growth transformation is explicitly added. This story uses the provider-published level.

### Chart behavior

The construction card must:

- use the full useful monthly `HOUST` history;
- support the existing 5-year, 10-year, 20-year, and Maximum ranges;
- preserve missing values as gaps;
- render actual observations without smoothing or interpolation;
- use a level-axis policy that does not imply negative construction;
- avoid forcing zero if that would make historical movement unreadable, unless existing chart policy for nonnegative count levels requires it and remains useful;
- avoid recession labels, trend judgments, and target bands;
- include accessible summary text and a semantic recent-observations table;
- keep its failure isolated from the affordability card and all prior sections.

The factual summary should describe the highest, lowest, first, and latest values in the selected range without calling them strong, weak, sufficient, or insufficient.

### Suggested repository identity

```text
housing-starts
housing-starts.json
```

Follow existing naming conventions if repository inspection reveals a more precise established pattern.

## Data-refresh architecture

### Atlanta Fed affordability source

Add the smallest explicit source-specific refresh path required for the selected HOAM dataset.

Because this is the first planned non-FRED source in the repository, do not generalize the entire refresh architecture into a provider framework unless the current implementation genuinely requires a narrow provider distinction.

The implementation should:

- fetch from an official Atlanta Fed source outside the browser;
- avoid requiring live runtime access;
- parse the response as untrusted data;
- select the documented national observations only;
- preserve the source’s native observation frequency;
- validate dates, values, ordering, uniqueness, and sufficient history;
- normalize documented missing values to `null`;
- reject malformed, duplicate, future-dated, or unexplained observations;
- retain full available precision until presentation;
- construct a complete validated `EconomicSeries`;
- record Atlanta Fed provenance accurately rather than identifying FRED as the source;
- commit the validated local JSON dataset;
- replace the prior valid file atomically only after the new file validates;
- preserve the prior file if retrieval, parsing, validation, or replacement fails;
- report source, generated count, coverage, latest observation, and output path;
- avoid logging full provider payloads or any credentials.

If the Atlanta Fed source is a downloadable file rather than JSON, implement only the parser needed for the documented format. Do not add a generic CSV, Excel, or archive-processing subsystem unless the source format makes it unavoidable.

If the source requires authentication, manual browser interaction, browser automation, or scraping undocumented presentation markup, stop and report the constraint before implementation. General website terms that may change are not, by themselves, a reason to stop.

### FRED housing-starts source

Extend the existing reviewed FRED configuration for `HOUST`.

The refresh must:

- request `series_id=HOUST`;
- request monthly frequency if the current client requires it explicitly;
- use full-history policy without an arbitrary `observation_start`;
- omit a FRED units transformation;
- retain the provider-published seasonally adjusted annual-rate level;
- validate and normalize the response under existing FRED rules;
- preserve FRED missing markers as `null`;
- reject invalid dates, duplicate dates, malformed values, and insufficient history;
- prevent observations after retrieval from entering the generated file;
- validate the complete `EconomicSeries` before replacement;
- replace the prior file atomically;
- preserve the prior valid file on failure;
- report provider identifier, count, coverage, latest value, and output path.

Do not derive year-over-year housing-start growth or population-adjusted starts in this story.

## Domain-model and chart implications

Inspect the current model before changing it.

The construction series introduces a nonnegative monthly level measured in thousands of units at a seasonally adjusted annual rate. Reuse the existing observation shape and repository boundary.

The affordability series may introduce:

- a monthly percentage level;
- a monthly index level; or
- another documented frequency.

Add only the unit-formatting or axis policy needed by the selected official measure.

Do not add speculative support for currencies, regional panels, distributions, mortgage calculators, stacked inputs, or arbitrary provider schemas.

Keep:

- source metadata in the domain dataset;
- human-facing explanation in the presentation registry;
- economic calculations out of JSX;
- chart adaptation separate from domain objects;
- explicit card composition in `DashboardPage`;
- independent asynchronous loading and failure isolation.

## Provenance requirements

Each card must expose:

- immediate source;
- underlying publisher where different;
- official series or dataset name;
- provider identifier or stable dataset field;
- source link;
- frequency;
- units;
- seasonal adjustment;
- transformation;
- coverage;
- retrieval date;
- any local selection, alignment, or derivation;
- important methodology limitations.

For HOAM, document the official methodology version or retrieval documentation used when available.

For `HOUST`, document that the units are thousands of housing units at a seasonally adjusted annual rate.

## Epic and documentation updates

Update Epic 02 based on the verified repository state:

- mark Story 14 complete;
- mark the broad household financial-stress measure complete;
- mark Story 15 complete only after implementation passes verification, is committed, and is pushed;
- mark housing affordability and housing construction complete at that time;
- retain later stories as planned.

Update relevant documentation to cover:

- the new Housing section;
- the selected HOAM measure and why FRED `FIXHAI` was rejected for historical use;
- the source-specific affordability refresh path;
- `HOUST` configuration and semantics;
- any new unit, frequency, chart, or formatter support;
- generated coverage and retrieval behavior;
- measured bundle impact;
- current visible-card and supporting-series counts.

Correct stale counts or status references encountered in directly relevant documentation. Do not conduct an unrelated documentation rewrite.

## Tests

Add deterministic tests covering at least the following.

### Affordability source and transformation

1. The source configuration identifies the official Atlanta Fed dataset and national measure.
2. The selected field matches the card’s question and label.
3. Valid source observations generate a validated `EconomicSeries` with correct source, units, frequency, transformation, and coverage.
4. Missing values remain `null`.
5. Invalid dates, duplicate periods, malformed values, future observations, and inadequate history fail safely.
6. Source ordering does not affect generated chronological ordering.
7. Failed retrieval, parsing, validation, or replacement preserves the prior valid file.
8. No browser-side request to the Atlanta Fed is introduced.
9. The copy explains the direction of the selected affordability measure correctly.
10. The card does not claim to represent every household or local housing market.

### Housing starts

11. The FRED configuration uses `HOUST`, monthly frequency, full history, and no FRED units transformation.
12. Valid observations generate a monthly level series in thousands of units at a seasonally adjusted annual rate.
13. FRED missing markers remain `null`.
14. Invalid or duplicate observations fail safely.
15. Refresh failure preserves the prior valid `housing-starts` dataset.
16. The local repository resolves and validates the new slug.
17. The latest-value formatter converts thousands to a readable unit count without changing the stored value.
18. The card and tooltip clearly identify the value as a seasonally adjusted annual rate.
19. The card does not call the provider level a growth rate.

### UI and integration

20. The Housing section renders after Households and before later sections.
21. The affordability card appears before housing starts.
22. Each card loads and fails independently.
23. Failure of one new card does not suppress the other new card or any existing section.
24. Existing time ranges anchor to the latest valid observation.
25. Maximum exposes each series’ full useful available history.
26. Accessible summaries and recent-observation tables use the selected source observations.
27. Range controls remain keyboard accessible and expose `aria-pressed`.
28. No empty future housing card or section is rendered.
29. Existing dashboard cards remain unchanged except for intentional shared support required by this story.

Use existing fixtures and test conventions. Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- the new Housing section appears in the intended page order;
- the section description explains why affordability and construction are separate;
- each card’s question matches what its chart actually measures;
- the affordability direction is unmistakable;
- the affordability explanation states its modeled and national limitations;
- housing starts are clearly labeled as an annualized monthly pace;
- latest values and periods format correctly;
- all supported range controls work;
- Maximum shows full useful available history for each source;
- unsupported ranges, if any, are handled honestly and accessibly;
- charts remain readable at desktop and narrow widths;
- no line smoothing or gap bridging appears;
- tooltips show the correct period, value, and unit;
- summaries and tables remain useful without canvas;
- keyboard focus and pressed states match existing cards;
- simulated failure of either dataset remains isolated;
- no mortgage-rate, home-price, sales, permit, completion, inventory, rental, or regional card has been added.

Perform an explicit conceptual review:

- A reader should understand that the affordability card models a median-income household purchasing a median-priced home under documented assumptions.
- A reader should understand that housing starts are units entering construction at an annualized pace.
- A reader should not infer that the two charts establish a direct causal relationship.

## Required verification

Run the complete repository verification required by `AGENTS.md`, including:

```text
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Also:

- run any source-specific deterministic refresh tests;
- verify the generated datasets and their coverage;
- inspect the production bundle output;
- complete the browser checks above;
- stop temporary servers and processes;
- inspect the final diff and working tree;
- confirm no credentials, downloaded temporary source files, debug logs, screenshots, or unrelated changes are included.

If the affordability source cannot be refreshed reliably, or an explicit source notice prohibits use of the published national output, do not mark the story complete and do not substitute another measure without discussing the product decision with the user.

## Completion and Git requirements

Before completion:

1. Confirm only Story 15 scope was implemented.
2. Confirm Story 14 and the stale Epic 02 statuses are accurately reflected.
3. Confirm both new cards’ questions match their measures.
4. Confirm all tests and required checks pass.
5. Confirm generated data and documentation are current.
6. Create one focused conventional-style commit.
7. Push to the configured GitHub remote without force.
8. Confirm the local branch is synchronized with its upstream.
9. Confirm the working tree is clean.

The completion report must include every item required by `AGENTS.md`, including:

- implementation summary;
- source and product decisions;
- deviations or source constraints;
- quality checks and browser verification;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status;
- known limitations.

End the completion report with:

```text
ALL DONE WITH USER STORY 15
```

## Acceptance criteria

Story 15 is complete when:

- a real Housing section exists;
- it contains separate affordability and construction cards;
- the affordability card uses the official, historically useful Atlanta Fed HOAM national output from the downloadable workbook;
- the implementation explicitly avoids FRED `FIXHAI` because its accessible history is too short for the dashboard’s historical-context requirements;
- the construction card uses FRED `HOUST`;
- each card asks a human question accurately answered by its measure;
- both datasets refresh outside the browser into validated committed JSON;
- provider failures preserve prior valid files;
- full useful history is shown without fabrication;
- missing values remain missing;
- charts, summaries, tables, metadata, and error states follow existing accessible behavior;
- each card fails independently;
- no out-of-scope housing or financial-condition indicator was added;
- Epic 02 and relevant documentation are current;
- all required checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
