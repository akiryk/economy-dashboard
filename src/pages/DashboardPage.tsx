import { useEffect, useState } from 'react'
import { EconomicSeriesSummary } from '../features/economic-series/components/EconomicSeriesSummary'
import type { EconomicSeries } from '../features/economic-series/models/economicSeries'
import { localEconomicSeriesRepository } from '../features/economic-series/repositories/localEconomicSeriesRepository'

type SeriesState =
  | { status: 'loading' }
  | { status: 'loaded'; series: EconomicSeries }
  | { status: 'not-found' }
  | { status: 'error' }

export function DashboardPage() {
  const [seriesState, setSeriesState] = useState<SeriesState>({
    status: 'loading',
  })

  useEffect(() => {
    let isActive = true

    async function loadSeries() {
      try {
        const series =
          await localEconomicSeriesRepository.getBySlug('real-gdp-growth')

        if (!isActive) return

        setSeriesState(
          series ? { status: 'loaded', series } : { status: 'not-found' },
        )
      } catch (error: unknown) {
        console.error('Failed to load the real GDP economic series', error)
        if (isActive) setSeriesState({ status: 'error' })
      }
    }

    void loadSeries()

    return () => {
      isActive = false
    }
  }, [])

  return (
    <div className="page">
      <section className="page-intro" aria-labelledby="dashboard-heading">
        <h1 id="dashboard-heading">U.S. Economy Dashboard</h1>
        <p>
          Economic indicators update at different frequencies and often tell
          different parts of the story. This dashboard will present several
          complementary measures rather than reducing the economy to a single
          score.
        </p>
      </section>

      {seriesState.status === 'loading' && (
        <p className="status-message" role="status">
          Loading economic data…
        </p>
      )}
      {seriesState.status === 'loaded' && (
        <EconomicSeriesSummary series={seriesState.series} />
      )}
      {seriesState.status === 'not-found' && (
        <p className="status-message" role="status">
          The requested economic series could not be found.
        </p>
      )}
      {seriesState.status === 'error' && (
        <p className="status-message status-message--error" role="alert">
          The economic data could not be loaded.
        </p>
      )}
    </div>
  )
}
