import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { buildOecdUrl, createInternationalComparisonData, normalizeOecdMetric, oecdMetricConfigurations } from './oecd/internationalComparisons'

const OUTPUT = path.resolve('src/features/economic-series/data/international-comparisons.json')
const MAX_ATTEMPTS = 3

async function fetchWithRetry(url: string, fetchImplementation: typeof fetch = fetch): Promise<string> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let response: Response
    try {
      response = await fetchImplementation(url, { headers: { Accept: 'text/csv' }, signal: AbortSignal.timeout(30_000) })
    } catch (error: unknown) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(`OECD transient fetch failure after ${attempt} attempts: ${error instanceof Error ? error.message : String(error)}`, { cause: error })
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 500))
      continue
    }
    if (response.ok) return response.text()
    if (response.status !== 429 && response.status < 500) {
      throw new Error(`OECD source/schema request failed with HTTP ${response.status}: ${url}`)
    }
    if (attempt === MAX_ATTEMPTS) throw new Error(`OECD transient HTTP ${response.status} after ${attempt} attempts: ${url}`)
    const retryAfter = Number(response.headers.get('retry-after'))
    await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 500))
  }
  throw new Error('OECD fetch retry loop ended unexpectedly')
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
    csvResponses.push(await fetchWithRetry(buildOecdUrl(config), fetchImplementation))
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
  await refreshInternationalComparisons({ retrievedAt: new Date().toISOString().slice(0, 10) })
}
