import { validateEconomicSeries } from '../models/validateEconomicSeries'
import type { EconomicSeriesRepository } from './EconomicSeriesRepository'

const localSeriesLoaders: Readonly<
  Record<string, () => Promise<{ default: unknown }>>
> = {
  'real-gdp-growth': () => import('../data/real-gdp-growth.json'),
  'headline-cpi-inflation': () =>
    import('../data/headline-cpi-inflation.json'),
}

export const localEconomicSeriesRepository: EconomicSeriesRepository = {
  async getBySlug(slug) {
    const loadSeries = localSeriesLoaders[slug]

    if (!loadSeries) return null

    const module = await loadSeries()
    return validateEconomicSeries(module.default)
  },
}
