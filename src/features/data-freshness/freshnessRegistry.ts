import type {
  FreshnessContractDefinition,
  FreshnessContractId,
  VisibleDatasetFreshnessDefinition,
  VisibleSurface,
} from './freshnessTypes'

export const freshnessContracts = {
  'BEA-Q': { id: 'BEA-Q', provider: 'U.S. Bureau of Economic Analysis via FRED', contract: { kind: 'release-aware', cadence: 'quarterly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'BEA dated GDP and national-accounts release calendar' } },
  'BEA-M': { id: 'BEA-M', provider: 'U.S. Bureau of Economic Analysis via FRED', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'BEA Personal Income and Outlays release calendar; source-specific population timing' } },
  'BEA-IRR': { id: 'BEA-IRR', provider: 'U.S. Bureau of Economic Analysis', contract: { kind: 'irregular', automation: 'automatic', reviewIntervalDays: 92, releaseRule: 'Annual research workbook without a dependable release date' } },
  'BLS-EMP': { id: 'BLS-EMP', provider: 'U.S. Bureau of Labor Statistics via FRED', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'BLS Employment Situation release calendar, followed by FRED propagation' } },
  'BLS-CPI': { id: 'BLS-CPI', provider: 'U.S. Bureau of Labor Statistics via FRED and BLS API', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'BLS CPI release calendar, followed by applicable intermediary propagation' } },
  'BLS-T7': { id: 'BLS-T7', provider: 'U.S. Bureau of Labor Statistics', contract: { kind: 'irregular', automation: 'manual', reviewIntervalDays: 31, releaseRule: 'Monthly with CPI release; official workbook ingestion', accessRestriction: 'Official BLS Table 7 retrieval is blocked from ordinary GitHub-hosted runners; automatic freshness is indeterminate and manual ingestion is required.' } },
  'BLS-JOLTS': { id: 'BLS-JOLTS', provider: 'U.S. Bureau of Labor Statistics via FRED', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'Separate BLS JOLTS release calendar, followed by FRED propagation' } },
  'BLS-PROD': { id: 'BLS-PROD', provider: 'U.S. Bureau of Labor Statistics via FRED', contract: { kind: 'release-aware', cadence: 'quarterly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'BLS productivity initial and revised release calendar' } },
  'DOL-W': { id: 'DOL-W', provider: 'U.S. Department of Labor via FRED', contract: { kind: 'weekly', automation: 'automatic', publicationWeekday: 'thursday', holidayRule: 'source-calendar', maxExpectedReleasesBehind: 1, graceSuccessfulRefreshCycles: 1 } },
  'CENSUS-HOUSING': { id: 'CENSUS-HOUSING', provider: 'U.S. Census Bureau and HUD via FRED', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'Census New Residential Construction calendar; supporting tables retain their own cadence' } },
  'FED-G17': { id: 'FED-G17', provider: 'Federal Reserve Board via FRED', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'Federal Reserve G.17 published release dates' } },
  'FED-POLICY': { id: 'FED-POLICY', provider: 'Federal Reserve Board via FRED', contract: { kind: 'event-driven', automation: 'automatic', releaseRule: 'Effective FOMC target changes; unchanged policy may remain current indefinitely', graceSuccessfulRefreshCycles: 1 } },
  'FED-RATES-M': { id: 'FED-RATES-M', provider: 'Federal Reserve Board via FRED', contract: { kind: 'release-aware', cadence: 'monthly', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'Monthly averages after month end; current-month absence is normal' } },
  FISCAL: { id: 'FISCAL', provider: 'U.S. fiscal and national-accounts sources via FRED', contract: { kind: 'release-aware', cadence: 'source-specific', automation: 'automatic', graceSuccessfulRefreshCycles: 1, releaseRule: 'Source-specific annual or quarterly official publication; two expected periods require investigation' } },
  'HOAM-M': { id: 'HOAM-M', provider: 'Federal Reserve Bank of Atlanta', contract: { kind: 'irregular', automation: 'automatic', reviewIntervalDays: 62, releaseRule: 'Monthly workbook with source-dependent lag and no stable dated release calendar' } },
  'PMMS-W': { id: 'PMMS-W', provider: 'Freddie Mac via FRED', contract: { kind: 'weekly', automation: 'automatic', publicationWeekday: 'thursday', holidayRule: 'previous-business-day', maxExpectedReleasesBehind: 1, graceSuccessfulRefreshCycles: 1 } },
  'MARKET-D': { id: 'MARKET-D', provider: 'Licensed market series via FRED', contract: { kind: 'market-day', automation: 'automatic', expectedThrough: 'prior-completed-market-day', maxCompletedMarketDaysBehind: 2, graceSuccessfulRefreshCycles: 1 } },
  'FED-RESEARCH': { id: 'FED-RESEARCH', provider: 'Federal Reserve Board research publications', contract: { kind: 'irregular', automation: 'partially-manual', reviewIntervalDays: 92, releaseRule: 'Publication-vintage research without a fixed update schedule' } },
  OECD: { id: 'OECD', provider: 'OECD Data Explorer SDMX', contract: { kind: 'oecd-peer-snapshot', automation: 'automatic-nonblocking', minimumCurrentPeers: 8, requiredCountry: 'USA', monthlyPeriodTolerance: 3, quarterlyPeriodTolerance: 2, staleAfterConsecutiveFailedChecks: 3 } },
} as const satisfies Record<FreshnessContractId, FreshnessContractDefinition>

function dataset(
  datasetId: string,
  artifactPath: string,
  contractIds: readonly [FreshnessContractId, ...FreshnessContractId[]],
  surfaces: readonly [VisibleSurface, ...VisibleSurface[]],
  seriesSlugs: readonly string[] = [datasetId],
): VisibleDatasetFreshnessDefinition {
  return { datasetId, artifactPath, contractIds, surfaces, seriesSlugs }
}

const R = ['research'] as const
const S = ['status'] as const
const RS = ['research', 'status'] as const
const C = ['compare'] as const
const dataPath = (id: string) => `src/features/economic-series/data/${id}.json`

export const visibleDatasetFreshnessRegistry = [
  dataset('real-gdp-growth', dataPath('real-gdp-growth'), ['BEA-Q'], RS),
  dataset('real-gdp-per-capita-growth', dataPath('real-gdp-per-capita-growth'), ['BEA-Q'], R),
  dataset('labor-productivity-growth', dataPath('labor-productivity-growth'), ['BLS-PROD'], R),
  dataset('labor-productivity-level', dataPath('labor-productivity-level'), ['BLS-PROD'], R),
  dataset('headline-cpi-inflation', dataPath('headline-cpi-inflation'), ['BLS-CPI'], R),
  dataset('headline-cpi-inflation-seasonally-adjusted', dataPath('headline-cpi-inflation-seasonally-adjusted'), ['BLS-CPI'], R),
  dataset('headline-cpi-index-not-seasonally-adjusted', dataPath('headline-cpi-index-not-seasonally-adjusted'), ['BLS-CPI'], R),
  dataset('headline-cpi-index-seasonally-adjusted', dataPath('headline-cpi-index-seasonally-adjusted'), ['BLS-CPI'], R),
  dataset('headline-cpi-three-month-annualized', dataPath('headline-cpi-three-month-annualized'), ['BLS-CPI'], R),
  dataset('core-cpi-inflation', dataPath('core-cpi-inflation'), ['BLS-CPI'], R),
  dataset('core-cpi-three-month-annualized', dataPath('core-cpi-three-month-annualized'), ['BLS-CPI'], R),
  dataset('headline-pce-inflation', dataPath('headline-pce-inflation'), ['BEA-M'], R),
  dataset('nominal-wage-growth', dataPath('nominal-wage-growth'), ['BLS-EMP'], R),
  dataset('real-wage-growth', dataPath('real-wage-growth'), ['BLS-EMP', 'BLS-CPI'], RS),
  dataset('inflation-contributions', dataPath('inflation-contributions'), ['BLS-T7'], R, []),
  dataset('inflation-contribution-history', dataPath('inflation-contribution-history'), ['BLS-T7'], R, []),
  dataset('shelter-cpi-inflation', dataPath('shelter-cpi-inflation'), ['BLS-CPI'], R),
  dataset('energy-cpi-inflation', dataPath('energy-cpi-inflation'), ['BLS-CPI'], R),
  dataset('food-cpi-inflation', dataPath('food-cpi-inflation'), ['BLS-CPI'], R),
  dataset('unemployment-rate', dataPath('unemployment-rate'), ['BLS-EMP'], RS),
  dataset('prime-age-employment-ratio', dataPath('prime-age-employment-ratio'), ['BLS-EMP'], R),
  dataset('payroll-growth', dataPath('payroll-growth'), ['BLS-EMP'], R),
  dataset('monthly-payroll-change', dataPath('monthly-payroll-change'), ['BLS-EMP'], R),
  dataset('estimated-breakeven-employment-growth', dataPath('estimated-breakeven-employment-growth'), ['FED-RESEARCH'], R, []),
  dataset('job-growth-breakeven-comparison', dataPath('job-growth-breakeven-comparison'), ['FED-RESEARCH', 'BLS-EMP'], R, []),
  dataset('jolts-layoffs-and-discharges-rate', dataPath('jolts-layoffs-and-discharges-rate'), ['BLS-JOLTS'], R),
  dataset('initial-unemployment-claims', dataPath('initial-unemployment-claims'), ['DOL-W'], RS),
  dataset('initial-unemployment-claims-four-week-average', dataPath('initial-unemployment-claims-four-week-average'), ['DOL-W'], RS),
  dataset('personal-saving-rate', dataPath('personal-saving-rate'), ['BEA-M'], R),
  dataset('saving-rate-by-income-decile', dataPath('saving-rate-by-income-decile'), ['BEA-IRR'], R, []),
  dataset('home-ownership-cost-share', dataPath('home-ownership-cost-share'), ['HOAM-M'], R),
  dataset('housing-starts', dataPath('housing-starts'), ['CENSUS-HOUSING'], R),
  dataset('us-population-monthly', dataPath('us-population-monthly'), ['BEA-M'], R),
  dataset('housing-construction-details', dataPath('housing-construction-details'), ['CENSUS-HOUSING'], R, []),
  dataset('housing-supply-composition', dataPath('housing-supply-composition'), ['CENSUS-HOUSING'], R, []),
  dataset('manufacturing-output', dataPath('manufacturing-output'), ['FED-G17'], R),
  dataset('real-business-investment-growth', dataPath('real-business-investment-growth'), ['BEA-Q'], R),
  dataset('real-business-investment-level', dataPath('real-business-investment-level'), ['BEA-Q'], R),
  dataset('corporate-profit-share', dataPath('corporate-profit-share'), ['BEA-Q'], R),
  dataset('federal-funds-target-lower-bound', dataPath('federal-funds-target-lower-bound'), ['FED-POLICY'], R),
  dataset('federal-funds-target-upper-bound', dataPath('dashboard-fed-target-upper-bound'), ['FED-POLICY'], R),
  dataset('federal-funds-target-rate-historical', dataPath('federal-funds-target-rate-historical'), ['FED-POLICY'], R),
  dataset('bank-prime-loan-rate', dataPath('bank-prime-loan-rate'), ['FED-POLICY'], R),
  dataset('daily-effective-federal-funds-rate', dataPath('dashboard-effective-federal-funds-rate'), ['FED-POLICY'], R),
  dataset('effective-federal-funds-rate', dataPath('effective-federal-funds-rate'), ['FED-RATES-M'], R),
  dataset('ten-year-treasury-yield', dataPath('ten-year-treasury-yield'), ['FED-RATES-M'], R),
  dataset('three-month-treasury-bill-rate', dataPath('three-month-treasury-bill-rate'), ['FED-RATES-M'], R),
  dataset('mortgage-rate-30-year', dataPath('dashboard-mortgage-rate-30-year'), ['PMMS-W'], RS, ['mortgage-rate-30-year', 'dashboard-mortgage-rate-30-year']),
  dataset('federal-budget-balance', dataPath('federal-budget-balance'), ['FISCAL'], R),
  dataset('federal-debt-held-by-public', dataPath('federal-debt-held-by-public'), ['FISCAL'], R),
  dataset('trade-balance-share-of-gdp', dataPath('trade-balance-share-of-gdp'), ['BEA-Q'], R),
  dataset('trade-goods-exports', dataPath('trade-goods-exports'), ['BEA-Q'], R),
  dataset('trade-goods-imports', dataPath('trade-goods-imports'), ['BEA-Q'], R),
  dataset('trade-services-exports', dataPath('trade-services-exports'), ['BEA-Q'], R),
  dataset('trade-services-imports', dataPath('trade-services-imports'), ['BEA-Q'], R),
  dataset('effective-tariff-burden', dataPath('effective-tariff-burden'), ['BEA-Q'], R),
  dataset('core-goods-pce-inflation', dataPath('core-goods-pce-inflation'), ['FED-RESEARCH'], R),
  dataset('dashboard-payroll-change', dataPath('dashboard-payroll-change'), ['BLS-EMP'], S),
  dataset('dashboard-sahm-rule-gap', dataPath('dashboard-sahm-rule-gap'), ['BLS-EMP'], S),
  dataset('dashboard-headline-cpi-inflation', dataPath('dashboard-headline-cpi-inflation'), ['BLS-CPI'], S),
  dataset('dashboard-sp500', dataPath('dashboard-sp500'), ['MARKET-D'], S),
  dataset('dashboard-high-yield-credit-spread', dataPath('dashboard-high-yield-credit-spread'), ['MARKET-D'], S),
  dataset('international-comparisons', dataPath('international-comparisons'), ['OECD'], C, []),
] as const satisfies readonly VisibleDatasetFreshnessDefinition[]

export const visibleDatasetFreshnessById = new Map(
  visibleDatasetFreshnessRegistry.map((definition) => [definition.datasetId, definition]),
)

const seriesSlugToDataset = new Map<string, VisibleDatasetFreshnessDefinition>()
for (const definition of visibleDatasetFreshnessRegistry) {
  for (const slug of definition.seriesSlugs) {
    if (seriesSlugToDataset.has(slug)) throw new Error(`Duplicate freshness series slug: ${slug}`)
    seriesSlugToDataset.set(slug, definition)
  }
}

export function freshnessDatasetForSeriesSlug(
  slug: string,
): VisibleDatasetFreshnessDefinition | null {
  return seriesSlugToDataset.get(slug) ?? null
}
