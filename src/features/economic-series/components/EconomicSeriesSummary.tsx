import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  findLatestNonNullObservation,
  formatEconomicValue,
  formatJobChangeProse,
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
  formatSignedPercentagePoints,
  formatAnnualizedHousingUnits,
  selectMostRecentObservations,
  sortObservationsChronologically,
} from '../utils/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import { RecentObservationsTable } from './RecentObservationsTable'
import { PayrollObservationsTable } from './PayrollObservationsTable'
import { TimeRangeControl } from './TimeRangeControl'
import { getEconomicSeriesPresentation } from './seriesPresentation'
import { SavingRateTable } from './SavingRateTable'
import { savingRateChanges } from '../utils/savingRateData'
import {
  calculateProductivityMomentum,
  classifyProductivityAnswer,
  formatProductivityAccessibleSummary,
  formatProductivityAnswer,
  formatProductivityMomentum,
} from '../utils/productivityData'
import { ProductivityMomentumTable } from './ProductivityMomentumTable'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { useHistoricalZoom } from './useHistoricalZoom'
import { BudgetBalanceTable } from './BudgetBalanceTable'
import { TradeBalanceTable } from './TradeBalanceTable'
import {
  describeLendingStandardsChange,
  formatLendingStandardsCallout,
  lendingStandardsCounts,
  medianLendingStandards,
} from '../utils/lendingStandardsData'
import {
  getCompactHistoricalMetricDefinition,
} from '../utils/compactHistoricalMetrics'
import { deriveHistoricalBandContext } from '../utils/historicalBandContext'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import {
  classifyCpiAssessment,
  formatCpiAssessment,
  formatCpiPolicyReference,
} from '../utils/cpiData'
import { CpiPceComparison } from './CpiPceComparison'
import { CpiCoreComparison } from './CpiCoreComparison'
import {
  createUnemploymentAccessibleSummary,
  deriveUnemploymentContext,
} from '../utils/unemploymentContext'
import {
  createPrimeAgeEmploymentAccessibleSummary,
  derivePrimeAgeEmploymentContext,
} from '../utils/primeAgeEmploymentContext'
import {
  createPayrollGrowthAccessibleSummary,
  derivePayrollGrowthContext,
} from '../utils/payrollGrowthContext'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

const CompactHistoricalMetricChart = lazy(() =>
  import('../charts/CompactHistoricalMetricChart').then((module) => ({
    default: module.CompactHistoricalMetricChart,
  })),
)

interface EconomicSeriesSummaryProps {
  collapsible?: boolean
  series: EconomicSeries
  supportingSeries?: readonly EconomicSeries[]
}

function describeInvestmentDirection(
  firstValue: number | null | undefined,
  latestValue: number | null | undefined,
): string {
  if (latestValue === null || latestValue === undefined) {
    return 'The latest visible year-over-year direction is unavailable.'
  }
  if (latestValue < 0) {
    return 'The latest visible value is negative, so the real investment level is below its year-earlier level.'
  }
  if (latestValue === 0) {
    return 'The latest visible value is zero, so the real investment level is unchanged from one year earlier.'
  }
  if (firstValue !== null && firstValue !== undefined && latestValue < firstValue) {
    return 'The latest visible value remains positive, so real investment is still above its year-earlier level even though its growth rate is slower than at the visible period’s start.'
  }
  return 'The latest visible value is positive, so the real investment level is above its year-earlier level.'
}

function medianObservationValue(
  observations: readonly { value: number | null }[],
): number | null {
  const values = observations
    .flatMap((observation) => observation.value === null ? [] : [observation.value])
    .sort((a, b) => a - b)
  if (values.length === 0) return null
  const middle = Math.floor(values.length / 2)
  return values.length % 2 === 0
    ? (values[middle - 1]! + values[middle]!) / 2
    : values[middle]!
}

export function EconomicSeriesSummary({
  collapsible = false,
  series,
  supportingSeries,
}: EconomicSeriesSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const presentation = getEconomicSeriesPresentation(series.slug)
  const latestObservation = findLatestNonNullObservation(series.observations)
  const chronologicalObservations = sortObservationsChronologically(
    series.observations,
  )
  const coverageStart = chronologicalObservations[0]
  const coverageEnd = chronologicalObservations.at(-1)
  const presetObservations = useMemo(
    () => filterObservationsByTimeRange(series.observations, selectedRange),
    [selectedRange, series.observations],
  )
  const zoom = useHistoricalZoom(presetObservations, selectedRange, series.frequency, setSelectedRange)
  const visibleObservations = zoom.visibleItems
  const pceSeries = supportingSeries?.find(
    ({ slug }) => slug === 'headline-pce-inflation',
  )
  const coreCpiSeries = supportingSeries?.find(
    ({ slug }) => slug === 'core-cpi-inflation',
  )
  const pcePresetObservations = useMemo(() => {
    if (!pceSeries || presetObservations.length === 0) return []
    const start = presetObservations[0]!.date
    const end = presetObservations.at(-1)!.date
    return pceSeries.observations.filter(
      ({ date }) => date >= start && date <= end,
    )
  }, [pceSeries, presetObservations])
  const coreCpiPresetObservations = useMemo(() => {
    if (!coreCpiSeries || presetObservations.length === 0) return []
    const start = presetObservations[0]!.date
    const end = presetObservations.at(-1)!.date
    return coreCpiSeries.observations.filter(
      ({ date }) => date >= start && date <= end,
    )
  }, [coreCpiSeries, presetObservations])
  const recentObservations = selectMostRecentObservations(
    visibleObservations,
    presentation.recentObservationCount,
  )
  const chartSummary = useMemo(
    () => calculateChartSummary(visibleObservations),
    [visibleObservations],
  )
  const firstVisibleObservation = visibleObservations.find(
    (observation) => observation.value !== null,
  )
  const visibleValidObservations = visibleObservations.filter(
    (observation): observation is typeof observation & { value: number } =>
      observation.value !== null,
  )
  const previousVisibleObservation = visibleValidObservations.at(-2)
  const lendingCounts = lendingStandardsCounts(visibleObservations)
  const lendingMedian = medianLendingStandards(visibleObservations)
  const visibleMedian = medianObservationValue(visibleObservations)
  const compactDefinition = collapsible
    ? getCompactHistoricalMetricDefinition(series.slug)
    : null
  const compactModel = useMemo(
    () => compactDefinition
      ? deriveHistoricalBandContext(
          series.observations,
          compactDefinition.historicalBands,
        )
      : null,
    [compactDefinition, series.observations],
  )
  const unemploymentContext = useMemo(
    () => series.slug === 'unemployment-rate'
      ? deriveUnemploymentContext(series.observations)
      : null,
    [series.observations, series.slug],
  )
  const primeAgeEmploymentContext = useMemo(
    () => series.slug === 'prime-age-employment-ratio'
      ? derivePrimeAgeEmploymentContext(series.observations)
      : null,
    [series.observations, series.slug],
  )
  const payrollGrowthContext = useMemo(
    () => series.slug === 'payroll-growth'
      ? derivePayrollGrowthContext(series.observations)
      : null,
    [series.observations, series.slug],
  )
  const formatValue = (value: number | null) =>
    formatEconomicValue(value, presentation.valueFormat)
  const savingRateChange =
    series.slug === 'personal-saving-rate'
      ? savingRateChanges(series.observations).find(
          (item) => item.date === latestObservation?.date,
        )?.change ?? null
      : null
  const productivityMomentum =
    series.slug === 'labor-productivity-growth'
      ? calculateProductivityMomentum(series.observations).find(
          (item) => item.date === latestObservation?.date,
        )?.momentumChange ?? null
      : null
  const productivityAnswer = series.slug === 'labor-productivity-growth'
    ? classifyProductivityAnswer(latestObservation?.value ?? null)
    : null
  const productivityMomentumText = series.slug === 'labor-productivity-growth'
    ? formatProductivityMomentum(productivityMomentum)
    : null
  const productivityAccessibleLabel = series.slug === 'labor-productivity-growth'
    ? formatProductivityAccessibleSummary({
        value: latestObservation?.value ?? null,
        formattedValue: formatPercentage(
          latestObservation?.value === null || latestObservation?.value === undefined
            ? null
            : Math.abs(latestObservation.value),
        ),
        period: latestObservation
          ? formatObservationPeriod(latestObservation.date, series.frequency)
          : 'Observation period unavailable',
        state: productivityAnswer!,
        momentum: productivityMomentumText,
      })
    : null
  const cpiAssessment = series.slug === 'headline-cpi-inflation'
    ? formatCpiAssessment(
        classifyCpiAssessment(latestObservation?.value ?? null),
      )
    : null
  const cpiReferenceComparison = series.slug === 'headline-cpi-inflation'
    ? formatCpiPolicyReference(latestObservation?.value ?? null)
    : null
  const cpiAccessibleLabel = series.slug === 'headline-cpi-inflation'
    ? `CPI inflation was ${formatPercentage(latestObservation?.value ?? null)} in ${latestObservation ? formatObservationPeriod(latestObservation.date, series.frequency) : 'an unavailable month'}. ${cpiAssessment}${cpiReferenceComparison ? ` ${cpiReferenceComparison}` : ''}`
    : null

  const latestValueContent = (
    <div
      className="series-current"
      aria-label={
        productivityAccessibleLabel ??
        cpiAccessibleLabel ??
        (unemploymentContext
          ? createUnemploymentAccessibleSummary(unemploymentContext)
          : null) ??
        (primeAgeEmploymentContext
          ? createPrimeAgeEmploymentAccessibleSummary(
              primeAgeEmploymentContext,
            )
          : null) ??
        (payrollGrowthContext
          ? createPayrollGrowthAccessibleSummary(payrollGrowthContext)
          : null) ??
        presentation.latestValueLabel
      }
    >
        <p className="series-current__value">
          <span
            aria-label={
              presentation.valueFormat === 'signed-thousands'
                ? formatJobChangeProse(latestObservation?.value ?? null)
                : undefined
            }
          >
            {series.slug === 'bank-lending-standards'
              ? formatLendingStandardsCallout(latestObservation?.value ?? null)
              : series.slug === 'housing-starts'
              ? formatAnnualizedHousingUnits(latestObservation?.value ?? null)
              : formatValue(latestObservation?.value ?? null)}
          </span>
        </p>
        <p className="series-current__label">
          {series.slug === 'trade-balance-share-of-gdp'
            ? latestObservation?.value === null || latestObservation?.value === undefined ? 'Balance unavailable' : latestObservation.value < 0 ? 'Trade deficit' : latestObservation.value > 0 ? 'Trade surplus' : 'Balanced trade'
            : series.slug === 'federal-budget-balance'
            ? latestObservation?.value === null || latestObservation?.value === undefined
              ? 'Balance unavailable'
              : latestObservation.value < 0 ? 'Deficit' : latestObservation.value > 0 ? 'Surplus' : 'Balanced'
            : series.slug === 'broad-credit-conditions'
            ? latestObservation?.value === null || latestObservation?.value === undefined
              ? 'Relative credit conditions unavailable'
              : latestObservation.value > 0
                ? 'Tighter than average'
                : latestObservation.value < 0
                  ? 'Looser than average'
                  : 'Near average'
            : series.slug === 'corporate-profit-share' && latestObservation
            ? `After-tax corporate profit share, ${formatObservationPeriod(latestObservation.date, series.frequency)}`
            : series.slug === 'labor-productivity-growth'
            ? formatProductivityAnswer(productivityAnswer!)
            : series.slug === 'headline-cpi-inflation'
            ? cpiAssessment
            : series.slug === 'unemployment-rate'
            ? 'Share of the labor force without a job and actively looking for work'
            : series.slug === 'prime-age-employment-ratio'
            ? 'Share of adults ages 25–54 who are employed'
            : series.slug === 'payroll-growth'
            ? 'Latest three-month average'
            : presentation.latestValueLabel}
        </p>
        <p className="series-current__period">
          {latestObservation
            ? formatObservationPeriod(
                latestObservation.date,
                series.frequency,
              )
            : 'Observation period unavailable'}
          {' · '}
          {series.slug === 'labor-productivity-growth'
            ? 'Percent change from year ago'
            : series.units}
        </p>
        {series.slug === 'labor-productivity-growth' &&
          productivityMomentumText && (
            <p className="series-current__comparison">
              {productivityMomentumText}
            </p>
          )}
        {series.slug === 'headline-cpi-inflation' &&
          cpiReferenceComparison && (
            <p className="series-current__comparison">
              {cpiReferenceComparison}
            </p>
          )}
        {unemploymentContext && (
          <>
            <p className="series-current__answer">
              {unemploymentContext.levelStatement}
            </p>
            <p className="series-current__comparison">
              {unemploymentContext.directionStatement}
              {unemploymentContext.twelveMonthChange !== null && (
                <>
                  {' '}The change was{' '}
                  {formatSignedPercentagePoints(
                    unemploymentContext.twelveMonthChange,
                  )} percentage points.
                </>
              )}
            </p>
          </>
        )}
        {primeAgeEmploymentContext && (
          <p className="series-current__answer">
            {primeAgeEmploymentContext.levelStatement}
          </p>
        )}
        {payrollGrowthContext && (
          <p className="series-current__answer">
            {payrollGrowthContext.answer}
          </p>
        )}
    </div>
  )
  const compactVisual = compactModel && compactDefinition ? (
    <Suspense
      fallback={
        <p className="chart-state chart-state--compact" role="status">
          Loading compact historical chart…
        </p>
      }
    >
      <CompactHistoricalMetricChart
        model={compactModel}
        definition={compactDefinition}
        visuallyHideSummary
      />
    </Suspense>
  ) : undefined

  return (
    <CompactMetricCardLayout
      cardId={series.slug}
      eyebrow={presentation.topicLabel}
      question={series.slug === 'unemployment-rate'
        ? 'Is unemployment high or low?'
        : series.question}
      measureLabel={series.title}
      latestValue={latestValueContent}
      compactVisual={compactVisual}
      collapsible={collapsible}
      expandedContent={(
        <>
      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={zoom.selectPreset}
        contextLabel={series.shortTitle}
      />

      <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />

      {series.slug === 'headline-cpi-inflation' && coreCpiSeries && (
        <CpiCoreComparison
          cpi={series}
          core={coreCpiSeries}
          cpiObservations={presetObservations}
          coreObservations={coreCpiPresetObservations}
          zoomStartDate={visibleObservations[0]?.date ?? ''}
          zoomEndDate={visibleObservations.at(-1)?.date ?? ''}
          onZoomChange={zoom.onChartZoom}
        />
      )}

      {series.slug === 'headline-cpi-inflation' && pceSeries && (
        <CpiPceComparison
          cpi={series}
          pce={pceSeries}
          cpiObservations={presetObservations}
          pceObservations={pcePresetObservations}
          zoomStartDate={visibleObservations[0]?.date ?? ''}
          zoomEndDate={visibleObservations.at(-1)?.date ?? ''}
          onZoomChange={zoom.onChartZoom}
        />
      )}

      {chartSummary.observationCount > 0 ? (
        <>
          <Suspense
            fallback={
              <p className="chart-state" role="status">
                Loading chart visualization…
              </p>
            }
          >
            <EconomicTimeSeriesChart
              key={selectedRange}
              kind="single"
              observations={presetObservations}
              seriesName={series.shortTitle}
              frequency={series.frequency}
              units={series.units}
              transformation={series.transformation}
              includeZero={presentation.includeZeroInChart}
              valueFormat={presentation.valueFormat}
              zoomStartDate={visibleObservations[0]?.date ?? ''}
              zoomEndDate={visibleObservations.at(-1)?.date ?? ''}
              onZoomChange={zoom.onChartZoom}
            />
          </Suspense>
          {series.slug === 'corporate-profit-share' ? (
            <p className="chart-summary" aria-live="polite">
              From {firstVisibleObservation ? formatObservationPeriod(firstVisibleObservation.date, series.frequency) : 'an unavailable quarter'} to {chartSummary.latest ? formatObservationPeriod(chartSummary.latest.date, series.frequency) : 'an unavailable quarter'}, the after-tax corporate profit share {chartSummary.latest?.value !== null && chartSummary.latest?.value !== undefined && firstVisibleObservation?.value !== null && firstVisibleObservation?.value !== undefined && chartSummary.latest.value > firstVisibleObservation.value ? 'rose' : chartSummary.latest?.value === firstVisibleObservation?.value ? 'was unchanged' : 'fell'} from {formatValue(firstVisibleObservation?.value ?? null)} to {formatValue(chartSummary.latest?.value ?? null)} of GDP. This means adjusted after-tax profits {chartSummary.latest?.value !== null && chartSummary.latest?.value !== undefined && firstVisibleObservation?.value !== null && firstVisibleObservation?.value !== undefined && chartSummary.latest.value >= firstVisibleObservation.value ? 'expanded' : 'were compressed'} relative to the economy; it does not state that the raw dollar level of profits {chartSummary.latest?.value !== null && chartSummary.latest?.value !== undefined && firstVisibleObservation?.value !== null && firstVisibleObservation?.value !== undefined && chartSummary.latest.value >= firstVisibleObservation.value ? 'rose' : 'fell'}. The visible range ran from {formatValue(chartSummary.minimum?.value ?? null)} to {formatValue(chartSummary.maximum?.value ?? null)}, and the latest share was {visibleMedian !== null && chartSummary.latest?.value !== null && chartSummary.latest?.value !== undefined && chartSummary.latest.value >= visibleMedian ? 'at or above' : 'below'} its visible-range median.
            </p>
          ) : series.slug === 'bank-lending-standards' ? (
            <p className="chart-summary" aria-live="polite">
              In {chartSummary.latest ? formatObservationPeriod(chartSummary.latest.date, series.frequency) : 'the latest visible quarter'}, banks reported {formatLendingStandardsCallout(chartSummary.latest?.value ?? null).toLowerCase()}.{' '}
              {describeLendingStandardsChange(
                previousVisibleObservation?.value ?? null,
                chartSummary.latest?.value ?? null,
              )}{' '}
              The visible range ran from {formatValue(chartSummary.minimum?.value ?? null)} to {formatValue(chartSummary.maximum?.value ?? null)}; {lendingCounts.above} observations were above zero, {lendingCounts.below} were below zero, and {lendingCounts.zero} were exactly zero. The latest value was {lendingMedian !== null && chartSummary.latest?.value !== null && chartSummary.latest?.value !== undefined && chartSummary.latest.value >= lendingMedian ? 'at or above' : 'below'} the visible-range median.
            </p>
          ) : series.slug === 'federal-budget-balance' ? (
            <p className="chart-summary" aria-live="polite">
              From {firstVisibleObservation ? formatObservationPeriod(firstVisibleObservation.date, series.frequency) : 'an unavailable year'} to {chartSummary.latest ? formatObservationPeriod(chartSummary.latest.date, series.frequency) : 'an unavailable year'}, the federal budget balance moved from {formatValue(firstVisibleObservation?.value ?? null)} to {formatValue(chartSummary.latest?.value ?? null)} of GDP. The largest visible deficit was {formatValue(chartSummary.minimum?.value ?? null)} in {chartSummary.minimum ? formatObservationPeriod(chartSummary.minimum.date, series.frequency) : 'an unavailable year'}{chartSummary.maximum && chartSummary.maximum.value !== null && chartSummary.maximum.value > 0 ? `, and the largest visible surplus was ${formatValue(chartSummary.maximum.value)} in ${formatObservationPeriod(chartSummary.maximum.date, series.frequency)}` : ', and no surplus appears in the visible period'}. The latest observation is {chartSummary.latest?.value === null || chartSummary.latest?.value === undefined ? 'unavailable' : chartSummary.latest.value < 0 ? 'a deficit' : chartSummary.latest.value > 0 ? 'a surplus' : 'balanced'}.
            </p>
          ) : series.slug === 'trade-balance-share-of-gdp' ? (
            <p className="chart-summary" aria-live="polite">
              From {firstVisibleObservation ? formatObservationPeriod(firstVisibleObservation.date, series.frequency) : 'an unavailable quarter'} to {chartSummary.latest ? formatObservationPeriod(chartSummary.latest.date, series.frequency) : 'an unavailable quarter'}, the trade balance moved from {formatValue(firstVisibleObservation?.value ?? null)} to {formatValue(chartSummary.latest?.value ?? null)} of GDP. The largest visible deficit was {formatValue(chartSummary.minimum?.value ?? null)} in {chartSummary.minimum ? formatObservationPeriod(chartSummary.minimum.date, series.frequency) : 'an unavailable quarter'}{chartSummary.maximum && chartSummary.maximum.value !== null && chartSummary.maximum.value > 0 ? `, and the largest visible surplus was ${formatValue(chartSummary.maximum.value)} in ${formatObservationPeriod(chartSummary.maximum.date, series.frequency)}` : ', and no surplus appears in the visible period'}. The latest observation is {chartSummary.latest?.value === null || chartSummary.latest?.value === undefined ? 'unavailable' : chartSummary.latest.value < 0 ? 'a trade deficit' : chartSummary.latest.value > 0 ? 'a trade surplus' : 'balanced trade'}.
            </p>
          ) : series.slug === 'federal-debt-held-by-public' ? (
            <p className="chart-summary" aria-live="polite">
              During the visible period, federal debt held by the public moved from {formatValue(firstVisibleObservation?.value ?? null)} of GDP in {firstVisibleObservation ? formatObservationPeriod(firstVisibleObservation.date, series.frequency) : 'an unavailable quarter'} to {formatValue(chartSummary.latest?.value ?? null)} in {chartSummary.latest ? formatObservationPeriod(chartSummary.latest.date, series.frequency) : 'an unavailable quarter'}. It ranged from {formatValue(chartSummary.minimum?.value ?? null)} to {formatValue(chartSummary.maximum?.value ?? null)}. The first-to-latest change was {formatSignedPercentagePoints(chartSummary.latest?.value !== null && chartSummary.latest?.value !== undefined && firstVisibleObservation?.value !== null && firstVisibleObservation?.value !== undefined ? chartSummary.latest.value - firstVisibleObservation.value : null)} percentage points.
            </p>
          ) : series.slug === 'broad-credit-conditions' ? (
            <p className="chart-summary" aria-live="polite">
              During the visible period, the credit-conditions index moved from{' '}
              {formatValue(firstVisibleObservation?.value ?? null)} in{' '}
              {firstVisibleObservation ? formatObservationPeriod(firstVisibleObservation.date, series.frequency) : 'an unavailable week'} to{' '}
              {formatValue(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest ? formatObservationPeriod(chartSummary.latest.date, series.frequency) : 'an unavailable week'}. It ranged from{' '}
              {formatValue(chartSummary.minimum?.value ?? null)} to {formatValue(chartSummary.maximum?.value ?? null)}. The latest visible value indicates{' '}
              {chartSummary.latest?.value === null || chartSummary.latest?.value === undefined
                ? 'unavailable relative conditions.'
                : chartSummary.latest.value > 0
                  ? 'tighter-than-average credit conditions.'
                  : chartSummary.latest.value < 0
                    ? 'looser-than-average credit conditions.'
                    : 'conditions near their historical average.'}
            </p>
          ) : series.slug === 'real-business-investment-growth' ? (
            <p className="chart-summary" aria-live="polite">
              During the visible period, real business investment growth moved
              from {formatValue(firstVisibleObservation?.value ?? null)} in{' '}
              {firstVisibleObservation
                ? formatObservationPeriod(firstVisibleObservation.date, series.frequency)
                : 'an unavailable quarter'} to{' '}
              {formatValue(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(chartSummary.latest.date, series.frequency)
                : 'an unavailable quarter'}. It ranged from{' '}
              {formatValue(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(chartSummary.minimum.date, series.frequency)
                : 'an unavailable quarter'} to{' '}
              {formatValue(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(chartSummary.maximum.date, series.frequency)
                : 'an unavailable quarter'}.{' '}
              {describeInvestmentDirection(
                firstVisibleObservation?.value,
                chartSummary.latest?.value,
              )}
            </p>
          ) : series.slug === 'industrial-capacity-utilization' ? (
            <p className="chart-summary" aria-live="polite">
              During the visible period, industrial capacity utilization moved
              from {formatValue(firstVisibleObservation?.value ?? null)} in{' '}
              {firstVisibleObservation
                ? formatObservationPeriod(firstVisibleObservation.date, series.frequency)
                : 'an unavailable month'} to{' '}
              {formatValue(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(chartSummary.latest.date, series.frequency)
                : 'an unavailable month'}. The visible minimum was{' '}
              {formatValue(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(chartSummary.minimum.date, series.frequency)
                : 'an unavailable month'}, and the visible maximum was{' '}
              {formatValue(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(chartSummary.maximum.date, series.frequency)
                : 'an unavailable month'}.
            </p>
          ) : series.slug === 'housing-starts' ? (
            <p className="chart-summary" aria-live="polite">
              For the visible period, housing starts began at{' '}
              {formatValue(firstVisibleObservation?.value ?? null)} in{' '}
              {firstVisibleObservation
                ? formatObservationPeriod(firstVisibleObservation.date, series.frequency)
                : 'an unavailable period'}, reached a low of{' '}
              {formatValue(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(chartSummary.minimum.date, series.frequency)
                : 'an unavailable period'}, and reached a high of{' '}
              {formatValue(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(chartSummary.maximum.date, series.frequency)
                : 'an unavailable period'}. The latest annualized pace is{' '}
              {formatValue(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(chartSummary.latest.date, series.frequency)
                : 'an unavailable period'}.
            </p>
          ) : presentation.summaryFormat === 'job-change' ? (
            <p className="chart-summary" aria-live="polite">
              For the visible period, the three-month average monthly payroll
              change ranged from{' '}
              {formatJobChangeProse(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(
                    chartSummary.minimum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}{' '}
              to {formatJobChangeProse(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(
                    chartSummary.maximum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}. The latest value is{' '}
              {formatJobChangeProse(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(
                    chartSummary.latest.date,
                    series.frequency,
                  )
                : 'an unavailable period'}.
            </p>
          ) : (
            <p className="chart-summary" aria-live="polite">
              For the visible period, {series.shortTitle} ranged from{' '}
              {formatValue(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(
                    chartSummary.minimum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}{' '}
              to {formatValue(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(
                    chartSummary.maximum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}. The latest value is{' '}
              {formatValue(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(
                    chartSummary.latest.date,
                    series.frequency,
                  )
                : 'an unavailable period'}.{' '}
              {presentation.reportBelowZero &&
                (chartSummary.hasBelowZero
                  ? 'At least one observation was below zero.'
                  : 'No observations were below zero.')}
              {series.slug === 'personal-saving-rate' && (
                <> The change from 12 months earlier was {formatSignedPercentage(savingRateChange)} percentage points.</>
              )}
              {series.slug === 'labor-productivity-growth' &&
                productivityMomentumText && (
                  <> {productivityMomentumText}</>
                )}
            </p>
          )}
        </>
      ) : (
        <p className="chart-state" role="status">
          No {series.shortTitle} observations are available for the selected
          period.
        </p>
      )}

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>
            {series.slug === 'unemployment-rate'
              ? 'The unemployment rate measures the current level of joblessness among people in the labor force. The compact historical classification and the separate 12-month movement describe level and direction without combining them into one score.'
              : presentation.whatThisTellsYou}
          </p>
        </section>
        <section>
          <h4>What this leaves out</h4>
          <p>
            {series.slug === 'unemployment-rate'
              ? 'The labor force includes employed people and unemployed people who are available and have recently looked for work. People who want work but are not actively looking are not counted as unemployed. The rate does not measure job creation, layoffs, job quality, hours, pay, or differences across groups.'
              : presentation.whatThisLeavesOut}
          </p>
        </section>
      </div>

      <section
        className="related-indicators"
        aria-labelledby={`${series.slug}-related-heading`}
      >
        <h4 id={`${series.slug}-related-heading`}>Consider alongside</h4>
        <ul>
          {(series.slug === 'unemployment-rate'
            ? ['Payroll growth', 'Prime-age employment', 'Initial claims']
            : presentation.relatedIndicators).map((indicator) => (
            <li key={indicator}>{indicator}</li>
          ))}
        </ul>
      </section>

      <footer className="series-supporting">
        <p className="series-source">
          {series.sources ? 'Sources: ' : 'Source: '}
          {series.sources ? (
            series.sources.map((source, index) => (
              <span key={`${source.providerSeriesId}-${source.role ?? index}`}>
                {index > 0 && '; '}
                <a href={source.sourceUrl} rel="noreferrer" target="_blank">
                  {source.providerSeriesId} — {source.sourceName}
                </a>
              </span>
            ))
          ) : (
            <a href={series.sourceUrl} rel="noreferrer" target="_blank">
              {series.sourceName}
            </a>
          )}
        </p>

        <details className="supporting-disclosure">
          <summary>Series details</summary>
          <dl className="series-metadata">
            <div>
              <dt>Provider series identifier</dt>
              <dd>{series.providerSeriesId}</dd>
            </div>
            <div>
              <dt>Frequency</dt>
              <dd>
                {series.frequency.charAt(0).toUpperCase() +
                  series.frequency.slice(1)}
              </dd>
            </div>
            <div>
              <dt>Units</dt>
              <dd>{series.units}</dd>
            </div>
            <div>
              <dt>Seasonal adjustment</dt>
              <dd>{series.seasonalAdjustment ?? 'Not seasonally adjusted'}</dd>
            </div>
            <div>
              <dt>Transformation</dt>
              <dd>{series.transformation}</dd>
            </div>
            <div>
              <dt>Retrieved</dt>
              <dd>{formatDate(series.retrievedAt)}</dd>
            </div>
            <div>
              <dt>Observation coverage</dt>
              <dd>
                {coverageStart && coverageEnd
                  ? `${formatObservationPeriod(coverageStart.date, series.frequency)} to ${formatObservationPeriod(coverageEnd.date, series.frequency)}`
                  : 'Not available'}
              </dd>
            </div>
            {series.sources?.some(
              (source) => source.observationStart && source.observationEnd,
            ) && (
              <div>
                <dt>Source coverage</dt>
                <dd>
                  {series.sources
                    .filter(
                      (source) => source.observationStart && source.observationEnd,
                    )
                    .map(
                      (source) =>
                        `${source.providerSeriesId}: ${formatObservationPeriod(source.observationStart!, series.frequency)} to ${formatObservationPeriod(source.observationEnd!, series.frequency)}`,
                    )
                    .join('; ')}
                </dd>
              </div>
            )}
          </dl>
        </details>

        <details className="supporting-disclosure">
          <summary>Recent observations</summary>
          {series.slug === 'labor-productivity-growth' ? (
            <ProductivityMomentumTable observations={visibleObservations} />
          ) : series.slug === 'personal-saving-rate' ? (
            <SavingRateTable observations={visibleObservations} />
          ) : series.slug === 'federal-budget-balance' ? (
            <BudgetBalanceTable observations={recentObservations} />
          ) : series.slug === 'trade-balance-share-of-gdp' ? (
            <TradeBalanceTable observations={recentObservations} />
          ) : presentation.recentTable === 'payroll-changes' && supportingSeries?.[0] ? (
            <PayrollObservationsTable
              averages={visibleObservations}
              monthlyChanges={supportingSeries[0].observations.filter((item) => visibleObservations.some((visible) => visible.date === item.date))}
              caption={presentation.recentObservationsCaption}
              count={presentation.recentObservationCount}
            />
          ) : (
            <RecentObservationsTable
              observations={recentObservations}
              frequency={series.frequency}
              caption={presentation.recentObservationsCaption}
              valueColumnLabel={presentation.valueColumnLabel}
              valueFormat={presentation.valueFormat}
            />
          )}
        </details>
      </footer>
        </>
      )}
    />
  )
}
