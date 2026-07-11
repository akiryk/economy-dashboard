# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented economic indicators.

## Current scope

Story 05 adds headline CPI inflation as the dashboard’s second production-quality series. GDP and CPI share the validated repository, card, chart, range, accessibility, and refresh architecture while retaining frequency-specific presentation.

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
- `data:refresh` retrieves and safely replaces the local GDP snapshot using the official FRED API.
- `preview` serves the production build locally after it has been created.

## Testing status

Vitest, React Testing Library, jest-dom, and jsdom cover chart-data adaptation, expanded-history range filtering, factual chart summaries, lazy-loading behavior, refresh normalization, provider validation, safe file preservation, and user-visible range controls. ECharts itself is mocked in component tests so tests focus on application data flow rather than canvas internals.

## Chart behavior

The GDP and CPI cards render nonsmoothed time-series charts with visible zero reference lines, percentage axes, frequency-aware tooltips, and independent 5-year, 10-year, 20-year, and maximum range controls. The default is 20 years. Range boundaries are calculated from each series’ latest observation date rather than today's date.

The chart includes an updating text summary of the latest, minimum, and maximum visible observations and whether any values fall below zero. The semantic recent-observations table remains available as a detailed nonvisual alternative.

Apache ECharts is integrated directly through a small React lifecycle wrapper and dynamically imported when the chart is rendered. This keeps ECharts out of the initial application chunk while preserving the boundary between chart configuration and economic-domain data. See [`docs/charting.md`](docs/charting.md) for details.

## Local economic data

Two datasets are bundled locally:

- `real-gdp-growth.json` contains 105 quarterly observations from 2000 Q1 through 2026 Q1 for FRED series `GDPC1`, transformed to percent change from one year ago. The underlying series is produced by the U.S. Bureau of Economic Analysis.
- `headline-cpi-inflation.json` contains 317 monthly observations from January 2000 through May 2026 for FRED series `CPIAUCSL`, transformed to percent change from one year ago. The underlying seasonally adjusted CPI index is produced by the U.S. Bureau of Labor Statistics.

Both current snapshots were retrieved from FRED on July 11, 2026.

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

The command sequentially refreshes every explicitly configured series: quarterly `GDPC1` and monthly `CPIAUCSL`, both beginning January 1, 2000 and using FRED's `pc1` transformation. Each response is validated, normalized, and atomically written independently. A failure leaves that series’ previous file intact, does not undo successful updates for other series, and makes the command exit nonzero after reporting every outcome.

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
scripts/
  fred/
  refreshEconomicData.ts
  writeEconomicSeries.ts
```

The root also contains Vite, TypeScript, and ESLint configuration. The existing `epics/` directory contains the broader product plan and is intentionally preserved.
