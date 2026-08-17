# Product overview and home-page indicator inventory

## Product purpose

The U.S. Economy Dashboard is a descriptive, historically grounded briefing on major dimensions of the national economy. It helps a reader answer: “What is happening, how does it compare with the past, and what does this measure leave out?”

The product is intentionally broad and nonpartisan. It does not forecast markets, recommend investments, evaluate political actors, infer causation from timing, or collapse mixed evidence into one score. National aggregates are not presented as descriptions of every household, worker, firm, industry, or region.

The home page (`/`) contains **25 cards in nine sections**: Growth; Prices; Employment and income; Households; Housing; Business and manufacturing; Financial conditions; Government finances; and Trade and tariffs. The measures update at different frequencies and may point in different directions. No single card is an overall verdict on the economy.

The application also has an unlinked secondary-indicators page at `/secondary` and a simplified status board at `/dashboard`. They are supporting presentations, not part of the home-page inventory below. The status board contains ten single-purpose tiles: year-over-year real GDP growth using the same `GDPC1` dataset as the home-page GDP card; standalone unemployment; payroll growth using the latest complete three-month average with the latest single-month change as secondary context; initial claims using the official four-week average with the latest weekly reading; headline 12-month CPI-U inflation; real wage growth for all private employees; the real-time Sahm Rule indicator; the Freddie Mac 30-year fixed mortgage rate; the S&P 500 index level; and the high-yield corporate credit spread. GDP readings within 0.1 percentage point of zero are labeled **Little changed**; larger positive readings are **Growing**, and larger negative readings are **Contracting**, without treating the GDP measure alone as a recession call. Each tile's hero and sparkline show the same measure. Tile fronts remain glanceable status views and flip to same-size contextual backs whose concise explanations respond deterministically to current data and metric-specific rules; no runtime AI commentary is used. The interaction supports pointer, touch, keyboard, and reduced-motion users. The status board does not replace the research-oriented home page.

## The compact, expandable card pattern

Every home-page card is compact by default and expands in place with a **More** control. This progressive-disclosure pattern separates a quick briefing from the evidence needed to inspect it.

The compact card normally keeps these elements visible:

- a plain-language question and precise measure label;
- the latest committed observation and its period;
- a short answer or state description based on explicit, metric-specific rules;
- recent direction or another immediately useful comparison;
- a small chart, decomposition, or comparison designed for the measure; and
- when interpretation needs care, a **Why this matters** disclosure that does not require opening the full research view.

The compact answer always refers to the latest committed observation, not the endpoint of a user-selected or zoomed range. Compact language distinguishes levels from rates, direction from desirability, and description from causation. Color is not used as the only carrier of meaning.

Selecting **More** leaves the compact headline visible and reveals the research layer. Depending on the card, that layer includes a larger chart, time-range and zoom controls, exact observations, component or comparison series, methodology, interpretation, limitations, source links, series identifiers, frequency, units, transformations, retrieval dates, and coverage. Expanded material supplies evidence and nuance; it does not silently redefine the compact answer.

### Historical bands

Most compact trend charts place roughly five years of recent observations over percentile bands calculated from a longer comparison history. Unless a card says otherwise, that history is the trailing 25 years through the latest observation:

- the darker inner band is the 25th–75th percentile range, or middle 50% of readings;
- the lighter outer band extends from the 10th–90th percentiles, or middle 80%; and
- a reading outside the outer band is in the highest or lowest 10% of that comparison period.

The bands describe **where readings have commonly occurred**. They are not confidence intervals, forecasts, targets, causal estimates, or declarations of a safe, healthy, sustainable, or desirable range. A card may translate percentile position into measure-specific language such as low/high or weak/strong, but only where that framing is meaningful. Zero lines and policy or affordability references are separate from the percentile bands.

Some cards require a different comparison set. Home-ownership affordability uses its shorter official available history; business investment uses compatible history beginning in 2008; federal debt and the realized tariff burden use all available quarterly history; and budget and trade balances compare the latest deficit, surplus, or balance magnitude only with observations in the same state. Population-normalized housing starts and three-month-average payroll or layoff measures calculate bands from the same transformed measure shown in the compact chart. Missing observations remain gaps and are never converted to zero or smoothed over.

## What the home page shows

### Growth

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **Is the U.S. economy growing?** | Latest quarterly year-over-year real GDP growth, a plain-language state, and a 20-quarter line over trailing-25-year bands with a zero line. | Full history, range and zoom controls, exact observations, interpretation, limitations, and source metadata. | Shows whether inflation-adjusted total output is expanding or contracting. |
| **Is economic output growing faster than the population?** | Latest quarterly year-over-year real GDP-per-capita growth and a 20-quarter line over historical bands with zero. | Full research chart, controls, observations, methodology, and limitations. | Separates growth in total output from growth in output available per person. |
| **Is the economy producing more per hour worked?** | Latest year-over-year growth in real output per hour, a `Yes`/`Not really`/`No` answer using an unrounded ±0.5% neutral zone, momentum versus four quarters earlier, and a banded 20-quarter chart. | Full productivity-growth history, controls, exact observations, interpretation, and source detail. | Distinguishes labor productivity from GDP and GDP per person without treating it as a welfare or distributional verdict. |

### Prices

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **What’s the inflation rate?** | Latest year-over-year headline CPI-U inflation from the not-seasonally-adjusted All Items index, matching BLS’s standard published 12-month measure; a rule-based plain-language assessment; comparison with a clearly labeled 2% policy reference; and five years over trailing-25-year bands. | Full headline-versus-core CPI evidence and a separate CPI-versus-headline-PCE panel using actual publication months and the Federal Reserve’s formal 2% PCE target, plus controls and documentation. Core CPI remains seasonally adjusted. | Provides the familiar household-facing BLS headline measure while making the seasonal-adjustment convention explicit and distinguishing CPI from the Fed’s preferred PCE measure. |
| **What is inflation doing recently?** | The actual NSA 12-month headline CPI rate and a subordinate conditional 12-month rate three months ahead if the exact latest three-month SA price increase repeats once. The existing slope visual retains the latest versus preceding non-overlapping three-month annualized `CPIAUCSL` comparison and its percentage-point difference as supporting context. | A 24-month rolling three-month annualized headline-and-core CPI chart remains primary research evidence. Methodology documents the three-month conditional horizon, base effects, SA/NSA combination, and isolated-gap geometric bridge used only for the scenario. Longer histories, controls, observations, and cautions remain available. | Separates the familiar observed inflation rate from recent momentum and translates that momentum into a narrowly labeled mechanical scenario—not a forecast. Official missing observations remain untouched; an isolated required NSA base may be bridged only from valid adjacent same-series observations. |
| **Are workers’ wages keeping up with prices?** | Latest year-over-year real growth in average hourly earnings for all private nonfarm employees, a purchasing-power answer, an honest comparison with compatible history beginning in 2007, and a five-year line with zero and matching historical bands. | The larger real-wage chart and controls; nominal all-private wage growth and seasonally adjusted CPI-U as secondary shared-axis evidence; the exact ratio method, observations, sources, and limitations, including the possibility of a 0.1-point rounding difference from BLS's official real-earnings change. | Connects inflation to broad aggregate purchasing power while avoiding claims about every worker. Seasonally adjusted `CES0500000003` wages and `CPIAUCSL` prices are paired deliberately; this supporting CPI convention differs from the NSA headline card. The published components define the reproducible dashboard result, while the BLS release is a verification diagnostic rather than a strict equality target. |
| **What is driving inflation?** | The BLS-published percentage-point contributions of shelter, other services, food, energy, and goods excluding food and energy. It shows the four largest absolute contributions plus an `Everything else` remainder and five-year category inflation-rate trends only where a directly comparable CPI series exists. | A current-versus-year-ago contribution table, reconciliation and methodology detail, interpretation help, sources, and exact supporting observations. | Separates how much a category contributes to headline inflation from how quickly that category’s own prices change. |

### Employment and income

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **Is unemployment high or low?** | Latest unemployment rate, its trailing-25-year position, the exact 12-month change classification, and a five-year banded chart. Lower readings occupy the favorable side of this metric-specific comparison. | Full unemployment history, controls, observations, interpretation, limitations, and sources. | Measures unsuccessful job seeking among people actively in the labor force. |
| **What share of prime-age adults are employed?** | Latest employment-to-population ratio for ages 25–54, a higher-is-better historical-position statement, and an interactive five-year chart over trailing-25-year bands. | Full history, controls, visible-range summary, observations, interpretation, limitations, and sources. | Adds a broad employment measure less affected by retirement and schooling than an all-age ratio. |
| **Are employers adding jobs?** | Latest three-month average monthly payroll change, a deterministic trend interpretation, and a five-year line over bands calculated from the same complete three-month-average series. A three-month average from −50K through +50K per month is **nearly stalled**. When the aligned latest month has the opposite sign from the smoothed trend, the compact interpretation also surfaces that monthly change; routine same-sign months remain in the expanded evidence. | Full payroll research chart, controls, and a table pairing monthly changes with three-month averages. | Separates whether payroll growth is meaningfully positive, near zero, or negative from how unusual that pace is within the trailing-25-year distribution. Monthly estimates are noisy and subject to revision; explicit revision tracking is not available. |
| **Is job growth keeping up with the labor force?** | The signed gap between actual three-month annualized payroll growth and an estimated annualized breakeven rate, both component rates and monthly job counts, and a five-year chart with zero and historical bands. | Full comparison history, methods, model limitations, sources, underlying components, and recent observations. | Estimates whether job growth is above, near, or below the modeled pace associated with absorbing potential labor-force growth while keeping unemployment approximately stable. |
| **Are layoffs beginning to rise?** | Latest monthly JOLTS layoffs-and-discharges rate, direction from the latest three-month average versus the preceding three months, historical level, and a banded compact chart. | Full JOLTS research controls plus separate weekly initial-claims and four-week-average evidence, observations, sources, and limitations. | Combines a direct but lagged separation measure with timelier claims context without treating them as interchangeable. |

### Households

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **Are households saving less of their income?** | Latest aggregate personal saving rate, its 12-month direction, historical classification, and a five-year chart over trailing-25-year bands. | Full monthly history plus annual BEA saving rates for ten income deciles, including a decile heat map, grouped comparison, latest-year distribution, observations, and methodology. | Shows aggregate saving behavior while exposing distributional differences and keeping monthly and annual evidence distinct. |

### Housing

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **How much of a median household’s income would it take to own a typical home?** | Latest modeled ownership cost as a share of median household income, comparison with the Atlanta Fed’s 30% affordability threshold, historical position against the official available history, and a compact chart. | Full affordability history, controls, assumptions, methodology, limitations, observations, and sources. | Summarizes the prospective cost of a median-priced home using a model that includes a 10% down payment, principal, interest, taxes, insurance, and private mortgage insurance. |
| **How much new housing is being started?** | Latest three-month-average housing-start pace, its population-normalized rate, historical classification, and five years of starts per 1,000 residents over matching bands. | Raw and normalized histories; regional rates; pipeline stages; building-size categories; and separate context for completed single-family floor area and new-home sales-price distributions. | Shows the pace at which housing enters construction without calling that pace sufficient or treating the annualized rate as a forecast. |

### Business and manufacturing

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **Are U.S. manufacturers producing more goods?** | Year-over-year growth in a complete trailing three-month average of real manufacturing production, with a five-year line, zero, and trailing-25-year bands. | Separate raw-index and derived-growth histories, controls, observations, interpretation, limitations, and sources. | Measures changes in inflation-adjusted manufacturing output volume, not jobs, prices, sales, profits, utilization, or manufacturing’s share of the economy. |
| **Are businesses investing more in productive assets?** | Latest quarterly year-over-year growth in real private nonresidential fixed investment, five years of readings, historical bands from compatible post-2008 data, and state-specific timing context. | Full growth and level evidence, controls, observations, interpretation, limitations, and sources. | Covers inflation-adjusted investment in equipment, nonresidential structures, software, and research. |
| **How large are corporate profits relative to the economy?** | Latest adjusted after-tax corporate profits per $100 of GDP, historical classification, and a five-year line over trailing-25-year bands. | The 1947-present research history, controls, structural context, observations, methodology, and limitations. | Shows an economy-wide national-accounts profit share, not an S&P 500 margin or company revenue margin. |

### Financial conditions

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **Where has the Fed set short-term interest rates?** | Current lower and upper limits of the FOMC federal funds target range, effective date, latest actual target change, and a five-year unsmoothed step chart. | Coherent policy history using the single target through December 15, 2008 and the target range thereafter; effective federal funds rate context; current bank prime rate; controls, observations, methodology, limitations, and sources. | Distinguishes the Fed's overnight policy range from the effective market rate, the bank-posted prime benchmark, mortgage rates, and other borrowing costs. It does not label the nominal setting restrictive or accommodative. |
| **Is the yield curve inverted?** | Trailing three-month average of the monthly 10-year Treasury yield minus the 3-month Treasury bill rate, the current inversion state, component rates, and a five-year spread chart with a prominent zero line. | Full spread history and controls, component-rate and federal-funds context, exact observations, interpretation, methodology, limitations, and sources. | Shows a historically informative but probabilistic relationship between long- and short-term rates; it is not a deterministic recession forecast. |
| **How high are mortgage rates?** | Latest weekly Freddie Mac national average 30-year fixed mortgage rate, its direction from one year earlier, and five years of unsmoothed weekly observations over full-history frequency bands. | Full weekly history since 1971, 5-/10-/20-year and maximum controls, one- and five-year percentage-point comparisons, observations, methodology, borrower-specific limitations, and sources. | Shows a widely followed national benchmark for mortgage borrowing conditions while making clear that actual offers vary and that mortgage rates alone do not determine housing affordability. |

### Government finances

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **How large is the federal budget deficit relative to the economy?** | The question, unsigned hero, label, answer, and five-year chart adapt to deficit, surplus, or approximate balance. The chart shows positive active-state magnitude, and its bands use only comparable postwar fiscal states. | The full signed series—deficits negative, surpluses positive—plus controls, observations, methodology, limitations, and sources. | Translates the annual fiscal flow into borrowing or excess revenue per $100 of GDP without declaring deficits bad or surpluses good. |
| **How large is federal debt held by the public relative to the economy?** | Latest quarterly debt-to-GDP ratio, comparison with one year of output, postwar historical position, exact five-year direction, and a five-year banded chart without a zero line. | Full postwar history, controls, observations, interpretation, methodology, limitations, and sources. | Shows accumulated publicly held federal debt, which is distinct from the annual deficit’s new borrowing. Historical bands are not a safety or crisis threshold. |

### Trade and tariffs

| Card | Compact card | Under **More** | Why it is included |
|---|---|---|---|
| **How large is the U.S. trade deficit relative to the economy?** | The question and unsigned hero adapt to deficit, surplus, or approximate balance. The five-year quarterly chart uses positive active-state magnitude and bands drawn only from comparable historical states, alongside the exact five-year direction. | The full signed total history plus aligned goods/services balances and exports/imports component tables, controls, observations, methodology, limitations, and sources. | Covers total goods-and-services trade without treating deficits as automatically bad or surpluses as automatically good. |
| **How heavily are imported goods being taxed?** | Latest realized tariff burden—customs-duty receipts divided by goods imports—translated into dollars per $100 imported, with historical position, recent direction, and a five-year banded chart. | Full tariff-burden history plus aligned core-goods PCE inflation, separate vertical scales, Federal Reserve research on modeled tariff price effects, controls, observations, methodology, limitations, and sources. | Measures the average realized customs-duty burden, not statutory schedules or who ultimately bears the cost. The aligned charts are descriptive; visual co-movement is not causal proof. |

## Shared interpretation and data rules

- Questions and answer language are metric-specific. A higher number is not universally good, and direction arrows or changes do not substitute for interpretation.
- A positive growth rate that declines is described as slower growth, not as a falling level.
- Percentage rates, percentage-point changes, annualized rates, index levels, dollar translations, and contributions are labeled distinctly.
- Maximum range means each source’s full useful history; cards do not share an arbitrary start date.
- Missing observations remain gaps. Differently timed series retain their actual publication periods rather than being filled from one another.
- Compact charts support accessible summaries and, where appropriate, mouse, touch, and keyboard access to exact observations. Visible focus and text labels keep color from being the sole information channel.
- Source, identifier, frequency, units, seasonal adjustment, transformation, retrieval date, coverage, limitations, and recent observations remain available in each expanded card.
- External data is validated before it reaches the UI. Derived series document their inputs and transformations in [`data-refresh.md`](data-refresh.md).

## Context for the simplified `/dashboard` page

The current home page is a research-oriented briefing: compact cards make 25 measures scannable, while **More** preserves substantial evidence and documentation. The separately implemented `/dashboard` is simpler still. Its ten tiles cover GDP growth, unemployment, payroll growth, initial claims, headline CPI, real wage growth for all private employees, the Sahm Rule, the 30-year mortgage rate, the S&P 500, and the high-yield credit spread. Each hero matches its sparkline: headline CPI-U's not-seasonally-adjusted 12-month change over five years; exact-ratio real wage growth over five years with zero as the purchasing-power reference; Freddie Mac's weekly 30-year fixed mortgage rate over five years; the S&P 500 index level over one year; and the corresponding measure for every other tile. S&P drawdown remains contextual state logic rather than replacing the index-level hero, and its year-to-date comparison uses the latest valid prior-year-end observation. High-yield percentage-point source values are presented as basis points. Expected inflation (`T10YIE`), the effective federal funds rate, and the yield curve remain valid data elsewhere in the application but are intentionally omitted from this pared-down page. The tile fronts preserve the status scan; their contextual backs explain live readings with deterministic metric-specific rules and no runtime AI-generated commentary. The page should continue to make explicit what it omits or combines. In particular:

- decide which small set of signals best serves the new page’s purpose rather than reproducing all 25 cards;
- preserve exact measure definitions, units, periods, and freshness even if explanations move elsewhere;
- do not turn historical percentile bands into good/bad thresholds;
- do not combine mixed indicators into an unexplained score;
- keep the distinction between a latest state, recent direction, historical rarity, and causal interpretation; and
- link back to the existing home-page research cards when a simplified tile needs deeper evidence.

## Related documentation

- [`product-principles.md`](product-principles.md): presentation and interpretation principles.
- [`data-refresh.md`](data-refresh.md): exact sources, transformations, coverage, and refresh behavior.
- [`charting.md`](charting.md): chart behavior, range controls, zoom, and accessibility.
- [`data-model.md`](data-model.md): domain model and repository boundary.
- [`dashboard-review-guide.md`](dashboard-review-guide.md): product-owner review prompts.
- [`phase-1-limitations.md`](phase-1-limitations.md): accepted limitations and approved substitutions.
- [`epics/02-epic-build-phase-1-dashboard.md`](epics/02-epic-build-phase-1-dashboard.md): completed Phase 1 scope and story map.
