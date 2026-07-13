# Product principles

The U.S. Economy Dashboard is an economic briefing built from complementary indicators, not a system for producing one economic score. Different measures can point in different directions at the same time, and the interface should preserve that ambiguity rather than force a verdict.

## Three conceptual layers

The product vision has three layers:

1. **Current condition.** Show what each indicator currently measures, its latest observation, and enough supporting detail to interpret it accurately. This is the substantially implemented layer today.
2. **Historical context.** Help users compare the current observation with prior periods, ranges, and distributions through purposeful visualizations. The existing time-series charts provide basic history; compact median, marker, range, and percentile views remain future work.
3. **Relationships and expectations.** Help users examine relationships among indicators and compare expectations with outcomes. This is a future product area; the dashboard does not currently calculate correlations, divergences, forecasts, or forecast errors.

## Human questions first

Every indicator leads with the human question it helps answer. Technical provider titles and identifiers remain supporting metadata. This keeps the briefing understandable without obscuring provenance.

## Numbers for emphasis, visuals for context

Each card emphasizes one latest value and observation period. The main chart carries historical context. The dashboard avoids dense strips of equally weighted current, prior-year, five-year, and median values. Future comparisons should usually be visual when that makes relationships easier to understand.

## No unsupported verdicts

Indicators are not labeled good, bad, healthy, unhealthy, strong, weak, concerning, or excellent without an explicit and defensible analytical rule. Broad red-versus-green framing is avoided. GDP can grow while inflation remains elevated, and future employment or manufacturing measures may conflict, without requiring a composite rating.

## Visual hierarchy over density

The page is organized into explicit economic sections. Within each card, the question, current value, range control, and chart lead. Explanations, related concepts, source attribution, metadata, and observations follow in decreasing visual priority. Empty future sections and fake indicators are not rendered.

## Supporting detail remains available

Source attribution stays visible. Native disclosures hold technical metadata and recent semantic tables, keeping them keyboard accessible without making them the primary visual emphasis. Observation values are never replaced with raw JSON.

## Accessibility is primary

Heading hierarchy, native controls, visible focus, nonvisual chart summaries, source links, and semantic tables are part of the main product experience. Canvas charts supplement rather than replace meaningful text and tabular representations.

## Current organization decisions

The implemented sections are Growth, Prices, and Employment and income. Future sections may include consumers, housing, business and manufacturing, government, financial conditions, and expectations versus outcomes, but they are not displayed until they contain real indicators.

Employment and income pairs unemployment with prime-age employment-to-population ratio as separate cards. Presenting complementary measures together adds context without combining them into a labor-market score.

Payroll growth uses a clearly labeled rolling three-month average as its primary measure to reduce single-month volatility. The underlying monthly changes remain available in the same card so smoothing does not hide the source-derived observations.

In-page navigation remains deferred at three sections. The semantic section identifiers provide a stable place to add restrained navigation when the briefing grows enough to justify it.
