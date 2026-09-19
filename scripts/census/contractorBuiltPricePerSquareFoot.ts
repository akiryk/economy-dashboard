import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import * as XLSX from 'xlsx'
import type { EconomicObservation, EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'

export const contractorPricePerSquareFootWorkbookUrl =
  'https://www.census.gov/construction/chars/xls/contractpricesqft_cust.xls'
export const contractorPricePerSquareFootSourceUrl =
  'https://www.census.gov/construction/chars/current.html'
export const contractorPricePerSquareFootOutputFile =
  'src/features/economic-series/data/contractor-built-price-per-square-foot.json'

export function parseContractorPricePerSquareFootWorkbook(
  bytes: Uint8Array,
): EconomicObservation[] {
  const workbook = XLSX.read(bytes, { type: 'array' })
  const sheet = workbook.Sheets.ContractMedAvgPriceSqFt
  if (!sheet) throw new Error('Unexpected contractor-price workbook: missing ContractMedAvgPriceSqFt worksheet')
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: true,
    defval: null,
  })
  if (!String(rows[0]?.[0]).includes('Median and Average Contract Price per Square Foot')) {
    throw new Error('Unexpected contractor-price workbook title')
  }
  if (rows[5]?.[0] !== 'Year' || rows[6]?.[1] !== 'States') {
    throw new Error('Unexpected contractor-price workbook columns')
  }

  const observations = rows.slice(8).flatMap((row) => {
    const year = row[0]
    if (typeof year !== 'number' || !Number.isInteger(year)) return []
    const value = row[1]
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`Invalid national median contract price per square foot for ${year}`)
    }
    return [{ date: `${year}-01-01`, value }]
  })
  if (observations.length < 30) {
    throw new Error('Contractor-price history has insufficient annual coverage')
  }
  for (let index = 1; index < observations.length; index += 1) {
    const previousYear = Number(observations[index - 1]!.date.slice(0, 4))
    const currentYear = Number(observations[index]!.date.slice(0, 4))
    if (currentYear !== previousYear + 1) {
      throw new Error(`Contractor-price history is not annual at ${currentYear}`)
    }
  }
  return observations
}

function buildSeries(
  observations: EconomicObservation[],
  retrievedAt: string,
): EconomicSeries {
  return validateEconomicSeries({
    id: 'contractor-built-price-per-square-foot',
    slug: 'contractor-built-price-per-square-foot',
    provider: 'census-hud',
    providerSeriesId: 'ContractMedAvgPriceSqFt: United States median',
    title: 'Median contract price per square foot of new contractor-built single-family houses started',
    shortTitle: 'Contractor-built median contract price per square foot',
    description: 'Annual national median contract price per square foot, excluding the value of the improved lot.',
    question: 'What have contractor-built homes cost per square foot?',
    units: 'Nominal dollars per square foot',
    frequency: 'annual',
    seasonalAdjustment: null,
    transformation: 'Provider-published annual national median; no interpolation or monthly extrapolation',
    sourceName: 'U.S. Census Bureau and HUD Survey of Construction',
    sourceUrl: contractorPricePerSquareFootSourceUrl,
    retrievedAt,
    observations,
  })
}

interface RefreshOptions {
  retrievedAt: string
  fetchImplementation?: typeof fetch
  outputPath?: string
}

export async function refreshContractorPricePerSquareFoot({
  retrievedAt,
  fetchImplementation = fetch,
  outputPath = contractorPricePerSquareFootOutputFile,
}: RefreshOptions): Promise<void> {
  const response = await fetchImplementation(contractorPricePerSquareFootWorkbookUrl)
  if (!response.ok) throw new Error(`Contractor-price workbook returned HTTP ${response.status}`)
  const observations = parseContractorPricePerSquareFootWorkbook(
    new Uint8Array(await response.arrayBuffer()),
  )
  const series = buildSeries(observations, retrievedAt)
  await writeFile(outputPath, `${JSON.stringify(series, null, 2)}\n`)
}

async function main(): Promise<void> {
  await refreshContractorPricePerSquareFoot({
    retrievedAt: new Date().toISOString().slice(0, 10),
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
