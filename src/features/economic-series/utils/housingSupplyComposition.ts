export const priceBuckets = [
  ['under300', 'Under $300,000'],
  ['from300To399', '$300,000–$399,999'],
  ['from400To499', '$400,000–$499,999'],
  ['from500To599', '$500,000–$599,999'],
  ['from600To799', '$600,000–$799,999'],
  ['from800To999', '$800,000–$999,999'],
  ['millionOrMore', '$1,000,000 or more'],
] as const

export type PriceBucketKey = (typeof priceBuckets)[number][0]

export interface HousingPriceDistribution {
  year: number
  under300: number
  from300To399: number
  from400To499: number
  from500To599: number
  from600To799: number
  from800To999: number
  millionOrMore: number
}

export function validatePriceDistributions(value: unknown): HousingPriceDistribution[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Housing price distributions are required')
  let previousYear = 0
  return value.map((candidate) => {
    if (!candidate || typeof candidate !== 'object') throw new Error('Housing price row must be an object')
    const row = candidate as Partial<HousingPriceDistribution>
    if (!Number.isInteger(row.year) || row.year! < 2020 || row.year! <= previousYear) {
      throw new Error('Housing price years must be unique, ordered, and use the 2020-current buckets')
    }
    previousYear = row.year!
    priceBuckets.forEach(([key]) => {
      if (typeof row[key] !== 'number' || !Number.isFinite(row[key]) || row[key]! < 0) {
        throw new Error(`Invalid housing price bucket: ${key}`)
      }
    })
    const sum = priceBuckets.reduce((total, [key]) => total + row[key]!, 0)
    if (Math.abs(sum - 100) > 2) throw new Error(`Housing price shares for ${row.year} do not total approximately 100`)
    return row as HousingPriceDistribution
  })
}

export function calculateCompositionShares(input: {
  singleFamily: number | null
  twoToFour: number | null
  fiveOrMore: number | null
}): Record<'singleFamily' | 'twoToFour' | 'fiveOrMore', number> | null {
  const values = [input.singleFamily, input.twoToFour, input.fiveOrMore]
  if (values.some((value) => value === null || !Number.isFinite(value))) return null
  const total = values.reduce<number>((sum, value) => sum + value!, 0)
  if (total <= 0) return null
  return {
    singleFamily: input.singleFamily! / total * 100,
    twoToFour: input.twoToFour! / total * 100,
    fiveOrMore: input.fiveOrMore! / total * 100,
  }
}
