import { writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import ExcelJS from 'exceljs'
import type { EconomicObservation, EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'

export const constructionCostWorkbookUrl =
  'https://www.census.gov/construction/nrs/xls/price_uc_cust.xlsx'
export const constructionCostSourceUrl =
  'https://www.census.gov/construction/cpi/current.html'
export const constructionCostOutputFile =
  'src/features/economic-series/data/single-family-construction-cost-index.json'

function isoMonth(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 8) + '01'
  }
  if (typeof value !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(?:\d{2})/.exec(value)
  return match ? `${match[1]}-${match[2]}-01` : null
}

function monthIndex(date: string): number {
  return Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1
}

export async function parseConstructionCostWorkbook(
  bytes: Buffer,
): Promise<EconomicObservation[]> {
  const workbook = new ExcelJS.Workbook()
  const workbookBytes = new Uint8Array(bytes).buffer as ArrayBuffer
  await workbook.xlsx.load(workbookBytes)
  const sheet = workbook.getWorksheet('Vertical')
  if (!sheet) throw new Error('Unexpected construction-price workbook: missing Vertical worksheet')
  if (!String(sheet.getCell('C6').value).includes('Laspeyres')) {
    throw new Error('Unexpected construction-price workbook: missing Laspeyres column')
  }

  const observations: EconomicObservation[] = []
  for (let rowNumber = 7; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const date = isoMonth(sheet.getCell(rowNumber, 1).value)
    const value = sheet.getCell(rowNumber, 3).value
    if (!date) continue
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`Invalid construction-price observation for ${date}`)
    }
    observations.push({ date, value })
  }

  if (observations.length < 120) {
    throw new Error('Construction-price history has insufficient monthly coverage')
  }
  for (let index = 1; index < observations.length; index += 1) {
    if (monthIndex(observations[index]!.date) !== monthIndex(observations[index - 1]!.date) + 1) {
      throw new Error(`Construction-price history is not monthly at ${observations[index]!.date}`)
    }
  }
  return observations
}

function buildSeries(
  observations: EconomicObservation[],
  retrievedAt: string,
): EconomicSeries {
  return validateEconomicSeries({
    id: 'single-family-construction-cost-index',
    slug: 'single-family-construction-cost-index',
    provider: 'census-hud',
    providerSeriesId: 'PRICE_UC_FIXED',
    title: 'Constant-quality construction cost index for new single-family houses',
    shortTitle: 'Construction cost index',
    description: 'Monthly Census constant-quality Laspeyres price index for new single-family houses under construction.',
    question: 'How much has the cost of building a comparable home risen?',
    units: 'Index, 2005=100',
    frequency: 'monthly',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Provider-published Laspeyres constant-quality index; 2005=100',
    sourceName: 'U.S. Census Bureau and HUD Survey of Construction',
    sourceUrl: constructionCostSourceUrl,
    retrievedAt,
    observations,
  })
}

interface RefreshConstructionCostOptions {
  retrievedAt: string
  fetchImplementation?: typeof fetch
  nominalOutputPath?: string
}

export async function refreshHomeConstructionCostIndex({
  retrievedAt,
  fetchImplementation = fetch,
  nominalOutputPath = constructionCostOutputFile,
}: RefreshConstructionCostOptions): Promise<void> {
  const response = await fetchImplementation(constructionCostWorkbookUrl)
  if (!response.ok) throw new Error(`Construction-price workbook returned HTTP ${response.status}`)
  const nominalObservations = await parseConstructionCostWorkbook(
    Buffer.from(await response.arrayBuffer()),
  )
  const nominal = buildSeries(nominalObservations, retrievedAt)

  await writeFile(nominalOutputPath, `${JSON.stringify(nominal, null, 2)}\n`)
}

async function main(): Promise<void> {
  await refreshHomeConstructionCostIndex({
    retrievedAt: new Date().toISOString().slice(0, 10),
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
