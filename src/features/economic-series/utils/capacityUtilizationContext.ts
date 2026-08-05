import { formatSignedPercentagePoints } from './economicSeries'

export const industrialCapacityLongRunAverage = 79.4
export const industrialCapacityNeutralTolerance = 0.5
export const industrialCapacityBenchmarkPeriod = '1972–2025'
export const industrialCapacityBenchmarkUrl = 'https://www.federalreserve.gov/releases/g17/current/table0.htm'

export type CapacityUtilizationState = 'below' | 'usual' | 'above' | 'unavailable'

export function classifyCapacityUtilization(value: number | null): CapacityUtilizationState {
  if (value === null) return 'unavailable'
  const difference = value - industrialCapacityLongRunAverage
  if (difference < -industrialCapacityNeutralTolerance) return 'below'
  if (difference > industrialCapacityNeutralTolerance) return 'above'
  return 'usual'
}

export function formatCapacityUtilizationAnswer(value: number | null): string {
  const state = classifyCapacityUtilization(value)
  if (state === 'below') return 'Factories, mines, and utilities are using less of their estimated sustainable capacity than usual, leaving more spare capacity than normal.'
  if (state === 'above') return 'Factories, mines, and utilities are using more of their estimated sustainable capacity than usual, leaving less spare capacity than normal.'
  if (state === 'usual') return 'Factories, mines, and utilities are using about their usual share of estimated sustainable capacity.'
  return 'The latest comparison with usual industrial capacity use is unavailable.'
}

export function formatCapacityUtilizationComparison(value: number | null): string {
  if (value === null) return `The published ${industrialCapacityBenchmarkPeriod} long-run average is ${industrialCapacityLongRunAverage.toFixed(1)}%.`
  const difference = value - industrialCapacityLongRunAverage
  const relation = Math.abs(difference) <= industrialCapacityNeutralTolerance
    ? 'from'
    : difference < 0 ? 'below' : 'above'
  return `${value.toFixed(1)}% in use, ${Math.abs(difference) <= industrialCapacityNeutralTolerance ? '' : 'about '}${relation === 'from' ? formatSignedPercentagePoints(difference) : Math.abs(difference).toFixed(1)} percentage points ${relation} the ${industrialCapacityBenchmarkPeriod} long-run average of ${industrialCapacityLongRunAverage.toFixed(1)}%.`
}
