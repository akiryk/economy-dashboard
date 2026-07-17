# Story 19: Add Federal Deficit and Debt Held by the Public

## Status

Complete.

## User story

As a dashboard reader, I want to understand the federal government’s current budget balance and its accumulated debt burden relative to the size of the economy, so that I can distinguish annual borrowing from the stock of outstanding public debt.

## Product questions

Add two separate cards to a new **Government finances** section.

### Federal budget balance

> **How large is the federal budget deficit or surplus relative to the economy?**

### Federal debt

> **How large is federal debt held by the public relative to the economy?**

These cards must remain separate. The budget balance is an annual flow; debt held by the public is an accumulated stock measured at a point in time.

## Source decisions

Use FRED as the intermediary for both official series.

### Federal surplus or deficit as a share of GDP

- **FRED series:** `FYFSGDA188S`
- **Provider title:** Federal Surplus or Deficit [-] as Percent of Gross Domestic Product
- **Underlying sources:** U.S. Office of Management and Budget and Federal Reserve Bank of St. Louis
- **Frequency:** Annual
- **Units:** Percent of GDP
- **Seasonal adjustment:** Not seasonally adjusted
- **Transformation:** Provider-published ratio
- **History policy:** Full useful available history, beginning in 1929

FRED constructs the series as:

```text
((Federal surplus or deficit / 1000) / annual GDP) × 100
```

Negative values represent deficits. Positive values represent surpluses.

Use the published ratio directly. Do not recompute it locally from separate receipts, outlays, or GDP series.

### Federal debt held by the public as a share of GDP

- **FRED series:** `FYGFGDQ188S`
- **Provider title:** Federal Debt Held by the Public as Percent of Gross Domestic Product
- **Underlying sources:** U.S. Office of Management and Budget, U.S. Department of the Treasury, and Federal Reserve Bank of St. Louis
- **Frequency:** Quarterly
- **Units:** Percent of GDP
- **Seasonal adjustment:** Seasonally adjusted
- **Transformation:** Provider-published ratio
- **History policy:** Full useful available history, beginning in 1970 Q1

FRED constructs the series as:

```text
((Federal debt held by the public / 1000) / GDP) × 100
```

Use debt held by the public rather than total public debt. Debt held by the public excludes intragovernmental holdings such as Treasury securities held by federal trust funds. It includes debt held outside federal government accounts, including holdings of private investors, foreign investors, and the Federal Reserve.

Do not substitute total public debt, gross federal debt, debt subject to the statutory limit, debt per person, or the market value of Treasury securities.

## Scope

This story must:

1. Add `FYFSGDA188S` and `FYGFGDQ188S` to the established FRED refresh workflow.
2. Preserve both as provider-published percent-of-GDP series.
3. Generate and commit validated local datasets.
4. Register both datasets in the local repository.
5. Add a new Government finances section.
6. Add one annual budget-balance card.
7. Add one quarterly debt-held-by-the-public card.
8. Provide full useful available history.
9. Inherit Story 09A’s shared historical zoom behavior without duplication.
10. Preserve accessible summaries, semantic tables, provenance, loading states, and card-level failure isolation.
11. Update Epic 02 and directly relevant documentation.

Do not add:

- federal receipts or outlays;
- primary deficit;
- interest expense;
- fiscal projections or forecasts;
- total federal debt;
- intragovernmental debt;
- debt-ceiling information;
- state or local government finances;
- partisan interpretations;
- debt-sustainability thresholds;
- good/bad ratings.

## Government finances section

Recommended section description:

> Federal budget balances show whether the government borrowed or saved during a year, while debt held by the public shows the accumulated federal obligations financed outside government accounts. Both are shown relative to GDP so they can be compared across periods of different economic size.

Place this section after **Financial conditions** and before **Trade and tariffs**.

Do not render placeholders for future government-finance indicators.

## Federal budget-balance card

### Question

> How large is the federal budget deficit or surplus relative to the economy?

### Concise measure label

> Federal budget balance

### Latest-value callout

Show the latest annual value and year.

Example:

```text
−6.2% of GDP
Deficit
2025
```

or:

```text
+1.1% of GDP
Surplus
2001
```

Use the actual source value. Preserve the provider’s sign convention rather than converting deficits into positive numbers.

### Product meaning

The explanation must state:

- the value is the annual federal surplus or deficit as a share of annual GDP;
- negative values indicate deficits;
- positive values indicate surpluses;
- a deficit adds to federal borrowing needs, but it is not identical to the annual change in the debt-to-GDP ratio;
- the debt ratio can move differently because of GDP growth, timing, and other financial transactions or classifications;
- the measure is annual and is not a real-time estimate of the current fiscal year;
- the chart does not identify why a deficit or surplus occurred.

Do not call a smaller deficit a surplus. A deficit remains a deficit until the value rises above zero.

Do not describe a move from `−3%` to `−6%` as an improvement. It represents a larger deficit relative to GDP.

### Chart behavior

Use a single-series annual percentage chart:

- preserve source values directly;
- include zero and show a clear zero reference line;
- do not smooth observations;
- preserve missing observations as gaps;
- support 5y, 10y, 20y, and Maximum;
- make Maximum expose full history beginning in 1929;
- inherit shared Story 09A zoom and Reset zoom behavior;
- use an axis that accommodates deficits and surpluses without requiring symmetry;
- provide an accessible factual summary and semantic recent-observations table;
- preserve independent loading and failure behavior.

### Tooltip

Show:

- year;
- signed percent of GDP;
- balance type: deficit, surplus, or balanced.

### Accessible summary

Describe:

- visible period;
- first and latest visible values;
- largest visible deficit, meaning the most negative observation;
- largest visible surplus, if any;
- whether the latest observation is a deficit, surplus, or exactly balanced.

Do not use generic minimum/maximum language where it obscures the sign meaning.

### Semantic table

Recommended columns:

- Year
- Federal budget balance, percent of GDP
- Balance type

Balance type values:

- Deficit
- Surplus
- Balanced

When zoomed, the table must follow the visible period through the shared Story 09A path.

## Federal debt-held-by-the-public card

### Question

> How large is federal debt held by the public relative to the economy?

### Concise measure label

> Federal debt held by the public

### Latest-value callout

Show the latest quarterly value and period.

Example:

```text
98.7% of GDP
2026 Q1
```

Use the actual source value.

### Product meaning

The explanation must state:

- the numerator is federal debt held outside federal government accounts;
- the denominator is GDP;
- the measure is a debt stock relative to the economy’s annual rate of output;
- “held by the public” includes debt held by private and foreign investors, banks, pension funds, state and local governments, and the Federal Reserve;
- it excludes intragovernmental holdings such as federal trust-fund holdings;
- it is not the same as total public debt or gross federal debt;
- an increasing ratio can result from more debt, slower GDP growth, or both;
- the ratio can decline while nominal debt rises if GDP grows faster;
- the chart does not determine whether the debt level is sustainable.

Do not describe this as the percentage of GDP “spent on debt.” It is a stock-to-flow ratio, not an annual expenditure share.

Do not imply that a value near 100% means all debt is due within one year or equals one year of government revenue.

### Chart behavior

Use a single-series quarterly percentage-level chart:

- preserve provider-published values;
- use a padded level axis;
- do not force zero if that makes historical variation unreadable;
- do not add a 100% threshold line;
- do not smooth observations;
- preserve missing observations as gaps;
- support 5y, 10y, 20y, and Maximum;
- make Maximum expose full history beginning in 1970 Q1;
- inherit shared Story 09A zoom and Reset zoom behavior;
- provide an accessible factual summary and semantic recent-observations table;
- preserve independent loading and failure behavior.

### Tooltip

Show:

- quarter;
- federal debt held by the public as percent of GDP.

Do not shorten the label to “federal debt” where that could be confused with total debt.

### Accessible summary

Describe:

- visible period;
- first and latest visible values;
- visible minimum and maximum;
- change from the first to latest visible observation in percentage points.

Do not describe the latest level as safe, unsafe, excessive, sustainable, or unsustainable.

### Semantic table

Recommended columns:

- Quarter
- Federal debt held by the public, percent of GDP

When zoomed, the table must follow the visible period.

## Annual-frequency support

Inspect the current domain and chart architecture before implementation.

If annual frequency is not already supported, add only the narrow shared support required for:

- runtime validation;
- UTC-safe observation labels;
- selected-range filtering;
- chart-axis formatting;
- accessible summaries;
- semantic tables;
- Story 09A visible-period and zoom labels.

Annual dates should display as years, such as `2025`.

Implement annual support once through shared frequency-aware utilities. Do not add budget-card-specific date formatting, range logic, or zoom behavior.

## Shared zoom requirement

Both cards must inherit Story 09A’s centralized implementation.

Do not add card-specific:

- `dataZoom` configuration;
- zoom state;
- Reset zoom markup;
- event subscriptions;
- visible-range slicing;
- summary or table filtering.

Any annual-frequency extension must work through the same shared path used by the other chart frequencies.

## Data refresh

### `FYFSGDA188S`

The refresh must:

- request `series_id=FYFSGDA188S`;
- preserve annual frequency;
- use full-history policy;
- omit FRED `units` transformations;
- preserve provider-published percent-of-GDP values and signs;
- normalize FRED’s missing marker to `null`;
- reject malformed dates, duplicate years, malformed values, future observations, and insufficient history;
- validate a complete `EconomicSeries`;
- atomically replace the prior valid output;
- preserve the prior file on failure;
- report identifier, count, coverage, latest value, and output path.

Recommended identity:

```text
federal-budget-balance
federal-budget-balance.json
```

Metadata must state that the series is a FRED-constructed ratio using OMB fiscal data and annual GDP.

### `FYGFGDQ188S`

The refresh must:

- request `series_id=FYGFGDQ188S`;
- preserve quarterly frequency;
- use full-history policy;
- omit FRED `units` transformations;
- preserve provider-published percent-of-GDP values;
- normalize missing values to `null`;
- reject malformed dates, duplicate quarters, malformed values, future observations, and insufficient history;
- validate a complete `EconomicSeries`;
- atomically replace the prior valid output;
- preserve the prior file on failure;
- report identifier, count, coverage, latest value, and output path.

Recommended identity:

```text
federal-debt-held-by-public
federal-debt-held-by-public.json
```

Metadata must identify the measure as debt held by the public, not total federal debt.

### Failure isolation

Each source refreshes independently.

At runtime:

- failure of the budget-balance series affects only that card;
- failure of the debt series affects only that card;
- neither failure suppresses the other card or any other section.

## Data model and repository

Reuse the existing `EconomicSeries` and `{ date, value }` observation model.

Add annual frequency only if it is not already supported.

Register both slugs explicitly.

Do not persist:

- deficit/surplus labels;
- changes in debt-to-GDP;
- historical thresholds;
- zoom state;
- selected-range summaries.

These belong at the presentation boundary.

## Provenance requirements

### Budget balance

Expose:

- FRED as intermediary and ratio constructor;
- U.S. Office of Management and Budget as underlying fiscal-data source;
- `FYFSGDA188S`;
- annual;
- percent of GDP;
- not seasonally adjusted;
- provider-published ratio and formula;
- full coverage;
- retrieval date.

### Debt held by the public

Expose:

- FRED as intermediary and ratio constructor;
- U.S. Office of Management and Budget and U.S. Department of the Treasury as underlying sources where supported by current metadata;
- `FYGFGDQ188S`;
- quarterly;
- percent of GDP;
- seasonally adjusted;
- provider-published ratio and formula;
- full coverage;
- retrieval date.

The application performs no local economic derivation for either card.

## Documentation updates

Update Epic 02 based on verified repository status:

- mark Story 18 complete;
- mark financial conditions and credit stress complete;
- mark Story 19 complete only after implementation, verification, commit, and push;
- mark federal deficit as a share of GDP complete;
- mark federal debt held by the public as a share of GDP complete;
- leave Story 20 and Story 21 planned.

Update directly relevant documentation for:

- the Government finances section;
- supported-series configuration;
- annual-frequency support;
- deficit and surplus sign semantics;
- the distinction between annual flows and debt stocks;
- the distinction between debt held by the public and total public debt;
- axis and formatting policies;
- shared zoom behavior;
- generated coverage;
- visible-card and supporting-series counts;
- bundle impact.

Do not broaden Story 19 into general fiscal-policy analysis.

## Tests

Add deterministic tests covering at least:

### Budget-balance source and semantics

1. `FYFSGDA188S` is annual, full-history, percent of GDP, and uses no FRED units transformation.
2. Metadata identifies OMB and FRED’s ratio construction accurately.
3. Negative values remain negative and map to `Deficit`.
4. Positive values map to `Surplus`.
5. Zero maps to `Balanced`.
6. Formatting preserves signs.
7. Missing values remain `null`.
8. Invalid dates, duplicate years, malformed values, future observations, and insufficient history fail safely.
9. Failed refresh preserves the prior valid file.
10. The repository resolves the slug.

### Debt source and semantics

11. `FYGFGDQ188S` is quarterly, full-history, percent of GDP, and uses no FRED units transformation.
12. Metadata identifies debt held by the public rather than total public debt.
13. Valid values remain provider-published percentage levels.
14. Missing values remain `null`.
15. Invalid dates, duplicate quarters, malformed values, future observations, and insufficient history fail safely.
16. Failed refresh preserves the prior valid file.
17. The repository resolves the slug.
18. Copy does not describe the ratio as an annual spending share.
19. Copy explains that nominal debt may rise while the ratio falls.

### Annual frequency

20. Annual dates validate correctly.
21. Annual observation labels render as years.
22. Annual range filtering anchors to the latest year.
23. Annual Story 09A visible-period labels format correctly.
24. Annual zoom and Reset zoom work through the shared implementation.
25. No card-specific annual date or zoom logic is introduced.

### Presentation and integration

26. The Government finances section appears after Financial conditions.
27. It contains exactly the two Story 19 cards.
28. The budget-balance card uses a zero-inclusive signed axis.
29. The debt card uses a padded level axis without an arbitrary 100% threshold.
30. The budget summary identifies the largest deficit by the most negative value.
31. Latest callouts use correct periods and units.
32. Both cards inherit shared Story 09A zoom without duplication.
33. Summaries and tables follow the visible range.
34. Latest callouts retain their intended meaning while zoomed.
35. Each card fails independently.
36. Existing cards remain unchanged.
37. No receipts, outlays, interest expense, forecasts, or total-debt card appears.
38. No browser-side provider request is introduced.

Use established fixtures and test conventions. Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- the Government finances section appears in the intended order;
- both questions match their measures;
- annual budget dates display as years;
- quarterly debt dates display as quarters;
- negative budget values are clearly deficits;
- positive budget values are clearly surpluses;
- moving from a smaller negative number to a larger negative number is not described as improvement;
- Maximum budget history reaches 1929;
- Maximum debt history reaches 1970 Q1;
- shared zoom and Reset zoom work on annual and quarterly charts;
- summaries and tables follow the visible period;
- latest callouts remain tied to the latest source observations;
- the debt card consistently says “held by the public”;
- the debt card does not imply the ratio is an annual payment;
- no arbitrary debt threshold appears;
- desktop and narrow layouts remain readable;
- keyboard focus and controls remain usable;
- failure of one card leaves the other and prior sections usable;
- no duplicate zoom UI appears.

Perform an explicit product-meaning review:

- A reader should understand that the deficit is an annual flow.
- A reader should understand that debt is an accumulated stock.
- A reader should understand that both are divided by GDP for scale.
- A reader should understand that negative budget values mean deficits.
- A reader should not confuse debt held by the public with total public debt.
- A reader should not interpret the debt ratio alone as a sustainability verdict.

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
- confirm full useful source coverage;
- verify annual support through validation, charting, zoom, summaries, and tables;
- inspect bundle output;
- inspect the diff for duplicate zoom logic or out-of-scope fiscal indicators;
- stop temporary processes;
- confirm no credentials, raw provider payloads, screenshots, logs, or unrelated files are committed.

## Completion and Git requirements

Before completion:

1. Confirm only Story 19 scope was implemented.
2. Confirm Story 18 and Epic statuses are current.
3. Confirm annual support is shared and narrow.
4. Confirm budget-flow and debt-stock meanings remain distinct.
5. Confirm debt held by the public is not mislabeled as total debt.
6. Confirm Story 09A zoom is inherited without duplication.
7. Confirm all required checks pass.
8. Create one focused conventional-style commit.
9. Push without force.
10. Confirm the branch is synchronized and the working tree is clean.

The completion report must include:

- implementation summary;
- source and product decisions;
- annual-frequency architecture;
- quality checks, refresh output, and browser verification;
- confirmation of shared zoom reuse;
- generated coverage;
- bundle impact;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status;
- known limitations for Story 20.

End with:

```text
ALL DONE WITH USER STORY 19
```

## Acceptance criteria

Story 19 is complete when:

- a Government finances section exists;
- it contains a federal budget-balance card using `FYFSGDA188S`;
- it contains a federal-debt-held-by-the-public card using `FYGFGDQ188S`;
- the budget card preserves the provider’s negative-deficit and positive-surplus sign convention;
- the debt card consistently distinguishes debt held by the public from total federal debt;
- annual frequency is supported through shared validation, presentation, and zoom paths;
- full useful history is included;
- both cards inherit shared zoom without duplicate implementation;
- missing values remain missing;
- card questions, explanations, axes, summaries, tables, and metadata match the actual measures;
- card failures remain isolated;
- no out-of-scope fiscal indicator or projection is added;
- Epic 02 and relevant documentation are current;
- all required checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
