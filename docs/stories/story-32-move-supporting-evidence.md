# Story 32 — Simplify the Labor Market expanded details

## User story

**As a** dashboard user
**I want** the expanded Labor Market tile to show familiar supporting evidence before technical LMCI details
**so that** I can understand and evaluate the assessment without first parsing opaque index values, percentile mechanics, or repetitive methodology text.

---

## Context

The Labor Market tile uses the Kansas City Fed Labor Market Conditions Indicators as its headline analytical source:

- **LMCI Activity** determines the Activity tier and bar.
- **LMCI Momentum** determines the Momentum tier and arrow.

The collapsed tile now includes:

- the human question;
- a deterministic plain-English answer;
- the Activity and Momentum visuals;
- a **More** control.

The current expanded state leads with raw LMCI values, percentile positions, tier labels, and explanatory text about standardized indexes. This material is technically accurate but not useful enough to justify being the first thing shown after the user selects **More**.

The supporting evidence is more understandable and more useful:

- unemployment rate;
- latest monthly payroll change;
- three-month average payroll change;
- prime-age employment-to-population ratio;
- initial unemployment claims.

Reorganize the expanded state so this supporting evidence appears first. Move the LMCI methodology and attribution into a deeper collapsed disclosure.

---

## Product decision

The expanded Labor Market tile must use this information hierarchy:

1. **Supporting evidence** — visible immediately after selecting **More**
2. **How this assessment is calculated** — collapsed by default
3. Optional source and methodology details inside that disclosure

Do not lead with:

- raw LMCI index cards;
- percentile cards;
- tier cards;
- a standalone explanation of standardized indexes;
- the existing repetitive **Why this label** content.

The LMCI remains the source of the headline Activity and Momentum assessment. This story changes presentation and explanation, not the analytical model.

---

# Expanded-state structure

When the user selects **More**, reveal the following content in this order.

## 1. Supporting evidence

Show the section heading:

> Supporting evidence

Include a short introductory sentence:

> These measures provide context for the LMCI assessment but do not determine or override its headline Activity or Momentum tiers.

Then show the existing supporting indicators:

1. Unemployment rate
2. Latest monthly payroll change
3. Three-month average payroll change
4. Prime-age employment-to-population ratio
5. Initial unemployment claims, four-week average

Use current committed data. Do not hard-code sample values.

### Required information per indicator

Each supporting indicator must show:

- plain-language metric name;
- latest value;
- observation month or week;
- one concise methodology or interpretation note;
- provider attribution;
- link to the relevant research card.

### Required wording and distinctions

#### Unemployment rate

Show:

- latest provider-published monthly level;
- observation month;
- source attribution;
- research-card link.

Do not describe it as a job-finding probability.

#### Latest monthly payroll change

Show:

- latest monthly change;
- observation month;
- note that the latest estimate is commonly revised;
- source attribution;
- research-card link.

Do not confuse this with the three-month average.

#### Three-month average payroll change

Show:

- average monthly payroll change across the latest three months;
- latest observation month;
- note that recent payroll estimates are commonly revised;
- source attribution;
- research-card link.

Do not phrase it as the number of jobs added in the latest month.

#### Prime-age employment-to-population ratio

Show:

- latest provider-published monthly level;
- observation month;
- source attribution;
- research-card link.

#### Initial claims, four-week average

Show:

- latest provider-published weekly four-week average;
- week-ending date;
- source attribution;
- research-card link.

### Presentation

Supporting evidence should be:

- immediately visible after expansion;
- compact and scannable;
- readable without opening another disclosure;
- ordered as listed above;
- consistent with existing card and data-detail patterns.

Do not require an additional click to see the supporting evidence.

Do not duplicate full research-card content.

Compact rows or small evidence cards are acceptable. Prefer the simplest implementation that remains readable at narrow widths.

---

## 2. How this assessment is calculated

After the supporting evidence, provide one collapsed-by-default disclosure titled:

> How this assessment is calculated

This disclosure replaces the existing **Why this label** section and the current raw LMCI cards.

It should explain the analytical model in concise user-facing language.

### Required content

Include:

1. **What LMCI Activity means**

   > LMCI Activity summarizes the overall level of U.S. labor-market conditions across a broad set of indicators.

2. **What LMCI Momentum means**

   > LMCI Momentum summarizes whether those broad conditions are strengthening, holding steady, or weakening.

3. **How the visuals are derived**

   > Each current LMCI reading is compared with its committed historical series. The Activity bar shows its historical percentile, and the Momentum arrow shows the historical position of momentum.

4. **Current classifications**

   Show the current:
   - Activity tier;
   - Momentum tier;
   - observation month.

5. **Comparison history**

   State the actual comparison range used by the application.

6. **Source and attribution**

   Include:

   > Source: Federal Reserve Bank of Kansas City, Labor Market Conditions Indicators.

   Include the full citation requested by the Kansas City Fed:

   > Hakkio, Craig S., and Jonathan L. Willis. 2014. “Kansas City Fed’s Labor Market Conditions Indicators (LMCI).” Federal Reserve Bank of Kansas City, _The Macro Bulletin_, August 28.

   Include the existing source or methodology link.

### Optional technical details

The disclosure may include the current raw LMCI values and exact percentiles only if they are presented as secondary traceability details.

If included:

- place them after the plain-language explanation;
- do not give them their own large cards;
- do not make them the first content in the disclosure;
- label raw values clearly as standardized index readings;
- label percentiles clearly as historical positions;
- avoid unnecessary decimal precision.

Preferred formatting:

> Activity: Near Avg. · 43rd historical percentile · June 2026
> Momentum: Steady · 54th historical percentile · June 2026

If raw values are retained, round them to a sensible display precision unless an existing product standard requires otherwise.

Do not display five-decimal raw values such as `0.08758` or `0.12056` in the ordinary user-facing flow.

---

# Content to remove or replace

Remove the current expanded-state presentation of:

- separate large **LMCI Activity** and **LMCI Momentum** cards;
- raw index values as prominent content;
- repeated observation dates;
- repeated percentile and tier fields;
- the standalone paragraph explaining that LMCI values are not percentages and are not bounded between −1 and +1;
- the current **Why this label** section;
- the implementation-focused explanation of:
  - exact tier boundaries;
  - average-rank handling for ties;
  - bar-fill formula;
  - arrow-angle range;
  - the 50th-percentile midpoint;
  - duplicate summaries of current values.

Preserve exact transformation rules in developer-facing briefing rules or methodology documentation. They do not need to appear in the normal expanded tile.

---

# Collapsed-state preservation

This story must not change the collapsed Labor Market tile except where necessary to support the reorganized expansion.

Preserve:

- eyebrow;
- question;
- deterministic plain-English answer;
- Activity visual and label;
- Momentum visual and label;
- **More** control.

The collapsed state must not show:

- supporting evidence;
- source attribution;
- raw LMCI values;
- exact percentiles;
- methodology.

---

# Interaction

- Selecting **More** reveals Supporting evidence and the collapsed **How this assessment is calculated** disclosure.
- The outer control changes to **Less** with the correct chevron state.
- Selecting **Less** collapses the entire expanded region.
- **How this assessment is calculated** defaults to closed every time the tile is first expanded, unless the project already preserves nested disclosure state by design.
- The nested disclosure must be independently keyboard operable.
- The expanded state must not cause page-level horizontal overflow.

---

# Accessibility

- Use semantic headings and disclosure controls.
- Preserve logical reading order:
  1. plain-English answer;
  2. Activity;
  3. Momentum;
  4. More;
  5. Supporting evidence;
  6. How this assessment is calculated.
- The outer control must expose `aria-expanded` and `aria-controls`.
- The nested disclosure must expose its open or closed state through native semantics or equivalent accessible behavior.
- Research-card links must have descriptive accessible names.
- Do not rely on layout, font weight, or color alone to distinguish metric names from values.
- Preserve visible keyboard focus.
- Ensure long source and citation text wraps within the tile.

---

# Responsive behavior

At compact desktop widths:

- supporting evidence may use compact rows or small stacked cards;
- values and dates should remain easy to scan;
- source text should not dominate the section.

At narrow widths:

- stack fields rather than shrinking text excessively;
- keep each value associated clearly with its metric;
- allow provider and link text to wrap;
- contain all content within the viewport;
- avoid horizontal scrolling except in an existing intentional data-table region.

---

# Architecture

Separate:

1. supporting-evidence data selection;
2. user-facing formatting;
3. methodology content;
4. presentational layout.

Reuse existing repository data and research-card routes.

Do not:

- duplicate supporting datasets;
- recalculate LMCI classifications;
- add a new data source;
- create a generic evidence framework beyond what this tile requires;
- hard-code current values in JSX.

Prefer declarative evidence configuration if a similar pattern already exists in the repository.

---

# Acceptance criteria

- Selecting **More** shows Supporting evidence first.
- Supporting evidence is visible without opening another disclosure.
- All five required supporting indicators are shown.
- Latest monthly payroll change and three-month average payroll change are clearly distinguished.
- Each supporting indicator shows current value, observation period, concise note, source, and research-card link.
- The existing large LMCI Activity and Momentum detail cards are removed.
- Five-decimal raw LMCI values are not prominent in the expanded state.
- The standalone standardized-index explanation is removed from the primary expanded flow.
- The existing **Why this label** section is replaced by **How this assessment is calculated**.
- The methodology disclosure defaults to closed.
- The methodology disclosure explains Activity, Momentum, historical comparison, current tiers, source, and attribution.
- Exact transformation mechanics remain documented outside the ordinary expanded flow.
- The collapsed tile remains unchanged.
- More/Less and nested disclosure interactions remain accessible.
- Narrow viewports have no page-level horizontal overflow.
- Missing supporting data do not break the tile or hide available evidence.

---

# Tests

Add or update deterministic tests covering:

## Expanded hierarchy

- Supporting evidence appears before the methodology disclosure.
- Supporting evidence is visible immediately after expansion.
- **How this assessment is calculated** defaults to closed.
- Opening the nested disclosure reveals methodology and attribution.
- Closing the outer tile hides all expanded content.
- Reopening the tile restores the approved default nested state.

## Supporting evidence

- all five indicators render when data are available;
- current values and observation dates are used;
- latest monthly payroll change is distinct from the three-month average;
- revision notes appear for both payroll measures;
- research-card links point to the correct destinations;
- provider attribution is present;
- one missing supporting series does not suppress the others.

## Removed content

- no large raw LMCI Activity card;
- no large raw LMCI Momentum card;
- no prominent five-decimal raw index values;
- no duplicate percentile and tier summary blocks;
- no primary-flow paragraph about the index not being bounded between −1 and +1;
- no disclosure titled **Why this label**.

## Methodology disclosure

- includes Activity explanation;
- includes Momentum explanation;
- includes current tiers and observation period;
- includes comparison history;
- includes Kansas City Fed source attribution;
- includes the Hakkio and Willis citation;
- any raw values are secondary and sensibly rounded.

## Accessibility and responsive behavior

- correct heading and reading order;
- keyboard operation for More/Less and nested disclosure;
- visible focus;
- descriptive link names;
- no page-level horizontal overflow at narrow width.

---

# Documentation

Update the Labor tile or briefing documentation to record:

- supporting evidence is the first expanded content;
- the five supporting indicators and their roles;
- supporting indicators provide context but do not determine the LMCI headline;
- technical LMCI methodology is available one disclosure level deeper;
- raw LMCI values and exact visualization mechanics are intentionally deemphasized in the user interface;
- source attribution and full citation remain available;
- exact percentile and visualization formulas remain in developer-facing rules rather than ordinary tile copy.

---

# Non-goals

- Do not change the LMCI data source.
- Do not change Activity or Momentum percentile calculations.
- Do not change tier labels or boundaries.
- Do not change the deterministic plain-English answer.
- Do not redesign the collapsed visuals.
- Do not make supporting indicators determine or override the LMCI assessment.
- Do not add new labor-market indicators.
- Do not duplicate the full research cards inside the tile.
- Do not remove source attribution.
- Do not remove technical methodology from repository documentation.
- Do not redesign the rest of the briefing dashboard.

---

# Verification

Before completion, run the repository’s required verification suite, including:

- lint;
- typecheck;
- tests;
- production build;
- desktop browser review;
- narrow-viewport browser review;
- keyboard interaction review;
- reading-order and screen-reader-oriented review;
- `git diff --check`.

Completion requires committed implementation, tests, and documentation.
