import { validateEconomicSeries } from '../models/validateEconomicSeries'
import type { EconomicSeriesRepository } from './EconomicSeriesRepository'

const localSeriesLoaders: Readonly<
  Record<string, () => Promise<{ default: unknown }>>
> = {
  'real-gdp-growth': () => import('../data/real-gdp-growth.json'),
  'real-gdp-per-capita-growth': () =>
    import('../data/real-gdp-per-capita-growth.json'),
  'labor-productivity-growth': () =>
    import('../data/labor-productivity-growth.json'),
  'headline-cpi-inflation': () =>
    import('../data/headline-cpi-inflation.json'),
  'unemployment-rate': () => import('../data/unemployment-rate.json'),
  'prime-age-employment-ratio': () =>
    import('../data/prime-age-employment-ratio.json'),
  'payroll-growth': () => import('../data/payroll-growth.json'),
  'monthly-payroll-change': () => import('../data/monthly-payroll-change.json'),
  'nominal-wage-growth': () => import('../data/nominal-wage-growth.json'),
  'real-wage-growth': () => import('../data/real-wage-growth.json'),
}

export const localEconomicSeriesRepository: EconomicSeriesRepository = {
  async getBySlug(slug) {
    const loadSeries = localSeriesLoaders[slug]

    if (!loadSeries) return null

    const module = await loadSeries()
    return validateEconomicSeries(module.default)
  },
}
