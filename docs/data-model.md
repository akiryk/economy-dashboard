# Economic-series data model

The economic-series domain model keeps source metadata and observations together while distinguishing the meaning of each date.

An `EconomicSeries` identifies the provider and provider series, explains the displayed units and transformation, records seasonal adjustment and frequency, and contains `EconomicObservation` entries. Each observation has an ISO date representing the economic period and a numeric or `null` value. A missing observation remains `null`; it is never treated as zero.

The current domain supports quarterly GDP and monthly CPI and labor-market series. Frequency-aware presentation formats quarterly dates as `2026 Q1` and monthly dates as `June 2026` using UTC, so local timezone offsets cannot shift an economic period. Invalid dates are rejected rather than displayed ambiguously.

## Observation date and retrieval date

An observation date identifies the economic period measured. For quarterly GDP, `2026-01-01` represents the first quarter of 2026. It does not mean the estimate was published on January 1.

The series-level `retrievedAt` date records when this particular local snapshot was downloaded. Economic estimates are revised, so two snapshots with the same observation dates can contain different values.

Observation coverage is series-specific. Maximum history is not a shared common date range: the payroll derivatives begin in 1939, while the current direct series begin in 1948. Series details expose the actual earliest and latest included periods.

## Repository boundary

React components do not import JSON directly. They request a series by slug through `EconomicSeriesRepository`, and the local implementation validates the unknown JSON data before returning it. This keeps parsing and data-source details out of presentation code and provides a clear asynchronous boundary.

The local implementation uses an explicit slug-to-loader registry for all visible and supporting series. Dynamic JSON imports avoid placing every committed dataset in the initial application module while keeping unknown slugs and validation behavior explicit.

A future API or SQLite implementation can implement the same repository interface without changing the components that consume `EconomicSeries`. This is a narrow substitution point, not a dependency-injection framework.

## Chart adapter boundary

The domain model remains independent of Apache ECharts. A chart adapter creates chronologically sorted `[date, value]` tuples only at the chart boundary, preserving `null` values and leaving the source observations unchanged. Range selection and factual chart summaries operate on domain observations before adaptation.

## Dashboard composition and product copy

`DashboardPage` explicitly composes semantic Growth, Prices, and Employment and income sections through a small `EconomicSection` layout component. This keeps the heading hierarchy and section descriptions consistent without creating a schema-driven page engine. Future sections should be added only when real indicators exist.

Provider identity, series identity, units, frequency, transformations, dates, and observations belong to the economic-series domain data. Human explanations, related concepts, latest-value labels, and table captions belong to the explicit series presentation registry. Product copy is therefore reusable by the shared card without becoming provider metadata or chart configuration.

The card structure has an intentional extension point between the primary current-value callout and supporting details for future compact historical-context visuals. No empty placeholder, median comparison, percentile, or forecast view is currently rendered.

## Percent levels and growth rates

`units` and `transformation` describe different properties. GDP and CPI use percent-valued year-over-year transformations, while unemployment and prime-age employment use provider-published percent levels. A percentage unit therefore never implies a growth calculation. Shared display and chart code reads both fields and does not automatically describe percentage data as a change from one year ago.

Seasonal adjustment, frequency, observation period, and retrieval date remain independent metadata. The observation shape is unchanged for level series.

## Locally derived payroll series

PAYEMS is a provider level in thousands of persons. The dashboard does not present that raw level as its payroll measure. One refresh-time derivation creates monthly changes and a rolling three-month average, both stored in thousands of jobs. Their `providerSeriesId` and source attribution identify PAYEMS, while `transformation` states that the application calculated the displayed values. The derived monthly-change series begins one observation after the source; the three-month average begins two changes later. This separates provider source from local transformation without adding speculative metadata fields.

The primary `payroll-growth` and supporting `monthly-payroll-change` series use the unchanged `{ date, value }` observation shape. The supporting series begins two months earlier; every primary date aligns with a supporting monthly-change date. The repository loads both for one card, and React does not calculate either measure. The supporting series appears only in the payroll card's paired recent-observations table, not as a separate dashboard card.

## Current limitations

- The application contains five visible indicators and one supporting payroll series.
- Data is refreshed by a manual developer command and can become stale between runs.
- Runtime validation is intentionally focused on the current model and does not enforce provider-specific rules.
- There is no persistence, revision history, API, or automated refresh.
- Charting currently supports monthly and quarterly percentages plus signed monthly job counts.
