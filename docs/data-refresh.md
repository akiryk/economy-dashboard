# Economic data refresh

## Data flow

The refresh path is deliberately separate from the browser:

```text
FRED API -> Node refresh command -> validated domain JSON -> local repository -> React dashboard
```

The generated JSON is committed with the application, so the dashboard remains usable if FRED is unavailable. The browser never receives the API key and never contacts FRED.

## Supported-series configuration

`scripts/fred/seriesConfigurations.ts` contains an explicit list of supported series. Each entry defines its slug, output file, provider identifier, FRED and domain frequencies, observation start, transformation, minimum history, and domain metadata. The list currently contains only:

- Real GDP growth (`GDPC1`, quarterly), written to `real-gdp-growth.json`.
- Headline CPI inflation (`CPIAUCSL`, monthly), written to `headline-cpi-inflation.json`.

This is a small configuration boundary, not dynamic discovery or a plugin system.

## Provider requests

`npm run data:refresh` uses Node's built-in `fetch` to call:

```text
https://api.stlouisfed.org/fred/series/observations
```

Shared parameters:

- `api_key` from `FRED_API_KEY`
- `file_type=json`
- `units=pc1` for percent change from one year ago
- `observation_start=2000-01-01`
- `sort_order=asc`

GDP adds `series_id=GDPC1` and `frequency=q`. CPI adds `series_id=CPIAUCSL` and `frequency=m`. The FRED transformation is used directly; the script does not recalculate or round growth rates.

## Validation and normalization

The client checks the HTTP status and parses the response as untrusted JSON. It rejects provider error payloads, missing observation arrays, invalid dates, and values other than numeric strings or FRED's `.` missing marker.

Normalization converts numeric strings to numbers and `.` to `null`, sorts observations chronologically without mutating the provider response, removes observations dated after retrieval, and requires enough usable history for the configured frequency: 80 quarterly GDP values or 240 monthly CPI values. It constructs complete `EconomicSeries` metadata and passes the result through the same domain validator used by the application.

## Safe replacement and failures

Only a fully retrieved, normalized, domain-validated, and serialized series reaches the writer. The writer creates a temporary file beside the target and renames it over the committed dataset only after the write succeeds. It removes temporary output after failures where practical.

A missing key, network failure, HTTP error, malformed response, insufficient history, validation failure, or write failure leaves that series’ previous dataset intact. Errors are concise and never include the API key or a full provider response.

Series refresh sequentially in configuration order because there are only two requests and simple reporting is more valuable than negligible concurrency savings. Failure of one series does not stop the next or roll back a successful file. After all entries run, any failure produces a nonzero exit status and the command identifies which files updated and which failed.

## Manual refresh

1. Obtain a key from the [FRED API documentation](https://fred.stlouisfed.org/docs/api/api_key.html).
2. Add `FRED_API_KEY=...` to an untracked `.env` file or export it in the current shell.
3. Run `npm run data:refresh`.
4. Review the printed identifier, transformation, count, range, latest observation, and output path.
5. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
6. Inspect and commit the generated JSON with the refresh code or data-update commit.

The command currently runs only when a developer invokes it; no scheduler or runtime backend exists.

## Future series

Another FRED series would need one reviewed configuration entry, accurate metadata and minimum history, deterministic fixtures, an output file, registration in the local repository, and presentation copy. Shared transport, normalization, and atomic-writing utilities can be reused, but provider-specific decisions should remain explicit.
