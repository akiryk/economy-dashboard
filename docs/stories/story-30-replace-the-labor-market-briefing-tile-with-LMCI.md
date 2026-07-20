# Story 30 — Replace the Labor Market briefing tile with an LMCI-based visual summary

## User story

**As a** dashboard user
**I want** the Labor Market briefing tile to summarize labor-market activity and momentum using the Kansas City Fed Labor Market Conditions Indicators
**so that** I can understand current labor-market conditions at a glance without relying on an opaque homegrown combination of unemployment and payroll data.

---

## Product decision

The Labor Market tile must no longer derive its headline assessment from:

- unemployment rate;
- payroll growth;
- prime-age employment-to-population ratio;
- initial unemployment claims.

Instead, use the Kansas City Fed’s two published Labor Market Conditions Indicators:

- **LMCI Level of Activity** → headline measure for current labor-market activity;
- **LMCI Momentum** → headline measure for labor-market direction.

The existing unemployment, payroll, prime-age employment, and initial-claims data remain available as supporting evidence in the expanded tile. They must not determine or override the collapsed tile’s activity or momentum labels.

---

## Mockup

A standalone HTML mockup accompanies this story.

Treat the mockup as a **conceptual and layout guide only**. It communicates:

- the desired compact scale;
- the two-column hierarchy;
- the activity-bar concept;
- the momentum-arrow concept;
- the midpoint marker;
- the collapsed-versus-expanded structure.

Do not reproduce its CSS, dimensions, typography, spacing, or visual polish mechanically. Use the repository’s existing components, accessibility conventions, responsive behavior, and design tokens. Improve the implementation where necessary while preserving the information hierarchy described in this story.

---

## Data acquisition

Add the Kansas City Fed LMCI Activity and Momentum series to the existing offline data-refresh pipeline.

Requirements:

- Use the official Kansas City Fed or corresponding FRED-hosted series already approved for this product.
- Follow the repository’s existing provider-isolation model.
- Fetch data only during the offline refresh workflow.
- Commit validated generated data using the existing repository conventions.
- Do not make browser requests to the Kansas City Fed, FRED, or any external provider.
- Preserve missing observations as `null`.
- Ensure dates are chronological, unique, and not future-dated relative to retrieval.
- Add explicit repository loaders and validation.
- Record exact series IDs, source URLs, units, frequency, observation range, retrieval date, and transformation details in the appropriate data documentation.

### Attribution

The collapsed tile does not need visible attribution.

The expanded source or methodology area must contain:

> Source: Federal Reserve Bank of Kansas City, Labor Market Conditions Indicators.

Also include the full citation requested by the Kansas City Fed in the detailed source disclosure or repository documentation.

Do not make the attribution visually prominent, but do not hide it through inaccessible, invisible, or misleading presentation.

---

## Historical normalization

The raw LMCI values are standardized indexes centered approximately on their long-run averages. They are not bounded to `[-1, 1]`.

Do not use the raw LMCI number directly as:

- the activity-bar fill percentage;
- the momentum-arrow angle;
- a 0–100 score.

For each LMCI series, derive a historical percentile from the committed series history.

### Percentile semantics

- `0` = lowest historical position in the selected comparison history.
- `50` = historical median.
- `100` = highest historical position.
- Higher is more favorable for both LMCI Activity and LMCI Momentum.
- Clamp display inputs to `[0, 100]`.
- Use the shared percentile implementation where possible.
- Do not duplicate percentile logic inside the presentational tile component.

Unless an existing approved briefing rule specifies otherwise, use the full committed LMCI history for this story. Clearly record the chosen comparison window in the methodology disclosure and tests.

The raw LMCI readings remain available under **More** for traceability.

---

## Five activity tiers

Map the LMCI Activity historical percentile to these labels:

| Percentile | Label |
|---|---|
| 0–20 | **Well Below Avg.** |
| 20–40 | **Below Avg.** |
| 40–60 | **Near Avg.** |
| 60–80 | **Above Avg.** |
| 80–100 | **Well Above Avg.** |

Boundary rule:

- Exact values at `20`, `40`, `60`, and `80` use the upper tier.
- Example: `60` maps to **Above Avg.**

These are comparisons with the LMCI series’ historical distribution. They are not literal claims that every worker’s experience is favorable or unfavorable.

---

## Five momentum tiers

Map the LMCI Momentum historical percentile to these labels:

| Percentile | Label |
|---|---|
| 0–20 | **Weakening Sharply** |
| 20–40 | **Weakening** |
| 40–60 | **Steady** |
| 60–80 | **Strengthening** |
| 80–100 | **Strengthening Sharply** |

Use the same upper-tier boundary rule.

The momentum label describes the broad labor market represented by the LMCI. Do not replace it with mechanism-specific claims such as:

- Hiring up;
- More layoffs;
- Payrolls falling;
- Claims rising.

Those statements may appear only in supporting evidence when the specific underlying data justify them.

---

# Collapsed tile

## Required content

The collapsed tile contains only:

1. Eyebrow: **LABOR MARKET**
2. Question: **Can people find and keep work?**
3. Two side-by-side metric blocks:
   - **Labor Market Activity**
   - **Labor Market Momentum**
4. Full-width **More** control

Do not show by default:

- narrative paragraph;
- raw LMCI values;
- unemployment rate;
- payroll numbers;
- prime-age employment;
- initial claims;
- sparklines;
- revision caveats;
- methodology;
- attribution;
- source links.

The collapsed tile should be materially shorter and simpler than the current Labor tile and fit naturally within the planned compact briefing grid.

---

## Activity metric block

Label:

> Labor Market Activity

Display:

- vertical filled bar;
- midpoint marker;
- five-tier activity label.

### Activity bar semantics

The bar fill height equals the LMCI Activity historical percentile.

Examples:

- 15th percentile → 15% fill and **Well Below Avg.**
- 50th percentile → 50% fill and **Near Avg.**
- 67th percentile → 67% fill and **Above Avg.**
- 90th percentile → 90% fill and **Well Above Avg.**

The bar represents historical position, not the raw LMCI index value.

### Midpoint marker

Show a clear but visually subordinate marker at 50%.

Purpose:

- make the historical midpoint immediately legible;
- help the reader judge how far current activity is above or below average;
- prevent the bar from appearing like an unlabeled progress meter.

The midpoint may use small inward-pointing markers, a short horizontal rule, or another accessible treatment consistent with the design system.

It must not obscure the fill or imply that 50% is a target.

---

## Momentum metric block

Label:

> Labor Market Momentum

Display:

- crosshair or equivalent neutral reference;
- arrow;
- five-tier momentum label.

The arrow should communicate direction through orientation:

- steeply down-right → Weakening Sharply;
- moderately down-right → Weakening;
- horizontal → Steady;
- moderately up-right → Strengthening;
- steeply up-right → Strengthening Sharply.

The arrow angle may vary continuously with the historical percentile, but the visible label remains one of the five fixed tiers.

Do not derive the arrow angle from an assumed `-1` to `+1` LMCI range.

Use a documented percentile-to-angle mapping with:

- 50th percentile = horizontal;
- low historical percentiles = downward;
- high historical percentiles = upward;
- a bounded maximum angle that remains visually legible.

The mapping must live in tested domain or visualization logic rather than inline component arithmetic.

---

## Color

Use three semantic color bands:

| Percentile | Semantic band |
|---|---|
| 0–40 | adverse |
| 40–60 | neutral |
| 60–100 | favorable |

Use existing semantic dashboard tokens where available.

Only introduce new color values if the current token set cannot represent these states accessibly.

Color may reinforce:

- bar fill;
- bar border;
- arrow stroke;
- tier label.

Color must not be the only means of communication. The text label, bar height, midpoint, and arrow orientation must remain understandable without color.

Verify contrast for all tier labels and controls.

---

# Expanded tile

Clicking **More** expands the tile in place.

The control changes to:

> Less

with the corresponding chevron state.

The expanded content should preserve and reorganize the useful explanatory material from the current Labor tile.

## Required expanded content

### 1. Plain-language LMCI interpretation

Include a concise deterministic sentence based on the two current LMCI readings.

Example structure:

> Labor-market activity is above its historical average, while momentum is strengthening.

Do not mention raw values in the first sentence unless doing so improves clarity.

Do not generate free-form commentary.

### 2. Raw LMCI readings

Show:

- LMCI Activity latest value and observation date;
- LMCI Momentum latest value and observation date;
- historical percentile for each;
- corresponding tier label.

Include a short explanation:

> LMCI readings are standardized indexes centered on their historical averages. Positive and negative raw values are not percentages and are not bounded between −1 and +1.

### 3. Supporting labor-market evidence

Show the existing supporting measures:

- unemployment rate;
- payroll change in the latest month;
- three-month average payroll change;
- prime-age employment-to-population ratio;
- initial unemployment claims, four-week average.

Use current committed data rather than hard-coded values.

For payrolls, distinguish clearly between:

- latest monthly payroll change;
- three-month monthly average.

Do not describe the three-month average as the number of jobs added in the latest month.

Where useful, include compact sparklines or links to the full research cards.

These measures explain or qualify the LMCI reading. They do not generate the headline tiers.

### 4. Divergence or tension

When supporting indicators materially diverge from the LMCI result, surface a concise factual tension statement.

Example:

> Payroll growth slowed in the latest month, while the broader LMCI momentum measure strengthened.

Requirements:

- name both measures;
- include values where useful;
- do not imply causation;
- do not override the LMCI headline result;
- do not show a tension merely because two series moved slightly differently.

Reuse approved tension or noise-gate logic where available. Do not invent a broad new generic conflict engine in this story.

### 5. Why this label

Provide a collapsed-by-default disclosure titled:

> Why this label

When expanded, show:

- current raw LMCI value;
- historical percentile;
- tier boundary;
- comparison history;
- activity-bar or arrow transformation;
- observation date;
- any staleness state.

### 6. Supporting evidence

Provide a collapsed-by-default disclosure titled:

> Supporting evidence

When expanded, show:

- source and observation date for each supporting indicator;
- methodology notes;
- known revision exposure;
- links to the existing research cards;
- Kansas City Fed attribution and source link.

Avoid duplicating the entire research-card content.

---

# Freshness and missing data

Use the repository’s existing freshness framework where available.

Requirements:

- Show the observation date of both LMCI series under More.
- If either primary LMCI series is stale beyond the approved threshold, show that state explicitly.
- Do not infer **Steady** merely because no new observation is available.
- If Activity is unavailable, show Activity as **Unavailable** rather than retaining an old unlabeled bar.
- If Momentum is unavailable, replace the arrow tier with **No fresh evidence** or the project’s approved equivalent.
- Supporting-data gaps must not break the collapsed tile.
- Tile failures must remain isolated from the rest of the briefing.

---

# Accessibility

- Use semantic headings and controls.
- The More/Less control must expose `aria-expanded` and `aria-controls`.
- All disclosures must be keyboard operable.
- The activity graphic must have an accessible factual description including:
  - tier label;
  - historical percentile;
  - midpoint meaning.
- The momentum graphic must have an accessible factual description including:
  - tier label;
  - historical percentile;
  - direction.
- Do not rely on SVG orientation or color alone.
- Preserve visible keyboard focus.
- Ensure the expanded tile does not introduce page-level horizontal overflow at narrow widths.
- Respect reduced-motion preferences if the expand/collapse or arrow state is animated.

---

# Responsive behavior

At the planned compact desktop tile width, show the two metric blocks side by side.

At narrow widths:

- preserve reading order;
- stack the metric blocks if needed;
- do not shrink labels or graphics until they become illegible;
- retain the midpoint marker and arrow orientation;
- contain all expanded content within the viewport.

Do not hard-code the entire component around exactly `340px` if that conflicts with the existing responsive grid. Treat approximately 340px as the intended compact desktop size.

---

# Architecture

Separate:

1. LMCI data acquisition and generated datasets;
2. repository access;
3. historical-percentile derivation;
4. tier mapping;
5. activity-bar display transformation;
6. momentum-arrow display transformation;
7. deterministic narrative selection;
8. presentational components.

Do not calculate percentile ranks, tier labels, or freshness rules directly in JSX.

Prefer pure tested functions and existing shared briefing utilities.

Do not create a generic visualization framework beyond what this tile and the approved briefing design require.

---

# Tests

Add deterministic tests covering at least:

## Data

- LMCI Activity refresh and validation;
- LMCI Momentum refresh and validation;
- missing values preserved as `null`;
- chronological unique observations;
- repository loaders;
- generated-file inventory.

## Percentiles

- lowest historical value;
- median;
- highest historical value;
- duplicate historical values;
- missing latest value;
- clamping;
- exact boundaries at 20, 40, 60, and 80.

## Activity tiers

- Well Below Avg.;
- Below Avg.;
- Near Avg.;
- Above Avg.;
- Well Above Avg.

## Momentum tiers

- Weakening Sharply;
- Weakening;
- Steady;
- Strengthening;
- Strengthening Sharply.

## Visual transformations

- 50th-percentile activity aligns with midpoint;
- activity fill uses percentile, not raw LMCI value;
- 50th-percentile momentum produces horizontal arrow;
- low momentum percentile points downward;
- high momentum percentile points upward;
- angle remains within its documented bound.

## UI

- collapsed tile contains only the required elements;
- raw LMCI values and supporting indicators are absent when collapsed;
- More reveals expanded content;
- Less collapses it;
- inner disclosures default to closed;
- supporting indicators appear only in expanded state;
- accessibility labels describe the visuals correctly;
- narrow viewport has no page-level overflow;
- primary-data failure remains isolated.

---

# Documentation

Update the appropriate documentation to record:

- the Labor tile now uses Kansas City Fed LMCI Activity and Momentum as its primary briefing evidence;
- unemployment, payrolls, prime-age employment, and initial claims are supporting evidence;
- the LMCI raw values are standardized and unbounded;
- the visible graphics use historical percentile ranks;
- the chosen comparison history;
- tier boundaries and labels;
- percentile-to-bar and percentile-to-angle mappings;
- data source and attribution;
- accepted limitations;
- refresh commands and current data ranges.

Update the Epic 04 briefing specification if it still describes unemployment and payrolls as the Labor tile’s primary drivers.

---

# Non-goals

- Do not create a proprietary labor-market composite.
- Do not average LMCI with unemployment, payrolls, claims, or prime-age employment.
- Do not allow supporting evidence to replace or override the LMCI headline classification.
- Do not treat LMCI values as percentages.
- Do not assume the indexes are bounded between −1 and +1.
- Do not show raw LMCI values in the collapsed tile.
- Do not preserve the current “Condition: Solid / Direction: Improving” presentation.
- Do not reproduce the accompanying mockup pixel-for-pixel.
- Do not redesign the full briefing grid in this story.
- Do not modify the existing full research cards except where necessary to add briefing links or shared data access.

---

# Verification

Before completion, run the repository’s required verification suite, including:

- real data refresh;
- lint;
- typecheck;
- tests;
- production build;
- generated-data and repository-loader reconciliation;
- desktop browser review;
- narrow-viewport browser review;
- keyboard and screen-reader-oriented interaction review;
- `git diff --check`.

Completion requires committed implementation and documentation, not only a visual prototype.
