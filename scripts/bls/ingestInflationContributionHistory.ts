import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  BLS_SUPPLEMENTAL_FILES_URL,
  OCTOBER_2025_GAP,
  parseInflationContributionWorkbook,
  table7WorkbooksFromArchive,
  validateInflationContributionCollection,
  writeJsonAtomically,
} from './inflationContributionRelease'
import type {
  InflationContributionGap,
  InflationContributionRelease,
} from './inflationContributionRelease'

interface CliArguments {
  sourceDirectory: string
  releaseDates: string
  output: string
}

interface InflationContributionHistory {
  title: string
  sourceName: string
  sourceIndexUrl: string
  units: string
  methodology: string
  vintage: 'release'
  observations: (InflationContributionRelease | InflationContributionGap)[]
}

function parseArguments(arguments_: readonly string[]): CliArguments {
  const values = new Map<string, string>()
  for (let index = 0; index < arguments_.length; index += 2) {
    const key = arguments_[index]
    const value = arguments_[index + 1]
    if (!key?.startsWith('--') || !value || value.startsWith('--')) {
      throw new Error('Arguments must be supplied as --name value pairs')
    }
    values.set(key.slice(2), value)
  }
  const sourceDirectory = values.get('source-directory')
  const releaseDates = values.get('release-dates')
  const output = values.get('output')
  if (!sourceDirectory || !releaseDates || !output) {
    throw new Error('Required: --source-directory, --release-dates, and --output')
  }
  return { sourceDirectory, releaseDates, output }
}

function targetPeriods(): string[] {
  const periods: string[] = []
  for (let year = 2021; year <= 2026; year += 1) {
    const firstMonth = year === 2021 ? 6 : 1
    const lastMonth = year === 2026 ? 6 : 12
    for (let month = firstMonth; month <= lastMonth; month += 1) {
      periods.push(`${year}-${String(month).padStart(2, '0')}-01`)
    }
  }
  return periods
}

function validateReleaseDates(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Release-date manifest must be a JSON object')
  }
  const dates = value as Record<string, unknown>
  const result: Record<string, string> = {}
  for (const period of targetPeriods()) {
    if (period === OCTOBER_2025_GAP) continue
    const releaseDate = dates[period]
    if (typeof releaseDate !== 'string') {
      throw new Error(`Release-date manifest is missing ${period}`)
    }
    result[period] = releaseDate
  }
  const unexpected = Object.keys(dates).filter(
    (period) => !targetPeriods().includes(period) || period === OCTOBER_2025_GAP,
  )
  if (unexpected.length > 0) {
    throw new Error(`Unexpected release-date manifest period: ${unexpected[0]}`)
  }
  return result
}

export async function ingestInflationContributionHistory(
  arguments_: readonly string[],
): Promise<InflationContributionHistory> {
  const options = parseArguments(arguments_)
  const releaseDates = validateReleaseDates(
    JSON.parse(await readFile(options.releaseDates, 'utf8')) as unknown,
  )
  const archiveWorkbooks = new Map<number, Map<string, Uint8Array>>()
  for (let year = 2021; year <= 2024; year += 1) {
    const archiveName = `archive-${year}.zip`
    const archive = await readFile(path.join(options.sourceDirectory, archiveName))
    archiveWorkbooks.set(year, table7WorkbooksFromArchive(archive, year))
  }

  const observations: (InflationContributionRelease | InflationContributionGap)[] = []
  for (const period of targetPeriods()) {
    if (period === OCTOBER_2025_GAP) {
      observations.push({
        period,
        status: 'unavailable',
        reason: '2025 appropriations lapse',
        sourceUrl: BLS_SUPPLEMENTAL_FILES_URL,
      })
      continue
    }
    const year = Number(period.slice(0, 4))
    const yyyymm = period.slice(0, 7).replace('-', '')
    const workbookName = `news-release-table7-${yyyymm}.xlsx`
    const contents = year <= 2024
      ? archiveWorkbooks.get(year)?.get(workbookName)
      : await readFile(path.join(options.sourceDirectory, workbookName))
    if (!contents) {
      throw new Error(`Required Table 7 workbook is missing: ${workbookName}`)
    }
    try {
      observations.push(await parseInflationContributionWorkbook(contents, {
        period,
        sourceReleaseDate: releaseDates[period]!,
        sourceUrl: year <= 2024
          ? `${BLS_SUPPLEMENTAL_FILES_URL}archive-${year}.zip`
          : `${BLS_SUPPLEMENTAL_FILES_URL}${workbookName}`,
        sourceFile: workbookName,
      }))
    } catch (error: unknown) {
      throw new Error(
        `Failed to ingest ${workbookName}: ${error instanceof Error ? error.message : error}`,
        { cause: error },
      )
    }
  }
  validateInflationContributionCollection(observations)
  const history: InflationContributionHistory = {
    title: 'Monthly category effects on 12-month CPI inflation',
    sourceName:
      'U.S. Bureau of Labor Statistics, CPI-U News Release Table 7 supplemental workbooks',
    sourceIndexUrl: BLS_SUPPLEMENTAL_FILES_URL,
    units: 'Percentage-point effect on all-items CPI',
    methodology:
      'Published unadjusted 12-month effects. Other services equals services less energy services minus shelter. October 2025 is unavailable because of the 2025 appropriations lapse.',
    vintage: 'release',
    observations,
  }
  await writeJsonAtomically(options.output, history)
  return history
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  ingestInflationContributionHistory(process.argv.slice(2)).catch(
    (error: unknown) => {
      console.error(error instanceof Error ? error.message : error)
      process.exitCode = 1
    },
  )
}
