import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import {
  formatDate,
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import { normalizeProductivityRange } from '../utils/productivityData'
import { ProductivityLevelTable } from './ProductivityLevelTable'
import { TimeRangeControl } from './TimeRangeControl'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

export function ProductivityLevelSummary({ series }: { series: EconomicSeries }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const selected = useMemo(
    () => filterObservationsByTimeRange(series.observations, selectedRange),
    [selectedRange, series.observations],
  )
  const normalized = useMemo(() => normalizeProductivityRange(selected), [selected])
  const zoom = useHistoricalZoom(normalized, selectedRange, 'quarterly', setSelectedRange)
  const visible = zoom.visibleItems
  const summary = calculateChartSummary(visible)
  const baseline = normalized.find((item) => item.value !== null)
  const latest = [...normalized].reverse().find((item) => item.value !== null)
  const selectedLabel = selectedRange === 'max' ? 'available series' : `selected ${selectedRange.replace('y', '-year')} period`
  return <article id="labor-productivity-level-card" className="series-card" aria-labelledby="labor-productivity-level-question">
    <header className="series-card__header"><p className="series-card__eyebrow">Productive capacity</p><h3 id="labor-productivity-level-question">How much more productive is the economy than in the past?</h3><p className="series-card__title">Productivity Over Time</p></header>
    <div className="series-current" aria-label="Cumulative productivity change"><p className="series-current__value">{formatSignedPercentage(latest?.changeFromBaseline ?? null)}</p><p className="series-current__label">Productivity is {latest && latest.changeFromBaseline !== null && latest.changeFromBaseline < 0 ? 'lower' : 'higher'} than at the start of the {selectedLabel}</p><p className="series-current__period">{baseline ? formatObservationPeriod(baseline.date, 'quarterly') : 'Baseline unavailable'} to {latest ? formatObservationPeriod(latest.date, 'quarterly') : 'latest unavailable'}</p></div>
    <TimeRangeControl selectedRange={selectedRange} onRangeChange={zoom.selectPreset} contextLabel="Productivity over time" />
    <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
    <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}><EconomicTimeSeriesChart key={selectedRange} kind="single" observations={normalized} seriesName="Productivity index, selected-range baseline = 100" frequency="quarterly" units="Index" transformation={series.transformation} includeZero={false} valueFormat="index" zoomStartDate={visible[0]?.date ?? ''} zoomEndDate={visible.at(-1)?.date ?? ''} onZoomChange={zoom.onChartZoom} /></Suspense>
    <p className="chart-summary" aria-live="polite">Indexed to the start of the selected {selectedRange === 'max' ? 'Maximum' : selectedRange.replace('y', '-year')} range. Within the visible period, the normalized index ranged from {summary.minimum?.value?.toFixed(1) ?? 'unavailable'} in {summary.minimum ? formatObservationPeriod(summary.minimum.date, 'quarterly') : 'an unavailable quarter'} to {summary.maximum?.value?.toFixed(1) ?? 'unavailable'} in {summary.maximum ? formatObservationPeriod(summary.maximum.date, 'quarterly') : 'an unavailable quarter'}, across {summary.observationCount} valid observations. Zooming does not rebase the index.</p>
    <div className="series-explanations"><section><h4>What this tells you</h4><p>Labor productivity measures inflation-adjusted output per hour worked in the nonfarm business sector. This chart shows how the productivity level has changed over the selected period, with the first observation set to 100.</p></section><section><h4>What this leaves out</h4><p>The index does not show how productivity gains are distributed between workers and business owners. It also excludes government, farms, households, and some other activity outside the nonfarm business sector.</p></section></div>
    <section className="related-indicators" aria-labelledby="productivity-level-related"><h4 id="productivity-level-related">Consider alongside</h4><ul><li>Productivity growth momentum</li><li>Real GDP per capita</li><li>Real wages</li></ul></section>
    <footer className="series-supporting"><p className="series-source">Source: <a href={series.sourceUrl} rel="noreferrer" target="_blank">{series.sourceName}</a></p><details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Provider series identifier</dt><dd>{series.providerSeriesId}</dd></div><div><dt>Frequency</dt><dd>Quarterly</dd></div><div><dt>Transformation</dt><dd>{series.transformation}</dd></div><div><dt>Retrieved</dt><dd>{formatDate(series.retrievedAt)}</dd></div></dl></details><details className="supporting-disclosure"><summary>Recent observations</summary><ProductivityLevelTable observations={visible} /></details></footer>
  </article>
}
