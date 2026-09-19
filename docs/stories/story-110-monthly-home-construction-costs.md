# User Story 110 — Monthly home-construction costs

As a dashboard reader, I want a timely measure of how the cost of constructing
a comparable ordinary single-family home is changing, so that I can see current
2026 cost pressure without mistaking luxury custom-home anecdotes or an annual
dollar-per-square-foot benchmark for a monthly national estimate.

## Acceptance criteria

1. Add a third Housing card based on the official Census/HUD monthly
   constant-quality Laspeyres index for new single-family houses under
   construction.
2. Show change from the prior month, change from the same month a year earlier,
   and the year-over-year change after adjustment by CPI-U.
3. Include a monthly historical chart through the latest published 2026 month.
4. Explain that the index excludes land and nonconstruction costs and is not a
   monthly dollar-per-square-foot estimate. Link the separate annual Census
   contractor-built price-per-square-foot table.
5. Refresh the nominal and real artifacts as one registered unit after CPI;
   preserve the last-good pair and scope any unit failure to the affected card.
6. Accept revisions to recent source months, reject malformed or non-contiguous
   workbooks, and preserve missing CPI months as explicit gaps.
7. Controlled tests must advance the workbook by one month while revising a
   recent observation. UI tests must own their values rather than hard-code a
   production observation.

## Mutable inputs

- the workbook's latest month and the preliminary/revised values for its two
  most recent months;
- workbook sheet and column labels;
- monthly CPI observations and occasional explicit gaps;
- all displayed dates, index values, and derived percentage changes.

## Source decision

The monthly constant-quality index is the timely measure. The annual observed
contractor-built dollar-per-square-foot table remains useful context, but it is
not interpolated or extrapolated because doing so would create unsupported
monthly precision.
