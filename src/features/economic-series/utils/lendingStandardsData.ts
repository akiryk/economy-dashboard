import type { EconomicObservation } from '../models/economicSeries'

export function formatLendingStandardsCallout(value: number | null): string {
  if (value === null) return 'Not available'
  if (value === 0) return 'No net tightening or easing'
  const magnitude = `${Math.abs(value).toFixed(1)}%`
  return value > 0
    ? `${magnitude} net tightening`
    : `${magnitude} net easing`
}

export function describeLendingStandardsChange(
  previous: number | null,
  latest: number | null,
): string {
  if (previous === null || latest === null) return 'The quarterly change is unavailable.'
  if (latest === previous) return 'The net percentage was unchanged from the previous quarter.'
  if (previous >= 0 && latest < 0) return 'Standards crossed from net tightening to net easing.'
  if (previous <= 0 && latest > 0) return 'Standards crossed from net easing to net tightening.'
  if (latest > previous) {
    return latest > 0
      ? 'The net percentage indicated more tightening than in the previous quarter.'
      : 'The net percentage indicated less easing than in the previous quarter.'
  }
  return latest >= 0
    ? 'The net percentage indicated less tightening than in the previous quarter.'
    : 'The net percentage indicated more easing than in the previous quarter.'
}

export function lendingStandardsCounts(observations: readonly EconomicObservation[]) {
  return observations.reduce(
    (counts, observation) => {
      if (observation.value === null) return counts
      if (observation.value > 0) counts.above += 1
      if (observation.value < 0) counts.below += 1
      if (observation.value === 0) counts.zero += 1
      return counts
    },
    { above: 0, below: 0, zero: 0 },
  )
}

export function medianLendingStandards(
  observations: readonly EconomicObservation[],
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
