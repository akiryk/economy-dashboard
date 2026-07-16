# U.S. Economy Dashboard

An information-first web application for understanding the U.S. economy through objective, well-documented economic indicators.

## Current scope

Story 14 adds the Federal Reserve Board household debt-service ratio to show estimated required mortgage and consumer-debt payments as a share of aggregate disposable personal income.

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
- `data:refresh` retrieves and safely replaces the datasets for all fourteen dashboard cards using official FRED data and local derivations.
- `preview` serves the production build locally after it has been created.

## Testing status

Vitest, React Testing Library, jest-dom, and jsdom cover chart-data adaptation, expanded-history range filtering, factual chart summaries, lazy-loading behavior, refresh normalization, provider validation, safe file preservation, and user-visible range controls. ECharts itself is mocked in component tests so tests focus on application data flow rather than canvas internals.

## Chart behavior

All fourteen cards render nonsmoothed time-series charts with frequency-aware tooltips and independent 5-year, 10-year, 20-year, and maximum range controls. The default is 20 years. Short-range boundaries are calculated from each series’ latest shared observation date rather than today's date. Maximum includes every generated observation and may start in a different year for each card. Growth and comparison charts include zero; productivity, labor-market, saving-rate, and debt-service-ratio levels use padded ranges and do not force zero.

The chart includes an updating text summary of the latest, minimum, and maximum visible observations. GDP and CPI also report whether values fall below zero; that statement is omitted for the labor-market levels where it adds no useful context. The semantic recent-observations table remains available as a detailed nonvisual alternative.

Apache ECharts is integrated directly through a small React lifecycle wrapper and dynamically imported when the chart is rendered. This keeps ECharts out of the initial application chunk while preserving the boundary between chart configuration and economic-domain data. See [`docs/charting.md`](docs/charting.md) for details.

## Information architecture

The page currently contains four semantic sections:

- Growth, containing real GDP growth, real GDP per capita growth, productivity over time, and productivity growth momentum.
- Prices, containing headline CPI inflation, headline versus core CPI, and recent inflation momentum.
- Employment and income, containing unemployment, prime-age employment-to-population ratio, payroll growth, and wages versus inflation.
- Households, containing real disposable income per capita versus real consumer spending, the personal saving rate, and the household debt-service ratio.

Each indicator leads with a human question and one latest value, followed by the range control and chart. Factual context, concise limitations, related concepts, visible source attribution, technical metadata, and recent observations remain available without competing with the chart. Empty future sections are not rendered.

The product principles and current-versus-future conceptual layers are documented in [`docs/product-principles.md`](docs/product-principles.md). A collapsed in-page index lists every card by section.

## Local economic data

Eighteen full-history datasets support fourteen visible cards:

- `real-gdp-growth.json`: 313 quarterly observations, 1948 Q1–2026 Q1, FRED `GDPC1`, percent change from one year ago.
- `real-gdp-per-capita-growth.json`: 313 quarterly observations, 1948 Q1–2026 Q1, calculated locally from FRED `A939RX0Q048SBEA` levels.
- `labor-productivity-growth.json`: 313 quarterly observations, 1948 Q1–2026 Q1, calculated locally from FRED `OPHNFB` index levels.
- `labor-productivity-level.json`: 317 published quarterly OPHNFB levels, 1947 Q1–2026 Q1; normalized only for the selected display range.
- `headline-cpi-inflation.json`: 942 monthly observations, January 1948–June 2026, calculated from FRED `CPIAUCSL` levels.
- `core-cpi-inflation.json`: 822 monthly observations, January 1958–June 2026, calculated from FRED `CPILFESL` levels.
- `headline-cpi-three-month-annualized.json`: 951 monthly observations, April 1947–June 2026, calculated from `CPIAUCSL` levels.
- `core-cpi-three-month-annualized.json`: 831 monthly observations, April 1957–June 2026, calculated from `CPILFESL` levels.
- `unemployment-rate.json`: 942 monthly observations, January 1948–June 2026, FRED `UNRATE`, percent level.
- `prime-age-employment-ratio.json`: 942 monthly observations, January 1948–June 2026, FRED `LNS12300060`, percent level for adults ages 25 through 54.
- `monthly-payroll-change.json`: 1,049 locally derived monthly changes, February 1939–June 2026, from FRED `PAYEMS` levels.
- `payroll-growth.json`: 1,047 rolling three-month averages, April 1939–June 2026, from the same single PAYEMS retrieval.
- `nominal-wage-growth.json`: year-over-year growth in `AHETPI`, covering January 1965–June 2026.
- `real-wage-growth.json`: exact AHETPI growth deflated by headline CPI, aligned January 1965–May 2026.
- `real-disposable-income-per-capita-growth.json`: 797 monthly observations, January 1960–May 2026, calculated locally from FRED `A229RX0` levels.
- `real-consumer-spending-growth.json`: 221 monthly observations, January 2008–May 2026, calculated locally from FRED `PCEC96` levels.
- `personal-saving-rate.json`: 809 monthly observations, January 1959–May 2026, published FRED `PSAVERT` percent levels.
- `household-debt-service-ratio.json`: 85 quarterly observations, 2005 Q1–2026 Q1, published FRED `TDSP` percent levels.

The household growth rates use `((level_t / level_t-12) - 1) × 100` with exact calendar-month lookups and align only on shared dates. TDSP is a provider-published quarterly level: estimated required mortgage and consumer-debt payments divided by aggregate disposable personal income. These national aggregates do not describe every household. Spending growth does not establish financial sustainability, a higher saving rate is not automatically favorable, and the aggregate debt-service ratio is not a typical household's burden or a complete measure of hardship.

AHETPI is average hourly earnings for private-sector production and nonsupervisory employees. It begins in January 1964, is not a median, excludes supervisory and government workers, and can change with the mix of jobs. Nominal growth is `(wage_t / wage_t-12 - 1) × 100`. Real growth is `((wage_t / wage_t-12) / (CPI_t / CPI_t-12) - 1) × 100`; it is not calculated by subtracting rounded rates.

Headline and core year-over-year inflation use `((index_t / index_t-12) - 1) × 100`. Three-month annualized momentum uses the exact ratio `((index_t / index_t-3)^4 - 1) × 100`, not four times a rounded three-month change. Both formulas require exact calendar months and preserve internal gaps as unavailable. Core CPI excludes food and energy but does not make those household costs irrelevant or remove every volatile category. The annualized measure is responsive and substantially noisier than year-over-year inflation; it describes a recent pace and is not a forecast.

Real GDP per capita uses BEA series `A939RX0Q048SBEA`, published quarterly in chained 2017 dollars at a seasonally adjusted annual rate. Labor productivity uses BLS series `OPHNFB`, a quarterly seasonally adjusted index of nonfarm business output per hour. OPHNFB is fetched once and written as a canonical level plus locally calculated growth. The level card normalizes the first valid selected-range value to 100; cumulative change is `(latest / baseline - 1) × 100`. Growth is `((level_t / level_t-4 quarters) - 1) × 100`, and momentum compares that growth rate with the exact rate four quarters earlier. A falling positive growth line means gains are slowing, not that productivity is falling.

All current snapshots were retrieved from FRED on July 16, 2026 UTC. Each source uses the full-history request policy without `observation_start`. Leading unavailable observations are omitted, while meaningful internal missing values remain `null`. PAYEMS is published monthly in thousands of persons, seasonally adjusted; the application calculates consecutive monthly differences and rolling three-month averages from its full source history.

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

The command refreshes every explicitly configured source. It fetches `CPIAUCSL` and `CPILFESL` once each and derives all four CPI outputs as one rollback-protected group. The generated headline year-over-year series is then reused with one `AHETPI` fetch for wage derivation, so headline CPI is not requested again. `A939RX0Q048SBEA`, `OPHNFB`, and `PAYEMS` are also each fetched once. Successful reporting includes source and generated counts and ranges. A failure preserves the affected prior output group without undoing successful unrelated refreshes. Any failure produces a nonzero exit after every source is attempted.

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
