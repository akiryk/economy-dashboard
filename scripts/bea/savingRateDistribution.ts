import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { savingRateDeciles, type SavingRateDistributionDataset, type SavingRateEstimateStatus } from '../../src/features/economic-series/models/savingRateDistribution'
import { validateSavingRateDistribution } from '../../src/features/economic-series/models/validateSavingRateDistribution'

export const beaSavingDistributionWorkbookUrl =
  'https://www.bea.gov/sites/default/files/2026-05/joint_dist_summary.xlsx'
export const beaSavingDistributionSourceUrl =
  'https://www.bea.gov/data/special-topics/distribution-of-personal-income'
export const beaSavingDistributionOutputFile =
  'src/features/economic-series/data/saving-rate-by-income-decile.json'

export function calculateSavingRate(personalSaving: number | null, disposableIncome: number | null): number | null {
  if (personalSaving === null || disposableIncome === null || disposableIncome === 0) return null
  return (personalSaving / disposableIncome) * 100
}

function numericOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === 'N/A') return null
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`Malformed saving-rate value: ${String(value)}`)
  return value * 100
}

export async function parseSavingRateDistributionWorkbook(
  contents: Uint8Array,
  retrievedAt: string,
  statusByYear: Readonly<Record<number, SavingRateEstimateStatus>> = {},
  workbookUrl = beaSavingDistributionWorkbookUrl,
): Promise<SavingRateDistributionDataset> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(contents as unknown as ExcelJS.Buffer)
  const sheet = workbook.getWorksheet('savings rates')
  if (!sheet) throw new Error('BEA workbook is missing the "savings rates" worksheet.')
  const headers = sheet.getRow(1).values as unknown[]
  if (headers[1] !== 'Year' || savingRateDeciles.some(({ id }, index) => headers[index + 2] !== id)) {
    throw new Error('BEA savings-rate worksheet columns changed unexpectedly.')
  }

  const observations: SavingRateDistributionDataset['observations'] = []
  const seenYears = new Set<number>()
  for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
    const row = sheet.getRow(rowIndex)
    const year = row.getCell(1).value
    if (year === null) continue
    if (typeof year !== 'number' || !Number.isInteger(year) || seenYears.has(year)) throw new Error(`Malformed or duplicate year at row ${rowIndex}.`)
    seenYears.add(year)
    for (const [index, decile] of savingRateDeciles.entries()) {
      observations.push({
        year,
        decile: decile.id,
        rate: numericOrNull(row.getCell(index + 2).value),
        status: statusByYear[year] ?? 'final',
      })
    }
  }

  return validateSavingRateDistribution({
    id: 'saving-rate-by-income-decile',
    sourceName: 'U.S. Bureau of Economic Analysis, Distribution of Personal Saving',
    sourceUrl: beaSavingDistributionSourceUrl,
    workbookUrl,
    methodologyUrl: 'https://www.bea.gov/sites/default/files/2026-04/technical_document_personal_saving.pdf',
    retrievedAt,
    ranking: 'Equivalized Disposable Personal Income',
    units: 'Percent of disposable personal income',
    observations,
  })
}

export async function refreshSavingRateDistribution({
  retrievedAt,
  outputFile = beaSavingDistributionOutputFile,
  fetchImplementation = fetch,
}: {
  retrievedAt: string
  outputFile?: string
  fetchImplementation?: typeof fetch
}): Promise<SavingRateDistributionDataset> {
  const sourceResponse = await fetchImplementation(beaSavingDistributionSourceUrl)
  if (!sourceResponse.ok) throw new Error(`BEA source-page request failed with HTTP ${sourceResponse.status}.`)
  const sourceHtml = await sourceResponse.text()
  const workbookHref = sourceHtml.match(/href=["']([^"']*joint_dist_summary\.xlsx)["']/i)?.[1]
  if (!workbookHref) throw new Error('BEA source page does not identify the saving-distribution workbook.')
  const workbookUrl = new URL(workbookHref, beaSavingDistributionSourceUrl).href
  const response = await fetchImplementation(workbookUrl)
  if (!response.ok) throw new Error(`BEA workbook request failed with HTTP ${response.status}.`)
  const data = await parseSavingRateDistributionWorkbook(new Uint8Array(await response.arrayBuffer()), retrievedAt, {}, workbookUrl)
  const target = path.resolve(outputFile)
  const temporary = path.join(path.dirname(target), `.${path.basename(target)}.${process.pid}.${Date.now()}.tmp`)
  try {
    await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, { flag: 'wx' })
    await rename(temporary, target)
  } catch (error) {
    await unlink(temporary).catch(() => undefined)
    throw error
  }
  return data
}
