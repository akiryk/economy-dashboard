import {
  savingRateDeciles,
  type SavingRateDistributionDataset,
  type SavingRateEstimateStatus,
} from './savingRateDistribution'

const statuses = new Set<SavingRateEstimateStatus>([
  'final',
  'provisional',
  'experimental',
])

export function validateSavingRateDistribution(
  value: unknown,
): SavingRateDistributionDataset {
  if (!value || typeof value !== 'object') throw new Error('Distribution dataset must be an object.')
  const data = value as Partial<SavingRateDistributionDataset>
  if (data.id !== 'saving-rate-by-income-decile') throw new Error('Unexpected distribution dataset id.')
  if (data.ranking !== 'Equivalized Disposable Personal Income') throw new Error('Unexpected BEA income-ranking definition.')
  if (data.units !== 'Percent of disposable personal income') throw new Error('Unexpected distribution units.')
  for (const field of ['sourceName', 'sourceUrl', 'workbookUrl', 'methodologyUrl', 'retrievedAt'] as const) {
    if (typeof data[field] !== 'string' || data[field].length === 0) throw new Error(`Missing ${field}.`)
  }
  if (!Array.isArray(data.observations) || data.observations.length === 0) throw new Error('Distribution observations are required.')

  const expectedDeciles = new Set(savingRateDeciles.map(({ id }) => id))
  const seen = new Set<string>()
  let priorYear = -Infinity
  let priorDecile = -1
  for (const observation of data.observations) {
    if (!Number.isInteger(observation.year)) throw new Error('Observation year must be an integer.')
    const decileIndex = savingRateDeciles.findIndex(({ id }) => id === observation.decile)
    if (decileIndex < 0 || !expectedDeciles.has(observation.decile)) throw new Error(`Unexpected decile: ${observation.decile}`)
    if (observation.rate !== null && !Number.isFinite(observation.rate)) throw new Error('Saving rates must be numeric or null.')
    if (!statuses.has(observation.status)) throw new Error(`Unexpected estimate status: ${observation.status}`)
    const key = `${observation.year}:${observation.decile}`
    if (seen.has(key)) throw new Error(`Duplicate distribution observation: ${key}`)
    seen.add(key)
    if (observation.year < priorYear || (observation.year === priorYear && decileIndex <= priorDecile)) throw new Error('Observations must be ordered by year and decile.')
    priorDecile = observation.year === priorYear ? decileIndex : decileIndex
    priorYear = observation.year
  }

  const years = [...new Set(data.observations.map(({ year }) => year))]
  for (const year of years) {
    const yearDeciles = data.observations.filter((item) => item.year === year).map(({ decile }) => decile)
    if (yearDeciles.length !== savingRateDeciles.length || yearDeciles.some((id, index) => id !== savingRateDeciles[index]?.id)) {
      throw new Error(`Year ${year} does not contain the exact ten deciles in order.`)
    }
  }
  return data as SavingRateDistributionDataset
}
