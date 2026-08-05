import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { calculateChartSummary, filterObservationsByTimeRange, type TimeRange } from '../utils/chartData'
import { findLatestNonNullObservation, formatDate, formatObservationPeriod, selectMostRecentObservations } from '../utils/economicSeries'
import { classifyYieldCurve, deriveYieldCurveObservations, formatYieldCurveAnswer, formatYieldCurveInterpretation, formatYieldCurveSpread } from '../utils/yieldCurveData'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'
import { YieldCurveCompactChart } from '../charts/YieldCurveCompactChart'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

export function RateComparisonSummary({ tenYear, threeMonth, federalFunds }: { tenYear: EconomicSeries; threeMonth: EconomicSeries; federalFunds: EconomicSeries }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const derived = useMemo(() => deriveYieldCurveObservations(tenYear.observations, threeMonth.observations), [tenYear.observations, threeMonth.observations])
  const latest = findLatestNonNullObservation(derived)
  const latestDetail = latest ? derived.find(({ date }) => date === latest.date) : undefined
  const preset = useMemo(() => filterObservationsByTimeRange(derived, selectedRange), [derived, selectedRange])
  const zoom = useHistoricalZoom(preset, selectedRange, 'monthly', setSelectedRange)
  const visible = zoom.visibleItems
  const summary = calculateChartSummary(visible)
  const recent = selectMostRecentObservations(derived, 12)
  const componentRecent = selectMostRecentObservations(derived, 8)
  const fundsByDate = new Map(federalFunds.observations.map(({ date, value }) => [date, value]))
  const state = classifyYieldCurve(latest?.value ?? null)
  const accessible = `${formatYieldCurveSpread(latest?.value ?? null)} in ${latest ? formatObservationPeriod(latest.date, 'monthly') : 'an unavailable month'}. The curve is ${state.replace('-', ' ')}. The 10-year yield was ${latestDetail?.tenYearYield?.toFixed(2) ?? 'unavailable'}% and the 3-month rate was ${latestDetail?.threeMonthRate?.toFixed(2) ?? 'unavailable'}%. Negative values indicate inversion.`
  const headline = <div className="series-current" aria-label={accessible}>
    <p className="series-current__value">{formatYieldCurveSpread(latest?.value ?? null)}</p>
    <p className="series-current__label">10-year yield minus 3-month Treasury rate</p>
    <p className="series-current__period">{latest ? formatObservationPeriod(latest.date, 'monthly') : 'Unavailable'} · Three-month average</p>
    <p className="series-current__answer">{formatYieldCurveAnswer(latest?.value ?? null)}</p>
    <p className="series-current__comparison">{formatYieldCurveInterpretation(latest?.value ?? null)}</p>
  </div>
  return <CompactMetricCardLayout cardId="interest-rate-conditions" eyebrow="Interest-rate conditions" question="Is the yield curve inverted?" measureLabel="10-year Treasury yield minus 3-month Treasury bill rate" latestValue={headline} compactVisual={<YieldCurveCompactChart observations={derived} />} collapsible expandedContent={<>
    <TimeRangeControl selectedRange={selectedRange} onRangeChange={zoom.selectPreset} contextLabel="10-year minus 3-month Treasury spread" />
    <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
    <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}><EconomicTimeSeriesChart kind="single" observations={preset} seriesName="10-year minus 3-month Treasury spread" frequency="monthly" units="Percentage points" transformation="Three-month average of exact-month GS10 minus TB3MS spreads; all three months required" includeZero valueFormat="signed-percentage-points" zoomStartDate={visible[0]?.date ?? ''} zoomEndDate={visible.at(-1)?.date ?? ''} onZoomChange={zoom.onChartZoom} /></Suspense>
    <p className="chart-summary" aria-live="polite">During the visible period, the three-month-average spread ranged from {formatYieldCurveSpread(summary.minimum?.value ?? null)} to {formatYieldCurveSpread(summary.maximum?.value ?? null)} and ended at {formatYieldCurveSpread(summary.latest?.value ?? null)}. Negative values indicate an inverted 10-year-minus-3-month curve; the association with recessions is historical and probabilistic, not a forecast. Official recession shading is not included in this story and remains a follow-up.</p>
    <section><h4>Component rates and policy context</h4><p>The 3-month Treasury bill rate is a market rate quoted on a discount basis. The effective federal funds rate is an overnight market rate strongly influenced by Federal Reserve policy and is supporting context, not part of the spread.</p><div className="table-scroll"><table className="observations-table"><caption>Recent yield-curve components and federal funds context</caption><thead><tr><th scope="col">Month</th><th scope="col">10-year</th><th scope="col">3-month</th><th scope="col">Federal funds</th></tr></thead><tbody>{componentRecent.map((item) => { const detail = derived.find(({date}) => date === item.date); return <tr key={item.date}><th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th><td>{detail?.tenYearYield?.toFixed(2) ?? '—'}%</td><td>{detail?.threeMonthRate?.toFixed(2) ?? '—'}%</td><td>{fundsByDate.get(item.date)?.toFixed(2) ?? '—'}%</td></tr> })}</tbody></table></div></section>
    <div className="series-explanations"><section><h4>What this tells you</h4><p>The spread shows whether long-term Treasury yields are above or below short-term Treasury rates. A negative spread is an inverted yield curve. The relationship summarizes market expectations about future interest rates, inflation, and economic conditions, together with current short-term monetary conditions.</p></section><section><h4>Why economists watch it</h4><p>Yield-curve inversions have historically preceded many U.S. recessions. One common interpretation is that short-term policy is restrictive while investors expect weaker growth, lower inflation, and eventual rate cuts. The relationship is historically informative but does not establish that a recession will occur or when it would begin.</p></section><section><h4>What this leaves out</h4><p>The spread does not identify why rates moved, provide a deterministic recession forecast, measure credit availability throughout the economy, or capture all financial conditions. Term premiums, inflation expectations, Federal Reserve asset holdings, global demand for Treasuries, and fiscal conditions can also affect long-term yields.</p></section></div>
    <footer className="series-supporting"><p className="series-source">Sources: <a href={tenYear.sourceUrl} target="_blank" rel="noreferrer">GS10 via FRED</a>; <a href={threeMonth.sourceUrl} target="_blank" rel="noreferrer">TB3MS via FRED</a>; <a href={federalFunds.sourceUrl} target="_blank" rel="noreferrer">FEDFUNDS via FRED</a></p><details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Primary identifiers</dt><dd>GS10 and TB3MS</dd></div><div><dt>Frequency and units</dt><dd>Monthly averages · Percent · Not seasonally adjusted</dd></div><div><dt>3-month definition</dt><dd>Secondary-market Treasury bill rate quoted on a discount basis</dd></div><div><dt>Method</dt><dd>Exact shared month; GS10 minus TB3MS; trailing three-month average requires all three consecutive spreads</dd></div><div><dt>Coverage</dt><dd>{derived[0] ? formatObservationPeriod(derived[0].date, 'monthly') : 'Unavailable'} to {derived.at(-1) ? formatObservationPeriod(derived.at(-1)!.date, 'monthly') : 'Unavailable'}</dd></div><div><dt>Retrieved</dt><dd>{formatDate(threeMonth.retrievedAt)}</dd></div></dl></details><details className="supporting-disclosure"><summary>Recent observations</summary><div className="table-scroll"><table className="observations-table"><caption>Twelve most recent three-month-average yield-curve spreads</caption><thead><tr><th scope="col">Month</th><th scope="col">Spread</th><th scope="col">State</th></tr></thead><tbody>{recent.map((item) => <tr key={item.date}><th scope="row">{formatObservationPeriod(item.date, 'monthly')}</th><td>{formatYieldCurveSpread(item.value)}</td><td>{classifyYieldCurve(item.value).replace('-', ' ')}</td></tr>)}</tbody></table></div></details></footer>
  </>} />
}
