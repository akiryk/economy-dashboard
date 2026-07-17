# Story 16: Compare Manufacturing Output and Employment

## Status

Complete.

## User story

As a dashboard reader, I want to compare how much U.S. manufacturing produces with how many people it employs, so that I can see whether manufacturing output and manufacturing jobs are moving together or diverging over time.

## Product question

**Are manufacturing output and jobs moving together?**

This story adds one relationship card to a new **Business and manufacturing** section.

The card must compare:

- real manufacturing output; and
- manufacturing payroll employment.

These measures answer a useful structural question, but the card must not overstate what their relationship proves. A divergence between output and employment may reflect productivity, automation, changes in hours, industry composition, outsourcing, offshoring, business cycles, or measurement differences. This card does not independently isolate any one cause.

## Source decision

Use FRED as the intermediary for both official monthly series.

### Manufacturing output

- **FRED series:** `IPMAN`
- **Provider title:** Industrial Production: Manufacturing (NAICS)
- **Underlying publisher:** Board of Governors of the Federal Reserve System
- **Frequency:** Monthly
- **Units:** Index, currently expressed by the provider relative to its published base year
- **Seasonal adjustment:** Seasonally adjusted
- **Transformation:** Provider-published real-output index; no FRED units transformation
- **History policy:** Full useful available history

The Federal Reserve’s industrial-production index measures the real output of relevant U.S. manufacturing establishments. Use the NAICS-based manufacturing series, not the discontinued or legacy SIC variants.

### Manufacturing employment

- **FRED series:** `MANEMP`
- **Provider title:** All Employees, Manufacturing
- **Underlying publisher:** U.S. Bureau of Labor Statistics
- **Program:** Current Employment Statistics
- **Frequency:** Monthly
- **Units:** Thousands of persons
- **Seasonal adjustment:** Seasonally adjusted
- **Transformation:** Provider-published payroll-employment level; no FRED units transformation
- **History policy:** Full useful available history

`MANEMP` measures employees on manufacturing payrolls. It does not include every person who performs manufacturing-related work, self-employed workers, or workers classified in nonmanufacturing industries even when their work supports manufacturers.

## Scope

Create a new **Business and manufacturing** section containing exactly one card:

```text
Manufacturing output versus employment
```

This story must:

- add `IPMAN` and `MANEMP` to the established FRED refresh workflow;
- generate and commit validated local datasets;
- register both series in the local repository;
- align the two monthly series by exact calendar month;
- compare them through selected-range normalization rather than incompatible native units or dual axes;
- add explicit human-facing presentation copy;
- preserve accessible summaries, semantic observations, independent loading, and isolated failure behavior;
- update Epic 02 to reflect the verified completion of Stories 15 and 16.

Do not add:

- manufacturing productivity as a separately calculated ratio;
- manufacturing hours;
- manufacturing wages;
- capacity utilization;
- total industrial production;
- business investment;
- durable-goods orders;
- purchasing-manager or diffusion indexes;
- factory construction;
- regional manufacturing;
- manufacturing exports;
- separate durable and nondurable manufacturing cards;
- recession shading or event annotations.

Industrial production or capacity utilization and business investment remain Story 17 scope.

## Product rationale

Manufacturing output and manufacturing employment are frequently discussed as though they measure the same thing. They do not.

- Manufacturing output measures the inflation-adjusted quantity of goods produced.
- Manufacturing employment measures payroll jobs in establishments classified as manufacturing.

The relationship card should make it possible to see periods when:

- output and employment rise together;
- output rises while employment falls or remains flat;
- employment rises faster than output;
- both fall during contractions;
- one series recovers faster than the other.

The card must preserve those observations without assigning a political or normative verdict.

Do not describe divergence as proof that:

- automation eliminated jobs;
- trade caused job losses;
- productivity necessarily improved;
- manufacturing is disappearing;
- manufacturing is booming;
- employment changes were good or bad.

Those conclusions require additional evidence beyond these two series.

## Section

Add a visible **Business and manufacturing** section only when the card has real, validated data.

Recommended section description:

> Manufacturing output and employment describe different dimensions of the sector. Comparing them shows whether production and payroll jobs have moved together, without assuming that either one alone captures manufacturing’s overall condition.

Place this section after **Housing** and before future financial-conditions or government sections.

Do not render empty placeholders for Story 17 indicators.

## Card

### Question

Use:

> Are manufacturing output and jobs moving together?

### Measure label

Use a concise label such as:

> Manufacturing output versus employment

### Supporting explanation

The explanation must state that:

- output is the Federal Reserve’s inflation-adjusted manufacturing production index;
- employment is BLS manufacturing payroll employment;
- the chart rebases both series to 100 at the first shared valid observation in the selected range;
- values above 100 show cumulative growth from that selected-range baseline and values below 100 show cumulative decline;
- rebasing changes the comparison baseline, not the underlying source data;
- the two lines do not directly measure manufacturing productivity;
- employment counts jobs rather than hours worked;
- aggregate national results can conceal large differences across manufacturing industries and regions.

Use plain language to explain the normalization. Do not require readers to understand index-number terminology before they can interpret the chart.

Suggested wording:

> Both lines begin at 100 in the selected period so their paths can be compared despite different native units. A value of 110 means that measure is 10% above its starting level for the selected range.

### Latest relationship callout

The primary callout should describe the relationship rather than elevate one source series as the card’s sole headline number.

Recommended structure:

```text
Since [baseline period]:
Output [signed cumulative change]
Jobs [signed cumulative change]
```

For example:

```text
Since June 2006:
Output +18.4%
Jobs −9.7%
```

Keep the callout compact and visually subordinate neither line by arbitrary ordering or color emphasis.

If the existing relationship-card pattern requires one principal value, use the **difference between the two cumulative changes in percentage points** only if it is clearly labeled as a comparison gap and does not imply a productivity rate. Prefer displaying the two cumulative changes directly if the current component architecture supports it cleanly.

Do not persist selected-range cumulative changes as datasets. Calculate them at the presentation boundary from full-precision aligned source observations.

### Chart transformation

The two source series have incompatible native units:

- output is an index;
- employment is thousands of jobs.

Do not plot their native values on one axis and do not use dual axes.

For each selected range:

1. Align observations by exact calendar month.
2. Preserve only months represented in both series for the relationship view.
3. Identify the first shared valid month within the selected range.
4. Normalize each series independently to `100` at that month.
5. For each later valid observation, calculate:

```text
normalized value = current source value / baseline source value × 100
```

6. Preserve an internal gap as `null` when either source value required for that plotted line is unavailable.
7. Never substitute array position for calendar alignment.
8. Never interpolate or bridge missing months.
9. Never round before charting or calculating cumulative changes.

The selected range must anchor to the latest shared valid month.

Maximum must use the fullest overlapping comparable history of the two current official series. It must not imply that either source begins at the shared start date.

### Baseline behavior

The baseline is the first shared valid observation actually displayed in the selected range.

Changing from 5 years to 20 years or Maximum will therefore change the normalization baseline and the cumulative-change callout. Make that behavior explicit in the chart summary or supporting copy.

If a requested range begins between monthly observations, use the first shared valid monthly observation on or after the range boundary.

If either baseline value is zero, missing, invalid, or nonpositive, fail the relationship transformation visibly rather than calculating an invalid normalized series. Neither expected source series should contain a zero level, but the calculation must still be defensive and tested.

### Line identity

Use:

- a solid line for manufacturing output;
- a dashed line for manufacturing employment.

Use one shared normalized axis.

The legend and tooltip must identify both measures unambiguously. Do not rely on color alone.

Do not label the normalized axis with the provider’s native base year. Use a label such as:

```text
Selected-range baseline = 100
```

### Tooltip

For each aligned month, show:

- formatted month;
- normalized manufacturing-output value;
- output cumulative percentage change since the displayed baseline;
- normalized manufacturing-employment value;
- employment cumulative percentage change since the displayed baseline.

The tooltip may additionally show the gap between cumulative changes in percentage points if clearly labeled.

Do not show a ratio of output to employment or call the gap “productivity.”

### Chart behavior

The card must:

- reuse the shared relationship-chart architecture where it fits;
- render actual monthly observations without smoothing;
- use one shared normalized axis;
- avoid dual axes;
- avoid forcing zero, because the meaningful baseline is 100 and forcing zero would compress the comparison;
- include a reference line at 100 if the existing chart architecture can add it without broad or brittle changes;
- support 5-year, 10-year, 20-year, and Maximum ranges;
- anchor ranges to the latest shared valid month;
- preserve gaps;
- include an accessible factual summary;
- include a semantic recent-observations table;
- retain usable metadata and explanation if canvas rendering fails;
- isolate its loading or failure from all other cards.

### Factual summary

The accessible summary should state:

- the selected range;
- the baseline month;
- each measure’s cumulative change from the baseline to the latest shared month;
- whether the measures moved in the same or opposite directions over the complete selected interval;
- the latest shared observation month.

It may describe one cumulative change as larger or smaller than the other.

It must not infer why the paths diverged or label the result strong, weak, good, bad, healthy, or unhealthy.

### Recent-observations table

Provide a semantic recent-observations table aligned by exact month.

Recommended columns:

- Month
- Manufacturing output, source index
- Manufacturing employment, thousands
- Output, selected-range index
- Employment, selected-range index

If including both native and normalized values makes the table too dense, prioritize the native values because those preserve direct source observations, and explain the chart normalization in the caption. Follow the current relationship-card convention after inspecting the implementation.

Do not recalculate economic values independently in the table component. Supply a pre-aligned presentation model.

## Data refresh

Extend the existing FRED configuration with two explicit entries.

### `IPMAN`

The refresh must:

- request `series_id=IPMAN`;
- request monthly frequency if the current client requires it;
- use full-history policy;
- omit a FRED `units` transformation;
- preserve the provider-published seasonally adjusted index;
- validate provider data under existing rules;
- normalize FRED’s missing marker to `null`;
- reject invalid dates, duplicate dates, malformed values, and insufficient history;
- exclude observations after retrieval;
- construct and validate a complete `EconomicSeries`;
- atomically replace only the prior valid output file after validation;
- preserve the prior file on any failure;
- report series identifier, source count, coverage, latest observation, and output path.

Recommended identity:

```text
manufacturing-output
manufacturing-output.json
```

### `MANEMP`

The refresh must:

- request `series_id=MANEMP`;
- request monthly frequency if required;
- use full-history policy;
- omit a FRED `units` transformation;
- preserve the provider-published seasonally adjusted employment level in thousands;
- follow the same validation, missing-value, future-date, safe-replacement, and reporting rules as other direct FRED series.

Recommended identity:

```text
manufacturing-employment
manufacturing-employment.json
```

### Failure behavior

The two direct source files may refresh independently under the established architecture.

A failure of one source must:

- preserve that source’s previous valid file;
- not corrupt or delete the other source;
- produce a nonzero overall refresh result under current conventions;
- leave the browser able to use previously committed valid data.

At runtime, the relationship card requires both valid series. If either cannot load or validate, show the card’s existing visible failure state while leaving every other card usable.

Do not introduce a grouped atomic write merely because the two series are displayed together; no multi-source derived dataset is being persisted.

## Data model and repository

Reuse the existing `EconomicSeries` and `{ date, value }` observation model.

Each source dataset must preserve its own:

- provider;
- provider series identifier;
- title;
- description;
- units;
- frequency;
- seasonal adjustment;
- transformation;
- coverage;
- retrieval date;
- observations.

Register both slugs explicitly in the local repository.

Do not persist:

- aligned month pairs;
- selected-range normalized values;
- cumulative changes;
- output-minus-employment gaps;
- output-per-worker ratios.

Those are presentation calculations and should remain outside source metadata and generated JSON.

If the current relationship presentation model can be reused, extend it narrowly. Do not build a generic arbitrary-series comparison engine unless existing duplication demonstrates that such an abstraction is now warranted.

## Charting implications

The current chart architecture already supports:

- two aligned percentage series;
- one shared axis;
- legends;
- factual summaries;
- range controls;
- selected-range normalization for the productivity-level card.

Story 16 should compose these existing capabilities rather than duplicate them.

A narrow new option builder or discriminated chart variant may be appropriate for a two-series normalized-level comparison.

Do not:

- add dual-axis support;
- add arbitrary mixed-unit plotting;
- place normalization logic inside JSX;
- mutate domain observations;
- silently label normalized values with native source units;
- change prior card behavior unnecessarily.

Document the new chart variant and its baseline semantics in `charting.md`.

## Provenance

The card must expose provenance for both sources.

### Output provenance

- FRED as intermediary;
- Board of Governors of the Federal Reserve System as underlying publisher;
- `IPMAN`;
- Industrial Production: Manufacturing (NAICS);
- monthly;
- seasonally adjusted;
- provider-published real-output index;
- full generated coverage;
- retrieval date.

### Employment provenance

- FRED as intermediary;
- U.S. Bureau of Labor Statistics as underlying publisher;
- Current Employment Statistics program;
- `MANEMP`;
- monthly;
- seasonally adjusted;
- thousands of persons;
- provider-published payroll-employment level;
- full generated coverage;
- retrieval date.

### Relationship provenance

Document that:

- dates are aligned by exact calendar month;
- both lines are normalized independently to 100 at the first shared valid observation in the selected range;
- normalization and cumulative changes are calculated locally at presentation time;
- no output-per-worker or productivity measure is calculated;
- native source values remain available in metadata or the semantic table.

## Epic and documentation updates

Update Epic 02 based on verified repository state:

- mark Story 15 complete;
- mark housing affordability and construction complete;
- mark Story 16 complete only after implementation, verification, commit, and push;
- mark manufacturing output versus manufacturing employment complete at that time;
- leave Story 17 and later stories planned.

Update relevant durable documentation:

- add the Business and manufacturing section to product organization;
- add `IPMAN` and `MANEMP` to supported refresh-series documentation;
- document the selected-range two-series normalization;
- document exact-month alignment and baseline behavior;
- document axis, legend, tooltip, summary, and table behavior;
- update visible-card and supporting-series counts;
- add generated coverage and measured bundle impact after implementation.

Correct directly relevant stale status or count references encountered during the work. Do not broaden Story 16 into a general documentation cleanup.

## Tests

Add deterministic tests covering at least the following.

### Source configuration and refresh

1. `IPMAN` is configured as a monthly, full-history, provider-published seasonally adjusted index with no FRED units transformation.
2. `MANEMP` is configured as a monthly, full-history, provider-published seasonally adjusted level in thousands with no FRED units transformation.
3. Each source validates and writes independently.
4. FRED missing markers remain `null`.
5. Invalid dates, malformed values, duplicate months, future observations, and insufficient history fail safely.
6. Source ordering does not affect chronological output.
7. Failure preserves each prior valid file.
8. Failure of one source does not remove or overwrite the other source’s valid file.
9. The local repository resolves and validates both new slugs.
10. No browser-side FRED request is introduced.

### Alignment and normalization

11. Series are aligned by exact calendar month, not array position.
12. Months present in only one source do not become falsely paired.
13. The selected range anchors to the latest shared valid month.
14. The first shared valid observation in the selected range becomes 100 for each line.
15. A source value 10% above its baseline normalizes to 110.
16. A source value 10% below its baseline normalizes to 90.
17. Full precision is retained before formatting.
18. Changing the selected range changes the baseline and callout deterministically.
19. Internal missing values remain gaps and are not bridged.
20. Missing or invalid baseline values fail visibly.
21. Input observations are not mutated.
22. Maximum uses the fullest shared comparable history.
23. Cumulative percentage changes match the normalized latest values minus 100.
24. Any comparison gap is calculated in percentage points and never labeled productivity.

### Presentation

25. The Business and manufacturing section appears after Housing.
26. The section contains exactly one Story 16 card.
27. The question is “Are manufacturing output and jobs moving together?”
28. Output uses a solid line and employment a dashed line.
29. The chart uses one normalized axis and no dual axis.
30. The axis and copy identify the selected-range baseline as 100.
31. The 100 reference line appears if implemented.
32. The latest callout displays both cumulative changes and the baseline period.
33. Tooltip values and labels match the aligned month and baseline.
34. The factual summary reports only defensible interval facts.
35. The semantic table preserves source units or clearly identifies normalized values.
36. Range controls remain keyboard accessible and expose `aria-pressed`.
37. Card loading and failure remain isolated.
38. Existing cards retain their prior behavior.
39. No Story 17 indicator or out-of-scope manufacturing measure is rendered.
40. Copy does not claim that divergence proves automation, trade effects, productivity, strength, or weakness.

Use the repository’s established fixtures and testing conventions. Avoid brittle snapshots.

## Browser verification

Verify in a real browser that:

- the Business and manufacturing section appears in the intended order;
- no empty future business card is shown;
- the card question matches the chart;
- both lines visibly begin at 100 for each selected range;
- changing ranges changes the baseline and callout coherently;
- Maximum shows the full shared comparable history;
- the legend clearly distinguishes output from employment;
- line identity does not rely on color alone;
- no dual axis appears;
- the 100 baseline is understandable;
- the tooltip reports the correct month and values;
- missing observations remain disconnected;
- the chart is readable at desktop and narrow widths;
- the accessible summary updates with the range;
- the recent table remains understandable without the canvas;
- metadata accurately names both providers and transformations;
- simulated failure of either source affects only this card;
- all existing sections and cards remain usable.

Perform an explicit product-meaning review:

- A reader should understand that the lines show relative change since the selected range began.
- A reader should not mistake the normalized chart values for the native Federal Reserve or BLS units.
- A reader should understand that output and jobs can diverge.
- A reader should not conclude from this card alone why they diverged.
- A reader should not interpret the comparison as a manufacturing-productivity calculation.

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

- inspect refresh output for both new series;
- confirm generated coverage and latest dates;
- inspect the generated JSON and final diff;
- inspect production bundle output;
- complete the browser checks above;
- stop temporary servers and processes;
- confirm no credentials, temporary provider responses, screenshots, logs, or unrelated changes are included.

## Completion and Git requirements

Before completion:

1. Confirm only Story 16 scope was implemented.
2. Confirm Story 15 and the stale Epic 02 statuses are accurate.
3. Confirm the card’s question matches its actual transformation and visual behavior.
4. Confirm both source datasets contain full useful available history.
5. Confirm all tests and required checks pass.
6. Create one focused conventional-style commit.
7. Push to the configured GitHub remote without force.
8. Confirm the local branch is synchronized with its upstream.
9. Confirm the working tree is clean.

The completion report must include every item required by `AGENTS.md`, including:

- implementation summary;
- source, transformation, and product decisions;
- deviations or limitations;
- quality checks, refresh results, and browser verification;
- commit hash and message;
- branch and remote;
- push result;
- final working-tree status;
- known concerns for Story 17.

End the completion report with:

```text
ALL DONE WITH USER STORY 16
```

## Acceptance criteria

Story 16 is complete when:

- a real Business and manufacturing section exists;
- it contains one manufacturing-output-versus-employment card;
- manufacturing output uses FRED `IPMAN`;
- manufacturing employment uses FRED `MANEMP`;
- both source datasets refresh outside the browser into validated committed JSON;
- the relationship aligns observations by exact month;
- both series normalize to 100 at the first shared valid observation in the selected range;
- the chart uses one shared axis and no dual axes;
- the latest callout communicates both cumulative changes from the selected baseline;
- Maximum shows the fullest shared comparable history;
- native source provenance and units remain available;
- missing observations remain missing;
- the card does not calculate or imply manufacturing productivity;
- the card does not infer why output and employment diverge;
- accessible chart summaries, semantic tables, range controls, and isolated failures follow established behavior;
- no Story 17 or out-of-scope indicator was added;
- Epic 02 and relevant documentation are current;
- all required checks pass;
- the focused commit is pushed;
- the branch is synchronized and the working tree is clean.
