# Story 14: Add Household Financial Stress

## Status

Planned.

## User story

As a dashboard reader, I want to see how much of household income is required to service debt so that I can assess an important source of aggregate household financial pressure alongside income, spending, and saving.

## Product question

**How much of household income is going toward required debt payments?**

This wording is intentionally narrower than “Are households financially stressed?” The selected measure captures aggregate debt-payment burden, not every form of financial hardship and not the distribution of stress across households.

## Scope

Add one card to the existing **Households** section using the Federal Reserve Board’s household debt-service ratio:

- **FRED series:** `TDSP`
- **Provider title:** Household Debt Service Payments as a Percent of Disposable Personal Income
- **Underlying publisher:** Board of Governors of the Federal Reserve System
- **Frequency:** Quarterly
- **Units:** Percent
- **Seasonal adjustment:** Seasonally adjusted
- **Transformation:** Provider-published level; no local economic transformation
- **History policy:** Full useful available history

The ratio represents estimated required mortgage and consumer-debt payments as a share of aggregate disposable personal income. Mortgage and consumer debt-service components sum to the total ratio.

Do not add housing affordability, delinquency rates, debt balances, loan-category breakdowns, or another household indicator in this story.

## Why this measure

Use `TDSP` rather than a delinquency series or a narrow loan-category measure because it:

- covers required payments on both mortgage and consumer debt;
- relates those payments to households’ aggregate disposable income;
- complements the existing income, spending, and saving cards without duplicating them;
- is published by the Federal Reserve Board and available through FRED;
- is a continuing series, unlike FRED’s discontinued household financial-obligations ratio (`FODSP`).

Do not interpret a lower ratio as proof that households are broadly comfortable. The aggregate can fall because of changes in interest rates, debt composition, underwriting, income, or the distribution of debt, and it can conceal severe pressure among particular households.

## Presentation requirements

### Card placement

Add the card to the existing **Households** section after the personal saving-rate card unless inspection of the current composition reveals a clearer ordering that preserves the section’s existing narrative.

Do not create a new dashboard section.

### Card title and copy

Use human-facing copy that accurately reflects the measure.

Recommended question:

> How much of household income is going toward required debt payments?

Recommended concise measure label:

> Household debt-service ratio

The explanatory copy must make clear that:

- the numerator is estimated required mortgage and consumer-debt payments;
- the denominator is aggregate disposable personal income;
- the measure is an aggregate ratio, not the share paid by a typical household;
- households can experience very different levels of financial pressure even when the aggregate ratio appears moderate.

Do not label the latest value “healthy,” “unhealthy,” “high,” “low,” “safe,” or “concerning” without an explicit analytical rule.

### Latest-value callout

Show the latest quarterly value as a percentage with the observation period.

Use the existing formatting conventions for quarterly percent-level series. Do not describe the value as year-over-year growth or as a percentage-point change.

### Chart behavior

Use the existing shared single-series time-series card and chart path where its behavior fits.

The card must:

- support the existing 5-year, 10-year, 20-year, and Maximum ranges;
- make Maximum display the full useful `TDSP` history;
- preserve missing observations as gaps rather than zeroes;
- use actual quarterly observations without smoothing or interpolation;
- avoid a target band, recession judgment, or good-versus-bad color treatment;
- use an axis policy suitable for a percentage level whose meaningful variation is well above zero;
- avoid forcing zero if doing so would materially compress the historical variation;
- include an accessible factual summary and semantic recent-observations table.

A zero reference line is not required unless the existing chart policy adds one for this exact level type and it remains visually useful.

### Supporting detail

The card’s supporting details must expose the standard provenance fields already used by the dashboard, including:

- source and source link;
- provider series identifier;
- frequency;
- units;
- seasonal adjustment;
- transformation;
- coverage;
- retrieval date.

The recent-observations table should follow the established quarterly-series convention and must not calculate or imply additional measures in React.

## Data-refresh requirements

Extend the established FRED refresh workflow with an explicit reviewed configuration for `TDSP`.

The refresh must:

- request the quarterly provider series through FRED;
- use the full-history policy and omit an arbitrary `observation_start`;
- omit a FRED units transformation so the provider-published percentage level is preserved;
- validate the provider response as untrusted data;
- normalize FRED’s missing marker to `null`;
- reject invalid or duplicate dates;
- reject malformed values and insufficient usable history;
- prevent observations after the retrieval date from entering the generated file;
- validate the complete `EconomicSeries` before replacement;
- replace the prior dataset atomically only after successful retrieval, normalization, validation, and serialization;
- preserve the prior valid file if this series fails;
- report provider identifier, generated count, coverage, latest observation, and output path without exposing the API key.

Suggested repository slug and output filename:

```text
household-debt-service-ratio
household-debt-service-ratio.json
```

Follow current repository naming conventions if inspection shows a more precise established pattern.

## Repository and UI integration

Implement only the additions needed for this card:

- register the generated dataset in the local repository loader registry;
- add story-specific presentation copy to the existing presentation registry;
- compose the card explicitly in the Households section;
- reuse existing card, range-control, chart, summary, table, error, and loading behavior where appropriate;
- keep provider metadata out of JSX and business logic out of the rendering layer;
- preserve independent card loading and failure isolation.

Do not introduce a schema-driven dashboard engine, new global state, a new charting dependency, or speculative abstractions for future household indicators.

## Epic and documentation corrections

Update Epic 02’s stale status information as part of this story:

- mark Story 09 complete;
- mark Story 10 complete;
- mark Story 12 complete;
- retain Story 12A as complete;
- retain Story 13 as complete;
- mark Story 14 complete only after its implementation has passed verification, been committed, and been pushed.

Also update the Phase 1 indicator scope so completed underlying inflation, inflation momentum, real disposable income and consumer spending, and personal saving rate are no longer shown as planned.

Update relevant architecture and data documentation to include `TDSP`, its coverage, its provider-published level semantics, and any measured bundle impact. Correct stale visible-card or supporting-series counts encountered in documentation rather than copying them forward.

Do not revise unrelated future-story scope.

## Tests

Add deterministic tests covering at least:

1. The `TDSP` refresh configuration uses the correct provider identifier, quarterly frequency, full-history policy, and no FRED units transformation.
2. Valid provider observations generate a validated percent-level `EconomicSeries` with correct metadata.
3. FRED missing markers remain `null` and are not converted to zero.
4. Invalid dates, duplicate dates, malformed values, and inadequate history fail safely.
5. A refresh failure preserves the previously committed valid dataset.
6. The local repository resolves the new slug and validates the imported JSON.
7. The card renders its latest value and quarterly period correctly.
8. Range filtering anchors to the latest valid observation and Maximum exposes the full generated history.
9. The factual summary and recent-observations table reflect the selected range and source observations.
10. The card failure state remains isolated from the other household cards.
11. The human-facing copy does not describe `TDSP` as a delinquency rate, debt balance, typical-household share, or complete measure of household hardship.

Use existing test conventions and fixtures. Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- the Households section contains the new card in the intended order;
- the question, measure label, latest value, period, explanation, source, and metadata are understandable;
- all range controls work;
- Maximum shows full useful history;
- quarterly dates are formatted correctly;
- the chart remains readable without forcing zero unnecessarily;
- tooltips display the correct quarter and percentage;
- keyboard focus and `aria-pressed` behavior match existing cards;
- the accessible summary and semantic table remain usable if the chart is unavailable;
- a simulated failure of the new dataset does not prevent the other cards from rendering;
- no empty future section or out-of-scope indicator appears.

Review the card specifically for conceptual accuracy: a reader should understand that the line shows aggregate required debt payments relative to aggregate disposable income, not the proportion of households in distress.

## Required verification

Run the repository’s complete required checks, including:

```text
npm run data:refresh
npm run lint
npm run typecheck
npm test
npm run build
git diff --check
```

Also perform all story-specific browser and manual checks required above.

Inspect the final diff for secrets, temporary files, generated artifacts outside the intended dataset, debug output, and unrelated changes. Stop development servers and temporary processes.

## Acceptance criteria

- [ ] One household financial-stress card is added using FRED `TDSP`.
- [ ] The card asks how much household income is going toward required debt payments.
- [ ] The card accurately identifies the measure as required mortgage and consumer-debt payments divided by aggregate disposable personal income.
- [ ] The card explicitly warns that aggregate burden can conceal large differences across households.
- [ ] The card does not claim to measure all household hardship or the typical household’s burden.
- [ ] The provider-published quarterly percent level is stored without an unnecessary local transformation.
- [ ] Full useful authoritative history is included.
- [ ] Existing ranges, accessible summaries, semantic tables, loading behavior, and failure isolation are preserved.
- [ ] Missing values remain missing and are never treated as zero or bridged.
- [ ] The refresh is validated and safely replaces only the new dataset.
- [ ] Deterministic tests cover data, repository, presentation, ranges, accessibility-supporting output, and failure behavior.
- [ ] Epic 02’s stale completion statuses and completed indicator-scope labels are corrected.
- [ ] Relevant architecture and refresh documentation is current, including corrected stale card counts encountered during the work.
- [ ] No housing, delinquency, loan-category, or other future indicator is added.
- [ ] Lint, type-check, tests, refresh, build, diff check, and browser verification pass.
- [ ] The implementation is committed in one focused commit and pushed without force.
- [ ] The local branch is synchronized with its upstream and the working tree is clean.

## Completion report

Follow `AGENTS.md` exactly. Report:

- what was implemented;
- important product and technical decisions;
- any deviations;
- all quality-check and browser-verification results;
- commit hash and commit message;
- branch name;
- GitHub remote used;
- push result;
- final working-tree status;
- known limitations or concerns for the next story.

End the completion report with:

```text
ALL DONE WITH USER STORY 14
```

## Pause conditions

Pause and report rather than guessing if:

- FRED `TDSP` is unavailable or materially different from the documented measure;
- its history or metadata conflicts with the story in a way that changes the product meaning;
- supporting the series requires a destructive domain-model change;
- the existing chart cannot represent the percent level accurately without substantial cross-cutting redesign;
- implementation would require credentials beyond the established FRED workflow;
- unrelated product behavior must change;
- the current repository state contradicts the verified completion state supplied for Stories 01–13 and 12A.
