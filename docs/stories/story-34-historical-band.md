# Story 34 — Derive historical reference bands for Real GDP growth

## User story

**As a** dashboard developer
**I want** a tested domain model for recent Real GDP growth and its historical percentile bands
**so that** the compact chart can be built from validated statistical inputs rather than calculating historical context inside the UI.

---

## Scope

Apply this story only to the Real GDP year-over-year growth series used by:

> **Is the U.S. economy growing?**

This story is domain and data-preparation work only.

Do not:

- render a compact chart;
- modify the collapsed GDP card;
- modify the full research chart;
- add ECharts options;
- change the GDP source series or transformation.

Story 33 must already be complete.

---

## Product decision

The future compact chart will compare the latest recent GDP-growth path with two horizontal historical percentile bands:

- **inner band:** 25th–75th percentile;
- **outer band:** 10th–90th percentile.

Use percentile bands rather than standard deviations.

The bands describe historical commonness, not whether a reading is good or bad.

---

## Comparison window

Use the approved comparison rule if one already exists for this metric.

If no approved rule exists, use the trailing 25 years of valid quarterly observations ending with the latest available observation.

Requirements:

- derive the comparison start from the latest observation;
- include only observations inside the approved window;
- exclude `null` values from percentile calculations;
- preserve the original committed series unchanged;
- record comparison start, comparison end, and valid observation count;
- do not use only the recent display window to calculate the bands.

If fewer than the approved minimum number of valid observations are available, return an explicit insufficient-history result rather than misleading thresholds.

Document the minimum observation count chosen.

---

## Recent display series

Select the latest 12 quarterly observations, including the latest observation.

Requirements:

- maintain chronological order;
- preserve internal `null` observations as gaps;
- do not smooth;
- do not interpolate;
- do not modify the source values;
- ensure the latest selected observation matches the headline callout value and period.

If fewer than 12 observations exist, return all available observations and record the actual count.

---

## Percentile calculation

Derive:

- 10th percentile;
- 25th percentile;
- 50th percentile;
- 75th percentile;
- 90th percentile.

Use the repository’s shared percentile or quantile utility if one already exists and its semantics are suitable.

If no shared utility exists, implement one pure tested function.

Document:

- interpolation method;
- tie handling;
- boundary behavior;
- `null` handling.

Do not round percentile thresholds for domain logic. Round only for display.

---

## Latest-position classification

Classify the latest valid GDP-growth value into one of these deterministic categories:

- `belowOuterBand`
- `betweenOuterAndInnerLow`
- `insideInnerBand`
- `betweenInnerAndOuterHigh`
- `aboveOuterBand`

Boundary semantics:

- exact 10th percentile belongs to `betweenOuterAndInnerLow`;
- exact 25th percentile belongs to `insideInnerBand`;
- exact 75th percentile belongs to `insideInnerBand`;
- exact 90th percentile belongs to `betweenInnerAndOuterHigh`.

If the latest observation is `null`, return an explicit unavailable classification.

---

## Output model

Produce a domain object equivalent to:

```ts
type HistoricalPosition =
  | "belowOuterBand"
  | "betweenOuterAndInnerLow"
  | "insideInnerBand"
  | "betweenInnerAndOuterHigh"
  | "aboveOuterBand"
  | "unavailable";

type CompactHistoricalContext = {
  recentObservations: Observation[];
  outerLower: number;
  innerLower: number;
  median: number;
  innerUpper: number;
  outerUpper: number;
  latestPosition: HistoricalPosition;
  latestObservation: Observation | null;
  comparisonStart: string;
  comparisonEnd: string;
  validObservationCount: number;
  recentObservationCount: number;
};
```

Use existing project types where possible.

The domain model must not contain ECharts-specific structures.

---

## Accessible-summary inputs

Provide enough deterministic information for a later chart component to generate an accessible factual summary.

At minimum expose:

- latest value;
- latest period;
- recent observation sequence;
- historical band thresholds;
- latest-position classification;
- comparison period;
- valid observation count.

Do not generate editorial prose in this story.

---

## Acceptance criteria

- A pure domain function derives the compact historical context from committed GDP observations.
- The comparison window uses the approved rule or trailing 25 years.
- The recent window uses the latest 12 quarters.
- `null` observations are excluded from percentile calculations but preserved in the recent display series.
- The function returns 10th, 25th, 50th, 75th, and 90th percentile thresholds.
- The latest value is classified into one of the approved historical-position categories.
- The latest selected observation matches the existing headline callout.
- Insufficient history and missing latest data produce explicit non-success states.
- No chart or card UI is changed.
- No ECharts dependency is introduced into the domain layer.

---

## Tests

Add deterministic tests covering:

### Comparison window

- exact 25-year boundary;
- observations just outside the window are excluded;
- latest observation determines the window end;
- valid observation count is correct.

### Percentiles

- odd observation count;
- even observation count;
- tied values;
- repeated boundary values;
- `null` exclusion;
- negative values;
- extreme outliers;
- exact expected 10th, 25th, 50th, 75th, and 90th percentiles.

### Recent selection

- latest 12 quarters selected;
- chronological order;
- latest value matches source;
- internal `null` preserved;
- fewer-than-12 behavior.

### Position classification

- below 10th;
- exactly at 10th;
- between 10th and 25th;
- exactly at 25th;
- inside inner band;
- exactly at 75th;
- between 75th and 90th;
- exactly at 90th;
- above 90th;
- missing latest value.

### Failure states

- insufficient valid history;
- empty series;
- all-null comparison window.

---

## Documentation

Update the relevant briefing or charting rules to record:

- GDP compact-chart comparison window;
- recent display window;
- percentile definitions;
- interpolation and tie semantics;
- latest-position categories;
- insufficient-history behavior;
- bands indicate historical commonness, not value judgment.

Include the current calculated band values and latest-position classification in the story completion note for product review.

---

## Non-goals

- Do not render the compact chart.
- Do not add ECharts options.
- Do not modify the GDP card.
- Do not modify the full research chart.
- Do not add visible labels.
- Do not use standard deviations.
- Do not generalize this into a cross-dashboard framework.
- Do not change GDP data acquisition or transformation.

---

## Verification

Before completion, run:

- lint;
- typecheck;
- tests;
- production build if required by repository rules;
- `git diff --check`.

Completion requires committed domain logic, tests, and documentation.
