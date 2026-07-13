export const economicFrequencies = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annual',
] as const

export type EconomicFrequency = (typeof economicFrequencies)[number]

export interface EconomicObservation {
  date: string
  value: number | null
}

export interface EconomicSeries {
  id: string
  slug: string
  provider: string
  providerSeriesId: string
  title: string
  shortTitle: string
  description: string
  question: string
  units: string
  frequency: EconomicFrequency
  seasonalAdjustment: string | null
  transformation: string
  sourceName: string
  sourceUrl: string
  retrievedAt: string
  observations: EconomicObservation[]
  sources?: EconomicSeriesSource[]
}

export interface EconomicSeriesSource {
  provider: string
  providerSeriesId: string
  sourceName: string
  sourceUrl: string
  role?: string
}
