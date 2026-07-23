# Story 42 — Replace the headline-versus-core CPI card with “What is driving inflation?”

## User story

**As a** dashboard user

**I want** a concise inflation-drivers card that shows which categories are contributing most to current CPI inflation

**so that** I can understand what is pushing prices higher or lower without interpreting an abstract headline-versus-core comparison.

## Context

Replace the current primary card:

> **Is inflation broad and persistent?**

with:

> **What is driving inflation?**

The existing headline-versus-core comparison is useful as supporting context, but it does not directly measure inflation breadth and is not strong enough as a primary at-a-glance card.

Do not delete core-CPI data. It will move into the expanded CPI card in Story 43.

## Scope

Apply only to the current headline-versus-core CPI card.

Use the shared compact-card shell, disclosure behavior, typography, help interaction, and responsive layout.

Do not use historical percentile bands for this compact visual.

## Compact card identity

Eyebrow:

> **INFLATION DRIVERS**

Question:

> **What is driving inflation?**

Measure label:

> **Category contributions to headline CPI inflation**

The measure label must make clear that bars represent contributions to overall inflation, not each category’s own inflation rate.

## Headline value and answer

Show the latest headline CPI year-over-year rate for orientation.

Example:

> **3.5%**
>
> **Shelter and services are the main drivers.**

Generate the answer deterministically from contribution data.

Initial summary rules:

1. If one category contributes at least 45% of total positive contribution:
   > **[Category] is the dominant driver.**

2. Otherwise, if the top two categories contribute at least 65%:
   > **[Category 1] and [Category 2] are the main drivers.**

3. Otherwise, if at least four categories each contribute materially:
   > **Inflation is broad across several categories.**

4. Otherwise:
   > **Several categories are contributing to inflation.**

Define “materially” explicitly. Use unrounded values for classification.

If headline CPI is zero or negative, use contribution-aware wording rather than applying the positive-inflation rules blindly.

## Compact contribution chart

Use a horizontal contribution chart with approximately five categories:

- shelter;
- other services;
- food;
- energy;
- goods excluding food and energy.

Use the most defensible available source grouping. Document any necessary grouping changes.

Each bar represents the category’s percentage-point contribution to the current 12-month headline CPI rate.

Requirements:

- positive contributions extend right of zero;
- negative contributions extend left of zero;
- show category labels;
- show percentage-point contribution values;
- order bars by contribution unless a fixed semantic order is demonstrably clearer;
- totals approximately reconcile to headline CPI, subject to rounding and source methodology.

Do not substitute category inflation rates for contributions.

## One-year change context

For each category, show a concise annotation comparing its current contribution with one year earlier.

Examples:

> `+1.4 pp · down 0.3 pp from a year ago`

> `+0.4 pp · up 0.7 pp from a year ago`

Calculate using exact 12-month matching. Missing prior-year values remain unavailable.

Use correct percentage-point grammar.

## Help popover

Use the shared help control with text equivalent to:

> **How to read this chart**
>
> Each bar shows how many percentage points a category contributed to the current 12-month CPI inflation rate. Larger spending categories can have a large effect even when their own price increases are moderate. Contributions may be negative and should approximately add up to headline CPI, subject to rounding. The bars show contribution to overall inflation, not each category’s own inflation rate.

Support click/tap, Enter/Space, Escape dismissal, outside-click dismissal, and focus restoration.

## Data requirements

Use an official source that either provides category contributions directly or supports a reliable deterministic derivation.

Before implementation, verify:

- category indexes;
- expenditure weights or relative importance;
- contribution methodology;
- frequency;
- revisions;
- category consistency over time.

Do not approximate contributions from rounded rates and rounded weights unless that matches an accepted project methodology and reconciles adequately.

Document:

- exact source fields;
- derivation formula;
- reconciliation difference versus headline CPI;
- treatment of residuals;
- revision behavior.

Requirements:

- no browser-side provider request;
- committed deterministic data;
- no silent interpolation;
- no stale carry-forward;
- preserved provenance.

## Collapsed state

Show:

1. eyebrow;
2. question;
3. measure label;
4. headline CPI value;
5. deterministic driver sentence;
6. compact contribution bars;
7. help control;
8. More control.

Do not show:

- historical percentile bands;
- a standard sparkline;
- the old headline-versus-core chart;
- range or zoom controls;
- methodology tables.

## Expanded state

Selecting More reveals a richer driver analysis.

Preferred content:

- five years of category-contribution history;
- stacked contributions or small multiples;
- category inflation rates alongside contributions;
- weights or relative importance;
- source and methodology;
- reconciliation note;
- semantic table.

Do not force a stacked chart if small multiples are clearer.

## Architecture

Use the shared compact-card layout.

Create a dedicated inflation-contribution visual rather than forcing this into the historical-band chart API.

Reuse shared:

- disclosure mechanics;
- typography and spacing tokens;
- help primitive;
- responsive patterns;
- percentage-point formatter.

Keep contribution derivation, grouping, summary rules, and history metric-specific.

## Acceptance criteria

- The old primary question is removed.
- The new question is **What is driving inflation?**
- Headline CPI remains visible for context.
- Compact bars show percentage-point contributions.
- Positive and negative contributions render on opposite sides of zero.
- Values approximately reconcile to headline CPI.
- One-year deltas are shown where available.
- A deterministic summary identifies dominant drivers or breadth.
- No historical percentile bands are used.
- Help text explains contribution versus category inflation rate.
- More reveals useful contribution history and methodology.
- Core CPI data are retained.
- No unrelated card changes.
- No new charting library is added.

## Tests

Test:

- positive, negative, and zero contributions;
- reconciliation and residuals;
- exact prior-year comparison;
- missing prior-year data;
- dominant-category rule;
- dominant-top-two rule;
- broad-inflation rule;
- fallback rule;
- zero or negative headline inflation;
- bar direction around zero;
- help behavior;
- compact and expanded responsive layouts;
- nonvisual access to every category and contribution.

## Documentation

Document:

- source and contribution methodology;
- final category grouping;
- summary thresholds;
- reconciliation behavior;
- one-year comparison logic;
- why historical bands are not appropriate;
- why contributions are more informative than category rates for this question.

The completion note must report:

- latest contributions;
- reconciliation difference;
- generated summary;
- largest one-year changes;
- whether the expanded history is legible.

## Non-goals

- Do not preserve the old card as a primary card.
- Do not claim headline-versus-core measures breadth.
- Do not add PCE or the federal-funds rate.
- Do not create a universal contribution-chart framework.
- Do not modify unrelated sections.

## Verification

Run lint, typecheck, tests, production build, desktop and narrow browser review, reconciliation review, accessibility review, and `git diff --check`.

Completion requires committed implementation, tests, documentation, and browser verification.
