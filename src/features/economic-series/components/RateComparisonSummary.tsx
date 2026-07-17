import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { calculateChartSummary, filterObservationsByTimeRange, type TimeRange } from '../utils/chartData'
import { formatDate, formatObservationPeriod, formatPercentage } from '../utils/economicSeries'
import { alignRateObservations, rateComparisonSeries } from '../utils/rateComparisonData'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { RateComparisonTable } from './RateComparisonTable'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

function differenceDescription(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Difference unavailable'
  if (value === 0) return 'The rates are equal'
  return `10-year yield ${Math.abs(value).toFixed(1)} percentage points ${value > 0 ? 'above' : 'below'} the federal funds rate`
}

export function RateComparisonSummary({ federalFunds, treasury }: { federalFunds: EconomicSeries; treasury: EconomicSeries }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const aligned = useMemo(() => alignRateObservations(federalFunds.observations, treasury.observations), [federalFunds, treasury])
  const selected = useMemo(() => {
    const dates = new Set(filterObservationsByTimeRange(rateComparisonSeries(aligned, 'federalFundsRate'), selectedRange).map((item) => item.date))
    return aligned.filter((item) => dates.has(item.date))
  }, [aligned, selectedRange])
  const zoom = useHistoricalZoom(selected, selectedRange, 'monthly', setSelectedRange)
  const visible = zoom.visibleItems
  const latest = aligned.at(-1)
  const first = visible[0]
  const visibleLatest = visible.at(-1)
  const fundsSummary = calculateChartSummary(rateComparisonSeries(visible, 'federalFundsRate'))
  const treasurySummary = calculateChartSummary(rateComparisonSeries(visible, 'treasuryYield'))
  return <article id="interest-rate-conditions-card" className="series-card" aria-labelledby="interest-rate-conditions-question">
    <header className="series-card__header"><p className="series-card__eyebrow">Interest-rate conditions</p><h3 id="interest-rate-conditions-question">How do short-term and long-term interest rates compare?</h3><p className="series-card__title">Federal funds rate and 10-year Treasury yield</p></header>
    <div className="series-current" aria-label="Latest shared interest rates"><p className="series-current__label">Latest shared month: {latest ? formatObservationPeriod(latest.date, 'monthly') : 'unavailable'}</p><p className="series-current__comparison"><strong>Federal funds rate: {formatPercentage(latest?.federalFundsRate ?? null)}</strong><br /><strong>10-year Treasury yield: {formatPercentage(latest?.treasuryYield ?? null)}</strong></p><p className="series-current__period">{differenceDescription(latest?.difference)}</p></div>
    <TimeRangeControl selectedRange={selectedRange} onRangeChange={zoom.selectPreset} contextLabel="Federal funds rate and 10-year Treasury yield" />
    <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
    <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}><EconomicTimeSeriesChart kind="rate-comparison" federalFundsObservations={rateComparisonSeries(selected, 'federalFundsRate')} treasuryObservations={rateComparisonSeries(selected, 'treasuryYield')} frequency="monthly" zoomStartDate={visible[0]?.date ?? ''} zoomEndDate={visible.at(-1)?.date ?? ''} onZoomChange={zoom.onChartZoom} /></Suspense>
    <p className="chart-summary" aria-live="polite">From {first ? formatObservationPeriod(first.date, 'monthly') : 'an unavailable month'} to {visibleLatest ? formatObservationPeriod(visibleLatest.date, 'monthly') : 'an unavailable month'}, the effective federal funds rate moved from {formatPercentage(first?.federalFundsRate ?? null)} to {formatPercentage(visibleLatest?.federalFundsRate ?? null)}, with a visible low of {formatPercentage(fundsSummary.minimum?.value ?? null)} and high of {formatPercentage(fundsSummary.maximum?.value ?? null)}. The 10-year Treasury yield moved from {formatPercentage(first?.treasuryYield ?? null)} to {formatPercentage(visibleLatest?.treasuryYield ?? null)}, with a visible low of {formatPercentage(treasurySummary.minimum?.value ?? null)} and high of {formatPercentage(treasurySummary.maximum?.value ?? null)}. {differenceDescription(visibleLatest?.difference)}.</p>
    <div className="series-explanations"><section><h4>What this tells you</h4><p>The effective federal funds rate is an observed overnight market rate strongly influenced by Federal Reserve policy. The market-determined 10-year Treasury yield incorporates expectations about future short-term rates, inflation, growth, and risk. Both are nominal rates.</p></section><section><h4>What this leaves out</h4><p>Neither series is directly a household or business borrowing rate. Their difference is informative but does not mechanically predict a recession or any single outcome.</p></section></div>
    <section className="related-indicators"><h4>Consider alongside</h4><ul><li>Broad credit conditions</li><li>Inflation</li><li>Business investment</li></ul></section>
    <footer className="series-supporting"><p className="series-source">Sources: <a href={federalFunds.sourceUrl} target="_blank" rel="noreferrer">Federal funds effective rate via FRED</a>; <a href={treasury.sourceUrl} target="_blank" rel="noreferrer">10-year Treasury yield via FRED</a></p><details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Series identifiers</dt><dd>FEDFUNDS and GS10</dd></div><div><dt>Frequency and units</dt><dd>Monthly · Percent · Not seasonally adjusted</dd></div><div><dt>Alignment</dt><dd>Exact shared calendar months; difference calculated as GS10 minus FEDFUNDS</dd></div><div><dt>Retrieved</dt><dd>{formatDate(federalFunds.retrievedAt)}</dd></div><div><dt>Shared coverage</dt><dd>{aligned[0] && aligned.at(-1) ? `${formatObservationPeriod(aligned[0].date, 'monthly')} to ${formatObservationPeriod(aligned.at(-1)!.date, 'monthly')}` : 'Not available'}</dd></div></dl></details><details className="supporting-disclosure"><summary>Recent observations</summary><RateComparisonTable observations={visible} /></details></footer>
  </article>
}
