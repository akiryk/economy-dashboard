# Product overview and indicator inventory

## Product purpose

The U.S. Economy Dashboard is a descriptive, historically grounded briefing on major dimensions of the national economy. It helps a reader answer, “What is happening, how does it compare with the past, and what does this measure leave out?”

The current product is intentionally broad and nonpartisan. It does not forecast markets, recommend investments, evaluate political actors, infer causation from timing, or collapse mixed evidence into one score. That purpose should remain the baseline unless a future phase explicitly adopts another objective.

The dashboard contains 26 visible cards in nine sections. Most cards use nonsmoothed time-series line charts. Relationship cards use two aligned lines; the manufacturing comparison normalizes two differently scaled series to a common selected-range baseline.

## What the dashboard shows

### Growth

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Is the U.S. economy growing? | Quarterly real GDP, year-over-year percent change. | Shows whether inflation-adjusted total output is expanding or contracting. |
| Is economic output growing faster than the population? | Quarterly real GDP per person, year-over-year percent change. | Separates aggregate growth from growth in average output per resident. |
| How much more productive is the economy than in the past? | Quarterly nonfarm-business output per hour, indexed to 100 at the selected range’s first observation. | Shows cumulative productivity improvement without confusing the level with its growth rate. |
| Are productivity gains revving up or slowing down? | Quarterly output per hour, year-over-year percent change, with momentum versus four quarters earlier. | Shows the pace of productivity gains and whether that pace is accelerating or slowing. |

### Prices

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How quickly are consumer prices rising? | Monthly headline CPI, year-over-year percent change. | Provides the broad, familiar measure of consumer-price inflation. |
| Is inflation broad and persistent? | Monthly headline and core CPI, year-over-year percent change, aligned on exact months. | Compares total inflation with a measure excluding food and energy to add persistence context. |
| Is inflation currently accelerating or slowing? | Monthly headline and core CPI, exact three-month annualized rates. | Gives a more responsive, though noisier, view of recent inflation momentum. |

### Employment and income

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How difficult is it for people who want work to find it? | Monthly unemployment rate. | Measures unsuccessful job seeking among people in the labor force. |
| What share of prime-age adults are employed? | Monthly employment-to-population ratio for ages 25–54. | Adds a broad employment measure less affected by population aging than the all-age ratio. |
| Are employers adding jobs? | Monthly payroll changes, emphasizing a rolling three-month average. | Shows the direction and recent pace of employer job creation while retaining monthly detail. |
| Are layoffs beginning to rise? | Weekly initial unemployment claims and the official four-week average, aligned by week ending. | Adds a timely signal of new unemployment-insurance filings while emphasizing the less noisy official average. |
| Are workers’ wages keeping up with prices? | Monthly nominal wage growth and headline CPI inflation, with exact-ratio real wage growth. | Compares pay growth with consumer-price growth for a defined group of private-sector workers. |

### Households

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Are real household incomes and spending growing per person? | Quarterly real disposable income per person and real consumer spending per person, year-over-year growth. | Compares purchasing resources and consumption on consistent real, per-capita terms. |
| Are households saving or drawing down more of their income? | Monthly personal saving as a percentage of disposable personal income. | Shows the aggregate income share not used for current consumption. |
| How much of household income is going toward required debt payments? | Quarterly mortgage and consumer debt-service payments as a percentage of disposable income. | Adds a broad measure of required household debt burden without substituting delinquency or debt balances. |

### Housing

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Can a median-income household afford a typical home? | Monthly modeled annual ownership cost as a share of median household income. | Combines prices, mortgage financing, taxes, insurance, and income into a national purchase-cost estimate. |
| How much new housing is being started? | Monthly privately owned housing starts at a seasonally adjusted annual rate. | Shows the pace at which new housing supply enters construction. |

### Business and manufacturing

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Are manufacturing output and jobs moving together? | Monthly real manufacturing output and manufacturing payroll employment, each normalized to 100 at the selected range’s first shared observation. | Makes their relative paths comparable without mixing native units or implying that divergence has one cause. |
| Are businesses increasing investment in productive capacity? | Quarterly real private nonresidential fixed investment, year-over-year growth. | Tracks inflation-adjusted spending on structures, equipment, and intellectual property used in production. |
| How fully is industrial capacity being used? | Monthly industrial capacity utilization. | Shows operating intensity and spare capacity across manufacturing, mining, and utilities. |

### Financial conditions

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How do short-term and long-term interest rates compare? | Monthly effective federal funds rate and 10-year Treasury yield. | Compares a policy-linked short rate with a benchmark long rate without treating the curve as a mechanical recession forecast. |
| Are credit conditions tighter or looser than usual? | Weekly Chicago Fed NFCI credit subindex relative to its historical average. | Adds broad credit availability and risk conditions not captured by Treasury yields alone. |

### Government finances

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How large is the federal budget deficit or surplus relative to the economy? | Annual federal budget balance as a signed percentage of GDP. | Scales yearly federal borrowing or saving to the size of the economy. |
| How large is federal debt held by the public relative to the economy? | Quarterly federal debt held by the public as a percentage of GDP. | Shows the accumulated federal obligations financed outside federal government accounts. |

### Trade and tariffs

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How large is the U.S. trade balance relative to the economy? | Quarterly net exports of goods and services as a signed percentage of GDP. | Scales trade deficits and surpluses to the economy without labeling either automatically good or bad. |
| What share of imported goods is collected as customs duties? | Quarterly customs-duty receipts divided by goods imports. | Provides an average effective customs-duty burden while distinguishing it from statutory tariff schedules and economic incidence. |

## Shared interpretation rules

- The latest callout always refers to the latest committed observation, not the endpoint of a zoomed historical window.
- Maximum shows each source’s full useful available history; cards do not share an arbitrary start date.
- Missing observations remain gaps and are never converted to zero or visually smoothed over.
- A positive growth rate that falls is described as slower growth, not as a falling level.
- National aggregates do not claim to describe every household, worker, firm, industry, or region.
- Source, identifier, frequency, units, seasonal adjustment, transformation, retrieval date, coverage, limitations, and recent observations remain available on every card.

## Choosing the next product objective

Future work should begin by naming the user decision the dashboard is meant to support. Different objectives imply different measures and presentations.

| Possible objective | What would receive more emphasis | Important additions or changes to evaluate |
|---|---|---|
| Broad economic understanding | Balanced coverage, long history, transparent limitations, and relationships among measures. | This is the current objective. Improve synthesis and navigation before adding more breadth. |
| Investment and forward-looking conditions | Direction, turning points, expectations, liquidity, earnings, risk premia, and market-sensitive leading indicators. | Forecasts versus outcomes, yield spreads and real rates, lending standards, profits and margins, inventories and new orders, market valuations, and revision-aware data. These would still not constitute investment advice. |
| Historical and policy analysis | Long-run comparability, policy regimes, institutional changes, and contemporaneous data vintages. | Event annotations, recession shading, policy-rate and fiscal-policy timelines, vintage data, revisions, and explicit methodology-break handling. Avoid implying causation from visual coincidence. |
| Household welfare and distribution | Medians, distributions, demographic and geographic differences, and essential costs. | Real median income and wages, wealth and debt distributions, poverty, labor-force participation, rent burden, regional housing, and subgroup outcomes. |
| Business operating environment | Demand, costs, financing, investment, inventories, and sector divergence. | New orders, inventories, profits, bankruptcies, lending standards, small-business conditions, and sector detail. |

The current 26-card dashboard should be treated as a baseline inventory, not as a permanent requirement that every card remain. A future phase may add, reframe, combine, or remove measures when doing so better serves an explicitly chosen objective and preserves source transparency.

## Related documentation

- [`product-principles.md`](product-principles.md): presentation and interpretation principles.
- [`dashboard-review-guide.md`](dashboard-review-guide.md): product-owner review prompts and Phase 2 candidates.
- [`phase-1-limitations.md`](phase-1-limitations.md): accepted limitations and approved substitutions.
- [`phase-1-closeout.md`](phase-1-closeout.md): final audit and verification evidence.
- [`data-refresh.md`](data-refresh.md): exact sources, transformations, coverage, and refresh behavior.
- [`charting.md`](charting.md): chart behavior, range controls, zoom, and accessibility.
- [`data-model.md`](data-model.md): domain model and repository boundary.
- [`epics/02-epic-build-phase-1-dashboard.md`](epics/02-epic-build-phase-1-dashboard.md): completed Phase 1 scope and story map.
