# Story 11: Add productivity and real GDP per capita

You are working in the existing `economy-dashboard` repository.

Stories 01 through 10 are complete, committed, and pushed to GitHub.

Read and follow:

- `AGENTS.md`
- Epic 02: Build the Phase 1 U.S. Economy Dashboard
- Existing documentation in `docs/`

Implement Story 11 only.

## Goal

Add two complementary indicators to the existing Growth section:

1. Real GDP per capita
2. Labor productivity

These cards should help answer:

- Is economic output growing faster than the population?
- Is the economy producing more per hour worked?

Do not redesign the dashboard.

Do not add business investment, core inflation, household indicators, forecasts, recession shading, historical vintages, or automated relationship analysis in this story.

---

## Dashboard placement

In the existing Growth section, use this order:

1. Real GDP growth
2. Real GDP per capita
3. Labor productivity

Do not create a new section.

Do not modify Prices or Employment and income except where shared behavior must be generalized.

---

# Indicator 1: Real GDP per capita

## Economic question

Use:

```text
Is economic output growing faster than the population?
```

## Source series

Use the official FRED series:

```text
A939RX0Q048SBEA
```

This is real gross domestic product per capita.

Verify the exact current FRED title, units, source, frequency, and seasonal-adjustment metadata before generation.

Expected characteristics:

- Quarterly
- Inflation-adjusted
- Per person
- Seasonally adjusted at annual rates
- Published by the U.S. Bureau of Economic Analysis and distributed through FRED

Use the fullest useful available history.

Do not impose an arbitrary year-2000 cutoff.

## Display transformation

Display year-over-year percent change.

Preferred implementation:

- Retrieve the published level series.
- Calculate year-over-year growth locally.

Formula:

```text
real GDP per capita growth =
((level at quarter t / level at quarter t-4) - 1) × 100
```

Requirements:

- Require the exact quarter one year earlier.
- Do not substitute the fourth previous array item when calendar quarters are missing.
- Do not bridge gaps.
- Return `null` when the required prior quarter is unavailable.
- Preserve full reasonable precision in JSON.
- Do not annualize the year-over-year rate.
- Do not request a nominal per-capita series.
- Do not use total GDP divided by population when an authoritative per-capita real series is available.

## Suggested metadata

Use accurate final wording based on the verified source.

Suggested values:

```text
slug: real-gdp-per-capita-growth
title: Real GDP Per Capita Growth
shortTitle: Real GDP per capita
question: Is economic output growing faster than the population?
frequency: quarterly
units: Percent
transformation: Percent change from year ago
```

## Primary callout

Show:

```text
Latest real GDP per capita growth
```

Include the latest quarter.

Use one decimal place unless existing conventions justify another choice.

Do not characterize the result as good, bad, strong, weak, healthy, or unhealthy.

## Explanatory copy

### What this tells you

Use wording based on:

```text
Real GDP per capita measures inflation-adjusted economic output per person. Its year-over-year growth rate shows whether output is increasing faster or slower than the population.
```

### What this leaves out

Use wording based on:

```text
Per-capita GDP is an average and does not show how income or output is distributed. It also does not directly measure household well-being, unpaid work, environmental costs, or the quality of public services.
```

## Related indicators

Use plain informational labels such as:

- Real GDP growth
- Productivity
- Real income

Do not create fake links.

---

# Indicator 2: Labor productivity

## Economic question

Use:

```text
Is the economy producing more per hour worked?
```

## Source series

Use the official FRED series:

```text
OPHNFB
```

This is nonfarm business sector labor productivity.

Verify the exact current FRED title, units, source, frequency, and seasonal-adjustment metadata before generation.

Expected characteristics:

- Quarterly
- Index measure of output per hour
- Nonfarm business sector
- Seasonally adjusted
- Published by the U.S. Bureau of Labor Statistics and distributed through FRED

Use the fullest useful available history.

Do not impose an arbitrary year-2000 cutoff.

## Display transformation

Display year-over-year percent change in productivity.

Preferred implementation:

- Retrieve the published index level.
- Calculate year-over-year growth locally.

Formula:

```text
productivity growth =
((index at quarter t / index at quarter t-4) - 1) × 100
```

Requirements:

- Require the exact quarter one year earlier.
- Do not substitute by array position across missing quarters.
- Do not bridge gaps.
- Preserve negative values.
- Return `null` when required inputs are unavailable.
- Preserve full reasonable precision in JSON.
- Do not use quarter-over-quarter annualized productivity growth as the primary card measure.
- Do not silently change to a broader or narrower productivity concept.

## Suggested metadata

Use accurate final wording based on the verified source.

Suggested values:

```text
slug: labor-productivity-growth
title: Labor Productivity Growth
shortTitle: Labor productivity
question: Is the economy producing more per hour worked?
frequency: quarterly
units: Percent
transformation: Percent change from year ago
```

## Primary callout

Show:

```text
Latest labor productivity growth
```

Include the latest quarter.

Use one decimal place unless current conventions justify another choice.

Do not characterize the result as good, bad, strong, weak, healthy, or unhealthy.

## Explanatory copy

### What this tells you

Use wording based on:

```text
Labor productivity measures output per hour worked in the nonfarm business sector. Rising productivity means the economy is producing more output for each hour of labor.
```

### What this leaves out

Use wording based on:

```text
Productivity growth does not show how its gains are distributed between workers and business owners. It also excludes government, farms, households, and some other activity outside the nonfarm business sector.
```

## Related indicators

Use plain informational labels such as:

- Real GDP
- Real wages
- Labor share

Do not create fake links.

---

# Refresh architecture

Extend the existing explicit refresh pipeline to support both new series.

Requirements:

- Fetch each provider series once.
- Reuse existing provider validation.
- Reuse existing future-date filtering.
- Reuse existing domain validation.
- Reuse existing atomic file writing.
- Reuse current full-history policy.
- Keep all derivation logic outside React.
- Use pure, testable transformation functions.
- Do not create a generalized formula language.
- Do not branch on slug throughout unrelated code when configuration can express the transformation.

A small explicit derivation type such as:

```ts
type LocalDerivation =
  | "year-over-year-quarterly-growth";
```

is acceptable if it fits the current design.

If an equivalent derivation already exists, reuse it rather than duplicating logic.

---

# Generated files

Generate and commit:

```text
src/features/economic-series/data/real-gdp-per-capita-growth.json
src/features/economic-series/data/labor-productivity-growth.json
```

Requirements:

- Match the existing validated economic-series model.
- Contain chronological quarterly observations.
- Use full useful available history.
- Begin at the first quarter where a valid year-over-year value can be calculated.
- Exclude future-dated observations.
- Preserve missing values as `null`.
- Include accurate source metadata.
- Include accurate transformation metadata.
- Include retrieval timestamp.
- Include trailing newlines.
- Be generated through `npm run data:refresh`.
- Never be manually edited after generation.

---

# Domain model and provenance

Preserve the existing observation shape.

Do not add chart-specific fields to the domain model.

If Story 10 added multi-source provenance support, do not weaken or duplicate it.

For these two single-source derived series:

- Preserve the original provider series identifier.
- Clearly distinguish provider level from locally calculated year-over-year growth.
- Do not imply FRED directly publishes the application’s exact derived series unless it actually does.

---

# Repository

Extend the local repository registry to support:

```text
real-gdp-per-capita-growth
labor-productivity-growth
```

Requirements:

- React components must not import JSON directly.
- Unknown slugs must continue to return `null`.
- Preserve asynchronous loading.
- Preserve independent card failures.
- Do not add dependency injection.
- Do not add runtime network requests.

---

# Chart behavior

Reuse the existing single-series chart architecture.

For both cards:

- Plot year-over-year percent change.
- Use quarterly dates.
- Do not smooth lines.
- Do not interpolate missing values.
- Preserve full history.
- Keep 5-year, 10-year, 20-year, and maximum controls.
- Anchor ranges to the latest valid observation.
- Include zero in the visible range.
- Show the existing zero reference line.
- Preserve responsive resizing, cleanup, lazy loading, and ECharts deduplication.
- Do not add median lines.
- Do not add trend lines.
- Do not add recession shading.
- Do not add dual axes.

---

# Accessible summaries

Reuse the existing factual summary behavior.

For each new card, report:

- Latest visible value and quarter
- Lowest visible value and quarter
- Highest visible value and quarter
- Whether one or more observations were below zero
- Valid observation count if currently supported

Use percentage formatting.

Do not add interpretation.

Do not say negative productivity growth automatically means recession.

---

# Recent observations

Display the latest eight valid quarterly observations for each new card.

Requirements:

- Use semantic HTML tables.
- Use meaningful captions.
- Show newest observations first.
- Use quarterly date formatting.
- Use consistent percentage formatting.
- Preserve null values as unavailable.
- Remain usable on narrow screens.
- Stay within the existing details/disclosure pattern.

---

# Loading and failure behavior

Load both cards independently.

Requirements:

- GDP-per-capita failure must not prevent total GDP or productivity from rendering.
- Productivity failure must not prevent total GDP or GDP per capita from rendering.
- Growth-section failures must not block Prices or Employment and income.
- Failed cards must remain in their intended section and order.
- Do not add a global state-management library.

---

# Existing presentation

Preserve the current dashboard layout and card design.

Do not:

- Redesign cards
- Shrink charts
- Change section typography
- Replace time-range controls
- Add compact comparison visuals
- Add a dashboard score
- Reorganize existing cards outside the specified Growth ordering
- Add business investment in this story

Small layout changes needed to accommodate the two new cards are acceptable.

---

# Testing

Preserve all existing tests.

Normal tests must not call live FRED.

Add focused deterministic tests.

## Source configuration tests

Test:

- `A939RX0Q048SBEA` is configured correctly.
- `OPHNFB` is configured correctly.
- Both use quarterly frequency.
- Both use full-history retrieval.
- Neither accidentally requests the wrong FRED transformation.
- Each source is fetched once.
- Generated metadata preserves the correct provider series identifier.

## Quarterly year-over-year derivation tests

Test:

- A valid exact four-quarter comparison calculates correctly.
- Fewer than four quarters produces unavailable output.
- Missing exact prior-year quarter produces `null`.
- Gaps are not bridged by array position.
- Positive growth is preserved.
- Negative growth is preserved.
- Zero growth is preserved.
- No premature rounding occurs.
- Inputs are not mutated.
- Future dates are excluded.

Reuse shared derivation tests where appropriate.

## Repository tests

Test:

- Both new slugs load successfully.
- Existing slugs still load.
- Unknown slugs still return `null`.
- Returned frequencies and provider identifiers are correct.

## Chart tests

Mock ECharts internals according to existing conventions.

Test:

- Both charts include zero.
- Both show the zero reference line.
- Missing observations remain gaps.
- Quarterly date formatting remains correct.
- Existing chart behavior for all prior cards remains unchanged.

## Range and summary tests

Test:

- 5Y, 10Y, 20Y, and Maximum work correctly.
- Maximum includes all generated observations.
- Latest, minimum, and maximum values are correct.
- Below-zero reporting remains enabled.
- Tie behavior remains consistent.
- Inputs are not mutated.

## Dashboard tests

Test:

- Growth section order is:
  1. Real GDP growth
  2. Real GDP per capita
  3. Labor productivity
- Both human questions render.
- Both primary values render.
- No business-investment card is added.
- Prices and Employment and income remain unchanged.

## Failure isolation tests

Test:

- GDP-per-capita failure does not block productivity.
- Productivity failure does not block GDP per capita.
- Either new-card failure does not block existing sections.

## Accessibility tests

Test:

- Both charts have distinct accessible labels.
- Range controls have card-specific accessible context.
- Factual summaries are available.
- Recent-observation tables are semantic and accessible.
- Heading hierarchy remains valid.

Do not use large snapshots.

---

# Documentation

Update `README.md` with:

- Real GDP per capita as a supported indicator.
- Labor productivity as a supported indicator.
- Source identifiers.
- Local year-over-year formulas.
- Generated file locations.
- Historical coverage.
- The fact that `npm run data:refresh` now refreshes both new datasets.

Update:

```text
docs/data-refresh.md
```

Document:

- Request parameters for both series.
- Full-history behavior.
- Quarterly year-over-year derivation.
- Exact-quarter alignment.
- Missing-value and gap behavior.
- Refresh output reporting.

Update:

```text
docs/data-model.md
```

Only as needed to clarify:

- Single-source locally derived quarterly growth.
- Provider level versus displayed transformation.
- Provenance behavior.

Update:

```text
docs/charting.md
```

Only if actual chart behavior changes.

Update Epic 02’s story map:

- Mark Story 11 complete after successful implementation.
- Do not change future-story scope.

---

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

All cards must continue sharing the existing deferred ECharts chunk.

Report:

- Initial application chunk size
- Shared chart/ECharts chunk size
- New dataset file or lazy-chunk sizes
- Whether ECharts remains deduplicated
- Whether the existing deferred-chunk warning remains

Do not optimize ECharts in this story.

Do not raise Vite’s warning threshold.

---

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

1. Growth renders:
   - Real GDP growth
   - Real GDP per capita
   - Labor productivity
2. The new cards appear in the correct order.
3. Latest values and quarters match generated JSON.
4. Both charts render.
5. Both include zero and the zero reference line.
6. All four time ranges work independently.
7. Maximum uses the full generated history.
8. Tooltips use correct quarters and percentages.
9. Accessible summaries update correctly.
10. Recent tables show eight quarterly observations.
11. Existing cards remain functional.
12. Card failures remain isolated.
13. Desktop and narrow-width layouts remain usable.
14. No browser request is made to FRED.
15. ECharts remains in one shared deferred chunk.
16. The 404 route still works.
17. There are no uncaught browser console errors.
18. The development server is stopped after verification.

Independently verify at least three generated observations for each new series:

- One positive-growth observation
- One negative-growth observation
- One historically notable observation

For each sample, compare:

- Current source level
- Source level exactly four quarters earlier
- Calculated year-over-year growth
- Generated JSON value

Report the sample calculations in the completion response.

---

# Git and story completion

Follow the repository-wide Story Completion rules in `AGENTS.md`.

After verification:

1. Inspect `git status`.
2. Inspect the staged diff.
3. Confirm no `.env` file, API key, temporary file, raw provider response, debug output, or unrelated change is included.
4. Create one focused conventional-style commit.

Suggested commit message:

```text
feat: add productivity and GDP per capita
```

5. Push the completed commit to the configured GitHub upstream branch.
6. Do not force-push.
7. Confirm the local branch is synchronized with the remote.
8. Confirm the working tree is clean.
9. Do not begin Story 12.

Before committing and pushing, confirm:

- Both new outputs were generated through `npm run data:refresh`.
- Economic values were not manually edited.
- Exact-quarter year-over-year formulas are used.
- Full useful history is included.
- No business-investment or inflation work was added.
- No presentation redesign was included.
- No database or runtime backend was added.
- Temporary files are absent.
- `AGENTS.md` and the `epics` directory remain intact.

If pushing fails:

- Do not use destructive Git commands.
- Preserve the verified local commit.
- Report the exact failure.
- Explain what user action is required.

---

# Completion response

Report:

1. What was created
2. Exact FRED request parameters for both series
3. Source observation coverage and counts
4. Generated GDP-per-capita-growth coverage and count
5. Generated productivity-growth coverage and count
6. Latest value and quarter for each card
7. Six independently verified sample calculations
8. Exact-quarter alignment behavior
9. Missing-value and gap behavior
10. Refresh architecture changes
11. Tests added and results
12. Browser-verification results
13. Bundle sizes and ECharts deduplication result
14. Architectural decisions or deviations
15. Commit hash and commit message
16. Branch name
17. GitHub remote used
18. Push result
19. Final working-tree status
20. Relevant resulting file structure
21. Concerns or useful questions to consider before Story 12

Do not add business investment.

Do not add core inflation.

Do not add household indicators.

Do not add forecasts.

Do not add recession shading.

Do not add historical-vintage tracking.

Do not redesign the cards.

Do not begin Story 12.
