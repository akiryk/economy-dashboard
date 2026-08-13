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
  selectMostRecentObservations,
} from '../utils/economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
} from '../utils/historicalBandContext'
import type { CompactHistoricalMetricDefinition } from '../utils/compactHistoricalMetrics'
import {
  deriveMortgageRateComparison,
  formatMortgageRateAnswer,
  formatPointDifference,
} from '../utils/mortgageRateContext'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { CompactContextDisclosure } from './CompactContextDisclosure'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { RecentObservationsTable } from './RecentObservationsTable'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))
const CompactHistoricalMetricChart = lazy(() =>
  import('../charts/CompactHistoricalMetricChart').then((module) => ({
    default: module.CompactHistoricalMetricChart,
  })),
)

const mortgageDefinition: CompactHistoricalMetricDefinition = {
  seriesLabel: '30-year fixed mortgage rate',
  frequency: 'weekly',
  historicalBands: {
    recentObservationCount: 261,
    comparisonWindow: { kind: 'all-available' },
    innerPercentiles: [25, 75],
    outerPercentiles: [10, 90],
    minimumFiniteObservations: 2500,
    latestObservationPolicy: 'latest-finite',
  },
  showZeroLine: false,
  showLatestMarker: true,
  interactiveDetails: true,
  interactiveCursor: 'pointer',
  unifiedFooterLabels: true,
  valueFormatter: (value) => value === null ? 'Unavailable' : `${value.toFixed(2)}%`,
  helpText: {
    heading: 'Freddie Mac 30-year fixed mortgage benchmark',
    description: 'This card uses Freddie Mac’s national average for 30-year fixed-rate mortgages. It is a benchmark for mortgage-market conditions, not a rate that every borrower can obtain. Actual offers vary with the borrower, property, loan structure, lender, points, and other factors. The 30-year fixed mortgage is used because it is the dominant benchmark for U.S. home financing and has a long consistent historical series. Bands compare all available weekly readings since 1971 and describe historical frequency, not a recommended borrowing rate.',
  },
  zeroLineMeaning: 'Zero has no useful interpretive role for this rate.',
  positionDescriptions: {
    belowOuterBand: 'within the lowest 10% of weekly readings since 1971',
    betweenOuterAndInnerLow: 'between the 10th and 25th percentiles since 1971',
    insideInnerBand: 'within the middle 50% of weekly readings since 1971',
    betweenInnerAndOuterHigh: 'between the 75th and 90th percentiles since 1971',
    aboveOuterBand: 'within the highest 10% of weekly readings since 1971',
  },
  comparisonLabel: (model) =>
    `Historical bands use weekly Freddie Mac observations from ${model.comparisonStart.slice(0, 4)}–${model.comparisonEnd.slice(0, 4)}`,
}

function historicalDescription(
  model: ReturnType<typeof deriveHistoricalBandContext>,
): string | null {
  if (model.status !== 'ready') return null
  const position = classifyHistoricalBandPosition(model.latestObservation.value, model)
  const descriptions = mortgageDefinition.positionDescriptions
  if (position === 'unavailable') return null
  return `The current rate is ${descriptions[position]}. These bands describe frequency, not a normal, safe, or desirable rate.`
}

export function MortgageRateSummary({ series }: { series: EconomicSeries }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('5y')
  const comparison = useMemo(
    () => deriveMortgageRateComparison(series.observations),
    [series.observations],
  )
  const compactModel = useMemo(
    () => deriveHistoricalBandContext(series.observations, mortgageDefinition.historicalBands),
    [series.observations],
  )
  const preset = useMemo(
    () => filterObservationsByTimeRange(series.observations, selectedRange),
    [selectedRange, series.observations],
  )
  const zoom = useHistoricalZoom(preset, selectedRange, 'weekly', setSelectedRange)
  const visible = zoom.visibleItems
  const chartSummary = calculateChartSummary(visible)
  const historical = historicalDescription(compactModel)
  const latest = comparison?.latest
  const accessibleSummary = comparison && compactModel.status === 'ready'
    ? `The national average 30-year fixed mortgage rate was ${comparison.latest.value.toFixed(1)}% for the week ending ${formatDate(comparison.latest.date)}. It was ${comparison.direction === 'little-changed' ? 'little changed' : comparison.direction} from a year earlier. The compact chart runs from ${formatObservationPeriod(compactModel.recentObservations[0]!.date, 'weekly')} through ${formatObservationPeriod(comparison.latest.date, 'weekly')}.`
    : undefined

  const expanded = <>
    <TimeRangeControl selectedRange={selectedRange} onRangeChange={zoom.selectPreset} contextLabel="30-year fixed mortgage rate" />
    <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
    <Suspense fallback={<p className="chart-state" role="status">Loading mortgage-rate chart…</p>}>
      <EconomicTimeSeriesChart
        key={selectedRange}
        kind="single"
        observations={preset}
        seriesName="30-year fixed mortgage rate"
        frequency="weekly"
        units="Percent"
        transformation={series.transformation}
        includeZero={false}
        valueFormat="percentage"
        zoomStartDate={visible[0]?.date ?? ''}
        zoomEndDate={visible.at(-1)?.date ?? ''}
        onZoomChange={zoom.onChartZoom}
      />
    </Suspense>
    <p className="chart-summary" aria-live="polite">
      The visible period contains {chartSummary.observationCount} valid weekly observations and ranges from {chartSummary.minimum?.value?.toFixed(2) ?? 'an unavailable minimum'}% to {chartSummary.maximum?.value?.toFixed(2) ?? 'an unavailable maximum'}%. Null observations remain gaps; values are not smoothed or carried forward.
    </p>
    {comparison && <section className="series-context" aria-labelledby="mortgage-rate-direction-heading">
      <h4 id="mortgage-rate-direction-heading">Recent direction</h4>
      <p>The current rate is {formatPointDifference(comparison.oneYearDifference)} than one year earlier and {formatPointDifference(comparison.fiveYearDifference)} than five years earlier.</p>
    </section>}
    <div className="series-explanations">
      <section><h4>What this tells you</h4><p>The series shows the average interest rate on a standard 30-year fixed mortgage and provides a long-run benchmark for the cost of financing a home purchase.</p></section>
      <section><h4>Why it matters</h4><p>Mortgage rates influence home-buying power, housing demand, residential construction, refinancing activity, and the incentive for existing homeowners to move. Because housing is interest-rate sensitive, mortgage rates are an important channel through which broader financial conditions affect the economy.</p></section>
      <section><h4>What this leaves out</h4><p>The national average does not show the rate available to a particular borrower, the cost of points or closing fees, differences among loan products, local home prices, household income, taxes, insurance, or other components of housing affordability.</p></section>
    </div>
    <section className="related-indicators" aria-labelledby="mortgage-rate-related-heading"><h4 id="mortgage-rate-related-heading">Consider alongside</h4><ul><li>Housing affordability</li><li>Housing starts</li><li>Federal Reserve policy rates</li><li>10-year Treasury yields</li></ul></section>
    <footer className="series-supporting">
      <p className="series-source">Source: <a href={series.sourceUrl} rel="noreferrer" target="_blank">{series.sourceName}</a></p>
      <details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata">
        <div><dt>Provider series identifier</dt><dd>{series.providerSeriesId}</dd></div>
        <div><dt>Frequency</dt><dd>Weekly, generally released Thursdays</dd></div>
        <div><dt>Units</dt><dd>Percent, not seasonally adjusted</dd></div>
        <div><dt>Observation coverage</dt><dd>{formatObservationPeriod(series.observations[0]!.date, 'weekly')} to {latest ? formatObservationPeriod(latest.date, 'weekly') : 'unavailable'}</dd></div>
        <div><dt>Methodology</dt><dd>Provider-published Freddie Mac Primary Mortgage Market Survey national average; weekly source observations are preserved at full precision. Freddie Mac changed the survey methodology on November 17, 2022; subsequent rates are based on applications submitted to Freddie Mac by lenders nationwide.</dd></div>
        <div><dt>Limitations</dt><dd>Actual offers vary by loan type and term, borrower credit, down payment or loan-to-value ratio, points and fees, lender, property, and other borrower characteristics.</dd></div>
        <div><dt>Retrieved</dt><dd>{formatDate(series.retrievedAt)}</dd></div>
      </dl></details>
      <details className="supporting-disclosure"><summary>Recent observations</summary><RecentObservationsTable observations={selectMostRecentObservations(series.observations, 12)} frequency="weekly" caption="Twelve most recent 30-year fixed mortgage-rate observations" valueColumnLabel="National average mortgage rate" /></details>
    </footer>
  </>

  return <CompactMetricCardLayout
    cardId="mortgage-rate-30-year"
    eyebrow="Mortgage borrowing costs"
    question="How high are mortgage rates?"
    measureLabel="30-year fixed mortgage rate"
    latestValue={<div className="series-current" aria-label={accessibleSummary}>
      <p className="series-current__value">{latest ? `${latest.value.toFixed(1)}%` : 'Unavailable'}</p>
      <p className="series-current__label">Freddie Mac national average</p>
      <p className="series-current__period">{latest ? `Week ending ${formatDate(latest.date)}` : 'Observation date unavailable'}</p>
      {comparison && <p className="series-current__answer">{formatMortgageRateAnswer(comparison)}</p>}
      {historical && <p className="series-current__comparison">{historical}</p>}
      <CompactContextDisclosure accessibleSubject="mortgage rates">
        <p>Mortgage rates strongly affect the monthly payment required to buy a home with borrowed money. Higher rates reduce the amount buyers can afford at a given monthly payment and can weaken home sales and residential construction. Lower rates generally reduce financing costs and can support housing demand.</p>
        <p>Mortgage rates also affect existing homeowners. When current rates are much higher than rates on outstanding mortgages, homeowners may be reluctant to move and give up their existing low-rate loans, contributing to a mortgage-rate “lock-in” effect.</p>
        <p>Mortgage rates are only one part of housing affordability. Home prices, household incomes, taxes, insurance, down payments, and lending standards also matter.</p>
      </CompactContextDisclosure>
    </div>}
    compactVisual={<Suspense fallback={<p className="chart-state chart-state--compact">Loading compact mortgage-rate chart…</p>}><CompactHistoricalMetricChart model={compactModel} definition={mortgageDefinition} observations={series.observations} accessibleSummaryOverride={accessibleSummary} visuallyHideSummary /></Suspense>}
    expandedContent={expanded}
  />
}
