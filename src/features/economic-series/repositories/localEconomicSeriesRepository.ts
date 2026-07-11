import realGdpGrowthData from '../data/real-gdp-growth.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import type { EconomicSeriesRepository } from './EconomicSeriesRepository'

const localSeriesBySlug: Readonly<Record<string, unknown>> = {
  'real-gdp-growth': realGdpGrowthData,
}

export const localEconomicSeriesRepository: EconomicSeriesRepository = {
  async getBySlug(slug) {
    const data = localSeriesBySlug[slug]

    if (data === undefined) return null

    return validateEconomicSeries(data)
  },
}
