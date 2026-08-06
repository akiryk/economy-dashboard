import type { EconomicObservation } from '../models/economicSeries'
import type { HistoricalBandDefinition, HistoricalBandModel, HistoricalBandPosition, HistoricalBandResult } from './historicalBandContext'
import { classifyHistoricalBandPosition, deriveHistoricalBandContext } from './historicalBandContext'
import { formatObservationPeriod, formatPercentage, formatSignedPercentage, sortObservationsChronologically } from './economicSeries'

export type TradeBalanceState = 'deficit' | 'surplus' | 'balanced' | 'unavailable'

export function classifyTradeBalance(value: number | null): TradeBalanceState {
  if (value === null || !Number.isFinite(value)) return 'unavailable'
  if (value < -0.1) return 'deficit'
  if (value > 0.1) return 'surplus'
  return 'balanced'
}

export function formatTradeBalanceQuestion(state: TradeBalanceState): string {
  if (state === 'deficit') return 'How large is the U.S. trade deficit relative to the economy?'
  if (state === 'surplus') return 'How large is the U.S. trade surplus relative to the economy?'
  if (state === 'balanced') return 'Is U.S. trade approximately balanced?'
  return 'Is the U.S. trade balance available?'
}

export function formatTradeBalanceStateLabel(state: TradeBalanceState): string {
  if (state === 'deficit') return 'Trade deficit'
  if (state === 'surplus') return 'Trade surplus'
  if (state === 'balanced') return 'Approximately balanced'
  return 'Unavailable'
}

export function tradeBalanceMagnitude(value: number | null, state: TradeBalanceState): number | null {
  if (value === null) return null
  if (state === 'deficit') return Math.max(0, -value)
  if (state === 'surplus') return Math.max(0, value)
  if (state === 'balanced') return Math.abs(value)
  return null
}

function comparable(value: number, state: TradeBalanceState): boolean {
  return state === 'deficit' ? value < 0 : state === 'surplus' ? value > 0 : state === 'balanced'
}

export function deriveTradeBalanceCompactContext(
  observations: readonly EconomicObservation[], definition: HistoricalBandDefinition,
): { state: TradeBalanceState; observations: EconomicObservation[]; model: HistoricalBandResult } {
  const sorted = sortObservationsChronologically(observations)
  const latest = [...sorted].reverse().find(({ value }) => value !== null)
  const state = classifyTradeBalance(latest?.value ?? null)
  const transformed = sorted.map(({ date, value }) => ({ date, value: tradeBalanceMagnitude(value, state) }))
  const display = deriveHistoricalBandContext(transformed, definition)
  const comparison = deriveHistoricalBandContext(sorted.map(({ date, value }) => ({
    date, value: value !== null && comparable(value, state) ? tradeBalanceMagnitude(value, state) : null,
  })), definition)
  return display.status === 'ready' && comparison.status === 'ready'
    ? { state, observations: transformed, model: { ...display, innerLower: comparison.innerLower, innerUpper: comparison.innerUpper, median: comparison.median, outerLower: comparison.outerLower, outerUpper: comparison.outerUpper, validObservationCount: comparison.validObservationCount } }
    : { state, observations: transformed, model: comparison }
}

export function formatTradeBalanceAnswer(value: number | null): string {
  const state = classifyTradeBalance(value)
  if (state === 'deficit') return `The United States imported more goods and services than it exported by an amount equal to ${Math.abs(value!).toFixed(1)}% of GDP.`
  if (state === 'surplus') return `The United States exported more goods and services than it imported by an amount equal to ${Math.abs(value!).toFixed(1)}% of GDP.`
  if (state === 'balanced') return 'U.S. exports and imports of goods and services were approximately balanced relative to the size of the economy.'
  return 'The U.S. trade balance is unavailable.'
}

export function formatTradeBalancePerHundred(value: number | null): string {
  const state = classifyTradeBalance(value)
  const amount = value === null ? null : Math.abs(Number(value.toFixed(1))).toFixed(2)
  if (state === 'deficit') return `That is about $${amount} more in imports than exports for every $100 of economic output.`
  if (state === 'surplus') return `That is about $${amount} more in exports than imports for every $100 of economic output.`
  if (state === 'balanced') return 'Exports and imports were within about 10 cents of each other for every $100 of economic output.'
  return 'The amount per $100 of economic output is unavailable.'
}

export function formatTradeBalanceHistoricalPosition(value: number | null, model: HistoricalBandModel | null): string {
  if (!model || value === null) return 'Historical comparison is unavailable.'
  const state = classifyTradeBalance(value)
  const position = classifyHistoricalBandPosition(tradeBalanceMagnitude(value, state), model)
  const scale: Record<Exclude<HistoricalBandPosition, 'unavailable'>, string> = { belowOuterBand: 'very small', betweenOuterAndInnerLow: 'small', insideInnerBand: 'typical', betweenInnerAndOuterHigh: 'large', aboveOuterBand: 'very large' }
  if (position === 'unavailable') return 'Historical comparison is unavailable.'
  const subject = state === 'deficit' ? 'trade deficit' : state === 'surplus' ? 'trade surplus' : 'absolute trade-balance gap'
  const history = state === 'deficit' ? 'historical U.S. trade deficits' : state === 'surplus' ? 'historical U.S. trade surpluses' : 'U.S. trade history'
  return `The current ${subject} is ${scale[position]} relative to ${history}.`
}

export function formatTradeBalanceDirection(observations: readonly EconomicObservation[]): string {
  const finite = sortObservationsChronologically(observations).filter((item): item is EconomicObservation & { value: number } => item.value !== null)
  const latest = finite.at(-1)
  if (!latest) return 'The five-year change is unavailable.'
  const priorDate = `${Number(latest.date.slice(0, 4)) - 5}${latest.date.slice(4)}`
  const prior = finite.find(({ date }) => date === priorDate)
  if (!prior) return 'The five-year change is unavailable.'
  const latestState = classifyTradeBalance(latest.value)
  const priorState = classifyTradeBalance(prior.value)
  if (latestState !== priorState && priorState !== 'balanced' && latestState !== 'balanced') return `The balance moved from ${priorState} to ${latestState} over the past five years.`
  if (latestState === 'balanced') return 'The trade balance is approximately balanced after five years.'
  const change = Math.abs(latest.value) - Math.abs(prior.value)
  if (Math.abs(change) < 0.2) return `The trade ${latestState} is little changed from five years ago.`
  return `The trade ${latestState} has ${change > 0 ? 'widened' : 'narrowed'} by ${Math.abs(change).toFixed(1)} percentage points over the past five years.`
}

export function createTradeBalanceAccessibleSummary(model: HistoricalBandModel, signedValue: number | null, direction: string): string {
  const state = classifyTradeBalance(signedValue)
  return `${formatPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}. ${formatTradeBalanceAnswer(signedValue)} ${formatTradeBalancePerHundred(signedValue)} ${formatTradeBalanceHistoricalPosition(signedValue, model)} ${direction} The compact chart shows the positive ${state === 'balanced' ? 'absolute balance gap' : `${state} magnitude`}; the underlying value is ${formatSignedPercentage(signedValue)} and the expanded chart preserves signed balances.`
}
