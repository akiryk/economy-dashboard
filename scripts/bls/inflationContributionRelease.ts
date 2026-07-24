import { rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  INFLATION_CONTRIBUTION_RECONCILIATION_TOLERANCE,
} from '../../src/features/economic-series/utils/inflationContributions'

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

function textContent(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&minus;|&#8722;/gi, '−')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractCells(row: string): string[] {
  return [...row.matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/gi)]
    .map((match) => textContent(match[1]!))
}

function parseNumber(value: string, description: string): number {
  const normalized = value.replace(/−/g, '-').trim()
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
    throw new Error(`${description} is not a plain numeric value: "${value}"`)
  }
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${description} is not finite`)
  }
  return parsed
}

function removeFloatingPointNoise(value: number): number {
  return Number(value.toFixed(12))
}

function validateMetadata(metadata: InflationContributionReleaseMetadata): void {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])-01$/.test(metadata.period)) {
    throw new Error('period must use YYYY-MM-01')
  }
  if (metadata.period === '2025-10-01') {
    throw new Error('October 2025 has no CPI release and must remain missing')
  }
  if (!/^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/.test(
    metadata.sourceReleaseDate,
  )) {
    throw new Error('sourceReleaseDate must use YYYY-MM-DD')
  }
  const urlMatch = metadata.sourceUrl.match(
    /^https:\/\/www\.bls\.gov\/news\.release\/archives\/cpi_(\d{2})(\d{2})(\d{4})\.htm$/,
  )
  if (!urlMatch) {
    throw new Error('sourceUrl must identify an official archived BLS CPI HTML release')
  }
  const [, month, day, year] = urlMatch
  if (`${year}-${month}-${day}` !== metadata.sourceReleaseDate) {
    throw new Error('sourceReleaseDate does not match the archived release URL')
  }
  if (!metadata.sourceFile.trim()) {
    throw new Error('sourceFile is required')
  }
}

function measuredPeriodFromTitle(title: string): string {
  const match = title.match(
    /Table 7\.\s*Consumer Price Index for All Urban Consumers \(CPI-U\):[\s\S]*?,\s*(January|February|March|April|May|June|July|August|September|October|November|December) (\d{4}),\s*12-month analysis table/i,
  )
  if (!match) {
    throw new Error('Expected the CPI-U Table 7 12-month analysis heading')
  }
  const canonicalMonth = `${match[1]![0]!.toUpperCase()}${match[1]!.slice(1).toLowerCase()}`
  return `${match[2]}-${monthNumbers.get(canonicalMonth)}-01`
}

export function parseInflationContributionRelease(
  html: string,
  metadata: InflationContributionReleaseMetadata,
): InflationContributionRelease {
  validateMetadata(metadata)
  if (/not available|not published|unavailable/i.test(html) && !/<table\b/i.test(html)) {
    throw new Error('The source marks this release unavailable')
  }

  const matchingTables = [...html.matchAll(/<table\b[\s\S]*?<\/table>/gi)]
    .map((match) => match[0])
    .filter((table) =>
      /Table 7\./i.test(textContent(table)) &&
      /12-month analysis table/i.test(textContent(table)))
  if (matchingTables.length !== 1) {
    throw new Error(`Expected exactly one CPI-U Table 7; found ${matchingTables.length}`)
  }
  const table = matchingTables[0]!
  const period = measuredPeriodFromTitle(textContent(table))
  if (period !== metadata.period) {
    throw new Error(`Source period ${period} conflicts with supplied period ${metadata.period}`)
  }

  const rows = [...table.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)]
    .map((match) => extractCells(match[0]))
  const header = rows.find((cells) => cells.includes('Expenditure category'))
  const expectedHeader = [
    'Expenditure category',
    'Relative importance',
    'Unadjusted percent change',
    'Unadjusted effect on All Items',
  ]
  if (!header || expectedHeader.some((value, index) => header[index] !== value)) {
    throw new Error(
      'Table 7 columns are missing, ambiguous, or reordered; refusing to guess the effect column',
    )
  }

  const dataRows = rows.filter((cells) => cells.length >= 4)
  const findUnique = (label: string): string[] => {
    const matches = dataRows.filter((cells) => cells[0] === label)
    if (matches.length !== 1) {
      throw new Error(`Expected exactly one "${label}" row; found ${matches.length}`)
    }
    return matches[0]!
  }

  const headlineCpiEffectTotal = parseNumber(
    findUnique('All items')[2]!,
    'All items 12-month percent change',
  )
  const effects = Object.fromEntries(
    Object.entries(categoryLabels).map(([key, label]) => [
      key,
      parseNumber(findUnique(label)[3]!, `${label} effect on All Items`),
    ]),
  ) as unknown as Record<keyof typeof categoryLabels, number>
  const otherServices = removeFloatingPointNoise(
    effects.servicesLessEnergyServices - effects.shelter,
  )
  const contributionSum =
    effects.food +
    effects.energy +
    effects.commoditiesLessFoodAndEnergy +
    effects.shelter +
    otherServices
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

export function validateInflationContributionCollection(
  releases: readonly InflationContributionRelease[],
): void {
  const periods = new Set<string>()
  let priorPeriod: string | undefined
  for (const release of releases) {
    if (periods.has(release.period)) {
      throw new Error(`Duplicate contribution period: ${release.period}`)
    }
    if (release.period === '2025-10-01') {
      throw new Error('October 2025 has no CPI release and must remain missing')
    }
    if (priorPeriod && release.period < priorPeriod) {
      throw new Error('Contribution periods must be sorted in ascending order')
    }
    periods.add(release.period)
    priorPeriod = release.period
  }
}

export async function writeInflationContributionReleaseAtomically(
  outputPath: string,
  release: InflationContributionRelease,
): Promise<void> {
  const serialized = `${JSON.stringify(release, null, 2)}\n`
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
