import type { HistoricalBandModel } from './historicalBandContext'
import { classifyHistoricalBandPosition } from './historicalBandContext'
import { formatObservationPeriod, formatPercentage } from './economicSeries'

export function formatProfitPerHundred(value: number | null): string {
  return value === null
    ? 'The latest dollars-per-$100 equivalent is unavailable.'
    : `About $${value.toFixed(2)} in adjusted after-tax corporate profit for every $100 of GDP.`
}

export function formatCorporateProfitSharePosition(model: HistoricalBandModel): string {
  const position = classifyHistoricalBandPosition(model.latestObservation.value, model)
  return ({ belowOuterBand: 'very low', betweenOuterAndInnerLow: 'low', insideInnerBand: 'typical', betweenInnerAndOuterHigh: 'high', aboveOuterBand: 'very high', unavailable: 'unavailable' } as const)[position]
}

export function formatCorporateProfitStructuralInterpretation(model: HistoricalBandModel): string {
  if (model.latestObservation.value > model.median) {
    return 'Corporate profits now account for a larger share of the economy than was typical during much of the postwar period. The sustained rise since the 1990s may reflect a combination of lower taxes and interest costs, globalization, greater market power, technology and intangible assets, and slower growth in labor compensation relative to productivity. The measure cannot determine how much each factor contributed.'
  }
  return 'Corporate profits account for a smaller share of the economy than in recent high-profit periods. Changes can reflect taxes, interest costs, wages, productivity, prices, industry composition, globalization, and market power, so the measure does not identify a single cause.'
}

export function createCorporateProfitShareAccessibleSummary(model: HistoricalBandModel): string {
  const first = model.recentObservations.find(({ value }) => value !== null)
  return `${formatPercentage(model.latestObservation.value)} in ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}. ${formatProfitPerHundred(model.latestObservation.value)} The current corporate-profit share is ${formatCorporateProfitSharePosition(model)} by the standards of the past 25 years. The compact chart runs from ${first ? formatObservationPeriod(first.date, 'quarterly') : 'an unavailable quarter'} through ${formatObservationPeriod(model.latestObservation.date, 'quarterly')}. This is an economy-wide national-accounts ratio.`
}
