export const savingRateDeciles = [
  { id: '0-10%', label: 'Bottom 10%' },
  { id: '10-20%', label: '10th–20th percentile' },
  { id: '20-30%', label: '20th–30th percentile' },
  { id: '30-40%', label: '30th–40th percentile' },
  { id: '40-50%', label: '40th–50th percentile' },
  { id: '50-60%', label: '50th–60th percentile' },
  { id: '60-70%', label: '60th–70th percentile' },
  { id: '70-80%', label: '70th–80th percentile' },
  { id: '80-90%', label: '80th–90th percentile' },
  { id: '90-100%', label: 'Top 10%' },
] as const

export type SavingRateDecileId = (typeof savingRateDeciles)[number]['id']
export type SavingRateEstimateStatus = 'final' | 'provisional' | 'experimental'

export interface SavingRateDistributionObservation {
  year: number
  decile: SavingRateDecileId
  rate: number | null
  status: SavingRateEstimateStatus
}

export interface SavingRateDistributionDataset {
  id: 'saving-rate-by-income-decile'
  sourceName: string
  sourceUrl: string
  workbookUrl: string
  methodologyUrl: string
  retrievedAt: string
  ranking: 'Equivalized Disposable Personal Income'
  units: 'Percent of disposable personal income'
  observations: SavingRateDistributionObservation[]
}
