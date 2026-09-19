import { loadEnvFile } from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { visibleDatasetFreshnessRegistry } from '../src/features/data-freshness/freshnessRegistry'
import { refreshSavingRateDistribution } from './bea/savingRateDistribution'
import { refreshHomeConstructionCostIndex } from './census/homeConstructionCostIndex'
import { refreshCategoryCpiSeries } from './bls/ingestCategoryCpiSeries'
import {
  executeRefreshUnits,
  type RefreshUnitRunner,
} from './refresh/executeRefreshUnits'
import { logRefreshUnitResult } from './refresh/executeRegisteredRefreshUnit'
import {
  validateRefreshUnitCoverage,
  type RefreshUnitResult,
} from './refresh/refreshUnit'
import { refreshUnitRegistry } from './refresh/refreshUnitRegistry'
import { writeRefreshUnitResultFile } from './refresh/refreshUnitResultFile'
import { refreshCoreGoodsPceInflation } from './refreshCoreGoodsPceInflation'
import {
  refreshBusinessInvestmentData,
  refreshCorporateProfitShareData,
  refreshCpiData,
  refreshEconomicData,
  refreshHoamData,
  refreshHouseholdComparisonData,
  refreshPayrollData,
  refreshProductivityData,
  refreshPurchasingPowerData,
  refreshTariffBurdenData,
  refreshWageData,
} from './refreshEconomicData'
import { refreshHousingConstructionDetails } from './refreshHousingConstructionDetails'
import {
  corporateProfitShareConfiguration,
  cpiSeriesConfiguration,
  fredSeriesConfigurations,
  householdComparisonConfiguration,
  payrollSeriesConfiguration,
  personalSavingRateConfiguration,
  productivitySeriesConfiguration,
  purchasingPowerSeriesConfiguration,
  tariffBurdenConfiguration,
  wageSeriesConfiguration,
} from './fred/seriesConfigurations'

interface ScheduledRefreshOptions {
  apiKey: string
  retrievedAt: string
  fetchImplementation?: typeof fetch
  maximumAttempts?: number
  retryDelaysMilliseconds?: readonly number[]
  delay?: (milliseconds: number) => Promise<void>
  now?: () => Date
}

export type ScheduledRefreshCompletion = 'complete' | 'partial-success'

interface RunScheduledRefreshCommandOptions {
  refresh?: (options: ScheduledRefreshOptions) => Promise<RefreshUnitResult[]>
  logResult?: (result: RefreshUnitResult) => void
  warn?: (message: string) => void
  recordResults?: (results: readonly RefreshUnitResult[]) => Promise<void>
}

export function classifyScheduledRefreshCompletion(
  results: readonly RefreshUnitResult[],
): ScheduledRefreshCompletion {
  return results.some(({ status }) => status === 'failed' || status === 'skipped')
    ? 'partial-success'
    : 'complete'
}

export async function runScheduledRefreshCommand(
  options: ScheduledRefreshOptions,
  {
    refresh = refreshScheduledData,
    logResult = logRefreshUnitResult,
    warn = console.warn,
    recordResults = async () => undefined,
  }: RunScheduledRefreshCommandOptions = {},
): Promise<ScheduledRefreshCompletion> {
  const results = await refresh(options)
  for (const result of results) {
    logResult(result)
  }
  await recordResults(results)

  const completion = classifyScheduledRefreshCompletion(results)
  if (completion === 'partial-success') {
    const affectedUnitIds = results
      .filter(({ status }) => status === 'failed' || status === 'skipped')
      .map(({ unitId }) => unitId)
    warn(
      `Scheduled refresh completed with preserved scoped failures: ${affectedUnitIds.join(', ')}`,
    )
  }
  return completion
}

export function createScheduledRefreshRunners({
  apiKey,
  retrievedAt,
  fetchImplementation = fetch,
}: Pick<ScheduledRefreshOptions,
  'apiKey' | 'retrievedAt' | 'fetchImplementation'>): Map<string, RefreshUnitRunner> {
  const runners = new Map<string, RefreshUnitRunner>()
  const scheduledUnitIds = new Set(refreshUnitRegistry
    .filter(({ execution }) => execution === 'scheduled')
    .map(({ id }) => id))

  for (const config of fredSeriesConfigurations) {
    const unitId = `fred-${config.slug}`
    if (!scheduledUnitIds.has(unitId)) continue
    runners.set(unitId, async () => {
      await refreshEconomicData({
        apiKey,
        outputPath: path.resolve(config.outputFile),
        retrievedAt,
        config,
        fetchImplementation,
      })
    })
  }

  let cpiInflation: Awaited<ReturnType<typeof refreshCpiData>>[
    'headlineSeasonallyAdjustedInflation'
  ] | null = null

  runners.set('fred-cpi', async () => {
    const result = await refreshCpiData({
      apiKey,
      retrievedAt,
      config: cpiSeriesConfiguration,
      fetchImplementation,
    })
    cpiInflation = result.headlineSeasonallyAdjustedInflation
  })
  runners.set('fred-payroll-growth', async () => {
    await refreshPayrollData({
      apiKey,
      retrievedAt,
      config: payrollSeriesConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-real-wage-growth', async () => {
    if (!cpiInflation) {
      throw new Error('CPI refresh result is required to derive real wage growth')
    }
    await refreshWageData({
      apiKey,
      retrievedAt,
      cpiInflation,
      config: wageSeriesConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-purchasing-power', async () => {
    await refreshPurchasingPowerData({
      apiKey,
      retrievedAt,
      config: purchasingPowerSeriesConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-household-income-spending', async () => {
    await refreshHouseholdComparisonData({
      apiKey,
      retrievedAt,
      config: householdComparisonConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-corporate-profit-share', async () => {
    await refreshCorporateProfitShareData({
      apiKey,
      retrievedAt,
      config: corporateProfitShareConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-effective-tariff-burden', async () => {
    await refreshTariffBurdenData({
      apiKey,
      retrievedAt,
      config: tariffBurdenConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-personal-saving-rate', async () => {
    await refreshEconomicData({
      apiKey,
      outputPath: path.resolve(personalSavingRateConfiguration.outputFile),
      retrievedAt,
      config: personalSavingRateConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-productivity', async () => {
    await refreshProductivityData({
      apiKey,
      retrievedAt,
      config: productivitySeriesConfiguration,
      fetchImplementation,
    })
  })
  runners.set('fred-business-investment', async () => {
    await refreshBusinessInvestmentData({ apiKey, retrievedAt, fetchImplementation })
  })
  runners.set('atlanta-fed-home-ownership-affordability', async () => {
    await refreshHoamData({ retrievedAt, fetchImplementation })
  })
  runners.set('bls-category-cpi', async () => {
    await refreshCategoryCpiSeries({
      outputDirectory: path.resolve('src/features/economic-series/data'),
      retrievedAt,
      fetchImplementation,
    })
  })
  runners.set('bea-saving-rate-distribution', async () => {
    await refreshSavingRateDistribution({
      retrievedAt,
      outputFile: path.resolve(
        'src/features/economic-series/data/saving-rate-by-income-decile.json',
      ),
      fetchImplementation,
    })
  })
  runners.set('census-hud-housing-details', async () => {
    await refreshHousingConstructionDetails({
      outputPath: path.resolve(
        'src/features/economic-series/data/housing-construction-details.json',
      ),
      compositionOutputPath: path.resolve(
        'src/features/economic-series/data/housing-supply-composition.json',
      ),
      retrievedAt,
      fetchImplementation,
    })
  })
  runners.set('census-hud-home-construction-cost', async () => {
    await refreshHomeConstructionCostIndex({ retrievedAt, fetchImplementation })
  })
  runners.set('federal-reserve-core-goods-pce', async () => {
    await refreshCoreGoodsPceInflation({
      fetchImplementation,
      outputPath: path.resolve(
        'src/features/economic-series/data/core-goods-pce-inflation.json',
      ),
      retrievedAt,
    })
  })

  return runners
}

export async function refreshScheduledData(
  options: ScheduledRefreshOptions,
): Promise<RefreshUnitResult[]> {
  const coverageIssues = validateRefreshUnitCoverage(
    refreshUnitRegistry,
    visibleDatasetFreshnessRegistry,
  )
  if (coverageIssues.length > 0) {
    throw new Error(
      `Invalid refresh-unit configuration: ${coverageIssues.map(({ message }) => message).join('; ')}`,
    )
  }

  const scheduledUnits = refreshUnitRegistry.filter(
    ({ execution }) => execution === 'scheduled',
  )
  return executeRefreshUnits({
    units: scheduledUnits,
    runners: createScheduledRefreshRunners(options),
    maximumAttempts: options.maximumAttempts,
    retryDelaysMilliseconds: options.retryDelaysMilliseconds,
    delay: options.delay,
    now: options.now,
  })
}

function loadLocalEnvironment(): void {
  try {
    loadEnvFile('.env')
  } catch (error: unknown) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error
    }
  }
}

async function main(): Promise<void> {
  loadLocalEnvironment()
  const apiKey = process.env.FRED_API_KEY
  if (!apiKey) {
    throw new Error(
      'FRED_API_KEY is required to refresh data. Add it to .env or export it in your shell.',
    )
  }

  const resultsOutputIndex = process.argv.indexOf('--results-output')
  const resultsOutput = resultsOutputIndex >= 0
    ? process.argv[resultsOutputIndex + 1]
    : undefined
  if (resultsOutputIndex >= 0 && !resultsOutput) {
    throw new Error('--results-output requires a path')
  }

  await runScheduledRefreshCommand({
    apiKey,
    retrievedAt: new Date().toISOString().slice(0, 10),
  }, {
    recordResults: resultsOutput
      ? (results) => writeRefreshUnitResultFile(resultsOutput, results)
      : undefined,
  })
}

const isDirectExecution = process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  main().catch((error: unknown) => {
    console.error(
      `Scheduled economic data refresh failed: ${error instanceof Error ? error.message : 'Unknown failure'}`,
    )
    process.exitCode = 1
  })
}
