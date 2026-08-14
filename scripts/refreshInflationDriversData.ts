import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { refreshCategoryCpiSeries } from './bls/ingestCategoryCpiSeries'
import { refreshInflationContributions } from './bls/inflationContributionAutomation'

export async function refreshInflationDriversData({
  rootDirectory = process.cwd(),
  retrievedAt = new Date().toISOString().slice(0, 10),
  fetchImplementation = fetch,
}: {
  rootDirectory?: string
  retrievedAt?: string
  fetchImplementation?: typeof fetch
} = {}): Promise<void> {
  const dataDirectory = path.join(
    rootDirectory,
    'src/features/economic-series/data',
  )
  await refreshInflationContributions({
    historyPath: path.join(dataDirectory, 'inflation-contribution-history.json'),
    snapshotPath: path.join(dataDirectory, 'inflation-contributions.json'),
    fetchImplementation,
  })
  await refreshCategoryCpiSeries({
    outputDirectory: dataDirectory,
    retrievedAt,
    fetchImplementation,
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  refreshInflationDriversData().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
