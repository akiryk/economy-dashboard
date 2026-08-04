import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateHousingConstructionDetails } from '../src/features/economic-series/utils/housingConstructionDetails'
import { validatePriceDistributions } from '../src/features/economic-series/utils/housingSupplyComposition'
import { writeJsonGroupAtomically } from './writeJsonGroupAtomically'

const graphUrl = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id='
const sources = {
  regions: ['HOUSTNE', 'HOUSTMW', 'HOUSTS', 'HOUSTW'],
  populations: ['CNERPOP', 'CMWRPOP', 'CSOUPOP', 'CWSTPOP'],
  permits: ['PERMIT', 'PERMIT1', 'PERMIT24', 'PERMIT5'],
  starts: ['HOUST', 'HOUST1F', 'HOUST2F', 'HOUST5F'],
  underConstruction: ['UNDCONTSA', 'UNDCON1USA', 'UNDCON24USA', 'UNDCON5MUSA'],
  completions: ['COMPUTSA', 'COMPU1USA', 'COMPU24USA', 'COMPU5MUSA'],
  prices: ['NHSUSSPU30AP', 'NHSUSSP30T39AP', 'NHSUSSP40T49AP', 'NHSUSSP50T59AP', 'NHSUSSP60T79AP', 'NHSUSSP80T99AP', 'NHSUSSP100OAP'],
  completedSize: ['COMPSFLAM1FQ'],
} as const

type SourceName = keyof typeof sources
type CsvRow = Readonly<Record<string, string>>

function parseCsv(csv: string, source: SourceName): CsvRow[] {
  const lines = csv.trim().split(/\r?\n/)
  const headers = lines.shift()?.split(',') ?? []
  if (headers[0] !== 'observation_date' ||
      sources[source].some((id) => !headers.includes(id))) {
    throw new Error(`Unexpected ${source} CSV fields`)
  }
  return lines.map((line) => {
    const cells = line.split(',')
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  })
}

function numberOrNull(value: string): number | null {
  if (value === '' || value === '.') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid housing value: ${value}`)
  return parsed
}

export async function refreshHousingConstructionDetails(options: {
  compositionOutputPath?: string
  fetchImplementation?: typeof fetch
  outputPath: string
  retrievedAt: string
}): Promise<void> {
  const request = options.fetchImplementation ?? fetch
  const entries = await Promise.all(Object.entries(sources).map(async ([name, ids]) => {
    const response = await request(`${graphUrl}${ids.join(',')}`)
    if (!response.ok) throw new Error(`Housing ${name} download failed: HTTP ${response.status}`)
    return [name, parseCsv(await response.text(), name as SourceName)] as const
  }))
  const rows = Object.fromEntries(entries) as Record<SourceName, CsvRow[]>
  const pipeline = (['permits', 'starts', 'underConstruction', 'completions'] as const)
    .map((stage) => [stage, rows[stage]
      .filter((row) => row.observation_date >= '2021-01-01')
      .map((row) => ({
        date: row.observation_date,
        total: numberOrNull(row[sources[stage][0]]),
        singleFamily: numberOrNull(row[sources[stage][1]]),
        twoToFour: numberOrNull(row[sources[stage][2]]),
        fiveOrMore: numberOrNull(row[sources[stage][3]]),
      }))])
  const value = validateHousingConstructionDetails({
    retrievedAt: options.retrievedAt,
    regions: rows.regions.filter((row) => row.observation_date >= '2015-01-01').map((row) => ({
      date: row.observation_date,
      northeast: numberOrNull(row.HOUSTNE),
      midwest: numberOrNull(row.HOUSTMW),
      south: numberOrNull(row.HOUSTS),
      west: numberOrNull(row.HOUSTW),
    })),
    populations: rows.populations.filter((row) => row.observation_date >= '2015-01-01').map((row) => ({
      year: Number(row.observation_date.slice(0, 4)),
      northeast: numberOrNull(row.CNERPOP),
      midwest: numberOrNull(row.CMWRPOP),
      south: numberOrNull(row.CSOUPOP),
      west: numberOrNull(row.CWSTPOP),
    })),
    pipeline: Object.fromEntries(pipeline),
  })
  const prices = validatePriceDistributions(rows.prices.map((row) => ({
    year: Number(row.observation_date.slice(0, 4)),
    under300: numberOrNull(row.NHSUSSPU30AP),
    from300To399: numberOrNull(row.NHSUSSP30T39AP),
    from400To499: numberOrNull(row.NHSUSSP40T49AP),
    from500To599: numberOrNull(row.NHSUSSP50T59AP),
    from600To799: numberOrNull(row.NHSUSSP60T79AP),
    from800To999: numberOrNull(row.NHSUSSP80T99AP),
    millionOrMore: numberOrNull(row.NHSUSSP100OAP),
  })))
  const composition = {
    retrievedAt: options.retrievedAt,
    priceBucketMethod: '2020-current',
    prices,
    completedSingleFamilyMedianSquareFeet: rows.completedSize
      .filter((row) => row.observation_date >= '2015-01-01')
      .map((row) => ({ date: row.observation_date, value: numberOrNull(row.COMPSFLAM1FQ) })),
  }
  await writeJsonGroupAtomically([
    { outputPath: options.outputPath, value },
    ...(options.compositionOutputPath
      ? [{ outputPath: options.compositionOutputPath, value: composition }]
      : []),
  ])
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  await refreshHousingConstructionDetails({
    outputPath: path.resolve('src/features/economic-series/data/housing-construction-details.json'),
    compositionOutputPath: path.resolve('src/features/economic-series/data/housing-supply-composition.json'),
    retrievedAt: new Date().toISOString().slice(0, 10),
  })
  console.log('Updated housing construction details.')
}
