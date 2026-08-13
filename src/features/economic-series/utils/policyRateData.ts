import type { EconomicObservation } from '../models/economicSeries'

export interface PolicyRateObservation {
  date: string
  lower: number | null
  upper: number | null
  midpoint: number | null
  regime: 'single-target' | 'target-range'
}

export type PolicyMove =
  | { direction: 'raised' | 'lowered' | 'unchanged'; lowerChange: number; upperChange: number }
  | { direction: 'asymmetric'; lowerChange: number; upperChange: number }

export function alignTargetRange(
  lower: readonly EconomicObservation[],
  upper: readonly EconomicObservation[],
): PolicyRateObservation[] {
  const upperByDate = new Map(upper.map((item) => [item.date, item.value]))
  return lower.flatMap((item) => {
    if (!upperByDate.has(item.date)) return []
    const upperValue = upperByDate.get(item.date) ?? null
    if (item.value !== null && upperValue !== null && item.value > upperValue) {
      throw new Error(`Federal funds target lower bound exceeds upper bound on ${item.date}`)
    }
    return [{
      date: item.date,
      lower: item.value,
      upper: upperValue,
      midpoint: item.value === null || upperValue === null ? null : (item.value + upperValue) / 2,
      regime: 'target-range' as const,
    }]
  })
}

export function buildPolicyHistory(
  historicalTarget: readonly EconomicObservation[],
  range: readonly PolicyRateObservation[],
): PolicyRateObservation[] {
  const single = historicalTarget.map(({ date, value }) => ({
    date, lower: value, upper: value, midpoint: value, regime: 'single-target' as const,
  }))
  return [...single, ...range].sort((a, b) => a.date.localeCompare(b.date))
}

export function policyChangePoints(observations: readonly PolicyRateObservation[]): PolicyRateObservation[] {
  return observations.filter((item, index) => {
    if (index === 0) return true
    const prior = observations[index - 1]!
    return item.lower !== prior.lower || item.upper !== prior.upper || item.regime !== prior.regime
  })
}

export function classifyPolicyMove(
  current: Pick<PolicyRateObservation, 'lower' | 'upper'>,
  previous: Pick<PolicyRateObservation, 'lower' | 'upper'>,
): PolicyMove | null {
  if (current.lower === null || current.upper === null || previous.lower === null || previous.upper === null) return null
  const lowerChange = current.lower - previous.lower
  const upperChange = current.upper - previous.upper
  if (lowerChange === 0 && upperChange === 0) return { direction: 'unchanged', lowerChange, upperChange }
  if (lowerChange === upperChange) return { direction: lowerChange > 0 ? 'raised' : 'lowered', lowerChange, upperChange }
  return { direction: 'asymmetric', lowerChange, upperChange }
}

export function formatTargetRange(item: Pick<PolicyRateObservation, 'lower' | 'upper'>): string {
  return item.lower === null || item.upper === null ? 'Unavailable' : `${item.lower.toFixed(2)}%–${item.upper.toFixed(2)}%`
}

export function formatPolicyMove(move: PolicyMove | null): string {
  if (!move) return 'The most recent policy change is unavailable.'
  if (move.direction === 'unchanged') return 'The target range was unchanged from the preceding observation.'
  if (move.direction === 'asymmetric') return `The bounds changed asymmetrically: lower ${move.lowerChange >= 0 ? '+' : ''}${move.lowerChange.toFixed(2)} and upper ${move.upperChange >= 0 ? '+' : ''}${move.upperChange.toFixed(2)} percentage points.`
  return `The Fed most recently ${move.direction} its target range by ${Math.abs(move.lowerChange).toFixed(2)} percentage points.`
}
