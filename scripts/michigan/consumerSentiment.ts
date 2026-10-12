import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import type { EconomicObservation, EconomicSeries } from '../../src/features/economic-series/models/economicSeries'
import { validateEconomicSeries } from '../../src/features/economic-series/models/validateEconomicSeries'
import { writeEconomicSeriesAtomically } from '../writeEconomicSeries'

export const consumerSentimentHistoryUrl = 'https://www.sca.isr.umich.edu/files/tbmics.csv'
export const consumerSentimentCurrentUrl = 'https://www.sca.isr.umich.edu/files/tbcics.csv'
export const consumerSentimentOutputFile = 'src/features/economic-series/data/consumer-sentiment.json'
const monthlyStart = '1978-01-01'
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

interface Reading extends EconomicObservation {
  value: number
  status: 'preliminary' | 'final'
}

function rows(csv: string): string[][] {
  return csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/).map((line) =>
    line.split(',').map((cell) => cell.trim().replace(/^"(.*)"$/, '$1')))
}

function parseRows(input: string[][], valueColumn: number): Reading[] {
  const readings: Reading[] = []
  const dates = new Set<string>()
  for (const row of input) {
    if (row.every((cell) => cell === '')) continue
    const monthLabel = row[0] ?? ''
    const match = /^([A-Za-z]+)(?:\s*\(P\))?$/.exec(monthLabel)
    const month = months.indexOf(match?.[1] ?? '')
    if (month < 0 || !/^\d{4}$/.test(row[1] ?? '')) throw new Error('Unexpected Michigan sentiment observation month or year')
    const date = `${row[1]}-${String(month + 1).padStart(2, '0')}-01`
    const text = row[valueColumn] ?? ''
    if (!/^\d+(?:\.\d+)?$/.test(text)) throw new Error(`Invalid Michigan sentiment value for ${date}`)
    const value = Number(text)
    if (!Number.isFinite(value) || value <= 0) throw new Error(`Invalid Michigan sentiment value for ${date}`)
    if (dates.has(date)) throw new Error(`Duplicate Michigan sentiment date: ${date}`)
    dates.add(date)
    readings.push({ date, value, status: monthLabel.endsWith('(P)') ? 'preliminary' : 'final' })
  }
  return readings.sort((a, b) => a.date.localeCompare(b.date))
}

/** Validate both official CSV formats and combine current releases with monthly history. */
export function buildConsumerSentimentSeries(historyCsv: string, currentCsv: string, retrievedAt: string): EconomicSeries {
  const historyRows = rows(historyCsv)
  if (historyRows[0]?.join(',') !== 'Month,YYYY,ICS_ALL') throw new Error('Unexpected Michigan sentiment history CSV header')
  const currentRows = rows(currentCsv)
  if (!currentRows.some((row) => row.includes('THE INDEX OF CONSUMER SENTIMENT'))) throw new Error('Unexpected Michigan sentiment current CSV title')
  const currentHeader = currentRows.findIndex((row) => row[0] === 'DATE OF SURVEY' && row[4] === 'INDEX OF CONSUMER SENTIMENT')
  if (currentHeader < 0) throw new Error('Unexpected Michigan sentiment current CSV header')
  const history = parseRows(historyRows.slice(1), 2).filter(({ date }) => date >= monthlyStart)
  const current = parseRows(currentRows.slice(currentHeader + 1), 4)
  if (history.length < 480 || history[0]?.date !== monthlyStart) throw new Error('Michigan sentiment history has insufficient coverage from January 1978')
  if (!current.length) throw new Error('Michigan sentiment current release is empty')
  const currentLatest = current.at(-1)!
  const historyLatest = history.at(-1)!
  const firstCurrentIndex = history.findIndex(({ date }) => date >= current[0]!.date)
  if (firstCurrentIndex < 0 || currentLatest.date > `${retrievedAt.slice(0, 7)}-01`) throw new Error('Michigan sentiment releases have invalid current coverage')
  const merged = new Map(history.map((item) => [item.date, item]))
  for (const item of current) {
    // A final history observation takes precedence over a stale preliminary file.
    if (item.status === 'preliminary' && merged.get(item.date)?.status === 'final') continue
    merged.set(item.date, item)
  }
  const combined = [...merged.values()].sort((a, b) => a.date.localeCompare(b.date))
  for (let index = 1; index < combined.length; index++) {
    const previous = new Date(`${combined[index - 1]!.date}T00:00:00Z`)
    previous.setUTCMonth(previous.getUTCMonth() + 1)
    if (previous.toISOString().slice(0, 10) !== combined[index]!.date) throw new Error(`Michigan sentiment history has a missing month before ${combined[index]!.date}`)
  }
  const latest = combined.at(-1)!
  if (currentLatest.date < historyLatest.date) throw new Error('Michigan sentiment current file trails the monthly history')
  return validateEconomicSeries({
    id: 'consumer-sentiment', slug: 'consumer-sentiment', provider: 'University of Michigan', providerSeriesId: 'ICS_ALL',
    title: 'University of Michigan Index of Consumer Sentiment', shortTitle: 'Consumer sentiment',
    description: 'A survey index of how U.S. consumers feel about their finances, business conditions, and buying conditions. Higher readings mean more optimism.',
    question: 'How do consumers feel about the economy?', units: 'Index 1966:Q1=100', frequency: 'monthly', seasonalAdjustment: 'Not seasonally adjusted',
    transformation: 'Published index level; monthly history from January 1978 plus the official current release; no smoothing or interpolation',
    sourceName: 'University of Michigan, Survey Research Center, Surveys of Consumers ©',
    sourceUrl: 'https://www.sca.isr.umich.edu/tables.html', retrievedAt,
    publicationStatus: latest.status,
    observations: combined.map(({ date, value }) => ({ date, value })),
    sources: [
      { provider: 'University of Michigan', providerSeriesId: 'ICS_ALL', sourceName: 'Surveys of Consumers monthly history', sourceUrl: consumerSentimentHistoryUrl, role: 'Historical monthly index levels' },
      { provider: 'University of Michigan', providerSeriesId: 'ICS current', sourceName: 'Surveys of Consumers current release', sourceUrl: consumerSentimentCurrentUrl, role: 'Newest preliminary or final reading and recent revisions' },
    ],
  })
}

/** Refresh one atomic dataset; source errors never replace last-known-good data. */
export async function refreshConsumerSentiment({ retrievedAt, outputPath = consumerSentimentOutputFile, fetchImplementation = fetch }: {
  retrievedAt: string
  outputPath?: string
  fetchImplementation?: typeof fetch
}): Promise<void> {
  const files = await Promise.all([consumerSentimentHistoryUrl, consumerSentimentCurrentUrl].map(async (url) => {
    const response = await fetchImplementation(url, { signal: AbortSignal.timeout(30_000) })
    if (!response.ok) throw new Error(`Michigan sentiment source returned HTTP ${response.status}`)
    return response.text()
  }))
  const series = buildConsumerSentimentSeries(files[0]!, files[1]!, retrievedAt)
  let previous: EconomicSeries | null = null
  try { previous = validateEconomicSeries(JSON.parse(await readFile(outputPath, 'utf8'))) }
  catch (error: unknown) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
  }
  const latest = series.observations.at(-1)!
  const previousLatest = previous?.observations.at(-1)
  if (previousLatest && (latest.date < previousLatest.date ||
    (latest.date === previousLatest.date && previous?.publicationStatus === 'final' && series.publicationStatus === 'preliminary'))) {
    throw new Error('Michigan sentiment source would regress the latest validated release')
  }
  await writeEconomicSeriesAtomically(outputPath, series)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  refreshConsumerSentiment({ retrievedAt: new Date().toISOString().slice(0, 10) }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
