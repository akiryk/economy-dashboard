import type {
  AvailableJobGrowthBreakevenObservation,
  JobGrowthBreakevenDataset,
  JobGrowthBreakevenObservation,
} from '../models/jobGrowthBreakeven'
import type { EconomicObservation } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatSignedPercentagePoints,
  formatSignedThousands,
} from './economicSeries'
import {
  deriveHistoricalBandContext,
  type HistoricalBandDefinition,
  type HistoricalBandResult,
} from './historicalBandContext'

export const jobGrowthBreakevenNeutralThreshold = 0.05

export type JobGrowthBreakevenAnswerState =
  | 'above'
  | 'about-even'
  | 'below'
  | 'unavailable'

export const jobGrowthBreakevenBandDefinition:
HistoricalBandDefinition = {
  recentObservationCount: 21,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75],
  outerPercentiles: [10, 90],
  minimumFiniteObservations: 80,
  latestObservationPolicy: 'latest-finite',
}

export interface JobGrowthBreakevenContext {
  latest: AvailableJobGrowthBreakevenObservation | null
  state: JobGrowthBreakevenAnswerState
  answer: string
  heroLabel: string
  gapObservations: EconomicObservation[]
  historicalBands: HistoricalBandResult
}

export function classifyJobGrowthBreakevenGap(
  gap: number | null,
): JobGrowthBreakevenAnswerState {
  if (gap === null || !Number.isFinite(gap)) return 'unavailable'
  if (Math.abs(gap) < jobGrowthBreakevenNeutralThreshold) return 'about-even'
  return gap > 0 ? 'above' : 'below'
}

export function formatJobGrowthBreakevenAnswer(
  state: JobGrowthBreakevenAnswerState,
): string {
  if (state === 'above') {
    return 'Yes — job growth is exceeding the estimated pace needed to keep unemployment stable.'
  }
  if (state === 'below') {
    return 'No — job growth is below the estimated pace needed to keep unemployment stable.'
  }
  if (state === 'about-even') {
    return 'About even — job growth is roughly matching the estimated pace needed to keep unemployment stable.'
  }
  return 'The latest comparison is unavailable.'
}

export function formatJobGrowthBreakevenHeroLabel(
  state: JobGrowthBreakevenAnswerState,
): string {
  if (state === 'above') {
    return 'Payroll growth above the estimated breakeven pace'
  }
  if (state === 'below') {
    return 'Payroll growth below the estimated breakeven pace'
  }
  if (state === 'about-even') {
    return 'Payroll growth roughly at the estimated breakeven pace'
  }
  return 'Payroll growth relative to the estimated breakeven pace'
}

export function formatSignedPp(value: number | null): string {
  return `${formatSignedPercentagePoints(value)} pp`
}

export function formatBreakevenRate(value: number | null): string {
  if (value === null) return 'Not available'
  return `${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`
}

export function deriveJobGrowthBreakevenContext(
  dataset: JobGrowthBreakevenDataset,
  definition: HistoricalBandDefinition = jobGrowthBreakevenBandDefinition,
): JobGrowthBreakevenContext {
  const available = dataset.observations.filter(
    (item): item is AvailableJobGrowthBreakevenObservation =>
      item.status === 'available',
  )
  const latest = available.at(-1) ?? null
  const gapObservations = dataset.observations.map((item) => ({
    date: item.date,
    value: item.status === 'available' ? item.gapPercentagePoints : null,
  }))
  const state = classifyJobGrowthBreakevenGap(
    latest?.gapPercentagePoints ?? null,
  )
  return {
    latest,
    state,
    answer: formatJobGrowthBreakevenAnswer(state),
    heroLabel: formatJobGrowthBreakevenHeroLabel(state),
    gapObservations,
    historicalBands: deriveHistoricalBandContext(gapObservations, definition),
  }
}

export function findJobGrowthBreakevenObservation(
  observations: readonly JobGrowthBreakevenObservation[],
  date: string,
): JobGrowthBreakevenObservation | null {
  return observations.find((item) => item.date === date) ?? null
}

export function formatJobGrowthBreakevenDetail(
  observation: AvailableJobGrowthBreakevenObservation,
): string {
  return [
    formatObservationPeriod(observation.date, 'quarterly'),
    `Gap: ${formatSignedPp(observation.gapPercentagePoints)}`,
    `Actual payroll growth: ${formatBreakevenRate(observation.actualAnnualizedPayrollGrowthRate)} annualized`,
    `Estimated breakeven growth: ${formatBreakevenRate(observation.estimatedAnnualizedBreakevenGrowthRate)} annualized`,
    `Actual job growth: ${formatSignedThousands(observation.actualAverageMonthlyJobGrowth)} per month`,
    `Estimated breakeven: ${formatSignedThousands(observation.estimatedBreakevenMonthlyJobGrowth)} per month`,
    `Difference: ${formatSignedThousands(observation.monthlyJobGrowthDifference)} per month`,
  ].join(' ')
}

export function createJobGrowthBreakevenAccessibleSummary(
  context: JobGrowthBreakevenContext,
): string {
  const { latest, historicalBands } = context
  if (!latest) return 'The job-growth-versus-breakeven comparison is unavailable.'
  const range = historicalBands.status === 'ready'
    ? `The five-year line runs from ` +
      `${formatObservationPeriod(historicalBands.recentObservations[0]!.date, 'quarterly')} ` +
      `through ${formatObservationPeriod(latest.date, 'quarterly')}. ` +
      `The trailing 25-year middle 50% ranges from ` +
      `${formatSignedPp(historicalBands.innerLower)} to ` +
      `${formatSignedPp(historicalBands.innerUpper)}, and the middle 80% ` +
      `ranges from ${formatSignedPp(historicalBands.outerLower)} to ` +
      `${formatSignedPp(historicalBands.outerUpper)}. `
    : 'Historical bands are unavailable because there is insufficient comparable history. '
  return `${context.answer} ${formatJobGrowthBreakevenDetail(latest)}. ` +
    `${range}Zero means actual payroll growth matched the estimated breakeven ` +
    `pace. The breakeven baseline is modeled, and the latest source value is ` +
    `${latest.estimateStatus === 'projection' ? 'a source projection' : 'a historical estimate'}.`
}
