# Story 13A: Align Household Income and Spending on a Quarterly Per-Capita Basis

## Status

Complete.

## User story

As a dashboard reader, I want household income and spending to be compared on the same per-person basis over a long historical period, so that I can interpret whether real household resources and consumption are growing together without confusing population growth with household-level change.

## Why this corrective story is needed

The current household income-versus-spending card compares:

- monthly real disposable income **per capita**; and
- monthly real consumer spending in **total aggregate dollars**.

Although both lines are converted to year-over-year real growth rates, the denominators remain conceptually different. Total spending can grow partly because the population grows, while income has already been adjusted per person.

The current monthly real-consumer-spending series also begins only in 2007, which prevents Maximum from showing earlier inflationary periods such as the 1970s.

This story corrects both issues by replacing the card’s source pair with quarterly, real, per-capita series that share a long history beginning in 1947.

This is a product-meaning correction, not merely a frequency change.

## Product question

Use:

> **Are real household incomes and spending growing per person?**

The question must make the per-capita basis explicit.

Do not describe the chart as showing the experience of an “average household.” The measures are national aggregates expressed per person and do not describe the distribution of outcomes across households.

## Source decision

Use FRED as the intermediary for two official Bureau of Economic Analysis quarterly series.

### Real disposable personal income per capita

- **FRED series:** `A229RX0Q048SBEA`
- **Provider title:** Real Disposable Personal Income: Per Capita
- **Underlying publisher:** U.S. Bureau of Economic Analysis
- **Release:** Gross Domestic Product
- **Frequency:** Quarterly
- **Units:** Chained 2017 dollars
- **Seasonal adjustment:** Seasonally adjusted annual rate
- **Source coverage:** Beginning 1947 Q1
- **Displayed transformation:** Locally calculated exact-quarter year-over-year growth

### Real personal consumption expenditures per capita

- **FRED series:** `A794RX0Q048SBEA`
- **Provider title:** Real personal consumption expenditures per capita
- **Underlying publisher:** U.S. Bureau of Economic Analysis
- **Release:** Gross Domestic Product
- **Frequency:** Quarterly
- **Units:** Chained 2017 dollars
- **Seasonal adjustment:** Seasonally adjusted annual rate
- **Source coverage:** Beginning 1947 Q1
- **Displayed transformation:** Locally calculated exact-quarter year-over-year growth

These sources are directly comparable in the ways material to this card:

- both are real;
- both are per capita;
- both are quarterly;
- both are seasonally adjusted annual rates;
- both are published within the BEA national accounts;
- both begin in 1947.

The generated year-over-year growth series should begin in 1948 after the four-quarter warm-up period.

## Scope

Replace the existing monthly household income-versus-spending comparison with a quarterly per-capita comparison.

This story must:

1. add the two quarterly source-level series to the existing FRED refresh configuration;
2. derive exact-quarter year-over-year growth for both;
3. generate and commit validated local datasets;
4. update the existing household relationship card to use the new quarterly series;
5. revise the card question, labels, explanation, summary, table, tooltip, metadata, and provenance;
6. expose full useful shared history through Maximum;
7. preserve the established relationship-card accessibility and failure behavior;
8. remove obsolete runtime use of the old monthly comparison series;
9. update relevant tests and documentation.

Do not add a new visible card unless repository inspection demonstrates that replacing the existing card would break an intentional product distinction.

Do not implement a monthly-versus-quarterly toggle in this story.

Do not add:

- nominal income or spending;
- total aggregate quarterly spending;
- household wealth;
- consumer credit;
- debt-service measures;
- savings-rate changes;
- recession annotations;
- inflation overlays;
- historical percentile judgments;
- distributional estimates;
- forecasts;
- causal explanations for divergences.

## Deferred monthly-detail option

A later story may expose more current monthly data through:

- a frequency toggle;
- an expanded detail view; or
- a separate recent-momentum view.

That possibility should not influence the visible implementation in this story beyond avoiding an unnecessarily closed design.

Do not:

- preserve the old monthly comparison solely in anticipation of a toggle;
- build generic frequency-switching infrastructure;
- add hidden monthly requests or datasets to the card;
- add disabled controls or placeholders;
- combine quarterly and monthly observations in one line.

The monthly-detail idea should be recorded only as an explicit deferred product option in relevant documentation.

## Product meaning

The revised card should allow the reader to distinguish three conditions for each measure:

- growth above zero: the real per-capita level is higher than one year earlier;
- declining but still positive growth: the level is still rising, but more slowly;
- growth below zero: the real per-capita level is lower than one year earlier.

The chart must not imply that a downward-sloping line necessarily means income or spending levels are falling. The explanation should state that the chart shows **year-over-year growth rates**, not the underlying dollar levels.

Suggested explanation:

> Each line shows how much inflation-adjusted income or spending per person changed from the same quarter one year earlier. A falling line above zero means growth is slowing but the underlying level is still rising. A value below zero means the underlying level is lower than a year earlier.

The card should explain that:

- disposable income means income available after taxes and government transfers as defined in the national accounts;
- spending means real personal consumption expenditures per person;
- both measures are expressed at seasonally adjusted annual rates before growth is calculated;
- the comparison is national and aggregate;
- per-capita values do not describe the median household or show who gained or lost;
- spending can grow faster than income for a period through lower saving, asset use, borrowing, or differing behavior across households;
- this chart alone does not identify which mechanism explains a divergence.

## Card question and labels

### Question

> Are real household incomes and spending growing per person?

### Concise measure label

Use:

> Real income and spending per person

or another equally clear label consistent with the existing presentation registry.

### Series labels

Use:

- Real disposable income per person
- Real consumer spending per person

Avoid shortening the second line to merely “spending” where doing so could obscure that it is also per capita and inflation-adjusted.

## Latest-value presentation

The card should show the latest shared quarter and both year-over-year growth rates.

Recommended structure:

```text
Latest shared quarter: 2026 Q1

Real disposable income per person: +0.4%
Real consumer spending per person: +1.8%
```

Use actual generated values rather than these illustrative numbers.

If the current relationship-card component emphasizes one primary number, revise it narrowly so both measures have comparable visual weight. Do not choose one line as the sole headline merely because the component currently assumes one callout.

The card may show the spending-minus-income growth gap in percentage points as supporting text, but the gap must not replace the two actual rates.

Example:

```text
Spending growth exceeded income growth by 1.4 percentage points.
```

Do not label the gap “financial stress,” “overspending,” “unsustainable,” or “shortfall.”

## Derivation

For each source-level series, calculate exact-quarter year-over-year growth:

```text
growth_t = ((level_t / level_t-4 quarters) - 1) × 100
```

Requirements:

1. Look up the observation at the exact calendar quarter one year earlier.
2. Do not substitute the fourth previous array entry.
3. Missing current or prior-year endpoints produce `null`.
4. Internal quarter gaps remain gaps.
5. Leading unavailable growth observations are omitted after derivation.
6. Do not round before serialization.
7. Reject duplicate dates.
8. Preserve source precision through derivation.
9. Do not use FRED’s server-side percentage transformation.
10. Identify the source series accurately while stating that displayed growth is calculated locally.

The two generated growth series must then be aligned by exact quarter at the presentation boundary.

## History and range behavior

The quarterly source levels begin in 1947 Q1, so the locally derived growth series should normally begin in 1948 Q1.

Maximum must expose the fullest shared useful history, including:

- postwar expansion;
- the inflation shocks of the 1970s;
- the early-1980s recession and disinflation;
- later business cycles;
- the Great Recession;
- pandemic transfer distortions;
- the recent inflation episode.

Do not annotate or label those events in this story. Their presence in the visible history is sufficient.

Existing range controls should remain:

- 5 years;
- 10 years;
- 20 years;
- Maximum.

Anchor each range to the latest shared valid quarter.

Do not retain the current 2008 visual start under Maximum.

## Chart behavior

Reuse the existing two-line relationship-chart architecture.

The revised chart must:

- plot exact-quarter year-over-year growth for both series;
- use one shared percentage axis;
- include zero and retain the zero reference line;
- use actual observations without smoothing;
- preserve missing observations as disconnected gaps;
- avoid interpolation;
- avoid dual axes;
- use a solid line for income and a dashed line for spending, consistent with the current relationship convention unless implementation inspection identifies an established opposite mapping;
- provide a concise legend;
- update independently when the selected range changes;
- retain an accessible chart label;
- retain a factual text summary;
- retain a semantic recent-observations table;
- preserve card-level loading and failure isolation.

The chart must not use selected-range normalization. This is a growth-rate comparison, not a level-index comparison.

## Tooltip

For each shared quarter, show:

- formatted quarter;
- real disposable income per-person year-over-year growth;
- real consumer spending per-person year-over-year growth;
- spending-minus-income difference in percentage points.

Use wording that identifies each value as growth from the same quarter one year earlier.

Example:

```text
2026 Q1
Income per person: +0.4% from a year earlier
Spending per person: +1.8% from a year earlier
Gap: spending growth 1.4 percentage points higher
```

Do not show monthly dates or imply monthly precision.

## Accessible factual summary

The selected-range summary should state:

- selected period;
- latest shared quarter;
- first and latest growth rates for both measures;
- highest and lowest growth observations for each line;
- latest spending-minus-income difference.

It may state factual relationships such as:

- spending growth was higher than income growth at the latest observation;
- income growth was below zero;
- both growth rates were positive.

It must distinguish:

- a declining growth rate;
- a negative growth rate;
- a declining underlying level.

Do not use unsupported labels such as good, bad, healthy, unhealthy, alarming, sustainable, or crisis.

## Recent-observations table

Update the semantic table to quarterly observations.

Recommended columns:

- Quarter
- Real disposable income per person, year-over-year
- Real consumer spending per person, year-over-year
- Spending minus income, percentage points

Use approximately eight recent quarters unless current relationship-card conventions establish another count.

The table must receive pre-aligned presentation values. Do not calculate year-over-year growth or relationship gaps independently inside JSX.

## Data-refresh architecture

Add an explicit grouped derivation for:

- `A229RX0Q048SBEA`;
- `A794RX0Q048SBEA`.

Both source series should be fetched once as quarterly provider-published levels.

The refresh must:

- use full-history policy;
- request quarterly frequency if required by the current FRED client;
- omit FRED `units` transformations;
- validate provider responses as untrusted data;
- normalize FRED’s missing marker to `null`;
- sort chronologically without mutating the provider response;
- exclude future-dated observations;
- validate sufficient source history;
- derive exact-quarter year-over-year growth;
- validate both generated `EconomicSeries` values;
- stage both outputs;
- replace them through the established rollback-protected grouped-write pattern;
- preserve both previous valid output files if either source, derivation, validation, staging, or grouped replacement fails;
- report source counts, generated counts, coverage, latest values, transformations, and output paths.

The grouped write is appropriate because the two generated datasets jointly power one required relationship card and should remain a coherent snapshot.

Recommended generated identities:

```text
quarterly-real-disposable-income-per-capita-growth
quarterly-real-disposable-income-per-capita-growth.json

quarterly-real-consumer-spending-per-capita-growth
quarterly-real-consumer-spending-per-capita-growth.json
```

Use shorter names if repository conventions favor them, but preserve the quarterly and per-capita meaning clearly.

## Treatment of existing monthly datasets

Inspect current repository usage before removing anything.

The existing monthly sources may currently support only this card or may have other documentation and tests attached.

Required outcome:

- the visible household income-versus-spending card no longer loads the conceptually mismatched monthly pair;
- no dead repository registrations, presentation entries, fixtures, tests, or documentation remain;
- generated files that are no longer supported are removed if they have no other active use;
- refresh code does not continue fetching unused series without a documented reason.

Do not delete the monthly real disposable-income series if another active card or derivation uses it.

Do not preserve unused monthly spending solely for a hypothetical future toggle. Future monthly-detail work can restore or redesign the necessary source path deliberately.

Document any retained monthly dataset and its continuing purpose.

## Domain model

Reuse the existing `EconomicSeries` and `{ date, value }` observation shape.

The current model already supports:

- quarterly frequency;
- per-capita source levels;
- exact-quarter year-over-year derivation;
- multi-series relationship presentation;
- percentage-valued growth outputs.

No new domain fields should be required.

Keep:

- provider identity and native series metadata in the datasets;
- local transformation descriptions in dataset metadata;
- human-facing interpretation in the presentation registry;
- alignment and relationship differences outside JSX;
- chart-specific adaptation outside the domain objects.

Do not add a frequency enum value beyond the existing quarterly support.

## Provenance

The revised card must expose provenance separately for both measures.

### Income

- FRED as intermediary;
- U.S. Bureau of Economic Analysis as source;
- `A229RX0Q048SBEA`;
- quarterly;
- chained 2017 dollars;
- seasonally adjusted annual rate;
- source level beginning 1947 Q1;
- exact-quarter year-over-year growth calculated locally;
- generated coverage and retrieval date.

### Spending

- FRED as intermediary;
- U.S. Bureau of Economic Analysis as source;
- `A794RX0Q048SBEA`;
- quarterly;
- chained 2017 dollars;
- seasonally adjusted annual rate;
- source level beginning 1947 Q1;
- exact-quarter year-over-year growth calculated locally;
- generated coverage and retrieval date.

### Relationship

Document that:

- both measures are real and per capita;
- observations are aligned by exact calendar quarter;
- the spending-minus-income difference is calculated in percentage points from full-precision generated rates;
- the chart describes aggregate national per-person measures, not the median or average household experience;
- growth-rate movement does not always imply the same direction of movement in the underlying level.

## Documentation updates

Update the relevant durable documentation to reflect:

- the quarterly per-capita source pair;
- the reason the monthly comparison was replaced;
- full history beginning with derived observations around 1948;
- exact-quarter derivation and alignment;
- quarterly tooltip, summary, and table behavior;
- the removal or continued purpose of old monthly datasets;
- the deferred possibility of a monthly detail view;
- current supported-series configuration;
- generated coverage;
- visible-card and supporting-series counts;
- bundle impact if it changes materially.

Update Epic 02 or its story map to include Story 13A as a completed corrective story only after implementation, verification, commit, and push.

Do not renumber Stories 14–21.

## Tests

Add or revise deterministic tests covering at least the following.

### Source configuration and refresh

1. Income uses `A229RX0Q048SBEA`.
2. Spending uses `A794RX0Q048SBEA`.
3. Both use quarterly frequency, full history, provider-published real per-capita levels, and no FRED units transformation.
4. Both identify BEA accurately.
5. Valid source observations generate validated year-over-year growth series.
6. The first generated growth observation occurs only after an exact prior-year quarter exists.
7. FRED missing markers remain `null`.
8. Invalid dates, duplicate quarters, malformed values, future observations, and insufficient history fail safely.
9. Source ordering does not affect chronological generated output.
10. Both previous output files survive any grouped refresh failure.
11. No browser-side provider request is introduced.

### Exact-quarter derivation

12. Growth uses the exact same quarter one year earlier.
13. Missing calendar quarters are not replaced by array position.
14. A level increase from 100 to 105 produces 5% growth.
15. A level decline from 100 to 99 produces −1% growth.
16. Internal gaps remain `null`.
17. Full precision is retained before serialization and formatting.
18. Input observations are not mutated.

### Relationship alignment

19. Income and spending are aligned by exact quarter.
20. A quarter present in only one series does not become falsely paired.
21. The latest shared valid quarter anchors all ranges.
22. Spending-minus-income is calculated in percentage points from full-precision values.
23. Maximum begins at the earliest shared valid derived quarter rather than 2008.
24. The 1970s fall within Maximum coverage.
25. Missing values remain chart gaps.

### Presentation

26. The card asks “Are real household incomes and spending growing per person?”
27. Both visible line labels explicitly communicate per-capita meaning.
28. The explanation distinguishes slowing positive growth from negative growth.
29. The latest callout presents both measures for the latest shared quarter.
30. The chart uses one shared zero-inclusive percentage axis.
31. No monthly date labels remain in the revised card.
32. Tooltip values identify year-over-year quarterly growth.
33. The semantic table uses quarters.
34. The accessible summary updates with selected range.
35. Range controls remain keyboard accessible and expose `aria-pressed`.
36. Loading and failure remain isolated to the card.
37. No frequency toggle or monthly detail UI is rendered.
38. Existing unrelated cards retain their behavior.
39. Copy does not claim to represent the median household or every household.
40. Copy does not treat a falling positive growth line as a falling underlying level.

### Cleanup

41. Obsolete monthly card registrations and presentation references are removed.
42. No unused monthly refresh configuration remains unless another active feature uses it.
43. Removed generated files are no longer referenced.
44. Relevant documentation and story status are accurate.

Use existing fixture and test conventions. Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- the existing household card is replaced rather than duplicated;
- the question explicitly says “per person”;
- the latest shared period is displayed as a quarter;
- both lines refer to real per-capita measures;
- Maximum reaches back to approximately 1948;
- the 1970s are visible in Maximum;
- 5-year, 10-year, and 20-year views remain readable;
- zero remains visually meaningful;
- a falling line above zero is not described as a declining level;
- a line below zero is clearly understandable as a year-over-year decline;
- tooltips show the correct quarter and both rates;
- the semantic table contains quarterly observations;
- internal missing observations remain disconnected;
- the chart works at desktop and narrow widths;
- keyboard interaction and focus styling remain intact;
- canvas failure leaves the explanation, summary, metadata, and table usable;
- simulated source failure remains isolated;
- no monthly toggle, placeholder, or hidden second chart appears.

Perform an explicit conceptual review:

- A reader should understand that both lines are inflation-adjusted and per person.
- A reader should understand that the chart shows growth rates, not dollar levels.
- A reader should understand that a downward line can still represent positive growth.
- A reader should understand that a value below zero means the underlying real per-capita level is below its year-earlier value.
- A reader should not infer that the aggregate measure describes every household.
- A reader should be able to compare the present with the inflationary 1970s.

## Required verification

Run the complete repository verification required by `AGENTS.md`, including:

```text
npm run lint
npm run typecheck
npm test
npm run data:refresh
npm run build
git diff --check
```

Also:

- inspect refresh reporting for both quarterly source and generated series;
- confirm source coverage begins in 1947 and generated growth coverage begins around 1948;
- inspect Maximum in a real browser;
- inspect the generated JSON and final diff;
- verify obsolete monthly paths are removed or explicitly justified;
- inspect production bundle output;
- stop temporary servers and processes;
- confirm no credentials, provider payloads, screenshots, logs, or unrelated files are committed.

## Completion and Git requirements

Before completion:

1. Confirm only Story 13A scope was implemented.
2. Confirm the existing card now compares like with like.
3. Confirm both series are quarterly, real, and per capita.
4. Confirm Maximum exposes full shared useful history.
5. Confirm no monthly-detail UI or speculative frequency infrastructure was added.
6. Confirm all required checks pass.
7. Create one focused conventional-style commit.
8. Push to the configured GitHub remote without force.
9. Confirm the local branch is synchronized with its upstream.
10. Confirm the working tree is clean.

The completion report must include every item required by `AGENTS.md`, including:

- implementation summary;
- source and product decisions;
- treatment of the previous monthly datasets;
- quality checks, refresh results, and browser verification;
- generated coverage;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status;
- deferred monthly-detail option and any other known limitations.

End the completion report with:

```text
ALL DONE WITH USER STORY 13A
```

## Acceptance criteria

Story 13A is complete when:

- the household income-versus-spending card uses quarterly real disposable income per capita and quarterly real consumer spending per capita;
- income uses FRED `A229RX0Q048SBEA`;
- spending uses FRED `A794RX0Q048SBEA`;
- both year-over-year growth rates are calculated locally using exact prior-year quarters;
- the question explicitly asks whether income and spending are growing per person;
- the prior per-capita-versus-total mismatch is eliminated;
- Maximum exposes shared history beginning around 1948 and includes the 1970s;
- the chart clearly distinguishes slowing growth from negative growth;
- observations align by exact quarter;
- missing values remain missing;
- accessible summaries, semantic tables, tooltips, range controls, and isolated failures follow established behavior;
- obsolete monthly comparison paths are removed or retained only for a documented active use;
- no monthly toggle or speculative frequency infrastructure is added;
- relevant documentation and Epic 02 status are current;
- all required checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
