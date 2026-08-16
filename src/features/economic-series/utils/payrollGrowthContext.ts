import type { EconomicObservation } from '../models/economicSeries'
import {
  formatJobChangeProse,
  formatObservationPeriod,
  formatSignedThousands,
  sortObservationsChronologically,
} from './economicSeries'
import {
  classifyHistoricalBandPosition,
  deriveHistoricalBandContext,
  type HistoricalBandDefinition,
  type HistoricalBandResult,
} from './historicalBandContext'
import {
  shiftPayrollMonth,
  threeMonthAverageEnding,
} from './payrollCalculations'

export type PayrollHistoricalState =
  | 'very-weak'
  | 'weak'
  | 'typical'
  | 'strong'
  | 'very-strong'
  | 'unavailable'

export type PayrollTrendState =
  | 'contracting'
  | 'nearly-stalled'
  | 'growing'
  | 'growing-strongly'
  | 'unavailable'

export type PayrollLatestMonthState =
  | 'negative'
  | 'near-zero'
  | 'positive'
  | 'unavailable'

export type PayrollDirectionState =
  | 'slowing'
  | 'stable'
  | 'accelerating'
  | 'unavailable'

export type PayrollMentionReason = 'sign-divergence' | null

export interface PayrollGrowthContextModel {
  latestObservation: (EconomicObservation & { value: number }) | null
  latestMonthObservation: (EconomicObservation & { value: number }) | null
  priorNonOverlappingAverage: number | null
  historicalBands: HistoricalBandResult
  historicalState: PayrollHistoricalState
  trendState: PayrollTrendState
  latestMonthState: PayrollLatestMonthState
  directionState: PayrollDirectionState
  mentionLatestMonth: boolean
  mentionReason: PayrollMentionReason
  answer: string
}

export const payrollGrowthHistoricalBandDefinition:
HistoricalBandDefinition = {
  recentObservationCount: 61,
  comparisonWindow: { kind: 'trailing-years', years: 25 },
  innerPercentiles: [25, 75],
  outerPercentiles: [10, 90],
  minimumFiniteObservations: 60,
  latestObservationPolicy: 'last-observation',
}

function finiteObservation(
  observation: EconomicObservation | undefined,
): observation is EconomicObservation & { value: number } {
  return observation?.value !== null &&
    observation?.value !== undefined &&
    Number.isFinite(observation.value)
}

export function classifyPayrollHistoricalState(
  historicalBands: HistoricalBandResult,
): PayrollHistoricalState {
  if (historicalBands.status !== 'ready') return 'unavailable'
  const position = classifyHistoricalBandPosition(
    historicalBands.latestObservation.value,
    historicalBands,
  )
  const states = {
    belowOuterBand: 'very-weak',
    betweenOuterAndInnerLow: 'weak',
    insideInnerBand: 'typical',
    betweenInnerAndOuterHigh: 'strong',
    aboveOuterBand: 'very-strong',
    unavailable: 'unavailable',
  } as const
  return states[position]
}

export function classifyPayrollTrend(
  value: number | null,
  historicalState: PayrollHistoricalState,
): PayrollTrendState {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value < -50) return 'contracting'
  if (value <= 50) return 'nearly-stalled'
  return historicalState === 'strong' || historicalState === 'very-strong'
    ? 'growing-strongly'
    : 'growing'
}

export function classifyLatestPayrollMonth(
  value: number | null,
): PayrollLatestMonthState {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value < 0) return 'negative'
  if (value > 0) return 'positive'
  return 'near-zero'
}

export function classifyPayrollDirection(
  latestAverage: number | null,
  priorAverage: number | null,
): PayrollDirectionState {
  if (latestAverage === null || priorAverage === null ||
    !Number.isFinite(latestAverage) || !Number.isFinite(priorAverage)) {
    return 'unavailable'
  }
  const difference = latestAverage - priorAverage
  if (difference <= -50) return 'slowing'
  if (difference >= 50) return 'accelerating'
  return 'stable'
}

export function shouldMentionLatestPayrollMonth(
  trendValue: number | null,
  latestMonthValue: number | null,
): boolean {
  if (trendValue === null || latestMonthValue === null ||
    !Number.isFinite(trendValue) || !Number.isFinite(latestMonthValue)) {
    return false
  }
  return (trendValue > 0 && latestMonthValue < 0) ||
    (trendValue < 0 && latestMonthValue > 0)
}

function formatSignedJobs(valueInThousands: number): string {
  const jobs = Math.round(valueInThousands * 1_000)
  if (jobs > 0) return `+${jobs.toLocaleString('en-US')}`
  if (jobs < 0) return `−${Math.abs(jobs).toLocaleString('en-US')}`
  return '0'
}

function formatPayrollMonth(date: string): string {
  return formatObservationPeriod(date, 'monthly').split(' ')[0]!
}

function latestMonthDivergenceSentence(
  latestMonth: EconomicObservation & { value: number },
  average: number,
): string {
  const action = latestMonth.value < 0 ? 'fell' : 'rose'
  return `Payrolls ${action} by ${Math.abs(Math.round(latestMonth.value * 1_000)).toLocaleString('en-US')} in ${formatPayrollMonth(latestMonth.date)}, while the latest three-month average is ${formatSignedJobs(average)} jobs per month.`
}

export function formatPayrollGrowthAnswer(
  model: Pick<
    PayrollGrowthContextModel,
    | 'latestObservation'
    | 'latestMonthObservation'
    | 'historicalState'
    | 'trendState'
    | 'mentionLatestMonth'
  >,
): string {
  const latest = model.latestObservation
  if (!latest) return 'The latest three-month average is unavailable.'

  const average = formatSignedJobs(latest.value)
  let answer: string
  if (model.trendState === 'nearly-stalled') {
    answer = model.mentionLatestMonth && model.latestMonthObservation
      ? `Job growth has nearly stalled. ${latestMonthDivergenceSentence(model.latestMonthObservation, latest.value)}`
      : `Job growth has nearly stalled, averaging ${average} jobs per month over the latest three months.`
  } else if (model.trendState === 'contracting') {
    answer = `Payroll employment is declining, with employers losing an average of ${Math.abs(Math.round(latest.value * 1_000)).toLocaleString('en-US')} jobs per month over the latest three months.`
  } else {
    const pace = model.historicalState === 'very-strong'
      ? 'a very strong pace'
      : model.trendState === 'growing-strongly'
        ? 'a strong pace'
        : model.historicalState === 'weak' || model.historicalState === 'very-weak'
          ? 'a weak pace by historical standards'
          : 'a solid pace'
    answer = `Employers are adding jobs at ${pace}, averaging ${Math.abs(Math.round(latest.value * 1_000)).toLocaleString('en-US')} per month over the latest three months.`
  }

  if (model.mentionLatestMonth && model.latestMonthObservation &&
    model.trendState !== 'nearly-stalled') {
    answer += ` ${latestMonthDivergenceSentence(model.latestMonthObservation, latest.value)}`
  }
  return answer
}

export function derivePayrollGrowthContext(
  observations: readonly EconomicObservation[],
  monthlyChanges: readonly EconomicObservation[] = [],
): PayrollGrowthContextModel {
  const sorted = sortObservationsChronologically(observations)
  const latest = sorted.at(-1)
  const latestObservation = finiteObservation(latest) ? latest : null
  const historicalBands = deriveHistoricalBandContext(
    sorted,
    payrollGrowthHistoricalBandDefinition,
  )
  const historicalState = classifyPayrollHistoricalState(historicalBands)
  const alignedMonth = latestObservation
    ? monthlyChanges.find(({ date }) => date === latestObservation.date)
    : undefined
  const latestMonthObservation = finiteObservation(alignedMonth)
    ? alignedMonth
    : null
  const latestMonthState = classifyLatestPayrollMonth(
    latestMonthObservation?.value ?? null,
  )
  const priorNonOverlappingAverage = latestObservation
    ? threeMonthAverageEnding(
        monthlyChanges,
        shiftPayrollMonth(latestObservation.date, -3),
      )
    : null
  const trendState = classifyPayrollTrend(
    latestObservation?.value ?? null,
    historicalState,
  )
  const mentionLatestMonth = shouldMentionLatestPayrollMonth(
    latestObservation?.value ?? null,
    latestMonthObservation?.value ?? null,
  )
  const mentionReason: PayrollMentionReason = mentionLatestMonth
    ? 'sign-divergence'
    : null
  const model = {
    latestObservation,
    latestMonthObservation,
    priorNonOverlappingAverage,
    historicalBands,
    historicalState,
    trendState,
    latestMonthState,
    directionState: classifyPayrollDirection(
      latestObservation?.value ?? null,
      priorNonOverlappingAverage,
    ),
    mentionLatestMonth,
    mentionReason,
  }
  return {
    ...model,
    answer: formatPayrollGrowthAnswer(model),
  }
}

export function createPayrollGrowthAccessibleSummary(
  model: PayrollGrowthContextModel,
): string {
  if (!model.latestObservation) {
    return 'The latest three-month average of monthly payroll change is unavailable.'
  }
  const bands = model.historicalBands.status === 'ready'
    ? `The historical pace is classified as ${model.historicalState}. The latest five-year line runs from ` +
      `${formatObservationPeriod(model.historicalBands.recentObservations[0]!.date, 'monthly')} ` +
      `through ${formatObservationPeriod(model.historicalBands.latestObservation.date, 'monthly')}. ` +
      `The trailing comparison runs from ` +
      `${formatObservationPeriod(model.historicalBands.comparisonStart, 'monthly')} ` +
      `through ${formatObservationPeriod(model.historicalBands.comparisonEnd, 'monthly')}. ` +
      `The middle 50% ranges from ` +
      `${formatSignedThousands(model.historicalBands.innerLower)} to ` +
      `${formatSignedThousands(model.historicalBands.innerUpper)}, and the middle 80% ` +
      `ranges from ${formatSignedThousands(model.historicalBands.outerLower)} to ` +
      `${formatSignedThousands(model.historicalBands.outerUpper)}. `
    : 'Historical percentile ranges are unavailable. '
  const direction = model.directionState === 'unavailable'
    ? ''
    : `Compared with the preceding non-overlapping three months, the trend is ${model.directionState}. `
  return `The latest three-month average was ` +
    `${formatSignedThousands(model.latestObservation.value)} in ` +
    `${formatObservationPeriod(model.latestObservation.date, 'monthly')}, ` +
    `or ${formatJobChangeProse(model.latestObservation.value)} per month on average. ` +
    `${model.answer} Broad trend state: ${model.trendState}. ${direction}${bands}` +
    `Zero separates net payroll growth from net payroll decline. The line and ` +
    `historical bands use only complete three-month-average observations. ` +
    `Payroll estimates are revised as additional information becomes available.`
}
