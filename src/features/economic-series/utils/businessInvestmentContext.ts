import type { HistoricalBandModel } from './historicalBandContext'
import { classifyHistoricalBandPosition } from './historicalBandContext'
import { formatObservationPeriod, formatSignedPercentage } from './economicSeries'

export type BusinessInvestmentDirection = 'more' | 'less' | 'flat' | 'unavailable'

export function classifyBusinessInvestmentDirection(value: number | null): BusinessInvestmentDirection {
  if (value === null) return 'unavailable'
  if (value > 0.2) return 'more'
  if (value < -0.2) return 'less'
  return 'flat'
}

export function formatBusinessInvestmentAnswer(value: number | null): string {
  const direction = classifyBusinessInvestmentDirection(value)
  if (direction === 'more') return 'Yes — businesses are spending more than a year ago on equipment, nonresidential structures, software, and research.'
  if (direction === 'less') return 'No — businesses are spending less than a year ago on equipment, nonresidential structures, software, and research.'
  if (direction === 'flat') return 'About the same — inflation-adjusted business investment is little changed from a year ago.'
  return 'The latest direction of inflation-adjusted business investment is unavailable.'
}

export function formatBusinessInvestmentInterpretation(value: number | null): string {
  const direction = classifyBusinessInvestmentDirection(value)
  if (direction === 'more') return 'Higher investment often suggests that businesses expect future demand to justify expanding or upgrading their productive assets. It may also reflect replacement, automation, policy incentives, or projects planned earlier, so the measure is suggestive rather than a direct reading of business confidence.'
  if (direction === 'less') return 'Lower investment can indicate that businesses are delaying or reducing spending because expected demand, financing conditions, or uncertainty make new projects less attractive. It may also reflect the completion of earlier investment booms, changing tax incentives, or unusually strong investment a year earlier, so the measure does not by itself prove weakening confidence.'
  if (direction === 'flat') return 'Little change suggests that businesses are investing at roughly the same inflation-adjusted pace as a year ago. That may reflect stable expectations and replacement needs, or offsetting strength and weakness across equipment, structures, software, and research, so the aggregate does not reveal a single business outlook.'
  return 'No current interpretation is available.'
}

export function formatBusinessInvestmentHistoricalPosition(model: HistoricalBandModel): string {
  const position = classifyHistoricalBandPosition(model.latestObservation.value, model)
  return ({ belowOuterBand: 'very weak', betweenOuterAndInnerLow: 'weak', insideInnerBand: 'typical', betweenInnerAndOuterHigh: 'strong', aboveOuterBand: 'very strong', unavailable: 'unavailable' } as const)[position]
}

export function createBusinessInvestmentAccessibleSummary(model: HistoricalBandModel): string {
  const first = model.recentObservations.find(({ value }) => value !== null)
  return `${formatSignedPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}. ${formatBusinessInvestmentAnswer(model.latestObservation.value)} The current growth rate is ${formatBusinessInvestmentHistoricalPosition(model)} relative to the available history. The compact chart runs from ${first ? formatObservationPeriod(first.date, 'quarterly') : 'an unavailable quarter'} through ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}. The measure covers equipment, nonresidential structures, software, and research.`
}
