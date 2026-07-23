# Compact card architecture decision

Status: **Implemented for Real GDP growth, Real GDP per capita growth, labor-productivity growth, headline CPI inflation, and inflation drivers**

Decision date: July 21, 2026

Scope: research-dashboard cards, not briefing tiles

## Decision

Story 38 validated the proposed boundary with a second concrete metric, Story 39 reused it for labor-productivity growth, and Story 41 applied it to headline CPI with a metric-specific policy reference. The implementation has three small composition boundaries shared by these four cards:

1. a compact-card layout and disclosure component;
2. a presentation-only historical-band chart that consumes an already-derived model;
3. a pure configurable historical-band derivation utility.

Metric wording, value formatting, statistical meaning, and exception layouts remain outside those shared pieces. This is not a schema-driven universal dashboard card.

Story 42 confirms that the shared shell does not require every compact visual to
use historical bands. Inflation drivers composes its own horizontal contribution
visual into `CompactMetricCardLayout` while reusing the extracted
`CompactChartHelp` interaction. Its contribution grouping, zero-centered bars,
summary thresholds, and reconciliation logic remain metric-specific.

## Current state

### Shared implementation

- `EconomicSeriesCard` owns asynchronous repository loading, validation outcomes, supporting-series loading, and routing to single-series or relationship-card presentations.
- `CompactMetricCardLayout` owns the common article, header, headline layout, native More/Less disclosure, and expanded-content slot while leaving data and research-chart state with `EconomicSeriesSummary`.
- `HistoricalBandChart` owns the compact ECharts lifecycle, option rendering, accessible summary, footer, and help interaction.
- `CompactHistoricalMetricChart` adapts a derived model and metric definition to that shared chart.
- `deriveHistoricalBandContext` owns configurable, presentation-only window and percentile derivation.
- `compactHistoricalMetrics.ts` contains explicit definitions and neutral wording for Real GDP growth, Real GDP per capita growth, labor-productivity growth, and headline CPI inflation.
- `.series-card__*`, `.series-current__*`, and `.historical-band-chart__*` classes control the shared shell and chart; compact values are centralized as CSS custom properties in `tokens.css`.
- `EconomicTimeSeriesChart`, its option builders, and `useHistoricalZoom` provide the shared full-chart path.
- `calculatePercentileValue`, observation sorting, and period/value formatters are pure utilities already usable outside React.
- The compact GDP chart preserves lazy loading and uses the same committed observations already loaded for the research card.

### Metric-specific today

- Each metric definition explicitly chooses its recent and comparison windows, percentile boundaries, minimum history, missing-latest policy, zero line, optional reference lines, marker, help copy, and historical-position language.
- Real GDP growth, Real GDP per capita growth, and labor-productivity growth each currently use 20 recent quarters, a trailing 25-year comparison, 25th–75th and 10th–90th bands, and a last-observation policy. These remain explicit per-metric choices, not global defaults.
- Headline CPI uses 61 monthly endpoints to show a five-year line, the same trailing 25-year percentile definitions, zero, and a 2% policy-reference line. Its help copy states that the Federal Reserve formally targets PCE inflation rather than CPI.
- Formatting and source-series interpretation remain with the metric and existing research-card path.

### Avoided duplication

The shared pieces avoid duplicating disclosure behavior, ECharts lifecycle and resize cleanup, help-button event handling, band construction, responsive footer placement, decorative-canvas handling, and statistical edge cases. Slug-specific formatting and unrelated card variants have not been moved into a universal configuration object.

## Implemented boundaries

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
  collapsible?: boolean
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
  showZeroLine: boolean
  showLatestMarker: boolean
  caption: string
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

Implemented CSS tokens include:

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

The TypeScript ECharts theme centralizes:

```ts
compactChartTheme.line
compactChartTheme.innerBandFill
compactChartTheme.outerBandFill
compactChartTheme.zeroLine
compactChartTheme.latestMarker
```

The shared selectors use `.historical-band-chart__*`; no GDP-named production chart or option module remains.

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

## Migration strategy for another card

1. Decide first whether a percentile band is truthful and useful for the metric.
2. Write the statistical rules, zero meaning, formatter, and neutral position language explicitly.
3. Add a metric definition only when the existing historical-band geometry fits; otherwise compose a different compact visual into `CompactMetricCardLayout`.
4. Verify that compact and expanded views consume the same loaded observations and preserve expanded controls.
5. Add derivation, adapter, accessibility, responsive-browser, and bundle coverage.
6. Migrate no other cards opportunistically.

## Testing strategy

- Pure derivation: window boundaries, percentile interpolation, null handling, insufficient history, latest policy, and overrides.
- Shared layout: semantic order, required content, default state, More/Less keyboard activation, state preservation, and optional compact visual.
- Chart options: layer order, optional zero line and marker, formatter delegation, gaps, and shared theme values.
- Help: click/tap, Enter/Space, Escape and focus restoration, outside dismissal, unique IDs, and supplied wording.
- Per-card integration: one observation source feeds compact and full views, accessible summary appears once, and expanded content remains unchanged.
- Browser: desktop and narrow layout, footer collision, popover bounds, dual-chart resize, and no overflow.
- Bundle: compact and full charts remain lazy, use modular ECharts imports, and emit one shared renderer dependency.

## Consequences

Three concrete consumers now use the layout, derivation, chart, interaction, theme, and token boundaries. Future cards can gain consistent structure without inheriting any current metric’s interpretation. Cards whose meaning does not fit percentile bands should reuse only the layout or remain unchanged.
