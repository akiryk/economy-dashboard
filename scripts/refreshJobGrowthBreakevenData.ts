import { loadEnvFile } from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  buildBreakevenEmploymentDataset,
  buildJobGrowthBreakevenDataset,
  deriveJobGrowthBreakevenObservations,
  federalReserveBreakevenSourceUrl,
  fetchText,
  parseFederalReserveBreakevenHtml,
  parsePayemsCsv,
  payemsCsvUrl,
} from './federalReserve/breakevenEmployment'
import { writeJsonGroupAtomically } from './writeJsonGroupAtomically'

const defaultBreakevenOutput = path.resolve(
  'src/features/economic-series/data/estimated-breakeven-employment-growth.json',
)
const defaultComparisonOutput = path.resolve(
  'src/features/economic-series/data/job-growth-breakeven-comparison.json',
)

interface RefreshJobGrowthBreakevenOptions {
  retrievedAt: string
  breakevenOutputPath?: string
  comparisonOutputPath?: string
  fetchImplementation?: typeof fetch
}

export async function refreshJobGrowthBreakevenData({
  retrievedAt,
  breakevenOutputPath = defaultBreakevenOutput,
  comparisonOutputPath = defaultComparisonOutput,
  fetchImplementation,
}: RefreshJobGrowthBreakevenOptions) {
  const [breakevenHtml, payemsCsv] = await Promise.all([
    fetchText(federalReserveBreakevenSourceUrl, fetchImplementation),
    fetchText(payemsCsvUrl, fetchImplementation),
  ])
  const breakevenObservations =
    parseFederalReserveBreakevenHtml(breakevenHtml)
  const payrollLevels = parsePayemsCsv(payemsCsv)
  const comparisonObservations = deriveJobGrowthBreakevenObservations(
    breakevenObservations,
    payrollLevels,
  )
  const breakevenDataset = buildBreakevenEmploymentDataset(
    breakevenObservations,
    retrievedAt,
  )
  const comparisonDataset = buildJobGrowthBreakevenDataset(
    comparisonObservations,
    retrievedAt,
  )
  await writeJsonGroupAtomically([
    { outputPath: breakevenOutputPath, value: breakevenDataset },
    { outputPath: comparisonOutputPath, value: comparisonDataset },
  ])
  return { breakevenDataset, comparisonDataset, payrollLevels }
}

async function main(): Promise<void> {
  try {
    loadEnvFile()
  } catch (error: unknown) {
    if (!(error instanceof Error) ||
        !error.message.includes('.env')) {
      throw error
    }
  }
  const retrievedAt = new Date().toISOString().slice(0, 10)
  const result = await refreshJobGrowthBreakevenData({ retrievedAt })
  const available = result.comparisonDataset.observations.filter(
    ({ status }) => status === 'available',
  )
  const latest = available.at(-1)
  console.log(
    `Updated ${result.breakevenDataset.observations.length} Federal Reserve ` +
    `breakeven estimates and ${available.length} aligned comparisons. ` +
    `Latest available period: ${latest?.date ?? 'none'}.`,
  )
}

const isDirectExecution =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href

if (isDirectExecution) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
