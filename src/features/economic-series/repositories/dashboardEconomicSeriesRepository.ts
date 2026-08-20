import { createDashboardEconomicSeriesRepository } from './createDashboardEconomicSeriesRepository'
import { localEconomicSeriesRepository } from './localEconomicSeriesRepository'

const dashboardSeriesLoaders: Readonly<
  Record<string, () => Promise<{ default: unknown }>>
> = {
  'dashboard-real-gdp-growth': () => import('../data/dashboard-real-gdp-growth.json'),
  'dashboard-nominal-gdp': () => import('../data/dashboard-nominal-gdp.json'),
  'dashboard-payroll-change': () => import('../data/dashboard-payroll-change.json'),
  'dashboard-sahm-rule-gap': () => import('../data/dashboard-sahm-rule-gap.json'),
  'dashboard-headline-cpi-inflation': () => import('../data/dashboard-headline-cpi-inflation.json'),
  'dashboard-core-cpi-inflation': () => import('../data/dashboard-core-cpi-inflation.json'),
  'dashboard-expected-inflation-10-year': () => import('../data/dashboard-expected-inflation-10-year.json'),
  'dashboard-effective-federal-funds-rate': () => import('../data/dashboard-effective-federal-funds-rate.json'),
  'dashboard-fed-target-upper-bound': () => import('../data/dashboard-fed-target-upper-bound.json'),
  'dashboard-yield-spread-10y-2y': () => import('../data/dashboard-yield-spread-10y-2y.json'),
  'dashboard-yield-spread-10y-3m': () => import('../data/dashboard-yield-spread-10y-3m.json'),
  'dashboard-ten-year-treasury-yield': () => import('../data/dashboard-ten-year-treasury-yield.json'),
  'dashboard-mortgage-rate-30-year': () => import('../data/dashboard-mortgage-rate-30-year.json'),
  'dashboard-sp500': () => import('../data/dashboard-sp500.json'),
  'dashboard-high-yield-credit-spread': () => import('../data/dashboard-high-yield-credit-spread.json'),
  'real-wage-growth': () => import('../data/real-wage-growth.json'),
}

export const dashboardEconomicSeriesSlugs = Object.freeze(
  Object.keys(dashboardSeriesLoaders),
)

export const dashboardEconomicSeriesRepository =
  createDashboardEconomicSeriesRepository(
    dashboardSeriesLoaders,
    localEconomicSeriesRepository,
  )
