import { loadEnvFile } from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { fetchFredObservations } from './fred/fredClient'
import { normalizeFredSeries } from './fred/normalizeFredSeries'
import { writeEconomicSeriesAtomically } from './writeEconomicSeries'

const outputPath = path.resolve(
  'src/features/economic-series/data/real-gdp-growth.json',
)

export interface RefreshEconomicDataOptions {
  apiKey: string
  outputPath: string
  retrievedAt: string
  fetchImplementation?: typeof fetch
}

export async function refreshEconomicData({
  apiKey,
  outputPath: targetPath,
  retrievedAt,
  fetchImplementation,
}: RefreshEconomicDataOptions) {
  const fredResponse = await fetchFredObservations(apiKey, fetchImplementation)
  const series = normalizeFredSeries(fredResponse, retrievedAt)
  await writeEconomicSeriesAtomically(targetPath, series)
  return series
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
  const series = await refreshEconomicData({
    apiKey,
    outputPath,
    retrievedAt,
  })
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
  console.log(`Output: ${outputPath}`)
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
