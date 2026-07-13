import type {
  EconomicObservation,
  EconomicSeries,
} from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'
import type { FredSeriesConfig } from './seriesConfigurations'

function yearEarlier(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`)
  parsed.setUTCFullYear(parsed.getUTCFullYear() - 1)
  return parsed.toISOString().slice(0, 10)
}

export function deriveQuarterlyYearOverYearGrowth(
  levels: readonly EconomicObservation[],
): EconomicObservation[] {
  const sorted = [...levels].sort((a, b) => a.date.localeCompare(b.date))
  const levelsByDate = new Map(
    sorted.map((observation) => [observation.date, observation.value]),
  )

  return sorted.map((current) => {
    const prior = levelsByDate.get(yearEarlier(current.date))
    const value =
      current.value !== null && prior !== null && prior !== undefined
        ? (current.value / prior - 1) * 100
        : null
    return { date: current.date, value }
  })
}

function parseLevelObservations(
  response: FredObservationsResponse,
  retrievedAt: string,
): EconomicObservation[] {
  const observations = response.observations
    .filter((observation) => observation.date <= retrievedAt)
    .map((observation) => ({
      date: observation.date,
      value: observation.value === '.' ? null : Number(observation.value),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  for (let index = 1; index < observations.length; index += 1) {
    if (observations[index - 1]!.date === observations[index]!.date) {
      throw new Error(
        `FRED response contains duplicate date: ${observations[index]!.date}`,
      )
    }
  }

  return observations
}

export function deriveQuarterlyGrowthSeries(
  response: FredObservationsResponse,
  retrievedAt: string,
  config: FredSeriesConfig,
): EconomicSeries {
  if (config.localDerivation !== 'year-over-year-quarterly-growth') {
    throw new Error(`Unsupported local derivation for ${config.providerSeriesId}`)
  }

  const levels = parseLevelObservations(response, retrievedAt)
  const usableLevelCount = levels.filter(
    (observation) => observation.value !== null,
  ).length
  if (usableLevelCount < config.minimumUsableObservations) {
    throw new Error(
      `Expected at least ${config.minimumUsableObservations} usable ${config.frequency} source observations, received ${usableLevelCount}`,
    )
  }

  const derived = deriveQuarterlyYearOverYearGrowth(levels)
  const firstUsableIndex = derived.findIndex(
    (observation) => observation.value !== null,
  )
  const observations =
    firstUsableIndex < 0 ? [] : derived.slice(firstUsableIndex)

  return validateEconomicSeries({
    id: config.id,
    slug: config.slug,
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: config.providerSeriesId,
    title: config.title,
    shortTitle: config.shortTitle,
    description: config.description,
    question: config.question,
    units: config.units,
    frequency: config.frequency,
    seasonalAdjustment: config.seasonalAdjustment,
    transformation: config.transformation,
    sourceName: config.sourceName,
    sourceUrl: config.sourceUrl,
    retrievedAt,
    observations,
  })
}
