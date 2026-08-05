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
import {
  createSavingRateAccessibleSummary,
  deriveSavingRateContext,
  formatSavingRateChange,
} from '../utils/savingRateContext'
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
import {
  formatHomeOwnershipAffordabilityAnswer,
  formatHomeOwnershipHistoricalPosition,
  formatHomeOwnershipThresholdContext,
} from '../utils/homeOwnershipAffordability'
import {
  createHousingStartsAccessibleSummary,
  deriveHousingStartsCompactData,
  formatHousingStartsHistoricalPosition,
} from '../utils/housingStartsData'
import {
  createManufacturingAccessibleSummary,
  deriveManufacturingOutputGrowth,
  formatManufacturingDirection,
  formatManufacturingHistoricalPosition,
} from '../utils/manufacturingOutputGrowth'
import { HousingConstructionDetails } from './HousingConstructionDetails'
import {
  createBusinessInvestmentAccessibleSummary,
  formatBusinessInvestmentAnswer,
  formatBusinessInvestmentHistoricalPosition,
  formatBusinessInvestmentInterpretation,
} from '../utils/businessInvestmentContext'
import {
  createCorporateProfitShareAccessibleSummary,
  formatCorporateProfitSharePosition,
  formatCorporateProfitStructuralInterpretation,
  formatProfitPerHundred,
} from '../utils/corporateProfitShareContext'
import {
  formatCapacityUtilizationAnswer,
  formatCapacityUtilizationComparison,
  industrialCapacityBenchmarkPeriod,
  industrialCapacityBenchmarkUrl,
  industrialCapacityLongRunAverage,
} from '../utils/capacityUtilizationContext'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

const CompactHistoricalMetricChart = lazy(() =>
  import('../charts/CompactHistoricalMetricChart').then((module) => ({
    default: module.CompactHistoricalMetricChart,
  })),
)

const SavingRateDistributionSection = lazy(() =>
  import('./SavingRateDistributionSection').then((module) => ({
    default: module.SavingRateDistributionSection,
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
  const populationSeries = supportingSeries?.find(
    ({ slug }) => slug === 'us-population-monthly',
  )
  const businessInvestmentLevel = supportingSeries?.find(
    ({ slug }) => slug === 'real-business-investment-level',
  )
  const housingStartsCompactData = useMemo(
    () => series.slug === 'housing-starts' && populationSeries
      ? deriveHousingStartsCompactData(
          series.observations,
          populationSeries.observations,
        )
      : null,
    [populationSeries, series.observations, series.slug],
  )
  const manufacturingOutputGrowth = useMemo(
    () => series.slug === 'manufacturing-output'
      ? deriveManufacturingOutputGrowth(series.observations)
      : null,
    [series.observations, series.slug],
  )
  const compactObservations = housingStartsCompactData?.normalizedAverages ??
    manufacturingOutputGrowth?.growth ?? series.observations
  const housingNormalizedPresetObservations = useMemo(() => {
    if (!housingStartsCompactData || presetObservations.length === 0) return []
    const start = presetObservations[0]!.date
    const end = presetObservations.at(-1)!.date
    return housingStartsCompactData.normalizedAverages.filter(
      ({ date }) => date >= start && date <= end,
    )
  }, [housingStartsCompactData, presetObservations])
  const manufacturingGrowthPresetObservations = useMemo(() => {
    if (!manufacturingOutputGrowth || presetObservations.length === 0) return []
    const start = presetObservations[0]!.date
    const end = presetObservations.at(-1)!.date
    return manufacturingOutputGrowth.growth.filter(
      ({ date }) => date >= start && date <= end,
    )
  }, [manufacturingOutputGrowth, presetObservations])
  const headlineObservation = housingStartsCompactData
    ? findLatestNonNullObservation(housingStartsCompactData.rawAverages)
    : manufacturingOutputGrowth
    ? findLatestNonNullObservation(manufacturingOutputGrowth.growth)
    : latestObservation
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
          compactObservations,
          compactDefinition.historicalBands,
        )
      : null,
    [compactDefinition, compactObservations],
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
  const savingRateContext = useMemo(
    () => series.slug === 'personal-saving-rate'
      ? deriveSavingRateContext(series.observations)
      : null,
    [series.observations, series.slug],
  )
  const formatValue = (value: number | null) =>
    formatEconomicValue(value, presentation.valueFormat)
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
  const housingStartsAccessibleLabel = housingStartsCompactData &&
    compactModel?.status === 'ready'
    ? createHousingStartsAccessibleSummary(
        compactModel,
        housingStartsCompactData.rawAverages,
      )
    : null
  const manufacturingAccessibleLabel = manufacturingOutputGrowth &&
    compactModel?.status === 'ready'
    ? createManufacturingAccessibleSummary(compactModel)
    : null
  const businessInvestmentAccessibleLabel = series.slug === 'real-business-investment-growth' && compactModel?.status === 'ready'
    ? createBusinessInvestmentAccessibleSummary(compactModel)
    : null
  const corporateProfitAccessibleLabel = series.slug === 'corporate-profit-share' && compactModel?.status === 'ready'
    ? createCorporateProfitShareAccessibleSummary(compactModel)
    : null

  const latestValueContent = (
    <div
      className="series-current"
      aria-label={
        productivityAccessibleLabel ??
        cpiAccessibleLabel ??
        housingStartsAccessibleLabel ??
        manufacturingAccessibleLabel ??
        businessInvestmentAccessibleLabel ??
        corporateProfitAccessibleLabel ??
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
        (savingRateContext
          ? createSavingRateAccessibleSummary(savingRateContext)
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
              ? formatAnnualizedHousingUnits(headlineObservation?.value ?? null)
            : series.slug === 'manufacturing-output'
              ? formatSignedPercentage(headlineObservation?.value ?? null)
              : series.slug === 'real-business-investment-growth'
              ? formatSignedPercentage(latestObservation?.value ?? null)
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
            : series.slug === 'corporate-profit-share'
            ? 'Adjusted after-tax corporate profits as a share of GDP'
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
            : series.slug === 'personal-saving-rate'
            ? 'Share of disposable personal income saved'
            : series.slug === 'home-ownership-cost-share'
            ? 'Estimated share of median household income needed to own the median-priced home'
            : series.slug === 'housing-starts'
            ? 'Three-month average annualized pace'
            : series.slug === 'manufacturing-output'
            ? 'Change in inflation-adjusted manufacturing production from a year earlier'
            : series.slug === 'industrial-capacity-utilization'
            ? 'Industrial capacity currently in use'
            : series.slug === 'real-business-investment-growth'
            ? 'Change in inflation-adjusted business investment from a year ago'
            : presentation.latestValueLabel}
        </p>
        <p className="series-current__period">
          {headlineObservation
            ? formatObservationPeriod(
                headlineObservation.date,
                series.frequency,
              )
            : 'Observation period unavailable'}
          {' · '}
          {series.slug === 'labor-productivity-growth'
            ? 'Percent change from year ago'
            : series.slug === 'manufacturing-output'
            ? 'Three-month average'
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
        {savingRateContext && (
          <>
            <p className="series-current__answer">
              {savingRateContext.directionStatement}
            </p>
            <p className="series-current__answer">
              {savingRateContext.levelStatement}
            </p>
            <p className="series-current__comparison">
              {formatSavingRateChange(savingRateContext.twelveMonthChange)}
            </p>
          </>
        )}
        {series.slug === 'home-ownership-cost-share' && (
          <>
            <p className="series-current__answer">
              {formatHomeOwnershipAffordabilityAnswer(latestObservation?.value ?? null)}
            </p>
            <p className="series-current__comparison">
              {formatHomeOwnershipThresholdContext(latestObservation?.value ?? null)}
            </p>
            {compactModel?.status === 'ready' && (
              <p className="series-current__comparison">
                {formatHomeOwnershipHistoricalPosition(compactModel)}
              </p>
            )}
          </>
        )}
        {housingStartsCompactData && (
          <>
            <p className="series-current__answer">
              Builders are starting housing at an annualized pace of about{' '}
              {formatAnnualizedHousingUnits(headlineObservation?.value ?? null)}.
            </p>
            {compactModel?.status === 'ready' && (
              <p className="series-current__comparison">
                Relative to the U.S. population, the current pace is{' '}
                {formatHousingStartsHistoricalPosition(
                  compactModel.latestObservation.value,
                  compactModel,
                )}{' '}
                by historical standards.
              </p>
            )}
          </>
        )}
        {manufacturingOutputGrowth && (
          <>
            <p className="series-current__answer">
              {formatManufacturingDirection(headlineObservation?.value ?? null)}
            </p>
            {compactModel?.status === 'ready' && (
              <p className="series-current__comparison">
                The current growth rate is{' '}
                {formatManufacturingHistoricalPosition(
                  compactModel.latestObservation.value,
                  compactModel,
                )}{' '}
                by the standards of the past 25 years.
              </p>
            )}
          </>
        )}
        {series.slug === 'real-business-investment-growth' && (
          <>
            <p className="series-current__answer">{formatBusinessInvestmentAnswer(latestObservation?.value ?? null)}</p>
            <p className="series-current__comparison">{formatBusinessInvestmentInterpretation(latestObservation?.value ?? null)}</p>
            {compactModel?.status === 'ready' && <p className="series-current__comparison">The current growth rate is {formatBusinessInvestmentHistoricalPosition(compactModel)} relative to the available history.</p>}
          </>
        )}
        {series.slug === 'corporate-profit-share' && (
          <>
            <p className="series-current__answer">{formatProfitPerHundred(latestObservation?.value ?? null)}</p>
            {compactModel?.status === 'ready' && <>
              <p className="series-current__comparison">The current corporate-profit share is {formatCorporateProfitSharePosition(compactModel)} by the standards of the past 25 years.</p>
              <p className="series-current__comparison">{formatCorporateProfitStructuralInterpretation(compactModel)}</p>
            </>}
          </>
        )}
        {series.slug === 'industrial-capacity-utilization' && (
          <>
            <p className="series-current__answer">{formatCapacityUtilizationAnswer(latestObservation?.value ?? null)}</p>
            <p className="series-current__comparison">{formatCapacityUtilizationComparison(latestObservation?.value ?? null)}</p>
          </>
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
        observations={compactObservations}
        pairedObservations={housingStartsCompactData?.rawAverages}
        {...(manufacturingOutputGrowth ? {
          pairedObservations: manufacturingOutputGrowth.averages,
          pairedObservationLabel: 'Three-month-average production index',
          pairedValueFormatter: (value: number | null) => value === null
            ? 'Unavailable'
            : value.toFixed(1),
        } : {})}
        {...(businessInvestmentLevel ? {
          pairedObservations: businessInvestmentLevel.observations,
          pairedObservationLabel: 'Underlying real investment level',
          pairedValueFormatter: (value: number | null) => value === null ? 'Unavailable' : `${value.toFixed(1)} billion chained 2017 dollars, annualized`,
        } : {})}
        {...(series.slug === 'corporate-profit-share' ? {
          pairedObservations: series.observations,
          pairedObservationLabel: 'Equivalent adjusted after-tax profit per $100 of GDP',
          pairedValueFormatter: (value: number | null) => value === null ? 'Unavailable' : `$${value.toFixed(2)}`,
        } : {})}
        accessibleSummaryOverride={housingStartsAccessibleLabel ?? businessInvestmentAccessibleLabel ?? corporateProfitAccessibleLabel ?? undefined}
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
        : series.slug === 'personal-saving-rate'
        ? 'Are households saving less of their income?'
        : series.slug === 'home-ownership-cost-share'
        ? 'How much of a median household’s income would it take to own a typical home?'
        : series.slug === 'manufacturing-output'
        ? 'Are U.S. manufacturers producing more goods?'
        : series.slug === 'real-business-investment-growth'
        ? 'Are businesses investing more in productive assets?'
        : series.slug === 'corporate-profit-share'
        ? 'How large are corporate profits relative to the economy?'
        : series.question}
      measureLabel={series.slug === 'home-ownership-cost-share'
        ? 'Estimated share of median household income needed to own the median-priced home'
        : series.slug === 'manufacturing-output'
        ? 'Inflation-adjusted manufacturing production'
        : series.slug === 'real-business-investment-growth'
        ? 'Real private nonresidential fixed investment'
        : series.slug === 'corporate-profit-share'
        ? 'Adjusted after-tax corporate profits as a share of GDP'
        : series.title}
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
                <> {formatSavingRateChange(savingRateContext?.twelveMonthChange ?? null)}. A positive saving rate means households still saved in aggregate; a decline means they retained a smaller share of current income, not necessarily that they drew down accumulated assets.</>
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

      {series.slug === 'personal-saving-rate' && chartSummary.observationCount > 0 && (
        <Suspense fallback={<p className="chart-state" role="status">Loading saving-rate distribution…</p>}>
          <SavingRateDistributionSection />
        </Suspense>
      )}

      {housingStartsCompactData && housingNormalizedPresetObservations.length > 0 && (
        <section aria-labelledby="housing-starts-population-heading">
          <h4 id="housing-starts-population-heading">
            Housing starts per 1,000 residents
          </h4>
          <p>
            This separate view shows the three-month-average annualized pace
            divided by the population estimate for each exact month. It makes
            different population eras more comparable without changing the raw
            housing-start series above.
          </p>
          <Suspense fallback={<p className="chart-state" role="status">Loading population-normalized housing chart…</p>}>
            <EconomicTimeSeriesChart
              key={`housing-normalized-${selectedRange}`}
              kind="single"
              observations={housingNormalizedPresetObservations}
              seriesName="Three-month-average annualized starts per 1,000 residents"
              frequency="monthly"
              units="Starts per 1,000 residents"
              transformation="Three-month average of exact-month housing starts divided by population"
              includeZero={false}
              valueFormat="index"
              zoomStartDate={visibleObservations[0]?.date ?? ''}
              zoomEndDate={visibleObservations.at(-1)?.date ?? ''}
              onZoomChange={zoom.onChartZoom}
            />
          </Suspense>
        </section>
      )}

      {manufacturingGrowthPresetObservations.length > 0 && (
        <section aria-labelledby="manufacturing-output-growth-heading">
          <h4 id="manufacturing-output-growth-heading">
            Inflation-adjusted manufacturing production growth
          </h4>
          <p>
            This separate view compares each complete three-month average of the
            production index with the complete three-month average 12 months earlier.
          </p>
          <Suspense fallback={<p className="chart-state" role="status">Loading manufacturing growth chart…</p>}>
            <EconomicTimeSeriesChart
              key={`manufacturing-growth-${selectedRange}`}
              kind="single"
              observations={manufacturingGrowthPresetObservations}
              seriesName="Three-month-average manufacturing production growth"
              frequency="monthly"
              units="Percent change from year ago"
              transformation="Year-over-year percentage change in trailing three-month average"
              includeZero
              valueFormat="signed-percentage"
              zoomStartDate={visibleObservations[0]?.date ?? ''}
              zoomEndDate={visibleObservations.at(-1)?.date ?? ''}
              onZoomChange={zoom.onChartZoom}
            />
          </Suspense>
        </section>
      )}

      {series.slug === 'housing-starts' && <HousingConstructionDetails />}

      {series.slug === 'corporate-profit-share' && <section className="series-context" aria-labelledby="corporate-profit-structural-heading"><h4 id="corporate-profit-structural-heading">Long-run structural context</h4><p>The postwar history shows a long period in which the after-tax corporate-profit share fluctuated mostly within a lower range, followed by a sustained rise beginning in the 1990s and becoming especially pronounced after 2000. This indicates that a larger share of U.S. economic output is now recorded as after-tax corporate profit than was typical during much of the postwar era.</p><p><strong>Descriptive guide:</strong> long postwar lower-profit-share range → broad rise beginning in the 1990s → current elevated range. These labels describe the chart; they do not infer a causal break date.</p></section>}

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>
            {series.slug === 'unemployment-rate'
              ? 'The unemployment rate measures the current level of joblessness among people in the labor force. The compact historical classification and the separate 12-month movement describe level and direction without combining them into one score.'
              : series.slug === 'real-business-investment-growth'
              ? 'This measure shows whether private businesses are increasing or reducing inflation-adjusted spending on equipment, nonresidential structures, software, and research. These investments can support future production and productivity, but the measure records spending rather than the eventual results.'
              : series.slug === 'corporate-profit-share'
              ? 'This measure shows the share of total U.S. output recorded as adjusted after-tax corporate profit. It is useful for understanding the relative profitability of the corporate sector and long-run changes in how much of national output is recorded as corporate profit.'
              : presentation.whatThisTellsYou}
          </p>
        </section>
        {series.slug === 'real-business-investment-growth' && <section><h4>What this may suggest</h4><p>Rising investment can suggest that firms expect enough future demand to justify new or upgraded assets. Falling investment can suggest greater caution, weaker expected demand, tighter financing, or completion of earlier projects. These are plausible interpretations, not direct observations of confidence or intent.</p></section>}
        {series.slug === 'corporate-profit-share' && <section><h4>What this may suggest</h4><p>A persistently high profit share may be consistent with stronger markups, lower tax or interest burdens, globalization, technology and intangible capital, industry concentration, or productivity gains not fully matched by compensation growth. These are plausible explanations rather than conclusions established by the ratio alone.</p></section>}
        <section>
          <h4>What this leaves out</h4>
          <p>
            {series.slug === 'unemployment-rate'
              ? 'The labor force includes employed people and unemployed people who are available and have recently looked for work. People who want work but are not actively looking are not counted as unemployed. The rate does not measure job creation, layoffs, job quality, hours, pay, or differences across groups.'
              : series.slug === 'real-business-investment-growth'
              ? 'The aggregate does not show net investment after depreciation, the existing capital stock, profitability, financing costs, business confidence, or whether future output and productivity actually rise. It can also conceal different trends across structures, equipment, and intellectual-property products.'
              : series.slug === 'corporate-profit-share'
              ? 'The measure does not show individual-company margins, profit distribution across firms, labor’s full share of income, proprietors’ income, interest and rental income, shareholder payouts, stock valuations, or household welfare.'
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
            {series.slug === 'industrial-capacity-utilization' && <div><dt>Long-run average</dt><dd><a href={industrialCapacityBenchmarkUrl} target="_blank" rel="noreferrer">{industrialCapacityLongRunAverage.toFixed(1)}% ({industrialCapacityBenchmarkPeriod}, Federal Reserve G.17)</a>; values within ±0.5 percentage points are described as about usual.</dd></div>}
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
