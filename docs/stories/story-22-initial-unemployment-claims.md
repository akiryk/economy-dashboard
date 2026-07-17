# Story 22: Add initial unemployment claims

**Status: Complete**

## User story

As a reader trying to understand current labor-market conditions, I want to see whether new unemployment-insurance claims are rising, so that I can identify emerging labor-market deterioration without relying only on monthly payroll or unemployment reports.

## Product question

**Are layoffs beginning to rise?**

## Product purpose

The existing labor section shows unemployment, prime-age employment, payroll growth, and wages. Those measures provide broad monthly labor-market context, but they do not include a high-frequency measure of newly displaced workers.

Initial unemployment claims provide a timely weekly signal of people filing for unemployment-insurance eligibility after separation from an employer. The four-week moving average reduces weekly volatility while preserving changes in direction. The measure does not capture every layoff, because not every displaced worker files or qualifies for unemployment insurance.

This card belongs in **Employment and income**, after payroll growth.

It will later provide supporting evidence for the synthesis dashboard’s labor-market assessment.

## Data requirements

Use FRED as the provider intermediary.

Retrieve:

* `ICSA`: Initial Claims
* `IC4WSA`: 4-Week Moving Average of Initial Claims

Both series are:

* weekly;
* seasonally adjusted;
* measured as number of claims;
* dated by week ending Saturday;
* sourced from the U.S. Employment and Training Administration’s Unemployment Insurance Weekly Claims Report.

FRED describes an initial claim as a filing by an unemployed individual following separation from an employer to determine basic unemployment-insurance eligibility.

Use the complete useful common history available from the authoritative series. The current FRED histories begin in January 1967.

Do not derive the moving average locally when the official `IC4WSA` series is available. Preserve both source series independently and align them by exact weekly date.

## Dataset behavior

Create the required validated committed dataset or datasets using the existing repository conventions.

The data must:

* remain weekly;
* preserve exact week-ending dates;
* preserve missing source observations as `null`;
* contain no future-dated observations relative to retrieval;
* maintain chronological unique dates;
* expose metadata for both source identifiers;
* record units, frequency, seasonal adjustment, retrieval date, and coverage;
* refresh through the existing safe refresh workflow;
* leave prior valid committed data intact if retrieval or validation fails.

Do not convert claims into a percentage of payrolls or the labor force in this story.

## Card presentation

### Primary callout

Show the latest official four-week moving average.

Example format:

**224,500 claims**

Label it clearly as:

**Four-week average, week ending [date]**

Do not display unnecessary decimal places.

### Chart

Show two aligned lines:

1. Four-week moving average — visually primary
2. Weekly initial claims — visually secondary

The moving-average line should carry the interpretive emphasis. The noisier weekly series must remain visible so smoothing does not conceal the observations from which the trend is understood.

Do not use dual axes.

Do not smooth either line beyond the official four-week average.

Preserve visible discontinuities for missing values.

Use the existing shared:

* 5-year, 10-year, 20-year, and Maximum presets;
* historical zoom behavior;
* Reset zoom behavior;
* latest-observation semantics;
* tooltip behavior;
* chart accessibility and semantic recent-observations table.

## Visible interpretation

Provide a factual visible-range summary consistent with existing cards.

The summary may describe:

* whether the four-week average rose or fell across the visible range;
* its visible-range high and low;
* whether the latest value is above or below the visible-range median;
* the relationship between the latest weekly observation and four-week average.

Do not describe claims as “good,” “bad,” “safe,” or proof of recession.

Do not infer that every claim represents a permanent layoff.

Do not claim that claims alone predict recession.

## Explanation copy

Include concise explanatory copy covering these points:

* Initial claims count new applications for unemployment-insurance eligibility following separation from an employer.
* The four-week average reduces weekly noise and is the primary measure emphasized by the card.
* Rising claims can indicate increasing labor-market stress, while falling claims can indicate fewer new insurance filings.
* Claims do not include every laid-off worker and can be affected by eligibility, filing behavior, administrative disruptions, unusual events, and revisions.
* This measure should be interpreted alongside unemployment, payroll growth, and prime-age employment.

## Source and limitations

Expose source links and full metadata for both `ICSA` and `IC4WSA`.

Document that:

* weekly data are more responsive but noisier than monthly labor measures;
* the official four-week average is not an independent labor-market population;
* claims measure unemployment-insurance filings rather than all job losses;
* recent observations may be revised;
* unusual weather, strikes, disasters, administrative events, or seasonal-adjustment difficulties may temporarily affect filings.

## Documentation

Update at minimum:

* `docs/product-overview.md`
* `docs/data-refresh.md`
* any current card inventory or navigation documentation
* `docs/phase-1-limitations.md` only if a new durable limitation needs to be recorded
* README inventory counts if they remain part of current documentation

The product overview should identify the card’s role as a timely complement to monthly labor indicators.

## Tests

Add deterministic coverage for:

* validation and loading of both source series;
* exact weekly date alignment;
* correct latest callout using `IC4WSA`;
* no decimal display for claim counts;
* primary and secondary chart-series semantics;
* retained chart gaps;
* range-preset independence;
* Maximum returning full useful history;
* zoom and reset behavior;
* semantic recent-observations output;
* source metadata and links;
* isolated card failure behavior;
* refresh validation and safe replacement.

## Acceptance criteria

* A new Employment and income card asks, “Are layoffs beginning to rise?”
* The latest callout uses the official four-week moving average.
* Weekly initial claims remain visible as a secondary series.
* The two series align by exact week-ending date.
* The chart uses one claims axis and no smoothing beyond the official moving average.
* Maximum exposes the full useful authoritative history.
* The card explains what claims measure and what they omit.
* No recession prediction or unsupported labor-market verdict is shown.
* Data refresh, validation, source metadata, accessibility, semantic tables, range controls, and zoom conform to existing product behavior.
* All required documentation is updated.
* All repository quality checks pass.
* The completed story is committed and pushed as one focused commit.
