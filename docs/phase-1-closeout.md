# Phase 1 closeout record

## Outcome

The original Epic 02 closeout through Story 21 is complete, and the subsequent analytical-gap stories 22–24 are also complete.

The completed Phase 1 product now contains:

- 28 visible cards
- 9 ordered sections
- the original 25-card Phase 1 inventory
- 3 subsequently added cards:
  - initial unemployment claims
  - bank lending standards
  - corporate profit share

Sections, in order: Growth; Prices; Employment and income; Households; Housing; Business and manufacturing; Financial conditions; Government finances; Trade and tariffs.

The authoritative generated-dataset count, source identifiers, transformations, and exact coverage ranges are maintained in [`data-refresh.md`](data-refresh.md). That document should be treated as the source of truth rather than duplicating a potentially stale dataset count here.

The product-level inventory and rationale are in [`product-overview.md`](product-overview.md). Product interpretation rules are in [`product-principles.md`](product-principles.md). Accepted constraints are in [`phase-1-limitations.md`](phase-1-limitations.md).

## Product coverage

The completed Phase 1 product covers:

- aggregate economic growth;
- growth per person;
- productivity level and momentum;
- headline and core inflation;
- recent inflation momentum;
- unemployment, prime-age employment, payroll growth, and wages;
- timely unemployment-claims evidence;
- household income, spending, saving, and debt service;
- housing affordability and construction;
- manufacturing activity, business investment, corporate profitability, and capacity utilization;
- short- and long-term interest rates;
- broad credit conditions and reported bank lending standards;
- federal budget balance and publicly held debt;
- trade balance and effective tariff burden.

The three post-Story-21 additions close important analytical gaps:

- **Initial unemployment claims** add a timely weekly signal of emerging labor-market stress while preserving the distinction between unemployment-insurance filings and total layoffs.
- **Bank lending standards** add a direct quarterly survey measure of whether banks report tightening or easing standards for commercial and industrial loans, complementing the broader NFCI credit composite.
- **Corporate profit share** adds a quarterly national-accounts measure of adjusted after-tax corporate profits relative to nominal GDP, while explicitly distinguishing the measure from S&P 500 earnings, company-level margins, and market valuation.

## Approved substitutions and scope decisions

- `NFCICREDIT` supplies broad credit conditions instead of the originally contemplated corporate credit spread because it provides long, nonproprietary, redistributable history. Its standardized-composite limitation remains disclosed.
- Bank lending standards complement rather than replace `NFCICREDIT`: the survey measure answers whether banks report tighter standards for a defined borrower class, while NFCI describes broader credit conditions.
- Capacity utilization supplies the industrial-activity perspective without duplicating the manufacturing-output card.
- Atlanta Fed HOAM supplies the approved ownership-cost affordability model outside FRED.
- Initial unemployment claims complement unemployment, payroll growth, and prime-age employment rather than replacing any of them.
- Corporate profit share uses adjusted after-tax corporate profits divided by nominal GDP and is not presented as a stock-market earnings or valuation measure.

## Card review checklist

Each completed card is expected to satisfy the repository-wide card contract: question/measure agreement, latest-callout semantics, correct units and transformation, full-history Maximum, independent presets and zoom behavior, factual summary, semantic table, explanatory limitations, accessible labeling and native controls, source links, metadata, and isolated loading behavior. Relationship and locally derived cards additionally require exact-period alignment and complete source-provenance review.

| Section | Card | Result |
|---|---|---|
| Growth | Real GDP growth | Passed |
| Growth | Real GDP per capita growth | Passed |
| Growth | Productivity over time | Passed |
| Growth | Productivity growth momentum | Passed |
| Prices | Headline CPI inflation | Passed |
| Prices | Headline versus core CPI | Passed |
| Prices | Recent inflation momentum | Passed |
| Employment and income | Unemployment rate | Passed |
| Employment and income | Prime-age employment-to-population ratio | Passed |
| Employment and income | Payroll growth | Passed |
| Employment and income | Initial unemployment claims | Passed |
| Employment and income | Wages versus inflation | Passed |
| Households | Real income versus spending per person | Passed |
| Households | Personal saving rate | Passed |
| Households | Household debt-service ratio | Passed |
| Housing | Home-ownership cost share | Passed |
| Housing | Housing starts | Passed |
| Business and manufacturing | Manufacturing output versus employment | Passed |
| Business and manufacturing | Real business investment growth | Passed |
| Business and manufacturing | Corporate profit share | Passed |
| Business and manufacturing | Industrial capacity utilization | Passed |
| Financial conditions | Federal funds rate versus 10-year Treasury yield | Passed |
| Financial conditions | Broad credit conditions | Passed |
| Financial conditions | Bank lending standards | Passed |
| Government finances | Federal budget balance | Passed |
| Government finances | Federal debt held by the public | Passed |
| Trade and tariffs | Trade balance as a share of GDP | Passed |
| Trade and tariffs | Effective tariff burden | Passed |

## Data and architecture status

- All committed generated datasets must validate through the shared domain validator and have explicit repository loaders.
- Visible and supporting datasets must have active card uses; obsolete generated data should not remain committed.
- Dates remain unique, chronological, not future-dated relative to retrieval, and preserve internal missing observations as `null`.
- Exact month, quarter, and week alignment uses calendar lookup rather than array position.
- Direct writes remain atomic, and multi-output or locally derived workflows use validated rollback-protected replacement where applicable.
- FRED remains the default intermediary. Atlanta Fed HOAM remains the documented official non-FRED exception.
- The browser makes no provider request and receives no provider credential.
- ECharts remains one shared lazy chunk, with centralized historical zoom and native controls.
- The initial-claims card uses official weekly claims and the official four-week moving average aligned by exact week-ending date.
- The bank-lending-standards card preserves the survey series' sign semantics: positive values mean net tightening and negative values mean net easing.
- The corporate-profit-share card aligns adjusted after-tax corporate profits and nominal GDP by exact quarter and derives the ratio transparently.

## Refresh and coverage status

The original full Phase 1 provider refresh completed successfully on July 17, 2026, refreshing every then-configured FRED source and the Atlanta Fed HOAM workbook without source or validation failure.

Stories 22–24 subsequently expanded the configured refresh inventory to include the sources and derivations required for:

- weekly initial unemployment claims and their official four-week moving average;
- quarterly bank lending standards;
- quarterly adjusted after-tax corporate profits and the derived corporate-profit share of GDP.

Because source histories and latest release periods differ, the exact current counts, starts, endpoints, and retrieval dates should be taken from [`data-refresh.md`](data-refresh.md), not from this closeout summary.

## Browser, accessibility, and behavior

The original Story 21 closeout performed a real headless-Chrome review of the 25-card dashboard at desktop and narrow widths. That review verified rendering, navigation, presets, Maximum history, zoom and reset, tooltips, source disclosures, keyboard focus, semantic tables, and containment of wide tables.

Stories 22–24 were completed under the repository's story-completion requirements, which require each story to pass the standard lint, typecheck, test, build, diff, documentation, browser or manual verification as applicable, commit, push, upstream-synchronization, and clean-working-tree checks before completion.

The completed 28-card product must continue to preserve:

- isolated card failure behavior;
- semantic nonvisual content for every chart;
- independent range controls;
- exact-period relationship alignment;
- visible chart gaps for missing observations;
- nonsmoothed source-derived lines except where an official moving average is itself the measure;
- accessible labels, controls, source links, and recent-observation tables;
- no page-level horizontal overflow at supported narrow widths.

## Defects corrected during the original closeout

- The effective-tariff refresh summary reported the repository root as its output because it retained the numerator source's empty internal output path. The refresh outcome was corrected to report the actual derived JSON path, with a regression test.
- Refresh documentation was reconciled with the successful provider run for June 2026 housing starts, manufacturing output, capacity utilization, and exact real wage growth.
- Phase status, product inventory, archived handoff status, and documentation ownership were reconciled before the executable Story 21 audit.

## Verification standard

The repository's completion standard requires every story to pass:

- `npm run data:refresh` when the story changes provider data or derivations;
- `npm run lint`;
- `npm run typecheck`;
- `npm test`;
- `npm run build`;
- `git diff --check`;
- story-specific data, browser, accessibility, or manual verification;
- repository-loader and generated-file reconciliation when data inventory changes;
- focused commit and successful push;
- synchronized branch and clean working tree.

The only previously accepted build warning is Vite's advisory for the greater-than-500-kB deferred ECharts chunk. ECharts remains outside the initial application chunk and deduplicated; the limitation is recorded in [`phase-1-limitations.md`](phase-1-limitations.md).

## Final Phase 1 status

Phase 1 is complete as a broad, historically grounded research and evidence layer with 28 visible cards.

The next product phase is not primarily another indicator-expansion phase. Its central task is to transform this research inventory into a compact at-a-glance economic briefing that communicates current condition, direction, strengths, weaknesses, conflicts, and uncertainty while retaining the full cards as drill-down evidence.
