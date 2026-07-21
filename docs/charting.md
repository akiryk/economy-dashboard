# Charting architecture

For the product-level inventory of the 28 visible charts and their rationale, see [`product-overview.md`](product-overview.md).

## Library choice

The dashboard uses Apache ECharts because the broader product will need capable time-series rendering, reference lines, tooltips, accessibility support, and responsive behavior. Story 03 imports only the line, grid, tooltip, mark-line, accessibility, and canvas modules used by the GDP chart. A small repository-owned React wrapper avoids another runtime abstraction dependency.

The chart component is dynamically imported with React `lazy` and rendered within a height-preserving `Suspense` fallback. Metadata, explanations, controls, the factual summary, and the table render independently while the chart chunk loads. ECharts is therefore absent from the initial application chunk.

The implementation uses ECharts 6 modular core imports and registers only the line chart, grid, tooltip, mark-line, legend, data-zoom, accessibility, and canvas renderer modules required by current charts.

## Domain and chart boundaries

Economic observations remain `{ date, value }` domain objects. Pure range and summary utilities operate on those objects. Immediately before rendering, `chartAdapters.ts` sorts without mutation and converts each observation to ECharts-compatible `[date, value]` data. `null` remains `null`, so missing observations are neither converted to zero nor joined by the line.

The shared chart receives frequency, units, transformation, value formatting, and zero-inclusion policy so percentage, index, and count data use the same UTC-safe period formatter without conflating their meanings. All twenty-eight current cards dynamically import the same chart module; ECharts is not duplicated.

Story 18 adds native weekly labels and range/zoom support through the existing frequency-aware utilities. The interest-rate relationship aligns FEDFUNDS and GS10 by exact month, plots both on one zero-inclusive percentage axis, and calculates GS10 minus FEDFUNDS only in its presentation model. The NFCICREDIT chart retains native weekly observations and includes the meaningful zero line; positive values are described only with the source-defined tighter-than-average wording and negative values as looser than average. Both cards reuse the shared historical-zoom controller.

Story 19 adds shared annual year labels and FRED annual-frequency requests without card-specific range or zoom logic. The federal budget-balance chart includes zero and preserves negative deficits and positive surpluses. Federal debt held by the public uses the padded percentage-level axis without forcing zero or adding a 100% threshold. Both fiscal cards inherit the same preset and historical-zoom path as every other single-series card.

Story 20 adds two quarterly charts through that same path. Trade balance includes zero and preserves signed deficit/surplus values; effective tariff burden includes zero and displays the locally derived customs-to-goods-import ratio. Both cards inherit the established range presets, canvas slider, companion controls, visible-period summaries, and reset behavior.

Story 22 adds an exact-date weekly relationship chart for ICSA and the provider-published IC4WSA four-week average. The average is the prominent solid line and weekly claims are a thinner dashed secondary line on one claims axis. Neither line is smoothed or connected across missing dates, and the tooltip displays whole claim counts.

Story 23 uses the existing signed single-series path for quarterly DRTSCILM. Its zero reference line distinguishes net tightening from net easing, while the nonsmoothed line preserves missing quarters. No background verdict zones, rolling average, or mathematical combination with NFCI is added.

Story 24 uses the existing single quarterly line for the locally derived `CPATAX / GDP × 100` profit share. It does not force zero, add raw inputs, use dual axes, index the result, or infer a market signal. Maximum shows the full exact shared history beginning in 1947 Q1.

The same deferred boundary accepts either one series or the wages-versus-inflation comparison. The comparison uses solid nominal wage growth and dashed headline CPI inflation on one shared percentage axis with a concise legend and zero reference line. Dual axes are intentionally avoided. Its tooltip includes the aligned month, both plotted rates, and exact-ratio real wage growth. Both lines use the same latest shared month and selected range.

The boundary also accepts the two CPI comparison variants. Both use solid headline and dashed core lines on one shared zero-inclusive percentage axis, with `connectNulls` and smoothing disabled. Year-over-year tooltips report the pre-aligned month, both rates, and core-minus-headline in percentage points. Momentum tooltips label both lines as three-month annualized. Each card has a distinct accessible chart label, factual text summary, card-specific range control, and 12-month semantic table. Ranges anchor to the latest shared valid month and preserve internal null gaps.

Chart options are built separately from React lifecycle management. This keeps filtering, adaptation, visual configuration, and canvas ownership independently understandable and testable.

### Real GDP compact historical context

Story 34 adds a pure, ECharts-independent preparation model for the future compact Real GDP growth chart. It does not yet change either the collapsed card or the full research chart.

- The comparison window is the trailing 25 years ending at the latest committed quarter, including the exact boundary.
- At least 20 finite quarterly observations are required. Fewer values return an explicit insufficient-history result rather than percentile bands.
- Nulls are excluded from percentile calculations and preserved as gaps in the recent display sequence.
- The recent sequence contains the latest 20 committed quarterly observations in chronological order, or all observations when fewer than 20 exist.
- The 10th, 25th, 50th, 75th, and 90th percentiles use linear interpolation on the zero-based sorted-index scale: `index = percentile / 100 × (n - 1)`. Exact observations and ties retain their sorted values; interpolation occurs only when the index is fractional. Domain thresholds retain full precision.
- The latest position categories are `belowOuterBand`, `betweenOuterAndInnerLow`, `insideInnerBand`, `betweenInnerAndOuterHigh`, and `aboveOuterBand`. Exact 10th and 90th percentile values belong to their adjacent outer-to-inner categories; exact 25th and 75th percentile values belong inside the inner band. A null latest observation produces an explicit unavailable result.

For the committed January 2026 endpoint, the comparison spans January 2001 through January 2026 with 101 valid observations. The thresholds are 0.48924% (10th), 1.67926% (25th), 2.32528% (median), 3.00914% (75th), and 3.49486% (90th). The latest 2.68474% reading is `insideInnerBand`. These bands describe historical commonness, not whether growth is good or bad.

Story 35 consumes that ready domain result in an isolated lazy-loaded fixture at `/previews/gdp-compact-chart`; it is not integrated into the production GDP card. A standard line series owns two `markArea` entries, ordered outer then inner so the darker 25th–75th band layers over the lighter 10th–90th band. The same series uses a dashed `markLine` at zero and a small `markPoint` at the latest observation. Axes, legend, zoom, toolbox, title, symbols for non-latest points, smoothing, and gap connection are disabled.

The compact y-domain includes zero, both outer bounds, and every finite recent value, then adds 8% padding with a 0.25-point minimum. It never clips, caps, or breaks the scale. The tooltip reports only quarter and GDP growth, adding the factual historical-position phrase for the latest point. A visible figure caption and chart accessible name state the latest reading, recent endpoints, band definitions, latest position, and comparison period without causal or evaluative language. Insufficient Story 34 evidence renders an unavailable status rather than false bands. The component owns an isolated ECharts instance, resizes through `ResizeObserver` with the established window fallback, and disposes on unmount.

Product review on July 20, 2026 found the original 12-quarter path legible at both a 662×192 desktop plot and a 278×192 narrow plot, with no page overflow and a valid responsive canvas after resizing. The two yellow-neutral bands remained visibly distinct, the blue line remained legible across both, and the separated dashed zero line added clear contraction context without implying a target. This review used `markArea`, not stacked area series. A July 21 refinement extended the recent line to 20 quarters (five years) while retaining the same chart height and historical-band calculation.

Story 36 integrates the approved component into the production Real GDP card only. The headline callout and compact chart share the already loaded series and render side by side from 48rem upward, stacking below that breakpoint. The compact chart remains mounted when More reveals the unchanged full research chart; each owns and resizes its own valid ECharts canvas, and the build continues to emit one shared ECharts renderer dependency rather than a duplicate library. The production figure visually hides its long caption to preserve scan density, but that caption remains the figure's single accessible name and precedes More in reading order; decorative canvas internals are hidden from assistive technology. The isolated preview retains the visible caption.

Story 36A adds a lower-right help button to the compact chart. Its anchored 14px explanation reports the comparison period and defines the dark middle-50% band, the light middle-80% range, and observations in the highest or lowest 10%. It opens by click, tap, Enter, or Space and closes on a second activation, Escape, or an outside pointer action. Escape restores focus to the trigger. The help layer does not alter the chart calculation or full research view.

The compact chart footer pairs that help button with a small, muted lower-left title. The title is data-derived rather than hard-coded: it names Real GDP growth and formats the actual first and last quarters in the 20-observation line. For the July 2026 committed data, that range is 2021 Q2–2026 Q1.

Wide, 900px laptop, and 360px integration review found no horizontal overflow. Compact canvases measured 589×192, 457×192, and 294×192 respectively; full expanded charts measured 1006×384, 786×384, and 294×384. Preset selection, zoom, reset, source access, keyboard expansion, and simultaneous compact/full rendering all remained functional. Compared with the Story 33 value-only card, the result adds immediate trajectory and historical commonness while remaining materially shorter and easier to scan than the expanded research view. Story 38 subsequently expanded this treatment to the second card through the shared architecture described below.

Story 37 audits that experiment and records the accepted reuse boundary in [`compact-card-architecture.md`](compact-card-architecture.md). Story 38 validates the boundary with Real GDP per capita growth: both GDP cards now use `CompactMetricCardLayout`, `HistoricalBandChart`, configurable `deriveHistoricalBandContext`, explicit metric adapters, shared CSS tokens, and a TypeScript canvas theme. Both use 20 recent quarters and trailing 25-year 25th–75th and 10th–90th bands, while their wording and definitions remain metric-owned. The same loaded observations feed compact and expanded views, and only these two research cards are collapsed by default.

Maximum passes every generated observation to the chart boundary. It is series-specific and does not imply a common starting year. The 5-year, 10-year, and 20-year filters remain anchored to each series' latest observation date, and the default remains 20 years.

## Presets and historical zoom

The preset range and visible range are separate. The 5-year, 10-year, 20-year, or Maximum preset determines the complete observation set and, for normalized charts, the baseline. The shared historical-zoom controller then selects a visible subset without recalculating any economic values. Changing a preset clears zoom; Reset zoom restores the complete preset without changing it.

`useHistoricalZoom` centrally owns each card's local visible-index state, date slicing, reset and preset semantics, and accessible period text. `HistoricalZoomControls` provides one native-button companion pattern for moving and resizing the window because canvas slider keyboard behavior is not sufficient on its own. `EconomicTimeSeriesChart` owns the sole ECharts `datazoom` subscription and cleanup path. The option builders all receive the same centrally constructed slider configuration after `DataZoomComponent` is registered once.

Factual summaries and semantic tables consume the controller's visible observations. Their minima, maxima, endpoints, and relationship facts therefore follow zoom, while the prominent card callout remains the latest available economic observation. Tables retain their established row limits within the visible window. Missing observations remain gaps, and year-over-year, annualized, average, aligned, and normalized values are never recomputed from the zoom subset.

Productivity and manufacturing series remain indexed to the beginning of the selected preset. Zoom only changes their visible window; it never rebases them. Current zoom state is local to each card and is not synchronized, URL-persisted, or saved. There is no arbitrary date-entry form and no cross-period comparison.

## Lifecycle and resizing

The housing affordability cost share and housing starts use the single-series level policy without forcing zero. Housing-starts axes and tooltips explicitly label thousands at an annual rate, while its latest callout expands the stored thousands value to a readable unit count. Its selected-range factual summary reports the first, lowest, highest, and latest observations without judging the pace.

The manufacturing relationship chart aligns exact shared months, filters ranges against the latest shared valid month, and normalizes each series independently to 100 at the first shared valid observation in that range. It uses one padded non-zero-forced axis labeled `Selected-range baseline = 100`, a reference line at 100, solid output and dashed employment lines, and no dual axis. Tooltips and the accessible summary report cumulative change from the current baseline; changing the range intentionally changes that baseline. Native IPMAN and MANEMP values remain in the semantic table.

The household growth comparison uses quarterly real per-capita income and spending rates on the two-line shared percentage axis: income is solid, spending is dashed, zero is included, gaps remain disconnected, and no dual axis is available. Exact-quarter ranges anchor to the latest shared valid quarter. Tooltips, the factual summary, and the eight-quarter semantic table identify both values as year-over-year per-person growth and report the full-precision spending-minus-income gap. A falling positive growth line is explicitly distinguished from a falling underlying level. Personal saving rate and the quarterly household debt-service ratio use the existing single-series level policy, so their axes are padded without forcing zero or adding a target band.

`EconomicTimeSeriesChart` initializes one ECharts instance for its container, updates options when filtered observations change, and disposes the instance on unmount. A `ResizeObserver` resizes the chart when its container changes; the global window resize event is a fallback for browsers without `ResizeObserver`.

Initialization and update failures are logged for diagnosis and replaced with a visible message. Metadata, explanations, and the semantic table remain usable if canvas rendering fails.

## Visual decisions

Every line uses actual observations without smoothing because a smoothed curve would imply values between measured periods. Animation, gradients, area fills, and point symbols at every observation are omitted to keep the display restrained.

ECharts' time axis continues to hide overlapping labels and choose readable time ticks for long histories. No downsampling or aggregation is applied; tooltips retain access to every generated observation. Measurements did not show a need for additional rendering optimization.

Axis policy is series-specific. GDP growth, real GDP per capita growth, labor productivity growth, real business-investment growth, CPI inflation, and payroll growth include zero and retain the zero reference line. The normalized productivity-level chart does not force zero or add a zero line because its selected-range baseline is 100. Unemployment, prime-age employment, and industrial capacity utilization are percentage levels whose meaningful variation is well above zero, so their axes use at least 0.5 percentage point or 10% of the visible span as padding without forcing zero. Payroll preserves positive and negative changes without forcing a symmetric axis. This preserves a readable range without adding thresholds or value judgments. A zero line is rendered only when zero inclusion is enabled.

The business-investment and capacity-utilization cards reuse the shared preset and historical-zoom controls. Investment Maximum begins with the first exact-quarter derived observation in 2008 Q1 and does not reconstruct history before the available PNFIC1 source levels. Capacity Maximum uses the full provider-published TCU history beginning in January 1967.

Tooltips use ECharts' browser-native HTML renderer with non-interactive content, so the tooltip cannot take hover away from the plotting area. Formatters return plain text only. Percentage series retain one-decimal percentage formatting. Payroll tooltips show the month and a signed rounded count in thousands, such as `+145K`; full derived precision remains in JSON.

## Accessibility

The chart container has a descriptive accessible label, and ECharts accessibility support is enabled. Because canvas alone is not a sufficient nonvisual representation, each card also provides a live factual summary that updates with the selected range. Percentage summaries retain existing formatting. Payroll describes extrema as job gains or losses using full counts or readable millions and keeps zero meaningful. Its recent semantic table aligns the monthly change and three-month average by month without recalculating either value in React.

Native buttons with `aria-pressed` expose the selected time range and retain the application's visible focus treatment. Selection also uses border weight and underlining, rather than color alone. Every chart also has visible-period text and shared native Move earlier, Move later, Zoom in, Zoom out, and conditional Reset zoom buttons; these controls provide a keyboard-accessible path outside the canvas with no keyboard trap.

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

With Story 13A applied after Story 16, the initial application chunk is 361.71 kB minified (106.69 kB gzip). The quarterly per-capita income and spending growth chunks are 15.14 kB (4.82 kB gzip) and 15.16 kB (4.83 kB gzip), replacing the 36.64 kB monthly income and 10.97 kB short-history aggregate-spending chunks. The shared chart/ECharts chunk is 544.37 kB minified (182.26 kB gzip); ECharts remains deduplicated, and the existing deferred-chunk warning remains.

With Story 09A applied after Story 13A, the initial application chunk is 366.30 kB minified (107.96 kB gzip). Registering ECharts `DataZoomComponent` increases the one shared deferred chart/ECharts chunk to 581.31 kB minified (193.99 kB gzip). No second wrapper or ECharts bundle is emitted; Vite continues to report the established deferred-chunk warning.

With Story 17, the initial application chunk is 371.17 kB minified (108.97 kB gzip). Real business-investment growth and industrial capacity-utilization are separate 4.48 kB (1.74 kB gzip) and 25.22 kB (5.50 kB gzip) data chunks. The one shared deferred chart/ECharts chunk remains 581.31 kB minified (193.98 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.

With Story 18, the initial application chunk is 381.20 kB minified (110.75 kB gzip). FEDFUNDS, GS10, and NFCICREDIT are separate 27.58 kB (4.65 kB gzip), 28.28 kB (4.98 kB gzip), and 92.82 kB (17.38 kB gzip) data chunks. The one shared deferred chart/ECharts chunk is 582.10 kB minified (194.19 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.

With Story 19, the initial application chunk is 386.94 kB minified (111.96 kB gzip). The federal-budget-balance and federal-debt-held-by-the-public data chunks are 4.48 kB (1.44 kB gzip) and 9.05 kB (2.50 kB gzip). The one shared deferred chart/ECharts chunk is 582.27 kB minified (194.25 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.

With Story 20, the initial application chunk is 391.60 kB minified (112.79 kB gzip). The trade-balance-share-of-GDP and effective-tariff-burden data chunks are 10.58 kB (1.93 kB gzip) and 13.59 kB (4.25 kB gzip). The one shared deferred chart/ECharts chunk remains 582.27 kB minified (194.25 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.

With Story 22, the initial application chunk is 399.42 kB minified (114.09 kB gzip). The ICSA and IC4WSA data chunks are 100.09 kB (17.10 kB gzip) and 102.61 kB (18.85 kB gzip). The one shared deferred chart/ECharts chunk is 583.04 kB minified (194.47 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.

With Story 23, the initial application chunk is 402.89 kB minified (114.99 kB gzip), and the DRTSCILM data chunk is 5.57 kB (1.41 kB gzip). The one shared deferred chart/ECharts chunk remains 583.04 kB minified (194.47 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.

With Story 24, the initial application chunk is 406.96 kB minified (115.88 kB gzip), and the corporate-profit-share data chunk is 15.69 kB (4.82 kB gzip). The one shared deferred chart/ECharts chunk remains 583.04 kB minified (194.47 kB gzip); ECharts remains deduplicated and the established deferred-chunk warning remains.
