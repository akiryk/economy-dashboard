# Product overview and indicator inventory

## Product purpose

The U.S. Economy Dashboard is a descriptive, historically grounded briefing on major dimensions of the national economy. It helps a reader answer, “What is happening, how does it compare with the past, and what does this measure leave out?”

The current product is intentionally broad and nonpartisan. It does not forecast markets, recommend investments, evaluate political actors, infer causation from timing, or collapse mixed evidence into one score. That purpose should remain the baseline unless a future phase explicitly adopts another objective.

The dashboard contains 27 visible cards in nine sections. Most cards use nonsmoothed time-series line charts. Relationship cards use two aligned lines; the manufacturing comparison normalizes two differently scaled series to a common selected-range baseline.

The `/secondary` route retains indicators that are not currently part of the main dashboard for possible future review. It currently contains the productivity-level card, “How much more productive is the economy than in the past?” The primary navigation links to this page as Secondary indicators.

The non-default `/briefing` preview currently adds one compact Labor tile. Its activity bar and momentum arrow show full-history percentile positions of the Kansas City Fed Labor Market Conditions Indicators; raw LMCI readings and the existing unemployment, payroll, prime-age employment, and claims measures appear only under More. The supporting measures cannot override the LMCI headline tiers.

## What the dashboard shows

### Growth

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Is the U.S. economy growing? | Quarterly real GDP, year-over-year percent change. The collapsed headline pairs the latest value with a labelled 20-quarter (five-year) compact line, historical 25th–75th and 10th–90th percentile bands, a zero reference, and on-demand band help; More opens the complete chart and research detail. | Shows whether inflation-adjusted total output is expanding or contracting while testing compact historical context and progressive disclosure before any wider rollout. |
| Is economic output growing faster than the population? | Quarterly real GDP per capita, year-over-year percent change. The default compact view pairs the latest value with a 20-quarter line, a trailing 25-year historical comparison using middle-50% and middle-80% bands, a zero reference, and on-demand help; More preserves the complete research chart and controls. | Distinguishes growth in total output from growth available per person and gives neutral historical context without labeling higher readings as inherently better. |
| Is the economy producing more per hour worked? | Quarterly real output per hour, year-over-year percent change. The compact callout translates the latest unrounded value into Yes at or above +0.5%, Not really between −0.5% and +0.5%, or No at or below −0.5%. Momentum versus four quarters earlier remains supporting context. The 20-quarter line, trailing 25-year bands, zero reference, help, and complete research view under More are unchanged. | Distinguishes labor productivity from GDP per capita and answers whether output per hour changed meaningfully from a year earlier without treating the answer as a welfare or distributional verdict. |

### Prices

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How quickly are consumer prices rising? | Monthly headline CPI, year-over-year percent change. The default compact view gives a plain-English assessment, compares CPI with a 2% policy reference, and plots five years against trailing 25-year bands. More retains the complete CPI research view and adds headline PCE inflation on actual published months with the Federal Reserve’s 2% PCE target. | Provides the broad, familiar consumer-price measure while clearly distinguishing the CPI policy reference from the Fed’s preferred PCE measure and target. |
| What is driving inflation? | BLS-published percentage-point effects on headline CPI for five mutually exclusive groups: shelter, other services, food, energy, and goods excluding food and energy. The collapsed card pairs the complete current decomposition with five-year category inflation-rate trends for dynamically selected contributors that have a direct CPI mapping; More provides the current/prior table and methodology. | Distinguishes how much a category contributed to headline inflation from how quickly that category’s own prices changed. Unsupported rate mappings are omitted rather than approximated. |
| Has inflation picked up in recent months? | Direct comparison of overall CPI inflation over the latest 12 months with the latest three-month annualized overall CPI pace. When stable, the compact hero expresses the recent pace as a rounded relative slowdown or pickup; near a zero past-year denominator it falls back to the percentage-point difference. Exact endpoint rates and their percentage-point difference remain visible, and the approved answer states remain based only on that difference. More retains 12-month and three-month annualized headline-versus-core evidence. | Distinguishes the observed recent pace from the slower-moving past-year rate without treating a relative slowdown as a decline in prices, treating annualization as a forecast, or allowing core CPI to override the headline comparison. |
| Are workers’ wages keeping up with prices? | Monthly real wage growth, labeled as year-over-year wage growth after adjusting for inflation. The compact five-year line labels its actual start and end months, keeps zero prominent, and adds trailing 25-year middle-50% and middle-80% historical bands plus a separate deterministic historical-position sentence. Values within 0.1 percentage point of zero are described as about even, and rounded zero is displayed as `0%`. More leads with the same real-wage series and a valid-month range summary; nominal wage growth and headline CPI remain secondary shared-axis evidence in a closed disclosure. Full range and zoom controls apply to both views. | Connects inflation to aggregate purchasing power for a defined group of private-sector workers without implying that the average describes every worker or that historical frequency is a target. |

### Employment and income

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Is unemployment high or low? | Monthly unemployment rate: the share of the labor force without a job and actively looking for work. The compact view pairs the latest level with a five-year line over trailing 25-year middle-50% and middle-80% bands, uses lower-is-better historical states, and separately classifies the exact 12-month percentage-point change. More preserves the full research chart and controls. | Describes both the current level and recent direction of unsuccessful job seeking among people in the labor force. Payroll growth, prime-age employment, and initial claims remain complementary indicators rather than inputs to this card’s answer. |
| What share of prime-age adults are employed? | Monthly employment-to-population ratio for ages 25–54. The compact view pairs the latest ratio and a higher-is-better historical-position statement with an interactive five-year line over trailing 25-year middle-50% and middle-80% bands; More preserves the full chart, controls, visible-range summary, interpretation, limitations, related indicators, and source detail. | Adds immediate historical context to a broad employment measure that is less affected by retirement and schooling than an all-age ratio, without implying anything about hours, pay, job quality, or why someone is not employed. |
| Are employers adding jobs? | Monthly payroll changes, emphasizing a rolling three-month average. | Shows the direction and recent pace of employer job creation while retaining monthly detail. |
| Are layoffs beginning to rise? | Weekly initial unemployment claims and the official four-week average, aligned by week ending. | Adds a timely signal of new unemployment-insurance filings while emphasizing the less noisy official average. |

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
| Are corporate profits growing relative to the economy? | Quarterly adjusted after-tax corporate profits divided by nominal GDP. | Scales national-account profits to the economy for historical comparison instead of showing a raw dollar total. It is an economy-wide profit share, not an S&P 500 or company revenue margin. |
| How fully is industrial capacity being used? | Monthly industrial capacity utilization. | Shows operating intensity and spare capacity across manufacturing, mining, and utilities. |

### Financial conditions

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How do short-term and long-term interest rates compare? | Monthly effective federal funds rate and 10-year Treasury yield. | Compares a policy-linked short rate with a benchmark long rate without treating the curve as a mechanical recession forecast. |
| Are credit conditions tighter or looser than usual? | Weekly Chicago Fed NFCI credit subindex relative to its historical average. | Adds broad credit availability and risk conditions not captured by Treasury yields alone. |
| Are banks making it harder to borrow? | Quarterly net percentage of domestic banks reporting tighter C&I lending standards for large and middle-market firms. | Adds a direct SLOOS survey measure for one borrower class, distinct from the NFCI composite and from loan demand or denial rates. |

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

The Real GDP growth, Real GDP per capita growth, labor-productivity growth, and headline CPI inflation cards default to a compact collapsed state containing the question, measure, latest observation, and historical-band chart. At wide and laptop widths the latest callout and compact chart sit side by side; narrow layouts stack them. Each complete research card remains available under More while its compact chart stays visible. Other research cards remain expanded by default.

- The latest callout always refers to the latest committed observation, not the endpoint of a zoomed historical window.
- Maximum shows each source’s full useful available history; cards do not share an arbitrary start date.
- Missing observations remain gaps and are never converted to zero or visually smoothed over.
- A positive growth rate that falls is described as slower growth, not as a falling level.
- The productivity card’s Yes/Not really/No wording is a metric-specific plain-language experiment. Its neutral zone prevents changes smaller than 0.5% in either direction from receiving a categorical Yes or No; the classification uses unrounded values.
- The CPI card classifies the unrounded latest rate as prices falling below 0%, rising very slowly from 0% to below 1%, rising near 2% from 1% through 2.5%, rising somewhat quickly above 2.5% through 4%, or rising quickly above 4%. Its 2% CPI comparison is explicitly a policy reference, not the Federal Reserve’s formal target.
- The expanded CPI card contains two separate panels rather than one multi-measure plot. Headline versus core CPI explains core as a diagnostic that excludes volatile food and energy, not as a replacement for household-facing headline CPI. Values differing by less than 0.1 percentage point are described as close. The CPI/PCE panel uses headline PCE, not core PCE. CPI and PCE retain their actual publication months; a missing or later month is never filled from the other series.
- The expanded CPI card links to the separate inflation-drivers card for current category contributions instead of duplicating contribution bars.
- The recent-inflation-momentum card compares headline CPI with headline CPI: the latest three-month annualized rate minus the latest 12-month rate. Differences of at least +1.0 or −1.0 percentage point are substantial, differences from +0.3 to below +1.0 are a pickup, differences from −1.0 to −0.3 are slowing, and smaller absolute differences are `Not much`. A labeled two-point slope and a dotted angle guide immediately below it show whether the recent pace is faster, slower, or about the same without presenting the windows as consecutive observations or adding a quantitative axis. Annualization expresses the observed three-month pace as a yearly rate; it is responsive and noisy, not a forecast. More retains both headline/core 12-month rates and headline/core three-month annualized rates as supporting evidence.
- The collapsed inflation-drivers card omits the redundant large headline value and labels every category value as a percentage-point contribution to headline CPI. It shows the four largest absolute current contributions plus an `Everything else` net remainder on a zero-centered scale, so large negative drivers remain eligible. The complete unrounded contribution set must reconcile to headline CPI within 0.05 percentage point or the compact answer is qualified as unreconciled.
- The right side shows five-year year-over-year category inflation rates only for current top-four contributors with an explicit directly comparable CPI-U mapping. Shelter, Energy, and Food are initially mapped; derived Other services is omitted without substitution. Each rate line uses its own labeled, padded vertical range so its variation remains legible. The range expands to zero when doing so is no more than twice the natural padded span; otherwise zero stays outside to avoid materially flattening the trend. Apparent line heights are not comparable across categories. Hover, tap, or keyboard arrows expose exact published monthly `%` values while preserving null gaps. The help control sits beside the rate heading outside plot space. Wide layouts place current contributions beside the available rate histories; narrow layouts stack them. One nonvisual summary states current contributions, mapped rates and periods, omissions, units, window, scale and interaction behavior. The expanded research content is unchanged.
- Inflation-driver wording follows finite thresholds: a negative offset of at least 25% of positive contributions is substantial; one category at 45% of positive contributions leads; the top two are named at 65%; otherwise four contributions of at least 0.1 percentage point are described as broad. Zero or negative headline inflation uses separate downward-pull wording.
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

The current 27-card dashboard should be treated as a baseline inventory, not as a permanent requirement that every card remain. A future phase may add, reframe, combine, or remove measures when doing so better serves an explicitly chosen objective and preserves source transparency.

## Related documentation

- [`product-principles.md`](product-principles.md): presentation and interpretation principles.
- [`dashboard-review-guide.md`](dashboard-review-guide.md): product-owner review prompts and Phase 2 candidates.
- [`phase-1-limitations.md`](phase-1-limitations.md): accepted limitations and approved substitutions.
- [`phase-1-closeout.md`](phase-1-closeout.md): final audit and verification evidence.
- [`data-refresh.md`](data-refresh.md): exact sources, transformations, coverage, and refresh behavior.
- [`charting.md`](charting.md): chart behavior, range controls, zoom, and accessibility.
- [`data-model.md`](data-model.md): domain model and repository boundary.
- [`epics/02-epic-build-phase-1-dashboard.md`](epics/02-epic-build-phase-1-dashboard.md): completed Phase 1 scope and story map.
