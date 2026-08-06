import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandDefinition, HistoricalBandModel, HistoricalBandPosition, HistoricalBandResult } from './historicalBandContext'
import { classifyHistoricalBandPosition, deriveHistoricalBandContext } from './historicalBandContext'
import { formatPercentage, formatSignedPercentage, sortObservationsChronologically } from './economicSeries'

export type BudgetBalanceState = 'deficit' | 'surplus' | 'balanced' | 'unavailable'

export function classifyBudgetBalance(value: number | null): BudgetBalanceState {
  if (value === null) return 'unavailable'
  if (value < -0.2) return 'deficit'
  if (value > 0.2) return 'surplus'
  return 'balanced'
}

export function formatBudgetBalanceQuestion(state: BudgetBalanceState): string {
  if (state === 'deficit') return 'How large is the federal budget deficit relative to the economy?'
  if (state === 'surplus') return 'How large is the federal budget surplus relative to the economy?'
  if (state === 'balanced') return 'Is the federal budget approximately balanced?'
  return 'Is the federal budget balance available?'
}

export function formatBudgetBalanceStateLabel(state: BudgetBalanceState): string {
  if (state === 'deficit') return 'Deficit'
  if (state === 'surplus') return 'Surplus'
  if (state === 'balanced') return 'Approximately balanced'
  return 'Unavailable'
}

export function budgetBalanceMagnitude(
  value: number | null,
  state: BudgetBalanceState,
): number | null {
  if (value === null) return null
  if (state === 'deficit') return Math.max(0, -value)
  if (state === 'surplus') return Math.max(0, value)
  if (state === 'balanced') return Math.abs(value)
  return null
}

function isComparableBudgetBalance(value: number, state: BudgetBalanceState): boolean {
  if (state === 'deficit') return value < 0
  if (state === 'surplus') return value > 0
  return state === 'balanced'
}

export interface BudgetBalanceCompactContext {
  state: BudgetBalanceState
  observations: EconomicObservation[]
  model: HistoricalBandResult
}

export function deriveBudgetBalanceCompactContext(
  observations: readonly EconomicObservation[],
  definition: HistoricalBandDefinition,
): BudgetBalanceCompactContext {
  const sorted = sortObservationsChronologically(observations)
  const latest = [...sorted].reverse().find(({ value }) => value !== null)
  const state = classifyBudgetBalance(latest?.value ?? null)
  const transformed = sorted.map(({ date, value }) => ({
    date,
    value: budgetBalanceMagnitude(value, state),
  }))
  const displayModel = deriveHistoricalBandContext(transformed, definition)
  const comparisonModel = deriveHistoricalBandContext(
    sorted.map(({ date, value }) => ({
      date,
      value: value !== null && isComparableBudgetBalance(value, state)
        ? budgetBalanceMagnitude(value, state)
        : null,
    })),
    definition,
  )

  if (displayModel.status !== 'ready' || comparisonModel.status !== 'ready') {
    return { state, observations: transformed, model: comparisonModel }
  }
  return {
    state,
    observations: transformed,
    model: {
      ...displayModel,
      innerLower: comparisonModel.innerLower,
      innerUpper: comparisonModel.innerUpper,
      median: comparisonModel.median,
      outerLower: comparisonModel.outerLower,
      outerUpper: comparisonModel.outerUpper,
      validObservationCount: comparisonModel.validObservationCount,
    },
  }
}

export function formatBudgetBalanceAnswer(value: number | null): string {
  const state = classifyBudgetBalance(value)
  if (state === 'deficit') return `The federal government ran a deficit equal to ${Math.abs(value!).toFixed(1)}% of GDP.`
  if (state === 'surplus') return `The federal government ran a surplus equal to ${Math.abs(value!).toFixed(1)}% of GDP.`
  if (state === 'balanced') return 'Federal spending and revenue were approximately balanced relative to the size of the economy.'
  return 'The federal budget balance is unavailable.'
}

export function formatBudgetBalancePerHundred(value: number | null): string {
  const state = classifyBudgetBalance(value)
  const displayedMagnitude = value === null
    ? null
    : Math.abs(Number(value.toFixed(1))).toFixed(2)
  if (state === 'deficit') return `That is about $${displayedMagnitude} of borrowing for every $100 of economic output.`
  if (state === 'surplus') return `That is about $${displayedMagnitude} more in revenue than spending for every $100 of economic output.`
  if (state === 'balanced') return 'Revenue and spending were within about 20 cents of each other for every $100 of economic output.'
  return 'The amount per $100 of economic output is unavailable.'
}

export function formatBudgetBalanceHistoricalPosition(
  value: number | null,
  model: HistoricalBandModel | null,
): string {
  if (!model || value === null) return 'Historical comparison is unavailable.'
  const state = classifyBudgetBalance(value)
  const magnitude = budgetBalanceMagnitude(value, state)
  const position = classifyHistoricalBandPosition(magnitude, model)
  const scale: Record<Exclude<HistoricalBandPosition, 'unavailable'>, string> = {
    belowOuterBand: 'very small',
    betweenOuterAndInnerLow: 'small',
    insideInnerBand: 'typical',
    betweenInnerAndOuterHigh: 'large',
    aboveOuterBand: 'very large',
  }
  if (position === 'unavailable') return 'Historical comparison is unavailable.'
  if (state === 'deficit') return `The current deficit is ${scale[position]} relative to historical deficits.`
  if (state === 'surplus') return `The current surplus is ${scale[position]} relative to historical surpluses.`
  return position === 'belowOuterBand' || position === 'betweenOuterAndInnerLow'
    ? 'The current balance is close to zero by historical standards.'
    : `The current absolute balance gap is ${scale[position]} by historical standards.`
}

export function createBudgetBalanceAccessibleSummary(
  model: HistoricalBandModel,
  signedValue: number | null = model.latestObservation.value,
): string {
  const latest = model.latestObservation
  const state = classifyBudgetBalance(signedValue)
  return `${formatPercentage(latest.value)} in ${latest.date.slice(0, 4)}. ${formatBudgetBalanceAnswer(signedValue)} ${formatBudgetBalancePerHundred(signedValue)} ${formatBudgetBalanceHistoricalPosition(signedValue, model)} The compact chart covers ${model.recentObservations[0]?.date.slice(0, 4)} through ${latest.date.slice(0, 4)} and shows the positive ${state === 'balanced' ? 'absolute balance gap' : `${state} magnitude`}. The underlying signed value is ${formatSignedPercentage(signedValue)}; the expanded chart preserves signed balances.`
}
