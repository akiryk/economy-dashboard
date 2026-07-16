import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'
import type { FredSeriesConfig } from './seriesConfigurations'

export function normalizeFredSeries(
  response: FredObservationsResponse,
  retrievedAt: string,
  config: FredSeriesConfig,
): EconomicSeries {
  const observationsWithLeadingNulls = response.observations
    .filter((observation) => observation.date <= retrievedAt)
    .map((observation) => ({
      date: observation.date,
      value: observation.value === '.' ? null : Number(observation.value),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  for (let index = 1; index < observationsWithLeadingNulls.length; index += 1) {
    if (
      observationsWithLeadingNulls[index - 1]!.date ===
      observationsWithLeadingNulls[index]!.date
    ) {
      throw new Error(
        `FRED response contains duplicate date: ${observationsWithLeadingNulls[index]!.date}`,
      )
    }
  }

  const firstUsableIndex = observationsWithLeadingNulls.findIndex(
    (observation) => observation.value !== null,
  )
  const observations =
    firstUsableIndex < 0 ? [] : observationsWithLeadingNulls.slice(firstUsableIndex)

  const usableObservationCount = observations.filter(
    (observation) => observation.value !== null,
  ).length

  if (usableObservationCount < config.minimumUsableObservations) {
    throw new Error(
      `Expected at least ${config.minimumUsableObservations} usable ${config.frequency} observations, received ${usableObservationCount}`,
    )
  }

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
