import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import type { TimeRange } from '../utils/chartData'
import { formatDate, formatObservationPeriod, formatSignedPercentage } from '../utils/economicSeries'
import { alignManufacturingObservations, filterManufacturingByTimeRange, normalizeManufacturingComparison, toNormalizedObservations } from '../utils/manufacturingComparisonData'
import { ManufacturingComparisonTable } from './ManufacturingComparisonTable'
import { TimeRangeControl } from './TimeRangeControl'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

export function ManufacturingComparisonSummary({ output, employment }: { output: EconomicSeries; employment: EconomicSeries }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const aligned = useMemo(() => alignManufacturingObservations(output, employment), [output, employment])
  const selected = useMemo(() => filterManufacturingByTimeRange(aligned, selectedRange), [aligned, selectedRange])
  const normalized = useMemo(() => {
    try {
      return normalizeManufacturingComparison(selected)
    } catch {
      return null
    }
  }, [selected])
  const zoom = useHistoricalZoom(normalized ?? [], selectedRange, 'monthly', setSelectedRange)
  const visibleNormalized = zoom.visibleItems
  const baseline = normalized?.find((item) => item.normalizedOutput !== null && item.normalizedEmployment !== null)
  const latest = [...(normalized ?? [])].reverse().find((item) => item.normalizedOutput !== null && item.normalizedEmployment !== null)
  const outputChange = latest?.normalizedOutput === null || latest?.normalizedOutput === undefined ? null : latest.normalizedOutput - 100
  const employmentChange = latest?.normalizedEmployment === null || latest?.normalizedEmployment === undefined ? null : latest.normalizedEmployment - 100
  const direction = outputChange !== null && employmentChange !== null && Math.sign(outputChange) === Math.sign(employmentChange) ? 'the same direction' : 'opposite directions'
  const coverageStart = aligned[0]
  const coverageEnd = aligned.at(-1)

  return <article id="manufacturing-output-versus-employment-card" className="series-card" aria-labelledby="manufacturing-output-versus-employment-question">
    <header className="series-card__header"><p className="series-card__eyebrow">Business and manufacturing</p><h3 id="manufacturing-output-versus-employment-question">Are manufacturing output and jobs moving together?</h3><p className="series-card__title">Manufacturing output versus employment</p></header>
    <div className="series-current" aria-label="Manufacturing changes since selected-range baseline"><p className="series-current__label">Since {baseline ? formatObservationPeriod(baseline.date, 'monthly') : 'an unavailable baseline'}:</p><p className="series-current__comparison"><strong>Output {formatSignedPercentage(outputChange)}</strong><br /><strong>Jobs {formatSignedPercentage(employmentChange)}</strong></p><p className="series-current__period">Through {latest ? formatObservationPeriod(latest.date, 'monthly') : 'an unavailable month'}</p></div>
    <TimeRangeControl selectedRange={selectedRange} onRangeChange={zoom.selectPreset} contextLabel="Manufacturing output versus employment" />
    <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
    {normalized && baseline && latest ? <>
      <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}><EconomicTimeSeriesChart key={selectedRange} kind="manufacturing-comparison" outputObservations={toNormalizedObservations(normalized, 'normalizedOutput')} employmentObservations={toNormalizedObservations(normalized, 'normalizedEmployment')} frequency="monthly" zoomStartDate={visibleNormalized[0]?.date ?? ''} zoomEndDate={visibleNormalized.at(-1)?.date ?? ''} onZoomChange={zoom.onChartZoom} /></Suspense>
      <p className="chart-summary" aria-live="polite">Showing {visibleNormalized[0] ? formatObservationPeriod(visibleNormalized[0].date, 'monthly') : 'an unavailable month'} through {visibleNormalized.at(-1) ? formatObservationPeriod(visibleNormalized.at(-1)!.date, 'monthly') : 'an unavailable month'} within the selected range. From the selected-range baseline in {formatObservationPeriod(baseline.date, 'monthly')} through {formatObservationPeriod(latest.date, 'monthly')}, manufacturing output changed {formatSignedPercentage(outputChange)} and manufacturing employment changed {formatSignedPercentage(employmentChange)}. The two measures moved in {direction} over the complete interval. Zooming does not change the selected-range baseline.</p>
    </> : <p className="chart-state" role="alert">The manufacturing comparison cannot be displayed because no valid positive shared baseline is available.</p>}
    <div className="series-explanations"><section><h4>What this tells you</h4><p>Output is the Federal Reserve’s inflation-adjusted manufacturing production index; employment is BLS manufacturing payroll employment. Both lines begin at 100 in the selected period so their paths can be compared despite different native units. A value of 110 means that measure is 10% above its starting level.</p></section><section><h4>What this leaves out</h4><p>Rebasing changes the comparison baseline, not the source data. The lines do not directly measure productivity, and employment counts jobs rather than hours worked. National aggregates can conceal differences across industries and regions; divergence alone does not identify automation, trade, outsourcing, composition, or another cause.</p></section></div>
    <section className="related-indicators" aria-labelledby="manufacturing-related"><h4 id="manufacturing-related">Consider alongside</h4><ul><li>Labor productivity</li><li>Payroll growth</li><li>Real GDP growth</li></ul></section>
    <footer className="series-supporting"><p className="series-source">Sources: <a href={output.sourceUrl} rel="noreferrer" target="_blank">Federal Reserve manufacturing output via FRED</a>; <a href={employment.sourceUrl} rel="noreferrer" target="_blank">BLS manufacturing employment via FRED</a></p><details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Output series</dt><dd>IPMAN · {output.units} · {output.seasonalAdjustment}</dd></div><div><dt>Employment series</dt><dd>MANEMP · {employment.units} · {employment.seasonalAdjustment}</dd></div><div><dt>Chart transformation</dt><dd>Exact-month alignment; each series normalized independently to 100 at the first shared valid selected-range observation</dd></div><div><dt>Retrieved</dt><dd>{formatDate(output.retrievedAt)}</dd></div><div><dt>Shared coverage</dt><dd>{coverageStart && coverageEnd ? `${formatObservationPeriod(coverageStart.date, 'monthly')} to ${formatObservationPeriod(coverageEnd.date, 'monthly')}` : 'Not available'}</dd></div></dl></details>{normalized && <details className="supporting-disclosure"><summary>Recent observations</summary><ManufacturingComparisonTable observations={visibleNormalized} /></details>}</footer>
  </article>
}
