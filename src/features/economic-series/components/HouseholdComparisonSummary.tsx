import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import type { TimeRange } from '../utils/chartData'
import { calculateChartSummary } from '../utils/chartData'
import {
  formatDate,
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  alignHouseholdComparison,
  filterHouseholdComparison,
} from '../utils/householdComparisonData'
import { HouseholdComparisonTable } from './HouseholdComparisonTable'
import { TimeRangeControl } from './TimeRangeControl'

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
  const visible = useMemo(
    () => filterHouseholdComparison(aligned, selectedRange),
    [aligned, selectedRange],
  )
  const latest = [...visible]
    .reverse()
    .find((item) => item.incomeGrowth !== null && item.spendingGrowth !== null)
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
          Are household incomes and spending growing after inflation?
        </h3>
        <p className="series-card__title">Real Income Versus Spending</p>
      </header>
      <div className="series-current" aria-label="Latest real disposable income per capita growth">
        <p className="series-current__value">{formatSignedPercentage(latest?.incomeGrowth ?? null)}</p>
        <p className="series-current__label">Latest real disposable income per capita growth</p>
        <p className="series-current__period">
          {latest ? formatObservationPeriod(latest.date, 'monthly') : 'Observation period unavailable'} · Percent change from year ago
        </p>
        <p className="series-current__comparison">
          Real consumer spending growth: {formatSignedPercentage(latest?.spendingGrowth ?? null)}
        </p>
      </div>
      <TimeRangeControl selectedRange={selectedRange} onRangeChange={setSelectedRange} contextLabel="Income versus spending" />
      <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
        <EconomicTimeSeriesChart
          kind="household-comparison"
          incomeObservations={visible.map((item) => ({ date: item.date, value: item.incomeGrowth }))}
          spendingObservations={visible.map((item) => ({ date: item.date, value: item.spendingGrowth }))}
          frequency="monthly"
        />
      </Suspense>
      <p className="chart-summary" aria-live="polite">
        In {latest ? formatObservationPeriod(latest.date, 'monthly') : 'an unavailable month'}, real disposable income per capita growth was {formatSignedPercentage(latest?.incomeGrowth ?? null)} and real consumer spending growth was {formatSignedPercentage(latest?.spendingGrowth ?? null)}. Spending growth was {latest && latest.gap !== null && latest.gap >= 0 ? 'above' : 'below'} income growth by {formatSignedPercentage(latest?.gap ?? null)} percentage points. In the selected period, income growth ranged from {formatSignedPercentage(incomeSummary.minimum?.value ?? null)} in {incomeSummary.minimum ? formatObservationPeriod(incomeSummary.minimum.date, 'monthly') : 'an unavailable month'} to {formatSignedPercentage(incomeSummary.maximum?.value ?? null)} in {incomeSummary.maximum ? formatObservationPeriod(incomeSummary.maximum.date, 'monthly') : 'an unavailable month'}, and spending growth ranged from {formatSignedPercentage(spendingSummary.minimum?.value ?? null)} in {spendingSummary.minimum ? formatObservationPeriod(spendingSummary.minimum.date, 'monthly') : 'an unavailable month'} to {formatSignedPercentage(spendingSummary.maximum?.value ?? null)} in {spendingSummary.maximum ? formatObservationPeriod(spendingSummary.maximum.date, 'monthly') : 'an unavailable month'}.
      </p>
      <div className="series-explanations">
        <section><h4>What this tells you</h4><p>Real disposable income per capita measures inflation-adjusted after-tax income per person. Real consumer spending measures inflation-adjusted household purchases. Comparing their year-over-year growth rates shows whether spending and income are moving together.</p></section>
        <section><h4>What this leaves out</h4><p>Both measures are national aggregates and do not show how income or spending is distributed across households. Spending can be financed from current income, savings, or borrowing, so this comparison alone does not show whether household finances are sustainable.</p></section>
      </div>
      <section className="related-indicators" aria-labelledby="household-comparison-related"><h4 id="household-comparison-related">Consider alongside</h4><ul><li>Personal saving rate</li><li>Real wages</li><li>Household financial stress</li></ul></section>
      <footer className="series-supporting">
        <p className="series-source">Sources: <a href={income.sourceUrl}>BEA income data via FRED</a>; <a href={spending.sourceUrl}>BEA spending data via FRED</a></p>
        <details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Income series</dt><dd>{income.providerSeriesId}</dd></div><div><dt>Spending series</dt><dd>{spending.providerSeriesId}</dd></div><div><dt>Frequency</dt><dd>Monthly</dd></div><div><dt>Transformation</dt><dd>{income.transformation}</dd></div><div><dt>Retrieved</dt><dd>{formatDate(income.retrievedAt)}</dd></div></dl></details>
        <details className="supporting-disclosure"><summary>Recent observations</summary><HouseholdComparisonTable observations={aligned} /></details>
      </footer>
    </article>
  )
}
