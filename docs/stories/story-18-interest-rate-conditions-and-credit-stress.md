# Story 18: Add Interest-Rate Conditions and Broad Credit Stress

## Status

Complete.

## User story

As a dashboard reader, I want to see how short-term policy-sensitive interest rates compare with long-term Treasury yields and whether credit conditions are unusually tight or loose, so that I can understand two distinct dimensions of financial conditions.

## Product questions

Add two cards to a new **Financial conditions** section.

### Interest-rate conditions

> **How do short-term and long-term interest rates compare?**

### Broad credit stress

> **Are credit conditions tighter or looser than usual?**

These cards must remain separate. The first compares two directly observed interest rates. The second summarizes broad credit conditions relative to historical norms. Neither card is an overall verdict on the economy.

## Source decisions

Use FRED as the intermediary for all source data.

### Effective federal funds rate

- **FRED series:** `FEDFUNDS`
- **Provider title:** Federal Funds Effective Rate
- **Underlying publisher:** Board of Governors of the Federal Reserve System
- **Frequency:** Monthly
- **Units:** Percent
- **Seasonal adjustment:** Not seasonally adjusted
- **Transformation:** Provider-published monthly average of daily figures
- **History policy:** Full useful available history

Use the effective rate rather than the current target-range midpoint. The effective rate provides a consistent observed series across monetary-policy regimes and aligns directly with the monthly 10-year Treasury series.

### 10-year Treasury yield

- **FRED series:** `GS10`
- **Provider title:** Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity, Quoted on an Investment Basis
- **Underlying publisher:** Board of Governors of the Federal Reserve System, using Treasury-market data
- **Frequency:** Monthly
- **Units:** Percent
- **Seasonal adjustment:** Not seasonally adjusted
- **Transformation:** Provider-published monthly average of business-day yields
- **History policy:** Full useful available history

### Broad credit conditions

- **FRED series:** `NFCICREDIT`
- **Provider title:** Chicago Fed National Financial Conditions Credit Subindex
- **Underlying publisher:** Federal Reserve Bank of Chicago
- **Frequency:** Weekly
- **Units:** Index
- **Seasonal adjustment:** Not seasonally adjusted
- **Transformation:** Provider-published standardized credit subindex
- **History policy:** Full useful available history

The Chicago Fed states that positive values indicate credit conditions tighter than average and negative values indicate conditions looser than average.

Use `NFCICREDIT` as an approved substitute for the Epic’s originally contemplated broad corporate credit spread.

Do not use:

- ICE BofA corporate option-adjusted spreads, because FRED now exposes only a short recent window and the source carries third-party licensing restrictions;
- Moody’s Baa spreads, because the source terms explicitly restrict copying, redistribution, and storage without permission;
- a narrow high-yield spread that describes only speculative-grade borrowers;
- the overall NFCI, because this story already has a separate interest-rate card and the credit subindex provides a more focused complement.

Document this source substitution in Epic 02 and the methodology documentation.

## Scope

This story must:

1. add `FEDFUNDS`, `GS10`, and `NFCICREDIT` to the established refresh workflow;
2. generate and commit validated local datasets;
3. register all new series in the local repository;
4. add a new Financial conditions section;
5. add one two-series interest-rate relationship card;
6. add one single-series broad credit-conditions card;
7. provide full useful history and existing preset ranges;
8. inherit Story 09A’s shared historical zoom behavior without duplication;
9. preserve accessible summaries, semantic tables, provenance, loading states, and card-level failure isolation;
10. update Epic 02 and relevant durable documentation.

Do not add:

- the 2-year/10-year yield curve;
- recession predictions;
- mortgage rates;
- real interest rates;
- breakeven inflation;
- stock-market measures;
- exchange rates;
- bank-lending surveys;
- financial-stress composites beyond `NFCICREDIT`;
- separate high-yield and investment-grade cards;
- forecasts;
- threshold-driven good/bad classifications.

## Financial conditions section

Recommended section description:

> Interest rates and credit conditions affect borrowing costs and access to finance. Short- and long-term rates can move differently, while broader credit conditions can tighten or loosen for reasons not captured by Treasury yields alone.

Place the section after Business and manufacturing and before Government finances.

Do not render placeholders for future financial indicators.

## Interest-rate relationship card

### Question

> How do short-term and long-term interest rates compare?

### Measure label

> Federal funds rate and 10-year Treasury yield

### Product meaning

The card should explain:

- the effective federal funds rate is an overnight market rate strongly influenced by Federal Reserve policy;
- the 10-year Treasury yield reflects market pricing for longer-term Treasury borrowing and incorporates expectations about future short-term rates, inflation, growth, and risk;
- both are nominal interest rates;
- neither is directly a household or business borrowing rate;
- the difference between them is informative, but it does not mechanically predict a recession or any single outcome.

Do not label the federal funds rate simply “the Fed’s rate” without explaining that it is the observed effective rate.

### Latest-value presentation

Show both latest shared monthly values with equal visual weight.

Recommended structure:

```text
Latest shared month: June 2026

Federal funds rate: 3.6%
10-year Treasury yield: 4.5%
```

Optionally show the locally calculated difference:

```text
10-year yield: 0.8 percentage points above the federal funds rate
```

Use actual generated values.

Do not make the spread the only prominent number.

### Alignment and relationship calculation

At the presentation boundary:

1. align `FEDFUNDS` and `GS10` by exact calendar month;
2. retain only exact shared months for the relationship view;
3. calculate:

```text
long-short difference = GS10 - FEDFUNDS
```

4. express the difference in percentage points;
5. retain full precision until formatting;
6. do not persist the aligned pair or spread as a separate dataset;
7. do not substitute array position for date alignment.

A negative difference means the 10-year yield is below the effective federal funds rate. Do not automatically call this an “inverted yield curve,” because that term is often used for specific Treasury maturity spreads and this comparison includes the overnight federal funds rate.

### Chart behavior

Use the existing two-series relationship-chart architecture:

- one shared percentage axis;
- solid line for the effective federal funds rate;
- dashed line for the 10-year Treasury yield;
- include zero;
- retain a zero reference line where useful;
- no dual axes;
- no smoothing;
- preserve gaps;
- existing 5y, 10y, 20y, and Maximum presets;
- Maximum uses the fullest shared history;
- shared Story 09A zoom and Reset zoom;
- zoom changes visible summaries and tables but not source values;
- accessible chart label and factual summary;
- semantic recent-observations table;
- isolated loading and failure behavior.

### Tooltip

For each shared month, show:

- month;
- effective federal funds rate;
- 10-year Treasury yield;
- 10-year-minus-federal-funds difference in percentage points.

Use factual language such as:

```text
10-year yield 0.8 percentage points above the federal funds rate
```

or:

```text
10-year yield 1.2 percentage points below the federal funds rate
```

Do not add recession language.

### Accessible summary

Describe:

- visible period;
- latest shared month;
- first and latest values for both rates;
- visible high and low for each;
- latest difference and direction.

Do not infer why the rates differ.

### Semantic table

Recommended columns:

- Month
- Effective federal funds rate
- 10-year Treasury yield
- 10-year minus federal funds, percentage points

Supply a pre-aligned presentation model rather than calculating inside JSX.

## Broad credit-conditions card

### Question

> Are credit conditions tighter or looser than usual?

### Measure label

> Broad credit conditions

### Product meaning

Explain that the Chicago Fed credit subindex summarizes multiple credit-related measures relative to their historical averages.

The card must state:

- zero represents approximately average credit conditions under the index’s standardization;
- positive values indicate tighter-than-average credit conditions;
- negative values indicate looser-than-average credit conditions;
- the index is standardized, so a value such as `1.0` is not 1 percent and not a borrowing-rate spread;
- the measure covers broad credit conditions and is not limited to corporate bonds;
- it does not show whether every household, bank, or business faces the same conditions;
- it is a composite statistical index, not a directly observed price;
- methodology and component relationships may evolve with source revisions.

This card may use the source-defined tighter/looser direction because it is explicit in the official methodology. Do not extend that into unsupported labels such as healthy, dangerous, favorable, or crisis.

### Frequency decision

Preserve `NFCICREDIT` at its native weekly frequency if the current domain and chart architecture can support weekly dates with a small, explicit extension.

If weekly frequency is not currently supported:

- add only the narrow domain, formatting, range, summary, table, and chart support required for weekly time series;
- do not convert weekly observations into monthly averages merely to avoid adding frequency support;
- do not create a generic arbitrary-frequency system.

Pause only if weekly support conflicts materially with the existing architecture. Otherwise, implement it as part of this story.

### Latest-value callout

Show the latest weekly index value and observation week.

Recommended supporting label:

```text
Tighter than average
```

or:

```text
Looser than average
```

This wording may be derived directly from the sign of the official standardized index:

- positive: tighter than average;
- negative: looser than average;
- zero: near average.

Also show the numeric index value. Do not show only the qualitative label.

### Chart behavior

Use a single-series level chart:

- weekly observations;
- zero-centered meaning;
- include zero;
- show a zero reference line labeled or explained as historical average;
- no smoothing;
- preserve missing values as gaps;
- 5y, 10y, 20y, and Maximum;
- shared zoom and reset behavior;
- no target band;
- accessible factual summary;
- semantic recent-observations table;
- isolated loading and failure behavior.

Do not force a symmetric vertical axis unless current chart policy and visible values make it useful. Zero must remain visible.

### Tooltip

Show:

- formatted week;
- index value;
- tighter/looser/near-average interpretation derived from the sign.

Do not format the value as a percent.

### Accessible summary

Describe:

- visible period;
- first and latest visible values;
- visible minimum and maximum;
- whether the latest visible value is above, below, or near zero.

Use the official directionality only.

### Semantic table

Recommended columns:

- Week
- Credit-conditions index
- Relative condition

Examples for the final column:

- Tighter than average
- Looser than average
- Near average

Use one shared explicit tolerance for “near average” only if the product requires it. Otherwise, reserve “near average” for exactly zero and show the sign-based wording elsewhere.

## Shared zoom requirement

Both cards must inherit Story 09A’s centralized zoom implementation.

Do not add card-specific:

- `dataZoom` options;
- zoom state;
- reset controls;
- event listeners;
- visible-range slicing;
- summary/table zoom logic.

Weekly date support, if added, must be implemented in shared frequency-aware utilities so future weekly charts inherit the same behavior.

## Data refresh

### `FEDFUNDS`

The refresh must:

- request `series_id=FEDFUNDS`;
- use monthly frequency if required;
- use full-history policy;
- omit FRED `units`;
- retain provider-published percent values;
- normalize missing markers to `null`;
- reject malformed dates, duplicate months, malformed values, future observations, and insufficient history;
- validate a complete `EconomicSeries`;
- atomically replace the prior valid output;
- preserve the previous file on failure;
- report series identifier, count, coverage, latest value, and path.

Recommended identity:

```text
effective-federal-funds-rate
effective-federal-funds-rate.json
```

### `GS10`

Apply the same direct-series workflow:

- `series_id=GS10`;
- monthly;
- full history;
- no FRED units transformation;
- percent;
- not seasonally adjusted;
- atomic safe replacement.

Recommended identity:

```text
ten-year-treasury-yield
ten-year-treasury-yield.json
```

### `NFCICREDIT`

The refresh must:

- request `series_id=NFCICREDIT`;
- preserve weekly frequency;
- use full-history policy;
- omit FRED units transformations;
- retain the provider-published standardized index;
- normalize missing values to `null`;
- reject invalid or duplicate weekly dates;
- validate sufficient history;
- atomically replace the prior file;
- preserve the previous file on failure;
- report identifier, count, coverage, latest value, and output path.

Recommended identity:

```text
broad-credit-conditions
broad-credit-conditions.json
```

### Failure isolation

Each source may refresh independently under the existing direct-series model.

Runtime requirements:

- the interest-rate relationship card requires both rate series;
- failure of either rate series affects only that card;
- failure of the credit series affects only its own card;
- no failure suppresses unrelated dashboard sections.

## Domain model and shared charting

Reuse `EconomicSeries` and `{ date, value }`.

Add weekly frequency support only if it does not already exist.

Weekly support must include:

- runtime validation;
- UTC-safe date formatting;
- range filtering;
- summary formatting;
- semantic-table labels;
- shared zoom visible-period labels;
- tests.

Do not add intraday or daily-frequency support in this story.

Do not persist:

- the 10-year-minus-federal-funds difference;
- aligned relationship rows;
- qualitative credit labels;
- zoom state;
- visible-period summaries.

## Provenance

### Effective federal funds rate

Expose:

- FRED as intermediary;
- Board of Governors of the Federal Reserve System as source;
- `FEDFUNDS`;
- monthly;
- percent;
- not seasonally adjusted;
- monthly average of daily figures;
- full coverage;
- retrieval date.

### 10-year Treasury yield

Expose:

- FRED as intermediary;
- Board of Governors of the Federal Reserve System as immediate publisher;
- U.S. Treasury market data and constant-maturity methodology;
- `GS10`;
- monthly;
- percent;
- not seasonally adjusted;
- monthly average of business-day yields;
- full coverage;
- retrieval date.

### Credit conditions

Expose:

- FRED as intermediary;
- Federal Reserve Bank of Chicago as source;
- `NFCICREDIT`;
- weekly;
- standardized index;
- source-defined zero and sign interpretation;
- full coverage;
- retrieval date.

Document why `NFCICREDIT` was chosen instead of restricted or short-history proprietary corporate spread series.

## Documentation updates

Update Epic 02 based on verified repository status:

- mark Story 17 complete;
- mark business investment and industrial activity complete;
- mark Story 18 complete only after implementation, verification, commit, and push;
- record `NFCICREDIT` as the approved substitute for a broad corporate credit spread;
- leave Story 19 and later stories planned.

Update relevant durable documentation:

- Financial conditions section;
- supported-series configuration;
- exact-month rate alignment;
- locally calculated long-short difference;
- weekly-frequency support;
- source-defined credit-index interpretation;
- axis and formatting behavior;
- shared zoom support;
- generated coverage;
- visible-card and supporting-series counts;
- bundle impact.

## Tests

Add deterministic tests covering at least:

### Source refresh

1. `FEDFUNDS` is monthly, percent, full-history, and has no FRED units transformation.
2. `GS10` is monthly, percent, full-history, and has no FRED units transformation.
3. `NFCICREDIT` is weekly, an index, full-history, and has no FRED units transformation.
4. Valid responses generate validated series with correct provenance.
5. FRED missing markers remain `null`.
6. Invalid dates, duplicate periods, malformed values, future observations, and insufficient history fail safely.
7. Each source preserves its prior valid file on failure.
8. Failure of one source does not remove another source’s valid output.
9. The repository resolves all three slugs.
10. No browser-side provider request is introduced.

### Interest-rate relationship

11. Rates align by exact calendar month.
12. Months appearing in only one series do not become falsely paired.
13. The difference is calculated as `GS10 - FEDFUNDS`.
14. The difference is expressed in percentage points.
15. Full precision is retained before formatting.
16. The chart uses one shared percentage axis and no dual axis.
17. Copy does not present this spread as a guaranteed recession signal.
18. The latest callout gives both rates equal weight.

### Weekly credit support

19. Weekly dates validate and format correctly in UTC.
20. Weekly range filtering anchors to the latest valid week.
21. Shared zoom formats weekly visible periods correctly.
22. Semantic tables display unambiguous week labels.
23. Positive values map to tighter-than-average wording.
24. Negative values map to looser-than-average wording.
25. Index values are not formatted as percentages.
26. Zero remains visible and meaningful.
27. Missing weekly values remain gaps.

### Integration

28. The Financial conditions section appears in the intended order.
29. It contains exactly the two Story 18 cards.
30. Both inherit shared Story 09A zoom without duplicate implementation.
31. Summaries and tables follow the visible period.
32. Latest callouts retain their intended meaning while zoomed.
33. Each card fails independently.
34. Existing cards remain unchanged.
35. No out-of-scope yield-curve, mortgage-rate, stock-market, or high-yield card appears.
36. Documentation records the source substitution.

Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- the new section appears after Business and manufacturing;
- both card questions match their measures;
- both rates display on one readable axis;
- legends and line styles distinguish the two rates without color alone;
- the latest difference uses correct directional wording;
- Maximum exposes full shared rate history;
- the credit card shows weekly observations correctly;
- positive and negative credit-index readings are interpreted correctly;
- zero is visually clear;
- shared zoom and Reset zoom work on both cards;
- summaries and tables follow the visible range;
- narrow and desktop layouts remain readable;
- keyboard focus and controls remain usable;
- failure of one new card does not affect the other;
- no duplicated zoom UI appears.

Perform a product-meaning review:

- A reader should understand the effective federal funds rate is policy-influenced but observed.
- A reader should understand the 10-year yield is market-determined.
- A reader should not interpret their difference as a certain forecast.
- A reader should understand the credit index is standardized, not a percentage or borrowing rate.
- A reader should understand that positive credit-index values mean tighter-than-average conditions.

## Required verification

Run all checks required by `AGENTS.md`, including:

```text
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Also:

- inspect refresh reporting and generated JSON;
- confirm full useful coverage;
- verify weekly support throughout the shared chart path;
- inspect bundle output;
- inspect the diff for duplicated zoom logic or out-of-scope indicators;
- stop temporary processes;
- confirm no credentials, raw provider payloads, screenshots, logs, or unrelated changes are committed.

## Completion and Git requirements

Before completion:

1. Confirm only Story 18 scope was implemented.
2. Confirm Story 17 and Epic statuses are current.
3. Confirm the source substitution is documented.
4. Confirm weekly support is shared and narrowly implemented.
5. Confirm Story 09A zoom is inherited without duplication.
6. Confirm all checks pass.
7. Create one focused conventional-style commit.
8. Push without force.
9. Confirm the branch is synchronized and the working tree is clean.

The completion report must include:

- implementation summary;
- source and product decisions;
- reason for choosing `NFCICREDIT`;
- weekly-frequency architecture;
- quality checks, refresh output, and browser verification;
- confirmation of shared zoom reuse;
- generated coverage;
- bundle impact;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status;
- known limitations for Story 19.

End with:

```text
ALL DONE WITH USER STORY 18
```

## Acceptance criteria

Story 18 is complete when:

- a Financial conditions section exists;
- it contains an effective-federal-funds-rate versus 10-year-Treasury card;
- it contains a broad credit-conditions card using `NFCICREDIT`;
- rate observations align by exact month;
- the locally calculated rate difference is accurate and clearly labeled;
- the credit index preserves native weekly observations;
- source-defined tighter/looser interpretation is explained accurately;
- weekly support is shared across validation, charting, zoom, summaries, and tables;
- both cards inherit shared zoom without duplication;
- full useful history is included;
- missing values remain missing;
- card failures remain isolated;
- no out-of-scope financial indicator is added;
- Epic 02 and relevant documentation are current;
- all required checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
