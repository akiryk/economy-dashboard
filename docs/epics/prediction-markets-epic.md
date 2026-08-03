# Epic: Add a Prediction Markets Section

**Status:** Proposed
**Product area:** U.S. Economy Dashboard
**Initial placement:** Bottom of the main homepage under a distinct **Prediction Markets** heading
**Future placement:** May move to a dedicated page after the section has been evaluated

## Epic objective

Add a clearly separated, forward-looking section that shows what prediction-market participants currently expect for selected U.S. economic outcomes and how those expectations have changed.

The existing dashboard is primarily descriptive and historically grounded: it explains what is happening now and how current readings compare with the past. This epic adds a different kind of evidence. Prediction-market prices do not measure the economy directly; they reflect the evolving prices of contracts that settle on specified future outcomes.

The section must therefore remain visually and conceptually distinct from the existing economic-indicator sections. It may reuse existing layout, charting, data-access, accessibility, and disclosure primitives where appropriate, but it should not automatically inherit the compact historical-band card design.

## User need

A reader should be able to answer:

1. **What inflation rate does the market expect next?**
2. **How much growth does the market expect this year?**
3. **How likely is a U.S. recession?**
4. **Are those expectations becoming more optimistic, more pessimistic, or remaining broadly stable?**

The first three questions are the initial product scope. The fourth is a shared contextual requirement rather than a separate card: each forecast should show how the estimate or probability has moved over a meaningful recent period whenever adequate market history is available.

## Product principles

### Keep prediction evidence separate from observed economic data

The section must be labeled **Prediction Markets** and introduced with brief copy explaining that the figures are market-implied expectations, not government statistics, official forecasts, or guarantees.

The section should not use wording such as “the market knows” or “the economy will.” Preferred language includes:

- “Prediction-market estimate”
- “Market-implied probability”
- “Traders currently assign…”
- “The market estimate has risen/fallen…”

### Ask one useful question per module

Each module should lead with one plain-language question and one primary answer. Avoid redundant questions when one answer already supplies the relevant direction. For example, a card showing current inflation of 3.5% and a market forecast of 2.9% does not also need a separate “Will inflation fall?” card.

### Show movement in expectations instead of historical percentile bands

Historical percentile bands are not a default for this section. A prediction-market price belongs to a specific contract, definition, and horizon, and its own trajectory is generally more meaningful than its position within a long-run distribution.

Where history is available, show:

- the current estimate or probability;
- the change over a defined recent interval;
- a line showing how the estimate has evolved;
- the full period for which the current contract or reconstructed forecast is valid.

Do not splice unrelated contracts into a continuous series unless the methodology is explicit, validated, and economically comparable.

### Preserve contract meaning

Every displayed figure must remain tied to the exact settlement terms used by the source market. The interface must expose:

- source platform;
- contract or event title;
- forecast horizon or settlement date;
- settlement authority and statistic;
- relevant units and transformation;
- current bid, ask, or midpoint methodology;
- volume, open interest, spread, or another available liquidity indicator;
- retrieval timestamp;
- limitations.

These details may appear under **More** or an equivalent disclosure, but the horizon must remain visible in the default view whenever omitting it would make the headline ambiguous.

## Initial modules

## 1. What inflation rate does the market expect next?

### User-facing question

**What inflation rate does the market expect next?**

### Primary answer

A single market-implied estimate for the next scheduled headline CPI release, expressed in the same terms as the corresponding observed CPI comparison.

Example:

> **2.9%**
> Market estimate for the next 12-month CPI reading
> Current published rate: 3.5%

### Required context

- The reference month and release date.
- Whether the contract resolves on headline CPI, core CPI, month-over-month CPI, or year-over-year CPI.
- The latest comparable official CPI observation.
- A direct comparison such as `0.6 percentage point below the current rate` when the units and definitions match.
- The change in the market estimate over a recent interval, if reconstructable.
- A distribution or likely range under expanded content when the underlying contracts support it.

### Derivation

The source may not publish one explicit expected value. Kalshi commonly represents numerical releases through a family of threshold or range contracts. The implementation may therefore need to:

1. retrieve every relevant contract within the event;
2. obtain current bid and ask data;
3. convert contract prices into a coherent probability distribution;
4. validate that cumulative threshold probabilities are monotonic;
5. derive a median, mean, or modal range using a documented rule;
6. preserve the raw contract probabilities for audit and expanded display.

The initial research story must choose the most defensible headline statistic. Do not label a modal bucket midpoint as an “expected rate” unless the methodology justifies that wording. A range such as **2.8%–3.0% most likely** is preferable when a precise point estimate would imply false precision.

### Historical view

A historical line is desirable but is a second-order requirement because it requires reconstructing the distribution from historical prices for all constituent contracts at each observation time. If adequate history cannot be derived reliably, the first version may show the current forecast and distribution without a trend line, with that limitation stated explicitly.

## 2. How much growth does the market expect this year?

### User-facing question

**How much growth does the market expect this year?**

### Primary answer

A single market-implied annual real-GDP growth estimate or most likely range.

Example:

> **1.5%–2.0%**
> Most likely range for 2026 real GDP growth

### Required context

- The calendar year or other forecast horizon.
- The precise GDP definition used for settlement.
- Whether growth means annual-average growth, fourth-quarter-over-fourth-quarter growth, or another measure.
- The most comparable currently published official observation, only when definitions are compatible.
- The change in the market forecast over a recent interval.

### Derivation

As with inflation, the market may provide range or threshold contracts rather than one point estimate. The implementation must construct and validate a probability distribution before deriving a headline value or range.

The default display must not compare incompatible measures. For example, a full-year annual-average contract should not be directly contrasted with the dashboard’s latest year-over-year quarterly GDP figure without plainly labeling the difference.

### Historical view

Show how the estimate for the same annual outcome has changed, such as:

> Down 0.4 percentage point since March

The trend line should cover the life of the currently displayed annual event. Do not automatically roll several annual contracts into one line.

## 3. How likely is a U.S. recession?

### User-facing question

**How likely is a U.S. recession?**

The visible question or subtitle must include the horizon when necessary, for example:

> **How likely is a U.S. recession by the end of 2026?**

### Primary answer

A market-implied probability derived from a direct binary contract.

Example:

> **28%**
> Market-implied probability by December 31, 2026

### Required context

- The exact horizon.
- The contract’s recession definition.
- The organization or data release that determines settlement.
- The current bid–ask midpoint or other price convention.
- The change over a recent interval.
- Current spread and liquidity context.

### Historical view

Historical movement is essential for this module. The default visual should show the contract’s probability over time on a fixed 0%–100% scale.

The module should make changes legible, for example:

> Up 9 percentage points over the past three months

The user should be able to distinguish a stable probability from a gradual increase, sudden spike, or substantial decline. Suitable periods may include three months, one year, and the full life of the contract, subject to available history and section-level interaction conventions.

A direct contract is preferable to a synthetic recession index. Do not combine markets with different definitions—for example, an NBER-designated recession and two consecutive quarters of negative GDP—into one probability.

## Presentation requirements

### Section placement

For the initial release:

- Place the section at the bottom of the main homepage.
- Use a distinct **Prediction Markets** heading.
- Add concise introductory copy distinguishing market prices from observed government data.
- Do not add the section to the existing nine descriptive categories.
- Preserve the option to move the complete section to a dedicated route later without rewriting the domain model.

### Default module anatomy

Each module should contain:

1. question;
2. primary current estimate or probability;
3. visible forecast horizon;
4. one directly relevant observed comparison when definitions align;
5. recent change in the market estimate;
6. simple expectation-history chart when available;
7. source and retrieval timestamp;
8. expanded methodology, contract details, liquidity information, and limitations.

This is a product requirement, not a mandate to create a universal prediction-card component. Build shared composition only after multiple modules demonstrate the same real structure.

### Chart behavior

- Use nonsmoothed lines.
- Preserve missing periods as gaps.
- Use a fixed 0%–100% scale for direct probabilities.
- Use economically appropriate axes for derived inflation and growth estimates.
- Show exact values and timestamps through mouse, touch, and keyboard interaction.
- Label the actual start and end of the available history.
- Do not add historical percentile bands by default.
- Do not use favorable/adverse colors merely because a probability or forecast rises or falls.

### Language and precision

- Prefer whole percentages for probabilities unless additional precision is materially useful.
- Prefer one decimal place for CPI and GDP estimates when consistent with the underlying contracts and source statistic.
- Say “up 7 percentage points,” not “up 7%,” for a probability moving from 20% to 27%.
- Distinguish the market price from a calibrated scientific probability.
- Avoid calling a midpoint-derived statistic a consensus of economists.

## Data-source strategy

## Primary source: Kalshi

Kalshi should be investigated first because its recurring economic series and event structures are likely to fit CPI and GDP-release forecasting more systematically.

Production base URL:

```text
https://external-api.kalshi.com/trade-api/v2
```

Relevant public endpoints include:

```text
GET /series
GET /series/{series_ticker}
GET /events
GET /events/{event_ticker}
GET /markets
GET /markets/{ticker}
GET /markets/{ticker}/orderbook
GET /series/{series_ticker}/markets/{ticker}/candlesticks
GET /markets/candlesticks
GET /historical/cutoff
GET /historical/markets
GET /historical/markets/{ticker}/candlesticks
```

Kalshi documents unauthenticated access to public market-data endpoints. No API key is required for the initial read-only integration. Authentication is required for trading and some real-time functionality, which are outside this epic.

Live and historical market data are partitioned. The refresh implementation must query `GET /historical/cutoff` and use the historical endpoints for markets and candlesticks older than the current cutoff.

## Secondary source: Polymarket

Polymarket should be evaluated as:

- a source for a recession market when its definition, history, and liquidity are stronger;
- a comparison source;
- a fallback when Kalshi does not offer an appropriate contract;
- a possible later source for additional nonredundant questions.

Relevant public APIs:

```text
Gamma API: https://gamma-api.polymarket.com
CLOB API:  https://clob.polymarket.com
Data API:  https://data-api.polymarket.com
```

Use the Gamma API to discover events, markets, tags, and outcome-token identifiers. Use public CLOB endpoints for current prices, midpoints, spreads, order books, and price history.

Relevant endpoints include:

```text
GET /prices-history
POST /batch-prices-history
```

Public discovery and market-price reads do not require authentication. Trading is outside scope.

## Scraping policy

Do not scrape Kalshi or Polymarket webpages for this feature unless an essential field is unavailable through the documented APIs and a separate product decision approves the operational and legal tradeoffs.

API integration is preferred because it is more stable, structured, testable, and transparent. Contract URLs may be retained for user inspection, but webpage HTML must not be the primary data source.

## Access and setup work

### Initial access requirements

No new secret is expected for the first read-only prototype because both platforms expose public market-data endpoints without authentication.

The implementation still needs to:

1. identify stable series, event, market, and token identifiers;
2. document every selected contract and its settlement terms;
3. test API availability from local development and GitHub Actions;
4. establish provider-specific rate-limit and retry behavior;
5. confirm any required attribution or terms-of-use obligations;
6. add explicit provider clients under `scripts/` rather than calling APIs from React;
7. normalize and validate responses before writing committed data;
8. preserve the last known valid dataset when a refresh fails.

### Refresh architecture

Follow the existing provider-refresh architecture:

```text
Scheduled or manual data refresh
        ↓
Kalshi and/or Polymarket provider clients
        ↓
Approved-contract registry
        ↓
Provider response validation
        ↓
Metric-specific probability/distribution derivation
        ↓
Cross-contract coherence and liquidity validation
        ↓
Committed prediction-market JSON
        ↓
Existing asynchronous local-data repository boundary
        ↓
Prediction Markets UI
```

The browser must not call prediction-market APIs directly.

### Refresh cadence

Determine cadence during implementation based on data limits and useful product behavior. A daily refresh may be sufficient for the current dashboard, but prediction prices can change materially within a day. The first story should compare:

- daily refresh;
- several scheduled refreshes per day;
- hourly refresh during active contract periods.

Do not add real-time streaming in this epic. A faster schedule should only be adopted when GitHub Actions limits, provider rate limits, repository churn, and user value have been evaluated.

## Normalized data model requirements

The provider-specific responses should normalize into metric-owned datasets that can represent both direct probabilities and derived distributions.

Each published forecast observation should retain at least:

```ts
interface PredictionMarketObservation {
  observedAt: string
  value: number
  unit: 'probability' | 'percent' | 'percentage-points'
  sourcePlatform: 'kalshi' | 'polymarket'
  sourceEventId: string
  sourceMarketIds: readonly string[]
  horizonLabel: string
  settlementDate: string | null
  methodology: 'direct-midpoint' | 'derived-distribution'
  bid: number | null
  ask: number | null
  spread: number | null
  volume: number | null
  openInterest: number | null
}
```

The final domain model may differ, but it must preserve enough source metadata to reproduce and audit the displayed result. Derived inflation and growth datasets must also preserve the constituent bucket or threshold probabilities used for each headline observation.

## Price and probability methodology

### Direct binary contracts

For recession and other direct binary outcomes:

- Prefer the current midpoint of the best bid and ask when both are available.
- Do not default to the last trade when it may be stale.
- Preserve bid, ask, last trade, spread, volume, and open interest when supplied.
- Define a fallback hierarchy for one-sided or unavailable books.
- Mark stale or insufficiently liquid readings as unavailable or qualified rather than silently presenting them as precise probabilities.

### Threshold and range families

For CPI and GDP:

- Fetch the complete approved market family for the event.
- Convert prices to bucket or cumulative probabilities according to the contract structure.
- Verify that contracts are mutually interpretable and collectively adequate.
- Check cumulative threshold probabilities for monotonicity.
- Check range probabilities for impossible negative values or material failure to reconcile.
- Do not silently repair incoherent prices.
- If a documented statistical adjustment is adopted later, preserve both raw and adjusted probabilities and disclose the method.
- Do not produce a point estimate when open-ended tails or sparse strikes make it unstable.

## Liquidity and quality rules

The research story must propose explicit display-quality thresholds. Candidate inputs include:

- maximum bid–ask spread;
- minimum recent volume;
- minimum open interest;
- maximum age of the latest bid, ask, or trade;
- sufficient coverage across an entire threshold ladder;
- minimum historical duration for a trend chart.

The UI must distinguish:

- available and sufficiently supported;
- available but thin or qualified;
- unavailable because no suitable active market exists;
- unavailable because the market family cannot support a coherent derived estimate.

Do not silently substitute a different question, horizon, or contract when an approved market is unavailable.

## Source-selection rules

The application should use an explicit approved-contract registry rather than automatically surfacing every market tagged “Economy.” Each entry should identify:

- product question;
- preferred platform;
- series/event identifiers;
- accepted settlement definition;
- expected market geometry: binary, threshold ladder, or ranges;
- displayed unit;
- comparable official series, if any;
- fallback source, if approved;
- liquidity and quality requirements;
- rollover procedure when a new event or year opens.

Do not average Kalshi and Polymarket by default. If both answer the same question, either select one according to documented quality rules or display them separately under expanded content. Combining them would require a separate methodology decision.

## Error and lifecycle handling

Prediction contracts open, close, settle, and roll to new horizons. The implementation must handle:

- no active approved market;
- a newly opened replacement contract;
- overlap between old and new horizons;
- settled and archived contracts;
- live versus historical Kalshi endpoints;
- changed contract wording or settlement source;
- missing candlesticks;
- sparse or one-sided order books;
- API errors, schema changes, pagination, and rate limiting;
- failed derivation from otherwise valid provider data.

A new contract must not automatically replace the current one solely because its title appears similar. Validate its rules and update the approved registry.

## Accessibility requirements

- Use semantic headings and figures.
- Provide a concise nonvisual summary of the current forecast and recent movement.
- Keep charts keyboard accessible through the project’s established interaction conventions.
- Expose exact values and dates without requiring pointer hover.
- Ensure source, horizon, methodology, and qualification are available to screen-reader users.
- Do not rely on color alone to show upward or downward movement.

## Documentation requirements

On completion, update:

- `docs/product-overview.md` with the visible section and its purpose;
- `docs/data-refresh.md` with providers, endpoints, identifiers, transformations, cadence, and failure behavior;
- the relevant charting and data-model documentation;
- the README if setup, workflow, or product inventory changes;
- a dedicated prediction-market methodology document if derived distributions are implemented.

## Out of scope

This epic does not include:

- trading, wallet access, positions, or authenticated account activity;
- real-time WebSocket streaming;
- personalized investment recommendations;
- a composite economic outlook score;
- automatic aggregation of Kalshi and Polymarket prices;
- prediction-market questions that duplicate information already conveyed by the selected forecasts;
- moving the section to a dedicated page;
- broad scraping of either platform;
- evaluating the forecasting accuracy of prediction markets against economists or official forecasts.

## Proposed story sequence

### Story 1: Research and approve source contracts

- Discover candidate Kalshi and Polymarket markets for the three questions.
- Record exact identifiers, structures, settlement rules, horizons, historical availability, and liquidity.
- Determine whether each question is directly quoted or requires derivation.
- Recommend one source and fallback policy per question.
- Propose quality thresholds and rollover rules.
- Make no production UI changes.

### Story 2: Add provider clients and raw fixture validation

- Add minimal read-only Kalshi support first.
- Add Polymarket only where required by the approved source decision.
- Implement pagination, timeouts, retries, rate-limit handling, and runtime validation.
- Store representative test fixtures.
- Confirm that no secrets are required.

### Story 3: Implement recession-probability dataset

- Retrieve the approved binary recession contract.
- Derive midpoint and qualification state.
- Retrieve and normalize historical price data.
- Handle live/historical market boundaries.
- Write and validate committed JSON.
- Preserve prior valid data on refresh failure.

### Story 4: Add the Prediction Markets section and recession module

- Add the new homepage section at the bottom.
- Add explanatory section copy.
- Implement the recession question, headline probability, recent change, history chart, accessibility summary, and expanded contract detail.
- Establish section-level visual direction without forcing compact historical-band patterns.

### Story 5: Implement CPI forecast derivation

- Retrieve the complete approved CPI market family.
- Derive and validate its probability distribution.
- Choose and document the headline estimate or likely range.
- Add the latest comparable official CPI observation.
- Determine whether historical reconstruction is reliable enough to publish.
- Write committed normalized data and tests.

### Story 6: Add the inflation module

- Present the current market-implied CPI forecast.
- Compare it with the latest compatible official reading.
- Show expectation movement when valid history exists.
- Expose the underlying distribution, methodology, liquidity, and limitations.

### Story 7: Implement annual GDP forecast derivation

- Retrieve the approved annual GDP market family.
- Validate the settlement definition and distribution.
- Derive the headline estimate or likely range.
- Add only definitionally compatible official comparison data.
- Reconstruct historical expectations if adequately supported.

### Story 8: Add the annual-growth module

- Present the annual real-GDP forecast and horizon.
- Show movement in the estimate.
- Expose probability distribution, methodology, liquidity, source terms, and limitations.

### Story 9: Integrate refresh and deployment

- Add prediction-market retrieval to the safe refresh workflow.
- Select and document refresh cadence.
- Avoid metadata-only commits.
- Ensure one provider or module failure does not corrupt prior valid data.
- Run all existing repository checks before committing refreshed datasets or deploying.

### Story 10: Cross-module review

- Review whether the section answers three distinct questions without redundancy.
- Compare visual hierarchy with the descriptive dashboard.
- Verify terminology, precision, horizons, source disclosure, responsive behavior, and accessibility.
- Decide whether the section remains on the homepage or should become a future dedicated route; moving it is not part of this story.

## Epic acceptance criteria

The epic is complete when:

1. The homepage ends with a distinct **Prediction Markets** section.
2. It answers the three approved questions without redundant direction cards.
3. Every headline includes enough visible horizon context to be interpretable.
4. Recession probability includes a historical trajectory and recent-change statement.
5. CPI and annual GDP show a documented market-implied estimate or likely range derived from validated contracts.
6. Historical expectation lines are shown only when they can be reconstructed consistently.
7. No module uses historical percentile bands merely for consistency with descriptive cards.
8. Every displayed value is traceable to exact markets, timestamps, and methodology.
9. Thin, stale, incoherent, missing, and transitioned markets receive explicit handling.
10. Public APIs, not webpage scraping, supply production data.
11. The browser reads validated committed datasets and never calls the providers directly.
12. Provider refresh failures preserve previously valid datasets.
13. Source details, contract rules, liquidity, limitations, and retrieval dates are available in the interface.
14. All implementation, accessibility, documentation, refresh, and repository quality checks pass.

## Open decisions to resolve during the epic

- Which platform and exact contract best represents U.S. recession risk?
- Which recession definition is clearest and most useful to the dashboard audience?
- Whether CPI and GDP should display a mean, median, modal range, or another statistic.
- Whether historical CPI and GDP forecasts can be reconstructed with adequate continuity.
- What liquidity, spread, staleness, and coherence thresholds determine publishability.
- Whether daily or intraday refresh offers the right balance of timeliness and operational simplicity.
- Whether an official current observation belongs beside every forecast or only when definitions align cleanly.
- Whether the completed section should later move to its own page.

## Official API references

- [Kalshi: Quick Start — public market data without authentication](https://docs.kalshi.com/getting_started/quick_start_market_data)
- [Kalshi: Series list](https://docs.kalshi.com/api-reference/market/get-series-list)
- [Kalshi: Markets](https://docs.kalshi.com/api-reference/market/get-markets)
- [Kalshi: Market candlesticks](https://docs.kalshi.com/api-reference/market/get-market-candlesticks)
- [Kalshi: Batch market candlesticks](https://docs.kalshi.com/api-reference/market/batch-get-market-candlesticks)
- [Kalshi: Historical data](https://docs.kalshi.com/getting_started/historical_data)
- [Kalshi: Historical market candlesticks](https://docs.kalshi.com/api-reference/historical/get-historical-market-candlesticks)
- [Polymarket: API overview](https://docs.polymarket.com/api-reference/predictions/overview)
- [Polymarket: Price history](https://docs.polymarket.com/api-reference/markets/get-prices-history)
- [Polymarket: Batch price history](https://docs.polymarket.com/api-reference/markets/get-batch-prices-history)
