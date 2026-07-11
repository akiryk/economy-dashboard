import type { EconomicSeries } from '../models/economicSeries'

export interface EconomicSeriesRepository {
  getBySlug(slug: string): Promise<EconomicSeries | null>
}
