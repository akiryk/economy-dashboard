import { validateEconomicSeries } from '../models/validateEconomicSeries'
import type { EconomicSeriesRepository } from './EconomicSeriesRepository'

export type DashboardSeriesLoaders = Readonly<
  Record<string, () => Promise<{ default: unknown }>>
>

const reusedSlugs = new Set([
  'real-gdp-growth',
  'unemployment-rate',
  'initial-unemployment-claims',
  'initial-unemployment-claims-four-week-average',
])

export function createDashboardEconomicSeriesRepository(
  loaders: DashboardSeriesLoaders,
  reusedRepository: EconomicSeriesRepository,
): EconomicSeriesRepository {
  return {
    async getBySlug(slug) {
      if (reusedSlugs.has(slug)) {
        return reusedRepository.getBySlug(slug)
      }

      const loadSeries = loaders[slug]
      if (!loadSeries) return null

      const module = await loadSeries()
      return validateEconomicSeries(module.default)
    },
  }
}
