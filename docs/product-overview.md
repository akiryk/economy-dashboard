# Product overview and indicator inventory

## Product purpose

The U.S. Economy Dashboard is a descriptive, historically grounded briefing on major dimensions of the national economy. It helps a reader answer, “What is happening, how does it compare with the past, and what does this measure leave out?”

The current product is intentionally broad and nonpartisan. It does not forecast markets, recommend investments, evaluate political actors, infer causation from timing, or collapse mixed evidence into one score. That purpose should remain the baseline unless a future phase explicitly adopts another objective.

The dashboard contains 25 visible cards in nine sections. Most cards use nonsmoothed time-series line charts. Relationship cards use two aligned lines; the manufacturing comparison normalizes two differently scaled series to a common selected-range baseline.

The `/secondary` route retains indicators that are not currently part of the main dashboard for possible future review. It contains the productivity-level card, household-resources card, household debt-burden card, manufacturing output-versus-employment relationship card, and industrial-capacity-utilization card. The primary navigation links to this page as Secondary indicators.

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
| Are employers adding jobs? | The compact view leads with the latest three-month average monthly payroll change and compares the same complete three-month-average series with trailing 25-year middle-50% and middle-80% bands. It includes a five-year line, zero reference, exact-observation interaction, and separate sign and historical-strength language. | Shows whether employers are adding or cutting jobs and whether that pace is very weak, weak, typical, strong, or very strong by recent historical standards. More preserves the full research chart, range controls, and paired monthly/three-month-average table. |
| Is job growth keeping up with the labor force? | The compact view subtracts the estimated annualized breakeven payroll-growth rate from the latest three-month annualized actual PAYEMS growth rate, using a common payroll-employment denominator. It shows the signed percentage-point gap, both component rates and monthly job counts, a five-year line with zero, trailing 25-year historical bands, and exact-observation interaction. | Estimates whether payroll growth is above, roughly matching, or below the modeled pace associated with absorbing potential labor-force growth while keeping unemployment approximately stable. The breakeven baseline is model-dependent and the latest input is a Federal Reserve source projection; More preserves the primary comparison and exposes methods, limitations, sources, underlying components, and recent observations. |
| Are layoffs beginning to rise? | Monthly seasonally adjusted JOLTS total-nonfarm layoffs and discharges rate. The compact view compares the latest three-month average with the preceding three months, then independently places the latest rate in trailing 25-year historical bands. More preserves JOLTS research controls and the separate weekly initial-claims/four-week-average view. | Directly measures employer-initiated separations as a share of employment while retaining claims as complementary, timelier early-warning evidence. |

### Households

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Are households saving less of their income? | Monthly aggregate personal saving as a percentage of disposable personal income, plus annual BEA saving rates for ten income deciles. | Leads with the 12-month aggregate direction, separately classifies the current rate against a trailing 25-year distribution, and shows a five-year compact chart. The expanded view retains the monthly history and adds an annual decile heat map, a three-group comparison, and a latest-year distribution view. Distributional rates rank households by equivalized disposable personal income and should not be treated as monthly figures or household-level verdicts. |

### Housing

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| How much of a median household’s income would it take to own a typical home? | Monthly modeled annual ownership cost as a share of median household income. | The compact card compares the latest prospective-buyer cost with the Atlanta Fed’s 30% affordability threshold and with the official available history, while retaining the full research view under **More**. The model assumes a 10% down payment and includes principal, interest, taxes, homeowners insurance, and private mortgage insurance. |
| How much new housing is being started? | Latest three-month average of monthly privately owned housing starts at a seasonally adjusted annual rate, with a five-year compact line and trailing 25-year bands based on three-month-average starts per 1,000 residents. | Shows the physical pace at which housing enters construction and classifies that pace against population-normalized history without treating the annualized rate as a forecast or claiming that construction is sufficient. **More** retains the raw and normalized histories, compares all four Census regions per 1,000 regional residents, separates pipeline stages and building-size categories, and separately shows completed single-family floor area and the 2020-current nominal sales-price distribution of new single-family homes sold. Price and size are context, not affordable-versus-luxury labels. |

### Business and manufacturing

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Are U.S. manufacturers producing more goods? | Year-over-year percentage change in a complete trailing three-month average of the Federal Reserve real manufacturing-production index, with a five-year compact line, zero reference, and trailing 25-year historical bands. | “Producing more goods” means the inflation-adjusted volume of manufacturing production is higher than the same three-month period one year earlier. It does not mean employment, productivity, nominal sales, prices, profits, capacity use, or manufacturing’s economic share increased. **More** keeps raw index and derived growth histories separate. |
| Are businesses investing more in productive assets? | Latest quarterly year-over-year growth in real private nonresidential fixed investment, shown with five years of readings and bands based on compatible history since 2008. | States whether inflation-adjusted spending on equipment, nonresidential structures, software, and research is higher, lower, or about the same as a year ago; distinguishes new spending from the capital stock and eventual results. |
| How large are corporate profits relative to the economy? | Quarterly adjusted after-tax corporate profits divided by nominal GDP, with a five-year compact line and trailing 25-year historical bands. | Shows the adjusted after-tax corporate profit recorded per $100 of total U.S. output. The compact view supports current monitoring while **More** retains the 1947-present history and describes the broad rise beginning in the 1990s without assigning a single cause. It is an economy-wide national-accounts ratio, not an S&P 500 or company revenue margin. |

#### Secondary business and manufacturing research

| Card | Displayed measure and chart | Why it is secondary |
|---|---|---|
| Are manufacturing output and jobs moving together? | Monthly real manufacturing output and manufacturing payroll employment, each normalized to 100 at the selected range’s first shared observation. | Preserves the prior relationship research view without mixing employment into the main output-direction question. Its indexing, range controls, interactions, sources, explanations, and accessibility behavior remain unchanged. |

#### Secondary industrial activity research

| Card | Displayed measure and chart | Why it is secondary |
|---|---|---|
| How much spare industrial capacity is there? | Monthly output across manufacturing, mining, and utilities as a percentage of the Federal Reserve’s estimate of sustainable maximum output, compared in text with the published 1972–2025 long-run average. | Frames utilization as whether estimated spare industrial capacity is above or below normal without treating the industrial sector as the full economy or unused capacity as a literal inventory. The full research chart and controls remain available. |

### Financial conditions

| Card | Displayed measure and chart | Why it is here |
|---|---|---|
| Is the yield curve inverted? | Trailing three-month average of the monthly 10-year Treasury yield minus the 3-month Treasury bill rate, with a five-year compact spread chart and prominent zero line. | A negative spread is an inversion. Inversions have historically preceded many U.S. recessions, but the relationship is probabilistic and does not determine whether or when a recession will occur. The federal funds rate remains secondary monetary-policy context under **More**. |
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
