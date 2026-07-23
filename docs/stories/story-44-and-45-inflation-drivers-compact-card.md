# U.S. Economy Dashboard — Inflation Drivers Compact-Card Redesign

These stories redesign the collapsed **What is driving inflation?** card. They intentionally leave the expanded research content unchanged until the compact design has been implemented and reviewed.

The work is split into two stories so the first story solves the current interpretation problem and establishes the contribution model, while the second adds historical mini-trends without combining two distinct visualization changes into one review.

---

# User Story 44 — Make the current inflation contribution breakdown self-explanatory

## User story

As a dashboard reader, I want the **What is driving inflation?** card to explain clearly how much each category added to or subtracted from headline CPI inflation, so that I do not confuse category contributions with category inflation rates or changes in those rates.

## Background

The current collapsed card shows a large headline CPI value and a set of category values such as:

- Shelter `+1.2`
- Energy `+1.1`
- Other services `+0.8`
- Food `+0.4`
- Goods excluding food and energy `+0.2`

Those values are percentage-point contributions to the latest year-over-year headline CPI increase. The current presentation does not make that meaning sufficiently clear. A reader can reasonably misinterpret `Shelter +1.2` as shelter inflation being 1.2%, or as shelter inflation having increased by 1.2%.

The large headline CPI value is also redundant with the preceding **How quickly are consumer prices rising?** card. This card should focus on composition rather than repeat the headline rate.

The compact-card architecture already permits this card to use a metric-specific visual inside `CompactMetricCardLayout`. Do not force this card into the historical-band chart pattern.

## Objective

Replace the current collapsed-card headline treatment and contribution bars with a compact, zero-centered contribution breakdown that makes the unit and arithmetic unmistakable.

The collapsed card should answer:

> Which categories added the most to—or subtracted the most from—the latest year-over-year CPI increase?

## Scope

### 1. Remove the redundant large headline value

Remove the large standalone headline CPI value from the collapsed **What is driving inflation?** card.

Do not remove headline CPI from the underlying data model if it is needed for:

- explanatory copy;
- contribution reconciliation;
- accessible summaries;
- expanded research content.

The card may still state the latest headline rate in supporting text, but it should no longer occupy the primary-value treatment used by ordinary single-metric cards.

### 2. Add an explicit measure explanation

Directly above or adjacent to the contribution visual, show concise text that explains the measure.

Preferred visible wording:

> Percentage points added to or subtracted from the latest 3.5% CPI increase

The actual headline value and observation period must be data-driven.

Equivalent wording is acceptable if it is at least as clear and concise. The interface must use **percentage points**, not only `%`, for contribution values.

The explanatory text must make clear that:

- the categories are contributions to headline year-over-year CPI inflation;
- positive values add to headline inflation;
- negative values subtract from headline inflation.

### 3. Group the current contributions

Derive a collapsed-card model containing:

- the four categories with the largest absolute current contributions;
- one remainder category representing the net contribution of all other categories.

Use absolute contribution magnitude to select the four displayed categories. A large negative contribution is an important driver and must not be excluded merely because it reduces inflation.

Use this visible label for the remainder:

> Everything else

Use more explicit wording such as **All other categories, net** in help text, accessible text, or explanatory detail.

The remainder must be calculated from the complete available contribution set, not from rounded visible values.

### 4. Render a zero-centered horizontal contribution chart

Render the five current contribution rows as a compact horizontal chart.

Requirements:

- A visible zero reference is required.
- Positive contributions extend to the right of zero.
- Negative contributions extend to the left of zero.
- Each row shows:
  - category label;
  - signed contribution value;
  - unit expressed as `pts` or an equally clear abbreviation for percentage points.
- Bar length represents contribution magnitude.
- Do not use a pie or donut chart.
- Do not use geometry that assumes every contribution is positive.
- Do not assign favorable/adverse meaning to positive or negative inflation contributions through generic green/red semantics.
- Use the existing restrained dashboard palette and compact-card styling conventions.
- Preserve legibility when positive and negative categories appear together.
- Preserve the actual sign when a contribution rounds to a displayed zero; avoid rendering a misleading positive bar for a small negative value.

The ordering should support easy reading of the zero-centered chart. Prefer ordering from largest positive contribution through the most negative contribution after the top-four selection has been made. Document another ordering only if it proves materially clearer during implementation.

### 5. Add a deterministic short answer

Add one concise, deterministic answer below the question and before the visual.

The answer should describe the current composition without assigning unsupported economic value judgments.

Examples of acceptable semantic patterns:

- `{Category A} and {Category B} contributed most of the latest increase.`
- `{Category A} was the largest contributor, while {Category B} partly offset the increase.`
- `Inflation was spread relatively broadly across the displayed categories.`
- `Positive and negative category contributions substantially offset one another.`

Do not hard-code current category names or current values into authored copy.

The implementation must use a finite, reviewable rule set. It must handle at least:

- one clearly dominant contributor;
- two contributors jointly accounting for most of the total;
- broadly distributed positive contributions;
- meaningful positive and negative offsetting;
- headline inflation near zero;
- unavailable or unreconciled contribution data.

Thresholds must be explicit, tested, and documented near the derivation logic. Avoid pseudo-precision.

### 6. Reconcile contributions to headline CPI

Calculate the sum of all unrounded category contributions and compare it with the latest headline CPI rate.

Requirements:

- Define an explicit reconciliation tolerance appropriate to the source data and transformations.
- The compact model must expose the reconciliation difference or reconciliation status.
- If the category contributions reconcile within tolerance, provide accessible or help text explaining that the displayed categories plus the net remainder approximately sum to headline CPI.
- If they do not reconcile within tolerance:
  - do not silently present the result as a complete decomposition;
  - show a qualified or unavailable state;
  - preserve enough diagnostic information for tests and development review.

Do not force rounded displayed values to sum exactly to the rounded headline rate.

### 7. Preserve the expanded card

Do not redesign, remove, or reorder the existing expanded research content in this story.

The existing **More/Less** behavior, expanded controls, source material, full charts, and state preservation must continue to work.

The new collapsed visual and the expanded content must consume the same loaded source observations where applicable.

### 8. Help and accessible explanation

Reuse the existing shared compact-chart help interaction.

The help content must explain, in plain language:

- these values are percentage-point contributions to headline CPI inflation;
- they are not the inflation rates of the individual categories;
- positive values add to headline inflation;
- negative values reduce headline inflation;
- **Everything else** is the net sum of all categories not separately shown;
- categories are selected by absolute current contribution magnitude.

The figure must provide one concise nonvisual summary containing:

- headline CPI value and period;
- each displayed category and signed contribution;
- the net remainder;
- whether the complete contribution set reconciles to headline CPI within tolerance.

Canvas internals remain decorative. Do not duplicate the same accessible summary in multiple places.

## Suggested implementation boundary

Keep the derivation separate from the React view.

A suitable model may resemble:

```ts
interface InflationContributionTrend {
  categoryId: string
  label: string
  observations: readonly EconomicObservation[]
}

interface CurrentInflationContribution {
  categoryId: string
  label: string
  contribution: number
}

interface CompactInflationDriversModel {
  headlineInflation: number
  headlinePeriod: string
  displayedContributions: readonly CurrentInflationContribution[]
  remainderContribution: number
  reconciliationDifference: number
  reconciliationStatus: 'reconciled' | 'unreconciled'
  summary: InflationDriversSummary
}
```

The exact interfaces may differ to fit the repository. Preserve these responsibilities:

- pure derivation selects and groups categories;
- pure derivation performs reconciliation;
- pure derivation classifies the deterministic summary;
- the chart component renders an already-derived model;
- the React presentation does not calculate grouping, thresholds, or reconciliation inside JSX.

Do not generalize this into a universal contribution-chart schema unless an existing second consumer already proves the same abstraction.

## Acceptance criteria

1. The collapsed card no longer displays the redundant large headline CPI value.
2. The card explicitly identifies the category values as percentage-point contributions to the latest year-over-year headline CPI increase.
3. The card displays the four largest absolute current category contributions plus a calculated **Everything else** remainder.
4. Positive and negative contributions are represented honestly around a visible zero line.
5. Every displayed value includes a sign and a percentage-point unit.
6. A deterministic short answer describes the current composition using a finite, tested rule set.
7. The complete contribution set is reconciled against headline CPI using an explicit tolerance.
8. Unreconciled data produces a qualified or unavailable state rather than a misleading complete decomposition.
9. Help text distinguishes category contributions from category inflation rates.
10. The accessible summary exposes the displayed values, remainder, period, headline rate, and reconciliation status.
11. Existing expanded content and More/Less behavior remain unchanged and functional.
12. No pie or donut chart is introduced.
13. No unrelated cards are migrated or refactored.

## Verification

Add or update tests covering:

### Pure derivation

- selection by absolute contribution;
- inclusion of a large negative contributor;
- remainder calculation from all omitted categories;
- ordering of positive and negative displayed rows;
- exact and near-tolerance reconciliation;
- reconciliation failure;
- rounding without changing underlying arithmetic;
- missing latest category data;
- duplicate or unknown category identifiers;
- deterministic summary states and threshold boundaries;
- headline inflation near zero.

### Chart options or presentation

- visible zero line;
- positive bars extend right and negative bars extend left;
- signed value labels and percentage-point units;
- long labels do not overlap values;
- zero and near-zero values remain legible;
- help interaction works by pointer and keyboard;
- accessible summary appears exactly once;
- canvas is decorative.

### Integration and browser review

- the large headline value is absent from the collapsed card;
- the expanded card is unchanged;
- More/Less preserves expanded state;
- desktop layout;
- narrow/mobile layout;
- mixed positive and negative data;
- no horizontal overflow;
- no collision between category labels, bars, values, help, and disclosure controls.

Run all repository-required checks from `AGENTS.md`, including:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Perform story-specific browser verification with representative positive-only and mixed-sign fixtures or data states.

## Documentation

Update the relevant current documentation to record:

- the removal of the redundant compact headline value;
- the zero-centered contribution design;
- top-four selection by absolute contribution;
- the net remainder;
- reconciliation behavior;
- the deterministic summary rules;
- the fact that the expanded research content remains unchanged.

Do not rewrite historical archived stories.

## Out of scope

- Five-year contributor sparklines or mini-trends.
- Redesign of the expanded card.
- Changes to the preceding headline CPI card.
- New provider data or browser-side provider requests.
- A universal composition-card abstraction.
- Migration of any other card.
- Pie or donut visualizations.

---

# User Story 45 — Show how the leading inflation drivers changed over five years

## User story

As a dashboard reader, I want to see how the current leading contributors to inflation have changed over the past five years, so that I can tell whether today’s inflation composition is persistent, newly emerging, or replacing earlier drivers.

## Dependency

Story 44 must be complete.

This story uses Story 44’s:

- current top-four absolute-contribution selection;
- remainder and reconciliation model;
- zero-centered current-composition visual;
- compact-card layout;
- contribution terminology;
- help and accessibility conventions.

Do not reopen Story 44’s core visual decisions unless implementation reveals a concrete correctness or usability problem.

## Objective

Add one five-year contribution mini-trend for each of the four currently selected leading contributors.

The collapsed card should then answer two related questions:

1. Which categories are driving inflation now?
2. How have those same categories’ contributions changed during the past five years?

The historical mini-trends must chart category contributions to headline CPI, not each category’s own inflation rate.

## Scope

### 1. Use the current top four categories

Use the same four current categories selected by Story 43 according to absolute latest contribution.

Do not select a separate historical top four for each prior period.

This means a current leading category may have had little or no contribution earlier in the five-year window. That is meaningful and should remain visible.

Do not add a trend for **Everything else** in the collapsed card.

### 2. Derive five-year contribution histories

For each selected category, derive a recent history ending at the latest common usable contribution period.

Preferred display window:

- the latest five years of monthly contribution observations;
- preserve nulls and genuine gaps;
- do not interpolate missing observations;
- do not replace missing observations with zero.

Use exact period alignment where multiple source series or derived components must be combined.

The derivation must expose enough period metadata to create an accurate accessible summary and footer.

If a selected category lacks adequate history:

- retain the current contribution row;
- show an explicit unavailable mini-trend state for that category;
- do not substitute another category solely to fill the trend area.

### 3. Add four compact mini-trends

Add one compact sparkline or small line chart for each current top-four category.

Each trend row must include:

- category label;
- latest signed contribution value;
- a five-year contribution line;
- a visible zero reference;
- an accessible summary or shared figure-level summary.

Requirements:

- The y-value is percentage-point contribution to year-over-year headline CPI.
- Preserve positive and negative values.
- Use a nonsmoothed line.
- Preserve null gaps.
- Mark or otherwise make the latest endpoint legible without adding visual clutter.
- Do not imply that higher or lower contribution is universally favorable.
- Do not use independent auto-scaling in a way that makes trivial and very large movements look equivalent without disclosure.

### 4. Use a truthful scale strategy

Choose and document one scale strategy after evaluating the actual five-year data.

Preferred strategy:

- use a shared symmetric y-domain across all four mini-trends;
- calculate the domain from the largest absolute finite value across the four selected histories;
- include zero;
- add modest deterministic padding;
- retain the same domain for all four mini-trends in the card.

This allows visual comparison across categories and keeps zero in the same vertical position.

A different strategy is acceptable only if the shared scale makes one or more trends materially unreadable. Any deviation must:

- be documented;
- be visually disclosed;
- avoid implying direct magnitude comparability when scales differ;
- receive explicit browser review.

Do not silently give each sparkline an unrelated scale.

### 5. Integrate the two compact views

On sufficiently wide screens, present:

- current zero-centered contribution composition on the left;
- four five-year contribution trends on the right.

Use concise section labels such as:

- **Current contribution**
- **Contribution over five years**

The exact wording may be refined, but it must repeat the contribution concept clearly enough that the right-side lines cannot be mistaken for category inflation rates.

On narrow screens:

- stack the current composition above the trends;
- preserve reading order;
- avoid forcing tiny side-by-side charts;
- preserve category-label and value legibility.

Do not allow the card to become substantially taller than necessary. Prefer compact repeated rows over four large standalone charts.

### 6. Add limited historical interpretation

Extend the deterministic short answer only if a concise, defensible trend clause can be added without creating an unreadable paragraph.

Examples of acceptable patterns:

- `{Category} is the largest current contributor and has risen materially over the past year.`
- `{Category} contributes most now, although its contribution has declined from its recent peak.`
- `The current leading contributors have shifted from {Earlier category pattern} toward {Current category pattern}.`

However, do not create a general narrative generator.

A trend statement must use a finite, documented rule set with explicit comparisons and noise thresholds. If that cannot be done simply and defensibly within this story, retain Story 43’s current-composition answer and let the trend charts provide the historical context.

The absence of new prose is preferable to fragile or overfitted commentary.

### 7. Extend help and accessibility

Update help text to explain:

- the left visual shows current category contributions;
- the right mini-trends show those same categories’ contribution histories;
- the categories are selected based on their latest absolute contributions;
- historical rank is not recalculated at every prior date;
- a category may therefore appear near zero earlier in the period;
- all mini-trends share a scale, if the preferred shared-scale strategy is used;
- the lines show contributions to headline CPI, not category inflation rates.

The nonvisual summary must include:

- the five-year date range;
- each selected category’s latest contribution;
- whether its contribution rose, fell, or was broadly unchanged over a clearly defined recent comparison period, only if such classification is implemented;
- missing-history states;
- the scale relationship among mini-trends.

Avoid duplicating verbose per-chart summaries if one structured figure-level summary is clearer.

### 8. Preserve lazy loading and expanded behavior

Use modular ECharts imports and preserve the existing lazy-loading strategy.

Do not introduce a separate renderer dependency for the mini-trends.

Opening and closing **More** must not remount or reset unrelated expanded research controls.

Do not redesign the expanded card.

## Suggested implementation boundary

Extend the Story 44 compact model rather than deriving trend data inside chart components.

A suitable extension may resemble:

```ts
interface InflationContributionTrend {
  categoryId: string
  label: string
  currentContribution: number
  observations: readonly EconomicObservation[]
  startPeriod: string | null
  endPeriod: string | null
  availability: 'available' | 'unavailable'
}

interface CompactInflationDriversModel {
  headlineInflation: number
  headlinePeriod: string
  displayedContributions: readonly CurrentInflationContribution[]
  remainderContribution: number
  reconciliationDifference: number
  reconciliationStatus: 'reconciled' | 'unreconciled'
  trends: readonly InflationContributionTrend[]
  sharedTrendDomain: readonly [number, number] | null
  summary: InflationDriversSummary
}
```

Exact repository types may differ.

Preserve these boundaries:

- category selection remains owned by the pure compact-model derivation;
- trend histories are aligned and sliced before rendering;
- shared-domain calculation is pure and tested;
- ECharts option construction is separate from React lifecycle;
- mini-trend components receive already-derived data and scale;
- metric-specific logic stays outside generic historical-band utilities.

Reuse existing chart lifecycle, formatting, theme, and help primitives where they fit naturally. Do not distort an existing abstraction merely to claim reuse.

## Acceptance criteria

1. The collapsed card shows four five-year contribution mini-trends for the same current top-four categories selected in Story 43.
2. Every mini-trend charts percentage-point contribution to headline CPI, not category inflation.
3. Every mini-trend includes a zero reference and preserves positive, negative, and missing values.
4. The four mini-trends use a documented, truthful scale strategy.
5. The current composition and historical trends appear side by side on wide screens and stack cleanly on narrow screens.
6. Section wording makes the distinction between current composition and five-year contribution history clear.
7. A category with inadequate history shows an explicit unavailable state and is not silently replaced.
8. Help text explains current-category selection, fixed category identity across history, measure meaning, and scale behavior.
9. Accessible output communicates the trend window, current values, missing states, and scale relationship.
10. The existing expanded research content and controls remain unchanged.
11. No new provider calls occur in React or the browser.
12. No unrelated cards are migrated or refactored.

## Verification

Add or update tests covering:

### Pure trend derivation

- exact five-year window boundaries;
- latest common usable endpoint;
- category identity remains fixed across the historical window;
- null preservation and no interpolation;
- mixed monthly availability;
- unavailable category history;
- shared symmetric-domain calculation;
- deterministic padding;
- all-zero and near-zero histories;
- extreme outlier history;
- positive and negative histories.

### Chart options and rendering

- zero line appears in every mini-trend;
- all four charts receive the same domain when shared scaling is used;
- nonsmoothed lines;
- null gaps;
- latest endpoint treatment;
- signed current values;
- no favorable/adverse color semantics;
- unavailable mini-trend state;
- decorative canvas and nonduplicated accessible summary.

### Integration and browser review

Review at minimum:

- normal current data;
- one current negative top-four contributor;
- one category with missing recent observations;
- a category that was near zero for most of the five-year window;
- one historically volatile contributor alongside three quieter contributors;
- desktop side-by-side layout;
- tablet transition;
- narrow/mobile stacked layout;
- long category labels;
- help popover bounds;
- More/Less state preservation;
- no overflow or footer collision.

Run all repository-required checks from `AGENTS.md`, including:

```bash
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Stop temporary servers and remove verification-only artifacts before committing.

## Documentation

Update current documentation to record:

- the five-year contribution mini-trends;
- fixed selection based on latest absolute contribution;
- the contribution—not category-inflation—measure;
- the chosen scale strategy;
- missing-history behavior;
- responsive layout behavior;
- the decision to leave expanded content unchanged.

Do not update archived historical stories except where repository conventions explicitly require a completion marker.

## Out of scope

- Redesign of expanded research content.
- Historical top-four reranking at every point in time.
- A trend for **Everything else** in the collapsed card.
- Forecasts or causal explanations of why a category changed.
- New inflation datasets unless the existing committed data cannot support contribution histories.
- A generalized sparkline dashboard framework without a demonstrated second consumer.
- Changes to other compact cards.

---

# Recommended execution order

1. Implement and review Story 44.
2. Confirm that the current contribution chart is immediately understandable with real data, including mixed-sign cases.
3. Implement Story 45.
4. Review the combined card at desktop and narrow widths before considering any expanded-card redesign.
