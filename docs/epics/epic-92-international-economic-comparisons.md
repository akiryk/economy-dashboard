# Epic 92 — International Economic Comparisons

## Summary

Add a third top-level section to the economic dashboard that shows how the United States compares with a consistent set of peer countries across economic measures already represented elsewhere in the dashboard.

The existing dashboard answers questions such as:

- How is the U.S. economy doing now?
- Is a particular U.S. measure historically high or low?
- Is that measure improving or worsening?

The new comparison section should add another question:

> **How does the United States compare with similar wealthy countries?**

This is not intended to become a comprehensive international economics database. It should be a curated comparison layer using only measures that are meaningfully comparable across countries and supported by high-quality, preferably harmonized data.

---

# Product Goal

Create a new top-level **Compare** tab alongside the dashboard's existing top-level views.

The Compare page should let a user quickly understand whether a U.S. economic result is:

- unusually strong or weak relative to peer countries;
- roughly typical among comparable economies;
- strong by U.S. historical standards but less impressive internationally;
- weak domestically but part of a broader international pattern.

The first motivating example is **prime-age employment**.

The existing U.S. card reports the percentage of adults ages 25–54 who are employed. An 80.4% U.S. rate is historically high for the United States, but international comparison adds important context because some peer countries have even higher prime-age employment rates.

That kind of insight is the purpose of this epic.

---

# Peer-Country Set — Use a Rule, Not an Ad Hoc List

The initial country list that motivated this epic was intentionally informal. Do **not** treat it as the canonical peer set.

For Version 1, use a reproducible rule:

> **Large advanced OECD economies:** countries that are OECD members, are classified by the IMF World Economic Outlook as advanced economies, and have populations of roughly 25 million or more.

Applying that rule as of 2026 gives this working set:

- United States
- Japan
- Germany
- United Kingdom
- France
- Italy
- South Korea
- Spain
- Canada
- Australia

This is preferable to the original brainstormed list because it includes the full G7 rather than arbitrarily omitting Italy, adds Spain as another large advanced OECD economy, and retains Australia and South Korea as large Asia-Pacific peers.

Codex must verify the peer-set rule during the research story using the then-current official IMF classification and OECD population data. The purpose of the rule is not to create a mechanically changing list every month; it is to document why these countries belong in the comparison set.

Where the OECD publishes an **OECD aggregate/average** for the same measure, include it as a contextual benchmark if useful, but do **not** count the aggregate as a country or include it in the country ranking.

The U.S. should always be visually identifiable.

Do not dynamically change the peer group from metric to metric merely because data availability is inconvenient. A missing country is a data-quality condition, not permission to redefine the peer group.

Primary references for the peer-set rule:

- IMF World Economic Outlook, April 2026, advanced-economy classification and Statistical Appendix: https://www.imf.org/en/Publications/WEO
- OECD members: https://www.oecd.org/en/about/members-partners.html
- OECD population indicator: https://www.oecd.org/en/data/indicators/population.html

---

# Core Product Principles

## 1. Comparability matters more than completeness

Do **not** assume that every metric currently shown on the U.S. dashboard belongs on the Compare page.

A metric should appear only when we can identify data that are sufficiently harmonized to support a meaningful comparison.

A page with six excellent comparisons is better than one with twenty misleading ones.

## 2. Prefer harmonized international sources

Where possible, use a single international source for all countries in a comparison.

Preferred source hierarchy should generally be:

1. OECD
2. World Bank
3. IMF
4. other reputable international statistical organizations
5. national statistical agencies only when necessary and definitions can be shown to be compatible

For an international comparison, do not casually mix a BLS U.S. number with an OECD Canadian number, an ONS British number, etc.

For example, the existing U.S. prime-age employment card may continue using BLS/FRED data, but the international comparison should preferably use the OECD's harmonized series for **all countries including the United States**.

## 3. Preserve the existing U.S. dashboard

This epic should not redesign existing dashboard cards merely to support international comparisons.

The Compare page is an additional analytical view.

Existing cards should continue to use the most appropriate U.S. source unless a separate story identifies a compelling reason to change them.

## 4. Make differences understandable

The page should answer the question visually and immediately.

A user should not need to inspect eight small charts to determine whether the U.S. ranks third or seventh.

For most metrics, a **ranked horizontal bar chart or similarly legible ranked comparison** is likely preferable.

Example:

Prime-age employment

Germany              85.1%
Canada                83.6%
Australia             82.x%
...
United States         80.4%
...
France                xx.x%

Exact design is not prescribed if another treatment produces a clearer result.

## 5. Avoid false precision

International data frequently differ in:

- publication schedule;
- monthly vs. quarterly frequency;
- revisions;
- seasonal adjustment;
- reference periods;
- methodology.

The UI should make the observation date available and should never imply that values observed in different periods were measured on the exact same day.

Prefer the most recent reasonably comparable observations.

---

# Which Existing Dashboard Cards Should Be Compared?

Codex must begin by inventorying the **actual current dashboard cards in the repository**. Do not build comparisons from an old planning document or from the candidate list below. The dashboard currently contains many more cards than belong on this page.

Then match each current card against the researched catalog below.

The following assessment has already been researched enough to establish a strong default. Codex should verify exact dataset dimensions and current coverage, not restart the conceptual analysis from zero.

## Tier 1 — Include in Version 1 when the corresponding U.S. card exists

### 1. Prime-age employment rate — INCLUDE

Concept: share of people ages 25–54 who are employed.

Why it works: OECD labour-force-survey data use harmonized concepts and explicitly publish employment-to-population ratios for ages 25–54.

Primary source: OECD Data Explorer, Infra-annual Labour Statistics.

Useful dataflow: `OECD.SDD.TPS,DSD_LFS@DF_IALFS_EMP_WAP_Q`

Age selection: `Y25T54`.

OECD definition/reference: https://www.oecd.org/en/data/indicators/employment-rate.html

This is the reference implementation for the Compare page.

### 2. Unemployment rate — INCLUDE

Concept: unemployed people as a share of the labour force.

Why it works: the OECD explicitly harmonizes the unemployment definition across member countries; this is more internationally comparable than collecting national headline series separately.

Primary source: OECD Monthly Unemployment Rates / Infra-annual Labour Statistics.

Useful dataflow: `OECD.SDD.TPS,DSD_LFS@DF_IALFS_UNE_M`.

Definition: https://www.oecd.org/en/data/indicators/unemployment-rate.html

Use the harmonized OECD value for **every** country, including the United States.

### 3. Headline CPI inflation — INCLUDE

Concept: year-over-year change in the all-items consumer price index.

Primary source: OECD Consumer Price Indices.

Definition and source-dataset entry point: https://www.oecd.org/en/data/indicators/inflation-cpi.html

Use the all-items national CPI concept consistently. Do not mix U.S. CPI-U from BLS with HICP for some European peers unless the OECD dataset itself defines the comparison that way.

For this module the user should be comparing **inflation rates**, not CPI index levels.

### 4. Real GDP growth — INCLUDE

Primary source: OECD Quarterly National Accounts / real GDP.

Definition: https://www.oecd.org/en/data/indicators/real-gross-domestic-product-gdp.html

Important: the OECD headline indicator commonly exposes quarter-over-quarter growth. The U.S. dashboard may use a year-over-year concept. The Compare page must use one common transformation for every country. If the desired product concept is year-over-year growth, calculate YoY from harmonized quarterly real-GDP volume/index observations rather than mixing q/q and y/y rates.

### 5. Real GDP per capita growth — INCLUDE if the existing card's concept can be matched

Primary source: OECD Quarterly GDP per capita / Quarterly National Accounts.

Dataset entry point: https://data-explorer.oecd.org/ (search `Quarterly GDP per capita`).

Use a common real/volume concept and a common growth transformation. Do not compare nominal dollar GDP per capita to the dashboard's real growth card.

### 6. Labour productivity growth — INCLUDE, accepting lower frequency if necessary

Concept: growth in GDP per hour worked.

Primary source: OECD Productivity Statistics.

Definition: https://www.oecd.org/en/data/indicators/gdp-per-hour-worked.html

The OECD defines GDP per hour worked as output per unit of labour input. This is the right international analog for the dashboard's labour-productivity concept.

Prefer growth rates over raw index levels. If comparable quarterly data are incomplete but annual data are robust, use the latest annual comparison and label the period honestly rather than substituting a different productivity concept.

### 7. Government deficit — INCLUDE if this card currently exists

Concept: general-government net lending/borrowing as a share of GDP.

Primary source: OECD National Accounts.

Definition: https://www.oecd.org/en/data/indicators/general-government-deficit.html

Unit: percent of GDP.

Use **general government**, not U.S. federal-government-only data, because the latter would not be comparable with consolidated general-government figures elsewhere.

### 8. Government debt — INCLUDE if this card currently exists and the U.S. card can be conceptually matched

Concept: gross general-government debt as a share of GDP.

Primary source: OECD.

Definition: https://www.oecd.org/en/data/indicators/general-government-debt.html

Unit: percent of GDP.

Do not compare U.S. `debt held by the public` with an OECD gross-general-government debt measure and call them the same thing. The Compare page should use the OECD concept for all countries.

### 9. Industrial production / manufacturing output — INCLUDE if there is a corresponding current card

Primary source: OECD Industrial Production.

Definition: https://www.oecd.org/en/data/indicators/industrial-production.html

Because these are index series, compare a common **growth rate** such as year-over-year change. Do not rank countries by the raw index level because the index base is arbitrary.

### 10. Ten-year government bond yield — INCLUDE if an existing dashboard/secondary card still represents this concept

Primary source: OECD Long-term Interest Rates.

Definition: https://www.oecd.org/en/data/indicators/long-term-interest-rates.html

The OECD definition centers on government bonds maturing in ten years. This is a genuine cross-country financial-market comparison, but it is **descriptive**, not a good/bad ranking.

## Tier 2 — Include only if the exact dashboard card matches the internationally comparable concept

### Housing

OECD provides nominal/real house-price indices and price-to-income ratios:

https://www.oecd.org/en/data/indicators/housing-prices.html

Dataflow: `OECD.ECO.MPD,DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES`.

Important limitation: the OECD price-to-income series is an **index (2015=100)**. A country at 120 is not necessarily less affordable in absolute terms than a country at 100; it means affordability has deteriorated more relative to that country's own 2015 baseline. Therefore:

- do not use this dataset to make an absolute `Country A is more affordable than Country B` ranking;
- it may support a clearly labeled comparison such as `Housing prices relative to incomes, change since 2015`;
- if the existing U.S. affordability card measures a different concept, do not pretend this is the same card.

### Household disposable income / household well-being

OECD has a harmonized household disposable-income indicator, including per-capita growth:

https://www.oecd.org/en/data/indicators/household-disposable-income.html

This may be a good comparison **only if** it corresponds closely to a current dashboard card. It should not be used as a substitute for a different U.S. income concept simply because data exist.

### Current account / trade

OECD current-account balance is available as a percentage of GDP:

https://www.oecd.org/en/data/indicators/current-account-balance.html

This is internationally comparable, but it is not interchangeable with every concept called `trade deficit`. Include only if the current card is actually about the current account or if a separate product decision explicitly approves changing the question.

## Tier 3 — Do NOT include in Version 1 as direct analogs

### Payroll growth — REJECT as a direct comparison

The U.S. payroll card is establishment-survey based and institutionally specific. International sources can provide total employment growth, but substituting that would answer a different question. Do not label total-employment growth as international `payroll growth`.

### Initial unemployment claims — REJECT

Claims depend heavily on national unemployment-insurance systems, eligibility rules, administration and reporting. There is no sufficiently clean direct analog for this dashboard purpose.

### Real wages / wages versus inflation — DEFER

OECD does publish comparable average annual wages:

https://www.oecd.org/en/data/indicators/average-annual-wages.html

But the dashboard's U.S. real-wage card uses a different, higher-frequency wage concept. A defensible international real-wage comparison would require a separate methodology decision about wage population, full-time-equivalent adjustment, deflator and frequency. Do not silently substitute OECD annual wages.

### Mortgage rates — REJECT as a direct comparison

Mortgage markets differ materially in fixed-rate periods, reset conventions, loan terms, funding structures and borrower mix. A single ranked `mortgage rate` chart would imply more comparability than exists.

### Prime rate / Fed funds — REJECT as direct analogs

Central banks have comparable policy-rate concepts, but a U.S. prime rate and a federal-funds target are not automatically the same product as other countries' benchmark rates. A future `central-bank policy rates` comparison could be useful, but it should be designed as its own metric.

### Inflation-driver contributions — DEFER

OECD does publish contributions to annual inflation for many countries, but category weights and Australia coverage create additional complexity. Keep Version 1 focused on headline inflation.

### S&P 500 / national stock-market index — REJECT for this page

Countries have different flagship index construction and sector composition. A stock-index ranking would add noise to a page intended to benchmark macroeconomic outcomes.

---

# Data Sources and Retrieval Strategy

## Default source: OECD Data Explorer API

For most Version 1 metrics, use the official OECD Data Explorer **SDMX REST API directly**, not FRED copies of OECD series.

OECD API documentation:

https://www.oecd.org/en/data/insights/data-explainers/2024/09/api.html

Base host:

`https://sdmx.oecd.org/public/rest/`

The OECD API is free of charge and supports CSV, JSON and XML. No API key is required. It is rate-limited, so queries should be narrow and the refresh pipeline should cache results.

Use the Data Explorer's **Developer API** query builder to obtain both:

- the data query; and
- the structure query describing dimensions/codes.

Do not guess SDMX dimension order from memory.

When a dataset has been verified, **pin the dataset version** in production queries where practical. OECD documentation warns that automatically taking the latest dataflow version can introduce non-backward-compatible structural changes.

## Secondary sources

Use these only when OECD cannot supply the approved concept with acceptable coverage:

1. **IMF World Economic Outlook / IMF Data** — especially annual macro and fiscal concepts. The IMF WEO provides a useful independent cross-check for real GDP, GDP per capita, unemployment, inflation and fiscal aggregates. Start at https://www.imf.org/en/Publications/WEO and https://www.imf.org/external/datamapper/.
2. **World Bank API** — useful for slower-moving annual structural indicators; public API and generally no key required. Start at https://data.worldbank.org/ and https://api.worldbank.org/.
3. **Eurostat** — acceptable for a specifically European metric, but do not use Eurostat for only the European peers while using unrelated definitions elsewhere unless equivalence has been demonstrated.
4. **National statistical agencies** — last resort for a missing country. Use only if the national series can be shown to implement the same concept and transformation as the harmonized source.

FRED may continue to be used by the existing U.S. dashboard. It should **not** be the default international source merely because the project already uses it. International comparison is easier to audit when all peer observations come from the harmonizing organization itself.

# Research Deliverable

Before implementing comparison modules, Codex must create a committed machine-readable or Markdown **comparison registry** describing every *current dashboard card* and its international-comparison disposition.

The registry is not just a list of promising metrics. It is an audit of the actual dashboard.

For every current dashboard metric record:

- metric name;
- economic concept being measured;
- source organization;
- source API or dataset;
- exact series/dataset identifiers if applicable;
- countries available;
- frequency;
- seasonal-adjustment status;
- unit;
- observation lag;
- whether the definition is genuinely comparable;
- important caveats;
- international transformation required, if any (for example raw index -> YoY growth);
- expected update frequency;
- acceptable staleness window;
- minimum peer coverage;
- fallback source, if any;
- recommendation:
  - include;
  - include with caveat;
  - defer;
  - reject.

This research should live in the repository so future development does not need to rediscover the methodology.

Example structure:

```text
Prime-age employment
Source: OECD
Population: ages 25–54
Unit: percent of population
Frequency: monthly/quarterly depending on country
Peer coverage: 8/8
Comparability: high
Recommendation: include
Notes: international view should use OECD U.S. value rather than BLS value
```

The registry must explicitly contain rejected cards such as payroll growth and initial claims, with the reason. That prevents a later autonomous loop from `discovering` a superficially similar dataset and implementing a misleading comparison.

Do not implement questionable metrics before completing this research.

---

# Compare Page — UX Requirements

Add a third top-level navigation destination:

> **Compare**

Use the project's existing navigation conventions.

The Compare page should have a short introduction explaining its purpose, approximately:

> See how the United States compares with other wealthy economies across measures used in this dashboard.

Exact copy may be refined.

The page should remain visually consistent with the rest of the dashboard.

---

# Comparison Module

Create a reusable component/pattern for international comparisons rather than implementing each metric as bespoke markup.

Each comparison should support:

- metric title;
- concise explanatory question or description;
- one value for each available peer country;
- country label;
- formatted value;
- observation date or period;
- clear highlighting of the United States;
- ranking by value when ranking is economically meaningful;
- source attribution;
- methodology/help text;
- missing-data handling;
- responsive rendering.

Possible future support:

- directionality metadata indicating whether "higher" is conventionally good, bad, or neither;
- historical comparison;
- alternate sort modes.

Do not build speculative complexity unless it materially simplifies the currently approved metrics.

---

# Ranking Semantics

Be careful about implying that rank equals quality.

For example:

- higher prime-age employment is generally favorable;
- lower unemployment is generally favorable;
- lower inflation is **not always simply better**;
- higher GDP growth may be favorable but volatile;
- higher interest rates are not inherently good or bad.

Therefore the page may rank values numerically while avoiding labels such as:

> #1 best

unless the economic interpretation genuinely supports that statement.

Prefer neutral language such as:

> U.S. ranks 5th of 8

where helpful.

For metrics where ordinal ranking itself is misleading, use an unranked or conceptually appropriate presentation.

---

# Dates and Data Freshness

International datasets update at different speeds.

The comparison system must retain the date/period for every country observation rather than assuming one global date.

The UI may summarize the comparison as:

> Latest available data

but individual values must retain their actual observation dates.

If one country's latest observation is materially older than the rest, make that apparent.

Do not silently substitute stale values.

---

# Missing Data

Missing data must never become zero.

Treat these as four different failure modes: **no observation**, **stale observation**, **transient fetch failure**, and **source/schema failure**.

## No observation for one country

1. Look for that country's most recent observation in the same harmonized dataset.
2. Use it only if it is inside the metric's documented staleness window.
3. Preserve and display its actual observation period.
4. If no acceptable observation exists, show `N/A`/unavailable and exclude it from rank calculations.
5. Do not replace it with zero.
6. Do not silently substitute another source just to make the bar chart complete.

Default staleness windows unless the research registry documents a better metric-specific rule:

- monthly series: no more than 3 months old;
- quarterly series: no more than 2 quarters old;
- annual series: no more than 18 months old.

## Coverage threshold

For the 10-country peer set, render a module only when:

- the United States has a valid observation; and
- at least 8 of the 10 countries have valid observations within the accepted staleness window.

If fewer than 8 countries are valid, treat the module as unavailable rather than presenting a misleadingly selective ranking.

The registry may define a stricter threshold for an individual metric.

## Transient fetch failure

For 429s, timeouts and 5xx responses:

- retry a small bounded number of times with backoff;
- respect `Retry-After` where supplied;
- keep the last-known-good generated data artifact;
- never overwrite good cached data with an empty/partial response;
- surface the refresh failure in CI/log output.

A temporary OECD outage should not make the production dashboard blank if a recent valid snapshot already exists.

## Source/schema failure

Examples: HTTP 4xx caused by an obsolete query, renamed dimension, dataflow-version change, unexpected unit, or parser no longer matching the response.

In this case Codex should **stop the autonomous loop and tell the developer**. The report should include:

- metric and country set affected;
- source organization;
- exact dataset/dataflow identifier and pinned version;
- failing request or enough of it to reproduce the problem;
- HTTP status/error message;
- whether last-known-good data remain safe to serve;
- likely remediation.

Do not `fix` a schema break by loosening validation until malformed data happen to parse.

## If credentials are required

The preferred OECD API does not require an API key. Neither should the ordinary World Bank public API.

If an approved fallback source unexpectedly requires credentials:

- do not hard-code or commit a key;
- do not scrape a website as a secret workaround;
- determine whether a semantically equivalent no-key official source exists;
- if not, stop and tell the developer exactly what credential is required, where to obtain it, and what environment-variable name the code expects;
- resume only after the credential is available.

## Missing country vs. missing metric

If one country cannot be supported, prefer `N/A` within the fixed peer set.

If the metric itself cannot meet coverage or comparability requirements, **skip the metric**, not the country set.

---

# Historical Data

Version 1 of the Compare page should prioritize **current cross-country comparisons**, not eight-country historical charts.

Do not build dense multi-line historical visualizations unless a later story specifically calls for them.

However, the data layer should avoid unnecessarily throwing away historical observations if the source/API already provides them and retaining them is inexpensive.

A future enhancement may allow:

> Compare over time

but that is outside the initial epic unless implementation makes it nearly free.

---

# Architecture

International data ingestion should follow the existing dashboard's architecture wherever practical.

Do not create a parallel data system if the existing refresh/build pipeline can support this cleanly.

Codex should determine:

- whether international data should be fetched during the existing scheduled refresh;
- whether data should be normalized into existing data structures;
- whether a new international-comparison schema is appropriate;
- caching behavior;
- validation behavior;
- failure behavior.

Network requests should not be performed unnecessarily from the browser if the dashboard currently relies on preprocessed/static data.

The preferred design is to fetch and normalize international data during the repository's existing scheduled data-refresh process, write a deterministic generated artifact, and have the UI read that artifact.

The browser should not make ten-country OECD API calls on page load.

Unit/component tests should use fixtures, not live OECD requests. A small refresh/integration test may exercise the live source separately if the repository's CI policy permits network access.

Preserve a last-known-good snapshot so an upstream outage does not erase data.

---

# Data Normalization

Create a canonical internal representation sufficient for international comparisons.

Conceptually it should contain information equivalent to:

```ts
{
  metricId,
  countryCode,
  countryName,
  value,
  unit,
  observationDate,
  source,
  sourceUrl,
  frequency,
  updatedAt
}
```

The exact schema should follow the repository's conventions.

Country codes should use a stable standard such as ISO codes rather than free-form country strings wherever practical.

---

# Validation

Incoming data should be validated.

Tests or runtime/build validation should catch conditions such as:

- duplicate country observations;
- unknown country identifiers;
- impossible/null numeric values;
- unexpected units;
- malformed dates;
- accidental percentage-vs-decimal conversion errors;
- unexpectedly missing U.S. data;
- unexpectedly low peer-country coverage.

Avoid brittle tests that hard-code today's economic values.

Tests should validate **behavior and invariants**, not freeze data that legitimately changes every month.

---

# Testing Requirements

This epic should include appropriate automated coverage.

At minimum:

## Data tests

Test:

- source parsing;
- normalization;
- country mapping;
- units;
- missing observations;
- date handling;
- ranking;
- ties where applicable.

## Component tests

Test:

- all countries render;
- U.S. highlighting;
- ordering;
- unavailable values;
- source information;
- responsive-safe rendering where feasible.

## Integration tests

Test that the Compare page:

- is reachable from top-level navigation;
- renders at least the expected approved comparison modules;
- does not error when one country's observation is missing;
- has no obvious console errors.

## Smoke coverage

Ensure the project's established smoke-test policy includes the new Compare route.

If the repository does not yet have the smoke-test policy requested in Story 91, do not invent a conflicting mechanism. Integrate with whatever Story 91 establishes.

---

# Accessibility

The comparison must not depend exclusively on color.

The United States should be identifiable through text, typography, position, marker, or another accessible treatment in addition to any color treatment.

Charts should have accessible labels or equivalent textual information.

Keyboard and screen-reader behavior should follow existing project conventions.

---

# Responsive Design

The Compare page must work at the same supported viewport sizes as the existing dashboard.

Eight-country comparisons should remain readable on mobile.

If horizontal bars become too compressed, adapt the layout rather than shrinking text below reasonable legibility.

---

# Performance

The Compare page must not introduce continuous recalculation, render loops, growing event listeners, or repeated network requests.

Follow the performance-regression protections established in Story 91.

Static data should remain static between actual data changes.

---

# Analytics / Metadata

Do not add analytics unless the project already uses them.

Ensure page title, route metadata, and navigation semantics are consistent with existing pages.

---

# Suggested Story Decomposition

Codex may adjust boundaries if repository architecture strongly suggests a better split, but the epic should roughly decompose as follows.

## Story A — Research and international data registry

Inventory every current dashboard card.

Match each card against the Tier 1/Tier 2/Tier 3 guidance in this epic.

Verify the large-advanced-OECD peer set using the documented rule.

Verify exact OECD dataflows, dimensions, units, frequencies and coverage for the included metrics using the Data Explorer Developer API query builder.

Produce the committed source/methodology registry.

Determine which metrics qualify for Version 1.

No major UI implementation yet.

This story should establish the canonical peer-country list and source strategy.

## Story B — International comparison data infrastructure

Add:

- country definitions;
- normalized international data schema;
- fetch/ingestion utilities;
- validation;
- tests;
- integration with the existing refresh pipeline.

Initially support prime-age employment.

Implement last-known-good behavior, staleness metadata, coverage validation and upstream-failure handling from this epic as part of the infrastructure rather than retrofitting them after several cards exist.

## Story C — Compare route and page shell

Add the third top-level **Compare** tab.

Create the route, page layout, introduction, empty/loading/error behavior where applicable, and responsive shell.

The page may initially contain only the first comparison.

## Story D — Reusable comparison visualization

Implement the reusable international comparison module.

Use **prime-age employment** as the reference implementation.

Acceptance criteria should include a successful comparison across the standard peer group, U.S. highlighting, values, dates, source, methodology/help affordance, responsive behavior, and tests.

## Story E — Prime-age participation

Add the harmonized international prime-age labor-force participation comparison if research approved it.

## Story F — Unemployment

Add internationally comparable unemployment.

## Story G — Inflation

Add internationally comparable headline inflation using the definition selected during research.

Include any caveat necessary to explain harmonization.

## Story H — Economic growth

Add the approved GDP growth comparison.

If GDP-per-capita growth was separately approved and naturally belongs with it, Codex may either:

- include both in this story; or
- create a separate story.

Favor small, independently verifiable stories.

## Story I — Productivity or other approved metrics

Add remaining Version 1 comparisons that passed the research gate.

Do not implement rejected metrics merely because they appeared in the original candidate list.

## Story J — Compare-page polish and cross-page QA

Review the finished page as a whole.

Check:

- visual consistency;
- ordering;
- spacing;
- mobile;
- accessibility;
- sources;
- dates;
- stale/missing observations;
- performance;
- navigation;
- smoke tests.

Remove unnecessary complexity.

---

# Version 1 Completion Criteria

Epic 92 is complete when:

1. A third top-level **Compare** destination exists.

2. The page compares the United States against the researched large-advanced-OECD peer set defined by this epic, expected initially to be:
   - United States
   - Japan
   - Germany
   - United Kingdom
   - France
   - Italy
   - South Korea
   - Spain
   - Canada
   - Australia

3. At least several economically meaningful metrics are implemented from the approved research set.

4. Prime-age employment is included.

5. International comparisons use defensible harmonized sources wherever possible.

6. The United States is clearly identifiable in every comparison.

7. Observation dates and source information are available.

8. Missing/stale data are handled honestly.

9. Data definitions and methodological decisions are documented in the repository.

10. Automated data, component, integration, and appropriate smoke tests exist.

11. The page passes the project's existing lint, typecheck, test, build, and performance-regression requirements.

12. Existing dashboard pages remain functionally unchanged except for the addition of navigation to Compare.

---

# Codex Autonomous Execution Instructions

Codex may treat this epic as a bounded autonomous work queue.

The objective is to allow Codex to create a story, implement it, verify it, commit/push it according to the repository's normal workflow, then continue to the next story without requiring approval after every routine implementation decision.

## Before starting

1. Read the repository documentation and existing story conventions.
2. Inspect the current dashboard architecture.
3. Inspect the current navigation/routes.
4. Inspect the data refresh pipeline.
5. Inspect existing test commands.
6. Inspect Story 91 and any performance/smoke-test conventions it establishes.
7. Inventory the **actual current cards** and reconcile them against this epic's comparison catalog.
8. Read the OECD API documentation and use Data Explorer Developer API queries to verify each approved dataset rather than guessing series IDs.
9. Do not overwrite unrelated work.

## Story loop

For each story:

1. Create a story file using the repository's existing naming and formatting convention.
2. Give the story explicit acceptance criteria.
3. Implement only that story's scope.
4. Add or update tests.
5. Run the narrowest useful tests during development.
6. Before considering the story complete, run the repository-required verification suite appropriate to the change.
7. Fix failures caused by the story.
8. Review the diff for accidental or unrelated changes.
9. Commit with an informative message.
10. Push if pushing completed stories is the established workflow.
11. Proceed to the next story.

Do not bundle the entire epic into one enormous implementation.

## Research gate

The first research story is important.

Do **not** proceed on the assumption that every candidate metric is valid for international comparison.

The research story determines the Version 1 metric set, but it should start from the evidence and defaults already documented in this epic. It should not reopen settled questions without contrary source evidence.

Subsequent stories should use that result.

## Autonomy rule

Codex should resolve ordinary engineering questions independently by:

- following existing repository patterns;
- selecting the simplest maintainable implementation;
- using primary-source documentation when external API behavior must be confirmed;
- writing tests for important behavior.

Codex does **not** need to stop for approval over routine choices such as:

- file organization;
- component naming;
- test structure;
- minor responsive details;
- straightforward refactoring required by a story.

## Stop conditions

Stop the autonomous loop and ask the user before continuing if:

- a product decision materially changes the meaning of a metric;
- two defensible data definitions would produce meaningfully different user interpretations;
- the preferred source requires credentials, payment, or a significant new infrastructure dependency;
- implementation would require destructive or broad architectural changes;
- existing repository behavior contradicts this epic in a way that cannot be reconciled safely;
- tests expose an unrelated serious defect that must be fixed before work can continue;
- a story would require changing an existing dashboard metric rather than merely adding the international comparison;
- source research shows that the proposed peer-country comparison is materially misleading.
- an included metric falls below the documented country-coverage threshold and no semantically equivalent official source is available;
- an upstream dataflow/schema changes in a way that invalidates a pinned query or its interpretation;
- an approved source requires a new credential and no equivalent credential-free official source exists.

Do not stop merely because the implementation requires normal judgment.

---

# Definition of Done for Every Story

A story is done only when:

- acceptance criteria are satisfied;
- relevant automated tests pass;
- lint/typecheck pass where applicable;
- build passes where applicable;
- smoke tests required by repository policy pass;
- no new console/runtime errors are known;
- no obvious performance regression has been introduced;
- source/methodology documentation is updated when required;
- the diff contains no accidental unrelated changes.

---

# Important Non-Goals

Do not:

- create a comprehensive country selector;
- support every OECD country in Version 1;
- turn the page into an eight-line historical chart dashboard;
- compare metrics whose definitions are materially incompatible;
- redesign existing dashboard cards;
- duplicate source-fetch logic unnecessarily;
- hard-code current economic values into tests;
- treat country rank as synonymous with economic quality;
- invent missing observations;
- silently compare stale observations as though they were contemporaneous.

---

# Expected Product Outcome

When this epic is finished, a user should be able to move from a U.S.-only statement such as:

> Prime-age employment is high compared with the past 25 years.

to a second, complementary perspective:

> How does that compare with other wealthy economies?

The result should sometimes reinforce the original story and sometimes complicate it.

That complication is a feature.

The purpose of the Compare page is not to make the United States look good or bad. It is to provide a disciplined international benchmark for interpreting the economic indicators already presented by the dashboard.
