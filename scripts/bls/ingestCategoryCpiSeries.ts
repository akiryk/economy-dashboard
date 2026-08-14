import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import type {
  EconomicObservation,
  EconomicSeries,
} from '../../src/features/economic-series/models/economicSeries'
import { writeEconomicSeriesGroupAtomically } from '../writeEconomicSeries'

interface BlsDatum {
  year: string
  period: string
  value: string
}

interface BlsSeries {
  seriesID: string
  data: BlsDatum[]
}

interface BlsResponse {
  status: string
  Results?: { series?: BlsSeries[] }
}

interface CategoryConfiguration {
  seriesId: string
  slug: string
  title: string
  shortTitle: string
  description: string
}

const configurations: readonly CategoryConfiguration[] = [
  {
    seriesId: 'CUUR0000SAH1',
    slug: 'shelter-cpi-inflation',
    title: 'Shelter CPI: Percent Change from Year Ago',
    shortTitle: 'Shelter',
    description: 'The year-over-year percentage change in the unadjusted CPI-U shelter index.',
  },
  {
    seriesId: 'CUUR0000SA0E',
    slug: 'energy-cpi-inflation',
    title: 'Energy CPI: Percent Change from Year Ago',
    shortTitle: 'Energy',
    description: 'The year-over-year percentage change in the unadjusted CPI-U energy index.',
  },
  {
    seriesId: 'CUUR0000SAF1',
    slug: 'food-cpi-inflation',
    title: 'Food CPI: Percent Change from Year Ago',
    shortTitle: 'Food',
    description: 'The year-over-year percentage change in the unadjusted CPI-U food index.',
  },
]

export const BLS_PUBLIC_API_URL =
  'https://api.bls.gov/publicAPI/v2/timeseries/data/'

function datumPeriod(datum: BlsDatum): string | null {
  if (!/^M(0[1-9]|1[0-2])$/.test(datum.period)) return null
  return `${datum.year}-${datum.period.slice(1)}-01`
}

export function deriveCategoryCpiObservations(
  data: readonly BlsDatum[],
  windowStart: string,
  windowEnd: string,
): EconomicObservation[] {
  const indexByPeriod = new Map<string, number>()
  for (const datum of data) {
    const period = datumPeriod(datum)
    const value = Number(datum.value)
    if (period && Number.isFinite(value)) indexByPeriod.set(period, value)
  }
  const periods: string[] = []
  for (let date = windowStart; date <= windowEnd;) {
    periods.push(date)
    const year = Number(date.slice(0, 4))
    const month = Number(date.slice(5, 7))
    date = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, '0')}-01`
  }
  return periods.map((date) => {
      const value = indexByPeriod.get(date)
      const priorDate = `${Number(date.slice(0, 4)) - 1}${date.slice(4)}`
      const prior = indexByPeriod.get(priorDate)
      return {
        date,
        value: value === undefined || prior === undefined || prior === 0
          ? null
          : ((value / prior) - 1) * 100,
      }
    })
}

export function buildCategoryCpiSeries(
  response: BlsResponse,
  retrievedAt: string,
  windowStart = '2021-06-01',
  windowEnd?: string,
): EconomicSeries[] {
  if (response.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS request failed with status ${response.status}`)
  }
  const byId = new Map(
    (response.Results?.series ?? []).map((series) => [series.seriesID, series]),
  )
  for (const { seriesId } of configurations) {
    if (!byId.has(seriesId)) throw new Error(`Missing BLS series ${seriesId}`)
  }
  const latestCommonPeriod = windowEnd ?? configurations
    .map(({ seriesId }) => {
      const periods = (byId.get(seriesId)?.data ?? [])
        .map(datumPeriod)
        .filter((period): period is string => period !== null)
        .sort()
      return periods.at(-1)
    })
    .reduce<string | undefined>((earliest, period) =>
      !period ? undefined : !earliest || period < earliest ? period : earliest,
    undefined)
  if (!latestCommonPeriod || latestCommonPeriod < windowStart) {
    throw new Error('BLS category CPI response has no common monthly coverage')
  }
  return configurations.map((configuration) => {
    const source = byId.get(configuration.seriesId)
    if (!source) throw new Error(`Missing BLS series ${configuration.seriesId}`)
    const observations = deriveCategoryCpiObservations(
      source.data,
      windowStart,
      latestCommonPeriod,
    )
    if (observations.length < 61 ||
        observations.filter(({ value }) => value === null).length > 1) {
      throw new Error(
        `${configuration.seriesId} does not cover the required history ` +
        `(${observations.length} observations, ` +
        `${observations.filter(({ value }) => value === null).length} null)`,
      )
    }
    return {
      id: configuration.slug,
      slug: configuration.slug,
      provider: 'U.S. Bureau of Labor Statistics',
      providerSeriesId: configuration.seriesId,
      title: configuration.title,
      shortTitle: configuration.shortTitle,
      description: configuration.description,
      question: 'How quickly are prices changing in this category?',
      units: 'Percent change from year ago',
      frequency: 'monthly',
      seasonalAdjustment: 'Not seasonally adjusted',
      transformation: 'Percent change from year ago, calculated from the BLS CPI-U index',
      sourceName: 'U.S. Bureau of Labor Statistics',
      sourceUrl: `https://data.bls.gov/timeseries/${configuration.seriesId}`,
      retrievedAt,
      observations,
    }
  })
}

export async function refreshCategoryCpiSeries({
  outputDirectory,
  retrievedAt,
  fetchImplementation = fetch,
}: {
  outputDirectory: string
  retrievedAt: string
  fetchImplementation?: typeof fetch
}): Promise<EconomicSeries[]> {
  const endYear = Number(retrievedAt.slice(0, 4))
  const response = await fetchImplementation(BLS_PUBLIC_API_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      seriesid: configurations.map(({ seriesId }) => seriesId),
      startyear: String(endYear - 6),
      endyear: String(endYear),
    }),
  })
  if (!response.ok) throw new Error(`BLS category CPI request returned HTTP ${response.status}`)
  const series = buildCategoryCpiSeries(await response.json() as BlsResponse, retrievedAt)
  await writeEconomicSeriesGroupAtomically(series.map((item) => ({
    outputPath: path.join(outputDirectory, `${item.slug}.json`),
    series: item,
  })))
  process.stdout.write(
    `Inflation-driver category rates: ${series.map((item) =>
      `${item.providerSeriesId} through ${item.observations.at(-1)?.date}`).join(', ')}.\n`,
  )
  return series
}

async function main(arguments_: readonly string[]): Promise<void> {
  const inputIndex = arguments_.indexOf('--input')
  const outputIndex = arguments_.indexOf('--output-dir')
  const retrievedIndex = arguments_.indexOf('--retrieved-at')
  const input = arguments_[inputIndex + 1]
  const outputDirectory = arguments_[outputIndex + 1]
  const retrievedAt = arguments_[retrievedIndex + 1]
  if (inputIndex < 0 || outputIndex < 0 || retrievedIndex < 0 ||
      !input || !outputDirectory || !retrievedAt) {
    throw new Error('Required: --input, --output-dir, and --retrieved-at')
  }
  const response = JSON.parse(await readFile(input, 'utf8')) as BlsResponse
  const series = buildCategoryCpiSeries(response, retrievedAt)
  await writeEconomicSeriesGroupAtomically(series.map((item) => ({
    outputPath: path.join(outputDirectory, `${item.slug}.json`),
    series: item,
  })))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
