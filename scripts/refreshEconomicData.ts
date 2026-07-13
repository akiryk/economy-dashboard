import { loadEnvFile } from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { fetchFredObservations } from './fred/fredClient'
import { normalizeFredSeries } from './fred/normalizeFredSeries'
import { derivePayrollSeries } from './fred/derivePayrollSeries'
import {
  fredSeriesConfigurations,
  payrollSeriesConfiguration,
  type PayrollSeriesConfig,
  type FredSeriesConfig,
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
  return series
}

export type RefreshOutcome =
  | { status: 'updated'; config: FredSeriesConfig; series: Awaited<ReturnType<typeof refreshEconomicData>> }
  | { status: 'failed'; config: FredSeriesConfig; message: string }
  | {
      status: 'updated'
      config: PayrollSeriesConfig
      series: Awaited<ReturnType<typeof refreshPayrollData>>['payrollGrowth']
      supportingSeries: Awaited<ReturnType<typeof refreshPayrollData>>['monthlyChange']
    }
  | { status: 'failed'; config: PayrollSeriesConfig; message: string }

interface RefreshAllEconomicDataOptions {
  apiKey: string
  retrievedAt: string
  configurations?: readonly FredSeriesConfig[]
  payrollConfiguration?: PayrollSeriesConfig | false
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
  return series
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

  for (const config of configurations) {
    try {
      const series = await refreshEconomicData({
        apiKey,
        outputPath: path.resolve(config.outputFile),
        retrievedAt,
        config,
        fetchImplementation,
      })
      outcomes.push({ status: 'updated', config, series })
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
      const { payrollGrowth, monthlyChange } = await refreshPayrollData({
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
      })
    } catch (error: unknown) {
      outcomes.push({
        status: 'failed',
        config: payrollConfig,
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
        `Failed ${outcome.config.providerSeriesId}: ${outcome.message}`,
      )
      continue
    }

    const { series } = outcome
    const latest = series.observations.at(-1)
    console.log(`Refreshed ${series.providerSeriesId}`)
    console.log(`Transformation: ${series.transformation}`)
    console.log(`Observations: ${series.observations.length}`)
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
      console.log(
        `Outputs: ${path.resolve(outcome.config.payrollGrowthOutputFile)}, ${path.resolve(outcome.config.monthlyChangeOutputFile)}`,
      )
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
