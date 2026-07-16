# U.S. Economy Dashboard — Project Handoff

## Purpose

This document provides a compact, authoritative handoff for continuing the U.S. Economy Dashboard in a fresh AI conversation.

The repository is the source of truth. Before advising, planning, or implementing work, read:

1. `PROJECT_HANDOFF.md`
2. `AGENTS.md`
3. Epic 02
4. Relevant files under `docs/`
5. The current implementation and Git history

Do not infer project status from stale story-map labels alone.

## Current project state

The project is a React and TypeScript U.S. economy dashboard built with Vite and React Router.

It uses:

- FRED as the default economic-data intermediary
- committed local JSON datasets
- runtime validation
- a scripted data-refresh workflow
- Apache ECharts
- lazy-loaded shared chart code
- independent card loading and failure isolation
- accessible summaries and semantic recent-observation tables
- GitHub-backed story completion with verification, commit, and push

The browser does not depend on live FRED requests.

The application is intended to provide a balanced, nonpartisan, historically grounded view of the U.S. economy. It should not collapse the economy into a single score or force mixed indicators into a simplistic good-versus-bad verdict.

## Active epic

The active epic is:

```text
Epic 02: Build the Phase 1 U.S. Economy Dashboard
```

Epic 01, which created the platform and core architecture, is complete.

Epic 03 is provisional and should emerge only after Phase 1 is complete and the dashboard has been reviewed carefully.

## Verified completion status

According to the repository and Codex:

- Stories 01 through 13 are complete.
- Story 12A is also complete.
- Story 13 was completed immediately before Story 12A.
- All completed work has been committed and pushed.

Latest relevant commits:

```text
65cf952 feat: clarify productivity level and momentum
f33bd7b Story 13 implementation commit
```

Current Git state:

```text
Branch: main
Remote branch: origin/main
Status: synchronized
```

The Epic 02 story map is stale.

It still shows Stories 09, 10, and 12 as planned or ambiguous even though their implementation commits exist.

Do not treat those stale labels as evidence that the work remains incomplete.

The next planned Epic 02 story is:

```text
Story 14: Add household financial stress
```

Before or during Story 14, update the Epic 02 story map so completed stories are marked accurately.

## Completed product areas

### Platform and architecture

Completed capabilities include:

- React, TypeScript, Vite, and React Router
- GitHub workflow
- strict type checking and linting
- economic-series domain model
- runtime validation
- local asynchronous repository abstraction
- repeatable FRED refresh
- committed JSON datasets
- safe and grouped atomic output replacement
- lazy-loaded Apache ECharts
- shared time-range controls
- accessible summaries
- semantic recent-observation tables
- independent card failure behavior
- browser verification
- commit-and-push completion workflow

### Growth

Implemented cards include:

- Real GDP growth
- Real GDP per capita growth
- Productivity over time
- Productivity growth momentum

Important interpretation decision:

The productivity level and productivity-growth rate answer different questions.

The productivity-level card shows long-run changes in output per hour and normalizes the first observation in the active range to 100.

The productivity-momentum card shows year-over-year productivity growth and asks:

```text
Are productivity gains revving up or slowing down?
```

A downward line above zero means productivity is still increasing, but at a slower rate. It does not mean the productivity level is falling.

### Prices

Implemented cards include:

- Headline CPI inflation
- Headline versus core CPI
- Recent inflation momentum

Recent inflation momentum uses exact three-month annualized calculations for headline and core CPI.

A documented CPI data gap exists around the 2025 federal-government shutdown. Missing source data creates a longer derived gap where a continuous three-month sequence cannot be calculated. The application should preserve the gap rather than silently bridge it.

### Employment and income

Implemented cards include:

- Unemployment rate
- Prime-age employment-to-population ratio
- Payroll growth
- Wages versus inflation
- Exact real wage growth

Payroll growth currently emphasizes the three-month average monthly change in payroll jobs.

Important open product observation:

Absolute payroll changes are intuitive and news-relevant, but they are less comparable across distant decades because the payroll base has grown.

A possible later companion card would show normalized payroll growth, probably as a three-month annualized percentage of existing payroll employment.

Do not automatically replace the existing absolute payroll card.

### Households

Story 13 is complete.

Implemented cards include:

- Real disposable income per capita versus real consumer spending
- Personal saving rate

The next planned household card is household financial stress.

## Product principles

### Ask human questions

Every card should answer a clear economic question.

Provider series identifiers and technical transformation details belong in metadata and documentation.

### Match the question to the measure

A technically correct measure can still be conceptually misleading if its title or explanatory text asks the wrong question.

The productivity revision is the key precedent.

Before implementation is considered complete, check whether the chart actually answers the question a user will infer from the card.

### Prefer complementary indicators

No single indicator provides a complete verdict.

Related indicators should confirm, qualify, or contradict one another.

### Preserve ambiguity

Mixed evidence should remain mixed.

Do not create a hidden or explicit overall economy score.

### Use visual context

Prefer charts and compact visual context over dense tables or unexplained standalone numbers.

Prominent numeric callouts should be used sparingly.

### Use full useful history

Maximum should show the fullest useful authoritative history for each series.

Different series may begin at different dates.

Do not impose a shared arbitrary start date.

### Preserve provenance

Every card should make it possible to determine:

- source
- provider series identifier
- frequency
- units
- seasonal adjustment
- transformation
- coverage
- retrieval date
- locally derived calculations

### Use FRED by default

Use FRED as the default data intermediary, even when the underlying publisher is BLS, BEA, Census, Treasury, or another agency.

Use another official source only when FRED lacks the appropriate measure, history, timeliness, or detail.

Do not require additional credentials until a specific story proves they are necessary.

Tariff analysis is the most likely Phase 1 area to require a non-FRED official source.

## Story-writing and implementation approach

Continue Epic 02 one story at a time.

Do not ask Codex to complete the entire epic autonomously.

The project benefits from product review after each group of cards because technically valid measures can still be confusing or poorly framed.

Future stories should rely on durable repository context rather than repeating all project rules.

Stable instructions belong in:

- `AGENTS.md`
- Epic 02
- architecture documentation
- test conventions
- data-refresh documentation

A story should focus on:

- the economic question
- source selection
- transformation
- presentation behavior
- unusual edge cases
- story-specific acceptance criteria

Stories should still be provided as downloadable Markdown files.

## Current workflow requirements

For every story:

1. Read `AGENTS.md`.
2. Read Epic 02.
3. Read relevant architecture and data documentation.
4. Inspect the current implementation before choosing an approach.
5. Implement only the active story.
6. Add deterministic tests.
7. Run required lint, type-check, test, refresh, build, and browser checks.
8. Inspect the diff.
9. Commit with a focused message.
10. Push without force.
11. Confirm local and remote branches are synchronized.
12. Leave a clean working tree.
13. Report exact completion details.

Pause rather than guess when:

- the named source is unavailable or materially different from the story
- the metric appears economically misleading
- the implementation requires new credentials
- a requirement conflicts with existing architecture
- a destructive migration would be required
- unrelated product behavior must change

## Known deferred ideas

### Historical percentile context

A useful later pattern would show where the latest value falls within the distribution of observations in the active range:

- 5 years
- 10 years
- 20 years
- Maximum

Possible wording:

```text
Higher than 68% of observations in the selected 20-year period
```

A percentile strip is preferable to a min-to-max gauge because extreme values can distort min-to-max position.

Qualitative labels such as `above typical` or `historically weak` should only be generated from explicit indicator-specific directionality rules.

This work is deferred from the current implementation phase unless Epic 02 is deliberately amended.

### Normalized payroll growth

Potential future companion measure:

```text
Three-month annualized payroll-employment growth
```

This would improve long-run comparability while preserving the existing absolute-jobs card.

### Data-gap annotations

The dashboard may eventually annotate known source disruptions, such as the 2025 CPI shutdown gap.

Do not interpolate or fabricate missing observations.

### Forecasts and historical vintages

Deferred to a later epic:

- forecasts versus outcomes
- first releases versus revised data
- ALFRED or other vintage-aware architecture
- automated divergence detection
- recession and event annotations
- major visual redesign

## Next story: Story 14

The next planned Epic 02 story is:

```text
Add household financial stress
```

Before drafting or implementing it, inspect Epic 02’s intended household-stress requirement and the current household section.

The story should select one broad, authoritative measure, such as:

- household debt-service ratio
- consumer delinquency rate
- another defensible broad household-stress indicator

Selection criteria:

- It should add information not already captured by income, spending, and saving.
- Prefer a broad and consistently defined measure.
- Avoid a narrow loan category unless there is a compelling reason.
- Explain the limitation that aggregate financial stress can differ sharply across households.
- Use FRED if an appropriate series exists.
- Do not add housing or unrelated household indicators in the same story.

The story should also update the stale Epic 02 story map.

## Open product questions

These remain unresolved and should not be silently decided without discussion:

1. Which household financial-stress measure is best for Story 14?
2. Should normalized payroll growth be added during Phase 1 or reviewed at closeout?
3. Should historical percentile context be part of Phase 1 or Epic 03?
4. How should known source-data gaps be annotated?
5. Which additional leading labor indicator should Phase 1 include?
6. Which official source will support tariff burden?
7. Which cards should eventually be combined, split, reframed, or removed after dashboard review?

## Communication preferences

The user values:

- direct answers
- candid correction
- clear recommendations
- product reasoning, not merely technical compliance
- downloadable Markdown stories
- preserving focus on the current question
- separate cards when two measures answer materially different questions
- explanations that make charts understandable to a non-specialist

Avoid:

- unnecessary verbosity
- drifting into future stories
- silently making product decisions
- presenting technically correct but conceptually confusing measures
- treating story numbering as authoritative when Git history says otherwise

## Suggested opening prompt for a fresh conversation

```text
I am continuing work on my U.S. Economy Dashboard.

The repository is the source of truth. Before advising or drafting a story, read PROJECT_HANDOFF.md, AGENTS.md, Epic 02, the relevant docs, and the current implementation.

Stories 01 through 13, including Story 12A, are complete and pushed. The latest completed commit is 65cf952, and main is synchronized with origin/main. The Epic 02 story map is stale.

The next planned work is Story 14: Add household financial stress.

Do not infer status from story numbering alone. Do not broaden the active story without discussing it with me. Product meaning matters as much as technical correctness.
```
