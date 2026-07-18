# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented indicators and long historical context.

Phase 1 is complete. The dashboard currently presents 27 cards in nine categories: growth, prices, employment and income, households, housing, business and manufacturing, financial conditions, government finances, and trade and tariffs.

See:

- [`docs/product-overview.md`](docs/product-overview.md) for what the product shows, why each measure is included, and how the current scope differs from possible future analytical goals.
- [`docs/product-principles.md`](docs/product-principles.md) for the product’s interpretation and presentation rules.
- [`docs/dashboard-review-guide.md`](docs/dashboard-review-guide.md) for reviewing Phase 1 and choosing the next product objective.
- [`docs/phase-1-limitations.md`](docs/phase-1-limitations.md) and [`docs/phase-1-closeout.md`](docs/phase-1-closeout.md) for accepted constraints and verification evidence.
- [`docs/data-refresh.md`](docs/data-refresh.md) for the authoritative source, transformation, coverage, and refresh inventory.
- [`docs/charting.md`](docs/charting.md) and [`docs/data-model.md`](docs/data-model.md) for implementation architecture.

## Technology

- React and strict TypeScript
- Vite and React Router
- Apache ECharts
- Plain CSS with custom properties
- Vitest, React Testing Library, ESLint, and npm

## Requirements and setup

- Node.js 20.19 or newer
- npm 10 or newer

```bash
npm install
npm run dev
```

No environment variables are required to run the dashboard. Its validated datasets are committed to the repository, and the browser never contacts data providers directly.

## Commands

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm test
npm run data:refresh
npm run preview
```

`npm run data:refresh` requires `FRED_API_KEY` in an untracked `.env` file or the shell environment. It refreshes the explicitly configured FRED series and the Atlanta Fed housing-affordability workbook, validates direct and locally derived outputs, and safely preserves prior valid files when a refresh fails.

## Product behavior

Every card begins with a human question and latest observation, then provides a nonsmoothed historical chart, independent 5-year, 10-year, 20-year, and maximum ranges, shared historical zoom controls, a factual visible-range summary, explanatory limitations, source metadata, and a semantic recent-observations table.

Relationship cards align observations by exact calendar period. They use compatible units or transparent normalization and avoid dual axes. Maximum shows the full useful authoritative history available for each measure, so starting dates differ across cards.

The dashboard is deliberately descriptive rather than predictive. It does not produce an overall economic score, investment signal, political verdict, or causal claim.

## Project structure

```text
src/
  app/                  Application shell and routing
  components/layout/    Shared page and section structure
  features/economic-series/
    charts/             ECharts lifecycle and chart options
    components/         Indicator cards and accessible presentation
    data/               Committed validated datasets
    models/             Domain model and runtime validation
    repositories/       Asynchronous local-data boundary
    utils/              Economic calculations and chart preparation
  pages/                Dashboard and not-found pages
  styles/               Global styles and design tokens
scripts/                Provider clients, derivations, and safe refresh writes
docs/                   Product, architecture, epics, and completed stories
```

Repository-wide working rules are in [`AGENTS.md`](AGENTS.md).
