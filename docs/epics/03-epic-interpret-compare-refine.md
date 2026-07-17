# Epic 03: Interpret, Compare, and Refine the Economy Dashboard

## Status

Provisional.

This epic should be finalized only after Epic 02 is complete and the user has spent time reviewing the Phase 1 dashboard.

## Purpose

Turn the Phase 1 collection of authoritative indicators into a more interpretive analytical tool.

Epic 03 should emerge from actual dashboard review rather than assumptions made in advance.

The primary questions are:

- Which cards are genuinely useful?
- Which indicators are redundant?
- Which relationships deserve direct comparison?
- Which current combinations are historically unusual?
- Which forecasts were right or wrong?
- Which revisions materially changed the economic story?
- Which historical periods need context or annotation?
- Which parts of the interface interfere with understanding?

## Candidate workstreams

### Historical context

Potential features:

- Long-run medians
- Historical ranges
- Percentile positions
- Prior-cycle comparisons
- Recession bands
- Major-event annotations
- Visual comparison with one, two, and five years earlier

Requirements:

- Prefer visual context over dense numeric comparison strips.
- Make reference periods explicit.
- Avoid describing a value as unprecedented unless the available history supports it.

### Relationships and divergences

Potential comparisons:

- GDP versus employment
- Payroll growth versus unemployment
- Productivity versus compensation
- Manufacturing output versus employment
- Real income versus spending
- Wage growth versus inflation
- Policy rates versus market rates

Potential features:

- Shared-axis comparisons
- Normalized indexed comparisons
- Gap or divergence views
- Historical episodes with similar combinations
- Carefully defined correlation analysis

Requirements:

- Do not infer causation from correlation.
- Avoid dual axes unless strongly justified.
- Explain why a relationship matters.
- Use language such as “unusual in the available history” rather than unsupported “first ever” claims.

### Forecasts versus outcomes

Potential sources:

- Federal Reserve Summary of Economic Projections
- Survey of Professional Forecasters
- Congressional Budget Office
- Consensus forecasts
- Private forecasts such as Goldman Sachs, where access permits

Requirements:

- Store forecast issue date, horizon, definition, and units.
- Match forecast and actual measures precisely.
- Distinguish first-release actuals from revised actuals where relevant.
- Avoid judging forecasts using information unavailable at the time.

### Historical vintages and revisions

Potential features:

- Initial versus revised payroll estimates
- Initial versus revised GDP
- Revision magnitude and direction
- “What was known at the time” views

Likely source:

- ALFRED or another vintage-aware source

Requirements:

- Treat vintage date as first-class data.
- Preserve current-series behavior.
- Do not mix revised and real-time values without explicit labels.

### Editorial summaries

Potential features:

- Factual current-state summaries
- Callouts for mixed signals
- Explicitly rule-based observations
- Links from summaries to supporting charts

Requirements:

- Every generated statement must be traceable to data and rules.
- Avoid unsupported broad judgments.
- Distinguish observation from interpretation.
- Do not allow summaries to become a hidden composite score.

### Visual redesign and space efficiency

Potential goals:

- One primary number per card
- Smaller default charts
- Progressive disclosure for metadata and tables
- More compact section scanning
- Better relationship-card layouts
- Improved responsive behavior

Requirements:

- Base redesign decisions on actual use of the completed Phase 1 dashboard.
- Preserve accessibility.
- Preserve exact detail through tooltips and tables.
- Do not hide important caveats merely to reduce page height.

### Distributional and regional context

Potential additions:

- Median versus average income
- Income distribution
- Regional employment or inflation
- State comparisons
- Household differences by income group

Requirements:

- Use authoritative, comparable data.
- Avoid presenting national aggregates as universal household experience.
- Keep scope controlled.

## Discovery phase

Before implementation, conduct a structured review of Epic 02.

For every card, record:

- What question it answers
- Whether the answer is understandable
- Whether the data changes the user’s view
- Whether another card duplicates it
- Which other indicator should be considered alongside it
- Whether historical context is sufficient
- Whether the chart is visually efficient
- Which caveats are essential
- Whether the card should remain, change, combine, or be removed

Use that review to create a prioritized Epic 03 backlog.

## Provisional definition of done

Epic 03 is complete when:

- The highest-value relationships identified during review are implemented.
- Forecast comparison is implemented only where data can be handled honestly.
- Revision-aware views exist where revisions materially affect interpretation.
- Historical context is visually useful and statistically defensible.
- The interface is substantially more space-efficient without losing accessibility or detail.
- Editorial summaries, if present, are rule-based and traceable.
- No composite economy score is introduced.
- The user can explain what the dashboard says, where indicators disagree, and what remains uncertain.

## Explicit non-goals

- Predicting the economy with unsupported models
- Political scoring
- One overall economic grade
- Automated causal claims
- Treating market prices as the economy
- Hiding methodological uncertainty
