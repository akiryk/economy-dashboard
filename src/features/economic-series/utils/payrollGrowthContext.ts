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

export type PayrollHistoricalState =
  | 'very-weak'
  | 'weak'
  | 'typical'
  | 'strong'
  | 'very-strong'
  | 'unavailable'

export interface PayrollGrowthContextModel {
  latestObservation: (EconomicObservation & { value: number }) | null
  historicalBands: HistoricalBandResult
  historicalState: PayrollHistoricalState
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

export function formatPayrollGrowthAnswer(
  value: number | null,
  historicalState: PayrollHistoricalState,
): string {
  if (value === null || !Number.isFinite(value)) {
    return 'The latest three-month average is unavailable.'
  }
  if (value === 0) {
    return 'Payroll employment is essentially unchanged.'
  }
  if (value < 0) {
    const statements: Record<PayrollHistoricalState, string> = {
      'very-weak':
        'No. Employers are cutting jobs, an unusually weak result by historical standards.',
      weak:
        'No. Employers are cutting jobs, a weak result by historical standards.',
      typical:
        'No. Employers are cutting jobs. The decline falls within the typical historical range, but it remains a net job loss.',
      strong:
        'No. Employers are cutting jobs. Despite ranking above much of the historical distribution, it remains a net job loss.',
      'very-strong':
        'No. Employers are cutting jobs. Despite ranking near the top of the historical distribution, it remains a net job loss.',
      unavailable:
        'No. Employers are cutting jobs. Historical context is unavailable.',
    }
    return statements[historicalState]
  }
  const context: Record<PayrollHistoricalState, string> = {
    'very-weak': ', but the pace is very weak by historical standards.',
    weak: ', but the pace is somewhat weak by historical standards.',
    typical: 'at a typical pace by historical standards.',
    strong: 'at a strong pace by historical standards.',
    'very-strong': 'at a very strong pace by historical standards.',
    unavailable: ', but historical context is unavailable.',
  }
  const separator = context[historicalState].startsWith(',') ? '' : ' '
  return `Yes. Employers are adding jobs${separator}${context[historicalState]}`
}

export function derivePayrollGrowthContext(
  observations: readonly EconomicObservation[],
): PayrollGrowthContextModel {
  const sorted = sortObservationsChronologically(observations)
  const latest = sorted.at(-1)
  const latestObservation = finiteObservation(latest) ? latest : null
  const historicalBands = deriveHistoricalBandContext(
    sorted,
    payrollGrowthHistoricalBandDefinition,
  )
  const historicalState = classifyPayrollHistoricalState(historicalBands)
  return {
    latestObservation,
    historicalBands,
    historicalState,
    answer: formatPayrollGrowthAnswer(
      latestObservation?.value ?? null,
      historicalState,
    ),
  }
}

export function createPayrollGrowthAccessibleSummary(
  model: PayrollGrowthContextModel,
): string {
  if (!model.latestObservation) {
    return 'The latest three-month average of monthly payroll change is unavailable.'
  }
  const bands = model.historicalBands.status === 'ready'
    ? `The latest five-year line runs from ` +
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
  return `The latest three-month average was ` +
    `${formatSignedThousands(model.latestObservation.value)} in ` +
    `${formatObservationPeriod(model.latestObservation.date, 'monthly')}, ` +
    `or ${formatJobChangeProse(model.latestObservation.value)} per month on average. ` +
    `${model.answer} ${bands}Zero separates net payroll growth from net ` +
    `payroll decline. The line and historical bands use only complete ` +
    `three-month-average observations. Payroll estimates are revised as ` +
    `additional information becomes available.`
}
