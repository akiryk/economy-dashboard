# Charting architecture

## Library choice

The dashboard uses Apache ECharts because the broader product will need capable time-series rendering, reference lines, tooltips, accessibility support, and responsive behavior. Story 03 imports only the line, grid, tooltip, mark-line, accessibility, and canvas modules used by the GDP chart. A small repository-owned React wrapper avoids another runtime abstraction dependency.

The chart component is dynamically imported with React `lazy` and rendered within a height-preserving `Suspense` fallback. Metadata, explanations, controls, the factual summary, and the table render independently while the chart chunk loads. ECharts is therefore absent from the initial application chunk.

The implementation uses ECharts 6 modular core imports and registers only the line chart, grid, tooltip, mark-line, accessibility, and canvas renderer modules required by this chart.

## Domain and chart boundaries

Economic observations remain `{ date, value }` domain objects. Pure range and summary utilities operate on those objects. Immediately before rendering, `chartAdapters.ts` sorts without mutation and converts each observation to ECharts-compatible `[date, value]` data. `null` remains `null`, so missing observations are neither converted to zero nor joined by the line.

The shared chart receives frequency, units, transformation, value formatting, and zero-inclusion policy so percentage and signed-count data use the same UTC-safe period formatter without conflating their meanings. All five cards dynamically import the same chart module; ECharts is not duplicated.

Chart options are built separately from React lifecycle management. This keeps filtering, adaptation, visual configuration, and canvas ownership independently understandable and testable.

Maximum passes every generated observation to the chart boundary. It is series-specific and does not imply a common starting year. The 5-year, 10-year, and 20-year filters remain anchored to each series' latest observation date, and the default remains 20 years.

## Lifecycle and resizing

`EconomicTimeSeriesChart` initializes one ECharts instance for its container, updates options when filtered observations change, and disposes the instance on unmount. A `ResizeObserver` resizes the chart when its container changes; the global window resize event is a fallback for browsers without `ResizeObserver`.

Initialization and update failures are logged for diagnosis and replaced with a visible message. Metadata, explanations, and the semantic table remain usable if canvas rendering fails.

## Visual decisions

Every line uses actual observations without smoothing because a smoothed curve would imply values between measured periods. Animation, gradients, area fills, and point symbols at every observation are omitted to keep the display restrained.

ECharts' time axis continues to hide overlapping labels and choose readable time ticks for long histories. No downsampling or aggregation is applied; tooltips retain access to every generated observation. Measurements did not show a need for additional rendering optimization.

Axis policy is series-specific. GDP growth, CPI inflation, and payroll growth include zero and retain the zero reference line. Unemployment and prime-age employment are percentage levels whose meaningful variation is well above zero, so their axes use at least 0.5 percentage point or 10% of the visible span as padding without forcing zero. Payroll preserves positive and negative changes without forcing a symmetric axis. This preserves a readable range without adding thresholds or value judgments. A zero line is rendered only when zero inclusion is enabled.

Tooltips use ECharts' rich-text renderer rather than HTML. Percentage series retain one-decimal percentage formatting. Payroll tooltips show the month and a signed rounded count in thousands, such as `+145K`; full derived precision remains in JSON.

## Accessibility

The chart container has a descriptive accessible label, and ECharts accessibility support is enabled. Because canvas alone is not a sufficient nonvisual representation, each card also provides a live factual summary that updates with the selected range. Percentage summaries retain existing formatting. Payroll describes extrema as job gains or losses using full counts or readable millions and keeps zero meaningful. Its recent semantic table aligns the monthly change and three-month average by month without recalculating either value in React.

Native buttons with `aria-pressed` expose the selected time range and retain the application's visible focus treatment. Selection also uses border weight and underlining, rather than color alone.

## Extending charting

Future time-series charts can reuse the lifecycle component, adapter pattern, range control, and pure summary utilities when their behavior matches. Different units or chart types should supply focused option builders instead of adding conditional domain or visualization logic to the GDP component.

## Current limitations

- Only percentage-valued and signed-count monthly or quarterly line series are currently charted.
- Data does not refresh automatically.
- The selected range is local component state and is not reflected in the URL.
- The recent-observations table contains eight values rather than every visible chart point.
- Canvas behavior is verified manually; component tests mock the ECharts lifecycle boundary.

## Measured bundle impact

With Story 03, the single primary JavaScript chunk was 814.67 kB minified (269.40 kB gzip). After dynamic import and inclusion of the expanded local dataset, the primary application chunk is 299.28 kB minified (95.22 kB gzip), and the separately requested chart/ECharts chunk is 517.61 kB minified (174.99 kB gzip).

Vite still reports its 500 kB warning for the deferred chart chunk. The warning threshold remains unchanged; the goal of removing ECharts from initial application loading is met even though total JavaScript remains similar.

With both Story 05 series, the primary application chunk is 297.09 kB minified (94.46 kB gzip). GDP and CPI data are separate 4.61 kB and 11.76 kB chunks. The single shared chart/ECharts chunk is 517.65 kB minified (175.02 kB gzip); no second ECharts copy is emitted, and Vite continues to warn about that shared chunk.

With Story 07, the initial application chunk is 301.98 kB minified (95.78 kB gzip). GDP, CPI, unemployment, and prime-age employment data are separate 4.61 kB, 11.76 kB, 10.42 kB, and 10.77 kB chunks. The build emits one shared chart/ECharts chunk at 517.94 kB minified (175.08 kB gzip). ECharts remains deduplicated, and Vite continues to report the existing 500 kB warning for that deferred chunk.

With Story 08, the initial application chunk is 306.01 kB minified (96.61 kB gzip). Monthly payroll change and payroll growth are separate 10.54 kB and 13.78 kB data chunks. The build still emits one shared chart/ECharts chunk at 518.06 kB minified (175.14 kB gzip); ECharts remains deduplicated, and Vite continues to report the existing deferred-chunk warning.

With Story 09 full histories, the initial application chunk remains 306.01 kB minified (96.61 kB gzip), and the shared chart/ECharts chunk remains 518.06 kB minified (175.13 kB gzip). Expanded data chunks are 11.66 kB GDP, 32.89 kB CPI, 29.04 kB unemployment, 29.95 kB prime-age employment, 32.45 kB monthly payroll change, and 42.73 kB payroll growth. ECharts remains deduplicated and the existing deferred-chunk warning remains.
