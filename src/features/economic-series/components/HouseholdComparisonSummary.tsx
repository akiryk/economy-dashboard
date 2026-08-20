import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { FreshnessNotice } from '../../data-freshness/FreshnessNotice'
import type { TimeRange } from '../utils/chartData'
import { calculateChartSummary } from '../utils/chartData'
import {
  formatDate,
  formatObservationPeriod,
  formatSignedPercentage,
  formatSignedPercentagePoints,
} from '../utils/economicSeries'
import {
  alignHouseholdComparison,
  filterHouseholdComparison,
} from '../utils/householdComparisonData'
import { HouseholdComparisonTable } from './HouseholdComparisonTable'
import { TimeRangeControl } from './TimeRangeControl'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

export function HouseholdComparisonSummary({
  income,
  spending,
}: {
  income: EconomicSeries
  spending: EconomicSeries
}) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const aligned = useMemo(
    () => alignHouseholdComparison(income, spending),
    [income, spending],
  )
  const selected = useMemo(
    () => filterHouseholdComparison(aligned, selectedRange),
    [aligned, selectedRange],
  )
  const zoom = useHistoricalZoom(selected, selectedRange, 'quarterly', setSelectedRange)
  const visible = zoom.visibleItems
  const latest = [...visible]
    .reverse()
    .find((item) => item.incomeGrowth !== null && item.spendingGrowth !== null)
  const latestAvailable = [...aligned]
    .reverse()
    .find((item) => item.incomeGrowth !== null && item.spendingGrowth !== null)
  const first = visible.find(
    (item) => item.incomeGrowth !== null && item.spendingGrowth !== null,
  )
  const incomeSummary = calculateChartSummary(
    visible.map((item) => ({ date: item.date, value: item.incomeGrowth })),
  )
  const spendingSummary = calculateChartSummary(
    visible.map((item) => ({ date: item.date, value: item.spendingGrowth })),
  )
  return (
    <article
      id="real-income-versus-spending-card"
      className="series-card"
      aria-labelledby="real-income-versus-spending-question"
    >
      <header className="series-card__header">
        <p className="series-card__eyebrow">Household resources</p>
        <h3 id="real-income-versus-spending-question">
          Are real household incomes and spending growing per person?
        </h3>
        <p className="series-card__title">Real Income and Spending Per Person</p>
      </header>
      <FreshnessNotice />
      <div className="series-current" aria-label="Latest shared quarterly real per-capita income and spending growth">
        <p className="series-current__label">Latest shared quarter: {latestAvailable ? formatObservationPeriod(latestAvailable.date, 'quarterly') : 'unavailable'}</p>
        <p className="series-current__comparison"><strong>Real disposable income per person: {formatSignedPercentage(latestAvailable?.incomeGrowth ?? null)}</strong><br /><strong>Real consumer spending per person: {formatSignedPercentage(latestAvailable?.spendingGrowth ?? null)}</strong></p>
        <p className="series-current__period">
          Percent change from the same quarter one year earlier
        </p>
        <p className="series-current__comparison">
          Spending minus income growth: {formatSignedPercentagePoints(latestAvailable?.gap ?? null)} percentage points
        </p>
      </div>
      <TimeRangeControl selectedRange={selectedRange} onRangeChange={zoom.selectPreset} contextLabel="Income versus spending" />
      <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
      <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
        <EconomicTimeSeriesChart
          key={selectedRange}
          kind="household-comparison"
          incomeObservations={selected.map((item) => ({ date: item.date, value: item.incomeGrowth }))}
          spendingObservations={selected.map((item) => ({ date: item.date, value: item.spendingGrowth }))}
          frequency="quarterly"
          zoomStartDate={visible[0]?.date ?? ''}
          zoomEndDate={visible.at(-1)?.date ?? ''}
          onZoomChange={zoom.onChartZoom}
        />
      </Suspense>
      <p className="chart-summary" aria-live="polite">
        From {first ? formatObservationPeriod(first.date, 'quarterly') : 'an unavailable quarter'} to {latest ? formatObservationPeriod(latest.date, 'quarterly') : 'an unavailable quarter'}, real disposable income per person growth moved from {formatSignedPercentage(first?.incomeGrowth ?? null)} to {formatSignedPercentage(latest?.incomeGrowth ?? null)}, while real consumer spending per person growth moved from {formatSignedPercentage(first?.spendingGrowth ?? null)} to {formatSignedPercentage(latest?.spendingGrowth ?? null)}. Income growth ranged from {formatSignedPercentage(incomeSummary.minimum?.value ?? null)} in {incomeSummary.minimum ? formatObservationPeriod(incomeSummary.minimum.date, 'quarterly') : 'an unavailable quarter'} to {formatSignedPercentage(incomeSummary.maximum?.value ?? null)} in {incomeSummary.maximum ? formatObservationPeriod(incomeSummary.maximum.date, 'quarterly') : 'an unavailable quarter'}; spending growth ranged from {formatSignedPercentage(spendingSummary.minimum?.value ?? null)} in {spendingSummary.minimum ? formatObservationPeriod(spendingSummary.minimum.date, 'quarterly') : 'an unavailable quarter'} to {formatSignedPercentage(spendingSummary.maximum?.value ?? null)} in {spendingSummary.maximum ? formatObservationPeriod(spendingSummary.maximum.date, 'quarterly') : 'an unavailable quarter'}. At the latest shared quarter, spending growth was {latest && latest.gap !== null && latest.gap >= 0 ? 'higher' : 'lower'} by {formatSignedPercentagePoints(latest?.gap ?? null)} percentage points. A falling positive growth rate means the underlying level is still rising more slowly; only growth below zero means the real per-capita level is lower than one year earlier.
      </p>
      <div className="series-explanations">
        <section><h4>What this tells you</h4><p>Each line shows how much inflation-adjusted income or spending per person changed from the same quarter one year earlier. Disposable income is income available after taxes and government transfers in the national accounts; spending is real personal consumption expenditures per person. Both source levels are seasonally adjusted annual rates before growth is calculated. A falling line above zero means growth is slowing but the underlying level is still rising. A value below zero means the level is lower than a year earlier.</p></section>
        <section><h4>What this leaves out</h4><p>These are national aggregate amounts per person, not the experience of a median or average household, and they do not show who gained or lost. Spending can grow faster than income through lower saving, asset use, borrowing, or different behavior across households; this chart alone does not identify the cause.</p></section>
      </div>
      <section className="related-indicators" aria-labelledby="household-comparison-related"><h4 id="household-comparison-related">Consider alongside</h4><ul><li>Personal saving rate</li><li>Real wages</li><li>Household financial stress</li></ul></section>
      <footer className="series-supporting">
        <p className="series-source">Sources: <a href={income.sourceUrl}>BEA income data via FRED</a>; <a href={spending.sourceUrl}>BEA spending data via FRED</a></p>
        <details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Income series</dt><dd>{income.providerSeriesId} · real per capita · chained 2017 dollars, seasonally adjusted annual rate</dd></div><div><dt>Spending series</dt><dd>{spending.providerSeriesId} · real per capita · chained 2017 dollars, seasonally adjusted annual rate</dd></div><div><dt>Frequency</dt><dd>Quarterly</dd></div><div><dt>Transformation</dt><dd>Exact-quarter year-over-year growth calculated locally; aligned by calendar quarter</dd></div><div><dt>Retrieved</dt><dd>{formatDate(income.retrievedAt)}</dd></div></dl></details>
        <details className="supporting-disclosure"><summary>Recent observations</summary><HouseholdComparisonTable observations={visible} /></details>
      </footer>
    </article>
  )
}
