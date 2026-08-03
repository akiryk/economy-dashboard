import { savingRateDeciles, type SavingRateDistributionDataset, type SavingRateDecileId } from '../models/savingRateDistribution'

export const defaultSavingRateComparison: readonly SavingRateDecileId[] = [
  '0-10%',
  '50-60%',
  '80-90%',
]

export function latestValidDistributionYear(data: SavingRateDistributionDataset): number | null {
  const years = data.observations.flatMap(({ year, rate }) => rate === null ? [] : [year])
  return years.length ? Math.max(...years) : null
}

export function formatDistributionRate(rate: number | null): string {
  if (rate === null) return 'Missing data'
  return `${rate.toFixed(1)}%`
}

export function describeDistributionObservation(decile: SavingRateDecileId, year: number, rate: number | null, status = 'final'): string {
  const label = savingRateDeciles.find(({ id }) => id === decile)!.label
  const value = formatDistributionRate(rate)
  const negative = rate !== null && rate < 0 ? ' Estimated outlays exceeded disposable income.' : ''
  const qualifier = status === 'final' ? '' : ` ${status[0]!.toUpperCase()}${status.slice(1)} estimate.`
  return `${label}, ${year}: ${value}.${negative}${qualifier}`
}

export function buildLatestYearSummary(data: SavingRateDistributionDataset): string {
  const year = latestValidDistributionYear(data)
  if (year === null) return 'No valid saving-rate distribution observations are available.'
  const observations = data.observations.filter((item) => item.year === year)
  const valid = observations.filter((item): item is typeof item & { rate: number } => item.rate !== null)
  const lowest = valid.reduce((a, b) => a.rate < b.rate ? a : b)
  const highest = valid.reduce((a, b) => a.rate > b.rate ? a : b)
  const negative = valid.filter(({ rate }) => rate < 0).map(({ decile }) => savingRateDeciles.find(({ id }) => id === decile)!.label)
  const years = [...new Set(data.observations.filter(({ rate }) => rate !== null).map(({ year: itemYear }) => itemYear))]
  const rates = observations.map(({ decile, rate }) => `${savingRateDeciles.find(({ id }) => id === decile)!.label}: ${formatDistributionRate(rate)}`).join('; ')
  return `BEA saving-rate distribution coverage runs from ${Math.min(...years)} through ${Math.max(...years)}. In ${year}: ${rates}. Negative saving rates: ${negative.length ? negative.join(', ') : 'none'}. The lowest rate was ${formatDistributionRate(lowest.rate)} for ${savingRateDeciles.find(({ id }) => id === lowest.decile)!.label}; the highest was ${formatDistributionRate(highest.rate)} for ${savingRateDeciles.find(({ id }) => id === highest.decile)!.label}.`
}
