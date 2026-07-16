# Charting architecture

## Library choice

The dashboard uses Apache ECharts because the broader product will need capable time-series rendering, reference lines, tooltips, accessibility support, and responsive behavior. Story 03 imports only the line, grid, tooltip, mark-line, accessibility, and canvas modules used by the GDP chart. A small repository-owned React wrapper avoids another runtime abstraction dependency.

The chart component is dynamically imported with React `lazy` and rendered within a height-preserving `Suspense` fallback. Metadata, explanations, controls, the factual summary, and the table render independently while the chart chunk loads. ECharts is therefore absent from the initial application chunk.

The implementation uses ECharts 6 modular core imports and registers only the line chart, grid, tooltip, mark-line, accessibility, and canvas renderer modules required by this chart.

## Domain and chart boundaries

Economic observations remain `{ date, value }` domain objects. Pure range and summary utilities operate on those objects. Immediately before rendering, `chartAdapters.ts` sorts without mutation and converts each observation to ECharts-compatible `[date, value]` data. `null` remains `null`, so missing observations are neither converted to zero nor joined by the line.

The shared chart receives frequency, units, transformation, value formatting, and zero-inclusion policy so percentage and count data use the same UTC-safe period formatter without conflating their meanings. All seventeen current cards dynamically import the same chart module; ECharts is not duplicated.

The same deferred boundary accepts either one series or the wages-versus-inflation comparison. The comparison uses solid nominal wage growth and dashed headline CPI inflation on one shared percentage axis with a concise legend and zero reference line. Dual axes are intentionally avoided. Its tooltip includes the aligned month, both plotted rates, and exact-ratio real wage growth. Both lines use the same latest shared month and selected range.

The boundary also accepts the two CPI comparison variants. Both use solid headline and dashed core lines on one shared zero-inclusive percentage axis, with `connectNulls` and smoothing disabled. Year-over-year tooltips report the pre-aligned month, both rates, and core-minus-headline in percentage points. Momentum tooltips label both lines as three-month annualized. Each card has a distinct accessible chart label, factual text summary, card-specific range control, and 12-month semantic table. Ranges anchor to the latest shared valid month and preserve internal null gaps.

Chart options are built separately from React lifecycle management. This keeps filtering, adaptation, visual configuration, and canvas ownership independently understandable and testable.

Maximum passes every generated observation to the chart boundary. It is series-specific and does not imply a common starting year. The 5-year, 10-year, and 20-year filters remain anchored to each series' latest observation date, and the default remains 20 years.

## Lifecycle and resizing

The housing affordability cost share and housing starts use the single-series level policy without forcing zero. Housing-starts axes and tooltips explicitly label thousands at an annual rate, while its latest callout expands the stored thousands value to a readable unit count. Its selected-range factual summary reports the first, lowest, highest, and latest observations without judging the pace.

The manufacturing relationship chart aligns exact shared months, filters ranges against the latest shared valid month, and normalizes each series independently to 100 at the first shared valid observation in that range. It uses one padded non-zero-forced axis labeled `Selected-range baseline = 100`, a reference line at 100, solid output and dashed employment lines, and no dual axis. Tooltips and the accessible summary report cumulative change from the current baseline; changing the range intentionally changes that baseline. Native IPMAN and MANEMP values remain in the semantic table.

The household growth comparison reuses the two-line shared percentage-axis configuration: income is solid, spending is dashed, zero is included, gaps remain disconnected, and no dual axis is available. Personal saving rate and the quarterly household debt-service ratio use the existing single-series level policy, so their axes are padded without forcing zero or adding a target band.

`EconomicTimeSeriesChart` initializes one ECharts instance for its container, updates options when filtered observations change, and disposes the instance on unmount. A `ResizeObserver` resizes the chart when its container changes; the global window resize event is a fallback for browsers without `ResizeObserver`.

Initialization and update failures are logged for diagnosis and replaced with a visible message. Metadata, explanations, and the semantic table remain usable if canvas rendering fails.

## Visual decisions

Every line uses actual observations without smoothing because a smoothed curve would imply values between measured periods. Animation, gradients, area fills, and point symbols at every observation are omitted to keep the display restrained.

ECharts' time axis continues to hide overlapping labels and choose readable time ticks for long histories. No downsampling or aggregation is applied; tooltips retain access to every generated observation. Measurements did not show a need for additional rendering optimization.

Axis policy is series-specific. GDP growth, real GDP per capita growth, labor productivity growth, CPI inflation, and payroll growth include zero and retain the zero reference line. The normalized productivity-level chart does not force zero or add a zero line because its selected-range baseline is 100. Unemployment and prime-age employment are percentage levels whose meaningful variation is well above zero, so their axes use at least 0.5 percentage point or 10% of the visible span as padding without forcing zero. Payroll preserves positive and negative changes without forcing a symmetric axis. This preserves a readable range without adding thresholds or value judgments. A zero line is rendered only when zero inclusion is enabled.

Tooltips use ECharts' browser-native HTML renderer with non-interactive content, so the tooltip cannot take hover away from the plotting area. Formatters return plain text only. Percentage series retain one-decimal percentage formatting. Payroll tooltips show the month and a signed rounded count in thousands, such as `+145K`; full derived precision remains in JSON.

## Accessibility

The chart container has a descriptive accessible label, and ECharts accessibility support is enabled. Because canvas alone is not a sufficient nonvisual representation, each card also provides a live factual summary that updates with the selected range. Percentage summaries retain existing formatting. Payroll describes extrema as job gains or losses using full counts or readable millions and keeps zero meaningful. Its recent semantic table aligns the monthly change and three-month average by month without recalculating either value in React.

Native buttons with `aria-pressed` expose the selected time range and retain the application's visible focus treatment. Selection also uses border weight and underlining, rather than color alone.

## Extending charting

Future time-series charts can reuse the lifecycle component, adapter pattern, range control, and pure summary utilities when their behavior matches. Different units or chart types should supply focused option builders instead of adding conditional domain or visualization logic to the GDP component.

## Current limitations

- Percentage, index, signed-count, and annualized-thousands monthly or quarterly line series are currently charted.
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

With Story 10, the initial application chunk is 314.17 kB minified (98.04 kB gzip). Nominal and real wage data chunks are 33.67 kB and 34.55 kB. The one shared chart/ECharts chunk is 538.34 kB minified (181.25 kB gzip); the increase comes from registering the ECharts legend component, ECharts remains deduplicated, and the existing warning remains.

With Story 11, the initial application chunk is 316.29 kB minified (98.44 kB gzip). The real-GDP-per-capita and labor-productivity data chunks are 15.12 kB (4.85 kB gzip) and 15.04 kB (4.77 kB gzip). The build still emits one shared chart/ECharts chunk at 538.34 kB minified (181.25 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 12, the initial application chunk is 324.91 kB minified (99.91 kB gzip). The new core year-over-year, core momentum, and headline momentum data chunks are 37.41 kB, 37.62 kB, and 43.02 kB minified. The build emits one shared chart/ECharts chunk at 540.66 kB minified (181.57 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 13, the initial application chunk is 336.76 kB minified (101.87 kB gzip). The income-growth, spending-growth, and saving-rate data chunks are 36.64 kB, 10.97 kB, and 25.35 kB minified. The build emits one shared chart/ECharts chunk at 541.35 kB minified (181.74 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 12A applied after Story 13, the initial application chunk is 345.65 kB minified (103.37 kB gzip). The canonical productivity-level data chunk is 11.51 kB, and the reframed productivity-growth chunk remains 15.05 kB. The build emits one shared chart/ECharts chunk at 541.71 kB minified (181.90 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 14, the initial application chunk is 347.08 kB minified (103.66 kB gzip), and the new household-debt-service-ratio data chunk is 4.07 kB (1.31 kB gzip). The build emits one shared chart/ECharts chunk at 541.71 kB minified (181.90 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 15, the initial application chunk is 350.98 kB minified (104.61 kB gzip). The home-ownership-cost-share and housing-starts data chunks are 12.46 kB (3.89 kB gzip) and 26.01 kB (4.81 kB gzip). The build emits one shared chart/ECharts chunk at 541.79 kB minified (181.93 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 16, the initial application chunk is 359.94 kB minified (106.23 kB gzip). The manufacturing-output and manufacturing-employment data chunks are 23.23 kB (5.25 kB gzip) and 34.61 kB (6.46 kB gzip). The build emits one shared chart/ECharts chunk at 544.26 kB minified (182.22 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.
