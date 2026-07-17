# Epic 02: Build the Phase 1 U.S. Economy Dashboard

## Status

In progress.

## Purpose

Build a broad, balanced, historically grounded first-phase dashboard covering the major dimensions of the U.S. economy.

Phase 1 should be complete enough that implementation can pause and the user can spend time reviewing the dashboard, understanding the data, identifying useful relationships, and deciding what Phase 2 should become.

## Product principles

### Complementary indicators

No single measure provides a complete verdict on the economy. Related measures should confirm, qualify, or contradict one another.

### Human questions first

Each card should answer a question a non-specialist might reasonably ask. Provider identifiers belong in metadata.

### Visual context over dense raw numbers

Use prominent numbers sparingly. Use charts and reference context to communicate history and relationships. Keep detailed tables and methodology available as supporting information.

### Historical context

Shorter ranges show recent movement. Maximum exposes the fullest useful authoritative history available for each series. Different indicators may begin at different dates.

### Honest ambiguity

Mixed evidence should remain mixed. The dashboard must not force conflicting indicators into one overall rating.

### Clear provenance

Every card must document source, units, frequency, seasonal adjustment, transformation, coverage, retrieval date, and local derivations.

### Static and resilient

The browser must not depend on live provider requests. Data should refresh through the established workflow and be committed as validated local datasets.

## Phase 1 indicator scope

### Growth and productive capacity

- Real GDP growth — complete
- Real GDP per capita — complete
- Labor productivity — complete
- Broad business investment — complete

### Prices and inflation

- Headline CPI inflation — complete
- Underlying inflation, using core CPI — complete
- Short-term inflation momentum — complete

### Employment and income

- Unemployment rate — complete
- Prime-age employment-to-population ratio — complete
- Payroll growth — complete
- Wages versus inflation and exact real wage growth — complete
- One additional leading or participation measure — planned

### Household condition

- Real disposable income and consumer spending — complete
- Personal saving rate — complete
- Broad household financial-stress measure — complete

### Housing

- Housing affordability and financing conditions — complete
- Housing construction — complete

### Business and manufacturing

- Manufacturing output versus manufacturing employment — complete
- Industrial production or capacity utilization — complete (capacity utilization)
- Business investment — complete

### Financial conditions

- Federal funds rate versus 10-year Treasury yield — complete
- Broad credit stress — complete using the Chicago Fed `NFCICREDIT` credit subindex as the approved non-proprietary substitute for a corporate credit spread

### Government finances

- Federal deficit as a share of GDP — planned
- Federal debt held by the public as a share of GDP — planned

### Trade and tariffs

- Imports, exports, and trade balance — planned
- Effective tariff burden or duties collected relative to imports — planned

## Story map

| Story | Scope | Status |
|---|---|---|
| 01 | Initialize repository and application shell | Complete |
| 02 | Add economic-series model and local GDP data | Complete |
| 03 | Add real GDP chart | Complete |
| 04 | Add repeatable FRED refresh and lazy chart loading | Complete |
| 05 | Add headline CPI inflation | Complete |
| 06 | Establish dashboard information architecture | Complete |
| 07 | Add unemployment and prime-age employment | Complete |
| 08 | Add payroll growth | Complete |
| 09 | Expand current indicators to full useful history | Complete |
| 09A | Add shared interactive historical zoom to all time-series charts | Complete |
| 10 | Add wages-versus-inflation comparison | Complete |
| 11 | Add productivity and real GDP per capita | Complete |
| 12 | Add underlying inflation and inflation momentum | Complete |
| 12A | Clarify productivity momentum and add productivity level | Complete |
| 13 | Add household income, spending, and saving | Complete |
| 13A | Align household income and spending on a quarterly per-capita basis | Complete |
| 14 | Add household financial stress | Complete |
| 15 | Add housing affordability and construction | Complete |
| 16 | Add manufacturing output versus employment | Complete |
| 17 | Add business investment and industrial activity | Complete |
| 18 | Add financial conditions and credit stress | Complete |
| 19 | Add government deficit and debt | Planned |
| 20 | Add trade flows and tariff burden | Planned |
| 21 | Complete Phase 1 review and closeout | Planned |

Story numbering may change if implementation reveals a better grouping.

## Cross-cutting requirements

Every Phase 1 card must:

- Use authoritative data.
- Refresh through the established workflow.
- Avoid browser-side protected API requests.
- Validate source and generated data.
- Preserve valid files when refresh fails.
- Include full useful history.
- Support existing time ranges.
- Preserve accessible summaries and tables.
- Isolate card failures.
- Include deterministic tests.
- Document transformations and limitations.
- Be committed and pushed according to `AGENTS.md`.

Relationship cards must:

- Align dates explicitly.
- Use compatible units or transparent normalization.
- Avoid dual axes unless strongly justified.
- Preserve provenance for every source.
- Explain every derived calculation.

## Explicitly deferred from Phase 1

- Forecasts versus outcomes
- Historical data vintages and revisions
- Automated divergence detection
- Historical median and percentile overlays
- Major visual redesign
- State and regional comparisons
- Broad distributional analysis
- Overall economic score

## Definition of done

Phase 1 is complete when the dashboard provides useful coverage of:

- Growth
- Productivity
- Prices
- Labor
- Wages and purchasing power
- Household income and spending
- Household financial stress
- Housing
- Manufacturing
- Business investment or industrial activity
- Financial conditions
- Government finances
- Trade
- Tariffs

And when:

- No obvious major macroeconomic section in this epic remains absent.
- Every dataset uses authoritative sources.
- Every transformation is documented and tested.
- Full useful history is included.
- Missing values are never treated as zero.
- Multi-source dates are aligned correctly.
- Card failures remain isolated.
- All checks, tests, refreshes, and builds pass.
- Documentation is current.
- The repository is clean and synchronized with GitHub.
- The user can pause development and meaningfully review the dashboard.

## Closeout story

The final Phase 1 story must not add another indicator. It should:

1. Review this epic line by line.
2. Confirm every required indicator or approved substitute exists.
3. Run the complete quality and refresh suite.
4. Verify every card in a real browser.
5. Review full-history ranges.
6. Confirm source and methodology documentation.
7. Remove dead code and stale documentation.
8. Record accepted limitations.
9. Create a dashboard-review guide.
10. Identify candidate Phase 2 themes without implementing them.
11. Mark Epic 02 complete.
