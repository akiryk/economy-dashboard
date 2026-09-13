import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { buildOecdUrl, createInternationalComparisonData, normalizeOecdMetric, oecdMetricConfigurations } from './oecd/internationalComparisons'
import {
  executeRegisteredRefreshUnit,
  logRefreshUnitResult,
} from './refresh/executeRegisteredRefreshUnit'
import { writeRefreshUnitResultFile } from './refresh/refreshUnitResultFile'

const OUTPUT = path.resolve('src/features/economic-series/data/international-comparisons.json')

async function fetchOecdCsv(
  url: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<string> {
  let response: Response
  try {
    response = await fetchImplementation(url, {
      headers: { Accept: 'text/csv' },
      signal: AbortSignal.timeout(30_000),
    })
  } catch (error: unknown) {
    throw new Error(
      `OECD transient fetch failure: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    )
  }
  if (response.ok) return response.text()
  if (response.status === 429 || response.status >= 500) {
    throw new Error(`OECD transient HTTP ${response.status}: ${url}`)
  }
  throw new Error(`OECD source/schema request failed with HTTP ${response.status}: ${url}`)
}

export async function refreshInternationalComparisons({
  retrievedAt,
  outputPath = OUTPUT,
  fetchImplementation = fetch,
}: {
  retrievedAt: string
  outputPath?: string
  fetchImplementation?: typeof fetch
}): Promise<void> {
  const csvResponses: string[] = []
  for (const config of oecdMetricConfigurations) {
    csvResponses.push(await fetchOecdCsv(buildOecdUrl(config), fetchImplementation))
  }
  await writeInternationalComparisonsFromCsv({ csvResponses, retrievedAt, outputPath })
}

export async function writeInternationalComparisonsFromCsv({
  csvResponses,
  retrievedAt,
  outputPath = OUTPUT,
}: {
  csvResponses: readonly string[]
  retrievedAt: string
  outputPath?: string
}): Promise<void> {
  if (csvResponses.length !== oecdMetricConfigurations.length) {
    throw new Error(`Expected ${oecdMetricConfigurations.length} OECD responses, received ${csvResponses.length}`)
  }
  const metrics = oecdMetricConfigurations.map((config, index) =>
    normalizeOecdMetric(csvResponses[index]!, config))
  const data = createInternationalComparisonData(metrics, retrievedAt)
  const temporaryPath = `${outputPath}.${process.pid}.${Date.now()}.tmp`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, outputPath)
  } catch (error: unknown) {
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
  console.log(`International comparisons: validated ${metrics.length} OECD metrics and updated ${outputPath}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await executeRegisteredRefreshUnit({
    unitId: 'oecd-international-comparisons',
    runner: async () => {
      await refreshInternationalComparisons({
        retrievedAt: new Date().toISOString().slice(0, 10),
      })
    },
  })
  logRefreshUnitResult(result)
  const resultsOutputIndex = process.argv.indexOf('--results-output')
  const resultsOutput = resultsOutputIndex >= 0
    ? process.argv[resultsOutputIndex + 1]
    : undefined
  if (resultsOutputIndex >= 0 && !resultsOutput) {
    throw new Error('--results-output requires a path')
  }
  if (resultsOutput) await writeRefreshUnitResultFile(resultsOutput, [result])
  if (result.status === 'failed' || result.status === 'skipped') {
    process.exitCode = 1
  }
}
