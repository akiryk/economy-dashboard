# Story 13: Add household income, spending, and saving

You are working in the existing `economy-dashboard` repository.

Stories 01 through 12 are complete, committed, and pushed to GitHub.

Read and follow:

- `AGENTS.md`
- Epic 02: Build the Phase 1 U.S. Economy Dashboard
- Existing documentation in `docs/`

Implement Story 13 only.

## Goal

Add two complementary cards to a new `Households` section:

1. Real disposable income versus real consumer spending
2. Personal saving rate

These cards should help answer:

- Are household incomes and spending growing after inflation?
- Are households saving or drawing down more of their income?

Do not redesign the dashboard.

Do not add household debt stress, delinquency data, housing, forecasts, recession shading, historical vintages, distributional measures, percentile context graphics, or editorial judgments in this story.

## Dashboard placement

Create a new section:

```text
Households
```

Place it after `Employment and income`.

Use this card order:

1. Real income versus spending
2. Personal saving rate

Do not move or rename existing sections.

# Card 1: Real income versus spending

## Economic question

Use:

```text
Are household incomes and spending growing after inflation?
```

## Source series

Use the official FRED series:

```text
A229RX0
```

for real disposable personal income per capita.

Use:

```text
PCEC96
```

for real personal consumption expenditures.

Verify the exact current FRED titles, units, frequency, seasonal-adjustment metadata, source agencies, and available coverage before generation.

Expected characteristics:

### A229RX0

- Monthly
- Real disposable personal income per capita
- Seasonally adjusted annual rate
- Published by the U.S. Bureau of Economic Analysis and distributed through FRED

### PCEC96

- Monthly
- Real personal consumption expenditures
- Seasonally adjusted annual rate
- Chained-dollar measure
- Published by the U.S. Bureau of Economic Analysis and distributed through FRED

Use the fullest useful available history.

Do not impose an arbitrary year-2000 cutoff.

Fetch source levels. Do not request FRED percentage transformations.

## Why these measures

Document the rationale:

- Disposable personal income is income available after taxes.
- The real per-capita form adjusts for inflation and population growth.
- Real personal consumption expenditures measures inflation-adjusted household spending.
- Comparing their growth rates helps show whether spending is moving with, ahead of, or behind income.
- The source levels have different units, so they should not be plotted directly on one shared level axis.

Do not describe either measure as median household experience.

Do not imply that aggregate spending growth is automatically sustainable.

## Display transformations

Calculate year-over-year percent growth locally for both series.

### Real disposable income per capita growth

For month `t`:

```text
((income level at t / income level at t-12) - 1) × 100
```

### Real consumer spending growth

For month `t`:

```text
((spending level at t / spending level at t-12) - 1) × 100
```

Requirements:

- Require the exact calendar month 12 months earlier.
- Do not substitute the twelfth previous array item when months are missing.
- Do not bridge gaps.
- Return `null` when required inputs are unavailable.
- Preserve positive, negative, and zero values.
- Exclude future-dated observations.
- Preserve full reasonable precision.
- Do not round before completing calculations.
- Do not mix nominal income or spending into these outputs.
- Do not normalize source levels into an index for the primary chart when directly comparable growth rates are available.

## Alignment

Align the two derived growth series by exact calendar month.

Requirements:

- Use the latest month available for both series as the card’s latest observation.
- Filter both lines to the same selected date range.
- Do not allow one line to extend beyond the other.
- Do not compare observations by array position.
- Preserve `null` when either measure is unavailable in an aligned month.

## Suggested card metadata

Use accurate final wording based on verified sources.

Suggested configuration:

```text
slug: real-income-versus-spending
title: Real Income Versus Spending
shortTitle: Income vs. spending
question: Are household incomes and spending growing after inflation?
frequency: monthly
units: Percent
transformation: Percent change from year ago
```

## Primary callout

Use:

```text
Latest real disposable income per capita growth
```

Show real consumer-spending growth as a secondary comparison.

Requirements:

- Use one decimal place unless existing conventions justify another choice.
- Use signed formatting where consistent with the application.
- Display zero without a misleading plus sign.
- Do not label the relationship healthy, unhealthy, sustainable, unsustainable, strong, or weak.
- Do not claim that spending above income growth necessarily means households are borrowing.

## Comparison chart

Plot two lines on one shared percentage axis:

1. Real disposable income per capita growth
2. Real consumer spending growth

Requirements:

- Use monthly dates.
- Use one shared y-axis.
- Do not use dual axes.
- Include zero in the visible range.
- Preserve the existing zero reference line.
- Do not smooth.
- Do not interpolate missing values.
- Preserve null gaps.
- Make lines distinguishable without relying only on color.
- Include a concise legend.
- Do not shade the difference.
- Do not add recession shading, trend lines, or judgment bands.

## Tooltip

Show:

```text
June 2026
Real disposable income per capita growth: +2.1%
Real consumer spending growth: +2.7%
Spending minus income growth: +0.6 percentage points
```

Use actual generated values.

Requirements:

- Calculate the displayed gap as spending growth minus income growth.
- Label the gap in percentage points.
- Do not imply that the gap equals borrowing or dissaving.
- Handle unavailable values clearly.
- Do not inject unsafe HTML.

## Accessible summary

At minimum report:

- Latest shared month
- Latest real income-per-capita growth
- Latest real consumer-spending growth
- Latest gap in percentage points
- Highest and lowest real income growth in the selected range
- Highest and lowest real spending growth in the selected range
- Whether spending growth was above or below income growth in the latest observation

Use factual wording only.

## Explanatory copy

### What this tells you

Use wording based on:

```text
Real disposable income per capita measures inflation-adjusted after-tax income per person. Real consumer spending measures inflation-adjusted household purchases. Comparing their year-over-year growth rates shows whether spending and income are moving together.
```

### What this leaves out

Use wording based on:

```text
Both measures are national aggregates and do not show how income or spending is distributed across households. Spending can be financed from current income, savings, or borrowing, so this comparison alone does not show whether household finances are sustainable.
```

## Related indicators

Use plain informational labels such as:

- Personal saving rate
- Real wages
- Household financial stress

Do not create fake links.

## Recent observations table

Show the latest 12 aligned months.

Columns:

- Observation month
- Real disposable income per capita growth
- Real consumer spending growth
- Spending minus income growth

Requirements:

- Use semantic HTML.
- Use a meaningful caption.
- Display newest months first.
- Use consistent signed percentage formatting.
- Format the gap in percentage points.
- Preserve unavailable values.
- Do not calculate values inside the table component.
- Remain usable on narrow screens using the existing disclosure and overflow pattern.

# Card 2: Personal saving rate

## Economic question

Use:

```text
Are households saving or drawing down more of their income?
```

## Source series

Use the official FRED series:

```text
PSAVERT
```

Verify the exact current FRED title, units, frequency, seasonal-adjustment metadata, source, and available coverage before generation.

Expected characteristics:

- Monthly
- Percent
- Seasonally adjusted annual rate
- Personal saving as a percentage of disposable personal income
- Published by the U.S. Bureau of Economic Analysis and distributed through FRED

Use the fullest useful available history.

Do not impose an arbitrary year-2000 cutoff.

Retrieve the published rate as a level. Do not request `pc1`.

Do not derive the primary rate from separate saving and income series when the authoritative published ratio is available.

## Interpretation

Document:

- The saving rate is the share of disposable personal income not spent on consumption.
- A higher rate means a larger share of aggregate disposable income is being saved.
- A lower rate means a smaller share is being saved.
- The rate can rise because households become cautious, income jumps, or spending falls.
- The rate can fall because spending strengthens, income weakens, or households use accumulated savings.
- Higher is not automatically better.
- Lower is not automatically worse.

Do not call the saving rate household wealth.

Do not imply that every household saves at the national average rate.

## Suggested metadata

```text
slug: personal-saving-rate
title: Personal Saving Rate
shortTitle: Saving rate
question: Are households saving or drawing down more of their income?
frequency: monthly
units: Percent
transformation: Level
```

## Primary callout

Use:

```text
Latest personal saving rate
```

Include the latest observation month.

Use one decimal place unless current conventions justify another choice.

Do not characterize the current value as prudent, excessive, healthy, unhealthy, strong, or weak.

## Chart behavior

Use the existing single-series chart architecture.

Requirements:

- Plot the published saving-rate level.
- Use monthly dates.
- Preserve full useful history.
- Preserve null gaps.
- Do not smooth or interpolate.
- Do not force the y-axis to zero if the current level-series policy says not to.
- Do not add a zero reference line unless the existing series-specific configuration determines it is meaningful.
- Do not add a target, ideal-saving band, recession shading, or historical percentile graphic.
- Preserve lazy loading, responsiveness, cleanup, and ECharts deduplication.

## Time ranges

Reuse:

- 5 years
- 10 years
- 20 years
- Maximum

Requirements:

- Preserve the existing default.
- Anchor ranges to the latest valid observation.
- Maximum includes full generated history.
- Existing cards remain unchanged.

## Accessible summary

At minimum report:

- Latest saving rate and month
- Highest saving rate and month in the selected range
- Lowest saving rate and month in the selected range
- Change from 12 months earlier in percentage points, when available
- Valid observation count where currently supported

Do not describe higher or lower as inherently favorable.

## Explanatory copy

### What this tells you

Use wording based on:

```text
The personal saving rate is the share of aggregate disposable personal income that remains after personal consumption and related outlays. It helps show how much current income households are saving rather than spending.
```

### What this leaves out

Use wording based on:

```text
The national rate is an aggregate and can differ sharply across households. It does not measure total household wealth, cash balances, or debt, and a higher rate can reflect either improved financial capacity or greater caution.
```

## Related indicators

Use plain informational labels such as:

- Real income and spending
- Household debt service
- Consumer confidence

Do not create fake links.

## Recent observations table

Show the latest 12 valid monthly observations.

Columns:

- Observation month
- Personal saving rate
- Change from 12 months earlier

Requirements:

- Use semantic HTML.
- Use a meaningful caption.
- Display newest observations first.
- Format the level as percent.
- Format the year-over-year change in percentage points.
- Preserve unavailable values.
- Calculate the year-over-year change outside the table component.
- Remain usable on narrow screens.

# Generated files

Generate and commit:

```text
src/features/economic-series/data/real-disposable-income-per-capita-growth.json
src/features/economic-series/data/real-consumer-spending-growth.json
src/features/economic-series/data/personal-saving-rate.json
```

Requirements:

- Every file passes runtime validation.
- Observations are monthly and chronological.
- Full useful history is included.
- Derived growth outputs begin only after the 12-month warm-up.
- Future-dated observations are excluded.
- Missing values remain `null`.
- Provider and transformation metadata are accurate.
- Retrieval timestamps are included.
- Files have trailing newlines.
- Files are generated by `npm run data:refresh`.
- Economic values are never manually edited.

Do not create an additional persisted gap series unless the current architecture clearly requires one.

# Refresh architecture

Extend the existing explicit refresh pipeline.

During one refresh:

1. Fetch `A229RX0` once.
2. Fetch `PCEC96` once.
3. Fetch `PSAVERT` once.
4. Validate provider responses.
5. Normalize and exclude future observations.
6. Derive exact-calendar year-over-year real income-per-capita growth.
7. Derive exact-calendar year-over-year real consumer-spending growth.
8. Preserve the published saving-rate level.
9. Build validated domain objects.
10. Safely write generated outputs.

Requirements:

- Fetch each source no more than once.
- Use the established full-history policy.
- Keep derivation logic out of React.
- Reuse shared calendar-aware year-over-year derivation where appropriate.
- Do not create a formula language.
- Do not add another provider API.
- Preserve unrelated partial-success behavior.

## Atomic output behavior

Treat the two comparison outputs as one rollback-protected group:

```text
real-disposable-income-per-capita-growth.json
real-consumer-spending-growth.json
```

If either fails retrieval, derivation, validation, serialization, or writing:

- Preserve both previously valid comparison files.
- Do not leave one updated and one stale.
- Clean temporary files where practical.
- Report failure according to existing refresh conventions.

`personal-saving-rate.json` may remain independent because it comes from a separate source and card.

Document the chosen behavior.

# Domain model and provenance

Preserve the existing observation shape.

For the two derived growth series:

- Preserve provider series IDs.
- Distinguish source levels from locally calculated year-over-year growth.
- Do not imply FRED directly publishes the exact application-derived growth series unless it does.

For the saving rate:

- Represent it as a published level.
- Preserve percentage-point semantics when calculating changes.

Reuse existing relationship and multi-source provenance patterns.

Do not put chart configuration into the domain model.

# Repository and card loading

Extend the repository for:

```text
real-disposable-income-per-capita-growth
real-consumer-spending-growth
personal-saving-rate
```

Requirements:

- Components do not import JSON directly.
- Unknown slugs continue returning `null`.
- Preserve asynchronous loading.
- Load the income-versus-spending datasets as one card-level unit.
- Load the saving-rate card independently.
- Failure of either household card must not block the other.
- Household failures must not block Growth, Prices, or Employment and income.

# Shared comparison-chart architecture

Reuse the comparison-chart architecture already used by wages versus inflation and inflation comparisons.

Requirements:

- Preserve existing single-series charts.
- Preserve existing comparison cards.
- Use a shared percentage axis for income and spending growth.
- Preserve aligned ranges and common latest dates.
- Preserve lazy loading and ECharts deduplication.
- Do not add dual-axis support.
- Do not create a household-specific chart engine.

# Testing

Preserve all existing tests.

Normal tests must not contact live FRED.

Add focused deterministic tests.

## Source configuration tests

Test:

- `A229RX0` is configured correctly.
- `PCEC96` is configured correctly.
- `PSAVERT` is configured correctly.
- All use monthly frequency.
- All use full-history retrieval.
- No source requests an unintended FRED transformation.
- Each source is fetched once.
- Metadata preserves correct provider IDs and transformations.

## Year-over-year growth tests

Test:

- Exact 12-month calculations for income and spending.
- Missing exact prior-year month returns `null`.
- Gaps are not bridged by array position.
- Positive, negative, and zero growth are preserved.
- Future dates are excluded.
- No premature rounding occurs.
- Inputs are not mutated.

## Alignment tests

Test:

- Income and spending align by exact calendar month.
- Latest shared month is selected.
- Array position is never treated as date equality.
- Different source end dates do not produce partial comparisons.
- Both chart lines receive identical selected ranges.

## Saving-rate tests

Test:

- Published rate levels are preserved.
- Missing values remain unavailable.
- Year-over-year percentage-point change is calculated correctly.
- Missing exact year-earlier month produces unavailable change.
- Higher and lower values do not trigger automatic favorable or unfavorable labels.
- Inputs are not mutated.

## Atomic-output tests

Test:

- Income and spending outputs update only after both validate.
- Failure in either comparison output preserves both previous files.
- Saving-rate output retains independent failure behavior.
- Temporary files are handled safely.
- Unrelated series preserve existing partial-success behavior.

## Repository and model tests

Test:

- All three new slugs load.
- Existing slugs continue loading.
- Unknown slugs return `null`.
- Frequencies, units, transformations, and provider IDs are correct.

## Chart tests

Mock ECharts according to existing conventions.

Test:

- Income and spending render as two lines.
- Both use one percentage axis.
- Zero remains included.
- No dual axis is created.
- Missing observations remain gaps.
- Legend labels are clear.
- Existing comparison charts remain unchanged.
- Saving rate renders as one level series.
- No target band appears.

## Range and summary tests

Test:

- 5Y, 10Y, 20Y, and Maximum work correctly.
- Comparison ranges filter both lines identically.
- Saving-rate ranges anchor to its latest observation.
- Latest values and gaps are correct.
- Saving-rate 12-month percentage-point change is correct.
- Selected-range extrema are correct.
- Tie behavior remains consistent.
- Inputs are not mutated.

## Dashboard tests

Test:

- A `Households` section appears after `Employment and income`.
- Card order is real income versus spending, then personal saving rate.
- Both human questions render.
- Primary and secondary comparison values render.
- No household-stress card is added.
- Existing section and card order remains unchanged.

## Failure isolation tests

Test:

- Income-versus-spending failure does not block saving rate.
- Saving-rate failure does not block income versus spending.
- Household failures do not block existing sections.

## Accessibility tests

Test:

- Both charts have distinct accessible labels.
- Both comparison-line names are available to assistive technology.
- Range controls have card-specific context.
- Factual summaries include latest values.
- Recent tables are semantic and accessible.
- Percentage-point values have understandable accessible text.
- Heading hierarchy remains valid.

Do not use large snapshots.

# Documentation

Update `README.md` with:

- The new Households section.
- Real disposable income per capita.
- Real consumer spending.
- Personal saving rate.
- Provider IDs.
- Exact transformations.
- Generated file locations.
- Historical coverage.
- Important aggregate-measure limitations.

Update `docs/data-refresh.md` with:

- Request parameters for all three sources.
- Full-history retrieval.
- Exact year-over-year formulas.
- Calendar alignment.
- Missing-value behavior.
- Comparison-output grouped writes.
- Saving-rate independent output behavior.
- Refresh output reporting.

Update `docs/data-model.md` only as needed to clarify relationship cards, published percent levels, percentage-point changes, and provenance.

Update `docs/charting.md` only as needed to document the shared-axis comparison and saving-rate level behavior.

Update `docs/product-principles.md` to clarify:

- Aggregate household measures do not describe every household.
- Spending growth alone does not establish household financial strength.
- A higher saving rate is not automatically favorable.

Update Epic 02’s story map:

- Mark Story 13 complete after successful implementation.
- Do not alter later story scope.

# Dependencies and bundle constraints

Do not add new runtime dependencies unless strictly necessary.

Do not add a date library, statistics library, dataframe library, database, backend, or state-management library.

Do not duplicate ECharts.

All charts must continue using the shared deferred ECharts chunk.

Report:

- Initial application chunk size
- Shared chart/ECharts chunk size
- New dataset or lazy-chunk sizes
- Whether ECharts remains deduplicated
- Whether the existing deferred-chunk warning remains

Do not optimize ECharts or raise Vite’s warning threshold in this story.

# Verification

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

1. Existing sections remain present and ordered correctly.
2. `Households` appears after `Employment and income`.
3. Households renders both new cards in the specified order.
4. Latest values and months match generated JSON.
5. The comparison chart contains two lines on one shared percentage axis.
6. Zero and the zero reference line appear on the growth comparison.
7. No dual axis appears.
8. The saving-rate chart follows existing level-series axis policy.
9. Tooltips show correct units and percentage-point gaps.
10. All four time ranges work independently.
11. Maximum uses full generated history.
12. Accessible summaries update correctly.
13. Recent tables show 12 monthly observations.
14. Existing cards remain functional.
15. Card failures remain isolated.
16. Desktop and narrow-width layouts remain usable.
17. No browser request is made to FRED.
18. ECharts remains in one shared deferred chunk.
19. The 404 route still works.
20. There are no uncaught browser console errors.
21. The development server is stopped after verification.

Independently verify:

- Three real disposable-income-per-capita growth observations
- Three real consumer-spending growth observations
- Three personal-saving-rate observations and their 12-month changes

Include one recent ordinary observation, one negative or unusually weak growth observation if available, and one historically unusual household period.

For each derived-growth sample, compare the current source level, exact source level 12 months earlier, formula, calculated result, and generated JSON result.

For each saving-rate sample, compare the published source value, generated JSON value, exact value 12 months earlier, and calculated percentage-point change.

# Git and story completion

Follow the repository-wide Story Completion rules in `AGENTS.md`.

After verification:

1. Inspect `git status`.
2. Inspect the staged diff.
3. Confirm no `.env` file, API key, temporary file, raw provider response, debug output, or unrelated change is included.
4. Create one focused conventional-style commit.

Suggested commit message:

```text
feat: add household income spending and saving
```

5. Push to the configured GitHub upstream branch.
6. Do not force-push.
7. Confirm the local branch is synchronized with the remote.
8. Confirm the working tree is clean.
9. Do not begin Story 14.

Before committing and pushing, confirm:

- All three new outputs were generated through `npm run data:refresh`.
- Economic values were not manually edited.
- Each source was fetched once.
- Exact calendar-month formulas are used.
- Income and spending outputs update consistently.
- No household debt-stress or housing work was added.
- No presentation redesign was included.
- No database or runtime backend was added.
- Temporary files are absent.
- `AGENTS.md` and the `epics` directory remain intact.

If pushing fails, preserve the verified local commit, avoid destructive Git commands, report the exact failure, and explain the required user action.

# Completion response

Report:

1. What was created
2. Exact FRED request parameters for all three sources
3. Source coverage and observation counts
4. Generated income-growth coverage and count
5. Generated spending-growth coverage and count
6. Saving-rate coverage and count
7. Latest income growth
8. Latest spending growth
9. Latest income-spending gap
10. Latest personal saving rate
11. Nine independently verified sample calculations
12. Calendar-alignment and missing-value behavior
13. Grouped and independent atomic-write behavior
14. Comparison-chart reuse
15. Saving-rate chart behavior
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
27. Concerns or useful questions to consider before Story 14

Do not add household debt stress, delinquency data, housing indicators, distributional measures, forecasts, recession shading, historical-vintage tracking, percentile context graphics, or card redesign.

Do not begin Story 14.
