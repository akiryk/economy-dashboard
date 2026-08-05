import type { HistoricalBandModel, HistoricalBandPosition } from './historicalBandContext'
import { classifyHistoricalBandPosition } from './historicalBandContext'
import { formatSignedPercentage } from './economicSeries'

export type BudgetBalanceState = 'deficit' | 'surplus' | 'balanced' | 'unavailable'

export function classifyBudgetBalance(value: number | null): BudgetBalanceState {
  if (value === null) return 'unavailable'
  if (value < -0.2) return 'deficit'
  if (value > 0.2) return 'surplus'
  return 'balanced'
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
  if (state === 'deficit') return `That is about $${Math.abs(value!).toFixed(2)} of borrowing for every $100 of economic output.`
  if (state === 'surplus') return `That is about $${Math.abs(value!).toFixed(2)} more in revenue than spending for every $100 of economic output.`
  if (state === 'balanced') return 'Revenue and spending were within about 20 cents of each other for every $100 of economic output.'
  return 'The amount per $100 of economic output is unavailable.'
}

const positionLabels: Record<Exclude<HistoricalBandPosition, 'unavailable'>, string> = {
  belowOuterBand: 'very large deficit',
  betweenOuterAndInnerLow: 'large deficit',
  insideInnerBand: 'typical balance',
  betweenInnerAndOuterHigh: 'large surplus',
  aboveOuterBand: 'very large surplus',
}

export function classifyBudgetBalanceHistory(
  value: number | null,
  model: Pick<HistoricalBandModel, 'outerLower' | 'innerLower' | 'innerUpper' | 'outerUpper'>,
): string {
  const position = classifyHistoricalBandPosition(value, model)
  return position === 'unavailable' ? 'unavailable' : positionLabels[position]
}

export function formatBudgetBalanceHistoricalPosition(
  value: number | null,
  model: HistoricalBandModel | null,
): string {
  if (!model || value === null) return 'Historical comparison is unavailable.'
  const classification = classifyBudgetBalanceHistory(value, model)
  const state = classifyBudgetBalance(value)
  const subject = state === 'deficit' ? 'deficit' : state === 'surplus' ? 'surplus' : 'balance'
  const scale = classification.replace(/ (deficit|surplus|balance)$/, '')
  return `The current ${subject} is ${scale} relative to the available postwar history.`
}

export function formatBudgetBalanceTooltipState(value: number | null): string {
  const state = classifyBudgetBalance(value)
  if (state === 'balanced') return 'Approximately balanced'
  if (state === 'unavailable') return 'Unavailable'
  return state.charAt(0).toUpperCase() + state.slice(1)
}

export function createBudgetBalanceAccessibleSummary(
  model: HistoricalBandModel,
): string {
  const latest = model.latestObservation
  return `${formatSignedPercentage(latest.value)} in ${latest.date.slice(0, 4)}. ${formatBudgetBalanceAnswer(latest.value)} ${formatBudgetBalancePerHundred(latest.value)} ${formatBudgetBalanceHistoricalPosition(latest.value, model)} The compact chart covers ${model.recentObservations[0]?.date.slice(0, 4)} through ${latest.date.slice(0, 4)}. Zero means federal revenue and spending were equal.`
}
