import { readFile, writeFile } from 'node:fs/promises'
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
export const realConstructionCostOutputFile =
  'src/features/economic-series/data/real-single-family-construction-cost-index.json'
export const consumerPriceIndexInputFile =
  'src/features/economic-series/data/headline-cpi-index-not-seasonally-adjusted.json'

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

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

export function deriveRealConstructionCostIndex(
  nominal: readonly EconomicObservation[],
  consumerPrices: readonly EconomicObservation[],
): EconomicObservation[] {
  const cpiByDate = new Map(consumerPrices.map(({ date, value }) => [date, value]))
  const baseValues = consumerPrices
    .filter(({ date, value }) => date.startsWith('2005-') && value !== null)
    .map(({ value }) => value!)
  if (baseValues.length !== 12) {
    throw new Error('Real construction-cost derivation requires all twelve 2005 CPI observations')
  }
  const baseCpi = mean(baseValues)
  return nominal.map(({ date, value }) => {
    const cpi = cpiByDate.get(date)
    if (value === null || cpi === null || cpi === undefined) return { date, value: null }
    return { date, value: Number((value / (cpi / baseCpi)).toFixed(6)) }
  })
}

function buildSeries(
  observations: EconomicObservation[],
  retrievedAt: string,
  real: boolean,
): EconomicSeries {
  return validateEconomicSeries({
    id: real
      ? 'real-single-family-construction-cost-index'
      : 'single-family-construction-cost-index',
    slug: real
      ? 'real-single-family-construction-cost-index'
      : 'single-family-construction-cost-index',
    provider: 'census-hud',
    providerSeriesId: real ? 'PRICE_UC_FIXED / CPIAUCNS' : 'PRICE_UC_FIXED',
    title: real
      ? 'Consumer-price-adjusted construction cost index for new single-family houses'
      : 'Constant-quality construction cost index for new single-family houses',
    shortTitle: real ? 'Real construction cost index' : 'Construction cost index',
    description: real
      ? 'Census constant-quality construction cost divided by CPI-U and normalized to 2005.'
      : 'Monthly Census constant-quality Laspeyres price index for new single-family houses under construction.',
    question: 'How quickly are costs to build a comparable home changing?',
    units: 'Index, 2005=100',
    frequency: 'monthly',
    seasonalAdjustment: 'Not seasonally adjusted',
    transformation: real
      ? 'Census fixed-weight construction cost index divided by monthly CPI-U; 2005 CPI average = 100'
      : 'Provider-published Laspeyres constant-quality index; 2005=100',
    sourceName: real
      ? 'U.S. Census Bureau and HUD Survey of Construction; BLS CPI-U via FRED'
      : 'U.S. Census Bureau and HUD Survey of Construction',
    sourceUrl: constructionCostSourceUrl,
    retrievedAt,
    observations,
  })
}

interface RefreshConstructionCostOptions {
  retrievedAt: string
  fetchImplementation?: typeof fetch
  cpiInputPath?: string
  nominalOutputPath?: string
  realOutputPath?: string
}

export async function refreshHomeConstructionCostIndex({
  retrievedAt,
  fetchImplementation = fetch,
  cpiInputPath = consumerPriceIndexInputFile,
  nominalOutputPath = constructionCostOutputFile,
  realOutputPath = realConstructionCostOutputFile,
}: RefreshConstructionCostOptions): Promise<void> {
  const response = await fetchImplementation(constructionCostWorkbookUrl)
  if (!response.ok) throw new Error(`Construction-price workbook returned HTTP ${response.status}`)
  const nominalObservations = await parseConstructionCostWorkbook(
    Buffer.from(await response.arrayBuffer()),
  )
  const cpi = validateEconomicSeries(JSON.parse(await readFile(cpiInputPath, 'utf8')))
  const realObservations = deriveRealConstructionCostIndex(
    nominalObservations,
    cpi.observations,
  )
  const nominal = buildSeries(nominalObservations, retrievedAt, false)
  const real = buildSeries(realObservations, retrievedAt, true)

  await writeFile(nominalOutputPath, `${JSON.stringify(nominal, null, 2)}\n`)
  await writeFile(realOutputPath, `${JSON.stringify(real, null, 2)}\n`)
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
