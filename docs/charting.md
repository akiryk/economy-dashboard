# Charting architecture

## Library choice

The dashboard uses Apache ECharts because the broader product will need capable time-series rendering, reference lines, tooltips, accessibility support, and responsive behavior. Story 03 imports only the line, grid, tooltip, mark-line, accessibility, and canvas modules used by the GDP chart. A small repository-owned React wrapper avoids another runtime abstraction dependency.

## Domain and chart boundaries

Economic observations remain `{ date, value }` domain objects. Pure range and summary utilities operate on those objects. Immediately before rendering, `chartAdapters.ts` sorts without mutation and converts each observation to ECharts-compatible `[date, value]` data. `null` remains `null`, so missing observations are neither converted to zero nor joined by the line.

Chart options are built separately from React lifecycle management. This keeps filtering, adaptation, visual configuration, and canvas ownership independently understandable and testable.

## Lifecycle and resizing

`EconomicTimeSeriesChart` initializes one ECharts instance for its container, updates options when filtered observations change, and disposes the instance on unmount. A `ResizeObserver` resizes the chart when its container changes; the global window resize event is a fallback for browsers without `ResizeObserver`.

Initialization and update failures are logged for diagnosis and replaced with a visible message. Metadata, explanations, and the semantic table remain usable if canvas rendering fails.

## Visual decisions

The GDP line uses actual quarterly observations without smoothing because a smoothed curve would imply values between measured quarters. Animation, gradients, area fills, and point symbols at every observation are omitted to keep the display restrained.

The percentage axis always includes zero and adds padding beyond the observed minimum and maximum. A distinct zero reference line makes contractions visible without coloring positive and negative regions or attaching a value judgment to movement.

Tooltips use ECharts' rich-text renderer rather than HTML. They display a human-readable quarter, the short series title, and a one-decimal percentage.

## Accessibility

The chart container has a descriptive accessible label, and ECharts accessibility support is enabled. Because canvas alone is not a sufficient nonvisual representation, the card also provides a live factual summary that updates with the selected range. It reports the latest, minimum, and maximum observations and whether any visible value is below zero. The existing semantic table remains the detailed data alternative.

Native buttons with `aria-pressed` expose the selected time range and retain the application's visible focus treatment. Selection also uses border weight and underlining, rather than color alone.

## Extending charting

Future time-series charts can reuse the lifecycle component, adapter pattern, range control, and pure summary utilities when their behavior matches. Different units or chart types should supply focused option builders instead of adding conditional domain or visualization logic to the GDP component.

## Current limitations

- Only one locally bundled quarterly percentage series is charted.
- Data does not refresh automatically.
- The selected range is local component state and is not reflected in the URL.
- The recent-observations table contains eight values rather than every visible chart point.
- Canvas behavior is verified manually; component tests mock the ECharts lifecycle boundary.
