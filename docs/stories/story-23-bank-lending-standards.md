# Story 23: Add bank lending standards

**Status: Complete**

## User story

As a reader trying to understand financial and business conditions, I want to see whether banks are tightening or easing lending standards, so that I can identify changes in credit availability that may not yet be visible in output, employment, or broad financial-market measures.

## Product question

**Are banks making it harder to borrow?**

## Product purpose

The existing financial-conditions section compares interest rates and shows the Chicago Fed NFCI credit subindex. The NFCI card is useful broad context, but it is a standardized composite and cannot directly answer whether banks report tightening lending standards for a particular borrower class. That limitation is already documented.

The Federal Reserve’s Senior Loan Officer Opinion Survey asks banks about changes in lending standards and terms and about changes in loan demand.

This story will add a direct quarterly measure of reported bank lending standards for commercial and industrial loans.

The card belongs in **Financial conditions**, after broad credit conditions.

It will later provide primary evidence for the synthesis dashboard’s business-and-credit assessment.

## Scope decision

Limit this first implementation to domestic banks’ standards for commercial and industrial loans to large and middle-market firms.

Use:

* `DRTSCILM`: Net Percentage of Domestic Banks Tightening Standards for Commercial and Industrial Loans to Large and Middle-Market Firms

This is a quarterly percentage series from the Federal Reserve Board’s Senior Loan Officer Opinion Survey.

Do not add small-firm standards, consumer loans, commercial real estate, mortgages, foreign banks, loan terms, loan demand, or separate large-bank subsets.

## Measure semantics

The value is a **net percentage of surveyed domestic banks reporting tighter standards**.

Positive values mean more banks reported tightening than easing; zero means the two were balanced in net terms; and negative values mean more banks reported easing than tightening.

Do not describe the value as the percentage of all loans denied, the percentage of all banks refusing credit, the change in loan volume, the level of interest rates, or the probability that a borrower will receive a loan.

The survey provides qualitative and limited quantitative information on bank credit availability and lending practices; it is not a complete census of lending.

## Data requirements

Use FRED as the provider intermediary and retrieve the complete useful history of `DRTSCILM`.

Preserve quarterly frequency, source quarter labels, percent units, not-seasonally-adjusted status, source observations and missing values, chronological unique dates, retrieval date and coverage, and complete source attribution. Do not interpolate missing quarters, transform the series into a rolling average, or combine it mathematically with NFCI or any other measure.

## Card presentation

Show the latest net percentage as net tightening, net easing, or no net tightening or easing according to its sign, with the observation quarter. A negative value must never be followed by “net tightening.”

Show one nonsmoothed quarterly line with a visible horizontal reference line at zero. Do not add red and green background zones. Use the existing presets, zoom and reset behavior, latest-observation semantics, tooltip behavior, semantic table, accessible labels, and source disclosures.

## Visible interpretation

The visible-range summary may state the latest sign, the change from the previous quarter, the visible high and low, the number of observations above and below zero, and the latest comparison with the visible median. Use “more tightening” and “less tightening” precisely, and do not infer causality.

## Explanation copy

Explain that senior loan officers report whether their banks tightened or eased lending standards; this card is the net percentage reporting tighter standards for C&I loans to large and middle-market firms; positive is net tightening and negative is net easing; tighter standards may restrict credit availability and signal lender caution; the measure does not show approvals, balances, borrowing costs, or all borrower types; and survey responses and outcomes may move at different times.

## Source and limitations

Expose the FRED series and Federal Reserve Board SLOOS provenance. Document its survey basis, evolving sample/questions, narrow borrower class, net rather than universal meaning, omission of demand, quarterly reporting convention, and companion measures.

## Documentation and tests

Update the product, refresh, navigation, card-count, and durable-limitation documentation. Add deterministic coverage for loading and validation, dates and ordering, sign preservation and wording, zero line and lack of verdict zones, factual summaries, full history and controls, semantic/accessibility/source behavior, isolated failure, and safe replacement.

## Acceptance criteria

* A new Financial conditions card asks, “Are banks making it harder to borrow?”
* It uses `DRTSCILM` and no additional SLOOS category.
* The latest callout correctly distinguishes net tightening from net easing.
* A zero reference line makes the survey’s sign meaningful.
* The copy explains that this is a net survey response, not a denial rate or lending volume.
* The card remains separate from the NFCI card and does not combine the two into a score.
* Full history, range controls, zoom, accessibility, recent observations, source metadata, and limitations conform to existing product behavior.
* All required documentation is updated.
* All repository quality checks pass.
* The completed story is committed and pushed as one focused commit.
