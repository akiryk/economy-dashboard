# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented economic indicators.

## Current scope

Story 02 adds an explicit economic-series domain model, runtime validation, a local repository implementation, and a readable summary of U.S. real GDP year-over-year growth. Charting is not yet implemented.

## Technology stack

- React
- TypeScript in strict mode
- Vite
- React Router
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
npm run preview
```

- `build` type-checks the application and creates a production bundle.
- `typecheck` runs TypeScript without emitting files.
- `lint` checks the code with ESLint.
- `preview` serves the production build locally after it has been created.

## Testing status

No test framework is installed yet. The validation and utility code is structured for focused automated tests in a future story.

## Local economic data

The current dataset is bundled locally at `src/features/economic-series/data/real-gdp-growth.json`; there is no live refresh. It contains quarterly observations for FRED provider series `GDPC1` (Real Gross Domestic Product), transformed by FRED to percent change from one year ago. The underlying series is produced by the U.S. Bureau of Economic Analysis. The snapshot was retrieved from [FRED](https://fred.stlouisfed.org/series/GDPC1) on July 11, 2026.

Components request data asynchronously through the `EconomicSeriesRepository` interface instead of importing JSON. The local repository validates committed data at runtime, while preserving a boundary that can later be implemented by an application API or another data store.

To replace or update the snapshot:

1. Download authoritative `GDPC1` observations from FRED using the `Percent Change from Year Ago` transformation.
2. Replace the observations in `real-gdp-growth.json` without rounding the source values.
3. Update `retrievedAt` and verify all source metadata, including the provider series identifier and source URL.
4. Run the type-check, lint, and production build commands below and manually verify the rendered latest value and recent-observations table.

The data is currently bundled at build time. No live data fetching, persistence, or charting exists yet.

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
  data-model.md
```

The root also contains Vite, TypeScript, and ESLint configuration. The existing `epics/` directory contains the broader product plan and is intentionally preserved.
