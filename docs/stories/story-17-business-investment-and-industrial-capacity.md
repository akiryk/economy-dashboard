# Story 17: Add Business Investment and Industrial Capacity Utilization

## Status

Planned.

## User story

As a dashboard reader, I want to see whether businesses are increasing investment in productive assets and how intensively existing industrial capacity is being used, so that I can distinguish expansion of future productive capacity from current operating pressure.

## Product questions

Add two separate cards to the existing **Business and manufacturing** section.

### Business investment

> **Are businesses increasing investment in productive capacity?**

### Industrial activity

> **How fully is industrial capacity being used?**

These cards are complementary, not interchangeable:

- real nonresidential fixed investment measures spending on structures, equipment, and intellectual-property products intended to support future production;
- capacity utilization measures current industrial output relative to estimated sustainable productive capacity.

Do not combine them into one chart. They have different frequencies, units, histories, and economic meanings.

## Source decisions

Use FRED as the intermediary for both official series.

### Real private nonresidential fixed investment

- **FRED series:** `PNFIC1`
- **Provider title:** Real Private Nonresidential Fixed Investment
- **Underlying publisher:** U.S. Bureau of Economic Analysis
- **Frequency:** Quarterly
- **Native units:** Billions of chained 2017 dollars
- **Seasonal adjustment:** Seasonally adjusted annual rate
- **Source transformation:** Provider-published real level
- **Displayed transformation:** Locally calculated exact-quarter year-over-year growth
- **History policy:** Full useful available history, beginning in 1947

Use real rather than nominal investment so inflation does not masquerade as growth.

Use broad private nonresidential fixed investment rather than one narrow category. It includes business investment in nonresidential structures, equipment, and intellectual-property products. It excludes residential and government investment.

Do not use nominal `PNFI` for the visible measure.

### Total industrial capacity utilization

- **FRED series:** `TCU`
- **Provider title:** Capacity Utilization: Total Index
- **Underlying publisher:** Board of Governors of the Federal Reserve System
- **Frequency:** Monthly
- **Units:** Percent
- **Seasonal adjustment:** Seasonally adjusted
- **Transformation:** Provider-published level
- **History policy:** Full useful available history, beginning in 1967

Use total industry rather than manufacturing-only capacity utilization. Story 16 already focuses specifically on manufacturing output and employment; this card should provide the broader industrial view covering manufacturing, mining, and electric and gas utilities.

Do not add `INDPRO` in this story. Total industrial production would substantially overlap with the output side of Story 16 while adding less distinct information than capacity utilization.

## Scope

This story must:

1. Add `PNFIC1` and `TCU` to the established FRED refresh workflow.
2. Derive exact-quarter year-over-year real business-investment growth from `PNFIC1`.
3. Preserve `TCU` as a provider-published monthly percentage level.
4. Generate and commit validated local datasets.
5. Register both datasets in the local repository.
6. Add two cards to the existing Business and manufacturing section.
7. Provide full useful history and all established range controls.
8. Inherit the shared Story 09A historical zoom behavior automatically.
9. Add explicit presentation copy, summaries, tables, metadata, and provenance.
10. Preserve card-level loading and failure isolation.
11. Update Epic 02 and directly relevant documentation.

Do not add nominal business investment, residential investment, government investment, component investment cards, industrial production, manufacturing capacity utilization, inventories, orders, PMI data, recession shading, forecasts, or threshold-based good/bad labels.

## Product meaning

### Business investment

The card should answer whether inflation-adjusted private nonresidential fixed investment is higher or lower than in the same quarter one year earlier.

Explain that:

- a positive growth rate means the real investment level is above its year-earlier level;
- a falling positive rate means investment is still rising, but more slowly;
- a negative rate means the real investment level is below its year-earlier level;
- the measure is a flow of investment spending, not the total stock of productive assets;
- “investment” here does not mean purchases of stocks, bonds, or other financial assets;
- the aggregate can conceal sharp differences among industries and investment categories;
- the chart does not identify why investment strengthened or weakened.

### Capacity utilization

Explain that the Federal Reserve estimates industrial output as a share of estimated sustainable maximum output.

Do not imply:

- that 100% is a desirable target;
- that a higher value is always better;
- that a lower value is always bad;
- that the measure covers the entire economy;
- that it directly measures business investment;
- that a particular value proves inflationary pressure.

High utilization can indicate strong demand and limited spare capacity, but can also accompany bottlenecks or price pressure. Low utilization indicates more industrial slack, but may also reflect newly added capacity. Preserve that ambiguity.

## Business-investment card

### Question

> Are businesses increasing investment in productive capacity?

### Measure label

> Real business investment growth

### Latest-value callout

Show the latest quarterly year-over-year growth rate and observation period.

Example structure:

```text
+5.8%
from one year earlier
2026 Q1
```

Use the actual generated value. Do not show the source level in billions as the primary callout.

### Derivation

For each quarterly source observation:

```text
growth_t = ((level_t / level_t-4 quarters) - 1) × 100
```

Requirements:

- use the exact calendar quarter one year earlier;
- never substitute the fourth prior array item;
- missing current or prior-year values produce `null`;
- missing calendar quarters are not bridged;
- leading unavailable derived values are omitted;
- internal missing values remain `null`;
- reject duplicate dates;
- preserve full precision before formatting and serialization;
- do not request FRED’s server-side percentage transformation.

### Chart behavior

Use the established single-series quarterly growth chart:

- shared percentage axis;
- include zero and show the zero reference line;
- no smoothing;
- gaps remain disconnected;
- 5y, 10y, 20y, and Maximum;
- Maximum shows full generated history beginning around 1948;
- Story 09A zoom and reset behavior are inherited through the shared chart boundary;
- zoom does not recalculate growth values;
- accessible factual summary;
- semantic recent-observations table;
- isolated loading and failure state.

Suggested explanation:

> This series shows how inflation-adjusted private business spending on structures, equipment, and intellectual-property products changed from the same quarter one year earlier. It excludes housing and financial-asset purchases.

Make clear that the line is a growth rate, not the investment level.

## Capacity-utilization card

### Question

> How fully is industrial capacity being used?

### Measure label

> Industrial capacity utilization

### Latest-value callout

Show the latest monthly percentage level and observation period.

Example structure:

```text
77.8%
of estimated industrial capacity
May 2026
```

Use the actual source value.

### Chart behavior

Use the established single-series percentage-level chart:

- monthly observations;
- no local economic transformation;
- no smoothing;
- missing values remain gaps;
- 5y, 10y, 20y, and Maximum;
- Maximum begins with the full available series around 1967;
- Story 09A zoom and reset behavior are inherited;
- selected zoom changes visible summary and table observations, not source values;
- use a padded level axis rather than forcing zero;
- do not add a zero reference line;
- do not add an arbitrary target band;
- accessible factual summary;
- semantic recent-observations table;
- isolated loading and failure state.

Suggested explanation:

> Capacity utilization estimates industrial output as a share of the Federal Reserve’s estimate of sustainable maximum output for manufacturing, mining, and utilities. Higher values mean less spare industrial capacity, not necessarily a healthier economy.

## Section placement

Add both cards to the existing **Business and manufacturing** section created by Story 16.

Recommended order:

1. Manufacturing output versus employment
2. Real business investment growth
3. Industrial capacity utilization

Suggested section description:

> Business and manufacturing indicators show how production, employment, capital spending, and industrial operating intensity are changing. These measures can diverge because they describe different parts and time horizons of business activity.

Do not create a second business section.

## Shared zoom requirement

Both new cards must use the shared Story 09A zoom implementation without card-specific duplication.

Do not add local `dataZoom` configuration, card-specific zoom state, separate Reset zoom markup, duplicate visible-range utilities, or card-specific ECharts event subscriptions.

## Data refresh

### `PNFIC1`

Fetch the provider-published quarterly real level once.

The refresh must:

- request `series_id=PNFIC1`;
- use quarterly frequency if required;
- use full-history policy;
- omit FRED `units`;
- validate the provider response as untrusted data;
- normalize `.` to `null`;
- reject malformed dates, duplicate dates, malformed values, and insufficient history;
- exclude future-dated observations;
- derive exact-quarter year-over-year growth locally;
- validate the generated `EconomicSeries`;
- atomically replace the prior valid output only after validation;
- preserve the prior file on any failure;
- report source count, generated count, coverage, latest value, transformation, and output path.

Recommended identity:

```text
real-business-investment-growth
real-business-investment-growth.json
```

Metadata must preserve `PNFIC1` as the provider series and state that growth is locally calculated.

### `TCU`

The refresh must:

- request `series_id=TCU`;
- use monthly frequency if required;
- use full-history policy;
- omit FRED `units`;
- preserve the provider-published percentage level;
- normalize missing values to `null`;
- apply established direct-series validation and atomic replacement;
- preserve the prior valid file on failure;
- report identifier, count, coverage, latest value, and output path.

Recommended identity:

```text
industrial-capacity-utilization
industrial-capacity-utilization.json
```

The two datasets may refresh independently. Runtime failure of one card must not suppress the other, Story 16, or any unrelated section.

## Data model and repository

Reuse the existing `EconomicSeries` model and `{ date, value }` observation shape.

Register both slugs explicitly in the local repository.

Do not persist historical averages, arbitrary utilization gaps, investment acceleration, selected-range statistics, or zoom state.

## Provenance

### Business investment

Expose:

- FRED as intermediary;
- U.S. Bureau of Economic Analysis as source;
- `PNFIC1`;
- Real Private Nonresidential Fixed Investment;
- quarterly;
- billions of chained 2017 dollars at a seasonally adjusted annual rate as the native source level;
- exact-quarter year-over-year growth calculated locally;
- source and generated coverage;
- retrieval date.

### Capacity utilization

Expose:

- FRED as intermediary;
- Board of Governors of the Federal Reserve System as source;
- `TCU`;
- Capacity Utilization: Total Index;
- monthly;
- percent;
- seasonally adjusted;
- provider-published level;
- full coverage;
- retrieval date.

## Accessible summaries and tables

### Business investment summary

Describe the visible period, first and latest visible growth rates, visible minimum and maximum, and whether the latest visible observation is positive, zero, or negative.

Distinguish slowing positive growth from an actual year-over-year decline in the real investment level.

### Capacity-utilization summary

Describe the visible period, first and latest visible levels, and visible minimum and maximum.

Do not characterize values as tight, loose, overheated, depressed, healthy, or unhealthy without an approved analytical rule.

### Tables

Use the established recent-observation count and formatting.

Business investment table:

- Quarter
- Year-over-year real investment growth

Capacity utilization table:

- Month
- Capacity utilization

When zoomed, tables must follow the visible period through the shared Story 09A path.

## Documentation updates

Update Epic 02 based on verified repository state:

- mark Story 16 complete;
- mark manufacturing output versus employment complete;
- retain Story 17 as business investment and industrial activity;
- mark Story 17 complete only after implementation, verification, commit, and push;
- mark broad business investment and industrial activity complete at that time.

Update directly relevant documentation for supported FRED configurations, exact-quarter investment-growth derivation, capacity-utilization semantics, section composition, axis policies, shared zoom compatibility, generated coverage, card counts, and bundle impact.

Do not broaden this into a general documentation rewrite.

## Tests

Add deterministic tests covering at least:

### Business investment

1. `PNFIC1` uses quarterly frequency, full history, and no FRED units transformation.
2. Metadata identifies BEA and the native real level correctly.
3. Exact-quarter year-over-year growth is calculated correctly.
4. Array position is never substituted for a missing prior-year quarter.
5. Positive, zero, and negative growth values are handled correctly.
6. Leading unavailable values are omitted.
7. Internal missing values remain `null`.
8. Full precision is retained.
9. Failed retrieval, derivation, validation, or replacement preserves the prior file.
10. The repository resolves the generated slug.

### Capacity utilization

11. `TCU` uses monthly frequency, full history, and no FRED units transformation.
12. Metadata identifies the Federal Reserve Board, percent units, and seasonal adjustment.
13. Values remain provider-published percentage levels.
14. Missing markers remain `null`.
15. Duplicate, malformed, future-dated, or insufficient observations fail safely.
16. Failed refresh preserves the prior file.
17. The repository resolves the new slug.

### Presentation and integration

18. Both cards appear in the existing Business and manufacturing section.
19. Card order matches the story.
20. Business investment uses a zero-inclusive growth axis.
21. Capacity utilization uses a padded level axis without forcing zero.
22. The investment card distinguishes slower growth from negative growth.
23. The capacity card does not treat 100% as a target.
24. Neither card adds unsupported good/bad labels.
25. Both inherit shared Story 09A zoom.
26. Neither contains local `dataZoom`, reset controls, or zoom state.
27. Summaries and tables follow the visible zoom period.
28. Economic calculations are unchanged by zoom.
29. Each card fails independently.
30. Existing cards retain prior behavior.
31. No `INDPRO`, manufacturing-capacity-utilization, or component-investment card is added.
32. No browser-side provider request is introduced.

Use established fixtures and test conventions. Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- both cards appear in the existing section;
- each question matches its chart;
- latest values and periods format correctly;
- business-investment Maximum reaches approximately 1948;
- capacity-utilization Maximum reaches approximately 1967;
- all presets work;
- shared historical zoom and Reset zoom work;
- summaries and tables follow the visible period;
- zooming does not alter derived values;
- business investment clearly shows growth rather than the source dollar level;
- capacity utilization clearly shows a percent level;
- axes follow intended policies;
- charts remain readable at narrow and desktop widths;
- missing values remain disconnected;
- keyboard interaction and focus remain usable;
- failure of one card leaves the other and Story 16 usable;
- no duplicate or inconsistent zoom UI appears.

Perform a product-meaning review:

- A reader should not mistake business investment for financial-market investing.
- A reader should understand that falling positive investment growth still means the real level is rising.
- A reader should understand that capacity utilization covers the industrial sector, not the whole economy.
- A reader should not infer that higher utilization is always better.
- A reader should understand that the two cards describe different time horizons.

## Required verification

Run all checks required by `AGENTS.md`, including:

```text
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Also inspect refresh reporting and generated JSON, confirm full source and generated coverage, verify both cards and zoom behavior in a real browser, inspect bundle output, inspect the diff for out-of-scope indicators or duplicate zoom logic, stop temporary processes, and confirm no credentials, source payloads, screenshots, logs, or unrelated changes are committed.

## Completion and Git requirements

Before completion:

1. Confirm only Story 17 scope was implemented.
2. Confirm Story 16 and Epic statuses are current.
3. Confirm both card questions match their measures.
4. Confirm full useful history.
5. Confirm Story 09A zoom was inherited without duplication.
6. Confirm all checks pass.
7. Create one focused conventional-style commit.
8. Push without force.
9. Confirm the branch is synchronized and the working tree is clean.

The completion report must include implementation summary, source and transformation decisions, rationale for choosing `TCU` rather than `INDPRO`, quality checks and browser verification, confirmation of shared zoom reuse, generated coverage, bundle impact, commit hash and message, branch and remote, push result, final working-tree status, and known limitations for Story 18.

End with:

```text
ALL DONE WITH USER STORY 17
```

## Acceptance criteria

Story 17 is complete when:

- the existing Business and manufacturing section contains real business-investment growth and total industrial capacity-utilization cards;
- business investment uses FRED `PNFIC1`;
- investment growth is locally derived using exact prior-year quarters;
- capacity utilization uses FRED `TCU` as a provider-published monthly percentage level;
- full useful history is included;
- both cards inherit shared zoom without duplicate implementation;
- chart questions, explanations, axes, summaries, tables, and metadata match the actual measures;
- missing values remain missing;
- card failures remain isolated;
- no overlapping `INDPRO` or out-of-scope component cards are added;
- Epic 02 and relevant documentation are current;
- all required checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
