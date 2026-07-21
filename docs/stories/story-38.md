# Story 38 — Implement Growth per Person and extract the reusable compact-card architecture

Status: **Complete — July 21, 2026**

## User story

**As a** dashboard user
**I want** the Growth per Person card to use the same successful compact historical-band treatment as the headline GDP card
**so that** I can understand current per-capita growth at a glance.

**As a** dashboard maintainer
**I want** Cards #1 and #2 to share the smallest proven compact-card architecture
**so that** future changes to layout, typography, chart styling, help behavior, and historical-band rendering can be made in one place.

---

## Context

Card #1, **Is the U.S. economy growing?**, successfully established a compact default state with:

- section eyebrow;
- question headline;
- measure label;
- prominent latest-value callout;
- five-year compact line chart;
- trailing 25-year historical percentile bands;
- zero reference;
- chart caption;
- question-mark help popover;
- More/Less disclosure revealing the full research card.

The compact-card architecture investigation concluded that Card #1 should not be refactored in isolation.

Instead, Card #2 should provide the second real consumer needed to extract and validate three small shared boundaries:

1. compact-card layout and disclosure;
2. presentation-only historical-band chart;
3. pure configurable historical-band derivation.

This story replaces the earlier Card #2 implementation story.

---

## Card in scope

Apply the compact treatment to Card #2:

> **Is economic output growing faster than the population?**

Metric:

> **Real GDP Per Capita Growth**

Also migrate Card #1 to the newly extracted shared implementation without changing its approved behavior or appearance.

Do not migrate any other cards.

---

## Required implementation sequence

Complete the work in this order:

1. define Card #2’s metric-specific compact semantics;
2. extract the shared compact-card layout from Card #1;
3. extract the shared historical-band derivation utility;
4. extract the shared historical-band chart and help interaction;
5. centralize proven shared style values;
6. migrate Card #1 onto the extracted boundaries;
7. implement Card #2 using the same shared boundaries;
8. verify both cards together.

Do not design a speculative universal card before defining Card #2’s semantics.

---

# Part 1 — Define Card #2’s compact semantics

## Latest-value meaning

The current value represents year-over-year growth in inflation-adjusted GDP per person.

Interpretation:

- above zero: real output per person increased;
- below zero: real output per person decreased;
- zero: real output per person was unchanged.

Do not imply that rising GDP per capita means every person or household benefited equally.

## Recent line window

Show the latest five years of quarterly observations.

Requirements:

- use 20 quarterly observations where available;
- include the latest observation;
- preserve chronological order;
- preserve internal `null` values as gaps;
- do not smooth;
- do not interpolate;
- latest point must match the headline callout.

## Historical comparison window

Use the trailing 25 years ending with the latest observation.

Historical bands:

- inner band: 25th–75th percentile;
- lower light band: 10th–25th percentile;
- upper light band: 75th–90th percentile;
- unshaded tails: lowest and highest 10%.

The bands describe historical commonness within the comparison period.

They do not mean:

- good or bad;
- healthy or unhealthy;
- favorable or unfavorable.

Do not use standard-deviation bands.

## Zero reference

Show the zero line.

For this metric, zero has direct interpretive value because it separates increasing from decreasing real output per person.

## Caption

Use a dynamic caption equivalent to:

> **Real GDP per capita growth · 2021 Q1–2026 Q1**

Use the actual first and last visible periods.

## Help popover

Use this content:

> **Recent historical comparison: past 25 years**
> The dark band shows the middle 50% of readings during this period. The lighter bands extend the range to the middle 80%. Readings outside the shaded area fall within the highest or lowest 10% of the comparison period.

Requirements:

- native button;
- hover support where appropriate;
- click/tap support;
- Enter/Space support;
- Escape dismissal;
- outside-click dismissal;
- focus restoration;
- no hover-only dependency.

## Accessible interpretation

Provide a deterministic factual summary including:

- latest value;
- latest quarter;
- five-year line window;
- trailing 25-year comparison window;
- inner-band meaning;
- outer-band meaning;
- zero-line meaning;
- latest historical-position category.

Do not produce generic high-is-good or low-is-bad prose.

Do not claim that average gains were evenly distributed.

---

# Part 2 — Extract the shared compact-card layout

## Shared responsibility

Extract a composition-oriented shared component equivalent to:

```ts
interface CompactMetricCardLayoutProps {
  cardId: string;
  eyebrow: ReactNode;
  question: ReactNode;
  measureLabel: ReactNode;
  latestValue: ReactNode;
  compactVisual?: ReactNode;
  expandedContent: ReactNode;
  defaultExpanded?: boolean;
}
```

Use repository naming conventions.

The shared layout should own:

- article/card shell;
- semantic DOM order;
- headline grid;
- compact visual slot;
- native More/Less disclosure;
- `aria-expanded`;
- `aria-controls`;
- expanded-region visibility;
- responsive layout;
- focus-visible behavior;
- preservation of mounted headline content.

It must not own:

- data loading;
- metric slugs;
- value formatting;
- statistical interpretation;
- metric-specific wording;
- range state inside the full research chart;
- provider access.

## Shared reading order

Preserve this order:

1. eyebrow;
2. question;
3. measure;
4. latest-value callout;
5. compact visual and help;
6. More/Less;
7. expanded research content.

Hidden expanded content must not remain keyboard-focusable.

## Disclosure behavior

- collapsed by default;
- More reveals the current complete research content;
- Less hides it again;
- compact headline region remains mounted;
- parent-owned full-chart state persists across collapse/re-expand;
- no unexpected scroll jump;
- no new animation unless an existing shared reduced-motion-safe transition is already used.

---

# Part 3 — Extract the shared historical-band derivation

## Shared utility

Extract a pure configurable utility equivalent to:

```ts
interface HistoricalBandDefinition {
  recentObservationCount: number;
  comparisonWindow:
    | { kind: "trailing-years"; years: number }
    | { kind: "all-available" };
  innerPercentiles: readonly [number, number];
  outerPercentiles: readonly [number, number];
  minimumFiniteObservations: number;
  latestObservationPolicy: "last-observation" | "latest-finite";
}

interface HistoricalBandModel {
  recentObservations: readonly EconomicObservation[];
  comparisonStart: string;
  comparisonEnd: string;
  innerLower: number;
  innerUpper: number;
  outerLower: number;
  outerUpper: number;
  latestObservation: EconomicObservation & { value: number };
}
```

Use existing project types where possible.

## Utility responsibilities

The shared utility should:

- sort without mutation;
- select the recent window;
- select the comparison window;
- exclude `null` only from percentile calculation;
- preserve recent `null` gaps;
- calculate percentile boundaries;
- enforce minimum finite history;
- apply the selected latest-observation policy;
- return a discriminated unavailable result when necessary.

It must not:

- generate prose;
- classify higher or lower as favorable;
- know metric slugs;
- construct ECharts options;
- format display strings.

## Explicit per-card definitions

Card #1 and Card #2 must each supply explicit configuration.

Do not create undocumented global economic rules.

For both current cards, the approved configuration is:

- recent observations: 20 quarters;
- comparison window: trailing 25 years;
- inner percentiles: 25 and 75;
- outer percentiles: 10 and 90;
- explicit minimum-history rule;
- explicit latest-observation policy.

Keep these values configurable even though the first two consumers match.

## Metric-owned interpretation

Historical-position labels and accessible language remain metric-owned unless a later story proves that identical semantics are appropriate across multiple metrics.

Shared code may expose neutral position data, but must not generate welfare judgments.

---

# Part 4 — Extract the shared historical-band chart

## Shared chart component

Extract a presentation-only chart equivalent to:

```ts
interface HistoricalBandChartProps {
  model: HistoricalBandModel;
  seriesLabel: string;
  frequency: EconomicFrequency;
  valueFormatter: (value: number | null) => string;
  accessibleSummary: string;
  helpText: HistoricalBandHelpText;
  caption: string;
  appearance?: {
    showZeroLine?: boolean;
    showLatestMarker?: boolean;
    height?: "compact" | "tall";
  };
}
```

Use repository naming conventions.

## Shared chart responsibilities

The shared chart should own:

- existing modular/lazy ECharts lifecycle;
- resize handling and cleanup;
- unsmoothed line rendering;
- preservation of gaps;
- outer-then-inner band layering;
- optional zero line;
- optional latest marker;
- supplied formatter use;
- caption/footer layout;
- help-button and popover interaction;
- decorative canvas treatment;
- accessible summary exposure exactly once;
- explicit unavailable state.

It must not own:

- percentile derivation;
- metric wording;
- metric value semantics;
- comparison-window choice;
- accessible-summary prose;
- favorable/adverse color meaning.

## Chart implementation

Use the existing ECharts approach proven by Card #1.

Do not:

- add a charting library;
- duplicate the ECharts renderer;
- introduce a custom rendering engine;
- create a separate one-off chart for Card #2.

Preserve the approved Card #1 visual behavior unless extraction uncovers a real defect.

---

# Part 5 — Centralize proven shared styling

## DOM styling

Introduce shared CSS custom properties only for values now demonstrated by both cards.

At minimum centralize control of:

- compact-card gap;
- question typography;
- measure typography;
- latest-value typography;
- callout border;
- compact-chart height;
- footer typography;
- help-button size;
- popover width.

Use existing tokens where suitable rather than adding duplicates.

## ECharts theme styling

Create or use one small TypeScript chart-theme module for canvas-rendered values such as:

- line color;
- inner-band fill;
- outer-band fill;
- zero line;
- latest marker.

Changing a shared band color or line color should affect Cards #1 and #2 from one location.

Do not embed duplicate color literals in card-specific option builders.

---

# Part 6 — Migrate Card #1

Migrate:

> **Is the U.S. economy growing?**

onto the extracted:

- compact layout;
- historical-band derivation;
- historical-band chart;
- help primitive;
- shared style tokens.

Preserve:

- approved five-year line;
- trailing 25-year bands;
- caption;
- help text;
- latest-value callout;
- zero line;
- latest marker;
- More/Less behavior;
- full research content;
- visual appearance;
- accessible summary;
- data source;
- chart state behavior.

Remove GDP-specific duplication that has been replaced by shared boundaries.

Do not force GDP-specific wording or interpretation into shared code.

---

# Part 7 — Implement Card #2

## Collapsed state

Show:

- eyebrow: **GROWTH PER PERSON**;
- question: **Is economic output growing faster than the population?**;
- measure: **Real GDP Per Capita Growth**;
- latest-value callout;
- shared compact historical-band chart;
- More control.

Hide by default:

- full chart;
- range controls;
- zoom controls;
- narrative;
- sources;
- metadata;
- methodology;
- semantic table;
- other expanded content.

## Expanded state

Selecting More reveals the complete current Card #2 research content.

Preserve:

- full chart;
- 5-, 10-, 20-year, and Maximum controls;
- move controls;
- zoom controls;
- tooltip behavior;
- narrative;
- source links;
- metadata;
- semantic table;
- accessibility alternatives;
- current loading and failure behavior.

Do not rewrite the expanded research card in this story.

## Responsive layout

At wide widths:

- latest-value callout on the left;
- compact chart on the right;
- caption bottom-left;
- help button bottom-right;
- More below.

At narrow widths:

- stack compact chart below the latest callout;
- keep More full width;
- preserve readable hierarchy;
- prevent page-level horizontal overflow.

Use the shared layout rather than Card #2-specific CSS.

---

# Architecture constraints

## Required shared boundaries

By story completion, Cards #1 and #2 must share:

- compact layout/disclosure;
- historical-band derivation utility;
- presentation-only historical-band chart;
- help interaction;
- central compact-chart theme values;
- demonstrated compact-card style tokens.

## Required metric-owned boundaries

Each card must continue to own:

- eyebrow;
- question;
- measure label;
- latest-value label;
- value formatter;
- caption label;
- help wording;
- zero semantics;
- historical-position language;
- accessible summary;
- statistical configuration;
- expanded research content.

## Escape hatch

Do not turn this into a universal schema-driven dashboard card.

Future cards must remain able to use:

- the shared compact layout with another compact visual;
- a value-only compact state;
- a dedicated relationship visual;
- no compact treatment.

Avoid dozens of flags intended to cover every future metric.

---

# Data and performance

- Use one already-loaded observation source for compact and expanded views.
- Do not add a second provider fetch.
- Do not make browser-side provider requests.
- Preserve existing validation and failure isolation.
- Preserve lazy ECharts loading.
- Ensure the compact and full charts share one renderer dependency.
- Do not increase bundle size through duplicate ECharts imports.

If compact rendering fails, keep the latest-value callout and disclosure usable.

---

# Acceptance criteria

## Architecture

- Card #2’s semantic rules are defined before extraction.
- A shared compact layout is extracted.
- A shared historical-band derivation utility is extracted.
- A shared presentation-only historical-band chart is extracted.
- Shared help behavior is extracted.
- Shared DOM and canvas style values are centralized.
- Cards #1 and #2 use the shared implementation.
- GDP-specific and per-capita-specific interpretation remain outside shared code.
- No universal schema-driven card is introduced.

## Card #1 regression

- Card #1 remains visually and behaviorally equivalent.
- Latest value and compact latest point still match.
- Caption and help text remain correct.
- More/Less still works.
- Full research chart and controls remain unchanged.
- No accessibility regression is introduced.

## Card #2 implementation

- Card #2 is collapsed by default.
- Latest-value callout and compact chart are visible.
- Compact line shows five years.
- Bands use the trailing 25-year distribution.
- Zero line is visible.
- Caption uses actual visible dates.
- Help popover uses approved text.
- Latest compact point matches the headline value.
- More reveals all existing research content.
- Full-chart controls still work.
- No other card changes.

## Maintainability

- Headline styling can be changed once for both cards.
- Band colors can be changed once for both cards.
- Compact-chart height can be changed once for both cards.
- Help interaction behavior can be changed once for both cards.
- No duplicate compact ECharts lifecycle exists.
- No duplicate percentile-window logic exists.

---

# Tests

## Shared derivation

Test:

- 20-quarter recent selection;
- trailing 25-year selection;
- percentile interpolation;
- ties;
- negative values;
- null exclusion from percentiles;
- null preservation in recent line;
- insufficient history;
- latest-observation policies;
- no source mutation;
- explicit per-card definitions.

## Shared layout

Test:

- semantic order;
- collapsed default;
- More/Less state;
- `aria-expanded`;
- `aria-controls`;
- keyboard activation;
- hidden content not focusable;
- expanded state persistence;
- optional compact visual;
- desktop and narrow structure.

## Shared chart

Test:

- band layer order;
- unsmoothed line;
- gaps;
- optional zero line;
- optional latest marker;
- formatter delegation;
- dynamic caption;
- one accessible summary;
- unavailable state;
- resize cleanup;
- shared theme values.

## Shared help

Test:

- click/tap opening;
- Enter/Space opening;
- Escape dismissal;
- outside dismissal;
- focus restoration;
- unique IDs;
- supplied wording;
- narrow-viewport bounds.

## Card #1 integration

Test:

- approved GDP configuration;
- visual content remains present;
- headline value equals latest compact point;
- expanded research behavior unchanged;
- no duplicate summary announcement.

## Card #2 integration

Test:

- approved per-capita configuration;
- latest value equals latest compact point;
- correct caption;
- correct help text;
- correct zero-line behavior;
- full existing research content revealed;
- controls, sources, and table remain functional.

## Bundle and data

Test or verify:

- one observation source feeds each compact/full pair;
- no duplicate fetch;
- modular ECharts imports remain;
- compact and full charts share one renderer dependency.

---

# Documentation

Update the compact-card architecture decision with the implementation outcome.

Document:

- final shared component names and locations;
- final derivation interface;
- final chart interface;
- shared style-token locations;
- chart-theme location;
- what remains metric-owned;
- how a future compact card should be added;
- when historical bands should not be used;
- any changes made to the proposed architecture after testing two consumers.

Add a completion note reporting for Card #2:

- current inner-band values;
- current outer-band values;
- latest historical-position category;
- whether the five-year line remains legible;
- whether pandemic volatility creates a scale problem.

---

# Non-goals

- Do not migrate Card #3 or later cards.
- Do not redesign the dashboard.
- Do not rewrite expanded research content.
- Do not change GDP or per-capita data methodology.
- Do not create a universal card schema.
- Do not force historical bands onto unsuitable cards.
- Do not add favorable/adverse colors.
- Do not add another charting library.
- Do not opportunistically refactor unrelated card code.

---

# Verification

Before completion, run:

- lint;
- typecheck;
- full test suite;
- production build;
- Card #1 desktop review;
- Card #1 narrow review;
- Card #2 desktop review;
- Card #2 laptop-width review;
- Card #2 narrow review;
- compact/full dual-chart resize review;
- help-popover review;
- keyboard review;
- screen-reader-order review;
- bundle review;
- no-duplicate-fetch review;
- `git diff --check`.

Completion requires committed implementation, tests, documentation, and browser verification for both cards.
