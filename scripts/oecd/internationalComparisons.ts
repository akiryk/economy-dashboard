import type {
  InternationalComparisonData,
  InternationalFrequency,
  InternationalMetric,
  InternationalMetricId,
  MetricDirection,
  PeerCountryCode,
} from '../../src/features/international-comparison/models/internationalComparison'
import { peerCountries, validateInternationalComparisonData } from '../../src/features/international-comparison/models/internationalComparison'

const OECD_API = 'https://sdmx.oecd.org/public/rest/data/'
// The OECD constraint service is sensitive to location ordering for some LFS
// flows. Keep the verified Developer API order instead of sorting this key.
const PEER_KEY = 'USA+AUS+CAN+FRA+DEU+ITA+JPN+KOR+ESP+GBR'

export interface OecdMetricConfiguration {
  id: InternationalMetricId
  title: string
  question: string
  frequency: InternationalFrequency
  direction: MetricDirection
  stalenessLimit: number
  agency: string
  dataflow: string
  version: string
  key: string
  expected: Readonly<Record<string, string>>
  allowed?: Readonly<Record<string, readonly string[]>>
  methodology: string
}

export const oecdMetricConfigurations: readonly OecdMetricConfiguration[] = [
  {
    id: 'prime-age-employment',
    title: 'Prime-age employment',
    question: 'What share of prime-age adults are employed?',
    frequency: 'quarterly',
    direction: 'higher-favorable',
    stalenessLimit: 2,
    agency: 'OECD.SDD.TPS',
    dataflow: 'DSD_LFS@DF_IALFS_EMP_WAP_Q',
    version: '1.0',
    key: `${PEER_KEY}.EMP_WAP.._Z.Y._T.Y25T54..Q`,
    expected: { MEASURE: 'EMP_WAP', UNIT_MEASURE: 'PT_WAP_SUB', TRANSFORMATION: '_Z', ADJUSTMENT: 'Y', SEX: '_T', AGE: 'Y25T54', ACTIVITY: '_Z', FREQ: 'Q' },
    methodology: 'Employment as a percentage of the population ages 25–54; calendar and seasonally adjusted.',
  },
  {
    id: 'unemployment',
    title: 'Unemployment',
    question: 'How high is unemployment?',
    frequency: 'monthly',
    direction: 'lower-favorable',
    stalenessLimit: 3,
    agency: 'OECD.SDD.TPS',
    dataflow: 'DSD_LFS@DF_IALFS_UNE_M',
    version: '1.0',
    key: `${PEER_KEY}..._Z.Y._T.Y_GE15..M`,
    expected: { MEASURE: 'UNE_LF_M', UNIT_MEASURE: 'PT_LF_SUB', TRANSFORMATION: '_Z', ADJUSTMENT: 'Y', SEX: '_T', AGE: 'Y_GE15', ACTIVITY: '_Z', FREQ: 'M' },
    methodology: 'Unemployed people as a percentage of the labour force; OECD-harmonized and seasonally adjusted.',
  },
  {
    id: 'headline-inflation',
    title: 'Headline inflation',
    question: 'How quickly are consumer prices rising?',
    frequency: 'monthly',
    direction: 'neutral',
    stalenessLimit: 3,
    agency: 'OECD.SDD.TPS',
    dataflow: 'DSD_G20_PRICES@DF_G20_PRICES',
    version: '1.0',
    key: `${PEER_KEY}.M...PA...`,
    expected: { FREQ: 'M', MEASURE: 'CPI', UNIT_MEASURE: 'PA', EXPENDITURE: '_T', ADJUSTMENT: 'N', TRANSFORMATION: 'GY' },
    allowed: { METHODOLOGY: ['N', 'HICP'] },
    methodology: 'Year-over-year all-items CPI; the OECD G20 flow uses HICP for EU members and the United Kingdom and national CPI for other peers.',
  },
  {
    id: 'real-gdp-growth',
    title: 'Real GDP growth',
    question: 'How quickly is real economic output growing?',
    frequency: 'quarterly',
    direction: 'neutral',
    stalenessLimit: 2,
    agency: 'OECD.SDD.NAD',
    dataflow: 'DSD_NAMAIN1@DF_QNA_EXPENDITURE_GROWTH_OECD',
    version: '1.1',
    key: `Q.Y.${PEER_KEY}.S1.S1.B1GQ._Z._Z._Z.PC.L.GY.T0102`,
    expected: { FREQ: 'Q', ADJUSTMENT: 'Y', SECTOR: 'S1', COUNTERPART_SECTOR: 'S1', TRANSACTION: 'B1GQ', INSTR_ASSET: '_Z', ACTIVITY: '_Z', EXPENDITURE: '_Z', UNIT_MEASURE: 'PC', PRICE_BASE: 'L', TRANSFORMATION: 'GY', TABLE_IDENTIFIER: 'T0102' },
    methodology: 'Year-over-year growth in chain-volume GDP; calendar and seasonally adjusted.',
  },
  {
    id: 'ten-year-government-yield',
    title: 'Ten-year government bond yield',
    question: 'What are governments paying to borrow for about ten years?',
    frequency: 'monthly',
    direction: 'neutral',
    stalenessLimit: 3,
    agency: 'OECD.SDD.STES',
    dataflow: 'DSD_STES@DF_FINMARK',
    version: '4.0',
    key: `${PEER_KEY}.M.IRLT.PA.....`,
    expected: { FREQ: 'M', MEASURE: 'IRLT', UNIT_MEASURE: 'PA', ACTIVITY: '_Z', ADJUSTMENT: '_Z', TRANSFORMATION: '_Z', TIME_HORIZ: '_Z', METHODOLOGY: 'N' },
    methodology: 'Monthly long-term interest rate centered on government bonds maturing in about ten years; percent per annum.',
  },
] as const

export function buildOecdUrl(config: OecdMetricConfiguration, startPeriod = '2025-Q1'): string {
  const period = config.frequency === 'monthly' ? '2025-01' : startPeriod
  return `${OECD_API}${config.agency},${config.dataflow},${config.version}/${config.key}?startPeriod=${period}&dimensionAtObservation=AllDimensions`
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]!
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else quoted = !quoted
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      row.push(field)
      field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else field += character
  }
  if (quoted) throw new Error('OECD CSV contains an unterminated quoted field')
  if (field || row.length) {
    row.push(field)
    if (row.some(Boolean)) rows.push(row)
  }
  return rows
}

export function normalizeOecdMetric(csv: string, config: OecdMetricConfiguration): InternationalMetric {
  const rows = parseCsv(csv)
  const header = rows.shift()
  if (!header) throw new Error(`${config.id}: OECD response is empty`)
  const index = new Map(header.map((name, position) => [name, position]))
  for (const required of ['DATAFLOW', 'REF_AREA', 'TIME_PERIOD', 'OBS_VALUE', ...Object.keys(config.expected), ...Object.keys(config.allowed ?? {})]) {
    if (!index.has(required)) throw new Error(`${config.id}: OECD schema is missing ${required}`)
  }
  const expectedDataflow = `${config.agency}:${config.dataflow}(${config.version})`
  const observations: InternationalMetric['observations'] = []
  const peers = new Set<string>(peerCountries.map(({ code }) => code))

  for (const row of rows) {
    const read = (column: string): string => row[index.get(column)!] ?? ''
    if (read('DATAFLOW') !== expectedDataflow) throw new Error(`${config.id}: unexpected OECD dataflow ${read('DATAFLOW')}`)
    for (const [column, expected] of Object.entries(config.expected)) {
      if (read(column) !== expected) throw new Error(`${config.id}: unexpected ${column} ${read(column)}`)
    }
    for (const [column, allowed] of Object.entries(config.allowed ?? {})) {
      if (!allowed.includes(read(column))) throw new Error(`${config.id}: unexpected ${column} ${read(column)}`)
    }
    const countryCode = read('REF_AREA')
    if (!peers.has(countryCode)) throw new Error(`${config.id}: unexpected country ${countryCode}`)
    const value = Number(read('OBS_VALUE'))
    if (!Number.isFinite(value)) throw new Error(`${config.id}: invalid value for ${countryCode} ${read('TIME_PERIOD')}`)
    observations.push({ countryCode: countryCode as PeerCountryCode, period: read('TIME_PERIOD'), value })
  }
  if (observations.length === 0) throw new Error(`${config.id}: OECD response has no observations`)

  return {
    id: config.id,
    title: config.title,
    question: config.question,
    unit: 'percent',
    frequency: config.frequency,
    direction: config.direction,
    stalenessLimit: config.stalenessLimit,
    source: {
      organization: 'OECD',
      dataflow: config.dataflow,
      version: config.version,
      url: buildOecdUrl(config),
      methodology: config.methodology,
    },
    observations: observations.sort((a, b) => a.countryCode.localeCompare(b.countryCode) || a.period.localeCompare(b.period)),
  }
}

export function createInternationalComparisonData(metrics: InternationalMetric[], retrievedAt: string): InternationalComparisonData {
  return validateInternationalComparisonData({ schemaVersion: 1, retrievedAt, metrics })
}
