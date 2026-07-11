import type { EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import type { FredObservationsResponse } from './fredClient'

export function normalizeFredSeries(
  response: FredObservationsResponse,
  retrievedAt: string,
): EconomicSeries {
  const observations = response.observations
    .filter((observation) => observation.date <= retrievedAt)
    .map((observation) => ({
      date: observation.date,
      value: observation.value === '.' ? null : Number(observation.value),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const usableObservationCount = observations.filter(
    (observation) => observation.value !== null,
  ).length

  if (usableObservationCount < 80) {
    throw new Error(
      `Expected at least 80 usable quarterly observations, received ${usableObservationCount}`,
    )
  }

  return validateEconomicSeries({
    id: 'real-gdp-growth',
    slug: 'real-gdp-growth',
    provider: 'Federal Reserve Bank of St. Louis',
    providerSeriesId: 'GDPC1',
    title: 'Real Gross Domestic Product: Percent Change from Year Ago',
    shortTitle: 'Real GDP growth',
    description:
      'Inflation-adjusted U.S. gross domestic product, expressed as the percentage change from the same quarter one year earlier.',
    question: 'Is the U.S. economy growing?',
    units: 'Percent change from year ago',
    frequency: 'quarterly',
    seasonalAdjustment:
      'Seasonally adjusted annual rate (underlying GDP level)',
    transformation: 'Percent change from year ago',
    sourceName: 'U.S. Bureau of Economic Analysis via FRED',
    sourceUrl: 'https://fred.stlouisfed.org/series/GDPC1',
    retrievedAt,
    observations,
  })
}
