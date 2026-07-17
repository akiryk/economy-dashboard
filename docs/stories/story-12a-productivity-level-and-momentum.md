# Story 12A: Clarify productivity momentum and add productivity level

You are working in the existing `economy-dashboard` repository.

Stories 01 through 12 are complete, committed, and pushed to GitHub. A separate household Story 13 has been drafted but has not yet been implemented. Implement this story first.

Read and follow:

- `AGENTS.md`
- Epic 02: Build the Phase 1 U.S. Economy Dashboard
- Existing documentation in `docs/`

Implement Story 12A only.

## Goal

Improve the Growth section’s treatment of labor productivity by:

1. Reframing the existing productivity-growth card so its title, question, primary callout, tooltip, and explanatory copy clearly describe productivity **growth momentum**.
2. Adding a second productivity card that shows the long-run **productivity level**.

The cards should answer different questions:

- **How much more productive is the economy than in the past?**
- **Are productivity gains revving up or slowing down?**

Do not redesign the dashboard. Do not add business investment, forecasts, recession shading, historical vintages, percentile context graphics, or household indicators.

## Dashboard placement

Use this Growth-section order:

1. Real GDP growth
2. Real GDP per capita
3. Productivity over time
4. Productivity growth momentum

Do not create a new section or move unrelated cards.

## Source

Reuse the existing official FRED series:

```text
OPHNFB
```

This is nonfarm business-sector labor productivity, measured as output per hour.

Requirements:

- Fetch `OPHNFB` once per refresh.
- Preserve the current full-history policy.
- Preserve current source attribution and metadata.
- Preserve the existing locally derived year-over-year productivity-growth values.
- Do not change to another productivity concept.
- Verify the exact current FRED title, units, frequency, seasonal adjustment, source, and coverage during implementation.

# Card 1: Productivity over time

## Economic question

Use:

```text
How much more productive is the economy than in the past?
```

## Measure

Use the published `OPHNFB` level.

Do not make the provider’s arbitrary index base year the main user-facing interpretation. Instead, normalize the selected range to 100 at its first valid observation.

For each selected range:

```text
normalized productivity index =
(productivity level / first valid productivity level in selected range) × 100
```

```text
cumulative productivity change =
((latest productivity level / first valid productivity level in selected range) - 1) × 100
```

Requirements:

- Normalize only for presentation.
- Persist the canonical published `OPHNFB` level, not range-specific normalized values.
- Recalculate normalization whenever the active range changes.
- Use the first valid observation within the selected range as the baseline.
- Preserve null gaps and never bridge missing quarters.
- Do not mutate canonical observations.
- Return unavailable output when no valid baseline exists.

## Suggested metadata

```text
slug: labor-productivity-level
title: Productivity Over Time
shortTitle: Productivity level
question: How much more productive is the economy than in the past?
frequency: quarterly
units: Index
transformation: Published level, normalized to 100 at the selected-range start for display
```

## Primary callout

Use wording such as:

```text
+18.4%
Productivity is higher than at the start of the selected 10-year period
```

For Maximum, use:

```text
Productivity is higher than at the start of the available series
```

Requirements:

- Use the actual selected-range calculation.
- Use one decimal place unless existing conventions justify otherwise.
- Use signed formatting for cumulative change.
- Do not characterize the result as good, bad, strong, weak, or healthy.
- Do not imply every worker personally became that much more productive.

## Chart

Display one normalized line.

Requirements:

- First valid point in the active range equals 100.
- Use quarterly dates.
- Do not force zero into the y-axis.
- Do not show a zero reference line.
- Do not smooth or interpolate.
- Preserve null gaps.
- Do not add a trend line, recession shading, or percentile bands.
- Preserve responsiveness, lazy loading, cleanup, and ECharts deduplication.

## Tooltip

Use wording such as:

```text
2000 Q3
Productivity index, selected-range baseline = 100: 114.2
Change since selected-range start: +14.2%
```

## Accessible summary

Report at minimum:

- Baseline quarter
- Latest quarter
- Cumulative productivity change over the selected range
- Lowest and highest normalized values and quarters
- Valid observation count where currently supported

## Explanatory copy

### What this tells you

Use wording based on:

```text
Labor productivity measures inflation-adjusted output per hour worked in the nonfarm business sector. This chart shows how the productivity level has changed over the selected period, with the first observation set to 100.
```

### What this leaves out

Use wording based on:

```text
The index does not show how productivity gains are distributed between workers and business owners. It also excludes government, farms, households, and some other activity outside the nonfarm business sector.
```

## Recent observations

Show the latest eight valid quarters.

Columns:

- Observation quarter
- Normalized productivity index
- Change from selected-range start

Use semantic HTML, newest first, consistent formatting, and the existing narrow-screen overflow pattern. Calculate values outside the table component.

# Card 2: Productivity growth momentum

This is the existing productivity-growth card, revised for accurate interpretation.

## Economic question

Replace the current question with:

```text
Are productivity gains revving up or slowing down?
```

## Card title

Use:

```text
Productivity Growth Momentum
```

Suggested short title:

```text
Productivity momentum
```

Do not retain `Is the economy producing more per hour worked?` for this growth-rate card.

## Existing measure

Preserve the existing exact-quarter year-over-year calculation:

```text
productivity growth =
((productivity index at quarter t / productivity index at quarter t-4) - 1) × 100
```

Do not change generated economic values, full-history coverage, gap handling, quarterly frequency, or range behavior.

## Primary callout

Use a direct sentence:

```text
Productivity is 3.0% higher than a year ago
```

Use the actual value and quarter.

Requirements:

- Positive means the productivity level is higher than a year earlier.
- Negative means it is lower than a year earlier.
- A falling line above zero must not be described as falling productivity.

## Momentum comparison

Compare the latest year-over-year growth rate with the rate exactly four quarters earlier:

```text
momentum change =
latest year-over-year productivity growth
- year-over-year productivity growth four quarters earlier
```

Display in percentage points.

Examples:

```text
The pace of productivity growth has accelerated by 1.2 percentage points from a year earlier.
```

```text
The pace of productivity growth has slowed by 1.2 percentage points from a year earlier.
```

```text
The pace of productivity growth is unchanged from a year earlier.
```

Requirements:

- Match exact quarters, not array positions.
- Omit the sentence if the comparison quarter is unavailable.
- Treat this as descriptive, not predictive.
- Keep acceleration/slowing explicitly tied to the growth rate, not the productivity level.

## Chart

Preserve the existing year-over-year growth chart.

Requirements:

- Include zero and the zero reference line.
- Use quarterly dates.
- Do not smooth or interpolate.
- Preserve null gaps and all current ranges.
- Do not add the level as a second line.
- Do not add dual axes, recession shading, a trend line, or percentile context.

## Tooltip

Use unambiguous wording:

```text
2000 Q3
Productivity was 3.0% higher than one year earlier
```

Optionally include the growth-pace change when available and readable.

## Accessible summary

Report at minimum:

- Latest year-over-year productivity growth and quarter
- Whether productivity was higher or lower than one year earlier
- Whether the growth rate accelerated or slowed versus four quarters earlier
- The momentum change in percentage points
- Highest and lowest growth in the selected range
- Below-zero status
- Valid observation count where supported

## Explanatory copy

### What this tells you

Use wording based on:

```text
Labor productivity measures output per hour worked. This chart shows how quickly productivity is changing from a year earlier. A positive value means output per hour is still increasing. A rising line means those gains are accelerating, while a falling line means they are slowing.
```

Add explicitly:

```text
A downward-moving line above zero does not mean productivity is falling; it means productivity is still increasing, but at a slower rate.
```

### What this leaves out

Use wording based on:

```text
Short-term productivity growth is volatile because output and hours can change at different speeds during recessions, recoveries, and major disruptions. Technological and organizational improvements matter, but their long-run effect is easier to see in the productivity-level card.
```

## Recent observations

Show the latest eight valid quarters.

Columns:

- Observation quarter
- Productivity growth from a year earlier
- Change in growth pace from a year earlier

Use semantic HTML, newest first, percentage-point formatting for momentum, and calculate values outside the table component.

# Generated data

If the canonical `OPHNFB` level is not already persisted, add:

```text
src/features/economic-series/data/labor-productivity-level.json
```

Preserve:

```text
src/features/economic-series/data/labor-productivity-growth.json
```

Requirements:

- Fetch `OPHNFB` once.
- Generate or preserve both outputs from that response.
- The level file contains published provider values.
- The growth file contains the existing year-over-year derivation.
- Both pass runtime validation.
- Both are chronological and include full useful history.
- Future observations are excluded.
- Missing values remain `null`.
- Metadata distinguishes published level from locally derived growth.
- Both include retrieval timestamps and trailing newlines.
- Generate through `npm run data:refresh` only.

## Atomic output behavior

Treat level and growth files as one rollback-protected output group.

If either fails retrieval, normalization, derivation, validation, serialization, or writing:

- Preserve both previously valid files.
- Do not leave one updated and one stale.
- Clean temporary files where practical.
- Preserve unrelated partial-success behavior.

# Presentation-data utilities

Add pure, tested utilities for:

1. Normalizing a selected range to 100
2. Calculating cumulative change from the selected-range start
3. Comparing growth momentum by exact quarter

Requirements:

- Do not mutate inputs.
- Preserve null gaps.
- Use exact calendar-quarter arithmetic.
- Handle missing or invalid baselines safely.
- Keep utilities independent of ECharts.
- Do not create a generalized analytics framework.

# Repository and loading

Extend the repository only as needed to expose the level series.

Requirements:

- Components do not import JSON directly.
- Unknown slugs continue returning `null`.
- Preserve asynchronous loading.
- Load both cards independently.
- Failure of one productivity card must not block the other or any unrelated section.

# Shared chart architecture

Reuse the existing single-series chart boundary.

Support configuration for:

- Level/index chart without forced zero
- Growth-rate chart with forced zero and zero line

Do not create a productivity-specific chart engine or add a new chart library.

# Testing

Preserve all existing tests. Normal tests must not call live FRED.

Add focused deterministic tests.

## Refresh and source tests

Test:

- `OPHNFB` is fetched once.
- Published level output is preserved accurately.
- Existing year-over-year growth values remain unchanged.
- Both outputs use full-history retrieval.
- Both preserve correct provider metadata.
- Both update atomically.

## Range-normalization tests

Test:

- First valid selected-range observation becomes 100.
- Later values normalize correctly.
- Excluded earlier observations do not affect the baseline.
- Leading nulls are skipped to the first valid baseline.
- Internal null gaps remain null.
- Invalid or zero baselines are handled safely.
- 5Y, 10Y, 20Y, and Maximum have independent baselines.
- Inputs are not mutated.

## Cumulative-change tests

Test positive, negative, zero, missing-baseline, missing-latest, and non-mutating cases.

## Momentum tests

Test:

- Acceleration
- Slowing
- Unchanged growth
- Missing exact comparison quarter
- No array-position substitution
- Correct percentage-point units
- Inputs are not mutated

## Chart tests

Level chart:

- One normalized line
- First visible point equals 100
- Range changes renormalize
- Zero is not forced
- No zero reference line
- Nulls remain gaps

Momentum chart:

- Existing economic values remain unchanged
- Zero remains included
- Zero reference line remains
- Tooltip states change from a year earlier
- No second level line or dual axis

## Dashboard tests

Verify Growth order:

1. Real GDP growth
2. Real GDP per capita
3. Productivity over time
4. Productivity growth momentum

Verify both questions, both callouts, exact momentum context, no business-investment card, and unchanged later sections.

## Accessibility tests

Verify distinct chart labels, card-specific range context, understandable summaries, semantic tables, percentage-point wording, and valid heading hierarchy.

Do not use large snapshots.

# Documentation

Update `README.md`, `docs/data-refresh.md`, `docs/data-model.md`, `docs/charting.md`, and `docs/product-principles.md` as needed to document:

- Level versus growth
- One `OPHNFB` fetch
- Published level versus locally derived growth
- Selected-range normalization to 100
- Cumulative selected-range change
- Exact-quarter momentum comparison
- Why the level chart does not force zero
- Why the growth chart does
- Why a falling positive growth line does not mean falling productivity

Update Epic 02’s story map by adding this as an inserted productivity-clarification story. Preserve the drafted household story as the next story. Renumber later stories only if repository conventions require it.

# Dependencies and bundle constraints

Do not add a date library, statistics library, dataframe library, database, backend, state-management library, or chart library.

Keep ECharts deduplicated in the existing shared deferred chunk. Report bundle sizes and whether the existing warning remains.

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

Then verify in a real browser:

1. Both productivity cards render in the required order.
2. The level chart shows a generally rising long-run level.
3. Every active range starts at normalized 100.
4. The cumulative-change callout updates with the range.
5. The level chart does not force zero or show a zero line.
6. The growth chart preserves existing values.
7. Its callout says productivity is higher or lower than a year ago.
8. A downward positive line is described as slower growth, not falling productivity.
9. Acceleration/slowing matches exact-quarter calculations.
10. The growth chart includes zero and its zero line.
11. Tooltips are unambiguous.
12. Tables show eight quarterly observations.
13. Failures remain isolated.
14. No browser request is made to FRED.
15. `OPHNFB` is fetched once during refresh.
16. ECharts remains deduplicated.
17. The 404 route works.
18. There are no uncaught console errors.
19. The development server is stopped.

Independently verify:

- Three normalization calculations
- Three cumulative-change calculations
- Three momentum calculations

Include a 5-year range, a 20-year range, Maximum, one accelerating observation, one slowing observation, and one unchanged or nearly unchanged observation if available.

# Git and story completion

Follow `AGENTS.md`.

Suggested commit:

```text
feat: clarify productivity level and momentum
```

Push without force, confirm synchronization and a clean tree, and do not begin the household story.

Before committing, confirm:

- `OPHNFB` was fetched once.
- Existing productivity-growth values did not change.
- Published level data is accurate.
- Range normalization is not persisted.
- Exact-quarter comparisons are used.
- No business-investment, household, percentile, or unrelated redesign work was added.
- No secrets or temporary files are included.

# Completion response

Report:

1. What changed
2. Final card titles and questions
3. How the level card works
4. How active-range normalization works
5. How cumulative change works
6. How the growth card was reframed
7. How acceleration/slowing is calculated
8. Confirmation that existing growth values did not change
9. Source and output coverage
10. Nine independent calculation checks
11. Missing-value and exact-quarter behavior
12. Atomic-write behavior
13. Chart and accessibility changes
14. Tests and browser verification
15. Bundle sizes and ECharts deduplication
16. Architectural decisions or deviations
17. Commit, branch, remote, push result, and working-tree status
18. Relevant resulting file structure
19. Concerns before the household story

Do not add business investment, household indicators, forecasts, recession shading, historical vintages, percentile context graphics, or unrelated redesign work. Do not begin the household story.
