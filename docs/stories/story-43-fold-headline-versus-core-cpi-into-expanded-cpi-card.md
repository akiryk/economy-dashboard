# Story 43 — Fold headline-versus-core CPI context into the expanded CPI card

## User story

**As a** dashboard user

**I want** the expanded CPI card to explain headline CPI, core CPI, PCE inflation, and the Fed’s 2% PCE target in one coherent place

**so that** I can understand consumer inflation, underlying inflation, and policy context without navigating multiple overlapping primary cards.

## Context

The primary CPI card remains the household-facing answer to:

> **How quickly are consumer prices rising?**

Story 41 adds PCE inflation and the Fed’s 2% PCE target to the expanded CPI view.

Story 42 replaces the standalone headline-versus-core CPI card with **What is driving inflation?**

The useful headline-versus-core comparison should move into the expanded CPI card rather than disappear.

## Dependencies

Implement after, or coordinate with, Stories 41 and 42 so the comparison is not duplicated indefinitely.

## Scope

Update only the expanded CPI card.

Do not alter the compact CPI sparkline, historical bands, primary headline value, or CPI assessment except where necessary for coherent navigation.

Do not create another primary card.

## Expanded structure

Organize the expanded CPI content into two clearly separated subsections.

### What is the underlying inflation trend?

Show:

- headline CPI inflation;
- core CPI inflation;
- one shared time axis;
- one y-axis;
- headline CPI as the visually primary line;
- core CPI as a lighter secondary line.

Purpose:

> Show whether volatile food and energy categories are pushing headline inflation above or below the broader ex-food-and-energy trend.

### How does inflation compare with the Fed’s preferred measure?

Show:

- headline CPI inflation;
- headline PCE inflation;
- a clearly labeled 2% Fed target for PCE;
- one time axis;
- one y-axis;
- CPI visually primary;
- PCE visually secondary.

Purpose:

> Explain the difference between consumer-facing CPI and the PCE measure used by the Federal Reserve.

## Headline-versus-core explanation

Use concise explanatory copy equivalent to:

> Headline CPI includes food and energy. Core CPI excludes them because their prices can move sharply from month to month and obscure the broader inflation trend. Food and energy still matter to households; core CPI is a diagnostic measure, not a replacement for headline inflation.

Show current values:

> Core CPI is X%, compared with headline CPI at Y%.

Generate a factual gap sentence:

- headline above core:
  > Food and energy are currently adding to headline inflation relative to core.

- headline below core:
  > Food and energy are currently reducing headline inflation relative to core.

- approximately equal:
  > Headline and core CPI are currently close.

Define and document the tolerance for “close.”

Do not say that headline-versus-core directly measures inflation breadth or proves persistence.

## CPI-versus-PCE explanation

State clearly:

- CPI focuses on prices paid directly by consumers;
- PCE covers a broader range of household spending, including spending on households’ behalf;
- the Fed’s formal 2% target applies to PCE;
- CPI and PCE may differ because of scope, weights, and formulas.

Show actual latest values and months separately.

Do not carry stale PCE values forward to the latest CPI month.

## Chart hierarchy

Do not create one four-line chart.

Use two separate comparison charts or vertically aligned panels.

Within each panel:

- use direct labels or a concise legend;
- preserve consistent CPI styling;
- use lighter styling for the secondary series;
- avoid dual axes;
- stack vertically on narrow screens.

The two panels should look related but answer distinct questions.

## Preserve existing research content

Retain:

- CPI range controls;
- zoom controls;
- source links;
- metadata;
- semantic tables;
- methodology;
- validation and failure isolation;
- accessible chart alternatives.

Add:

- core CPI provenance;
- PCE provenance;
- explanation of differing release months.

Do not remove existing CPI research merely to make room.

## Relationship to the inflation-drivers card

Add a concise cross-reference:

> To see which categories are contributing most to current CPI inflation, see **What is driving inflation?**

Use the project’s internal navigation convention if available.

Do not duplicate the full contribution chart inside the CPI card.

## Acceptance criteria

- Headline-versus-core context appears in the expanded CPI card.
- The expanded view contains two coherent comparisons.
- Headline versus core has its own chart or panel.
- CPI versus PCE and the 2% PCE target has its own chart or panel.
- No four-line combined plot is used.
- Headline CPI remains visually primary.
- Core CPI is explained as a diagnostic, not a superior household measure.
- Food and energy are explicitly acknowledged as important.
- No copy claims headline-versus-core measures breadth.
- PCE target language is technically correct.
- Different latest release months are handled truthfully.
- Existing controls, sources, and tables remain available.
- The new inflation-drivers card is cross-referenced without duplication.

## Tests

Test:

- headline above core;
- headline below core;
- headline approximately equal to core;
- correct gap calculation;
- exact month matching;
- differing latest dates;
- PCE above, at, and below target;
- no carry-forward;
- two distinct panels;
- no dual axes;
- responsive stacking;
- consistent CPI styling;
- distinct accessible summaries;
- no duplicate announcements;
- internal cross-reference.

## Documentation

Update:

- CPI expanded-view structure;
- core CPI interpretation guidance;
- PCE comparison guidance;
- relationship to the inflation-drivers card;
- multi-measure expanded-chart conventions.

The completion note must report:

- latest headline CPI;
- latest core CPI;
- headline-core gap;
- latest PCE and month;
- PCE distance from target;
- whether both panels remain legible at narrow widths.

## Non-goals

- Do not keep the old headline-versus-core card as a primary card.
- Do not add contribution bars to the CPI expanded view.
- Do not combine all inflation series into one chart.
- Do not claim core CPI excludes unimportant categories.
- Do not call CPI the Fed’s target measure.
- Do not add the federal-funds rate.
- Do not modify unrelated cards.

## Verification

Run lint, typecheck, tests, production build, desktop and narrow expanded-view review, label and release-date review, accessibility review, and `git diff --check`.

Completion requires committed implementation, tests, documentation, and browser verification.
