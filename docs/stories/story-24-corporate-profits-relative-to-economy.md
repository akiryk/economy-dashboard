# Story 24: Add corporate profits relative to the economy

**Status: Complete**

## User story

As a reader trying to understand business conditions and their relevance to investments, I want to see whether after-tax corporate profits are rising or falling relative to the size of the economy, so that I can distinguish growth in total profits from changes in the corporate profit share.

## Product question

**Are corporate profits growing relative to the economy?**

Conceptual accuracy takes precedence over the initially proposed “profit margins” wording because this is an economy-wide profit share, not a company-level revenue margin.

## Measure and scope

Use FRED `CPATAX`, adjusted corporate profits after tax, and FRED `GDP`, nominal gross domestic product. Both inputs are quarterly seasonally adjusted annual rates.

Derive `CPATAX / GDP × 100` after exact-quarter alignment. Calculate only when both values exist and GDP is nonzero; otherwise preserve a `null` gap. Do not round inputs, use real GDP, add raw component lines, index the result, or derive profit growth.

The card belongs in Business and manufacturing after real business investment and before capacity utilization.

## Interpretation

Call the displayed measure the **after-tax corporate profit share of GDP**. A rising share means adjusted after-tax profits increased relative to the economy; a falling share means the share was compressed. Neither statement determines what happened to raw dollar profits.

This national-accounts measure is not an S&P 500 margin, company revenue margin, earnings per share, forecast, valuation measure, or investment signal. It does not establish causation or assign a high or low share an economic verdict.

## Data and presentation requirements

- Retrieve and validate both complete useful source histories.
- Preserve exact quarterly dates, missing observations, full precision, both source identities and links, source coverage, formula, retrieval date, and derived coverage.
- Atomically preserve the previous valid derived file when either input, derivation, validation, or writing fails.
- Show the latest share to one decimal place with its quarter.
- Show one nonsmoothed quarterly line with the established presets, zoom and reset controls, tooltip, factual summary, accessible table, sources, metadata, and limitations.
- Maximum begins at the first exact shared valid quarter.

## Acceptance criteria

- The numerator is `CPATAX` and the denominator is nominal `GDP`.
- Exact-quarter `CPATAX / GDP × 100` is calculated locally without premature rounding.
- The card distinguishes the share from raw profits, market earnings, company margins, and valuation.
- It contains no dual axis, causal claim, or investment recommendation.
- Refresh rollback, isolated card failure, documentation, tests, build, commit, and push are complete.
