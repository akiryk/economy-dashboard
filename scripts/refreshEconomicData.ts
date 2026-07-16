import { loadEnvFile } from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { fetchFredObservations } from './fred/fredClient'
import { normalizeFredSeries } from './fred/normalizeFredSeries'
import { derivePayrollSeries } from './fred/derivePayrollSeries'
import { deriveWageSeries } from './fred/deriveWageSeries'
import { deriveQuarterlyGrowthSeries } from './fred/deriveQuarterlyGrowthSeries'
import {
  deriveCpiSeries,
  deriveSingleMonthlyGrowthSeries,
} from './fred/deriveCpiSeries'
import {
  cpiSeriesConfiguration,
  fredSeriesConfigurations,
  payrollSeriesConfiguration,
  wageSeriesConfiguration,
  type PayrollSeriesConfig,
  type FredSeriesConfig,
  type WageSeriesConfig,
  type CpiSeriesConfig,
  householdComparisonConfiguration,
  personalSavingRateConfiguration,
  type HouseholdComparisonConfig,
  productivitySeriesConfiguration,
  type ProductivitySeriesConfig,
} from './fred/seriesConfigurations'
import {
  writeEconomicSeriesAtomically,
  writeEconomicSeriesGroupAtomically,
} from './writeEconomicSeries'
import {
  fetchHoamWorkbook,
  hoamConfiguration,
  parseHoamWorkbook,
  type HoamConfiguration,
} from './atlantaFed/hoamWorkbook'

export interface RefreshEconomicDataOptions {
  apiKey: string
  outputPath: string
  retrievedAt: string
  config?: FredSeriesConfig
  fetchImplementation?: typeof fetch
}

export async function refreshEconomicData({
  apiKey,
  outputPath: targetPath,
  retrievedAt,
  config = fredSeriesConfigurations[0]!,
  fetchImplementation,
}: RefreshEconomicDataOptions) {
  const fredResponse = await fetchFredObservations(
    apiKey,
    config,
    fetchImplementation,
  )
  const series =
    config.localDerivation === 'year-over-year-monthly-growth'
      ? deriveSingleMonthlyGrowthSeries(fredResponse, retrievedAt, config)
      : config.dataHandling === 'locally-derived'
      ? deriveQuarterlyGrowthSeries(fredResponse, retrievedAt, config)
      : normalizeFredSeries(fredResponse, retrievedAt, config)
  await writeEconomicSeriesAtomically(targetPath, series)
  return { series, sourceObservationCount: fredResponse.observations.length }
}

export type RefreshOutcome =
  | {
      status: 'updated'
      config: FredSeriesConfig
      series: Awaited<ReturnType<typeof refreshEconomicData>>['series']
      sourceObservationCount: number
    }
  | { status: 'failed'; config: FredSeriesConfig; message: string }
  | {
      status: 'updated'
      config: PayrollSeriesConfig
      series: Awaited<ReturnType<typeof refreshPayrollData>>['payrollGrowth']
      supportingSeries: Awaited<ReturnType<typeof refreshPayrollData>>['monthlyChange']
      sourceObservationCount: number
    }
  | { status: 'failed'; config: PayrollSeriesConfig; message: string }
  | {
      status: 'updated'
      config: WageSeriesConfig
      series: Awaited<ReturnType<typeof refreshWageData>>['realWageGrowth']
      supportingSeries: Awaited<ReturnType<typeof refreshWageData>>['nominalWageGrowth']
      sourceObservationCount: number
    }
  | { status: 'failed'; config: WageSeriesConfig; message: string }
  | {
      status: 'updated'
      config: CpiSeriesConfig
      series: Awaited<ReturnType<typeof refreshCpiData>>['headlineInflation']
      relatedSeries: EconomicSeries[]
      sourceObservationCount: number
      coreSourceObservationCount: number
    }
  | { status: 'failed'; config: CpiSeriesConfig; message: string }
  | {
      status: 'updated'
      config: HoamConfiguration
      series: EconomicSeries
      sourceObservationCount: number
    }
  | { status: 'failed'; config: HoamConfiguration; message: string }

interface RefreshAllEconomicDataOptions {
  apiKey: string
  retrievedAt: string
  configurations?: readonly FredSeriesConfig[]
  payrollConfiguration?: PayrollSeriesConfig | false
  wageConfiguration?: WageSeriesConfig | false
  cpiConfiguration?: CpiSeriesConfig | false
  householdConfiguration?: HouseholdComparisonConfig | false
  savingRateConfiguration?: FredSeriesConfig | false
  productivityConfiguration?: ProductivitySeriesConfig | false
  hoamConfiguration?: HoamConfiguration | false
  fetchImplementation?: typeof fetch
}

type EconomicSeries = Awaited<ReturnType<typeof refreshEconomicData>>['series']

export async function refreshCpiData({
  apiKey,
  retrievedAt,
  config = cpiSeriesConfiguration,
  fetchImplementation,
}: {
  apiKey: string
  retrievedAt: string
  config?: CpiSeriesConfig
  fetchImplementation?: typeof fetch
}) {
  const [headlineResponse, coreResponse] = await Promise.all([
    fetchFredObservations(apiKey, config.headlineSource, fetchImplementation),
    fetchFredObservations(apiKey, config.coreSource, fetchImplementation),
  ])
  const series = deriveCpiSeries(
    headlineResponse,
    coreResponse,
    retrievedAt,
    config,
  )
  await writeEconomicSeriesGroupAtomically([
    {
      outputPath: path.resolve(config.headlineInflationOutputFile),
      series: series.headlineInflation,
    },
    {
      outputPath: path.resolve(config.coreInflationOutputFile),
      series: series.coreInflation,
    },
    {
      outputPath: path.resolve(config.headlineMomentumOutputFile),
      series: series.headlineMomentum,
    },
    {
      outputPath: path.resolve(config.coreMomentumOutputFile),
      series: series.coreMomentum,
    },
  ])
  return {
    ...series,
    sourceObservationCount: headlineResponse.observations.length,
    coreSourceObservationCount: coreResponse.observations.length,
  }
}

export async function refreshPayrollData({
  apiKey,
  retrievedAt,
  config = payrollSeriesConfiguration,
  fetchImplementation,
}: {
  apiKey: string
  retrievedAt: string
  config?: PayrollSeriesConfig
  fetchImplementation?: typeof fetch
}) {
  const response = await fetchFredObservations(
    apiKey,
    config,
    fetchImplementation,
  )
  const series = derivePayrollSeries(response, retrievedAt, config)
  await writeEconomicSeriesGroupAtomically([
    {
      outputPath: path.resolve(config.monthlyChangeOutputFile),
      series: series.monthlyChange,
    },
    {
      outputPath: path.resolve(config.payrollGrowthOutputFile),
      series: series.payrollGrowth,
    },
  ])
  return {
    ...series,
    sourceObservationCount: response.observations.length,
  }
}

export async function refreshWageData({
  apiKey,
  retrievedAt,
  cpiInflation,
  config = wageSeriesConfiguration,
  fetchImplementation,
}: {
  apiKey: string
  retrievedAt: string
  cpiInflation: Awaited<ReturnType<typeof refreshEconomicData>>['series']
  config?: WageSeriesConfig
  fetchImplementation?: typeof fetch
}) {
  const response = await fetchFredObservations(
    apiKey,
    config,
    fetchImplementation,
  )
  const series = deriveWageSeries(response, cpiInflation, retrievedAt, config)
  await writeEconomicSeriesGroupAtomically([
    {
      outputPath: path.resolve(config.nominalOutputFile),
      series: series.nominalWageGrowth,
    },
    {
      outputPath: path.resolve(config.realOutputFile),
      series: series.realWageGrowth,
    },
  ])
  return { ...series, sourceObservationCount: response.observations.length }
}

export async function refreshHouseholdComparisonData({
  apiKey,
  retrievedAt,
  config = householdComparisonConfiguration,
  fetchImplementation,
}: {
  apiKey: string
  retrievedAt: string
  config?: HouseholdComparisonConfig
  fetchImplementation?: typeof fetch
}) {
  const [incomeResponse, spendingResponse] = await Promise.all([
    fetchFredObservations(apiKey, config.incomeSource, fetchImplementation),
    fetchFredObservations(apiKey, config.spendingSource, fetchImplementation),
  ])
  const incomeGrowth = deriveSingleMonthlyGrowthSeries(
    incomeResponse,
    retrievedAt,
    config.incomeSource,
  )
  const spendingGrowth = deriveSingleMonthlyGrowthSeries(
    spendingResponse,
    retrievedAt,
    config.spendingSource,
  )
  await writeEconomicSeriesGroupAtomically([
    { outputPath: path.resolve(config.incomeOutputFile), series: incomeGrowth },
    { outputPath: path.resolve(config.spendingOutputFile), series: spendingGrowth },
  ])
  return {
    incomeGrowth,
    spendingGrowth,
    sourceObservationCount: incomeResponse.observations.length,
    spendingSourceObservationCount: spendingResponse.observations.length,
  }
}

export async function refreshProductivityData({
  apiKey,
  retrievedAt,
  config = productivitySeriesConfiguration,
  fetchImplementation,
}: {
  apiKey: string
  retrievedAt: string
  config?: ProductivitySeriesConfig
  fetchImplementation?: typeof fetch
}) {
  const response = await fetchFredObservations(
    apiKey,
    config.levelSource,
    fetchImplementation,
  )
  const level = normalizeFredSeries(response, retrievedAt, config.levelSource)
  const growth = deriveQuarterlyGrowthSeries(
    response,
    retrievedAt,
    config.growthSource,
  )
  await writeEconomicSeriesGroupAtomically([
    { outputPath: path.resolve(config.levelOutputFile), series: level },
    { outputPath: path.resolve(config.growthOutputFile), series: growth },
  ])
  return {
    level,
    growth,
    sourceObservationCount: response.observations.length,
  }
}

export async function refreshHoamData({
  retrievedAt,
  config = hoamConfiguration,
  fetchImplementation,
}: {
  retrievedAt: string
  config?: HoamConfiguration
  fetchImplementation?: typeof fetch
}) {
  const workbook = await fetchHoamWorkbook(fetchImplementation)
  const series = parseHoamWorkbook(workbook, retrievedAt, config)
  await writeEconomicSeriesAtomically(path.resolve(config.outputFile), series)
  return { series, sourceObservationCount: series.observations.length }
}

export async function refreshAllEconomicData(
  options: RefreshAllEconomicDataOptions,
): Promise<RefreshOutcome[]> {
  const {
    apiKey,
    retrievedAt,
    configurations = fredSeriesConfigurations,
    fetchImplementation,
  } = options
  const outcomes: RefreshOutcome[] = []
  let cpiInflation: Awaited<ReturnType<typeof refreshEconomicData>>['series'] | null =
    null

  const cpiConfig =
    options.cpiConfiguration === undefined
      ? options.configurations === undefined
        ? cpiSeriesConfiguration
        : false
      : options.cpiConfiguration

  for (const config of configurations) {
    if (cpiConfig && config.providerSeriesId === 'CPIAUCSL') continue
    if (
      options.configurations === undefined &&
      config.providerSeriesId === 'OPHNFB'
    ) continue
    try {
      const { series, sourceObservationCount } = await refreshEconomicData({
        apiKey,
        outputPath: path.resolve(config.outputFile),
        retrievedAt,
        config,
        fetchImplementation,
      })
      outcomes.push({ status: 'updated', config, series, sourceObservationCount })
      if (config.providerSeriesId === 'CPIAUCSL') cpiInflation = series
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  if (cpiConfig) {
    try {
      const {
        headlineInflation,
        coreInflation,
        headlineMomentum,
        coreMomentum,
        sourceObservationCount,
        coreSourceObservationCount,
      } = await refreshCpiData({
        apiKey,
        retrievedAt,
        config: cpiConfig,
        fetchImplementation,
      })
      cpiInflation = headlineInflation
      outcomes.push({
        status: 'updated',
        config: cpiConfig,
        series: headlineInflation,
        relatedSeries: [coreInflation, headlineMomentum, coreMomentum],
        sourceObservationCount,
        coreSourceObservationCount,
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: cpiConfig,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  const payrollConfig =
    options.payrollConfiguration === undefined
      ? options.configurations === undefined
        ? payrollSeriesConfiguration
        : false
      : options.payrollConfiguration

  if (payrollConfig) {
    try {
      const { payrollGrowth, monthlyChange, sourceObservationCount } =
        await refreshPayrollData({
        apiKey,
        retrievedAt,
        config: payrollConfig,
        fetchImplementation,
        })
      outcomes.push({
        status: 'updated',
        config: payrollConfig,
        series: payrollGrowth,
        supportingSeries: monthlyChange,
        sourceObservationCount,
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: payrollConfig,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  const wageConfig =
    options.wageConfiguration === undefined
      ? options.configurations === undefined
        ? wageSeriesConfiguration
        : false
      : options.wageConfiguration

  if (wageConfig) {
    if (!cpiInflation) {
      outcomes.push({
        status: 'failed',
        config: wageConfig,
        message: 'CPI inflation is required to derive real wage growth',
      })
    } else {
      try {
        const {
          realWageGrowth,
          nominalWageGrowth,
          sourceObservationCount,
        } = await refreshWageData({
          apiKey,
          retrievedAt,
          cpiInflation,
          config: wageConfig,
          fetchImplementation,
        })
        outcomes.push({
          status: 'updated',
          config: wageConfig,
          series: realWageGrowth,
          supportingSeries: nominalWageGrowth,
          sourceObservationCount,
        })
      } catch (error: unknown) {
        outcomes.push({
          status: 'failed',
          config: wageConfig,
          message: error instanceof Error ? error.message : 'Unknown failure',
        })
      }
    }
  }

  const householdConfig =
    options.householdConfiguration === undefined
      ? options.configurations === undefined
        ? householdComparisonConfiguration
        : false
      : options.householdConfiguration
  if (householdConfig) {
    try {
      const result = await refreshHouseholdComparisonData({
        apiKey,
        retrievedAt,
        config: householdConfig,
        fetchImplementation,
      })
      outcomes.push({
        status: 'updated',
        config: householdConfig.incomeSource,
        series: result.incomeGrowth,
        sourceObservationCount: result.sourceObservationCount,
      })
      outcomes.push({
        status: 'updated',
        config: householdConfig.spendingSource,
        series: result.spendingGrowth,
        sourceObservationCount: result.spendingSourceObservationCount,
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: householdConfig.incomeSource,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  const savingConfig =
    options.savingRateConfiguration === undefined
      ? options.configurations === undefined
        ? personalSavingRateConfiguration
        : false
      : options.savingRateConfiguration
  if (savingConfig) {
    try {
      const result = await refreshEconomicData({
        apiKey,
        outputPath: path.resolve(savingConfig.outputFile),
        retrievedAt,
        config: savingConfig,
        fetchImplementation,
      })
      outcomes.push({
        status: 'updated',
        config: savingConfig,
        series: result.series,
        sourceObservationCount: result.sourceObservationCount,
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: savingConfig,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  const productivityConfig =
    options.productivityConfiguration === undefined
      ? options.configurations === undefined
        ? productivitySeriesConfiguration
        : false
      : options.productivityConfiguration
  if (productivityConfig) {
    try {
      const { level, growth, sourceObservationCount } =
        await refreshProductivityData({
          apiKey,
          retrievedAt,
          config: productivityConfig,
          fetchImplementation,
        })
      outcomes.push({
        status: 'updated',
        config: productivityConfig.levelSource,
        series: level,
        sourceObservationCount,
      })
      outcomes.push({
        status: 'updated',
        config: productivityConfig.growthSource,
        series: growth,
        sourceObservationCount,
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: productivityConfig.growthSource,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  const hoamConfig =
    options.hoamConfiguration === undefined
      ? options.configurations === undefined
        ? hoamConfiguration
        : false
      : options.hoamConfiguration
  if (hoamConfig) {
    try {
      const result = await refreshHoamData({
        retrievedAt,
        config: hoamConfig,
        fetchImplementation,
      })
      outcomes.push({
        status: 'updated',
        config: hoamConfig,
        series: result.series,
        sourceObservationCount: result.sourceObservationCount,
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: hoamConfig,
        message: error instanceof Error ? error.message : 'Unknown failure',
      })
    }
  }

  return outcomes
}

function loadLocalEnvironment(): void {
  try {
    loadEnvFile('.env')
  } catch (error: unknown) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ENOENT'
    ) {
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

  const retrievedAt = new Date().toISOString().slice(0, 10)
  const outcomes = await refreshAllEconomicData({
    apiKey,
    retrievedAt,
  })

  for (const outcome of outcomes) {
    if (outcome.status === 'failed') {
      console.error(
        `Failed ${
          outcome.config.dataHandling === 'cpi-derived'
            ? 'CPIAUCSL/CPILFESL'
            : outcome.config.dataHandling === 'hoam-provider'
              ? 'Atlanta Fed HOAM'
              : outcome.config.providerSeriesId
        }: ${outcome.message}`,
      )
      continue
    }

    const { series } = outcome
    const latest = series.observations.at(-1)
    console.log(`Refreshed ${series.providerSeriesId}`)
    console.log(`Transformation: ${series.transformation}`)
    console.log(`Source observations: ${outcome.sourceObservationCount}`)
    console.log(`Generated observations: ${series.observations.length}`)
    console.log(
      `Range: ${series.observations[0]?.date} to ${latest?.date ?? 'unavailable'}`,
    )
    console.log(
      `Latest: ${latest?.date ?? 'unavailable'} (${latest?.value ?? 'missing'})`,
    )
    if ('relatedSeries' in outcome) {
      for (const related of outcome.relatedSeries) {
        console.log(
          `Related output: ${related.slug}, ${related.observations.length} observations, ${related.observations[0]?.date} to ${related.observations.at(-1)?.date}`,
        )
      }
      console.log(`Core source observations: ${outcome.coreSourceObservationCount}`)
      console.log(
        `Outputs: ${[
          outcome.config.headlineInflationOutputFile,
          outcome.config.coreInflationOutputFile,
          outcome.config.headlineMomentumOutputFile,
          outcome.config.coreMomentumOutputFile,
        ].map((file) => path.resolve(file)).join(', ')}`,
      )
    } else if ('supportingSeries' in outcome) {
      const supporting = outcome.supportingSeries
      console.log(
        `Supporting range: ${supporting.observations[0]?.date} to ${supporting.observations.at(-1)?.date ?? 'unavailable'}`,
      )
      if (outcome.config.dataHandling === 'locally-derived') {
        console.log(
          `Outputs: ${path.resolve(outcome.config.payrollGrowthOutputFile)}, ${path.resolve(outcome.config.monthlyChangeOutputFile)}`,
        )
      } else {
        console.log(
          `Outputs: ${path.resolve(outcome.config.realOutputFile)}, ${path.resolve(outcome.config.nominalOutputFile)}`,
        )
      }
    } else {
      console.log(`Output: ${path.resolve(outcome.config.outputFile)}`)
    }
  }

  if (outcomes.some((outcome) => outcome.status === 'failed')) {
    process.exitCode = 1
  }
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown failure'
    console.error(`Economic data refresh failed: ${message}`)
    process.exitCode = 1
  })
}
