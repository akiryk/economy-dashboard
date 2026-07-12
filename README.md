# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented economic indicators.

## Current scope

Story 07 adds unemployment and prime-age employment-to-population ratio as complementary labor-market measures. The dashboard presents four indicators across Growth, Prices, and Employment and income without combining them into a score or judgment.

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
- `data:refresh` retrieves and safely replaces all four local economic snapshots using the official FRED API.
- `preview` serves the production build locally after it has been created.

## Testing status

Vitest, React Testing Library, jest-dom, and jsdom cover chart-data adaptation, expanded-history range filtering, factual chart summaries, lazy-loading behavior, refresh normalization, provider validation, safe file preservation, and user-visible range controls. ECharts itself is mocked in component tests so tests focus on application data flow rather than canvas internals.

## Chart behavior

All four cards render nonsmoothed time-series charts with percentage axes, frequency-aware tooltips, and independent 5-year, 10-year, 20-year, and maximum range controls. The default is 20 years. Range boundaries are calculated from each series’ latest observation date rather than today's date. GDP and CPI include zero; the two labor-market level series use padded ranges based on visible data and do not force zero.

The chart includes an updating text summary of the latest, minimum, and maximum visible observations. GDP and CPI also report whether values fall below zero; that statement is omitted for the labor-market levels where it adds no useful context. The semantic recent-observations table remains available as a detailed nonvisual alternative.

Apache ECharts is integrated directly through a small React lifecycle wrapper and dynamically imported when the chart is rendered. This keeps ECharts out of the initial application chunk while preserving the boundary between chart configuration and economic-domain data. See [`docs/charting.md`](docs/charting.md) for details.

## Information architecture

The page currently contains three semantic sections:

- Growth, containing real GDP growth.
- Prices, containing headline CPI inflation.
- Employment and income, containing unemployment and prime-age employment-to-population ratio.

Each indicator leads with a human question and one latest value, followed by the range control and chart. Factual context, concise limitations, related concepts, visible source attribution, technical metadata, and recent observations remain available without competing with the chart. Empty future sections are not rendered.

The product principles and current-versus-future conceptual layers are documented in [`docs/product-principles.md`](docs/product-principles.md). In-page section navigation remains deferred at the current scope.

## Local economic data

Four datasets are bundled locally:

- `real-gdp-growth.json` contains 105 quarterly observations from 2000 Q1 through 2026 Q1 for FRED series `GDPC1`, transformed to percent change from one year ago. The underlying series is produced by the U.S. Bureau of Economic Analysis.
- `headline-cpi-inflation.json` contains 317 monthly observations from January 2000 through May 2026 for FRED series `CPIAUCSL`, transformed to percent change from one year ago. The underlying seasonally adjusted CPI index is produced by the U.S. Bureau of Labor Statistics.
- `src/features/economic-series/data/unemployment-rate.json` contains 318 monthly observations from January 2000 through June 2026 for FRED series `UNRATE`, published as a seasonally adjusted percent level by the U.S. Bureau of Labor Statistics.
- `src/features/economic-series/data/prime-age-employment-ratio.json` contains 318 monthly observations from January 2000 through June 2026 for FRED series `LNS12300060`, published as a seasonally adjusted percent level for adults ages 25 through 54 by the U.S. Bureau of Labor Statistics.

All four current snapshots were retrieved from FRED on July 12, 2026.

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

The command sequentially refreshes every explicitly configured series: quarterly `GDPC1` and monthly `CPIAUCSL` use FRED's `pc1` transformation, while monthly `UNRATE` and `LNS12300060` retain their published percent levels. All begin January 1, 2000. Each response is validated, normalized, and atomically written independently. A failure leaves that series’ previous file intact, does not undo successful updates for other series, and makes the command exit nonzero after reporting every outcome.

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
