# Economic-series data model

For the product-level card inventory and rationale, see [`product-overview.md`](product-overview.md). This document describes the shared technical model.

The economic-series domain model keeps source metadata and observations together while distinguishing the meaning of each date.

## Briefing interpretation boundary

The at-a-glance briefing interpretation is implemented as pure domain logic in `src/features/briefing`. It accepts already-loaded, validated observations and explicit configuration, then returns typed condition, direction, freshness, and agreement results with trace metadata. It performs no repository access or rendering. The committed research datasets and their existing repositories remain the evidence layer.

The non-default `/briefing` route is the first vertical slice over that boundary. Its Labor-specific orchestration loads the Kansas City Fed LMCI Activity and Momentum indexes as its two primary readings, derives full-history percentile ranks, selects fixed tiers and deterministic copy, and creates a typed view model for the Labor tile. Unemployment, monthly and three-month-average payroll changes, prime-age employment, and initial claims are supporting evidence only. Repository loading, interpretation, visual transformations, and React rendering remain separate. The default `/` route is still the full research dashboard.

An `EconomicSeries` identifies the provider and provider series, explains the displayed units and transformation, records seasonal adjustment and frequency, and contains `EconomicObservation` entries. Each observation has an ISO date representing the economic period and a numeric or `null` value. A missing observation remains `null`; it is never treated as zero.

The current domain supports annual, quarterly, monthly, and weekly economic series. One provider level series can generate multiple validated outputs with distinct transformations, as headline and core CPI each do for year-over-year and three-month annualized rates. Frequency-aware presentation formats years as `2025`, quarters as `2026 Q1`, months as `June 2026`, and weeks as `Week of Jul 10, 2026` using UTC, so local timezone offsets cannot shift an economic period. Invalid and duplicate dates are rejected rather than displayed ambiguously.

## Observation date and retrieval date

An observation date identifies the economic period measured. For quarterly GDP, `2026-01-01` represents the first quarter of 2026. It does not mean the estimate was published on January 1.

The series-level `retrievedAt` date records when this particular local snapshot was downloaded. Economic estimates are revised, so two snapshots with the same observation dates can contain different values.

Observation coverage is series-specific. Maximum history is not a shared common date range: manufacturing employment and payroll derivatives begin in 1939, capacity utilization begins in 1967, and locally derived business-investment growth begins in 2008 Q1. Series details expose the actual earliest and latest included periods.

## Repository boundary

React components do not import JSON directly. They request a series by slug through `EconomicSeriesRepository`, and the local implementation validates the unknown JSON data before returning it. This keeps parsing and data-source details out of presentation code and provides a clear asynchronous boundary.

The local implementation uses an explicit slug-to-loader registry for all visible and supporting series. Dynamic JSON imports avoid placing every committed dataset in the initial application module while keeping unknown slugs and validation behavior explicit.

A future API or SQLite implementation can implement the same repository interface without changing the components that consume `EconomicSeries`. This is a narrow substitution point, not a dependency-injection framework.

## Chart adapter boundary

The domain model remains independent of Apache ECharts. A chart adapter creates chronologically sorted `[date, value]` tuples only at the chart boundary, preserving `null` values and leaving the source observations unchanged. Range selection and factual chart summaries operate on domain observations before adaptation.

## Dashboard composition and product copy

`DashboardPage` explicitly composes semantic Growth, Prices, Employment and income, Households, Housing, and Business and manufacturing sections through a small `EconomicSection` layout component. This keeps the heading hierarchy and section descriptions consistent without creating a schema-driven page engine. Future sections should be added only when real indicators exist.

Provider identity, series identity, units, frequency, transformations, dates, and observations belong to the economic-series domain data. Human explanations, related concepts, latest-value labels, and table captions belong to the explicit series presentation registry. Product copy is therefore reusable by the shared card without becoming provider metadata or chart configuration.

The card structure supports a compact historical-context visual between the primary current-value callout and expanded research detail. The Growth compact cards, headline CPI, recent inflation momentum, and real wage growth use that extension; no empty placeholder or forecast view is rendered. The real-wage model verifies exact-month availability of the committed nominal-wage, CPI, and derived real-wage observations before presentation; the compact and primary expanded charts use that same validated series. Pure range-model and summary functions preserve null gaps, calculate visible extrema with deterministic latest-tie behavior, and exclude nulls from the explicit at-or-above-zero denominator before React renders the result.

## Percent levels and growth rates

`units` and `transformation` describe different properties. GDP and CPI use percent-valued year-over-year transformations, while unemployment and prime-age employment use provider-published percent levels. A percentage unit therefore never implies a growth calculation. Shared display and chart code reads both fields and does not automatically describe percentage data as a change from one year ago.

Seasonal adjustment, frequency, observation period, and retrieval date remain independent metadata. The observation shape is unchanged for level series.

## Locally derived payroll series

PAYEMS is a provider level in thousands of persons. The dashboard does not present that raw level as its payroll measure. One refresh-time derivation creates monthly changes and a rolling three-month average, both stored in thousands of jobs. Their `providerSeriesId` and source attribution identify PAYEMS, while `transformation` states that the application calculated the displayed values. The derived monthly-change series begins one observation after the source; the three-month average begins two changes later. This separates provider source from local transformation without adding speculative metadata fields.

The primary `payroll-growth` and supporting `monthly-payroll-change` series use the unchanged `{ date, value }` observation shape. The supporting series begins two months earlier; every primary date aligns with a supporting monthly-change date. The repository loads both for one card, and React does not calculate either measure. The supporting series appears only in the payroll card's paired recent-observations table, not as a separate dashboard card.

## Estimated breakeven employment comparison

Breakeven employment growth uses a metric-specific runtime model because a
single `{ date, value }` cannot retain the estimate status and all explanatory
components. The source model stores quarterly Federal Reserve Board estimates
of a monthly job-growth pace and distinguishes historical estimates from source
projections. Quarter dates use the quarter-ending month. The aligned comparison
is a discriminated union: `available` observations retain the two PAYEMS levels,
both monthly job counts, their difference, both annualized rates, and the
percentage-point gap; `unavailable` observations retain the estimate and an
explicit missing-period or incomplete-window reason.

The comparison aligns only exact quarter-ending months. Both rates use the same
PAYEMS level three months earlier as their denominator and the same compounded
three-month-to-annual transformation. No interpolation, monthly filling, or
display rounding changes stored values. This model remains a data foundation
until its visible card is implemented separately.

## Single-source quarterly growth

Real GDP per capita growth, labor productivity growth, and real business investment growth are locally derived from single official provider level series. Each generated series preserves the level series’ FRED identifier and source attribution, while its description and transformation state that the displayed year-over-year rate is calculated by the application. This avoids implying that FRED directly supplied the exact displayed values.

The derivation compares a quarterly level only with the observation at the exact calendar quarter one year earlier. Missing levels or a missing prior-year quarter produce `null`; the calculation never substitutes the fourth previous array item or bridges a calendar gap. Leading unavailable values are omitted after derivation, while internal unavailable values remain in the unchanged `{ date, value }` observation shape.

The canonical OPHNFB level remains a provider-published `EconomicSeries`. Selected-range normalization to 100 and cumulative change are presentation values and are not persisted. Productivity momentum is the exact-quarter percentage-point difference between year-over-year growth rates four quarters apart.

The compact productivity answer is presentation-only and does not alter the stored series. It classifies the unrounded year-over-year value as `yes` at or above +0.5%, `no` at or below −0.5%, `about-the-same` strictly between those thresholds, or `unavailable` for a missing/non-finite value. Visible and accessible wording are formatted separately from that state. Momentum wording is also separate: changes that round to 0.0 percentage points are described as about the same, exactly 1 uses singular “percentage point,” and every other nonzero displayed magnitude uses plural “percentage points,” always without a percent sign.

## Multi-source wage provenance

`EconomicSeries` optionally carries a validated `sources` list for multi-source derivations. Existing single-source metadata remains valid. Real wage growth identifies AHETPI as the wage measure and CPIAUCSL as the inflation deflator; it does not imply that FRED directly publishes the combined result. The relationship card loads real wage growth, nominal wage growth, and the existing CPI inflation series as one card-level unit and aligns them by exact calendar month.

The two inflation relationship cards compose separate headline and core `EconomicSeries` values at the presentation boundary. Alignment precomputes exact-month pairs and core-minus-headline percentage-point differences before rendering; the table does not perform economic calculations. Annualized outputs remain ordinary percent-valued monthly series whose transformation metadata explicitly identifies the three-month annualized calculation.

The headline CPI card also loads core CPI and a separate headline PCE series for expanded context. Each comparison filters independently to the selected CPI range and aligns exact calendar months without carrying a value forward. The compact CPI assessment is derived from the unrounded latest CPI rate with explicit threshold states, and the displayed 2% CPI comparison is called a policy reference. The expanded headline-core panel describes an absolute gap below 0.1 percentage point as close and treats core as a diagnostic rather than a replacement for headline CPI. The separate CPI/PCE panel reserves “Federal Reserve target” for headline PCE and reports each series’ actual latest observation month.

Inflation contributions are a small metric-specific snapshot rather than
`EconomicSeries` values: each observation contains a headline CPI orientation
rate and a complete record of five percentage-point effects. The compact model
selects four categories by absolute current magnitude, nets every omitted
category into `Everything else`, orders the result from positive to negative,
and exposes the full-set reconciliation difference and status. Reconciliation
uses unrounded model inputs and a 0.05-percentage-point tolerance appropriate to
the published headline and effect precision; displayed rounding never changes
the arithmetic. Pure utilities also calculate exact one-year changes for the
unchanged expanded table and generate the finite-rule driver sentence. Category
rates are not stored as contributions, and a missing prior observation remains
unavailable.

## Household relationship and percent levels

The income-versus-spending card composes quarterly real per-capita income and spending growth series and aligns them by exact quarter. Each retains its source-level FRED identifier while transformation metadata states that exact-quarter year-over-year growth is calculated locally. Spending minus income is a percentage-point relationship calculated from aligned full-precision rates and is not persisted. The previous monthly pair was removed because income was per capita while spending was an aggregate total.

PSAVERT is a provider-published percent level, not a growth rate. Its 12-month change is expressed in percentage points and calculated by exact month without changing the observation model.

TDSP is a provider-published quarterly percent level. It estimates required mortgage and consumer-debt payments divided by aggregate disposable personal income. It uses the ordinary single-series observation shape and non-zero-forced level chart policy; no debt-payment components or household-level distribution are inferred from it.

ICSA and IC4WSA remain separate provider-published weekly claim-count levels. The relationship card aligns them by exact Saturday week-ending date and emphasizes IC4WSA; it never derives a moving average in React or during refresh. Missing weeks remain `null` gaps rather than being bridged.

The Atlanta Fed HOAM output uses the same observation shape after its official annual payment share of income is converted from a ratio to a percentage. HOUST is a provider-published monthly level in thousands of housing units at a seasonally adjusted annual rate. Neither is modeled as a growth rate, and both use non-zero-forced level charts.

IPMAN and MANEMP remain separate provider-level series in their native units. Their relationship view aligns exact months and independently normalizes each line to 100 at the first shared valid selected-range observation. Aligned observations, normalized values, cumulative changes, and comparison gaps are presentation models and are not persisted.

PNFIC1 remains identified as the source for locally derived real business-investment growth. The source has usable levels beginning in 2007 Q1, so exact-quarter year-over-year output begins in 2008 Q1; earlier unavailable provider rows are not reconstructed. TCU remains a separate provider-published monthly percentage level. Its non-zero-forced chart presentation does not turn utilization into a target, threshold, or judgment.

The corporate profit-share series aligns adjusted after-tax corporate profits (`CPATAX`) with nominal GDP (`GDP`) by exact quarter and calculates `CPATAX / GDP × 100` only when both values exist and GDP is nonzero. Raw and intermediate values are not rounded. Both source records carry their own optional observation coverage, while the derived series retains its separate coverage and full multi-source provenance.

The federal budget balance and federal debt held by the public remain separate provider-published percent-of-GDP ratios. The annual budget balance is a signed flow: negative values are deficits and positive values are surpluses. Debt held by the public is a quarterly stock relative to GDP and excludes intragovernmental holdings; it is not total federal debt or an annual spending share. These interpretations are presentation semantics rather than persisted labels.

DRTSCILM is a provider-published quarterly signed net percentage. Positive, zero, negative, and missing values retain their source meanings and ordinary observation shape. Sign-aware net-tightening or net-easing language, visible-range counts, and median comparisons are presentation calculations; the series is never combined with NFCICREDIT or transformed into a score.

## Current limitations

- The application contains twenty-eight visible research cards backed by thirty-nine committed datasets. The two breakeven files are a validated foundation for a future card; the two LMCI datasets support the briefing rather than separate research cards; other supporting datasets used within relationship cards are likewise not separate cards.
- Data is refreshed by a manual developer command and can become stale between runs.
- Runtime validation is intentionally focused on the current model and does not enforce provider-specific rules.
- There is no persistence, revision history, API, or automated refresh.
- Charting currently supports annual, quarterly, monthly, and weekly percentages or indexes, signed monthly job counts, and annualized counts in thousands.
