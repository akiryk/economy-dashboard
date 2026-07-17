# Phase 1 closeout record

## Outcome

Epic 02 and Story 21 are complete. No indicator was added during closeout.

Final product inventory:

- 25 visible cards
- 9 ordered sections
- 31 generated datasets
- 7 unique series used in supporting roles across relationship cards, of which 6 are supporting-only datasets and headline CPI is also a visible primary series

Sections, in order: Growth; Prices; Employment and income; Households; Housing; Business and manufacturing; Financial conditions; Government finances; Trade and tariffs.

The product-level inventory and rationale are in [`product-overview.md`](product-overview.md). Accepted constraints are in [`phase-1-limitations.md`](phase-1-limitations.md), and the product-owner review workflow and noncommittal Phase 2 candidates are in [`dashboard-review-guide.md`](dashboard-review-guide.md).

## Epic coverage and approved decisions

Every required Phase 1 topic is represented. The line-by-line Epic 02 review confirmed growth, growth per person, productivity level and momentum, headline and core inflation, recent inflation momentum, labor conditions, wages and purchasing power, household income/spending/saving/stress, housing affordability/construction, manufacturing, investment, industrial activity, rates, credit, federal finances, trade, and tariffs.

Approved substitutions and scope decisions:

- `NFCICREDIT` supplies broad credit conditions instead of the contemplated corporate credit spread because it has long, nonproprietary, redistributable history. Its standardized-composite limitation is disclosed.
- Capacity utilization supplies the epic’s industrial-activity perspective without duplicating the manufacturing-output card.
- Atlanta Fed HOAM supplies the approved ownership-cost affordability model outside FRED.
- The optional additional labor participation or leading measure is deferred because unemployment, prime-age employment, and payroll growth provide complementary Phase 1 labor coverage.

## Card review checklist

Each card passed review for question/measure agreement, latest-callout semantics, units and transformation, full-history Maximum, preset and zoom behavior, factual summary, semantic table, explanatory limitations, accessible labeling and native controls, source link, metadata, and isolated loading behavior. Multi-source cards also passed exact-period alignment and source-provenance review.

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
| Employment and income | Wages versus inflation | Passed |
| Households | Real income versus spending per person | Passed |
| Households | Personal saving rate | Passed |
| Households | Household debt-service ratio | Passed |
| Housing | Home-ownership cost share | Passed |
| Housing | Housing starts | Passed |
| Business and manufacturing | Manufacturing output versus employment | Passed |
| Business and manufacturing | Real business investment growth | Passed |
| Business and manufacturing | Industrial capacity utilization | Passed |
| Financial conditions | Federal funds rate versus 10-year Treasury yield | Passed |
| Financial conditions | Broad credit conditions | Passed |
| Government finances | Federal budget balance | Passed |
| Government finances | Federal debt held by the public | Passed |
| Trade and tariffs | Trade balance as a share of GDP | Passed |
| Trade and tariffs | Effective tariff burden | Passed |

## Data and architecture audit

- All 31 JSON files validate through the shared domain validator and have explicit lazy repository loaders.
- All visible and supporting datasets have active card uses; no obsolete generated dataset remains.
- Dates are unique, chronological, not future-dated relative to retrieval, and retain internal missing values as `null`.
- Exact month and quarter calculations use calendar lookup rather than array position.
- Direct writes are atomic; multi-output CPI, payroll, wage, household, productivity, and tariff workflows use validated rollback-protected replacement where applicable.
- FRED remains the default intermediary. HOAM is the documented official non-FRED exception.
- The browser makes no provider request and receives no provider credential.
- ECharts remains one shared lazy chunk. Chart option builders call one shared `dataZoom` configuration, and all cards use the centralized historical-zoom state and native controls.
- No unsupported `any`, stale TODO/FIXME, debug logging, duplicated reset markup, speculative provider framework, or unused dependency was found.

## Real-provider refresh

The full refresh completed successfully on July 17, 2026. It refreshed every configured FRED source and the Atlanta Fed HOAM workbook, regenerated all 31 committed datasets, and reported no source or validation failure.

Coverage spans:

- annual: 1929–2025;
- quarterly: source-dependent starts from 1947 Q1 to 2005 Q1, with locally derived business-investment growth beginning 2008 Q1, through 2026 Q1;
- monthly: source-dependent starts from January 1939 to January 2005, with latest periods from March through June 2026;
- weekly: January 8, 1971–July 10, 2026.

Exact per-series counts and ranges are maintained in [`data-refresh.md`](data-refresh.md).

## Browser and accessibility verification

A real headless Chrome session verified all 25 cards at 1440px desktop width and a fresh 375px narrow viewport.

- 25 cards, 25 canvases, 25 navigation links, and 25 semantic tables rendered.
- All four presets were exercised on every card.
- Maximum returned the documented full-history boundary for every card.
- Zoom in exposed Reset zoom, and reset restored the full preset on every card.
- Native mouse movement produced a tooltip on every chart.
- Every card exposed source links and both supporting disclosures; multi-source cards exposed 31 source links in total.
- Native keyboard focus reached the range controls.
- The fresh narrow viewport had no page-level horizontal overflow. Wide tables remained contained in their intentional horizontal scroll regions.
- Desktop and narrow screenshots were inspected temporarily and were not committed.

Component tests continue to cover card failure isolation, semantic content, relationship alignment, range independence, zoom semantics, chart gaps, nonsmoothed lines, axis policies, and accessible alternatives.

## Defects corrected during closeout

- The effective-tariff refresh summary reported the repository root as its output because it retained the numerator source’s empty internal output path. The refresh outcome now reports the actual derived JSON path, with a regression test.
- Refresh documentation was reconciled with the successful provider run for June 2026 housing starts, manufacturing output, capacity utilization, and exact real wage growth.
- Phase status, product inventory, archived handoff status, and documentation ownership had already been reconciled immediately before the executable Story 21 audit and were retained.

## Verification

The closeout passed:

- `npm run data:refresh`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `git diff --check`
- repository-loader and generated-file inventory reconciliation
- real-browser desktop and narrow verification

The only accepted build warning is Vite’s advisory for the greater-than-500-kB deferred ECharts chunk. ECharts remains outside the initial application chunk and deduplicated; the limitation is recorded in [`phase-1-limitations.md`](phase-1-limitations.md).
