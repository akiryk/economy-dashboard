import { pathToFileURL } from 'node:url'
import { refreshSavingRateDistribution } from './bea/savingRateDistribution'

async function main() {
  const data = await refreshSavingRateDistribution({
    retrievedAt: new Date().toISOString().slice(0, 10),
  })
  const years = [...new Set(data.observations.map(({ year }) => year))]
  const statuses = [...new Set(data.observations.map(({ status }) => status))]
  console.log(`Refreshed BEA saving-rate distribution: ${Math.min(...years)}–${Math.max(...years)}; ${data.observations.length} observations; statuses: ${statuses.join(', ')}.`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(`BEA saving-rate distribution refresh failed: ${error instanceof Error ? error.message : 'Unknown failure'}`)
    process.exitCode = 1
  })
}
