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
  'labor-productivity-level': () =>
    import('../data/labor-productivity-level.json'),
  'headline-cpi-inflation': () =>
    import('../data/headline-cpi-inflation.json'),
  'core-cpi-inflation': () => import('../data/core-cpi-inflation.json'),
  'headline-cpi-three-month-annualized': () =>
    import('../data/headline-cpi-three-month-annualized.json'),
  'core-cpi-three-month-annualized': () =>
    import('../data/core-cpi-three-month-annualized.json'),
  'unemployment-rate': () => import('../data/unemployment-rate.json'),
  'prime-age-employment-ratio': () =>
    import('../data/prime-age-employment-ratio.json'),
  'payroll-growth': () => import('../data/payroll-growth.json'),
  'monthly-payroll-change': () => import('../data/monthly-payroll-change.json'),
  'nominal-wage-growth': () => import('../data/nominal-wage-growth.json'),
  'real-wage-growth': () => import('../data/real-wage-growth.json'),
  'real-disposable-income-per-capita-growth': () =>
    import('../data/real-disposable-income-per-capita-growth.json'),
  'real-consumer-spending-growth': () =>
    import('../data/real-consumer-spending-growth.json'),
  'personal-saving-rate': () => import('../data/personal-saving-rate.json'),
  'household-debt-service-ratio': () =>
    import('../data/household-debt-service-ratio.json'),
  'home-ownership-cost-share': () =>
    import('../data/home-ownership-cost-share.json'),
  'housing-starts': () => import('../data/housing-starts.json'),
  'manufacturing-output': () => import('../data/manufacturing-output.json'),
  'manufacturing-employment': () =>
    import('../data/manufacturing-employment.json'),
}

export const localEconomicSeriesRepository: EconomicSeriesRepository = {
  async getBySlug(slug) {
    const loadSeries = localSeriesLoaders[slug]

    if (!loadSeries) return null

    const module = await loadSeries()
    return validateEconomicSeries(module.default)
  },
}
