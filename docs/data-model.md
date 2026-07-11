# Economic-series data model

The economic-series domain model keeps source metadata and observations together while distinguishing the meaning of each date.

An `EconomicSeries` identifies the provider and provider series, explains the displayed units and transformation, records seasonal adjustment and frequency, and contains `EconomicObservation` entries. Each observation has an ISO date representing the economic period and a numeric or `null` value. A missing observation remains `null`; it is never treated as zero.

The current domain supports quarterly GDP and monthly CPI inflation. Frequency-aware presentation formats quarterly dates as `2026 Q1` and monthly dates as `May 2026` using UTC, so local timezone offsets cannot shift an economic period. Invalid dates are rejected rather than displayed ambiguously.

## Observation date and retrieval date

An observation date identifies the economic period measured. For quarterly GDP, `2026-01-01` represents the first quarter of 2026. It does not mean the estimate was published on January 1.

The series-level `retrievedAt` date records when this particular local snapshot was downloaded. Economic estimates are revised, so two snapshots with the same observation dates can contain different values.

## Repository boundary

React components do not import JSON directly. They request a series by slug through `EconomicSeriesRepository`, and the local implementation validates the unknown JSON data before returning it. This keeps parsing and data-source details out of presentation code and provides a clear asynchronous boundary.

The local implementation uses an explicit slug-to-loader registry for `real-gdp-growth` and `headline-cpi-inflation`. Dynamic JSON imports avoid placing every committed dataset in the initial application module while keeping unknown slugs and validation behavior explicit.

A future API or SQLite implementation can implement the same repository interface without changing the components that consume `EconomicSeries`. This is a narrow substitution point, not a dependency-injection framework.

## Chart adapter boundary

The domain model remains independent of Apache ECharts. A chart adapter creates chronologically sorted `[date, value]` tuples only at the chart boundary, preserving `null` values and leaving the source observations unchanged. Range selection and factual chart summaries operate on domain observations before adaptation.

## Current limitations

- The application contains two locally bundled series.
- Data is refreshed by a manual developer command and can become stale between runs.
- Runtime validation is intentionally focused on the current model and does not enforce provider-specific rules.
- There is no persistence, revision history, API, or automated refresh.
- Charting currently supports monthly and quarterly percentage series.
