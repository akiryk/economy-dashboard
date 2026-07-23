# Story 41 — Simplify the CPI card and add PCE policy context in the expanded view

## User story

**As a** dashboard user

**I want** the consumer-price card to keep CPI as the primary household-facing measure while showing PCE and the Fed’s 2% target in the expanded view

**so that** I can understand both the inflation consumers experience and the inflation measure the Federal Reserve uses for policy.

---

## Context

The current card asks:

> **How quickly are consumer prices rising?**

It uses headline CPI inflation as the primary metric.

CPI is the appropriate primary measure for this card because it is the most intuitive household-facing inflation measure. However, the Federal Reserve’s formal 2% inflation target applies to PCE inflation, not CPI.

The compact state should therefore remain focused on CPI.

The expanded state should add PCE and a clearly labeled 2% PCE target so the user can understand how consumer-facing inflation relates to the Fed’s preferred inflation measure.

---

## Card in scope

Apply this story only to the consumer-price inflation card.

Do not create a separate PCE card.

Do not modify unrelated inflation cards.

Use the shared compact-card architecture established for prior cards.

---

# Part 1 — Compact CPI card

## Primary question

Retain:

> **How quickly are consumer prices rising?**

This card remains centered on CPI.

---

## Measure label

Use a precise label equivalent to:

> **Consumer Price Index: percent change from year ago**

or the project’s canonical CPI source label.

---

## Latest-value callout

Display:

1. latest CPI inflation value;
2. short plain-English assessment;
3. observation period and unit;
4. supporting comparison copy.

Example structure:

> **3.5%**
>
> **Consumer prices are rising somewhat quickly.**
>
> June 2026 · Percent change from year ago
>
> CPI inflation is 1.5 percentage points above the 2% policy reference.

The exact assessment thresholds must be deterministic and documented.

Do not state that CPI is above or below the Fed’s official target.

---

## CPI assessment states

Use a neutral, human-readable classification.

Approved initial thresholds:

```ts
if (value < 0) {
  state = 'prices-falling'
} else if (value < 1.0) {
  state = 'very-low'
} else if (value <= 2.5) {
  state = 'near-two-percent'
} else if (value <= 4.0) {
  state = 'somewhat-high'
} else {
  state = 'high'
}
```

Suggested visible wording:

- below 0:
  > **Consumer prices are falling.**

- 0 to below 1.0:
  > **Consumer prices are rising very slowly.**

- 1.0 through 2.5:
  > **Consumer-price inflation is near the 2% policy reference.**

- above 2.5 through 4.0:
  > **Consumer prices are rising somewhat quickly.**

- above 4.0:
  > **Consumer prices are rising quickly.**

Keep classification separate from visible wording so the copy can be revised later without changing the thresholds.

Do not use favorable/adverse colors in this story.

---

## Compact historical chart

Use the shared compact historical-band chart.

Show:

- latest five years of CPI year-over-year inflation;
- trailing 25-year CPI percentile bands;
- latest marker;
- zero line;
- thin 2% policy-reference line;
- dynamic caption;
- shared help interaction.

The compact chart must show CPI only.

Do not add PCE to the compact sparkline.

---

## Historical bands

Use:

- inner band: 25th–75th percentile;
- outer band: 10th–90th percentile;
- trailing 25-year comparison window;
- finite observations only;
- preserved `null` gaps;
- no smoothing.

The historical bands describe CPI’s recent historical distribution.

They do not represent the Fed’s target.

---

## 2% reference line

Show a thin horizontal line at 2%.

Label it in the help text and accessible summary as:

> **2% policy reference**

Do not label it:

> CPI target

Do not imply that CPI is the measure formally targeted by the Federal Reserve.

The 2% line should be visually distinct from:

- zero;
- CPI line;
- percentile bands.

Use shared chart-theme infrastructure where possible.

---

## Compact caption

Use a dynamic caption equivalent to:

> **CPI inflation · June 2021–June 2026**

Use actual visible start and end periods.

---

## Compact help text

Use the shared historical-band explanation:

> **Recent historical comparison: past 25 years**
>
> The dark band shows the middle 50% of CPI readings during this period. The lighter bands extend the range to the middle 80%. Readings outside the shaded area fall within the highest or lowest 10% of the comparison period.

Add:

> The thin 2% line is a policy reference. The Federal Reserve’s formal 2% inflation target applies to PCE inflation, not CPI.

Keep the wording concise.

---

# Part 2 — Expanded CPI and PCE comparison

## Expanded subsection purpose

Add an expanded comparison answering:

> **How does CPI compare with the Fed’s preferred inflation measure?**

The expanded view should show:

- CPI inflation;
- PCE inflation;
- 2% Fed target for PCE.

CPI remains visually primary.

---

## Required series

### CPI

Use:

- headline CPI;
- year-over-year percent change;
- existing committed series;
- heavier line weight;
- primary legend or direct label.

### PCE

Use:

- headline PCE price index inflation;
- year-over-year percent change;
- committed official source data;
- lighter secondary line weight;
- clearly identified as the Fed’s preferred inflation measure.

Do not substitute core PCE for headline PCE in this comparison.

Core PCE may remain future supporting material but is outside this story.

### Fed target

Show:

- horizontal 2% line;
- label:
  > **2% Fed target for PCE**

This line applies to PCE, not CPI.

---

## Expanded chart design

Preferred implementation:

- one shared time axis;
- one y-axis because all series use percentage points;
- CPI as the visually dominant line;
- PCE as a lighter secondary line;
- 2% target as a thin reference line;
- explicit legend or direct labels.

Do not use dual y-axes.

Do not add the federal-funds rate in this story.

If the combined chart is materially cluttered during browser review, use two vertically aligned panels:

1. CPI and PCE comparison;
2. 2% PCE target reference retained in the same panel or both panels as appropriate.

Do not remove PCE solely because the first visual attempt is cluttered.

---

## Expanded chart labels

Use clear labels equivalent to:

- **CPI — consumer-facing inflation**
- **PCE — Fed’s preferred inflation measure**
- **2% Fed target for PCE**

Avoid abbreviations without explanation in accessible text.

---

## Expanded explanation

Add concise explanatory copy:

> CPI measures changes in prices paid directly by consumers and is the primary measure shown on this card. PCE covers a broader range of household spending, including spending made on households’ behalf, and is the inflation measure the Federal Reserve uses for its 2% longer-run goal.

Add a caution:

> CPI and PCE usually move in the same broad direction, but they can differ because they use different scopes, weights, and formulas.

Do not claim that one is always more accurate than the other.

---

# Part 3 — Supporting comparison copy

## CPI versus 2% reference

For the compact supporting sentence, calculate:

```text
CPI difference from 2% reference = latest CPI inflation - 2.0
```

Examples:

- `3.5%`:
  > CPI inflation is 1.5 percentage points above the 2% policy reference.

- `2.0%`:
  > CPI inflation is at the 2% policy reference.

- `1.6%`:
  > CPI inflation is 0.4 percentage points below the 2% policy reference.

Use:

- **1 percentage point** only for exactly `1.0`;
- **percentage points** for all other values.

Never render:

- `% percentage points`;
- “above the Fed’s CPI target”;
- “below the Fed’s CPI target.”

---

## PCE versus Fed target

In the expanded view, calculate:

```text
PCE difference from target = latest PCE inflation - 2.0
```

Suggested wording:

- above:
  > PCE inflation is X percentage points above the Fed’s 2% target.

- equal at display precision:
  > PCE inflation is at the Fed’s 2% target.

- below:
  > PCE inflation is X percentage points below the Fed’s 2% target.

This is the technically correct place to use “Fed target.”

---

# Part 4 — Data requirements

## CPI

Preserve the existing CPI source, transformation, refresh behavior, and provenance.

---

## PCE

Add or reuse an official PCE price-index series.

Requirements:

- headline PCE price index;
- monthly frequency where available;
- year-over-year percent change;
- exact 12-month matching;
- no interpolation across missing months;
- no browser-side provider request;
- committed deterministic data;
- documented source and transformation.

If a canonical PCE inflation series already exists in the repository, reuse it.

Do not create a competing duplicate series.

---

## Frequency alignment

CPI and PCE are both monthly but may have different latest release dates.

Requirements:

- do not fabricate a shared latest month;
- preserve each series’ actual observation dates;
- align by month where both exist;
- allow one series to end earlier than the other;
- show latest period separately in tooltip and summary;
- explain if PCE lags CPI by one release.

Do not silently carry forward stale PCE values.

---

# Part 5 — Accessibility

## Compact summary

Include:

- latest CPI value and month;
- plain-English CPI assessment;
- five-year CPI line;
- trailing 25-year CPI bands;
- 2% line as policy reference;
- explicit statement that the Fed’s formal target applies to PCE.

Example:

> CPI inflation was 3.5% in June 2026. Consumer prices are rising somewhat quickly. The line shows five years of CPI inflation. The shaded bands show the middle 50% and middle 80% of CPI readings over the past 25 years. The 2% line is a policy reference; the Federal Reserve formally targets PCE inflation.

---

## Expanded summary

Include:

- latest CPI value and date;
- latest PCE value and date;
- PCE difference from 2% target;
- explanation of what each series measures;
- no claim of simple causality.

Ensure the chart is not the only accessible comparison.

---

# Part 6 — Architecture

Use the shared:

- compact-card layout;
- historical-band derivation utility;
- historical-band chart;
- help primitive;
- chart-theme values;
- formatting utilities.

Metric-specific code should own:

- CPI assessment thresholds;
- CPI wording;
- PCE wording;
- 2% reference semantics;
- PCE target semantics;
- expanded comparison chart;
- accessible summaries.

Do not force PCE-specific target language into the generic historical-band component.

If needed, add a generic optional horizontal-reference facility that accepts:

- value;
- label;
- line style;
- accessible description.

Only add it if Card #1 or another demonstrated consumer can also use the abstraction cleanly; otherwise keep the CPI reference configuration local to this card while reusing the shared renderer.

---

# Acceptance criteria

## Compact state

- Card is collapsed by default.
- CPI remains the primary metric.
- Latest CPI value is prominent.
- Plain-English CPI assessment is shown.
- Five-year CPI sparkline is shown.
- Trailing 25-year CPI bands are shown.
- Zero line is shown.
- Thin 2% policy-reference line is shown.
- PCE is not shown in the compact chart.
- Help text explicitly says the Fed’s formal target applies to PCE, not CPI.
- Supporting copy uses percentage points correctly.

## Expanded state

- More reveals the existing full CPI research content.
- Expanded comparison includes CPI, PCE, and the 2% PCE target.
- CPI is visually primary.
- PCE is clearly labeled as the Fed’s preferred inflation measure.
- 2% line is clearly labeled as the Fed target for PCE.
- No dual y-axis is used.
- Existing CPI controls, sources, and table remain available.
- PCE provenance and transformation are documented.
- Different latest release dates are handled truthfully.

## Accuracy

- No text says the Fed targets CPI.
- No text calls 2% a CPI target.
- PCE target comparison uses PCE, not CPI.
- CPI comparison uses “policy reference.”
- Percentage-point grammar is correct.
- No stale PCE value is carried forward.

## Architecture

- Shared compact components are reused.
- No duplicate CPI compact chart implementation is created.
- No new charting library is added.
- No unrelated card changes.

---

# Tests

## CPI classification

Test threshold boundaries for:

- prices falling;
- very low;
- near 2%;
- somewhat high;
- high;
- missing data.

---

## Reference comparison

Test:

- CPI above 2%;
- CPI exactly 2%;
- CPI below 2%;
- singular/plural percentage-point grammar;
- no `% percentage points`;
- no “Fed CPI target” language.

---

## PCE transformation

Test:

- exact 12-month year-over-year calculation;
- missing prior-year observation;
- missing current observation;
- chronological order;
- no interpolation;
- no mutation;
- no premature rounding.

---

## Series alignment

Test:

- same latest month;
- PCE ending one month earlier;
- CPI ending one month earlier;
- internal missing month;
- tooltip uses actual dates;
- no carry-forward.

---

## Compact UI

Test:

- CPI only in sparkline;
- historical bands;
- zero line;
- 2% policy reference;
- dynamic caption;
- help wording;
- More/Less behavior.

---

## Expanded UI

Test:

- CPI line present;
- PCE line present;
- 2% PCE target present;
- CPI visually primary;
- legend/direct labels correct;
- no dual axis;
- existing CPI research content preserved;
- narrow layout remains usable.

---

## Accessibility

Test:

- CPI summary announced once;
- PCE comparison summary available;
- target/reference distinction stated;
- chart not sole source of comparison;
- help keyboard interaction preserved.

---

# Documentation

Update:

- CPI metric documentation;
- PCE source and transformation documentation;
- compact-card rollout record;
- inflation-card interpretation guidance;
- 2% policy-reference semantics;
- expanded comparison-chart design.

Completion note must report:

- latest CPI value and classification;
- latest PCE value and release month;
- CPI difference from 2% reference;
- PCE difference from Fed target;
- current CPI historical-band position;
- whether the combined expanded chart is legible;
- whether a two-panel fallback was required.

---

# Non-goals

- Do not create a separate PCE card.
- Do not add core PCE.
- Do not add the federal-funds rate.
- Do not imply a simple causal relationship between inflation and policy.
- Do not call 2% the CPI target.
- Do not remove CPI from the card.
- Do not add another charting library.
- Do not modify unrelated cards.
- Do not redesign the entire Prices section.

---

# Verification

Before completion, run:

- lint;
- typecheck;
- full test suite;
- production build;
- compact desktop review;
- expanded desktop review;
- narrow-viewport review;
- CPI/PCE label review;
- 2% target/reference wording review;
- tooltip-date review;
- keyboard and screen-reader review;
- no-duplicate-fetch review;
- bundle review;
- `git diff --check`.

Completion requires committed implementation, tests, documentation, and browser verification.
