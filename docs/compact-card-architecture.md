# Compact card architecture decision

Status: **Accepted for the next compact-card rollout**

Decision date: July 21, 2026

Scope: research-dashboard cards, not briefing tiles

## Decision

Do not refactor Card #1 in this investigation story. There is only one compact historical-band card, so a generic implementation cannot yet be tested against a second metric’s real semantics.

When Card #2 is selected, extract three small composition boundaries in the same story and migrate Card #1 and Card #2 together:

1. a compact-card layout and disclosure component;
2. a presentation-only historical-band chart that consumes an already-derived model;
3. a pure configurable historical-band derivation utility.

Keep metric wording, value formatting, statistical meaning, and exception layouts outside those shared pieces. Do not build a schema-driven universal dashboard card.

## Current state

### Already shared

- `EconomicSeriesCard` owns asynchronous repository loading, validation outcomes, supporting-series loading, and routing to single-series or relationship-card presentations.
- `EconomicSeriesSummary` owns the common article, header, latest-value callout, More/Less disclosure, full research chart, zoom controls, explanations, metadata, and tables for single-series cards.
- `.series-card__*` and `.series-current__*` classes control the shared header, question, measure, latest-value callout, disclosure, spacing, and responsive shell.
- `EconomicTimeSeriesChart`, its option builders, and `useHistoricalZoom` provide the shared full-chart path.
- `calculatePercentileValue`, observation sorting, and period/value formatters are pure utilities already usable outside React.
- The compact GDP chart preserves lazy loading and uses the same committed observations already loaded for the research card.

### GDP-specific today

- `EconomicSeriesSummary` checks `series.slug === 'real-gdp-growth'`, derives GDP context, and inserts the compact chart.
- `gdpCompactHistoricalContext.ts` fixes the 20-quarter recent window, 25-year comparison window, percentile boundaries, minimum history, missing-latest policy, and GDP position categories.
- `gdpCompactHistoricalChartOptions.ts` fixes GDP labels, tooltip prose, accessible summary, y-domain policy, zero line, latest marker, line color, and band colors.
- `GdpCompactHistoricalChart` owns the compact ECharts lifecycle, GDP footer title, help text, and help interaction.
- The compact layout modifier and compact-chart CSS remain named around the first implementation rather than a demonstrated family.

### Duplication risk

Copying Card #1 would duplicate disclosure behavior, ECharts lifecycle and resize cleanup, help-button event handling, band construction, responsive footer placement, inaccessible-canvas handling, and statistical edge cases. Conversely, moving all slug-specific value formatting and every card variant into one configuration object would enlarge an already conditional `EconomicSeriesSummary` and erase meaningful differences among metrics.

## Recommended boundaries

### Compact card composition

Use a layout component, not a universal data-driven card. It should own semantic order and disclosure mechanics while accepting already-formatted content.

```ts
interface CompactMetricCardLayoutProps {
  cardId: string
  eyebrow: ReactNode
  question: ReactNode
  measureLabel: ReactNode
  latestValue: ReactNode
  compactVisual?: ReactNode
  expandedContent: ReactNode
  defaultExpanded?: boolean
}
```

It owns the article, header, headline grid, native disclosure button, stable reading order, and conditional expanded region. It does not load data, format values, choose statistics, generate metric interpretation, know series slugs, or own range state inside expanded research content.

The card container should continue deriving data once and pass the same observations to compact and expanded children. The latest callout and compact visual stay mounted while expanded content opens. Parent-owned research state must persist across Less/More as it does for Card #1.

### Historical-band derivation

Extract only after Card #2 confirms that it uses the same percentile concept.

```ts
interface HistoricalBandDefinition {
  recentObservationCount: number
  comparisonWindow:
    | { kind: 'trailing-years'; years: number }
    | { kind: 'all-available' }
  innerPercentiles: readonly [number, number]
  outerPercentiles: readonly [number, number]
  minimumFiniteObservations: number
  latestObservationPolicy: 'last-observation' | 'latest-finite'
}

interface HistoricalBandModel {
  recentObservations: readonly EconomicObservation[]
  comparisonStart: string
  comparisonEnd: string
  innerLower: number
  innerUpper: number
  outerLower: number
  outerUpper: number
  latestObservation: EconomicObservation & { value: number }
}
```

The utility sorts without mutation, selects the comparison window, excludes nulls only from percentile calculation, preserves recent null gaps, and returns a discriminated unavailable result. Percentile math may be shared; position classification and language remain metric-owned unless two real metrics prove identical semantics.

Every definition is explicit per card. A 25-year window, 20 recent quarters, 10/25/75/90 thresholds, or last-observation policy must never become an undocumented global economic rule.

### Historical-band chart

The shared chart is a view over a derived model. ECharts option construction belongs beside the shared chart, separate from React lifecycle and domain calculations.

```ts
interface HistoricalBandChartProps {
  model: HistoricalBandModel
  seriesLabel: string
  frequency: EconomicFrequency
  valueFormatter: (value: number | null) => string
  accessibleSummary: string
  helpText: HistoricalBandHelpText
  appearance?: {
    showZeroLine?: boolean
    showLatestMarker?: boolean
    height?: 'compact' | 'tall'
  }
}

interface HistoricalBandHelpText {
  heading: string
  comparisonDescription: string
  innerBandDescription: string
  outerBandDescription: string
  outsideBandDescription: string
}
```

Generic behavior is limited to a nonsmoothed line with gaps, outer-then-inner band layering, ECharts lifecycle and resizing, optional zero line and latest marker, supplied formatting, decorative canvas treatment, shared help interaction, footer layout, and an explicit unavailable state.

The metric owns whether percentiles are meaningful; window and threshold choices; zero and y-domain semantics; labels and formatters; position categories; accessible summary; and help wording. If Card #2 needs different geometry or semantics, reuse the card layout and help primitive but keep a dedicated chart.

## Shared styling points

DOM styles remain CSS custom properties in `tokens.css`; canvas colors should be centralized once in a small TypeScript chart-theme module because ECharts canvas rendering cannot reliably consume unresolved CSS variables.

Proposed CSS tokens:

```css
--compact-card-gap
--compact-card-question-size
--compact-card-measure-size
--compact-card-callout-border
--compact-card-value-size
--compact-chart-height
--compact-chart-footer-size
--compact-chart-help-size
--compact-chart-popover-width
```

Proposed ECharts theme values:

```ts
compactChartTheme.line
compactChartTheme.innerBandFill
compactChartTheme.outerBandFill
compactChartTheme.zeroLine
compactChartTheme.latestMarker
```

Introduce tokens only when extraction begins. Until then, `.series-card__*`, `.series-current__*`, and `.gdp-compact-chart__*` remain Card #1’s single control points.

## Accessibility responsibilities

The shared layout owns heading association, DOM order, disclosure state, control relationship, and visible focus. The shared help primitive owns its native button, expanded state, outside-pointer dismissal, Escape dismissal, and focus restoration.

The metric adapter supplies the accessible summary. Generic prose must not claim that high, low, above-zero, or outside-band values are favorable or adverse. The figure exposes the summary once; canvas internals remain decorative. Reading order is eyebrow, question, measure, latest value, compact visual and help, disclosure, then expanded research content.

## Exceptions and escape hatches

Compact collapse does not imply a historical-band chart. Escape hatches are composition slots and dedicated chart components, not flags added to a universal card.

- Relationship cards such as wages/inflation, income/spending, manufacturing output/employment, rates, and claims need both essential series and relationship-specific summaries.
- Index-level cards such as productivity level may require rebasing and a meaningful baseline rather than percentile bands.
- Balance and stock measures such as budget balance, trade balance, and federal debt have asymmetric or path-dependent interpretation; zero is meaningful for balances but generally not stocks.
- Diffusion and standardized indexes such as lending standards and broad credit conditions have source-defined zero semantics and no simple higher-is-better direction.
- Level measures such as capacity utilization, housing affordability, housing starts, saving, and debt service often have no useful zero line.
- Metrics with ambiguous welfare direction must not inherit favorable/adverse colors or prose.
- Multi-series cards may use the shared compact layout with a dedicated compact visual, or remain full cards when compacting would hide essential evidence.

Every rollout may choose the standard historical-band chart, another compact visual, a value-only collapsed card, or no collapsed treatment.

## Migration strategy

1. Choose Card #2 based on product value and semantic fit.
2. Write its compact statistical and language rules before extracting code.
3. Extract `CompactMetricCardLayout` from common GDP markup and prove it with GDP plus Card #2.
4. If Card #2 uses percentile bands, extract pure derivation and chart view with explicit per-card definitions; otherwise keep the GDP chart dedicated.
5. Extract the help primitive only when both cards use the same interaction.
6. Move proven constants into shared CSS and chart-theme tokens.
7. Migrate no other cards opportunistically.

Recommendation before Card #2: **do not perform a standalone refactor**. Include the smallest extraction at the start of Card #2, then retain or revise each boundary based on two concrete consumers.

## Testing strategy

- Pure derivation: window boundaries, percentile interpolation, null handling, insufficient history, latest policy, and overrides.
- Shared layout: semantic order, required content, default state, More/Less keyboard activation, state preservation, and optional compact visual.
- Chart options: layer order, optional zero line and marker, formatter delegation, gaps, and shared theme values.
- Help: click/tap, Enter/Space, Escape and focus restoration, outside dismissal, unique IDs, and supplied wording.
- Per-card integration: one observation source feeds compact and full views, accessible summary appears once, and expanded content remains unchanged.
- Browser: desktop and narrow layout, footer collision, popover bounds, dual-chart resize, and no overflow.
- Bundle: compact and full charts remain lazy, use modular ECharts imports, and emit one shared renderer dependency.

## Consequences

The GDP conditional remains temporarily. That is cheaper than stabilizing an API against one example. Card #2 carries a modest extraction cost but provides evidence about what is truly shared. Future cards gain consistent layout and controls without inheriting GDP’s statistical interpretation.
