# Economic data refresh

## Data flow

The refresh path is deliberately separate from the browser:

```text
FRED API -> Node refresh command -> validated domain JSON -> local repository -> React dashboard
```

The generated JSON is committed with the application, so the dashboard remains usable if FRED is unavailable. The browser never receives the API key and never contacts FRED.

## Supported-series configuration

`scripts/fred/seriesConfigurations.ts` contains an explicit list of supported series. Each entry defines its slug, output file, provider identifier, FRED and domain frequencies, observation start, transformation, minimum history, and domain metadata. The list currently contains:

- Real GDP growth (`GDPC1`, quarterly), written to `real-gdp-growth.json`.
- Headline CPI inflation (`CPIAUCSL`, monthly), written to `headline-cpi-inflation.json`.
- Unemployment rate (`UNRATE`, monthly), written to `unemployment-rate.json`.
- Prime-age employment-to-population ratio (`LNS12300060`, monthly), written to `prime-age-employment-ratio.json`.
- Payroll growth (`PAYEMS`, monthly source level), derived into `monthly-payroll-change.json` and `payroll-growth.json`.

This is a small configuration boundary, not dynamic discovery or a plugin system.

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
- CPI: `series_id=CPIAUCSL`, `frequency=m`, and `units=pc1`.
- Unemployment: `series_id=UNRATE` and `frequency=m`, with no `units` parameter.
- Prime-age employment: `series_id=LNS12300060` and `frequency=m`, with no `units` parameter.
- Payroll: `series_id=PAYEMS` and `frequency=m`, with no `units` parameter.

Every current configuration uses `historyPolicy: { type: "full" }`. The client therefore omits `observation_start` and lets FRED return the full available source history. The explicit policy keeps request behavior reviewable and supports a future dated policy without scattering date exceptions through the client.

The optional `fredUnits` configuration field emits `units=pc1` only for the two year-over-year growth series. Omitting it preserves the provider's published percent level. The domain `transformation` metadata separately records either `Percent change from year ago` or `Level`; the script does not recalculate or round either form.

FRED publishes PAYEMS in thousands of persons, seasonally adjusted. Full source retrieval inherently supplies the warm-up observations needed for derivation. The application keeps derived values in thousands of jobs: monthly change is the current level minus the prior consecutive month's level, and the three-month average is the arithmetic mean of the current and two prior consecutive monthly changes. The supporting series begins with the first valid difference; the primary series begins with the first valid three-change window. Missing values or calendar gaps produce `null`; they are never treated as zero or bridged. Duplicate dates are rejected.

PAYEMS is fetched and provider-validated once. One explicit derivation module creates the monthly-change supporting series and the three-month-average primary series. Both use the existing domain model and identify PAYEMS as the source while stating that their transformations are calculated by the application.

## Validation and normalization

The client checks the HTTP status and parses the response as untrusted JSON. It rejects provider error payloads, missing observation arrays, invalid dates, and values other than numeric strings or FRED's `.` missing marker.

Normalization converts numeric strings to numbers and `.` to `null`, sorts observations chronologically without mutating the provider response, removes observations dated after retrieval, and requires enough usable history for the configured frequency: 80 quarterly GDP values or 240 monthly values for CPI and both labor series. It constructs complete `EconomicSeries` metadata and passes the result through the same domain validator used by the application.

Leading unavailable values from provider transformations are removed so generated GDP and CPI files begin with valid year-over-year observations. Internal missing observations remain `null`. Current generated coverage is:

- GDPC1: 313 observations, 1948 Q1–2026 Q1.
- CPIAUCSL: 941 observations, January 1948–May 2026.
- UNRATE: 942 observations, January 1948–June 2026.
- LNS12300060: 942 observations, January 1948–June 2026.
- PAYEMS monthly change: 1,049 observations, February 1939–June 2026.
- PAYEMS three-month average: 1,047 observations, April 1939–June 2026.

## Safe replacement and failures

Only fully retrieved, normalized, domain-validated, and serialized series reach the writer. Direct series use one temporary file and atomic rename. The payroll outputs are validated and staged together; existing files are backed up during replacement and restored if grouped replacement fails. Both payroll files therefore update as one group, and temporary or backup files are removed where practical.

A missing key, network failure, HTTP error, malformed response, insufficient history, validation failure, or write failure leaves that series’ previous dataset intact. Errors are concise and never include the API key or a full provider response.

The four direct series and one PAYEMS source refresh sequentially in configuration order. Failure of one source does not stop the next or roll back an unrelated successful file. A PAYEMS derivation or write failure preserves both payroll outputs. After all entries run, any failure produces a nonzero exit status and the command identifies which outputs updated and which were preserved.

## Manual refresh

1. Obtain a key from the [FRED API documentation](https://fred.stlouisfed.org/docs/api/api_key.html).
2. Add `FRED_API_KEY=...` to an untracked `.env` file or export it in the current shell.
3. Run `npm run data:refresh`.
4. Review the printed provider identifier, source count, generated count, transformation, generated range, latest observation, and output path. PAYEMS also reports the supporting-series range and both grouped output paths.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
6. Inspect and commit the generated JSON with the refresh code or data-update commit.

The command currently runs only when a developer invokes it; no scheduler or runtime backend exists.

## Future series

Another FRED series would need one reviewed configuration entry, accurate metadata and minimum history, deterministic fixtures, an output file, registration in the local repository, and presentation copy. Shared transport, normalization, and atomic-writing utilities can be reused, but provider-specific decisions should remain explicit.
