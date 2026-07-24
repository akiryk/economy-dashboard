import type { EconomicObservation } from '../models/economicSeries'

export function finiteObservationIndexes(
  observations: readonly EconomicObservation[],
): number[] {
  return observations.flatMap(({ value }, index) =>
    value !== null && Number.isFinite(value) ? [index] : [])
}

export function nearestFiniteObservationIndex(
  observations: readonly EconomicObservation[],
  positionRatio: number,
): number | null {
  const indexes = finiteObservationIndexes(observations)
  if (!indexes.length) return null
  const target = Math.max(0, Math.min(1, positionRatio)) *
    Math.max(0, observations.length - 1)
  return indexes.reduce((nearest, index) =>
    Math.abs(index - target) < Math.abs(nearest - target) ? index : nearest)
}

export function adjacentFiniteObservationIndex(
  observations: readonly EconomicObservation[],
  activeIndex: number | null,
  direction: -1 | 1,
): number | null {
  const indexes = finiteObservationIndexes(observations)
  if (!indexes.length) return null
  if (activeIndex === null) return direction === -1 ? indexes.at(-1)! : indexes[0]!
  const position = indexes.indexOf(activeIndex)
  if (position < 0) return direction === -1 ? indexes.at(-1)! : indexes[0]!
  return indexes[Math.max(0, Math.min(indexes.length - 1, position + direction))]!
}
