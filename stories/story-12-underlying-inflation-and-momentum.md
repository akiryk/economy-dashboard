# Story 12: Add underlying inflation and recent inflation momentum

You are working in the existing `economy-dashboard` repository.

Stories 01 through 11 are complete, committed, and pushed to GitHub.

Read and follow:

- `AGENTS.md`
- Epic 02: Build the Phase 1 U.S. Economy Dashboard
- Existing documentation in `docs/`

Implement Story 12 only.

## Goal

Expand the Prices section with two complementary inflation cards:

1. Headline versus core CPI
2. Recent inflation momentum

These cards should help answer:

- Is inflation broad and persistent, or being driven by volatile food and energy prices?
- Is inflation currently accelerating or slowing?

The existing headline CPI card must remain.

Do not redesign the dashboard.

Do not add PCE inflation, housing affordability, household spending, forecasts, recession shading, historical vintages, category-level CPI breakdowns, or automated economic judgments in this story.

## Dashboard placement

Use this order in the existing Prices section:

1. Headline CPI inflation
2. Headline versus core CPI
3. Recent inflation momentum

Do not create a new section.

Do not modify Growth or Employment and income except where shared behavior must be generalized.

# Source series

## Existing headline CPI source

Reuse:

```text
CPIAUCSL
```

This is the seasonally adjusted Consumer Price Index for All Urban Consumers: All Items in U.S. City Average.

The dashboard already uses this source.

Requirements:

- Do not fetch `CPIAUCSL` redundantly.
- Reuse the same provider response during one refresh run for all derived CPI outputs.
- Preserve the existing headline-CPI card and generated data.
- Do not alter the existing year-over-year headline-inflation calculation except where a tested shared derivation is extracted without changing results.

## New core CPI source

Use:

```text
CPILFESL
```

This is the seasonally adjusted Consumer Price Index for All Urban Consumers: All Items Less Food and Energy in U.S. City Average.

Verify the exact current FRED title, units, frequency, seasonal-adjustment metadata, source, and available coverage before generation.

Expected characteristics:

- Monthly
- Seasonally adjusted
- CPI index
- Excludes food and energy
- Published by the U.S. Bureau of Labor Statistics and distributed through FRED

Use the fullest useful available history.

Do not impose an arbitrary year-2000 cutoff.

Fetch the index level.

Do not request `units=pc1`.

Calculate all displayed transformations locally so year-over-year and recent annualized calculations follow one explicit, testable method.

# Why use core CPI

Document the rationale accurately:

- Food and energy prices can be especially volatile.
- Core CPI removes food and energy to show a less volatile measure of underlying price pressure.
- Core CPI is not automatically a better description of household experience because households still buy food and energy.
- Core CPI does not remove every volatile or unusual price category.
- Core CPI is not the Federal Reserve’s preferred PCE inflation measure.

Do not describe core CPI as the “true” inflation rate.

Do not imply that headline inflation is unimportant.

# Card 1: Headline versus core CPI

## Economic question

Use:

```text
Is inflation broad and persistent?
```

## Measures

Plot:

1. Headline CPI inflation
2. Core CPI inflation

Both should be year-over-year percent changes.

## Headline CPI formula

For month `t`:

```text
headline CPI inflation =
((headline CPI level at t / headline CPI level at t-12) - 1) × 100
```

This should remain consistent with the existing headline-inflation output.

## Core CPI formula

For month `t`:

```text
core CPI inflation =
((core CPI level at t / core CPI level at t-12) - 1) × 100
```

Requirements for both:

- Require the exact calendar month 12 months earlier.
- Do not substitute by array position when months are missing.
- Do not bridge gaps.
- Return `null` when the required prior observation is unavailable.
- Preserve full reasonable precision in JSON.
- Do not round before completing calculations.
- Preserve positive, negative, and zero values.
- Exclude future-dated observations.

## Suggested metadata

Use accurate final wording based on verified sources.

Suggested card configuration:

```text
slug: headline-versus-core-inflation
title: Headline Versus Core CPI
shortTitle: Headline vs. core
question: Is inflation broad and persistent?
frequency: monthly
units: Percent
transformation: Percent change from year ago
```

## Primary callout

Use the latest core CPI inflation rate as the primary number:

```text
Latest core CPI inflation
```

Include the latest shared observation month.

Also show the latest headline CPI inflation nearby as a secondary comparison.

Requirements:

- Use one decimal place unless existing conventions justify another choice.
- Do not label either result good, bad, high, low, healthy, or unhealthy.
- Do not say core inflation proves inflation is persistent.
- If the latest shared month differs from the newest observation in the standalone headline card, use the latest month available for both comparison lines and disclose that alignment.

## Comparison chart

Plot two lines on one shared percentage axis:

1. Headline CPI inflation
2. Core CPI inflation

Requirements:

- Use monthly dates.
- Use one shared y-axis.
- Do not use dual axes.
- Include zero in the visible range.
- Preserve the existing zero reference line.
- Do not smooth lines.
- Do not interpolate missing values.
- Keep the two lines distinguishable without relying only on color.
- Include a concise legend.
- Use a common aligned date range.
- Do not add a target line.
- Do not add recession shading.
- Do not shade the space between lines.

## Tooltip

Show:

```text
June 2026
Headline CPI inflation: 2.4%
Core CPI inflation: 2.8%
Difference: +0.4 percentage points
```

Use actual generated values.

Requirements:

- Calculate the difference as core minus headline.
- Label the difference in percentage points, not percent.
- Preserve full precision in generated data but format consistently.
- Handle unavailable values clearly.
- Do not inject unsafe HTML.

## Accessible summary

At minimum report:

- Latest shared month
- Latest headline CPI inflation
- Latest core CPI inflation
- Difference in percentage points
- Highest and lowest core CPI inflation in the selected range
- Whether core CPI was above or below headline CPI in the latest month

Use factual wording.

Do not infer causation from the gap.

## Explanatory copy

### What this tells you

Use wording based on:

```text
Headline CPI includes the full consumer basket. Core CPI excludes food and energy, which can be especially volatile. Comparing them helps show whether recent inflation is concentrated in those categories or is also present across the rest of the basket.
```

### What this leaves out

Use wording based on:

```text
Core CPI still includes many categories that can move unevenly, and excluding food and energy does not make those costs irrelevant to households. CPI is a national average and may not match an individual household’s expenses.
```

## Recent observations table

Show the latest 12 aligned months.

Columns:

- Observation month
- Headline CPI inflation
- Core CPI inflation
- Core minus headline

Requirements:

- Use semantic HTML.
- Use a meaningful caption.
- Display newest months first.
- Format the difference in percentage points.
- Preserve unavailable values.
- Do not calculate values inside the table component.
- Remain usable at narrow widths using the existing disclosure and overflow pattern.

# Card 2: Recent inflation momentum

## Economic question

Use:

```text
Is inflation currently accelerating or slowing?
```

## Measures

Plot:

1. Three-month annualized headline CPI inflation
2. Three-month annualized core CPI inflation

Do not use year-over-year inflation as the main chart lines on this card.

The purpose is to provide a more responsive but noisier measure of current momentum.

## Formula

For index level `P` at month `t`:

```text
three-month annualized inflation =
((P_t / P_(t-3))^4 - 1) × 100
```

Use the exact ratio formula.

Requirements:

- Require the exact calendar month three months earlier.
- Do not substitute the third previous array item across missing months.
- Do not bridge gaps.
- Do not calculate from already-rounded monthly changes.
- Do not approximate by multiplying a three-month percentage change by four.
- Preserve full reasonable precision in JSON.
- Return `null` when a required level is unavailable.
- Preserve positive, negative, and zero values.
- Exclude future-dated observations.

## Why three months

Document:

- A three-month annualized rate reacts faster than a 12-month rate.
- Annualization expresses the recent three-month pace as though it continued for a full year.
- It is not a forecast.
- It is substantially noisier than year-over-year inflation.
- Base effects and one-off monthly changes can still distort interpretation.

Do not describe the annualized rate as what inflation “will be” over the next year.

## Suggested metadata

Suggested card configuration:

```text
slug: recent-inflation-momentum
title: Recent Inflation Momentum
shortTitle: Inflation momentum
question: Is inflation currently accelerating or slowing?
frequency: monthly
units: Percent
transformation: Three-month annualized percent change
```

## Primary callout

Use:

```text
Latest three-month annualized core inflation
```

Include the latest shared month.

Show the corresponding headline rate as a secondary comparison.

Requirements:

- Use one decimal place unless existing conventions justify another choice.
- Preserve signed formatting for negative values.
- Do not characterize the rate as good, bad, hot, cool, sticky, transitory, or alarming.
- Clearly label the value as annualized.

## Comparison chart

Plot:

1. Headline CPI, three-month annualized
2. Core CPI, three-month annualized

Requirements:

- Use one shared percentage axis.
- Do not use dual axes.
- Include zero.
- Preserve the zero reference line.
- Use monthly dates.
- Do not smooth.
- Do not interpolate.
- Preserve null gaps.
- Use distinguishable line treatments and a concise legend.
- Do not add the year-over-year series as extra lines.
- Do not add a 2% target line.
- Do not add recession shading.
- Do not clamp or hide volatile observations.

## Time ranges

Reuse:

- 5 years
- 10 years
- 20 years
- Maximum

Requirements:

- Preserve the existing default range.
- Anchor ranges to the latest shared valid observation.
- Filter both lines identically.
- Maximum should use the full aligned history available after the three-month warm-up.
- Existing cards’ range behavior must remain unchanged.

## Tooltip

Show:

```text
June 2026
Headline CPI, 3-month annualized: 1.9%
Core CPI, 3-month annualized: 2.6%
```

Requirements:

- Clearly include “3-month annualized.”
- Use actual generated values.
- Handle nulls clearly.
- Do not show raw index levels by default.

## Accessible summary

At minimum report:

- Latest headline three-month annualized rate
- Latest core three-month annualized rate
- Latest shared month
- Highest and lowest core momentum rate in the selected range
- Whether the latest core momentum rate is above or below its value three months earlier, when both values exist

Use factual language such as:

```text
The latest three-month annualized core CPI rate was 2.6%, compared with 3.1% three months earlier.
```

Do not automatically translate that comparison into “accelerating” or “slowing” unless the wording explicitly defines it as the mathematical direction of this measure.

## Explanatory copy

### What this tells you

Use wording based on:

```text
Three-month annualized inflation reacts more quickly than a year-over-year rate. It shows the pace implied by price changes over the latest three months if that pace continued for a full year.
```

### What this leaves out

Use wording based on:

```text
This measure is not a forecast and can move sharply because of a few unusual months. Year-over-year inflation provides a more stable view, while the three-month annualized rate provides a more responsive one.
```

## Recent observations table

Show the latest 12 aligned months.

Columns:

- Observation month
- Headline CPI, three-month annualized
- Core CPI, three-month annualized

Requirements:

- Use semantic HTML.
- Use a meaningful caption.
- Display newest months first.
- Use consistent percentage formatting.
- Preserve unavailable values.
- Do not calculate inside the table component.
- Remain usable on narrow screens.

# Generated files

Generate and commit:

```text
src/features/economic-series/data/core-cpi-inflation.json
src/features/economic-series/data/headline-cpi-three-month-annualized.json
src/features/economic-series/data/core-cpi-three-month-annualized.json
```

The existing file for headline CPI year-over-year inflation must remain the canonical headline year-over-year output.

Requirements:

- Every file must pass existing runtime validation.
- Observations must be monthly and chronological.
- Use full useful available history.
- Begin only after the required warm-up period.
- Preserve missing values as `null`.
- Include accurate provider and transformation metadata.
- Include retrieval timestamps.
- Include trailing newlines.
- Be generated through `npm run data:refresh`.
- Never be manually edited after generation.

If relationship-card configuration is stored separately, keep it small and presentation-focused.

Do not create duplicate copies of the same underlying observation series merely for two cards.

# Refresh architecture

Extend the existing explicit refresh pipeline.

During one refresh run:

1. Fetch `CPIAUCSL` once.
2. Fetch `CPILFESL` once.
3. Validate both provider responses.
4. Normalize and exclude future observations.
5. Derive existing headline year-over-year CPI without changing its values.
6. Derive core year-over-year CPI.
7. Derive headline three-month annualized CPI.
8. Derive core three-month annualized CPI.
9. Build validated domain objects.
10. Safely replace related outputs.

Requirements:

- Do not fetch either source more than once.
- Keep derivation logic out of React.
- Use pure testable functions.
- Prefer shared calendar-aware derivation utilities.
- Do not create a general formula engine.
- Do not use array offsets as substitutes for exact dates.
- Do not add a new provider API.

## Atomic output behavior

Treat all CPI-derived outputs affected by this refresh as a consistent group if the current architecture permits doing so safely.

At minimum, the three new files must update as one rollback-protected group.

If refactoring the existing headline CPI file into the same group is low-risk and well-tested, include it so all four derived CPI datasets share one source snapshot.

Otherwise:

- Preserve existing headline-CPI behavior.
- Group the three new outputs.
- Document why the existing file remains outside that group.

On failure:

- Preserve all previously valid grouped files.
- Do not leave partially updated CPI outputs.
- Clean temporary files where practical.
- Preserve unrelated successful series according to the current partial-success policy.

# Domain model and provenance

Preserve the existing observation shape.

For each generated series:

- Identify the original provider series.
- Distinguish provider index level from locally derived inflation rate.
- Identify transformation and annualization explicitly.
- Do not imply FRED directly publishes the exact locally derived annualized series.

If Story 10 introduced multi-source or relationship provenance structures, reuse them rather than creating a competing pattern.

Do not put chart configuration in the economic-series domain model.

# Repository and card loading

Extend the repository for:

```text
core-cpi-inflation
headline-cpi-three-month-annualized
core-cpi-three-month-annualized
```

Requirements:

- Components must not import JSON directly.
- Unknown slugs continue returning `null`.
- Preserve asynchronous loading.
- Each relationship card should load its required datasets as one card-level unit.
- The standalone headline CPI card must remain independently functional.
- One new card’s failure must not block the other new card.
- Prices failures must not block Growth or Employment and income.

# Shared comparison-chart architecture

Reuse the comparison-chart boundary introduced for wages versus inflation.

Generalize only where needed.

Requirements:

- Preserve existing single-series charts.
- Preserve the wages-versus-inflation comparison.
- Support two aligned lines with shared units.
- Use one shared percentage axis.
- Preserve lazy loading and ECharts deduplication.
- Avoid creating CPI-specific chart internals when a small reusable configuration is sufficient.
- Do not create a generalized dashboard query language.
- Do not add dual-axis support.

# Testing

Preserve all existing tests.

Normal tests must not contact live FRED.

Add focused deterministic tests.

## Source configuration tests

Test:

- `CPILFESL` is configured correctly.
- It uses monthly frequency.
- It uses full-history retrieval.
- It does not request `pc1`.
- `CPIAUCSL` is not fetched redundantly.
- `CPILFESL` is fetched once.
- Existing headline CPI configuration remains correct.

## Year-over-year derivation tests

Test:

- Exact 12-month headline and core calculations.
- Missing exact prior-year month returns `null`.
- Gaps are not bridged.
- Positive, negative, and zero values are preserved.
- Future observations are excluded.
- Inputs are not mutated.
- Existing headline CPI generated values remain unchanged for deterministic fixtures.

## Three-month annualized derivation tests

Test the exact formula:

```text
((P_t / P_(t-3))^4 - 1) × 100
```

Include cases where:

- Prices rise.
- Prices fall.
- Prices do not change.
- The exact three-month-prior observation is missing.
- An intermediate month is missing.
- A required value is null.
- The input contains future dates.
- Inputs are not mutated.

Include at least one assertion proving the implementation does not simply multiply the three-month percentage change by four.

Require a continuous four-month sequence so the measure is genuinely based on a three-month span with no internal data gap.

## Alignment tests

Test:

- Headline and core series align by exact calendar month.
- Array position is never treated as date equality.
- The latest shared month is selected.
- Both card lines use identical selected ranges.
- Different source end dates do not create a misleading partial comparison.

## Atomic-output tests

Test:

- New CPI files update only after all grouped outputs validate.
- Failure in any grouped output preserves previous valid files.
- Temporary files are handled safely.
- Unrelated series retain existing partial-success behavior.

## Repository and model tests

Test:

- All new slugs load.
- Existing slugs continue loading.
- Transformation metadata validates.
- Provider provenance remains accurate.
- Unknown slugs return `null`.

## Comparison-chart tests

Mock ECharts according to existing conventions.

Test:

- Two lines render for each new card.
- Both lines use one y-axis.
- Zero is included.
- No dual axis is created.
- Missing observations remain gaps.
- Legends are clear.
- Existing wage comparison remains unchanged.
- Existing single-series charts remain unchanged.

## Range and summary tests

Test:

- 5Y, 10Y, 20Y, and Maximum filter aligned lines identically.
- Maximum returns all valid shared history.
- Latest values and differences are correct.
- Difference is formatted as percentage points.
- Three-month comparison with the value three months earlier is correct.
- Selected-range extrema are correct.
- Tie behavior remains consistent.
- Inputs are not mutated.

## Dashboard tests

Test:

- Prices section order is:
  1. Headline CPI inflation
  2. Headline versus core CPI
  3. Recent inflation momentum
- Both human questions render.
- Primary and secondary values render.
- Existing headline CPI card remains present.
- No PCE card is added.
- No CPI category breakdown is added.
- Growth and Employment and income remain unchanged.

## Failure isolation tests

Test:

- Headline-versus-core failure does not block momentum.
- Momentum failure does not block headline-versus-core.
- Either failure does not block the existing headline CPI card.
- Prices failures do not block other sections.

## Accessibility tests

Test:

- Each comparison chart has a distinct accessible label.
- Both line names are available to assistive technology.
- Range controls have card-specific context.
- Factual summaries include the latest values.
- Recent tables are semantic and accessible.
- Percentage-point differences have understandable accessible text.
- Heading hierarchy remains valid.

Do not use large snapshots.

# Documentation

Update `README.md` with:

- Core CPI as a supported source.
- Headline-versus-core comparison.
- Three-month annualized momentum.
- Source identifiers.
- Exact formulas.
- Generated file locations.
- Historical coverage.
- Limitations of core CPI and short-term annualization.

Update:

```text
docs/data-refresh.md
```

Document:

- `CPIAUCSL` reuse.
- `CPILFESL` request parameters.
- Full-history retrieval.
- Exact year-over-year formula.
- Exact three-month annualized formula.
- Calendar alignment and gap behavior.
- Grouped atomic writes.
- Refresh output reporting.

Update:

```text
docs/data-model.md
```

Only as needed to clarify:

- Multiple locally derived outputs from one provider series.
- Annualization metadata.
- Relationship-card data composition.

Update:

```text
docs/charting.md
```

Document:

- Reuse of shared-axis comparison charts.
- Legends and line distinctions.
- Difference tooltips.
- Common aligned ranges.
- No dual axes.

Update:

```text
docs/product-principles.md
```

Clarify:

- Stable and responsive inflation measures answer different questions.
- Core measures should not be presented as household cost-of-living replacements.
- Annualized short-term rates are not forecasts.

Update Epic 02’s story map:

- Mark Story 12 complete after successful implementation.
- Do not alter later scope.

# Dependencies and bundle constraints

Do not add new runtime dependencies unless strictly necessary.

Do not add:

- A date library
- A statistics library
- A dataframe library
- A database
- A backend
- A state-management library

Do not duplicate ECharts.

All charts must continue using the shared deferred ECharts chunk.

Report:

- Initial application chunk size
- Shared chart/ECharts chunk size
- New data-file or lazy-chunk sizes
- Whether ECharts remains deduplicated
- Whether the existing deferred-chunk warning remains

Do not optimize ECharts in this story.

Do not raise Vite’s warning threshold.

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

1. Prices renders:
   - Headline CPI inflation
   - Headline versus core CPI
   - Recent inflation momentum
2. Cards appear in the specified order.
3. The existing headline CPI card remains unchanged.
4. Latest values and months match generated JSON.
5. Both new charts contain two lines.
6. Both use one shared axis.
7. Zero and the zero reference line remain visible.
8. No dual axis appears.
9. Tooltips display the correct measures and units.
10. The headline-versus-core tooltip shows a percentage-point difference.
11. The momentum tooltip clearly says three-month annualized.
12. All four time ranges work independently.
13. Maximum uses full aligned history.
14. Accessible summaries update correctly.
15. Recent tables show 12 aligned months.
16. Existing cards remain functional.
17. Card failures remain isolated.
18. Desktop and narrow-width layouts remain usable.
19. No browser request is made to FRED.
20. ECharts remains in one shared deferred chunk.
21. The 404 route still works.
22. There are no uncaught browser console errors.
23. The development server is stopped after verification.

Independently verify at least:

- Three core-CPI year-over-year observations
- Three headline three-month annualized observations
- Three core three-month annualized observations

Include:

- One ordinary recent observation
- One negative or unusually low momentum observation, if available
- One historically high inflation observation

For every sample, compare:

- Current source index
- Required prior index
- Exact formula
- Calculated result
- Generated JSON result

Report calculations in the completion response.

# Git and story completion

Follow the repository-wide Story Completion rules in `AGENTS.md`.

After verification:

1. Inspect `git status`.
2. Inspect the staged diff.
3. Confirm no `.env` file, API key, temporary file, raw provider response, debug output, or unrelated change is included.
4. Create one focused conventional-style commit.

Suggested commit message:

```text
feat: add core inflation and momentum
```

5. Push the completed commit to the configured GitHub upstream branch.
6. Do not force-push.
7. Confirm the local branch is synchronized with the remote.
8. Confirm the working tree is clean.
9. Do not begin Story 13.

Before committing and pushing, confirm:

- All new outputs were generated through `npm run data:refresh`.
- Economic values were not manually edited.
- `CPIAUCSL` and `CPILFESL` were each fetched once.
- Exact calendar-month formulas are used.
- Exact annualization is used.
- Existing headline CPI results remain correct.
- No PCE or category-level inflation work was added.
- No presentation redesign was included.
- No database or runtime backend was added.
- Temporary files are absent.
- `AGENTS.md` and the `epics` directory remain intact.

If pushing fails:

- Do not use destructive Git commands.
- Preserve the verified local commit.
- Report the exact failure.
- Explain what user action is required.

# Completion response

Report:

1. What was created
2. Exact FRED request parameters for both source series
3. How headline CPI was reused without redundant fetching
4. Source coverage and observation counts
5. Generated core year-over-year coverage and count
6. Generated headline momentum coverage and count
7. Generated core momentum coverage and count
8. Latest headline and core year-over-year rates
9. Latest headline and core three-month annualized rates
10. Nine independently verified sample calculations
11. Calendar-alignment and gap behavior
12. Annualization implementation
13. Grouped atomic-write behavior
14. Comparison-chart reuse
15. Tooltip and accessible-summary behavior
16. Tests added and results
17. Browser-verification results
18. Bundle sizes and ECharts deduplication result
19. Architectural decisions or deviations
20. Commit hash and commit message
21. Branch name
22. GitHub remote used
23. Push result
24. Final working-tree status
25. Relevant resulting file structure
26. Concerns or useful questions to consider before Story 13

Do not add PCE inflation.

Do not add CPI category breakdowns.

Do not add housing affordability.

Do not add household indicators.

Do not add forecasts.

Do not add recession shading.

Do not add historical-vintage tracking.

Do not redesign the cards.

Do not begin Story 13.
