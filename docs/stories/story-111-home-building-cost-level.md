# User Story 111 — Reframe home-building costs around the cost level

As a dashboard reader, I want to see how much the cost of building a comparable
new single-family home has risen over time and where that cost stands now, so
that I can understand the long-run level of home-building costs rather than
only the current rate of cost inflation.

## Acceptance criteria

1. Ask “How much has the cost of building a comparable home risen?” and make
   the latest official monthly Census constant-quality index level dominant.
2. Identify the 2005=100 base, show the observation month and cumulative change
   since the base, and keep year-over-year/month-over-month changes subordinate.
3. Plot actual nonsmoothed monthly index levels for about 20 years by default,
   with maximum history, established controls, accessible summary, no forced
   zero, and explicit missing observations.
4. In expanded content, separately show the official annual contractor-built
   median contract price per square foot, year, nominal units, history, source,
   and limitations.
5. Never splice the annual dollars and monthly index or imply a synthetic
   monthly dollar-per-square-foot value.
6. Explain the national scope, constant-quality meaning, and exclusion of land,
   financing, selling expenses, profit, and other nonconstruction costs.
7. Refresh monthly and annual artifacts independently so either can advance or
   fail while the other's last-good data remain publishable.
8. Use controlled UI fixtures and cover missing periods, revisions, a plausible
   next month, and a plausible next annual observation.

## Mutable inputs

- monthly workbook labels, observations, latest month, and revisions;
- annual legacy-workbook labels, observations, latest year, and revisions;
- displayed levels, dates, exact-period comparisons, and generated metadata;
- independent workflow results and card-scoped freshness state.

## Source and interpretation decision

The monthly Laspeyres constant-quality index answers the level question and
retains its official 2005 base. The annual contractor-built price-per-square-
foot series supplies familiar nominal-dollar context but measures a changing
mix of homes. The two series therefore remain independently ingested and
visibly separate.
