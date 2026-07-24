# Economic data refresh

This is the authoritative technical inventory for sources, transformations, generated coverage, and refresh behavior. For the shorter product-level explanation of what each visible card shows and why, see [`product-overview.md`](product-overview.md).

## Data flow

The refresh path is deliberately separate from the browser:

```text
FRED API or Atlanta Fed HOAM workbook -> Node refresh command -> validated domain JSON -> local repository -> React dashboard
```

The generated JSON is committed with the application, so the dashboard remains usable if FRED is unavailable. The browser never receives the API key and never contacts FRED.

## Supported-series configuration

`scripts/fred/seriesConfigurations.ts` contains an explicit list of supported series. Each entry defines its slug, output file, provider identifier, FRED and domain frequencies, observation start, transformation, minimum history, and domain metadata. The list currently contains:

- Real GDP growth (`GDPC1`, quarterly), written to `real-gdp-growth.json`.
- Real GDP per capita growth (`A939RX0Q048SBEA`, quarterly source level), derived into `real-gdp-per-capita-growth.json`.
- Labor productivity (`OPHNFB`, quarterly source index), fetched once and written as the published level plus locally derived year-over-year growth.
- Headline and core CPI (`CPIAUCSL` and `CPILFESL`, monthly index levels), derived into year-over-year and three-month annualized outputs.
- Headline PCE inflation (`PCEPI`, monthly index level), derived into exact 12-month year-over-year growth for the expanded CPI policy comparison.
- Unemployment rate (`UNRATE`, monthly), written to `unemployment-rate.json`.
- Prime-age employment-to-population ratio (`LNS12300060`, monthly), written to `prime-age-employment-ratio.json`.
- Initial unemployment claims and the official four-week average (`ICSA` and `IC4WSA`, weekly), written as separate provider-published levels and aligned only for presentation.
- Payroll growth (`PAYEMS`, monthly source level), derived into `monthly-payroll-change.json` and `payroll-growth.json`.
- Kansas City Fed Labor Market Conditions Indicators (`FRBKCLMCILA` activity and `FRBKCLMCIM` momentum, monthly), written as separate provider-published standardized indexes for briefing use.
- Wages versus inflation (`AHETPI` plus the existing `CPIAUCSL` result), derived into `nominal-wage-growth.json` and `real-wage-growth.json`.
- Real disposable income per capita and real consumer spending per capita (`A229RX0Q048SBEA` and `A794RX0Q048SBEA`, quarterly source levels), derived into quarterly per-capita growth outputs.
- Personal saving rate (`PSAVERT`, monthly), written to `personal-saving-rate.json`.
- Household debt-service ratio (`TDSP`, quarterly), written as the provider-published level to `household-debt-service-ratio.json`.
- Housing starts (`HOUST`, monthly), written as the provider-published level to `housing-starts.json`.
- Manufacturing output (`IPMAN`, monthly), written as the provider-published index to `manufacturing-output.json`.
- Manufacturing employment (`MANEMP`, monthly), written as the provider-published level in thousands to `manufacturing-employment.json`.
- Real business investment (`PNFIC1`, quarterly source level), derived into exact-quarter year-over-year growth in `real-business-investment-growth.json`.
- After-tax corporate profit share, derived by exact quarter from adjusted after-tax corporate profits (`CPATAX`) divided by nominal GDP (`GDP`) and written to `corporate-profit-share.json`.
- Industrial capacity utilization (`TCU`, monthly), written as the provider-published percentage level to `industrial-capacity-utilization.json`.
- Effective federal funds rate and 10-year Treasury yield (`FEDFUNDS` and `GS10`, monthly), written as separate provider-published percentage levels and aligned only for presentation.
- Broad credit conditions (`NFCICREDIT`, weekly), written as the provider-published standardized index to `broad-credit-conditions.json`.
- Bank lending standards (`DRTSCILM`, quarterly), written as the provider-published net percentage of domestic banks reporting tighter C&I standards for large and middle-market firms.
- Federal budget balance (`FYFSGDA188S`, annual) and federal debt held by the public (`FYGFGDQ188S`, quarterly), written as separate provider-published percent-of-GDP ratios.
- Trade balance as a share of GDP (`A019RE1Q156NBEA`, quarterly), written as the provider-published signed ratio.
- Effective tariff burden, derived from quarterly customs-duty receipts (`B235RC1Q027SBEA`) divided by goods imports (`A255RC1Q027SBEA`) and written to `effective-tariff-burden.json`.

The narrow `scripts/atlantaFed/hoamWorkbook.ts` path downloads the official national HOAM workbook and writes `home-ownership-cost-share.json`; it is intentionally separate from the FRED configuration list.

The inflation-contribution snapshot is also outside the FRED list. It records the
unadjusted 12-month “effect on All Items” values published directly in BLS CPI-U
news-release Table 7 for June 2025 and June 2026. The five displayed groups are
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
The resulting `inflation-contribution-history.json` contains 60 validated
release observations from June 2021 through June 2026 and the one explicit gap.
Residuals caused by BLS source rounding range from −0.050 to +0.048 percentage
point, within the declared 0.05-point tolerance. The existing two-observation UI
snapshot remains unchanged; Story 47 adds production history but no chart or
card behavior.
See
[`inflation-contribution-history-feasibility.md`](inflation-contribution-history-feasibility.md)
for the exact file inventory, commands, validation contract, and
release-vintage policy. No category percent-change column or component
inflation-rate series may be used as a proxy.

This is a small configuration boundary, not dynamic discovery or a plugin system.

`NFCICREDIT` is the approved broad-credit-stress measure. It provides a long, redistributable Chicago Fed history focused on credit conditions. It replaces the Epic's contemplated corporate credit spread because current ICE BofA FRED exposure is short and licensed, Moody's terms restrict redistribution and storage, and a high-yield-only spread would cover only speculative-grade borrowers. The overall NFCI is not used because the separate rate card already covers interest-rate conditions.

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
- Headline CPI: `series_id=CPIAUCSL` and `frequency=m`, with no `units` or `observation_start` parameter.
- Core CPI: `series_id=CPILFESL` and `frequency=m`, with no `units` or `observation_start` parameter.
- Headline PCE: `series_id=PCEPI` and `frequency=m`, with no `units` or `observation_start` parameter.
- Unemployment: `series_id=UNRATE` and `frequency=m`, with no `units` parameter.
- Prime-age employment: `series_id=LNS12300060` and `frequency=m`, with no `units` parameter.
- Initial unemployment claims: `series_id=ICSA` and `frequency=w`, with no `units` parameter.
- Official four-week average: `series_id=IC4WSA` and `frequency=w`, with no `units` parameter.
- Payroll: `series_id=PAYEMS` and `frequency=m`, with no `units` parameter.
- LMCI Activity and Momentum: `series_id=FRBKCLMCILA` and `series_id=FRBKCLMCIM`, each with `frequency=m` and no `units` parameter.
- Wages: `series_id=AHETPI` and `frequency=m`, with no `units` parameter.
- Real GDP per capita: `series_id=A939RX0Q048SBEA` and `frequency=q`, with no `units` parameter.
- Labor productivity: `series_id=OPHNFB` and `frequency=q`, with no `units` parameter.
- Real disposable income per capita: `series_id=A229RX0Q048SBEA` and `frequency=q`, with no `units` parameter.
- Real consumer spending per capita: `series_id=A794RX0Q048SBEA` and `frequency=q`, with no `units` parameter.
- Personal saving rate: `series_id=PSAVERT` and `frequency=m`, with no `units` parameter.
- Household debt-service ratio: `series_id=TDSP` and `frequency=q`, with no `units` parameter.
- Housing starts: `series_id=HOUST` and `frequency=m`, with no `units` parameter.
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

Every current configuration uses `historyPolicy: { type: "full" }`. The client therefore omits `observation_start` and lets FRED return the full available source history. The explicit policy keeps request behavior reviewable and supports a future dated policy without scattering date exceptions through the client.

The optional `fredUnits` configuration field emits `units=pc1` only for GDP. Omitting it preserves provider-published levels for CPI, PCE, unemployment, prime-age employment, LMCI, real GDP per capita, labor productivity, payroll, wages, real disposable income per capita, real consumer spending, personal saving, household debt service, housing starts, manufacturing output, manufacturing employment, real business investment, and industrial capacity utilization. Domain transformation metadata separately records provider values and local calculations.

The two LMCI outputs contain 414 monthly observations from January 1992 through June 2026 and were retrieved July 20, 2026. They remain raw standardized, seasonally adjusted indexes; percentile ranks are derived at briefing interpretation time from each output's full committed finite history. Source: Federal Reserve Bank of Kansas City, Labor Market Conditions Indicators. Required citation: Hakkio, Craig S., and Jonathan L. Willis. 2014. “Kansas City Fed’s Labor Market Conditions Indicators (LMCI).” Federal Reserve Bank of Kansas City, *The Macro Bulletin*, August 28. FRED series pages: [`FRBKCLMCILA`](https://fred.stlouisfed.org/series/FRBKCLMCILA) and [`FRBKCLMCIM`](https://fred.stlouisfed.org/series/FRBKCLMCIM).

## CPI derivations and reuse

`CPIAUCSL` and `CPILFESL` are each fetched exactly once as seasonally adjusted monthly index levels. For each source, year-over-year inflation is `((P_t / P_t-12) - 1) × 100`, and three-month annualized inflation is `((P_t / P_t-3)^4 - 1) × 100`. The latter is an exact ratio calculation, not a three-month change multiplied by four. Both calculations look up exact calendar dates. A missing endpoint, null value, or internal month in the four-month momentum window produces `null`; gaps are not bridged and no result is rounded before serialization.

One grouped derivation produces `headline-cpi-inflation.json`, `core-cpi-inflation.json`, `headline-cpi-three-month-annualized.json`, and `core-cpi-three-month-annualized.json`. All four validate before replacement and use rollback-protected grouped writes, so a failed source, derivation, validation, or replacement preserves every prior CPI file. After the group succeeds, the in-memory headline year-over-year result is reused for real-wage derivation without another `CPIAUCSL` request. Refresh reporting identifies both source counts, all four generated ranges, and all grouped output paths.

Headline PCE uses the shared exact-month year-over-year derivation independently: `((P_t / P_t-12) - 1) × 100`. It does not use array position, bridge missing months, carry CPI or PCE observations forward, or round before serialization. The committed PCE output contains 797 observations from January 1960 through May 2026 and was retrieved July 23, 2026. Its latest unrounded value is 4.072638075644863%. The expanded comparison aligns CPI and PCE only at presentation time and preserves each series’ actual latest month.

The real-GDP-per-capita, productivity-growth, and real-business-investment configurations use the explicit `year-over-year-quarterly-growth` local derivation. For each source level at quarter `t`, the application looks up the exact calendar date one year earlier and calculates `((level_t / level_t-4 quarters) - 1) × 100`. It never substitutes by array position. Missing current or prior levels and missing calendar quarters yield `null`; leading unavailable results are omitted and internal gaps are retained. OPHNFB is fetched once; its published level and derived growth validate and replace as one rollback-protected group. Range normalization is presentation-only and is never persisted.

PNFIC1 currently contains 317 returned quarterly rows, but its pre-2007 rows are unavailable markers rather than usable levels. The refresh validates the 77 usable source levels from 2007 Q1 through 2026 Q1 and writes 73 exact-quarter growth observations from 2008 Q1 through 2026 Q1. Maximum displays that full available derived history; the application does not reconstruct an earlier investment level or growth series. TCU is stored directly as a monthly percentage level without a local transformation.

FRED publishes PAYEMS in thousands of persons, seasonally adjusted. Full source retrieval inherently supplies the warm-up observations needed for derivation. The application keeps derived values in thousands of jobs: monthly change is the current level minus the prior consecutive month's level, and the three-month average is the arithmetic mean of the current and two prior consecutive monthly changes. The supporting series begins with the first valid difference; the primary series begins with the first valid three-change window. Missing values or calendar gaps produce `null`; they are never treated as zero or bridged. Duplicate dates are rejected.

PAYEMS is fetched and provider-validated once. One explicit derivation module creates the monthly-change supporting series and the three-month-average primary series. Both use the existing domain model and identify PAYEMS as the source while stating that their transformations are calculated by the application.

AHETPI is fetched once using the full-history policy. CPIAUCSL is not fetched again: wage derivation reuses the full-precision CPI inflation series produced earlier in the same refresh. Wage levels require an observation at the exact calendar month one year earlier. Nominal growth is `(current wage / prior-year wage - 1) × 100`. Exact real growth divides that wage ratio by `1 + CPI inflation / 100` before subtracting one and multiplying by 100. Missing or mismatched months produce `null`; array positions are never substituted for calendar alignment.

The nominal and real wage outputs are validated and staged together, then replaced through the existing rollback-protected grouped writer. Failure preserves both prior wage files without rolling back unrelated successful sources. Successful reporting includes the AHETPI source count and both generated ranges.

## Household derivations and writes

`A229RX0Q048SBEA` and `A794RX0Q048SBEA` use full quarterly history without `observation_start` or a FRED `units` transformation. Income and spending growth are calculated as `((level_t / level_t-4 quarters) - 1) × 100` using the exact calendar quarter one year earlier. Missing endpoints produce `null`, leading warm-up values are omitted, and presentation aligns only shared calendar quarters. Both generated files validate and replace as one rollback-protected group. The obsolete monthly `A229RX0` and aggregate `PCEC96` paths were removed; a monthly detail view remains deferred rather than hidden current infrastructure. PSAVERT remains an independent monthly provider level.

Income and spending validate and replace as one rollback-protected group, so either failure preserves both prior files. The published PSAVERT level validates and writes independently. Unrelated refresh successes remain intact, and the command reports each generated count, range, latest value, and output path.

`TDSP` uses the direct provider-level path with full history, quarterly frequency, and no FRED units transformation. FRED currently returns leading unavailable observations before the published series begins; normalization omits those leading values and retains the 85 usable quarterly levels from 2005 Q1 through 2026 Q1. Internal missing values would remain `null`. The file is validated and atomically replaced independently, so a TDSP failure preserves its prior valid dataset without rolling back other sources.

`A019RE1Q156NBEA` preserves the provider-published signed trade balance as a share of GDP. Negative values mean a deficit and positive values mean a surplus. The tariff workflow aligns customs duties and goods imports by exact calendar quarter and calculates `(customs duties / goods imports) × 100` without rounding stored values. Missing inputs or nonpositive import denominators produce `null`; leading unavailable ratios are omitted. The validated two-source output is replaced through the grouped rollback-protected writer, so either-source or write failure preserves the prior tariff dataset.

`HOUST` uses the same direct provider-level path with full monthly history and no FRED units transformation. Values remain thousands of housing units at a seasonally adjusted annual rate.

`IPMAN` and `MANEMP` use independent direct provider-level paths with full monthly histories and no FRED units transformations. Each validates and atomically replaces only its own native source file; no aligned or normalized comparison dataset is written.

HOAM is the first non-FRED refresh path. It downloads the official national XLSX, identifies the exact `Month` and `Annual Payment Share of Income` headers, converts the published ratio to percent, preserves internal missing observations, filters future rows, sorts, rejects duplicates or schema changes, validates minimum usable history, and atomically replaces only the affordability dataset. The committed output contains only national published observations and provenance—not workbook vendor inputs, metro data, or county data.

## Validation and normalization

The client checks the HTTP status and parses the response as untrusted JSON. It rejects provider error payloads, missing observation arrays, invalid dates, and values other than numeric strings or FRED's `.` missing marker.

Normalization converts numeric strings to numbers and `.` to `null`, sorts observations chronologically without mutating the provider response, removes observations dated after retrieval, and requires enough usable history for the configured frequency. It constructs complete `EconomicSeries` metadata and passes the result through the same domain validator used by the application.

Leading unavailable values are removed so generated growth files begin with a valid derived observation. Internal missing observations remain `null`. Current generated coverage is:

- GDPC1: 313 observations, 1948 Q1–2026 Q1.
- CPIAUCSL source: 954 index observations; generated year-over-year: 942 observations, January 1948–June 2026; generated momentum: 951 observations, April 1947–June 2026.
- CPILFESL source: 834 index observations; generated year-over-year: 822 observations, January 1958–June 2026; generated momentum: 831 observations, April 1957–June 2026.
- UNRATE: 942 observations, January 1948–June 2026.
- LNS12300060: 942 observations, January 1948–June 2026.
- PAYEMS monthly change: 1,049 observations, February 1939–June 2026.
- PAYEMS three-month average: 1,047 observations, April 1939–June 2026.
- ICSA: 3,106 weekly observations, January 7, 1967–July 11, 2026.
- IC4WSA: 3,103 weekly observations, January 28, 1967–July 11, 2026; this defines the relationship card's full shared coverage.
- AHETPI nominal wage growth: 738 observations, January 1965–June 2026.
- AHETPI/CPI exact real wage growth: 738 aligned observations, January 1965–June 2026.
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

Failure of one source does not stop the next or roll back an unrelated successful file. Each single-source quarterly derivation replaces only its own validated output. CPI, PAYEMS, wage, household comparison, corporate profit-share, and effective-tariff failures preserve their complete output groups. After all entries run, any failure produces a nonzero exit status and the command identifies which outputs updated and which were preserved.

## Manual refresh

1. Obtain a key from the [FRED API documentation](https://fred.stlouisfed.org/docs/api/api_key.html).
2. Add `FRED_API_KEY=...` to an untracked `.env` file or export it in the current shell.
3. Run `npm run data:refresh`.
4. Review the printed provider identifier, source count, generated count, transformation, generated range, latest observation, and output path. CPI reports both source counts and all four grouped outputs; quarterly derivatives, PAYEMS, wages, and the household comparison report their supporting counts and grouped paths as applicable.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
6. Inspect and commit the generated JSON with the refresh code or data-update commit.

The command currently runs only when a developer invokes it; no scheduler or runtime backend exists.

## Future series

Another FRED series would need one reviewed configuration entry, accurate metadata and minimum history, deterministic fixtures, an output file, registration in the local repository, and presentation copy. Shared transport, normalization, and atomic-writing utilities can be reused, but provider-specific decisions should remain explicit.
