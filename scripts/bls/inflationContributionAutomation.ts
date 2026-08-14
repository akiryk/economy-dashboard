import { readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  BLS_SUPPLEMENTAL_FILES_INDEX_URL,
  parseInflationContributionWorkbook,
  validateInflationContributionCollection,
  type InflationContributionHistory,
  type InflationContributionRelease,
} from './inflationContributionRelease'

const OFFICIAL_HOST = 'www.bls.gov'
const RELEASE_LINK_PATTERN =
  /^News Release Table 7, (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4}) \(XLSX\)$/i
const monthNumbers = new Map([
  ['january', '01'], ['february', '02'], ['march', '03'], ['april', '04'],
  ['may', '05'], ['june', '06'], ['july', '07'], ['august', '08'],
  ['september', '09'], ['october', '10'], ['november', '11'], ['december', '12'],
])

export interface Table7ReleaseLink {
  period: string
  url: string
  sourceFile: string
  label: string
}

export interface InflationContributionSnapshot {
  title: string
  sourceName: string
  sourceUrl: string
  retrievedAt: string
  units: string
  methodology: string
  observations: Array<{
    date: string
    headline: number
    categories: Record<string, number>
  }>
}

function decodeHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function assertOfficialUrl(value: string, description: string): URL {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== OFFICIAL_HOST) {
    throw new Error(`${description} must use https://${OFFICIAL_HOST}`)
  }
  return url
}

export function discoverTable7Releases(
  html: string,
  indexUrl = BLS_SUPPLEMENTAL_FILES_INDEX_URL,
): Table7ReleaseLink[] {
  assertOfficialUrl(indexUrl, 'BLS source page')
  const candidates: Table7ReleaseLink[] = []
  const anchorPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi
  for (const match of html.matchAll(anchorPattern)) {
    const label = decodeHtml(match[2] ?? '')
    const releaseMatch = label.match(RELEASE_LINK_PATTERN)
    if (!releaseMatch) continue
    const month = monthNumbers.get(releaseMatch[1]!.toLowerCase())
    const period = `${releaseMatch[2]}-${month}-01`
    const url = new URL(match[1]!, indexUrl)
    assertOfficialUrl(url.href, 'Table 7 workbook URL')
    const expectedFile = `news-release-table7-${period.slice(0, 7).replace('-', '')}.xlsx`
    if (path.posix.basename(url.pathname).toLowerCase() !== expectedFile) {
      throw new Error(`Table 7 link for ${period} has an unexpected workbook name`)
    }
    candidates.push({ period, url: url.href, sourceFile: expectedFile, label })
  }
  if (candidates.length === 0) {
    throw new Error('Unable to determine whether a new inflation-contribution release exists: no recognizable Table 7 links')
  }
  const byPeriod = new Map<string, Table7ReleaseLink>()
  for (const candidate of candidates) {
    const duplicate = byPeriod.get(candidate.period)
    if (duplicate && duplicate.url !== candidate.url) {
      throw new Error(`Conflicting Table 7 links found for ${candidate.period}`)
    }
    byPeriod.set(candidate.period, candidate)
  }
  return [...byPeriod.values()].sort((left, right) =>
    left.period.localeCompare(right.period))
}

export function compareReleasePeriods(
  committedPeriod: string,
  discoveredPeriod: string,
): 'current' | 'new' | 'stale' {
  return discoveredPeriod === committedPeriod
    ? 'current'
    : discoveredPeriod > committedPeriod ? 'new' : 'stale'
}

export function nextMonthlyPeriod(period: string): string {
  const year = Number(period.slice(0, 4))
  const month = Number(period.slice(5, 7))
  return month === 12
    ? `${year + 1}-01-01`
    : `${year}-${String(month + 1).padStart(2, '0')}-01`
}

async function checkedFetch(
  url: string,
  fetchImplementation: typeof fetch,
  description: string,
): Promise<Response> {
  assertOfficialUrl(url, description)
  const response = await fetchImplementation(url, {
    headers: {
      'user-agent': 'economy-dashboard-data-refresh/1.0 (+https://github.com/akiryk/economy-dashboard)',
      accept: description.includes('page')
        ? 'text/html,application/xhtml+xml'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
    redirect: 'follow',
  })
  assertOfficialUrl(response.url || url, `${description} redirect`)
  if (!response.ok) throw new Error(`${description} returned HTTP ${response.status}`)
  return response
}

export async function fetchLatestTable7Release(
  fetchImplementation: typeof fetch = fetch,
): Promise<Table7ReleaseLink> {
  const response = await checkedFetch(
    BLS_SUPPLEMENTAL_FILES_INDEX_URL,
    fetchImplementation,
    'BLS supplemental page',
  )
  const releases = discoverTable7Releases(await response.text(), response.url)
  return releases.at(-1)!
}

export async function downloadTable7Workbook(
  release: Table7ReleaseLink,
  fetchImplementation: typeof fetch = fetch,
): Promise<{ contents: Uint8Array; sourceReleaseDate: string }> {
  const response = await checkedFetch(
    release.url,
    fetchImplementation,
    'BLS Table 7 workbook',
  )
  const contents = new Uint8Array(await response.arrayBuffer())
  if (contents.length < 4 || contents[0] !== 0x50 || contents[1] !== 0x4b) {
    throw new Error('BLS Table 7 download is empty or is not XLSX content')
  }
  const modified = response.headers.get('last-modified')
  if (!modified || Number.isNaN(Date.parse(modified))) {
    throw new Error('BLS Table 7 response is missing a valid Last-Modified release date')
  }
  return {
    contents,
    sourceReleaseDate: new Date(modified).toISOString().slice(0, 10),
  }
}

export function buildInflationContributionSnapshot(
  history: InflationContributionHistory,
  latest: InflationContributionRelease,
): InflationContributionSnapshot {
  const priorPeriod = `${Number(latest.period.slice(0, 4)) - 1}${latest.period.slice(4)}`
  const prior = history.observations.find((observation) =>
    observation.period === priorPeriod && !('status' in observation))
  const selected = [prior, latest].filter(
    (observation): observation is InflationContributionRelease => Boolean(observation),
  )
  return {
    title: 'Category effects on 12-month CPI inflation',
    sourceName: 'U.S. Bureau of Labor Statistics, CPI-U 12-month analysis table',
    sourceUrl: latest.sourceUrl,
    retrievedAt: latest.sourceReleaseDate,
    units: 'Percentage-point effect on all-items CPI',
    methodology: 'Published unadjusted 12-month effects from BLS Table 7. Other services equals services less energy services minus shelter so the five groups are mutually exclusive.',
    observations: selected.map((observation) => ({
      date: observation.period,
      headline: observation.headlineCpiEffectTotal,
      categories: {
        shelter: observation.shelter,
        'other-services': observation.otherServices,
        food: observation.food,
        energy: observation.energy,
        'goods-excluding-food-and-energy': observation.commoditiesLessFoodAndEnergy,
      },
    })),
  }
}

async function writeJsonGroupAtomically(
  writes: readonly { outputPath: string; value: unknown }[],
): Promise<void> {
  const nonce = `${process.pid}.${Date.now()}`
  const prepared = writes.map(({ outputPath, value }, index) => ({
    outputPath,
    value,
    temporaryPath: `${outputPath}.${nonce}.${index}.tmp`,
    backupPath: `${outputPath}.${nonce}.${index}.bak`,
    backedUp: false,
    replaced: false,
  }))
  try {
    for (const item of prepared) {
      const serialized = `${JSON.stringify(item.value, null, 2)}\n`
      JSON.parse(serialized)
      await writeFile(item.temporaryPath, serialized, { flag: 'wx' })
    }
    for (const item of prepared) {
      await rename(item.outputPath, item.backupPath)
      item.backedUp = true
      await rename(item.temporaryPath, item.outputPath)
      item.replaced = true
    }
  } catch (error: unknown) {
    for (const item of [...prepared].reverse()) {
      if (item.replaced) await unlink(item.outputPath).catch(() => undefined)
      if (item.backedUp) await rename(item.backupPath, item.outputPath)
      await unlink(item.temporaryPath).catch(() => undefined)
    }
    throw error
  }
  await Promise.all(prepared.map((item) => unlink(item.backupPath)))
}

export async function refreshInflationContributions({
  historyPath,
  snapshotPath,
  fetchImplementation = fetch,
}: {
  historyPath: string
  snapshotPath: string
  fetchImplementation?: typeof fetch
}): Promise<'current' | 'updated'> {
  const history = JSON.parse(await readFile(historyPath, 'utf8')) as InflationContributionHistory
  validateInflationContributionCollection(history.observations)
  const latestCommitted = history.observations.filter(
    (observation): observation is InflationContributionRelease => !('status' in observation),
  ).at(-1)
  if (!latestCommitted) throw new Error('Inflation-contribution history has no release observations')
  process.stdout.write(`Inflation contributions: latest committed period ${latestCommitted.period}.\n`)
  const discovered = await fetchLatestTable7Release(fetchImplementation)
  process.stdout.write(`Inflation contributions: newest discovered BLS Table 7 period ${discovered.period}.\n`)
  const comparison = compareReleasePeriods(latestCommitted.period, discovered.period)
  if (comparison === 'current') {
    process.stdout.write(`Inflation contributions: no new BLS Table 7 release. Latest committed period: ${latestCommitted.period}.\n`)
    return 'current'
  }
  if (comparison === 'stale') {
    throw new Error(`Inflation contributions: suspicious stale discovery; committed ${latestCommitted.period}, discovered ${discovered.period}. Existing data preserved.`)
  }
  const expected = nextMonthlyPeriod(latestCommitted.period)
  if (discovered.period !== expected) {
    throw new Error(`Inflation contributions: multiple-period gap; expected ${expected}, discovered ${discovered.period}. Use the explicit backfill path.`)
  }
  try {
    process.stdout.write(`Inflation contributions: downloading ${discovered.url}.\n`)
    const download = await downloadTable7Workbook(discovered, fetchImplementation)
    const release = await parseInflationContributionWorkbook(download.contents, {
      period: discovered.period,
      sourceReleaseDate: download.sourceReleaseDate,
      sourceUrl: discovered.url,
      sourceFile: discovered.sourceFile,
    })
    const updatedHistory = {
      ...history,
      observations: [...history.observations, release],
    }
    validateInflationContributionCollection(updatedHistory.observations)
    if (updatedHistory.observations.length !== history.observations.length + 1) {
      throw new Error('validated history did not append exactly one release')
    }
    const snapshot = buildInflationContributionSnapshot(updatedHistory, release)
    await writeJsonGroupAtomically([
      { outputPath: historyPath, value: updatedHistory },
      { outputPath: snapshotPath, value: snapshot },
    ])
    process.stdout.write(`Inflation contributions: ingested BLS Table 7 for ${discovered.period}; validation passed and dataset changed.\n`)
    return 'updated'
  } catch (error: unknown) {
    throw new Error(`Inflation contributions: BLS Table 7 for ${discovered.period} is available, but it could not be safely ingested: ${error instanceof Error ? error.message : error}. Existing data preserved.`, { cause: error })
  }
}
