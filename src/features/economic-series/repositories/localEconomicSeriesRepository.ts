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
  'headline-pce-inflation': () =>
    import('../data/headline-pce-inflation.json'),
  'core-cpi-inflation': () => import('../data/core-cpi-inflation.json'),
  'shelter-cpi-inflation': () =>
    import('../data/shelter-cpi-inflation.json'),
  'energy-cpi-inflation': () =>
    import('../data/energy-cpi-inflation.json'),
  'food-cpi-inflation': () =>
    import('../data/food-cpi-inflation.json'),
  'headline-cpi-three-month-annualized': () =>
    import('../data/headline-cpi-three-month-annualized.json'),
  'core-cpi-three-month-annualized': () =>
    import('../data/core-cpi-three-month-annualized.json'),
  'unemployment-rate': () => import('../data/unemployment-rate.json'),
  'prime-age-employment-ratio': () =>
    import('../data/prime-age-employment-ratio.json'),
  'initial-unemployment-claims': () =>
    import('../data/initial-unemployment-claims.json'),
  'initial-unemployment-claims-four-week-average': () =>
    import('../data/initial-unemployment-claims-four-week-average.json'),
  'labor-market-activity-index': () =>
    import('../data/labor-market-activity-index.json'),
  'labor-market-momentum-index': () =>
    import('../data/labor-market-momentum-index.json'),
  'payroll-growth': () => import('../data/payroll-growth.json'),
  'monthly-payroll-change': () => import('../data/monthly-payroll-change.json'),
  'nominal-wage-growth': () => import('../data/nominal-wage-growth.json'),
  'real-wage-growth': () => import('../data/real-wage-growth.json'),
  'quarterly-real-disposable-income-per-capita-growth': () =>
    import('../data/quarterly-real-disposable-income-per-capita-growth.json'),
  'quarterly-real-consumer-spending-per-capita-growth': () =>
    import('../data/quarterly-real-consumer-spending-per-capita-growth.json'),
  'personal-saving-rate': () => import('../data/personal-saving-rate.json'),
  'household-debt-service-ratio': () =>
    import('../data/household-debt-service-ratio.json'),
  'home-ownership-cost-share': () =>
    import('../data/home-ownership-cost-share.json'),
  'housing-starts': () => import('../data/housing-starts.json'),
  'manufacturing-output': () => import('../data/manufacturing-output.json'),
  'manufacturing-employment': () =>
    import('../data/manufacturing-employment.json'),
  'real-business-investment-growth': () =>
    import('../data/real-business-investment-growth.json'),
  'corporate-profit-share': () => import('../data/corporate-profit-share.json'),
  'industrial-capacity-utilization': () =>
    import('../data/industrial-capacity-utilization.json'),
  'effective-federal-funds-rate': () =>
    import('../data/effective-federal-funds-rate.json'),
  'ten-year-treasury-yield': () =>
    import('../data/ten-year-treasury-yield.json'),
  'broad-credit-conditions': () => import('../data/broad-credit-conditions.json'),
  'bank-lending-standards': () => import('../data/bank-lending-standards.json'),
  'federal-budget-balance': () => import('../data/federal-budget-balance.json'),
  'federal-debt-held-by-public': () => import('../data/federal-debt-held-by-public.json'),
  'trade-balance-share-of-gdp': () => import('../data/trade-balance-share-of-gdp.json'),
  'effective-tariff-burden': () => import('../data/effective-tariff-burden.json'),
}

export const localEconomicSeriesRepository: EconomicSeriesRepository = {
  async getBySlug(slug) {
    const loadSeries = localSeriesLoaders[slug]

    if (!loadSeries) return null

    const module = await loadSeries()
    return validateEconomicSeries(module.default)
  },
}
