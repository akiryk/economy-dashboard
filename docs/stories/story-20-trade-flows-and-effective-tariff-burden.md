# Story 20: Add Trade Flows and Effective Tariff Burden

## Status

Complete.

## User story

As a dashboard reader, I want to understand the scale and direction of U.S. trade and the average customs-duty burden on imported goods, so that I can distinguish trade flows from tariff policy.

## Product questions

Add two cards to a new **Trade and tariffs** section.

### Trade flows

> **How large is the U.S. trade balance relative to the economy?**

### Tariff burden

> **What share of imported goods is collected as customs duties?**

Keep these cards separate. The trade balance describes exports minus imports of goods and services. The tariff card describes customs-duty receipts relative to goods imports. Neither is an overall judgment on trade policy.

## Source decisions

Use FRED as the intermediary for official Bureau of Economic Analysis data.

### Trade balance as a share of GDP

Use:

- **FRED series:** `A019RE1Q156NBEA`
- **Title:** Shares of gross domestic product: Net exports of goods and services
- **Publisher:** U.S. Bureau of Economic Analysis
- **Frequency:** Quarterly
- **Units:** Percent of GDP
- **Transformation:** Provider-published ratio
- **History policy:** Full useful history

Negative values indicate a trade deficit; positive values indicate a trade surplus.

Use this ratio rather than the monthly dollar trade balance because it scales trade imbalances to the size of the economy and provides long historical context.

### Effective tariff burden

Use two quarterly BEA series through FRED:

- **Customs duties:** `B235RC1Q027SBEA`
- **Goods imports:** `A255RC1Q027SBEA`

Both are quarterly, billions of dollars, seasonally adjusted annual rates.

Derive:

```text
effective tariff burden = customs duties / imports of goods × 100
```

Align by exact calendar quarter and retain full precision before serialization.

This measure is an average effective rate based on customs-duty receipts. It is not a statutory tariff schedule and does not show the tariff rate faced by every product, country, importer, or consumer.

## Scope

This story must:

1. add the three source series to the established refresh workflow;
2. preserve the trade-balance series directly;
3. derive the effective tariff-burden series from exact-quarter aligned BEA observations;
4. generate and commit validated local datasets;
5. register the visible datasets in the local repository;
6. add a Trade and tariffs section with exactly two cards;
7. inherit Story 09A shared zoom without card-specific implementation;
8. preserve accessible summaries, semantic tables, provenance, and isolated failures;
9. update Epic 02 and relevant documentation.

Do not add:

- bilateral trade balances;
- country-level tariffs;
- product-level tariff schedules;
- import or export price indexes;
- separate goods and services cards;
- exchange rates;
- trade forecasts;
- estimates of tariff incidence on consumers;
- claims about who ultimately pays tariffs;
- partisan or normative labels.

## Trade-balance card

### Question

> How large is the U.S. trade balance relative to the economy?

### Label

> Net exports of goods and services

### Latest-value callout

Show the latest quarterly signed value and period.

Examples:

```text
−2.6% of GDP
Trade deficit
2026 Q1
```

```text
+0.8% of GDP
Trade surplus
1975 Q2
```

Preserve the provider sign. Do not convert deficits to unsigned positive values.

### Product meaning

Explain that:

- net exports equal exports minus imports;
- negative values indicate imports exceeded exports;
- positive values indicate exports exceeded imports;
- the value is expressed relative to GDP for historical comparability;
- a trade deficit is not automatically evidence that the economy is weak;
- a trade surplus is not automatically evidence that the economy is strong;
- the balance can move because exports, imports, domestic demand, foreign demand, prices, exchange rates, or other factors change.

### Chart behavior

Use a quarterly signed-percentage chart:

- include zero;
- retain a zero reference line;
- no smoothing;
- preserve gaps;
- support 5y, 10y, 20y, and Maximum;
- inherit shared zoom and reset;
- provide accessible summary and semantic table;
- isolate failures.

### Summary and table

The summary should identify the latest visible deficit or surplus and the largest visible deficit and surplus when present.

Recommended table columns:

- Quarter
- Net exports, percent of GDP
- Balance type

## Effective-tariff-burden card

### Question

> What share of imported goods is collected as customs duties?

### Label

> Effective tariff burden

### Latest-value callout

Show the latest derived percentage and quarter.

Example:

```text
10.1%
of goods-import value
2026 Q1
```

Use the actual derived value.

### Product meaning

Explain that:

- the numerator is federal customs-duty receipts;
- the denominator is imports of goods, not goods and services;
- both source values are seasonally adjusted annual rates from the BEA national accounts;
- the ratio is an average effective customs-duty burden;
- it is not a statutory tariff rate;
- it can change because duty collections change, the composition or value of imports changes, exemptions change, collection timing changes, or policy changes;
- it does not reveal which businesses or households bear the economic cost;
- it does not describe nontariff barriers.

Avoid calling the measure simply “the tariff rate” without the word **effective** or an equivalent explanation.

### Derivation

For each exact shared quarter:

```text
rate_t = customs_duties_t / goods_imports_t × 100
```

Requirements:

- exact-quarter alignment;
- no array-position substitution;
- denominator must be positive and non-null;
- missing endpoints produce `null`;
- internal gaps remain gaps;
- no rounding before serialization;
- reject duplicate dates;
- validate both sources and the generated series;
- persist the derived series, not the aligned source pair.

Write the two-source output through the established grouped, rollback-protected process so a failure preserves the prior valid tariff dataset and any required supporting outputs.

### Chart behavior

Use a quarterly percentage-level chart:

- zero is substantively meaningful and should remain visible when practical;
- no arbitrary target or warning band;
- no smoothing;
- full useful shared history;
- shared zoom and reset;
- accessible summary and table;
- isolated failure state.

Recommended table columns:

- Quarter
- Effective tariff burden
- Customs duties
- Goods imports

If native source values make the table too dense, keep the derived percentage visible and place source values in metadata or a disclosure. Do not recalculate inside JSX.

## Data refresh

### Direct series

Add explicit configurations for:

- `A019RE1Q156NBEA`
- `B235RC1Q027SBEA`
- `A255RC1Q027SBEA`

Use full-history policy and no FRED units transformations.

Apply established validation:

- parse provider data as untrusted;
- normalize `.` to `null`;
- reject invalid dates, duplicates, malformed values, future observations, and insufficient history;
- preserve prior files on failure;
- report counts, coverage, latest values, transformations, and paths.

Recommended visible identities:

```text
trade-balance-share-of-gdp
trade-balance-share-of-gdp.json

effective-tariff-burden
effective-tariff-burden.json
```

Supporting customs-duty and goods-import series may remain repository-internal if they are used only for refresh-time derivation.

## Failure behavior

- The trade-balance card loads independently.
- The tariff card requires a valid derived tariff series.
- Failure of one card must not suppress the other or any prior section.
- A failed tariff refresh must preserve the previous valid derived file.

## Shared zoom requirement

Both cards must inherit the centralized Story 09A implementation.

Do not add local `dataZoom`, zoom state, reset markup, event listeners, or visible-range slicing.

## Provenance

### Trade balance

Expose FRED, BEA, `A019RE1Q156NBEA`, quarterly frequency, percent of GDP, provider-published ratio, coverage, and retrieval date.

### Tariff burden

Expose:

- FRED as intermediary;
- BEA as publisher of both source series;
- `B235RC1Q027SBEA` customs duties;
- `A255RC1Q027SBEA` imports of goods;
- quarterly frequency;
- billions of dollars at seasonally adjusted annual rates for both inputs;
- exact-quarter local ratio formula;
- source and generated coverage;
- retrieval date.

## Documentation updates

Update Epic 02 to:

- mark Story 19 complete;
- mark government deficit and debt complete;
- mark Story 20 complete only after verification, commit, and push;
- mark trade flows and effective tariff burden complete at that time;
- leave Story 21 planned.

Update relevant documentation for source configuration, derived tariff methodology, sign semantics, Trade and tariffs section composition, shared zoom, generated coverage, visible-card counts, and bundle impact.

## Tests

Add deterministic tests covering at least:

1. Correct configuration and provenance for all three source series.
2. Full-history retrieval with no FRED unit transformation.
3. Trade-balance signs remain unchanged.
4. Negative trade balance maps to deficit; positive maps to surplus.
5. Exact-quarter tariff alignment.
6. Correct ratio arithmetic.
7. Missing or nonpositive denominator fails or yields `null` according to established derivation rules.
8. Missing quarters are not bridged by array position.
9. Full precision is retained.
10. Grouped tariff failure preserves prior valid output.
11. Both repository slugs resolve and validate.
12. Trade card uses a zero-inclusive signed axis.
13. Tariff card is labeled effective tariff burden, not statutory tariff rate.
14. Both inherit shared zoom without duplication.
15. Summaries and tables follow the visible period.
16. Each card fails independently.
17. No bilateral, product-level, price, incidence, or forecast card is added.
18. No browser-side provider request is introduced.

Avoid brittle snapshots.

## Browser verification

Verify that:

- the section appears after Government finances;
- both questions match the measures;
- deficit and surplus signs are clear;
- Maximum exposes full useful history;
- the tariff chart uses the derived effective rate;
- the tooltip and table identify quarters and units correctly;
- shared zoom and Reset zoom work;
- summaries and tables follow the visible period;
- latest callouts retain latest-source meaning while zoomed;
- charts remain usable at narrow widths;
- failures remain isolated;
- no duplicate zoom UI appears.

Perform a product-meaning review:

- a reader should not equate a trade deficit with economic failure;
- a reader should not confuse the effective tariff burden with statutory tariff schedules;
- a reader should understand the tariff denominator includes imported goods only;
- a reader should not infer who bears tariff costs from this card.

## Required verification

Run:

```text
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Inspect generated data, source coverage, derivation output, browser behavior, shared zoom reuse, bundle output, and the final diff. Remove temporary files and stop temporary processes.

## Completion and Git requirements

Before completion:

1. Confirm only Story 20 scope was implemented.
2. Confirm Story 19 and Epic statuses are current.
3. Confirm all source and product meanings are accurate.
4. Confirm full useful history and exact-quarter derivation.
5. Confirm shared zoom is inherited without duplication.
6. Run all checks.
7. Create one focused commit.
8. Push without force.
9. Confirm synchronization and a clean working tree.

End the completion report with:

```text
ALL DONE WITH USER STORY 20
```

## Acceptance criteria

Story 20 is complete when:

- a Trade and tariffs section exists;
- it contains a trade-balance-as-share-of-GDP card using `A019RE1Q156NBEA`;
- it contains an effective-tariff-burden card derived from `B235RC1Q027SBEA` and `A255RC1Q027SBEA`;
- exact-quarter alignment and formula are correct;
- full useful history is included;
- signs, units, questions, explanations, summaries, tables, and provenance match the measures;
- missing values remain missing;
- shared zoom is reused without duplication;
- card failures remain isolated;
- no out-of-scope trade analysis is added;
- Epic 02 and documentation are current;
- all checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
