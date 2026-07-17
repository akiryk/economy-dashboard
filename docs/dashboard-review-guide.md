# Phase 1 dashboard review guide

## Purpose

Phase 1 is a broad, descriptive briefing on the U.S. economy. It is designed to show what major indicators say, how they compare with their own history, and what each measure leaves out. It does not produce an economic score, investment recommendation, forecast, political verdict, or causal explanation.

Use this guide to decide which parts of the completed product are most useful and what objective should govern the next phase.

## Reading the measures

- **Level:** the amount or rate observed in a period, such as unemployment or capacity utilization.
- **Growth rate:** the percentage change between two levels. Most annual growth cards compare an observation with the exact month or quarter one year earlier.
- **Index:** a relative scale rather than native physical units. Productivity and manufacturing indexes emphasize change from a baseline.
- **Percentage:** a share of a total, such as the saving rate or debt service relative to income.
- **Percentage point:** the arithmetic difference between two percentages. A move from 3% to 4% is one percentage point, not one percent.
- **Annualized rate:** a shorter-period pace expressed as if it continued for a year. It is not a forecast that the pace will continue.

A falling line does not always mean the underlying level is falling. If year-over-year growth declines from 4% to 2%, the level is still higher than a year earlier, but it is rising more slowly. A negative growth rate means the level is below its year-earlier value.

## Using history and zoom

Each card offers 5-year, 10-year, 20-year, and Maximum presets. The preset chooses the economic comparison period. Maximum shows the full useful history available for that specific source, so different cards begin in different years.

The historical zoom controls change only the visible window inside the chosen preset. They do not change the latest callout, recalculate economic values, or rebase selected-range indexes. Use Reset zoom to restore the complete preset.

Missing observations remain gaps. The charts do not smooth or invent values between published observations.

## Reading a card without relying on the chart

Every card includes:

1. a human question and latest value;
2. the observation period and units;
3. a factual summary of the visible range;
4. “What this tells you” and “What this leaves out” explanations;
5. related indicators to consider;
6. a visible source link;
7. series details covering identifier, frequency, units, seasonal adjustment, transformation, retrieval date, and coverage; and
8. a semantic table of recent observations.

Relationship cards align sources by exact calendar period. The manufacturing comparison normalizes two different native units to a shared baseline; it is not a productivity calculation.

## Why indicators can disagree

Economic measures describe different populations, concepts, periods, and mechanisms. GDP can grow while output per person falls. Payrolls can rise while unemployment also rises if the labor force grows. Nominal wages can accelerate while real wages weaken if inflation accelerates more. Household spending can remain firm while saving falls. High capacity utilization can reflect strong demand, constrained capacity, or both.

Mixed evidence is useful information. The dashboard intentionally does not resolve it with red/green labels or a composite score.

## Suggested cross-card questions

- Is aggregate real GDP growth stronger or weaker than real growth per person?
- Are productivity gains contributing to growth, and is their pace accelerating?
- Do headline, core, and short-term inflation momentum tell the same story?
- Do unemployment, prime-age employment, and payroll growth agree about labor conditions?
- Are nominal wage gains exceeding inflation, and for which worker population?
- Are real income and spending moving together, and what are saving and debt service doing?
- Are housing affordability and construction responding in the same direction?
- Are manufacturing output, employment, business investment, and capacity utilization confirming one another?
- How do short- and long-term rates compare, and are broad credit conditions also tight?
- How do the annual deficit and accumulated debt-to-GDP ratio differ?
- Is the trade balance changing at the same time as the effective customs-duty burden, without assuming one caused the other?

## Interpretation cautions

- Compare latest periods before comparing values; publication schedules differ.
- National aggregates do not describe every household, worker, firm, region, or industry.
- Revised historical data are not the same as the information available in real time.
- Correlation or visual coincidence does not establish causation.
- A trade deficit, budget deficit, high capacity use, or low credit index is not automatically good or bad without a defined question and context.
- See [`phase-1-limitations.md`](phase-1-limitations.md) for the accepted limitations register.

## Product-review worksheet

For each section or card, record:

| Prompt | Notes |
|---|---|
| Does the card answer its stated question clearly? | |
| Is the latest value appropriately prominent? | |
| Can the measure be interpreted without opening technical details? | |
| Is an important limitation missing or overemphasized? | |
| Does another card make this one redundant? | |
| Would a direct comparison with another measure improve understanding? | |
| Does the available history support the intended use? | |
| Keep, reframe, combine, demote, or remove? | |

After reviewing all sections, ask:

- Which cards are clearest and most useful?
- Which remain difficult to interpret?
- Which relationships deserve a direct comparison?
- Which latest values deserve more or less emphasis?
- Which sections feel incomplete despite meeting Phase 1 scope?
- Which accepted limitations most reduce usefulness?
- What important questions remain unanswered?
- What user decision should Phase 2 primarily support?

## Candidate Phase 2 themes

These are options for product-owner review, not commitments or ranked priorities:

- historical percentile or median context;
- forecasts versus outcomes;
- data vintages and revisions;
- event and recession annotations;
- normalized payroll growth;
- monthly detail for selected quarterly topics;
- direct relationship exploration;
- regional or distributional views;
- automated refresh and release monitoring;
- a focused visual redesign after product review.

The broader objective-based alternatives—economic briefing, investment conditions, historical policy analysis, household welfare, and business conditions—are compared in [`product-overview.md`](product-overview.md).
