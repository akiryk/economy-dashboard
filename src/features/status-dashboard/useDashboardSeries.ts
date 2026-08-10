import { useEffect, useState } from 'react'
import type { EconomicSeries } from '../economic-series/models/economicSeries'
import { dashboardEconomicSeriesRepository } from '../economic-series/repositories/dashboardEconomicSeriesRepository'

interface DashboardSeriesState {
  status: 'loading' | 'ready'
  series: ReadonlyMap<string, EconomicSeries | null>
}

export function useDashboardSeries(slugs: readonly string[]): DashboardSeriesState {
  const [state, setState] = useState<DashboardSeriesState>({
    status: 'loading',
    series: new Map(),
  })

  useEffect(() => {
    let active = true
    void Promise.allSettled(slugs.map((slug) =>
      dashboardEconomicSeriesRepository.getBySlug(slug)))
      .then((results) => {
        if (!active) return
        setState({
          status: 'ready',
          series: new Map(results.map((result, index) => [
            slugs[index],
            result.status === 'fulfilled' ? result.value : null,
          ])),
        })
      })
    return () => { active = false }
  }, [slugs])

  return state
}
