import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { refreshCategoryCpiSeries } from './bls/ingestCategoryCpiSeries'
import { refreshInflationContributions } from './bls/inflationContributionAutomation'

export async function refreshInflationDriversData({
  rootDirectory = process.cwd(),
  retrievedAt = new Date().toISOString().slice(0, 10),
  fetchImplementation = fetch,
  mode = 'all',
}: {
  rootDirectory?: string
  retrievedAt?: string
  fetchImplementation?: typeof fetch
  mode?: 'all' | 'contributions-only' | 'categories-only'
} = {}): Promise<void> {
  const dataDirectory = path.join(
    rootDirectory,
    'src/features/economic-series/data',
  )
  if (mode !== 'categories-only') {
    await refreshInflationContributions({
      historyPath: path.join(dataDirectory, 'inflation-contribution-history.json'),
      snapshotPath: path.join(dataDirectory, 'inflation-contributions.json'),
      fetchImplementation,
    })
  }
  if (mode !== 'contributions-only') {
    await refreshCategoryCpiSeries({
      outputDirectory: dataDirectory,
      retrievedAt,
      fetchImplementation,
    })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv.includes('--contributions-only')
    ? 'contributions-only'
    : process.argv.includes('--categories-only') ? 'categories-only' : 'all'
  refreshInflationDriversData({ mode }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
