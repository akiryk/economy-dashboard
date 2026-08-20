# Economic data refresh

This is the authoritative technical inventory for sources, transformations, generated coverage, and refresh behavior. For the shorter product-level explanation of what each visible card shows and why, see [`product-overview.md`](product-overview.md). For the canonical card/tile mapping, source-specific freshness contracts, operational ownership, and incident runbook, see [`data-operations.md`](data-operations.md).

## Data flow

The refresh path is deliberately separate from the browser:

```text
FRED, BEA, Federal Reserve Board, BLS, or Atlanta Fed source -> Node refresh command -> validated domain JSON -> local repository -> React dashboard
```

The generated JSON is committed with the application, so the dashboard remains usable if FRED is unavailable. The browser never receives the API key and never contacts FRED.

The existing scheduled `.github/workflows/refresh-and-deploy.yml` workflow runs `npm run data:refresh` daily. The streamlined `/dashboard` uses this same path; it does not introduce a second workflow, backend, runtime secret, page-load FRED request, or intraday polling.

## Supported-series configuration

`scripts/fred/seriesConfigurations.ts` contains an explicit list of supported series. Each entry defines its slug, output file, provider identifier, FRED and domain frequencies, observation start, transformation, minimum history, and domain metadata. The list currently contains:

- Real GDP growth (`GDPC1`, quarterly), written to `real-gdp-growth.json`.
- Real GDP per capita growth (`A939RX0Q048SBEA`, quarterly source level), derived into `real-gdp-per-capita-growth.json`.
- Labor productivity (`OPHNFB`, quarterly source index), fetched once and written as the published level plus locally derived year-over-year growth.
- Headline CPI uses the not-seasonally-adjusted CPI-U All Items index (`CPIAUCNS`) for the published-style 12-month change. Recent headline momentum uses the seasonally adjusted All Items index (`CPIAUCSL`), while core CPI uses the seasonally adjusted index excluding food and energy (`CPILFESL`).
- Category CPI-U indexes from BLS (`CUUR0000SAH1` Shelter, `CUUR0000SA0E` Energy, and `CUUR0000SAF1` Food), derived into local five-year year-over-year supporting series for the inflation-drivers card.
- Headline PCE inflation (`PCEPI`, monthly index level), derived into exact 12-month year-over-year growth for the expanded CPI policy comparison.
- Unemployment rate (`UNRATE`, monthly), written to `unemployment-rate.json`.
- Prime-age employment-to-population ratio (`LNS12300060`, monthly), written to `prime-age-employment-ratio.json`.
- JOLTS total-nonfarm layoffs and discharges rate (`JTSLDR`, monthly, seasonally adjusted), preserved as the provider-published percent of employment with no further normalization.
- Initial unemployment claims and the official four-week average (`ICSA` and `IC4WSA`, weekly), written as separate provider-published levels and aligned only for presentation. They remain complementary evidence under the JOLTS-led layoffs card.
- Payroll growth (`PAYEMS`, monthly source level), derived into `monthly-payroll-change.json` and `payroll-growth.json`.
- Kansas City Fed Labor Market Conditions Indicators (`FRBKCLMCILA` activity and `FRBKCLMCIM` momentum, monthly), written as separate provider-published standardized indexes for briefing use.
- Wages versus inflation (`CES0500000003` plus `CPIAUCSL`), derived into `nominal-wage-growth.json` and `real-wage-growth.json`; the supporting seasonally adjusted CPI comparison is persisted separately from the NSA headline card.
- Long-run worker purchasing power uses seasonally adjusted production/nonsupervisory hourly earnings (`AHETPI`, underlying BLS `CES0500000008`) and seasonally adjusted CPI-W (`CWSR0000SA0`). Both input levels, their exact-month ratio, and rolling 4-, 10-, and 20-year changes feed the visible long-run card; this measure does not alter the existing all-private real-wage card.
- Real disposable income per capita and real consumer spending per capita (`A229RX0Q048SBEA` and `A794RX0Q048SBEA`, quarterly source levels), derived into quarterly per-capita growth outputs.
- Personal saving rate (`PSAVERT`, monthly), written to `personal-saving-rate.json`.
- Saving rate by income decile (BEA Distribution of Personal Saving workbook, annual), written to `saving-rate-by-income-decile.json`.
- Household debt-service ratio (`TDSP`, quarterly), written as the provider-published level to `household-debt-service-ratio.json`.
- Housing starts (`HOUST`, monthly), written as the provider-published level to `housing-starts.json`.
- Manufacturing output (`IPMAN`, monthly), written as the provider-published index to `manufacturing-output.json`.
- Manufacturing employment (`MANEMP`, monthly), written as the provider-published level in thousands to `manufacturing-employment.json`.
- Real business investment (`PNFIC1`, quarterly source level), retained in `real-business-investment-level.json` for compact-chart details and derived into exact-quarter year-over-year growth in `real-business-investment-growth.json`.
- After-tax corporate profit share, derived by exact quarter from adjusted after-tax corporate profits (`CPATAX`) divided by nominal GDP (`GDP`) and written to `corporate-profit-share.json`.
- Industrial capacity utilization (`TCU`, monthly), written as the provider-published percentage level to `industrial-capacity-utilization.json`.
- Effective federal funds rate, 10-year Treasury yield, and 3-month Treasury bill rate (`FEDFUNDS`, `GS10`, and `TB3MS`, monthly), written as separate provider-published percentage levels. The yield-curve card aligns `GS10` and `TB3MS` by exact month, calculates `GS10 − TB3MS` in percentage points, and then takes a trailing three-month average only when all three consecutive spreads are available. `TB3MS` is the secondary-market 3-month Treasury bill rate quoted on a discount basis; all three series are not seasonally adjusted monthly averages. The federal funds rate is supporting policy context and is not part of the spread.
- Broad credit conditions (`NFCICREDIT`, weekly), written as the provider-published standardized index to `broad-credit-conditions.json`.
- Bank lending standards (`DRTSCILM`, quarterly), written as the provider-published net percentage of domestic banks reporting tighter C&I standards for large and middle-market firms.
- Federal budget balance (`FYFSGDA188S`, annual) and federal debt held by the public (`FYGFGDQ188S`, quarterly), written as separate provider-published percent-of-GDP ratios.
- Trade balance as a share of GDP (`A019RE1Q156NBEA`, quarterly), written as the provider-published signed ratio.
- Effective tariff burden, derived from quarterly customs-duty receipts (`B235RC1Q027SBEA`) divided by goods imports (`A255RC1Q027SBEA`) and written to `effective-tariff-burden.json`.
- Core-goods PCE inflation, parsed from the Federal Reserve Board's published Figure 5 data in its April 8, 2026 FEDS Note and written to `core-goods-pce-inflation.json`. Run `npm run data:refresh-core-goods-pce` to refresh this source independently. The series is the published 12-month percent change; February 2026 is a Federal Reserve staff estimate.

### Federal funds policy-rate sources

Federal funds policy history uses daily, not-seasonally-adjusted `DFEDTARL` and `DFEDTARU` from December 16, 2008 forward. Both bounds must exist on the exact same effective date and the lower bound must not exceed the upper; partial ranges remain unavailable. The discontinued daily `DFEDTAR` single-target series supplies September 27, 1982–December 15, 2008 without fabricating a range. FRED notes that pre-1994 observations are reconstructed from Federal Reserve Bank of St. Louis research, with later single-target observations derived from FOMC transcripts and statements.

Committed source files preserve every daily effective state. Presentation derives policy-change points and step geometry without smoothing or interpolation. `DFF` supplies the observed effective federal funds rate, while `DPRIME` supplies the Fed-reported bank prime loan rate as supporting context. Prime is the rate posted by a majority of the 25 largest insured U.S.-chartered commercial banks; it is not set directly by the Federal Reserve, guaranteed to borrowers, or a mortgage-rate proxy.

### Streamlined `/dashboard` source foundation

Story 84 adds or explicitly reuses the following 18 full-history FRED inputs. Coverage reflects the successful August 10, 2026 refresh. All generated files are validated `EconomicSeries` data and are resolved by stable slug through the narrow asynchronous `dashboardEconomicSeriesRepository`; its three reused slugs delegate to `localEconomicSeriesRepository`.

| FRED ID | Frequency; units; adjustment | FRED transformation | Repository slug / generated data | Coverage |
|---|---|---|---|---|
| `GDPC1` | Quarterly; percent change from same quarter one year earlier; underlying real GDP level is SAAR | `units=pc1` | Reuses `real-gdp-growth` for both the home-page and status-dashboard GDP cards | 1948 Q1–2026 Q2 |
| `A191RL1Q225SBEA` | Quarterly; percent change from preceding period at annual rate; SAAR | Provider-published | Retained as `dashboard-real-gdp-growth`; not used by the status GDP headline | 1947 Q2–2026 Q2 |
| `GDP` | Quarterly; billions of dollars; SAAR | Provider-published level | `dashboard-nominal-gdp` | 1947 Q1–2026 Q2 |
| `UNRATE` | Monthly; percent; seasonally adjusted | Provider-published level | Reuses `unemployment-rate` | Jan 1948–Jul 2026 |
| `PAYEMS` | Monthly; thousands of persons; seasonally adjusted | `units=chg` | `dashboard-payroll-change` | Feb 1939–Jul 2026 |
| `IC4WSA` | Weekly; claims; seasonally adjusted | Provider-published four-week average | Reuses `initial-unemployment-claims-four-week-average` | Jan 28, 1967–Aug 1, 2026 |
| `ICSA` | Weekly; claims; seasonally adjusted | Provider-published level | Reuses `initial-unemployment-claims` | Jan 7, 1967–Aug 1, 2026 |
| `SAHMREALTIME` | Monthly; percentage points; derived from seasonally adjusted unemployment | Provider-published real-time indicator | `dashboard-sahm-rule-gap` | Dec 1959–Jul 2026 |
| `CPIAUCNS` | Monthly; percent change from year ago; not seasonally adjusted underlying index | `units=pc1` | `dashboard-headline-cpi-inflation` | Jan 1914–Jul 2026 |
| `CPILFESL` | Monthly; percent change from year ago; seasonally adjusted underlying index | `units=pc1` | `dashboard-core-cpi-inflation` | Jan 1958–Jul 2026 |
| `T10YIE` | Daily; percent; not seasonally adjusted | Provider-published | `dashboard-expected-inflation-10-year` | Jan 2, 2003–Aug 7, 2026 |
| `DFF` | Daily; percent; not seasonally adjusted | Provider-published | `dashboard-effective-federal-funds-rate` | Jul 1, 1954–Aug 6, 2026 |
| `DFEDTARU` | Daily; percent; not seasonally adjusted | Provider-published | `dashboard-fed-target-upper-bound` | Dec 16, 2008–Aug 10, 2026 |
| `T10Y2Y` | Daily; percentage-point spread; not seasonally adjusted | Provider-published precomputed spread | `dashboard-yield-spread-10y-2y` | Jun 1, 1976–Aug 7, 2026 |
| `T10Y3M` | Daily; percentage-point spread; not seasonally adjusted | Provider-published precomputed spread | `dashboard-yield-spread-10y-3m` | Jan 4, 1982–Aug 7, 2026 |
| `DGS10` | Daily; percent; not seasonally adjusted | Provider-published | `dashboard-ten-year-treasury-yield` | Jan 2, 1962–Aug 6, 2026 |
| `MORTGAGE30US` | Weekly; percent; not seasonally adjusted | Provider-published Freddie Mac Primary Mortgage Market Survey national average | `dashboard-mortgage-rate-30-year`, reused by the home-page mortgage-rate card | Apr 2, 1971–Aug 6, 2026 |
| `SP500` | Daily; index level; not seasonally adjusted | Provider-published | `dashboard-sp500` | Aug 8, 2016–Aug 7, 2026 |
| `BAMLH0A0HYM2` | Daily; percentage-point option-adjusted spread; not seasonally adjusted | Provider-published | `dashboard-high-yield-credit-spread` | Aug 8, 2023–Aug 6, 2026 |

FRED's retained `SP500` history is approximately ten years, so it cannot support a true all-time-high drawdown. The future presentation must describe a high or drawdown relative to available FRED history unless another provider is separately approved. The currently returned `BAMLH0A0HYM2` history is also shorter than the source's longer historical existence; Story 84 preserves all 795 observations FRED returned rather than inventing or splicing older data.

Each configuration uses `historyPolicy: { type: "full" }`, retains observations chronologically, preserves internal `"."` values as `null`, and records the FRED transformation in generated metadata. The refresh writes only after response validation, minimum-history checks, domain validation, and serialization; a failed request or invalid response leaves the prior committed file intact. Future sparkline windows and historical-position calculations will select from these full committed histories rather than triggering new provider calls.

`MORTGAGE30US` is Freddie Mac's national Primary Mortgage Market Survey benchmark for a 30-year fixed mortgage, carried by FRED. It is generally released weekly on Thursday and is not seasonally adjusted. Freddie Mac changed the PMMS methodology on November 17, 2022; subsequent weekly rates are based on mortgage applications submitted to Freddie Mac by lenders nationwide. The application preserves dated weekly observations and null gaps without smoothing, interpolation, or conversion to monthly averages. The benchmark is not an individualized offer: loan product and term, credit, loan-to-value ratio or down payment, points and fees, lender, borrower, and property characteristics can all affect an actual quote.

The realized tariff burden uses BEA quarterly seasonally adjusted annual-rate customs-duty receipts (`B235RC1Q027SBEA`) as the numerator and goods-only imports (`A255RC1Q027SBEA`) as the denominator. The application aligns observations by quarter and calculates duties divided by goods imports times 100. Because collections and recorded imports can occur on different schedules, the ratio may contain a timing mismatch and should be read as an average realized burden rather than a product-level statutory rate.

The narrow `scripts/atlantaFed/hoamWorkbook.ts` path downloads the official national HOAM workbook and writes `home-ownership-cost-share.json`; it is intentionally separate from the FRED configuration list.

The job-growth-versus-breakeven foundation is also separate from the general
FRED configuration list. `npm run data:refresh-job-growth-breakeven` downloads
the Federal Reserve Board’s official accessible Figure 2 table and the full
PAYEMS level CSV, validates both, derives exact-quarter comparisons, and
atomically replaces
`estimated-breakeven-employment-growth.json` and
`job-growth-breakeven-comparison.json` as one group. The command requires no API
key. The browser never contacts either provider.

The inflation-contribution snapshot is also outside the FRED list. It records the
unadjusted 12-month “effect on All Items” values published directly in BLS CPI-U
news-release Table 7 for the newest release and, when available, the same month
one year earlier. The five displayed groups are
food, energy, shelter, commodities less food and energy, and other services.
Other services is calculated as the published services-less-energy-services
effect minus the published shelter effect, making the five groups mutually
exclusive. The current effects sum to 3.531 percentage points versus published
headline CPI of 3.5%, a −0.031-point residual caused by summing effects that BLS
publishes to three decimals. Missing source values are not interpolated or
carried forward. BLS calculates effects from unrounded index changes and weights;
the committed snapshot should be replaced when the source release is updated,
including any revisions.

The compact presentation selects four categories only after loading the
complete snapshot and calculates `Everything else` from every omission. This
selection is by absolute current contribution so a large negative effect is not
hidden. The source snapshot and expanded current-versus-prior table are
unchanged by the compact grouping.

Historical contribution ingestion uses the official
[BLS archived supplemental-files page](https://www.bls.gov/cpi/tables/supplemental-files/),
not archived CPI HTML releases. Prior years are supplied as annual ZIPs and
recent months as individual News Release Table 7 XLSX workbooks. The local
commands validate workbook identity, measured month, exact category rows, the
12-month effect column, numeric signs, provenance, derived Other services, and
reconciliation within 0.05 percentage point before atomically writing output.
October 2025 is emitted only as an explicit unavailable observation because BLS
states that the tables are unavailable due to the 2025 appropriations lapse.
The initial `inflation-contribution-history.json` backfill contains 60 validated
release observations from June 2021 through June 2026 and the one explicit gap;
the scheduled updater appends subsequent validated releases.
Residuals caused by BLS source rounding range from −0.050 to +0.048 percentage
point, within the declared 0.05-point tolerance. The existing two-observation UI
snapshot remains unchanged; Story 47 adds production history but no chart or
card behavior.
See
[`inflation-contribution-history-feasibility.md`](inflation-contribution-history-feasibility.md)
for the exact file inventory, commands, validation contract, and
release-vintage policy. No category percent-change column or component
inflation-rate series may be used as a proxy.

### Scheduled Table 7 and category-rate refresh

`npm run data:refresh-inflation-contributions` runs the strict Table 7 updater.
It retrieves only the official BLS supplemental index at
`https://www.bls.gov/cpi/tables/supplemental-files/home.htm` and discovers links
whose semantic label is exactly **News Release Table 7, [Month] [Year] (XLSX)**.
Both the index and the final workbook URL must remain HTTPS URLs on
`www.bls.gov`; redirects to any other host are rejected.

The updater compares the newest discovered reporting month with the latest
committed release observation. An equal period is a successful no-op and writes
nothing. A release exactly one month newer is downloaded to memory, checked for
XLSX identity, assigned the official response's Last-Modified release date, and
passed through the same strict `parseInflationContributionWorkbook` function as
the manual command. The parser verifies the Table 7 heading, reporting month,
effect column, required categories, numeric values, provenance, derived Other
services value, and reconciliation tolerance. The full history is then checked
for order, duplicates, and preservation before history and the two-period card
snapshot are replaced as one rollback-safe group.

An older discovered release is treated as suspicious. A gap of more than one
month requires an explicit oldest-to-newest backfill rather than silently
skipping a release. Discovery failure is distinct from a no-new-release result.
Once a newer workbook is known to exist, any download, identity, parsing, or
validation failure fails the refresh and leaves both committed files unchanged.
The scheduled workflow therefore cannot commit or deploy partial Table 7 data.
It does not store downloaded XLSX files or add retrieval-only metadata on no-op
runs.

GitHub-hosted Ubuntu runners currently receive HTTP 403 from the official BLS
supplemental page, as confirmed by workflow run 31805452093 on August 14, 2026.
This is a supported external-access state. The scheduled workflow reports that
automatic freshness could not be determined, preserves the last valid
contribution dataset, and allows unrelated validated economic data to refresh
and deploy. It does not classify access denial as “no new release.” No mirror,
third-party copy, access spoofing, or weaker host validation is used.

The automatic Table 7 infrastructure is complete even though scheduled source
access is presently unavailable. If BLS later permits GitHub-hosted retrieval,
the same discovery, download, validation, atomic persistence, verification, and
deployment path can proceed without redesign. Until then, every new Table 7
contribution release requires the documented manual workbook fallback. Failures
after successful retrieval—such as a malformed workbook, suspicious period,
missing category, reconciliation failure, or history truncation—remain blocking
validation failures and can never replace committed good data.

The normal `npm run data:refresh` path separately requests the unadjusted CPI-U
index histories for shelter (`CUUR0000SAH1`), energy (`CUUR0000SA0E`), and food
(`CUUR0000SAF1`) from the official BLS Public Data API. It calculates each
category's year-over-year rate from index levels through the latest month common
to all three responses and atomically replaces their committed JSON series.
These rates support the five-year mini-charts; they are not substitutes for
Table 7 percentage-point contribution effects. The card's contribution period
is labeled independently, while every supporting chart exposes its own latest
observation date.

The manual `npm run data:ingest-inflation-contribution -- --file ... --period
... --release-date ... --source-url ... --output ...` command remains the
fallback for BLS access changes, deliberate recovery, and debugging. It shares
the production parser and validators. Historical annual-ZIP ingestion remains
an explicit backfill command and is never repeated by the daily schedule.

`NFCICREDIT` is the approved broad-credit-stress measure. It provides a long, redistributable Chicago Fed history focused on credit conditions. It replaces the Epic's contemplated corporate credit spread because current ICE BofA FRED exposure is short and licensed, Moody's terms restrict redistribution and storage, and a high-yield-only spread would cover only speculative-grade borrowers. The overall NFCI is not used because the separate rate card already covers interest-rate conditions.

The yield-curve compact state uses the unrounded trailing three-month average: below −0.10 percentage points is inverted, −0.10 through +0.10 inclusive is nearly flat, and above +0.10 is upward sloping. Missing or unmatched months remain null; averages are never partial and gaps are not interpolated.
`GS10` begins in April 1953, while `TB3MS` begins in January 1934; the coherent shared monthly history therefore begins in April 1953 and the first complete three-month average is June 1953. `GS10` is a constant-maturity par yield and `TB3MS` is a Treasury-bill discount rate, so the card documents rather than conceals that quotation-method difference. It does not splice another short-rate definition into the history, and provider revisions flow through the normal atomic refresh process.

## Provider requests

`npm run data:refresh` uses Node's built-in `fetch` to call:

```text
https://api.stlouisfed.org/fred/series/observations
```

Shared parameters:

- `api_key` from `FRED_API_KEY`
- `file_type=json`
- `sort_order=asc`

The series-specific requests are:

- GDP: `series_id=GDPC1`, `frequency=q`, and `units=pc1`.
- Headline 12-month CPI: `series_id=CPIAUCNS`; headline momentum and the real-wage deflator: `series_id=CPIAUCSL`. Both use `frequency=m`, with no `units` or `observation_start` parameter.
- Core CPI: `series_id=CPILFESL` and `frequency=m`, with no `units` or `observation_start` parameter.
- Headline PCE: `series_id=PCEPI` and `frequency=m`, with no `units` or `observation_start` parameter.
- Unemployment: `series_id=UNRATE` and `frequency=m`, with no `units` parameter.
- Prime-age employment: `series_id=LNS12300060` and `frequency=m`, with no `units` parameter.
- Initial unemployment claims: `series_id=ICSA` and `frequency=w`, with no `units` parameter.
- JOLTS layoffs and discharges rate: `series_id=JTSLDR` and `frequency=m`, with no `units` parameter.
- Official four-week average: `series_id=IC4WSA` and `frequency=w`, with no `units` parameter.
- Payroll: `series_id=PAYEMS` and `frequency=m`, with no `units` parameter.
- LMCI Activity and Momentum: `series_id=FRBKCLMCILA` and `series_id=FRBKCLMCIM`, each with `frequency=m` and no `units` parameter.
- Wages: `series_id=CES0500000003` and `frequency=m`, with no `units` parameter.
- Real GDP per capita: `series_id=A939RX0Q048SBEA` and `frequency=q`, with no `units` parameter.
- Labor productivity: `series_id=OPHNFB` and `frequency=q`, with no `units` parameter.
- Real disposable income per capita: `series_id=A229RX0Q048SBEA` and `frequency=q`, with no `units` parameter.
- Real consumer spending per capita: `series_id=A794RX0Q048SBEA` and `frequency=q`, with no `units` parameter.
- Personal saving rate: `series_id=PSAVERT` and `frequency=m`, with no `units` parameter.
- Household debt-service ratio: `series_id=TDSP` and `frequency=q`, with no `units` parameter.
- Housing starts: `series_id=HOUST` and `frequency=m`, with no `units` parameter.
- Monthly U.S. population: `series_id=POPTHM` and `frequency=m`, with no `units` parameter. This BEA population estimate is not seasonally adjusted and is stored in thousands of people. Housing starts are aligned to the population observation with the exact same month; missing months remain null and are neither interpolated nor carried forward. The compact historical series first divides each monthly HOUST value (thousands of housing units at a seasonally adjusted annual rate) by the same-month POPTHM value (thousands of residents), multiplies by 1,000, and then requires all three constituent months for its trailing average.
- Manufacturing output: `series_id=IPMAN` and `frequency=m`, with no `units` parameter.
- Manufacturing employment: `series_id=MANEMP` and `frequency=m`, with no `units` parameter.
- Real business investment: `series_id=PNFIC1` and `frequency=q`, with no `units` parameter.
- Corporate profit share inputs: `series_id=CPATAX` and `series_id=GDP`, each with `frequency=q` and no `units` parameter.
- Industrial capacity utilization: `series_id=TCU` and `frequency=m`, with no `units` parameter.
- Effective federal funds rate: `series_id=FEDFUNDS` and `frequency=m`, with no `units` parameter.
- 10-year Treasury yield: `series_id=GS10` and `frequency=m`, with no `units` parameter.
- Broad credit conditions: `series_id=NFCICREDIT` and `frequency=w`, with no `units` parameter.
- Bank lending standards: `series_id=DRTSCILM` and `frequency=q`, with no `units` parameter.
- Federal budget balance: `series_id=FYFSGDA188S` and `frequency=a`, with no `units` parameter.
- Federal debt held by the public: `series_id=FYGFGDQ188S` and `frequency=q`, with no `units` parameter.
- Trade balance: `series_id=A019RE1Q156NBEA` and `frequency=q`, with no `units` parameter.
- Customs duties: `series_id=B235RC1Q027SBEA` and `frequency=q`, with no `units` parameter.
- Imports of goods: `series_id=A255RC1Q027SBEA` and `frequency=q`, with no `units` parameter.
- Streamlined-dashboard sources: `A191RL1Q225SBEA` and `GDP` use `frequency=q`; `PAYEMS` uses `frequency=m&units=chg`; `SAHMREALTIME` uses `frequency=m`; `CPIAUCNS` and `CPILFESL` use `frequency=m&units=pc1`; `T10YIE`, `DFF`, `DFEDTARU`, `T10Y2Y`, `T10Y3M`, `DGS10`, `SP500`, and `BAMLH0A0HYM2` use `frequency=d`; and `MORTGAGE30US` uses `frequency=w`. `UNRATE`, `IC4WSA`, and `ICSA` reuse the compatible requests listed above.

Every current configuration uses `historyPolicy: { type: "full" }`. The client therefore omits `observation_start` and lets FRED return the full available source history. The explicit policy keeps request behavior reviewable and supports a future dated policy without scattering date exceptions through the client.

The optional `fredUnits` configuration field is deliberately limited to the transformations the repository uses: `pc1` for the existing GDP growth series and the streamlined dashboard's headline/core CPI representations, and `chg` for the streamlined dashboard's PAYEMS monthly-change representation. Omitting it preserves provider-published values for every other configuration. Domain transformation metadata records whether a dataset is a provider value, FRED API transformation, or local calculation.

The main manufacturing card derives growth locally from IPMAN, the Federal
Reserve index of inflation-adjusted manufacturing production volume. For every
month it first requires three consecutive finite monthly index observations,
then compares that trailing average with the exact three-month average ending
12 months earlier. Missing inputs produce nulls; the transformation never uses
partial averages, interpolation, or carry-forward. The committed provider-level
IPMAN file and its refresh behavior are unchanged. The original IPMAN/MANEMP
selected-range relationship view remains on `/secondary`.

### Housing construction detail

The committed `housing-construction-details.json` dataset extends the national
housing-start card with New Residential Construction series from Census and HUD,
distributed through FRED. Regional starts use HOUSTNE, HOUSTMW, HOUSTS, and
HOUSTW (monthly, thousands of housing units, seasonally adjusted annual rate,
available since 1959). Their population denominators are CNERPOP, CMWRPOP,
CSOUPOP, and CWSTPOP (annual July 1 Census estimates, thousands of residents,
not seasonally adjusted). A calendar year's annual population estimate is used
for each month in that calendar year; no value is extrapolated into a year for
which Census has not published an estimate.

The national pipeline uses PERMIT/PERMIT1/PERMIT24/PERMIT5, HOUST/HOUST1F/
HOUST2F/HOUST5F, UNDCONTSA/UNDCON1USA/UNDCON24USA/UNDCON5MUSA, and COMPUTSA/
COMPU1USA/COMPU24USA/COMPU5MUSA. These are housing-unit series, never structure
counts. Permits, starts, and completions are monthly seasonally adjusted annual
rates in thousands; under-construction observations are a seasonally adjusted
inventory in thousands and are therefore shown separately without a common
rate axis. Census revises preliminary observations in later releases. HOUST5F
includes 2–4-unit buildings before August 1963, but the committed detail window
starts in 2021 and is unaffected. The February 2005 permit-universe expansion
is outside the displayed window but remains a documented source break.

The same atomic refresh writes `housing-supply-composition.json`. Construction
composition reuses the compatible national HOUST1F, HOUST2F, and HOUST5F
housing-unit series. Completed-home characteristics use COMPSFLAM1FQ (quarterly,
seasonally adjusted median square feet of completed one-family units); it is not
treated as a proxy for price or affordability.

The price distribution is annual, nominal, and not seasonally adjusted. It uses
NHSUSSPU30AP, NHSUSSP30T39AP, NHSUSSP40T49AP, NHSUSSP50T59AP,
NHSUSSP60T79AP, NHSUSSP80T99AP, and NHSUSSP100OAP. These source fields describe
new single-family homes sold, not starts, multifamily rentals, existing homes, or
all completions. Census introduced the current detailed bucket family beginning
in 2020. The dashboard therefore begins in 2020 and does not splice it to the
incompatible discontinued pre-2024 buckets. Published shares are computed from
unrounded values, so rounded components can differ slightly from 100%. Annual
estimates may be revised; the refresh validates bucket order, years, finite
shares, and approximate totals before atomically replacing either housing detail
file, preserving both prior files on any download, parsing, or validation failure.

## BEA saving-rate distribution

The annual income-decile dataset comes from BEA and BLS's ongoing **Distribution
of Personal Saving** research project on BEA's
[Distribution of Personal Income](https://www.bea.gov/data/special-topics/distribution-of-personal-income)
page. The structured source is the `savings rates` worksheet in BEA's
[`joint_dist_summary.xlsx`](https://www.bea.gov/sites/default/files/2026-05/joint_dist_summary.xlsx)
workbook; the accompanying
[read-me](https://www.bea.gov/sites/default/files/2026-04/readme_for_summary_file.pdf)
defines the fields, and the
[technical document](https://www.bea.gov/sites/default/files/2026-04/technical_document_personal_saving.pdf)
documents the joint DPI/PCE method. This source is separate from NIPA Table
2.10 and the newer personal-income nowcast: the saving workbook currently has
final annual estimates for 2000–2023 and no provisional or experimental saving
observations.

BEA directly publishes the rate for each decile of equivalized disposable
personal income. The source values are ratios (for example, `-1.342`); ingestion
multiplies them by 100 to store percentage units (`-134.2`). This matches BEA's
definition: a group's share of total personal saving divided by its share of
total disposable personal income. The application does not reconstruct the rate
when that direct field is present. A negative rate means estimated personal
outlays exceeded disposable personal income for the group, not that every
household in it dissaved.

`npm run data:refresh` runs the BEA update after all FRED updates. The narrower
`npm run data:refresh-saving-distribution` command requires no API key and may be
used independently. Both download the workbook; verify the worksheet and exact
`Year`, `0-10%` through `90-100%` columns; reject duplicate or unordered years,
nonnumeric values, unexpected units, ranking, deciles, or statuses; preserve
`N/A` as null; and atomically replace
`src/features/economic-series/data/saving-rate-by-income-decile.json` only after
the complete 10-decile dataset validates. No interpolation or carry-forward is
permitted. A failed download, parse, or validation leaves the previous committed
file untouched. Output is deterministic apart from the explicit retrieval date,
and the command reports coverage, observation count, and included status labels.

BEA describes this as an ongoing research project rather than a fixed scheduled
release. Check the source page when BEA updates the workbook, run the narrow
refresh, verify the reported latest year and representative bottom, middle, and
upper-decile values, then commit the validated JSON. If BEA adds provisional or
experimental saving estimates, update the year-status mapping only after the
release metadata identifies those years; the data model and UI already expose
those labels. Do not apply the provisional personal-income or experimental
nowcast labels to saving-rate years that are absent from this workbook.

The two LMCI outputs contain 414 monthly observations from January 1992 through June 2026 and were retrieved July 20, 2026. They remain raw standardized, seasonally adjusted indexes; percentile ranks are derived at briefing interpretation time from each output's full committed finite history. Source: Federal Reserve Bank of Kansas City, Labor Market Conditions Indicators. Required citation: Hakkio, Craig S., and Jonathan L. Willis. 2014. “Kansas City Fed’s Labor Market Conditions Indicators (LMCI).” Federal Reserve Bank of Kansas City, *The Macro Bulletin*, August 28. FRED series pages: [`FRBKCLMCILA`](https://fred.stlouisfed.org/series/FRBKCLMCILA) and [`FRBKCLMCIM`](https://fred.stlouisfed.org/series/FRBKCLMCIM).

## CPI derivations and reuse

`CPIAUCNS`, `CPIAUCSL`, and `CPILFESL` are fetched once each as monthly index levels. Headline year-over-year inflation uses `CPIAUCNS` and `((P_t / P_t-12) - 1) × 100`, matching BLS's standard unadjusted 12-month CPI-U All Items measure. Headline three-month annualized momentum uses seasonally adjusted `CPIAUCSL`; core year-over-year and momentum use seasonally adjusted `CPILFESL`. Three-month annualized inflation is `((P_t / P_t-3)^4 - 1) × 100`, not a three-month change multiplied by four. Every calculation uses exact calendar dates. A missing endpoint, null value, or internal month in the four-month momentum window produces `null`; gaps are not bridged and no result is rounded before serialization.

The recent-inflation card also derives a conditional ordinary 12-month rate three months ahead. It calculates the exact SA growth factor `CPIAUCSL_t / CPIAUCSL_t-3`, applies that factor once to `CPIAUCNS_t`, and compares the conditional endpoint with the exact NSA base at `t-9`. This is a three-month mechanical scenario, not a forecast. If—and only if—the required NSA base is one explicit isolated missing observation bracketed by valid adjacent `CPIAUCNS` months, the scenario uses `sqrt(previous × next)` as a geometric bridge and records both source months in its model. Unbracketed or consecutive gaps leave the scenario unavailable. Interpolation is never written into official CPI observations or reused by the headline card, tables, wages, drivers, or other calculations.

One grouped derivation produces the headline and core rate files plus `headline-cpi-index-not-seasonally-adjusted.json` and `headline-cpi-index-seasonally-adjusted.json`. The two level files preserve official source values—including the missing October 2025 observation—so the browser can reproduce the conditional calculation from exact inputs. Every output validates before replacement and uses rollback-protected grouped writes, so a failed source, derivation, validation, or replacement preserves the whole CPI group. The refresh also retains the in-memory `CPIAUCSL` 12-month result for real-wage derivation: pairing seasonally adjusted wages with seasonally adjusted CPI avoids mixing adjustment conventions, while the user-facing headline remains the BLS-style NSA measure. Refresh reporting identifies all three source counts, generated ranges, and grouped output paths.

Headline PCE uses the shared exact-month year-over-year derivation independently: `((P_t / P_t-12) - 1) × 100`. It does not use array position, bridge missing months, carry CPI or PCE observations forward, or round before serialization. The committed PCE output contains 797 observations from January 1960 through May 2026 and was retrieved July 23, 2026. Its latest unrounded value is 4.072638075644863%. The expanded comparison aligns CPI and PCE only at presentation time and preserves each series’ actual latest month.

The inflation-drivers supporting rates use unadjusted U.S.-city-average CPI-U indexes downloaded from the official BLS Public Data API. Run `npm run data:ingest-category-cpi -- --input <bls-response.json> --output-dir src/features/economic-series/data --retrieved-at YYYY-MM-DD` after requesting `CUUR0000SAH1`, `CUUR0000SA0E`, and `CUUR0000SAF1` with at least the preceding comparison year. The importer validates exact IDs and 61 monthly endpoints, derives `((P_t / P_t-12) - 1) × 100` by calendar month, preserves absent months as null, validates all three outputs, and replaces them as one rollback-protected group. The current files cover June 2021–June 2026; October 2025 is null because the underlying BLS monthly indexes were not published during the appropriations lapse. These category-rate files are separate from, and do not replace, the valid release-vintage contribution-history dataset.

The real-GDP-per-capita, productivity-growth, and real-business-investment configurations use the explicit `year-over-year-quarterly-growth` local derivation. For each source level at quarter `t`, the application looks up the exact calendar date one year earlier and calculates `((level_t / level_t-4 quarters) - 1) × 100`. It never substitutes by array position. Missing current or prior levels and missing calendar quarters yield `null`; leading unavailable results are omitted and internal gaps are retained. OPHNFB is fetched once; its published level and derived growth validate and replace as one rollback-protected group. Range normalization is presentation-only and is never persisted.

PNFIC1's usable seasonally adjusted real levels begin in 2007 Q1. The refresh retains those provider levels for compact tooltip details and writes exact-quarter growth observations beginning in 2008 Q1. Maximum displays that full available derived history; the application does not reconstruct an earlier investment level or growth series. The implementation review found longer nominal, annual, and non-seasonally-adjusted series, but none was definitionally compatible with this quarterly real seasonally adjusted measure, so they are not spliced into the comparison. TCU is stored directly as a monthly percentage level without a local transformation.

FRED publishes PAYEMS in thousands of persons, seasonally adjusted. Full source retrieval inherently supplies the warm-up observations needed for derivation. The application keeps derived values in thousands of jobs: monthly change is the current level minus the prior consecutive month's level, and the three-month average is the arithmetic mean of the current and two prior consecutive monthly changes. The supporting series begins with the first valid difference; the primary series begins with the first valid three-change window. Missing values or calendar gaps produce `null`; they are never treated as zero or bridged. Duplicate dates are rejected.

The payroll compact interpretation keeps the persisted three-month average as its headline. It classifies full-precision averages from −50K through +50K per month as `nearly-stalled`, values below that range as `contracting`, and larger positive values as `growing` or `growing-strongly` according to the separate trailing-25-year historical state. The latest monthly change is mentioned only for sign divergence with the aligned three-month trend; same-sign large-deviation detection is intentionally deferred pending a defensible calibration rule. Direction compares the latest three months with the immediately preceding non-overlapping three months: differences below 50K per month in absolute value are stable, differences of −50K or less are slowing, and differences of +50K or more are accelerating. Missing or misaligned inputs remain unavailable. Refreshes retain only the latest revised PAYEMS history, not release vintages, so the application cannot calculate published revisions.

PAYEMS is fetched and provider-validated once. One explicit derivation module creates the monthly-change supporting series and the three-month-average primary series. Both use the existing domain model and identify PAYEMS as the source while stating that their transformations are calculated by the application.

## Estimated breakeven employment growth

The authoritative breakeven source is the Federal Reserve Board FEDS Note
“Labor force growth, breakeven employment, and potential GDP growth,” published
April 2, 2026. Its official accessible Figure 2 table publishes 268 quarterly
estimates from 1960 Q1 through 2026 Q4. Each value is a monthly job-growth pace
in thousands, not a quarterly total. The committed date is the first day of the
quarter-ending month, so `2026-06-01` represents 2026 Q2. The source’s 2026
values are projections and retain that status in the data model.
This is a publication-vintage research table, not a regularly scheduled monthly
series: the Board gives no fixed update cadence, so refreshes can only capture
changes when the official page itself is revised or superseded.

The Federal Reserve method defines breakeven growth as the change in potential
labor force multiplied by one minus CBO’s noncyclical unemployment rate. It
uses a 13-month centered average of the civilian noninstitutional population
and a 5-quarter centered average of the quarterly breakeven estimate. The
baseline is therefore modeled and revision-prone, particularly when population,
immigration, potential participation, or CBO assumptions change. It is not an
observed payroll threshold or a forecast produced by this application.
The source does not identify a historical methodology break in the published
1960–2025 estimates, but its population inputs splice harmonized estimates
through 2024 to BLS data for 2025, and the separately labeled 2026 projection
incorporates newer population and immigration assumptions.

Comparison observations align only at exact quarter-ending PAYEMS months. No
breakeven value is filled into the intervening months. Actual average monthly
job growth is `(PAYEMS_t − PAYEMS_t-3) / 3`, which is algebraically identical to
averaging the three consecutive monthly changes. All four monthly levels in
that window must be present and finite so each constituent change is valid.
The annualized actual rate is
`((PAYEMS_t / PAYEMS_t-3)^4 − 1) × 100`. The estimated rate applies three months
of the published monthly breakeven pace to that same starting PAYEMS
denominator and annualizes with the identical formula. The stored
percentage-point gap is the full-precision actual annualized rate minus the
estimated annualized rate; rounding occurs only in presentation.

The source dataset contains all 268 published estimates. The comparison dataset
contains 266 available exact-quarter comparisons from 1960 Q1 through 2026 Q2
and explicit unavailable records for the 2026 Q3 and Q4 projections because
PAYEMS observations for those periods do not yet exist. Each available record
retains both PAYEMS levels, actual and estimated monthly counts, their count
difference, both annualized rates, and the percentage-point gap. Published
benchmarks include 84.124763 thousand in 1960 Q1, 49.207317 thousand in 2020 Q4,
and a projected 20.29385 thousand in 2026 Q2.

`CES0500000003`, the BLS average-hourly-earnings series for all private nonfarm employees, is fetched once using the full-history policy. It is monthly and seasonally adjusted, covers wages rather than benefits, and begins in March 2006. `CPIAUCSL` is not fetched again: wage derivation reuses the full-precision seasonally adjusted CPI-U result produced internally during the CPI refresh and persists its year-over-year form for the expanded comparison. This CPI input is deliberately distinct from the NSA `CPIAUCNS` headline card. Wage levels require an observation at the exact calendar month one year earlier. Nominal growth is `(current wage / prior-year wage - 1) × 100`. Exact real growth is `((wage_t / wage_t-12) / (CPI_t / CPI_t-12) - 1) × 100`; it is not nominal growth minus inflation. Missing or mismatched months produce `null`; array positions are never substituted for calendar alignment.

The nominal and real wage outputs are validated and staged together, then replaced through the existing rollback-protected grouped writer. Failure preserves both prior wage files without rolling back unrelated successful sources. Successful reporting includes the `CES0500000003` source count and both generated ranges.

### Long-run worker purchasing-power foundation

The normal daily `npm run data:refresh` path fetches the full monthly histories
of `AHETPI` and `CWSR0000SA0` from FRED. `AHETPI` is BLS
`CES0500000008`, Average Hourly Earnings of Production and Nonsupervisory
Employees, Total Private: dollars per hour, seasonally adjusted, beginning
January 1964. This worker population covers production employees in
goods-producing industries and nonsupervisory employees in private
service-providing industries—roughly four-fifths of private nonfarm payroll
employment. `CWSR0000SA0` is the seasonally adjusted monthly CPI-W All Items
index (1982–84 = 100). CPI-W follows the BLS Real Earnings convention for this
worker population; neither input replaces the all-private/CPI-U pair used by the
visible short-term real-wage card.

The refresh atomically validates and writes both source-level files plus
`real-hourly-purchasing-power.json` and the 4-, 10-, and 20-year change files.
For an exact shared calendar month, the real level is `AHETPI / CWSR0000SA0`.
For `N` equal to 48, 120, or 240 months, the rolling value is
`((realLevel_t / realLevel_t-N) - 1) × 100`. Calculations retain full floating-
point precision. Dates are sorted and joined by exact month; missing, nonfinite,
or nonpositive inputs remain unavailable, and a missing exact base month does
not select a neighbor. No interpolation, forward fill, rounding, or population
splice occurs.

The committed August 20 refresh contains 751 aligned real-level observations
from January 1964 through July 2026. Exact-lookback histories begin January
1968 (703 4-year observations), January 1974 (631 10-year observations), and
January 1984 (511 20-year observations), all through July 2026. The derived
latest month is always the latest month with both valid inputs. If FRED advances
one component first, the prior common month remains the latest derived result;
the grouped write and next daily check prevent a mixed-period value.

The verification standard is reproducibility from the documented published wage and CPI component series using the exact multiplicative formula. Verification compares the derived result with BLS's official published real-earnings change as a diagnostic, not an equality requirement, and documents any small rounding-level discrepancy. Because BLS may calculate its official change from higher-precision underlying estimates, the dashboard can occasionally differ from the published BLS figure by 0.1 percentage point after rounding. The implementation must not substitute nominal wage growth minus inflation or special-case a release to force agreement.

## Household derivations and writes

`A229RX0Q048SBEA` and `A794RX0Q048SBEA` use full quarterly history without `observation_start` or a FRED `units` transformation. Income and spending growth are calculated as `((level_t / level_t-4 quarters) - 1) × 100` using the exact calendar quarter one year earlier. Missing endpoints produce `null`, leading warm-up values are omitted, and presentation aligns only shared calendar quarters. Both generated files validate and replace as one rollback-protected group. The obsolete monthly `A229RX0` and aggregate `PCEC96` paths were removed; a monthly detail view remains deferred rather than hidden current infrastructure. PSAVERT remains an independent monthly provider level.

Income and spending validate and replace as one rollback-protected group, so either failure preserves both prior files. The published PSAVERT level validates and writes independently. Unrelated refresh successes remain intact, and the command reports each generated count, range, latest value, and output path.

`TDSP` uses the direct provider-level path with full history, quarterly frequency, and no FRED units transformation. FRED currently returns leading unavailable observations before the published series begins; normalization omits those leading values and retains the 85 usable quarterly levels from 2005 Q1 through 2026 Q1. Internal missing values would remain `null`. The file is validated and atomically replaced independently, so a TDSP failure preserves its prior valid dataset without rolling back other sources.

`A019RE1Q156NBEA` preserves the provider-published signed trade balance as a share of GDP. Negative values mean a deficit and positive values mean a surplus. The tariff workflow aligns customs duties and goods imports by exact calendar quarter and calculates `(customs duties / goods imports) × 100` without rounding stored values. Missing inputs or nonpositive import denominators produce `null`; leading unavailable ratios are omitted. The validated two-source output is replaced through the grouped rollback-protected writer, so either-source or write failure preserves the prior tariff dataset.

Trade component context uses quarterly BEA seasonally adjusted annual-rate levels from FRED: goods exports (`A253RC1Q027SBEA`), goods imports (`A255RC1Q027SBEA`), services exports (`A646RC1Q027SBEA`), and services imports (`B656RC1Q027SBEA`). Exact-quarter presentation derives signed goods and services balances as exports minus imports and derives the total as their sum; exports and imports totals are the corresponding component sums. Null or missing inputs keep that quarter unavailable. The compact total-balance chart retains `A019RE1Q156NBEA`, transforms the active deficit or surplus to a positive magnitude, and calculates historical bands only from quarters with the same signed state. Each committed component remains a standard rollback-protected FRED refresh target, so a failed source refresh preserves its prior valid file.

`HOUST` uses the same direct provider-level path with full monthly history and no FRED units transformation. Values remain thousands of housing units at a seasonally adjusted annual rate.

`IPMAN` and `MANEMP` use independent direct provider-level paths with full monthly histories and no FRED units transformations. Each validates and atomically replaces only its own native source file; no aligned or normalized comparison dataset is written.

HOAM is the first non-FRED refresh path. It downloads the official national XLSX, identifies the exact `Month` and `Annual Payment Share of Income` headers, converts the published ratio to percent, preserves internal missing observations, filters future rows, sorts, rejects duplicates or schema changes, validates minimum usable history, and atomically replaces only the affordability dataset. The committed output contains only national published observations and provenance—not workbook vendor inputs, metro data, or county data.

## Validation and normalization

The client checks the HTTP status and parses the response as untrusted JSON. It rejects provider error payloads, missing observation arrays, invalid dates, and values other than numeric strings or FRED's `.` missing marker.

Normalization converts numeric strings to numbers and `.` to `null`, sorts observations chronologically without mutating the provider response, removes observations dated after retrieval, and requires enough usable history for the configured frequency. It constructs complete `EconomicSeries` metadata and passes the result through the same domain validator used by the application.

Leading unavailable values are removed so generated growth files begin with a valid derived observation. Internal missing observations remain `null`. Current generated coverage is:

- GDPC1: 313 observations, 1948 Q1–2026 Q1.
- CPIAUCNS source: generated headline year-over-year has 1,351 observations, January 1914–July 2026; latest unrounded value is 3.364825041479902% (displayed as 3.4%).
- CPIAUCSL source: generated headline momentum has 952 observations, April 1947–July 2026; its 943-observation 12-month result (January 1948–July 2026) is persisted for seasonally adjusted real-wage derivation and comparison.
- CPILFESL source: generated core year-over-year has 823 observations, January 1958–July 2026; generated momentum has 832 observations, April 1957–July 2026.
- UNRATE: 942 observations, January 1948–June 2026.
- LNS12300060: 942 observations, January 1948–June 2026.
- JTSLDR: 306 observations, December 2000–May 2026.
- PAYEMS monthly change: 1,049 observations, February 1939–June 2026.
- PAYEMS three-month average: 1,047 observations, April 1939–June 2026.
- Federal Reserve estimated breakeven employment growth: 268 quarterly monthly-pace estimates, 1960 Q1–2026 Q4; 2026 observations are source projections.
- Job-growth-versus-breakeven comparison: 268 exact-quarter records, with 266 available comparisons through 2026 Q2 and two explicit future-period unavailable records.
- ICSA: 3,106 weekly observations, January 7, 1967–July 11, 2026.
- IC4WSA: 3,103 weekly observations, January 28, 1967–July 11, 2026; this defines the relationship card's full shared coverage.
- `CES0500000003` nominal wage growth: 233 observations, March 2007–July 2026; July growth is 3.153276665752669% from the public FRED levels.
- `CES0500000003`/`CPIAUCSL` exact real wage growth: 233 aligned observations, March 2007–July 2026; July is -0.1457635665407575% and displays as -0.1%.
- `AHETPI` and `CWSR0000SA0` long-run purchasing power: 751 exact-month real-level observations, January 1964–July 2026; rolling 4-/10-/20-year histories contain 703/631/511 observations beginning January 1968/1974/1984.
- A939RX0Q048SBEA source: 317 level observations, 1947 Q1–2026 Q1; generated growth: 313 observations, 1948 Q1–2026 Q1.
- OPHNFB source and level output: 317 index observations, 1947 Q1–2026 Q1; generated growth: 313 observations, 1948 Q1–2026 Q1.
- A229RX0Q048SBEA source: 317 level observations; generated growth: 313 observations, 1948 Q1–2026 Q1.
- A794RX0Q048SBEA source: 317 level observations; generated growth: 313 observations, 1948 Q1–2026 Q1.
- PSAVERT: 809 observations, January 1959–May 2026.
- TDSP source: 185 observations including leading unavailable values; generated level: 85 observations, 2005 Q1–2026 Q1.
- Atlanta Fed HOAM: 255 observations, January 2005–March 2026.
- HOUST: 810 observations, January 1959–June 2026.
- IPMAN: 654 observations, January 1972–June 2026.
- MANEMP: 1,050 observations, January 1939–June 2026.
- PNFIC1 source: 77 usable level observations, 2007 Q1–2026 Q1; generated growth: 73 observations, 2008 Q1–2026 Q1.
- CPATAX: 317 usable quarterly observations, 1947 Q1–2026 Q1; nominal GDP: 317 observations over the same useful coverage; generated profit share: 317 exact-quarter observations, 1947 Q1–2026 Q1.
- TCU: 714 observations, January 1967–June 2026.
- FEDFUNDS: 864 observations, July 1954–June 2026.
- GS10: 879 observations, April 1953–June 2026; exact shared rate coverage begins July 1954.
- NFCICREDIT: 2,897 weekly observations, January 8, 1971–July 10, 2026.
- DRTSCILM: 145 quarterly observations, 1990 Q2–2026 Q2.
- FYFSGDA188S: 97 annual observations, 1929–2025.
- FYGFGDQ188S: 225 quarterly observations, 1970 Q1–2026 Q1.
- A019RE1Q156NBEA: 317 quarterly observations, 1947 Q1–2026 Q1.
- B235RC1Q027SBEA/A255RC1Q027SBEA effective tariff burden: 269 derived quarterly observations, 1959 Q1–2026 Q1.

## Safe replacement and failures

Only fully retrieved, normalized, domain-validated, and serialized series reach the writer. Direct series use one temporary file and atomic rename. CPI, payroll, wage, household comparison, corporate profit-share, and effective-tariff outputs are validated and staged through the grouped writer; existing files are backed up during replacement and restored if grouped replacement fails. Temporary and backup files are removed where practical.

A missing key, network failure, HTTP error, malformed response, insufficient history, validation failure, or write failure leaves that series’ previous dataset intact. Errors are concise and never include the API key or a full provider response.

The breakeven refresh follows the same preservation rule as one two-file unit:
both downloads and both runtime models validate before any target is replaced.
Temporary files and backups protect the pair during replacement; a failure
before or during the grouped write restores or retains both prior files.

Failure of one source does not stop the next or roll back an unrelated successful file. Each single-source quarterly derivation replaces only its own validated output. CPI, PAYEMS, wage, household comparison, corporate profit-share, and effective-tariff failures preserve their complete output groups. After all entries run, any failure produces a nonzero exit status and the command identifies which outputs updated and which were preserved.

## Manual refresh

1. Obtain a key from the [FRED API documentation](https://fred.stlouisfed.org/docs/api/api_key.html).
2. Add `FRED_API_KEY=...` to an untracked `.env` file or export it in the current shell.
3. Run `npm run data:refresh`.
4. Review the printed provider identifier, source count, generated count, transformation, generated range, latest observation, and output path. CPI reports all source counts and grouped rate/index outputs; quarterly derivatives, PAYEMS, wages, and the household comparison report their supporting counts and grouped paths as applicable.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
6. Inspect and commit the generated JSON with the refresh code or data-update commit.

The breakeven pair has its own no-key refresh:

1. Run `npm run data:refresh-job-growth-breakeven`.
2. Confirm the reported latest available period and inspect the two generated
   files, especially estimate/projection status and unavailable future periods.
3. Run the repository checks and commit both outputs together with any refresh
   implementation change.

## Automatic refresh and deployment

GitHub Actions runs [the coordinated refresh and Pages workflow](../.github/workflows/refresh-and-deploy.yml)
daily at **09:17 UTC** (`17 9 * * *`). The non-round minute avoids the busiest
top-of-hour scheduling window. `workflow_dispatch` also supports manual runs.

The workflow receives `FRED_API_KEY` only from the repository's encrypted
Actions secret. Create or replace that secret through the GitHub CLI's secure
interactive input:

```bash
gh secret set FRED_API_KEY --repo akiryk/economy-dashboard
```

Do not include the value in a command, workflow file, log, commit, or document.
The browser application never receives the key.

For each scheduled or manual run, the workflow:

1. checks out `main`, restores the npm dependency cache, and runs `npm ci`;
2. runs `npm run data:refresh` with the secret available only to that step, then
   runs the credential-free OECD international refresh as a separate visible
   diagnostic;
3. restores files whose only difference is `retrievedAt`, so an unchanged
   provider dataset does not create a daily metadata-only commit;
4. rejects tracked or untracked refresh output outside
   `src/features/economic-series/data/*.json`;
5. runs lint, typecheck, all tests, the Pages-aware production build, and
   `git diff --check`;
6. commits and pushes only validated dataset JSON when substantive data changed;
7. uploads that validated build and deploys it directly in the same workflow.

The automation commit is `chore(data): automated economic data refresh` and is
authored by `github-actions[bot]`. The workflow uses the repository-scoped
`GITHUB_TOKEN`; it does not require or use a personal access token. Keeping the
commit and deployment in one workflow avoids relying on an automation push to
trigger a second workflow.

If no substantive tracked data changes, a normal run completes successfully
without committing, uploading an artifact, or deploying. A manual operator can
deploy the current validated data and code explicitly:

```bash
gh workflow run refresh-and-deploy.yml --ref main -f deploy_current=true
```

Concurrency is serialized without cancelling an in-progress refresh or
deployment. If refresh, scope validation, verification, build, push, artifact
upload, or deployment fails, later steps do not deploy and the existing Pages
site remains untouched. Each job writes a summary containing its result,
whether data changed, the deployment commit, deployed URL, and newest dataset
date when available.

Repository completion work follows a push-through-deployment rule. After a code
push, the exact commit's `refresh-and-deploy.yml` run is monitored until both the
build and Pages deployment jobs succeed. A failure is investigated from the job
logs and corrected with a verified follow-up commit; it is not silently left for
the next push. Workflow reruns are reserved for failures that are clearly caused
by transient GitHub or network infrastructure rather than by repository code,
tests, data, build configuration, or deployment configuration. An external blocker
that cannot be fixed in the repository must be reported with the failed run, root
cause, and required operator action.

Production is served at
[`https://akiryk.github.io/economy-dashboard/`](https://akiryk.github.io/economy-dashboard/).
The deployed
[`deployment-metadata.json`](https://akiryk.github.io/economy-dashboard/deployment-metadata.json)
reports the exact `deploymentCommit` and the newest deployed dataset
`latestDatasetDate`. The application also shows each individual dataset's
retrieval date under the relevant card's Series details disclosure.

## OECD international comparisons

`npm run data:refresh-international` requests five narrow, version-pinned CSV
datasets from the official OECD Data Explorer SDMX API: prime-age employment,
harmonized unemployment, headline CPI/HICP inflation, year-over-year real GDP
growth, and long-term government bond yields. Exact dataflows, dimensions,
units, adjustment conventions, coverage, and product decisions are recorded in
[`international-comparison-registry.md`](international-comparison-registry.md).
No credential is required, and the browser never contacts OECD.

The parser verifies the dataflow identity and every selected semantic dimension,
normalizes ISO country codes and actual observation periods, rejects duplicates,
invalid values, unexpected units, missing current U.S. data, or coverage below
8 of 10 peers, and replaces
`src/features/economic-series/data/international-comparisons.json` only after
the complete five-metric snapshot validates. Monthly observations may trail the
newest peer by at most three periods; quarterly observations may trail by at
most two. Older observations remain stored but are exposed as stale rather than
used in current rankings.

Timeouts, HTTP 429, and 5xx responses receive three bounded attempts. A 4xx,
changed schema, or invalid semantic code fails immediately. Every failure leaves
the last-known-good artifact untouched. The scheduled workflow runs this step
with `continue-on-error` so OECD access problems are visible in its diagnostics
but do not prevent unrelated FRED/BLS/BEA updates from being validated and
deployed. A successful OECD refresh participates in the same dataset-only scope,
verification, commit, and Pages deployment path.

## Future series

Another FRED series would need one reviewed configuration entry, accurate metadata and minimum history, deterministic fixtures, an output file, registration in the local repository, and presentation copy. Shared transport, normalization, and atomic-writing utilities can be reused, but provider-specific decisions should remain explicit.
