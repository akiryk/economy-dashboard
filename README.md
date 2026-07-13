# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented economic indicators.

## Current scope

Story 10 adds the first relationship card: wages versus inflation. It compares nominal wage growth with headline CPI inflation and prominently reports exact real wage growth.

## Technology stack

- React
- TypeScript in strict mode
- Vite
- React Router
- Apache ECharts
- Plain CSS with custom properties
- ESLint
- npm

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer

## Installation

Install dependencies from the project root:

```bash
npm install
```

No environment variables are required to run the dashboard. A FRED API key is required only to refresh the committed source data.

## Development

Start the Vite development server:

```bash
npm run dev
```

## Available commands

```bash
npm run build
npm run typecheck
npm run lint
npm test
npm run data:refresh
npm run preview
```

- `build` type-checks the application and creates a production bundle.
- `typecheck` runs TypeScript without emitting files.
- `lint` checks the code with ESLint.
- `test` runs the Vitest unit and component test suite once. Use `npm run test:watch` during development.
- `data:refresh` retrieves and safely replaces all six dashboard cards using official FRED data and local derivations.
- `preview` serves the production build locally after it has been created.

## Testing status

Vitest, React Testing Library, jest-dom, and jsdom cover chart-data adaptation, expanded-history range filtering, factual chart summaries, lazy-loading behavior, refresh normalization, provider validation, safe file preservation, and user-visible range controls. ECharts itself is mocked in component tests so tests focus on application data flow rather than canvas internals.

## Chart behavior

All six cards render nonsmoothed time-series charts with frequency-aware tooltips and independent 5-year, 10-year, 20-year, and maximum range controls. The default is 20 years. Short-range boundaries are calculated from each series’ latest observation date rather than today's date. Maximum includes every generated observation and may start in a different year for each series. GDP, CPI, payroll growth, and the wage comparison include zero; the two labor-market level series use padded ranges based on visible data and do not force zero.

The chart includes an updating text summary of the latest, minimum, and maximum visible observations. GDP and CPI also report whether values fall below zero; that statement is omitted for the labor-market levels where it adds no useful context. The semantic recent-observations table remains available as a detailed nonvisual alternative.

Apache ECharts is integrated directly through a small React lifecycle wrapper and dynamically imported when the chart is rendered. This keeps ECharts out of the initial application chunk while preserving the boundary between chart configuration and economic-domain data. See [`docs/charting.md`](docs/charting.md) for details.

## Information architecture

The page currently contains three semantic sections:

- Growth, containing real GDP growth.
- Prices, containing headline CPI inflation.
- Employment and income, containing unemployment, prime-age employment-to-population ratio, payroll growth, and wages versus inflation.

Each indicator leads with a human question and one latest value, followed by the range control and chart. Factual context, concise limitations, related concepts, visible source attribution, technical metadata, and recent observations remain available without competing with the chart. Empty future sections are not rendered.

The product principles and current-versus-future conceptual layers are documented in [`docs/product-principles.md`](docs/product-principles.md). In-page section navigation remains deferred at the current scope.

## Local economic data

Eight full-history datasets support six visible cards:

- `real-gdp-growth.json`: 313 quarterly observations, 1948 Q1–2026 Q1, FRED `GDPC1`, percent change from one year ago.
- `headline-cpi-inflation.json`: 941 monthly observations, January 1948–May 2026, FRED `CPIAUCSL`, percent change from one year ago.
- `unemployment-rate.json`: 942 monthly observations, January 1948–June 2026, FRED `UNRATE`, percent level.
- `prime-age-employment-ratio.json`: 942 monthly observations, January 1948–June 2026, FRED `LNS12300060`, percent level for adults ages 25 through 54.
- `monthly-payroll-change.json`: 1,049 locally derived monthly changes, February 1939–June 2026, from FRED `PAYEMS` levels.
- `payroll-growth.json`: 1,047 rolling three-month averages, April 1939–June 2026, from the same single PAYEMS retrieval.
- `nominal-wage-growth.json`: year-over-year growth in `AHETPI`, covering January 1965–June 2026.
- `real-wage-growth.json`: exact AHETPI growth deflated by headline CPI, aligned January 1965–May 2026.

AHETPI is average hourly earnings for private-sector production and nonsupervisory employees. It begins in January 1964, is not a median, excludes supervisory and government workers, and can change with the mix of jobs. Nominal growth is `(wage_t / wage_t-12 - 1) × 100`. Real growth is `((wage_t / wage_t-12) / (CPI_t / CPI_t-12) - 1) × 100`; it is not calculated by subtracting rounded rates.

All current snapshots were retrieved from FRED on July 13, 2026 UTC. Each source uses the full-history request policy without `observation_start`. Leading unavailable transformed observations are omitted, while meaningful internal missing values remain `null`. PAYEMS is published monthly in thousands of persons, seasonally adjusted; the application calculates consecutive monthly differences and rolling three-month averages from its full source history.

Components request data asynchronously through the `EconomicSeriesRepository` interface instead of importing JSON. The local repository validates committed data at runtime, while preserving a boundary that can later be implemented by an application API or another data store.

The browser never contacts FRED. The committed dataset supports local and deployed rendering when the API or network is unavailable.

## Refreshing economic data

Request a free API key from the [FRED API key page](https://fred.stlouisfed.org/docs/api/api_key.html), copy `.env.example` to an untracked `.env`, and set:

```text
FRED_API_KEY=your_key_here
```

Then run:

```bash
npm run data:refresh
```

The command sequentially refreshes every explicitly configured source. `CPIAUCSL` is fetched once and its generated inflation result is reused with one `AHETPI` fetch to derive both wage outputs. PAYEMS and wage outputs use separate rollback-protected groups. Successful reporting includes source and generated observation counts plus generated ranges. A grouped failure preserves its prior files without undoing successful unrelated refreshes. Any failure produces a nonzero exit after every source is attempted.

See [`docs/data-refresh.md`](docs/data-refresh.md) for the data flow and failure behavior.

Data remains committed and browser-static. Refresh remains a manual developer command; there is no live browser fetching, persistence, automatic scheduling, or runtime backend.

## Project structure

```text
src/
  app/
    App.tsx
    router.tsx
  components/
    layout/
      AppHeader.tsx
      AppLayout.tsx
  features/
    economic-series/
      components/
      charts/
      data/
      models/
      repositories/
      utils/
  pages/
    DashboardPage.tsx
    NotFoundPage.tsx
  styles/
    global.css
    tokens.css
  main.tsx
docs/
  charting.md
  data-refresh.md
  data-model.md
  product-principles.md
scripts/
  fred/
  refreshEconomicData.ts
  writeEconomicSeries.ts
```

The root also contains Vite, TypeScript, and ESLint configuration. The existing `epics/` directory contains the broader product plan and is intentionally preserved.
