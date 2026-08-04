import type { EconomicObservation } from '../models/economicSeries'

export const housingRegions = ['northeast', 'midwest', 'south', 'west'] as const
export type HousingRegion = (typeof housingRegions)[number]
export const housingRegionLabels: Readonly<Record<HousingRegion, string>> = {
  northeast: 'Northeast',
  midwest: 'Midwest',
  south: 'South',
  west: 'West',
}

export const housingPipelineStages = [
  'permits', 'starts', 'underConstruction', 'completions',
] as const
export type HousingPipelineStage = (typeof housingPipelineStages)[number]

type RegionalRawObservation = { date: string } & Record<HousingRegion, number | null>

type RegionalPopulation = { year: number } & Record<HousingRegion, number | null>

export interface PipelineObservation {
  date: string
  total: number | null
  singleFamily: number | null
  twoToFour: number | null
  fiveOrMore: number | null
}

export interface HousingConstructionDetailsData {
  retrievedAt: string
  regions: RegionalRawObservation[]
  populations: RegionalPopulation[]
  pipeline: Record<HousingPipelineStage, PipelineObservation[]>
}

export interface RegionalHousingPoint extends EconomicObservation {
  rawAnnualizedThousands: number | null
}

const isoMonth = /^\d{4}-(?:0[1-9]|1[0-2])-01$/

function finiteOrNull(value: unknown, field: string): number | null {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Housing construction ${field} must be finite or null`)
  }
  return value
}

export function validateHousingConstructionDetails(
  value: unknown,
): HousingConstructionDetailsData {
  if (!value || typeof value !== 'object') throw new Error('Housing construction data must be an object')
  const candidate = value as Partial<HousingConstructionDetailsData>
  if (!Array.isArray(candidate.regions) || !Array.isArray(candidate.populations) || !candidate.pipeline) {
    throw new Error('Housing construction data is missing required collections')
  }
  const dates = new Set<string>()
  candidate.regions.forEach((row) => {
    if (!isoMonth.test(row.date) || dates.has(row.date)) throw new Error('Regional housing dates must be unique monthly dates')
    dates.add(row.date)
    housingRegions.forEach((region) => finiteOrNull(row[region], region))
  })
  housingPipelineStages.forEach((stage) => {
    const rows = candidate.pipeline?.[stage]
    if (!Array.isArray(rows)) throw new Error(`Housing pipeline is missing ${stage}`)
    const stageDates = new Set<string>()
    rows.forEach((row) => {
      if (!isoMonth.test(row.date) || stageDates.has(row.date)) throw new Error(`${stage} dates must be unique monthly dates`)
      stageDates.add(row.date)
      ;(['total', 'singleFamily', 'twoToFour', 'fiveOrMore'] as const)
        .forEach((field) => finiteOrNull(row[field], `${stage}.${field}`))
    })
  })
  return candidate as HousingConstructionDetailsData
}

export function deriveRegionalHousingStarts(
  data: HousingConstructionDetailsData,
): Record<HousingRegion, RegionalHousingPoint[]> {
  const populationByYear = new Map(data.populations.map((row) => [row.year, row]))
  return Object.fromEntries(housingRegions.map((region) => [region,
    data.regions.map((row) => {
      const raw = row[region]
      const population = populationByYear.get(Number(row.date.slice(0, 4)))?.[region] ?? null
      return {
        date: row.date,
        rawAnnualizedThousands: raw,
        value: raw === null || population === null || population <= 0
          ? null
          : (raw / population) * 1000,
      }
    }),
  ])) as Record<HousingRegion, RegionalHousingPoint[]>
}

export function latestSharedRegionalPeriod(
  regional: Record<HousingRegion, readonly RegionalHousingPoint[]>,
): string | null {
  const validDates = housingRegions.map((region) => new Set(
    regional[region].filter(({ value, rawAnnualizedThousands }) =>
      value !== null && rawAnnualizedThousands !== null).map(({ date }) => date),
  ))
  return [...validDates[0]].filter((date) => validDates.slice(1).every((set) => set.has(date))).at(-1) ?? null
}

export function createRegionalHousingAccessibleSummary(
  regional: Record<HousingRegion, readonly RegionalHousingPoint[]>,
): string {
  const date = latestSharedRegionalPeriod(regional)
  if (!date) return 'A shared regional housing-start period is unavailable.'
  const values = housingRegions.map((region) => {
    const point = regional[region].find((candidate) => candidate.date === date)!
    return `${housingRegionLabels[region]} ${point.value!.toFixed(2)} starts per 1,000 residents (${point.rawAnnualizedThousands} thousand units at an annualized rate)`
  })
  return `At the latest shared period, ${date.slice(0, 7)}, ${values.join('; ')}.`
}
