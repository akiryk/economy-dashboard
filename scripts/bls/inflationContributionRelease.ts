import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'
import { unzipSync } from 'fflate'
import {
  INFLATION_CONTRIBUTION_RECONCILIATION_TOLERANCE,
} from '../../src/features/economic-series/utils/inflationContributions'

export const BLS_SUPPLEMENTAL_FILES_URL =
  'https://www.bls.gov/cpi/tables/supplemental-files/'
export const BLS_SUPPLEMENTAL_FILES_INDEX_URL =
  `${BLS_SUPPLEMENTAL_FILES_URL}home.htm`
export const OCTOBER_2025_GAP = '2025-10-01'

export interface InflationContributionReleaseMetadata {
  period: string
  sourceReleaseDate: string
  sourceUrl: string
  sourceFile: string
}

export interface InflationContributionRelease {
  period: string
  headlineCpiEffectTotal: number
  food: number
  energy: number
  shelter: number
  commoditiesLessFoodAndEnergy: number
  servicesLessEnergyServices: number
  otherServices: number
  sourceReleaseDate: string
  sourceUrl: string
  sourceFile: string
  vintage: 'release'
  reconciliationResidual: number
  reconciliationStatus: 'reconciled'
}

export interface InflationContributionGap {
  period: typeof OCTOBER_2025_GAP
  status: 'unavailable'
  reason: '2025 appropriations lapse'
  sourceUrl: typeof BLS_SUPPLEMENTAL_FILES_URL
}

export interface InflationContributionHistory {
  title: string
  sourceName: string
  sourceIndexUrl: string
  units: string
  methodology: string
  vintage: 'release'
  observations: (InflationContributionRelease | InflationContributionGap)[]
}

const categoryLabels = {
  food: 'Food',
  energy: 'Energy',
  shelter: 'Shelter',
  commoditiesLessFoodAndEnergy: 'Commodities less food and energy commodities',
  servicesLessEnergyServices: 'Services less energy services',
} as const

const monthNumbers = new Map([
  ['January', '01'], ['February', '02'], ['March', '03'], ['April', '04'],
  ['May', '05'], ['June', '06'], ['July', '07'], ['August', '08'],
  ['September', '09'], ['October', '10'], ['November', '11'], ['December', '12'],
])

function normalizeText(value: unknown): string {
  const text = value && typeof value === 'object' && 'richText' in value &&
    Array.isArray(value.richText)
    ? value.richText.map((part: unknown) =>
      part && typeof part === 'object' && 'text' in part ? part.text : '').join('')
    : String(value ?? '')
  return text
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLabel(value: unknown): string {
  return normalizeText(value)
    .replace(/\(\d+(?:,\s*\d+)*\)$/, '')
    .replace(/\d+\/?$/, '')
    .trim()
}

function parseNumber(value: unknown, description: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${description} is not a numeric workbook cell`)
  }
  return value
}

function removeFloatingPointNoise(value: number): number {
  return Number(value.toFixed(12))
}

function periodFromWorkbookName(sourceFile: string): string {
  const match = path.basename(sourceFile).match(
    /^news-release-table7-(\d{4})(0[1-9]|1[0-2])\.xlsx$/i,
  )
  if (!match) {
    throw new Error(
      'sourceFile must be named news-release-table7-YYYYMM.xlsx',
    )
  }
  return `${match[1]}-${match[2]}-01`
}

export function validateInflationContributionMetadata(
  metadata: InflationContributionReleaseMetadata,
): void {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])-01$/.test(metadata.period)) {
    throw new Error('period must use YYYY-MM-01')
  }
  if (metadata.period === OCTOBER_2025_GAP) {
    throw new Error('October 2025 is unavailable and must remain an explicit gap')
  }
  if (!/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(
    metadata.sourceReleaseDate,
  )) {
    throw new Error('sourceReleaseDate must use YYYY-MM-DD')
  }
  if (metadata.sourceReleaseDate <= metadata.period) {
    throw new Error('sourceReleaseDate must follow the measured month')
  }
  if (periodFromWorkbookName(metadata.sourceFile) !== metadata.period) {
    throw new Error('source workbook name conflicts with the supplied period')
  }
  const individualUrl = new RegExp(
    `^${BLS_SUPPLEMENTAL_FILES_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` +
    `news-release-table7-${metadata.period.slice(0, 7).replace('-', '')}\\.xlsx$`,
  )
  const annualUrl = new RegExp(
    `^${BLS_SUPPLEMENTAL_FILES_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` +
    `archive-${metadata.period.slice(0, 4)}\\.zip$`,
  )
  if (!individualUrl.test(metadata.sourceUrl) && !annualUrl.test(metadata.sourceUrl)) {
    throw new Error(
      'sourceUrl must identify the matching official BLS workbook or annual archive',
    )
  }
}

function measuredPeriodFromTitle(title: string): string {
  const match = title.match(
    /Table 7\.\s*Consumer Price Index for All Urban Consumers \(CPI-U\):[\s\S]*?,\s*(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4}),\s*12-month analysis table/i,
  )
  if (!match) {
    throw new Error('Expected the CPI-U Table 7 12-month analysis heading')
  }
  const month = `${match[1]![0]!.toUpperCase()}${match[1]!.slice(1).toLowerCase()}`
  return `${match[2]}-${monthNumbers.get(month)}-01`
}

async function workbookRows(contents: Uint8Array): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook()
  try {
    const workbookBytes = new Uint8Array(contents).buffer as ArrayBuffer
    await workbook.xlsx.load(workbookBytes)
  } catch (error: unknown) {
    throw new Error(
      `Could not read XLSX workbook: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    )
  }
  if (workbook.worksheets.length !== 1) {
    throw new Error(`Expected exactly one Table 7 worksheet; found ${workbook.worksheets.length}`)
  }
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('Table 7 worksheet is missing')
  const rows: unknown[][] = []
  sheet.eachRow((row) => {
    const values: unknown[] = []
    for (let column = 1; column <= sheet.columnCount; column += 1) {
      values.push(row.getCell(column).value ?? '')
    }
    rows.push(values)
  })
  return rows
}

export async function parseInflationContributionWorkbook(
  contents: Uint8Array,
  metadata: InflationContributionReleaseMetadata,
): Promise<InflationContributionRelease> {
  validateInflationContributionMetadata(metadata)
  const rows = await workbookRows(contents)
  const workbookText = rows.flat().map(normalizeText).join(' ')
  const period = measuredPeriodFromTitle(workbookText)
  if (period !== metadata.period) {
    throw new Error(`Source period ${period} conflicts with supplied period ${metadata.period}`)
  }

  const headerIndex = rows.findIndex((row) =>
    row.map(normalizeText).includes('Expenditure category'))
  if (headerIndex < 0) throw new Error('Table 7 expenditure-category header is missing')
  const headerWidth = Math.max(
    ...rows.slice(headerIndex, headerIndex + 3).map((row) => row.length),
  )
  const header = Array.from({ length: headerWidth }, (_, column) =>
    rows
      .slice(headerIndex, headerIndex + 3)
      .map((row) => normalizeText(row[column]))
      .filter(Boolean)
      .join(' '))
  const categoryColumn = header.findIndex((value) =>
    value.includes('Expenditure category'))
  const effectColumns = header
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => /Unadjusted effect on All Items/i.test(value))
  const percentChangeColumns = header.filter((value) =>
    /Unadjusted percent change/i.test(value))
  if (categoryColumn < 0 || effectColumns.length !== 1 || percentChangeColumns.length !== 1) {
    throw new Error(
      'Table 7 columns are missing or ambiguous; refusing to guess the effect column',
    )
  }
  const effectColumn = effectColumns[0]!.index
  if (effectColumn === header.indexOf(percentChangeColumns[0]!)) {
    throw new Error('The effect and percent-change columns must be distinct')
  }

  const dataRows = rows.slice(headerIndex + 1)
  const findUnique = (label: string): unknown[] => {
    const matches = dataRows.filter(
      (row) => normalizeLabel(row[categoryColumn]) === label,
    )
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one "${label}" row; found ${matches.length}`)
    }
    return matches[0]!
  }
  const allItemsRow = findUnique('All items')
  const percentChangeColumn = header.indexOf(percentChangeColumns[0]!)
  const headlineCpiEffectTotal = parseNumber(
    allItemsRow[percentChangeColumn],
    'All items 12-month percent change',
  )
  const effects = Object.fromEntries(
    Object.entries(categoryLabels).map(([key, label]) => [
      key,
      parseNumber(findUnique(label)[effectColumn], `${label} effect on All Items`),
    ]),
  ) as unknown as Record<keyof typeof categoryLabels, number>
  const otherServices = removeFloatingPointNoise(
    effects.servicesLessEnergyServices - effects.shelter,
  )
  const contributionSum =
    effects.food + effects.energy + effects.commoditiesLessFoodAndEnergy +
    effects.shelter + otherServices
  const reconciliationResidual = removeFloatingPointNoise(
    headlineCpiEffectTotal - contributionSum,
  )
  if (
    Math.abs(reconciliationResidual) >
    INFLATION_CONTRIBUTION_RECONCILIATION_TOLERANCE + 1e-12
  ) {
    throw new Error(
      `Contribution residual ${reconciliationResidual.toFixed(3)} exceeds ` +
      `${INFLATION_CONTRIBUTION_RECONCILIATION_TOLERANCE.toFixed(2)} percentage points`,
    )
  }
  return {
    ...metadata,
    headlineCpiEffectTotal,
    ...effects,
    otherServices,
    vintage: 'release',
    reconciliationResidual,
    reconciliationStatus: 'reconciled',
  }
}

export function table7WorkbooksFromArchive(
  archive: Uint8Array,
  year: number,
): Map<string, Uint8Array> {
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(archive)
  } catch (error: unknown) {
    throw new Error(
      `Could not read annual ZIP archive: ${error instanceof Error ? error.message : error}`,
      { cause: error },
    )
  }
  const workbooks = new Map<string, Uint8Array>()
  for (const [entryName, contents] of Object.entries(files)) {
    const basename = path.posix.basename(entryName)
    if (!new RegExp(`^news-release-table7-${year}(?:0[1-9]|1[0-2])\\.xlsx$`, 'i')
      .test(basename)) continue
    if (workbooks.has(basename)) {
      throw new Error(`Duplicate Table 7 workbook in archive: ${basename}`)
    }
    workbooks.set(basename, contents)
  }
  if (workbooks.size !== 12) {
    throw new Error(
      `Expected 12 monthly Table 7 workbooks in archive-${year}.zip; found ${workbooks.size}`,
    )
  }
  return workbooks
}

export function validateInflationContributionCollection(
  observations: readonly (InflationContributionRelease | InflationContributionGap)[],
): void {
  const periods = new Set<string>()
  let priorPeriod: string | undefined
  for (const observation of observations) {
    if (periods.has(observation.period)) {
      throw new Error(`Duplicate contribution period: ${observation.period}`)
    }
    if (observation.period === OCTOBER_2025_GAP) {
      if (!('status' in observation) || observation.status !== 'unavailable') {
        throw new Error('October 2025 must be represented only by the explicit gap')
      }
    } else if ('status' in observation) {
      throw new Error(`Unexpected unavailable contribution period: ${observation.period}`)
    }
    if (priorPeriod && observation.period < priorPeriod) {
      throw new Error('Contribution periods must be sorted in ascending order')
    }
    periods.add(observation.period)
    priorPeriod = observation.period
  }
}

export async function writeJsonAtomically(
  outputPath: string,
  value: unknown,
): Promise<void> {
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  JSON.parse(serialized)
  const temporaryPath = path.join(
    path.dirname(outputPath),
    `.${path.basename(outputPath)}.${process.pid}.${Date.now()}.tmp`,
  )
  try {
    await writeFile(temporaryPath, serialized, { encoding: 'utf8', flag: 'wx' })
    await rename(temporaryPath, outputPath)
  } catch (error: unknown) {
    await unlink(temporaryPath).catch(() => undefined)
    throw error
  }
}
