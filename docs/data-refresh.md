# Economic data refresh

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
- Unemployment rate (`UNRATE`, monthly), written to `unemployment-rate.json`.
- Prime-age employment-to-population ratio (`LNS12300060`, monthly), written to `prime-age-employment-ratio.json`.
- Payroll growth (`PAYEMS`, monthly source level), derived into `monthly-payroll-change.json` and `payroll-growth.json`.
- Wages versus inflation (`AHETPI` plus the existing `CPIAUCSL` result), derived into `nominal-wage-growth.json` and `real-wage-growth.json`.
- Real disposable income per capita and real consumer spending per capita (`A229RX0Q048SBEA` and `A794RX0Q048SBEA`, quarterly source levels), derived into quarterly per-capita growth outputs.
- Personal saving rate (`PSAVERT`, monthly), written to `personal-saving-rate.json`.
- Household debt-service ratio (`TDSP`, quarterly), written as the provider-published level to `household-debt-service-ratio.json`.
- Housing starts (`HOUST`, monthly), written as the provider-published level to `housing-starts.json`.
- Manufacturing output (`IPMAN`, monthly), written as the provider-published index to `manufacturing-output.json`.
- Manufacturing employment (`MANEMP`, monthly), written as the provider-published level in thousands to `manufacturing-employment.json`.
- Real business investment (`PNFIC1`, quarterly source level), derived into exact-quarter year-over-year growth in `real-business-investment-growth.json`.
- Industrial capacity utilization (`TCU`, monthly), written as the provider-published percentage level to `industrial-capacity-utilization.json`.
- Effective federal funds rate and 10-year Treasury yield (`FEDFUNDS` and `GS10`, monthly), written as separate provider-published percentage levels and aligned only for presentation.
- Broad credit conditions (`NFCICREDIT`, weekly), written as the provider-published standardized index to `broad-credit-conditions.json`.

The narrow `scripts/atlantaFed/hoamWorkbook.ts` path downloads the official national HOAM workbook and writes `home-ownership-cost-share.json`; it is intentionally separate from the FRED configuration list.

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
- Unemployment: `series_id=UNRATE` and `frequency=m`, with no `units` parameter.
- Prime-age employment: `series_id=LNS12300060` and `frequency=m`, with no `units` parameter.
- Payroll: `series_id=PAYEMS` and `frequency=m`, with no `units` parameter.
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
- Industrial capacity utilization: `series_id=TCU` and `frequency=m`, with no `units` parameter.
- Effective federal funds rate: `series_id=FEDFUNDS` and `frequency=m`, with no `units` parameter.
- 10-year Treasury yield: `series_id=GS10` and `frequency=m`, with no `units` parameter.
- Broad credit conditions: `series_id=NFCICREDIT` and `frequency=w`, with no `units` parameter.

Every current configuration uses `historyPolicy: { type: "full" }`. The client therefore omits `observation_start` and lets FRED return the full available source history. The explicit policy keeps request behavior reviewable and supports a future dated policy without scattering date exceptions through the client.

The optional `fredUnits` configuration field emits `units=pc1` only for GDP. Omitting it preserves provider-published levels for CPI, unemployment, prime-age employment, real GDP per capita, labor productivity, payroll, wages, real disposable income per capita, real consumer spending, personal saving, household debt service, housing starts, manufacturing output, manufacturing employment, real business investment, and industrial capacity utilization. Domain transformation metadata separately records provider values and local calculations.

## CPI derivations and reuse

`CPIAUCSL` and `CPILFESL` are each fetched exactly once as seasonally adjusted monthly index levels. For each source, year-over-year inflation is `((P_t / P_t-12) - 1) × 100`, and three-month annualized inflation is `((P_t / P_t-3)^4 - 1) × 100`. The latter is an exact ratio calculation, not a three-month change multiplied by four. Both calculations look up exact calendar dates. A missing endpoint, null value, or internal month in the four-month momentum window produces `null`; gaps are not bridged and no result is rounded before serialization.

One grouped derivation produces `headline-cpi-inflation.json`, `core-cpi-inflation.json`, `headline-cpi-three-month-annualized.json`, and `core-cpi-three-month-annualized.json`. All four validate before replacement and use rollback-protected grouped writes, so a failed source, derivation, validation, or replacement preserves every prior CPI file. After the group succeeds, the in-memory headline year-over-year result is reused for real-wage derivation without another `CPIAUCSL` request. Refresh reporting identifies both source counts, all four generated ranges, and all grouped output paths.

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
- AHETPI nominal wage growth: 738 observations, January 1965–June 2026.
- AHETPI/CPI exact real wage growth: 737 aligned observations, January 1965–May 2026.
- A939RX0Q048SBEA source: 317 level observations, 1947 Q1–2026 Q1; generated growth: 313 observations, 1948 Q1–2026 Q1.
- OPHNFB source and level output: 317 index observations, 1947 Q1–2026 Q1; generated growth: 313 observations, 1948 Q1–2026 Q1.
- A229RX0Q048SBEA source: 317 level observations; generated growth: 313 observations, 1948 Q1–2026 Q1.
- A794RX0Q048SBEA source: 317 level observations; generated growth: 313 observations, 1948 Q1–2026 Q1.
- PSAVERT: 809 observations, January 1959–May 2026.
- TDSP source: 185 observations including leading unavailable values; generated level: 85 observations, 2005 Q1–2026 Q1.
- Atlanta Fed HOAM: 255 observations, January 2005–March 2026.
- HOUST: 809 observations, January 1959–May 2026.
- IPMAN: 653 observations, January 1972–May 2026.
- MANEMP: 1,050 observations, January 1939–June 2026.
- PNFIC1 source: 77 usable level observations, 2007 Q1–2026 Q1; generated growth: 73 observations, 2008 Q1–2026 Q1.
- TCU: 713 observations, January 1967–May 2026.
- FEDFUNDS: 864 observations, July 1954–June 2026.
- GS10: 879 observations, April 1953–June 2026; exact shared rate coverage begins July 1954.
- NFCICREDIT: 2,897 weekly observations, January 8, 1971–July 10, 2026.

## Safe replacement and failures

Only fully retrieved, normalized, domain-validated, and serialized series reach the writer. Direct series use one temporary file and atomic rename. CPI, payroll, wage, and household comparison outputs are validated and staged as explicit groups; existing files are backed up during replacement and restored if grouped replacement fails. Temporary and backup files are removed where practical.

A missing key, network failure, HTTP error, malformed response, insufficient history, validation failure, or write failure leaves that series’ previous dataset intact. Errors are concise and never include the API key or a full provider response.

Failure of one source does not stop the next or roll back an unrelated successful file. Each single-source quarterly derivation replaces only its own validated output. CPI, PAYEMS, wage, and household comparison failures preserve their complete output groups. After all entries run, any failure produces a nonzero exit status and the command identifies which outputs updated and which were preserved.

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
