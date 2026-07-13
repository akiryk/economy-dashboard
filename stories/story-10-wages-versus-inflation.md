# Story 10: Add wages-versus-inflation comparison

You are working in the existing `economy-dashboard` repository.

Stories 01 through 09 are complete, committed, and pushed to GitHub.

The application currently:

- Uses React, TypeScript, Vite, and React Router.
- Loads committed local economic datasets through asynchronous repository abstractions.
- Validates datasets at runtime.
- Refreshes supported FRED datasets through `npm run data:refresh`.
- Displays:
  - Real GDP growth
  - Headline CPI inflation
  - Unemployment rate
  - Prime-age employment-to-population ratio
  - Payroll growth
- Organizes indicators into:
  - Growth
  - Prices
  - Employment and income
- Uses shared lazy-loaded Apache ECharts time-series charts.
- Supports 5-year, 10-year, 20-year, and maximum ranges.
- Includes the fullest useful history available for the existing indicators.
- Does not use a database or runtime backend.

Read and follow `AGENTS.md` before making changes.

Implement Story 10 only.

## Goal

Add the dashboard’s first relationship-based card:

> Are workers’ wages keeping up with prices?

The card should compare year-over-year wage growth with year-over-year CPI inflation and prominently show the resulting real wage growth.

This story should help the user distinguish among:

- Nominal wage growth
- Inflation
- Real purchasing-power growth

The new card belongs in the existing `Employment and income` section.

Do not redesign the dashboard or existing cards.

Do not add productivity, median household income, labor share, core inflation, PCE inflation, forecasts, recession shading, historical vintages, or a composite economic score.

## Product rationale

A wage increase does not necessarily improve purchasing power.

Examples:

- Wages rising 5% while prices rise 7% means workers lose purchasing power.
- Wages rising 4% while prices rise 2% means workers gain purchasing power.

The relationship between wages and prices is more informative than either metric by itself.

The card should make that relationship visible without reducing it to an unsupported judgment that conditions are broadly good or bad.

## Dashboard placement

Add one card to the existing:

## Employment and income

Place the cards in this order:

1. Unemployment rate
2. Prime-age employment-to-population ratio
3. Payroll growth
4. Wages versus inflation

Do not create a new section.

Do not add separate visible cards for nominal wage growth and real wage growth.

## Economic question

Use:

```text
Are workers’ wages keeping up with prices?
```

Use a typographic apostrophe if consistent with the repository’s existing copy conventions.

## Wage source series

Use the official FRED series:

```text
AHETPI
```

This is:

```text
Average Hourly Earnings of Production and Nonsupervisory Employees, Total Private
```

Source characteristics:

- Monthly
- Seasonally adjusted
- Dollars per hour
- Available from January 1964
- Published by the U.S. Bureau of Labor Statistics and distributed through FRED

Use the published wage level as the source input.

Do not request `units=pc1`.

Calculate wage growth locally so the same underlying level data can support accurate real-wage calculations.

Do not substitute the shorter all-employees series `CES0500000003` in this story.

## Why use AHETPI

Document the rationale accurately:

- It provides a much longer history than the all-private-employees wage series.
- It covers production and nonsupervisory employees in the private sector.
- It is not a median wage measure.
- It does not include supervisory employees or government workers.
- It is subject to composition effects because the average can change when the mix of jobs changes.

Do not describe it as the wage of the typical worker without qualification.

## Inflation source

Reuse the existing headline CPI source:

```text
CPIAUCSL
```

The existing dashboard already produces headline CPI inflation as year-over-year percent change.

For Story 10:

- Do not make a second browser request.
- Do not add a second visible CPI card.
- During refresh, avoid fetching `CPIAUCSL` more than once.
- Reuse the existing CPI source observations or generated CPI inflation observations according to the cleanest current architecture.
- Ensure wage and CPI months are aligned exactly before deriving real wage growth.

## Source retrieval

Retrieve the fullest useful `AHETPI` history.

Use the existing Story 09 full-history policy.

Expected FRED parameters should conceptually include:

```text
series_id=AHETPI
file_type=json
frequency=m
sort_order=asc
```

Use no arbitrary year-2000 cutoff.

Omit `observation_start` when that is the project’s established full-history convention, or configure the earliest authoritative source date explicitly.

Do not use `units=pc1`.

Continue using the existing API-key, validation, future-date filtering, and safe-write behavior.

## Derived measures

Generate three aligned monthly measures.

### 1. Nominal wage growth

For month `t`:

```text
nominal wage growth =
((wage level at t / wage level at t-12) - 1) × 100
```

Requirements:

- Require a valid observation exactly 12 calendar months earlier.
- Do not substitute the twelfth previous array item if calendar months are missing.
- Do not bridge gaps.
- Return `null` when the required prior observation is unavailable.
- Preserve full reasonable precision in generated JSON.
- Do not annualize a one-month change.
- Do not use simple month-over-month wage growth.

### 2. Headline CPI inflation

Use year-over-year CPI inflation aligned to the same month.

If using source CPI levels locally, calculate:

```text
inflation =
((CPI level at t / CPI level at t-12) - 1) × 100
```

If using the existing generated CPI inflation series, confirm it represents the same calculation and month.

Do not mix seasonal-adjustment variants.

Do not mix CPI and PCE.

### 3. Real wage growth

Calculate exact year-over-year real wage growth:

```text
real wage growth =
(
  (wage level at t / wage level at t-12)
  /
  (CPI level at t / CPI level at t-12)
  - 1
) × 100
```

This is preferred over simply subtracting the two percentage rates.

Requirements:

- Require valid current and year-earlier wage and CPI observations.
- Require exact matching calendar months.
- Return `null` when any required input is missing.
- Preserve positive, negative, and zero values.
- Do not silently treat missing values as zero.
- Do not round before completing the calculation.
- Document that real wage growth is derived by deflating average hourly earnings with headline CPI.

For user-facing explanatory purposes, it is acceptable to note that nominal wage growth minus inflation is an intuitive approximation, but the application must use the exact ratio formula.

## Generated files

Generate and commit:

```text
src/features/economic-series/data/nominal-wage-growth.json
src/features/economic-series/data/real-wage-growth.json
```

The existing headline CPI inflation file remains the inflation source unless the current refresh architecture requires an explicitly shared derived output.

Requirements:

- Both new files must use the existing validated `EconomicSeries` model unless a minimal accurate extension is required.
- Observations must be monthly and chronological.
- Coverage should begin at the first month where the required prior-year values exist.
- Future-dated observations must be excluded.
- Missing values must remain `null`.
- Metadata must identify `AHETPI` as the wage source.
- Real-wage metadata must also identify `CPIAUCSL` as the deflator.
- Metadata must not imply that FRED directly publishes the application’s real-wage series.
- Files must include retrieval timestamps and trailing newlines.
- Values must be generated by `npm run data:refresh`.
- Do not manually edit values after generation.

## Domain-model and provenance requirements

The current single-source `EconomicSeries` metadata may not fully describe a series derived from two provider series.

Make the smallest justified model extension needed to preserve provenance.

An acceptable approach is an optional source list such as:

```ts
interface EconomicSeriesSource {
  provider: string;
  providerSeriesId: string;
  sourceName: string;
  sourceUrl: string;
  role?: string;
}
```

Do not add this exact interface unless it fits the current architecture.

Requirements:

- Existing single-source series must continue validating.
- The new real-wage series must disclose both:
  - `AHETPI` as the wage measure
  - `CPIAUCSL` as the inflation deflator
- Do not duplicate conflicting source metadata.
- Keep chart-library concerns out of the domain model.
- Do not create a general data-lineage graph.

## Refresh architecture

Extend the current explicit refresh pipeline to support a multi-source derived series.

The workflow should:

1. Fetch `AHETPI` once.
2. Reuse or fetch `CPIAUCSL` once as part of the existing CPI refresh.
3. Validate both provider responses.
4. Exclude future observations.
5. Align observations by exact calendar month.
6. Derive nominal wage growth.
7. Derive real wage growth.
8. Build valid domain objects.
9. Validate all generated outputs.
10. Replace the two wage output files as one rollback-protected group.
11. Preserve unrelated partial-success behavior.

Do not fetch CPI twice merely because two outputs use it.

Do not put derivation logic in React components.

Do not duplicate the real-wage formula in multiple scripts.

Use pure, testable derivation functions.

## Atomic write behavior

Treat:

```text
nominal-wage-growth.json
real-wage-growth.json
```

as one output group.

If either output fails retrieval, derivation, validation, serialization, or writing:

- Preserve both previously valid wage files.
- Exit with nonzero status according to existing refresh behavior.
- Do not leave one new file paired with one stale file.
- Clean up temporary files where practical.
- Do not roll back unrelated successfully refreshed indicators unless that is already the documented global policy.

Document the behavior.

## Card title and metadata

Suggested product metadata:

```text
slug: wages-versus-inflation
title: Wages Versus Inflation
shortTitle: Real wage growth
question: Are workers’ wages keeping up with prices?
frequency: monthly
```

The relationship card itself may use a small presentation configuration rather than pretending it is one ordinary economic series.

The primary value should be:

```text
Latest real wage growth
```

Example conceptual display:

```text
+1.2%
Latest real wage growth
June 2026
```

Use the actual generated value.

Requirements:

- Use one decimal place for the primary display unless current conventions justify otherwise.
- Use a plus sign for positive real wage growth.
- Use a minus sign for negative real wage growth.
- Display zero without a misleading plus sign.
- Do not label the current result good, bad, strong, weak, healthy, or unhealthy.

## Comparison chart

Add a reusable comparison-capable chart boundary while preserving the existing single-series chart behavior.

The wages-versus-inflation chart should plot two lines on one shared percentage axis:

1. Nominal wage growth
2. Headline CPI inflation

Requirements:

- Use one shared y-axis because both series are year-over-year percentages.
- Do not use dual axes.
- Use monthly dates.
- Preserve exact month alignment.
- Do not smooth lines.
- Do not interpolate missing values.
- Include zero in the visible range.
- Show the existing zero reference-line treatment.
- Keep both lines visually distinguishable without relying only on color.
- Use line style, symbols, labels, or another accessible distinction as needed.
- Include a concise legend because two series are present.
- Do not add real wage growth as a third chart line in this story.
- Do not shade the gap between the lines.
- Do not add a 2% inflation target line.
- Do not add recession shading.
- Preserve responsive resizing, lazy loading, disposal, and ECharts deduplication.

The visual meaning is:

- Wage-growth line above inflation line: purchasing power is generally increasing.
- Wage-growth line below inflation line: purchasing power is generally decreasing.

Explain this in concise card copy, not as an automatic chart verdict.

## Time-range controls

Reuse:

- 5 years
- 10 years
- 20 years
- Maximum

Requirements:

- Default range remains unchanged.
- Anchor each range to the latest month shared by all required comparison data.
- Filter both chart lines to the same date range.
- Do not allow one line to extend beyond the other in the comparison card.
- `Maximum` should use the full aligned history available to the comparison, expected to begin after the 1964 wage-series start and the required 12-month warm-up.
- Existing cards’ range behavior must remain unchanged.

## Tooltip behavior

The comparison tooltip should show one month and all relevant values:

```text
June 2026
Nominal wage growth: 3.6%
Headline CPI inflation: 2.4%
Real wage growth: +1.2%
```

Use actual generated values.

Requirements:

- Use consistent rounding.
- Preserve exact values in JSON.
- Do not show raw wage dollars or CPI index levels.
- Handle missing values clearly.
- Do not inject unsafe HTML.
- Ensure labels are understandable without relying on line colors.

## Accessible summary

Create a factual range summary appropriate for a relationship card.

At minimum report:

- Latest nominal wage growth and month
- Latest inflation and month
- Latest real wage growth and month
- Whether real wage growth was positive or negative in the latest observation
- Highest real wage growth in the selected range and period
- Lowest real wage growth in the selected range and period

Use factual language.

Acceptable conceptual wording:

```text
In June 2026, nominal wages grew 3.6% from a year earlier while consumer prices rose 2.4%, producing real wage growth of 1.2%. Over the selected period, real wage growth ranged from ...
```

Do not say workers are thriving, struggling, better off overall, or worse off overall.

The measure is an average and does not describe every worker.

## Explanatory copy

### What this tells you

Use wording based on:

```text
This comparison shows whether average hourly earnings for private-sector production and nonsupervisory employees are rising faster or slower than consumer prices. Real wage growth is positive when inflation-adjusted hourly earnings increase from a year earlier.
```

### What this leaves out

Use wording based on:

```text
Average hourly earnings are not a median and can change when the mix of jobs changes. The measure excludes supervisory employees, government workers, benefits, and self-employed workers. Headline CPI is a national average and may not match an individual household’s expenses.
```

Keep the copy concise and accurate.

## Related indicators

Include plain informational labels such as:

- Payroll growth
- Productivity
- Labor share

Do not make fake links unless destinations exist.

Do not add those indicators in this story.

## Recent observations table

Add a relationship-specific recent table showing the latest 12 aligned months.

Columns:

- Observation month
- Nominal wage growth
- Headline CPI inflation
- Real wage growth

Requirements:

- Use semantic HTML.
- Use a meaningful caption.
- Display newest months first.
- Use consistent percentage formatting.
- Use signed formatting for real wage growth.
- Preserve null values as unavailable.
- Do not calculate values inside the table component.
- Remain usable on narrow screens using the current disclosure and overflow approach.
- Do not show raw wage or CPI index levels by default.

A focused comparison table is acceptable.

Do not force the existing single-series table into an unreadable abstraction.

## Loading and failure behavior

Load all required comparison data as one card-level unit.

Requirements:

- A wage-card failure must not prevent payroll, unemployment, prime-age employment, GDP, or CPI cards from rendering.
- If nominal wage growth or real wage growth is unavailable, show one useful card error.
- Do not render a misleading partial comparison.
- The separate existing CPI card must remain functional even if the wage comparison fails.
- Do not add a new global state-management library.

## Existing presentation

Preserve the current dashboard presentation.

Do not:

- Redesign cards
- Shrink charts
- Change section typography
- Replace time-range controls
- Introduce a new layout system
- Add compact comparison widgets elsewhere
- Reduce or reorganize existing card copy
- Add a dashboard score

Small changes required for a two-line legend, comparison tooltip, and comparison table are in scope.

## Testing

Preserve all existing tests.

Normal tests must not contact live FRED.

Add focused deterministic tests.

### Source configuration tests

Test:

- `AHETPI` is configured correctly.
- It uses monthly frequency.
- It does not request `pc1`.
- It uses the full-history policy.
- `CPIAUCSL` is not fetched redundantly.
- Both generated wage outputs identify their source provenance.
- Existing CPI generation remains unchanged.

### Alignment tests

Test:

- Wage and CPI observations align by exact calendar month.
- Missing months are not matched by array position.
- Duplicate dates follow the documented validation behavior.
- Future dates are excluded.
- Inputs are not mutated.
- The latest shared month is selected correctly.

### Nominal wage-growth tests

Test:

- A valid 12-month comparison calculates correctly.
- Fewer than 12 months produces unavailable output.
- A missing exact year-earlier month produces `null`.
- Positive, negative, and zero growth are preserved.
- No premature rounding occurs.

### Real wage-growth tests

Test the exact ratio formula.

Include cases where:

- Wages grow faster than prices.
- Wages grow slower than prices.
- Wages and prices grow at the same rate.
- Prices fall.
- Wages fall.
- An input is missing.
- Calendar continuity is broken.
- Inputs are not mutated.

Include at least one assertion proving the implementation does not merely subtract rounded rates.

### Atomic output tests

Test:

- Both wage files update only after both validate.
- Nominal-output failure preserves both previous files.
- Real-output failure preserves both previous files.
- Temporary files are handled safely.
- Unrelated series retain existing partial-success behavior.

Use temporary test directories only.

### Repository and model tests

Test:

- New wage series load successfully.
- Existing series continue loading.
- Multi-source provenance validates.
- Unknown slugs still return `null`.
- No chart types leak into domain models.

### Comparison chart tests

Mock ECharts internals according to existing conventions.

Test:

- Two lines are provided.
- Both use one percentage axis.
- Zero remains included.
- No dual axis is created.
- Date points are aligned.
- Missing observations remain gaps.
- Legend labels are clear.
- Existing single-series charts remain unchanged.

### Range and summary tests

Test:

- 5Y, 10Y, 20Y, and Maximum filter all comparison series identically.
- Maximum begins at the first valid aligned comparison observation.
- The latest real-wage result is correct.
- Selected-range minimum and maximum real wage growth are correct.
- Signed formatting is correct.
- Tie behavior is documented and tested.
- Inputs are not mutated.

### Dashboard tests

Test:

- Wages-versus-inflation appears after payroll growth.
- Its human question renders.
- Its primary callout uses real wage growth.
- The chart contains wage growth and inflation.
- The recent table contains all four required columns.
- No separate nominal-wage card is displayed.
- No productivity or labor-share card is added.
- Existing section order remains unchanged.

### Failure-isolation tests

Test:

- Wage-card failure does not block payroll.
- Wage-card failure does not block unemployment.
- Wage-card failure does not block prime-age employment.
- Wage-card failure does not block GDP or CPI.
- Existing CPI card can render when the comparison card fails.

### Accessibility tests

Test:

- The comparison chart has a distinct accessible label.
- Both line names are available to assistive technology.
- Range controls have card-specific accessible context.
- The factual summary includes the latest relationship.
- The recent comparison table is semantic and accessible.
- Signed values have understandable accessible text.
- Heading hierarchy remains valid.

Do not use large snapshots.

## Documentation

Update `README.md` with:

- Wages-versus-inflation as a supported relationship card.
- Source series `AHETPI` and `CPIAUCSL`.
- The wage measure’s coverage and limitations.
- Nominal wage-growth formula.
- Exact real wage-growth formula.
- Generated file locations.
- The fact that `npm run data:refresh` now updates the wage comparison outputs.

Update:

```text
docs/data-refresh.md
```

Document:

- `AHETPI` request parameters.
- Full-history retrieval.
- CPI reuse and non-duplication.
- Month-alignment rules.
- Nominal wage-growth formula.
- Exact real wage-growth formula.
- Missing-value behavior.
- Grouped atomic writes.
- Refresh output reporting.

Update:

```text
docs/data-model.md
```

Document:

- Multi-source derived-series provenance.
- Wage source versus CPI deflator.
- Relationship-card data composition.
- Any minimal model extension introduced.

Update:

```text
docs/charting.md
```

Document:

- Shared-axis two-line comparison charts.
- Why dual axes are not used.
- Legend and line-distinction behavior.
- Relationship tooltip behavior.
- Range alignment.
- Existing single-series chart behavior remains unchanged.

Update:

```text
docs/product-principles.md
```

Add or clarify:

- Related indicators should be compared directly when the relationship answers a meaningful human question.
- Real purchasing power requires considering both nominal wages and prices.
- Average wage measures should not be described as universal household experience.

Keep documentation grounded in actual implementation.

## Dependencies and bundle constraints

Do not add new runtime dependencies unless strictly necessary.

Do not add:

- A statistics library
- A date library
- A dataframe library
- A database
- A backend
- A state-management library

Do not duplicate ECharts.

The comparison chart and all existing charts should share the existing deferred ECharts chunk.

Run the production build and report:

- Initial application chunk size
- Shared chart/ECharts chunk size
- New data-file or lazy-chunk sizes
- Whether ECharts appears once
- Whether the existing deferred-chunk warning remains

Do not optimize ECharts in this story.

Do not raise Vite’s warning threshold.

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Fix all errors.

Run the development server and verify:

1. Growth still renders GDP.
2. Prices still renders CPI.
3. Employment and income renders:
   - Unemployment
   - Prime-age employment
   - Payroll growth
   - Wages versus inflation
4. The new card appears after payroll growth.
5. The latest real wage growth and month match generated data.
6. The comparison chart renders two lines.
7. The wage and inflation lines use the same axis.
8. The zero reference line is visible.
9. No dual axis appears.
10. Tooltips show nominal wage growth, inflation, and real wage growth.
11. All four time ranges work.
12. Maximum uses the full aligned comparison history.
13. The accessible summary updates correctly.
14. The recent table shows 12 aligned months and four columns.
15. Existing cards remain functional.
16. Individual-card failures remain isolated.
17. Desktop and narrow-width layouts remain usable.
18. No browser request is made to FRED.
19. ECharts remains in one shared deferred chunk.
20. The 404 route still works.
21. There are no uncaught browser console errors.
22. The development server is stopped after verification.

Independently verify at least three generated months:

- One month with positive real wage growth
- One month with negative real wage growth
- One historically notable inflation period

For each sample, compare:

- Wage level at month `t`
- Wage level at `t-12`
- CPI level at month `t`
- CPI level at `t-12`
- Calculated nominal wage growth
- Calculated inflation
- Calculated exact real wage growth

Report the sample calculations in the completion response.

## Git and story completion

Follow the repository-wide Story Completion rules in `AGENTS.md`.

After verification:

1. Inspect `git status`.
2. Inspect the staged diff.
3. Confirm no `.env` file, API key, temporary file, raw provider response, debug output, or unrelated change is included.
4. Create one focused conventional-style commit.

Suggested commit message:

```text
feat: compare wage growth with inflation
```

5. Push the completed commit to the configured GitHub upstream branch.
6. Do not force-push.
7. Confirm the local branch is synchronized with the remote.
8. Confirm the working tree is clean.
9. Do not begin Story 11.

Before committing and pushing, confirm:

- Both wage output files were generated through `npm run data:refresh`.
- Economic values were not manually edited.
- `AHETPI` and `CPIAUCSL` were each fetched no more than required.
- The exact real-wage formula is used.
- Wage and CPI dates are aligned by calendar month.
- No new unrelated indicator was added.
- No presentation redesign was included.
- No database or runtime backend was added.
- Temporary files are absent.
- `AGENTS.md` and the `epics` directory remain intact.

If pushing fails:

- Do not use destructive Git commands.
- Preserve the verified local commit.
- Report the exact failure.
- Explain what user action is required.

## Completion response

Report:

1. What was created
2. Exact FRED request parameters for `AHETPI`
3. How `CPIAUCSL` was reused without redundant fetching
4. Source coverage for both input series
5. Generated nominal-wage-growth coverage and observation count
6. Generated real-wage-growth coverage and observation count
7. Latest nominal wage growth
8. Latest CPI inflation
9. Latest exact real wage growth
10. Three independently verified sample calculations
11. Alignment and missing-value behavior
12. Multi-source provenance model changes
13. Grouped atomic-write behavior
14. Comparison-chart architecture
15. Shared-axis and zero-line behavior
16. Tooltip and accessible-summary behavior
17. Tests added and results
18. Browser-verification results
19. Bundle sizes and ECharts deduplication result
20. Architectural decisions or deviations
21. Commit hash and commit message
22. Branch name
23. GitHub remote used
24. Push result
25. Final working-tree status
26. Relevant resulting file structure
27. Concerns or useful data questions to consider before Story 11

Do not add productivity.

Do not add median household income.

Do not add labor share.

Do not add core CPI or PCE inflation.

Do not add forecast comparisons.

Do not add recession shading.

Do not add historical-vintage tracking.

Do not add a composite economic score.

Do not redesign the cards.

Do not begin Story 11.
