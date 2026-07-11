# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented economic indicators.

## Current scope

Story 03 adds an interactive real GDP year-over-year growth chart while preserving the explicit domain model, runtime validation, local repository, metadata, explanatory copy, and observations table.

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

No environment variables are currently required. See `.env.example` for the current environment configuration contract.

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
npm run preview
```

- `build` type-checks the application and creates a production bundle.
- `typecheck` runs TypeScript without emitting files.
- `lint` checks the code with ESLint.
- `test` runs the Vitest unit and component test suite once. Use `npm run test:watch` during development.
- `preview` serves the production build locally after it has been created.

## Testing status

Vitest, React Testing Library, jest-dom, and jsdom cover chart-data adaptation, time-range filtering, factual chart summaries, and user-visible range-control behavior. ECharts itself is mocked in component tests so the tests focus on application data flow rather than canvas internals.

## Chart behavior

The GDP card renders a nonsmoothed quarterly line chart with a visible zero reference line, percentage axis, precise quarterly tooltips, and 5-year, 10-year, 20-year, and maximum range controls. The default is 20 years; because the current dataset is shorter, all available observations are initially shown. Range boundaries are calculated from the latest observation date rather than today's date.

The chart includes an updating text summary of the latest, minimum, and maximum visible observations and whether any values fall below zero. The semantic recent-observations table remains available as a detailed nonvisual alternative.

Apache ECharts is integrated directly through a small React lifecycle wrapper to limit wrapper dependencies and keep chart-library configuration separate from economic-domain data. See [`docs/charting.md`](docs/charting.md) for implementation details.

## Local economic data

The current dataset is bundled locally at `src/features/economic-series/data/real-gdp-growth.json`; there is no live refresh. It contains quarterly observations for FRED provider series `GDPC1` (Real Gross Domestic Product), transformed by FRED to percent change from one year ago. The underlying series is produced by the U.S. Bureau of Economic Analysis. The snapshot was retrieved from [FRED](https://fred.stlouisfed.org/series/GDPC1) on July 11, 2026.

Components request data asynchronously through the `EconomicSeriesRepository` interface instead of importing JSON. The local repository validates committed data at runtime, while preserving a boundary that can later be implemented by an application API or another data store.

To replace or update the snapshot:

1. Download authoritative `GDPC1` observations from FRED using the `Percent Change from Year Ago` transformation.
2. Replace the observations in `real-gdp-growth.json` without rounding the source values.
3. Update `retrievedAt` and verify all source metadata, including the provider series identifier and source URL.
4. Run the type-check, lint, and production build commands below and manually verify the rendered latest value and recent-observations table.

The data is currently bundled at build time. No live data fetching, persistence, or automatic chart refresh exists yet.

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
  data-model.md
```

The root also contains Vite, TypeScript, and ESLint configuration. The existing `epics/` directory contains the broader product plan and is intentionally preserved.
