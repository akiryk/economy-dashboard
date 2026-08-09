import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { createCoreGoodsPceInflationSeries, coreGoodsPceSourceUrl } from './federalReserve/coreGoodsPceInflation'
import { writeEconomicSeriesAtomically } from './writeEconomicSeries'

export async function refreshCoreGoodsPceInflation(fetchImplementation: typeof fetch = fetch) {
  const response = await fetchImplementation(coreGoodsPceSourceUrl)
  if (!response.ok) throw new Error(`Federal Reserve request failed with HTTP ${response.status}.`)
  const series = createCoreGoodsPceInflationSeries(await response.text(), new Date().toISOString().slice(0, 10))
  await writeEconomicSeriesAtomically(path.resolve('src/features/economic-series/data/core-goods-pce-inflation.json'), series)
  return series
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const localFixture = process.argv[2]
  const series = localFixture
    ? createCoreGoodsPceInflationSeries(await readFile(localFixture, 'utf8'), new Date().toISOString().slice(0, 10))
    : await refreshCoreGoodsPceInflation()
  if (localFixture) await writeEconomicSeriesAtomically(path.resolve('src/features/economic-series/data/core-goods-pce-inflation.json'), series)
  console.log(`Updated ${series.slug} with ${series.observations.length} observations.`)
}
