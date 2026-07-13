import { loadEnvFile } from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { fetchFredObservations } from './fred/fredClient'
import { normalizeFredSeries } from './fred/normalizeFredSeries'
import { derivePayrollSeries } from './fred/derivePayrollSeries'
import { deriveWageSeries } from './fred/deriveWageSeries'
import {
  fredSeriesConfigurations,
  payrollSeriesConfiguration,
  wageSeriesConfiguration,
  type PayrollSeriesConfig,
  type FredSeriesConfig,
  type WageSeriesConfig,
} from './fred/seriesConfigurations'
import {
  writeEconomicSeriesAtomically,
  writeEconomicSeriesGroupAtomically,
} from './writeEconomicSeries'

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
  const series = normalizeFredSeries(fredResponse, retrievedAt, config)
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

interface RefreshAllEconomicDataOptions {
  apiKey: string
  retrievedAt: string
  configurations?: readonly FredSeriesConfig[]
  payrollConfiguration?: PayrollSeriesConfig | false
  wageConfiguration?: WageSeriesConfig | false
  fetchImplementation?: typeof fetch
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

  for (const config of configurations) {
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
        `Failed ${outcome.config.providerSeriesId}: ${outcome.message}`,
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
    if ('supportingSeries' in outcome) {
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
