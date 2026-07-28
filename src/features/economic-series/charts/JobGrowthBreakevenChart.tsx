import { useMemo } from 'react'
import type { JobGrowthBreakevenDataset } from '../models/jobGrowthBreakeven'
import {
  createJobGrowthBreakevenAccessibleSummary,
  deriveJobGrowthBreakevenContext,
  findJobGrowthBreakevenObservation,
  formatBreakevenRate,
  formatSignedPp,
  jobGrowthBreakevenBandDefinition,
} from '../utils/jobGrowthBreakevenContext'
import { classifyHistoricalBandPosition } from '../utils/historicalBandContext'
import {
  formatObservationPeriod,
  formatSignedThousands,
} from '../utils/economicSeries'
import { HistoricalBandChart } from './HistoricalBandChart'

interface JobGrowthBreakevenChartProps {
  dataset: JobGrowthBreakevenDataset
  recentObservationCount?: number
  visuallyHideSummary?: boolean
}

function describePosition(
  value: number | null,
  context: ReturnType<typeof deriveJobGrowthBreakevenContext>,
): string | null {
  if (context.historicalBands.status !== 'ready') return null
  const position = classifyHistoricalBandPosition(
    value,
    context.historicalBands,
  )
  const descriptions = {
    belowOuterBand: 'below the historical middle 80%',
    betweenOuterAndInnerLow: 'between the historical 10th and 25th percentiles',
    insideInnerBand: 'within the historical middle 50%',
    betweenInnerAndOuterHigh: 'between the historical 75th and 90th percentiles',
    aboveOuterBand: 'above the historical middle 80%',
    unavailable: 'unavailable',
  } as const
  return descriptions[position]
}

export function JobGrowthBreakevenChart({
  dataset,
  recentObservationCount = 21,
  visuallyHideSummary = false,
}: JobGrowthBreakevenChartProps) {
  const context = useMemo(
    () => deriveJobGrowthBreakevenContext(dataset, {
      ...jobGrowthBreakevenBandDefinition,
      recentObservationCount,
    }),
    [dataset, recentObservationCount],
  )
  const model = context.historicalBands
  const accessibleSummary = createJobGrowthBreakevenAccessibleSummary(context)
  const first = model.recentObservations[0]
  const caption = model.status === 'ready' && first
    ? `Actual minus estimated breakeven growth · ` +
      `${formatObservationPeriod(first.date, 'quarterly')}–` +
      `${formatObservationPeriod(model.latestObservation.date, 'quarterly')}`
    : 'Actual minus estimated breakeven growth'

  return (
    <HistoricalBandChart
      model={model}
      seriesLabel="Payroll growth gap"
      frequency="quarterly"
      valueFormatter={formatSignedPp}
      accessibleSummary={accessibleSummary}
      latestPositionDescription={model.status === 'ready'
        ? describePosition(model.latestObservation.value, context)
        : null}
      helpText={{
        heading: 'Actual payroll growth and estimated breakeven growth',
        description:
          'Payroll growth is the change in total nonfarm payroll employment. This comparison uses the latest three-month pace to reduce month-to-month noise. Breakeven job growth is a modeled estimate of the pace needed to absorb changes in the labor force while keeping unemployment approximately stable; it is not directly observed. It may change when population, immigration, labor-force participation, unemployment assumptions, or source methodology change. A percentage point is the difference between two percentage rates: 0.9% − 0.1% = 0.8 percentage points. Above zero means actual growth exceeded the estimate; below zero means it fell short; farther from zero means a larger estimated surplus or shortfall relative to the payroll-employment base. Zero means actual growth matched the estimated breakeven pace. The bands show historical frequency, not a target or forecast.',
      }}
      caption={caption}
      showZeroLine
      zeroLineLabel="Zero = payroll growth matched the estimated breakeven pace"
      showLatestMarker
      interactiveDetails
      interactionDetails={(gapObservation) => {
        const observation = findJobGrowthBreakevenObservation(
          dataset.observations,
          gapObservation.date,
        )
        if (!observation || observation.status !== 'available') return null
        return (
          <>
            <strong>{formatObservationPeriod(observation.date, 'quarterly')}</strong>
            <span>Gap: {formatSignedPp(observation.gapPercentagePoints)}</span>
            <span>
              Actual payroll growth:{' '}
              {formatBreakevenRate(observation.actualAnnualizedPayrollGrowthRate)} annualized
            </span>
            <span>
              Estimated breakeven growth:{' '}
              {formatBreakevenRate(observation.estimatedAnnualizedBreakevenGrowthRate)} annualized
            </span>
            <span>
              Actual job growth:{' '}
              {formatSignedThousands(observation.actualAverageMonthlyJobGrowth)} per month
            </span>
            <span>
              Estimated breakeven:{' '}
              {formatSignedThousands(observation.estimatedBreakevenMonthlyJobGrowth)} per month
            </span>
            <span>
              Difference:{' '}
              {formatSignedThousands(observation.monthlyJobGrowthDifference)} per month
            </span>
          </>
        )
      }}
      visuallyHideSummary={visuallyHideSummary}
    />
  )
}
