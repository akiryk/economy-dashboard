import { useEffect, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { localEconomicSeriesRepository } from '../repositories/localEconomicSeriesRepository'
import { EconomicSeriesSummary } from './EconomicSeriesSummary'

type SeriesState =
  | { status: 'loading' }
  | { status: 'loaded'; series: EconomicSeries }
  | { status: 'not-found' }
  | { status: 'error' }

interface EconomicSeriesCardProps {
  slug: string
  label: string
}

export function EconomicSeriesCard({ slug, label }: EconomicSeriesCardProps) {
  const [seriesState, setSeriesState] = useState<SeriesState>({
    status: 'loading',
  })

  useEffect(() => {
    let isActive = true

    async function loadSeries() {
      try {
        const series = await localEconomicSeriesRepository.getBySlug(slug)
        if (!isActive) return

        setSeriesState(
          series ? { status: 'loaded', series } : { status: 'not-found' },
        )
      } catch (error: unknown) {
        console.error(`Failed to load economic series: ${slug}`, error)
        if (isActive) setSeriesState({ status: 'error' })
      }
    }

    void loadSeries()
    return () => {
      isActive = false
    }
  }, [slug])

  if (seriesState.status === 'loading') {
    return (
      <p className="status-message" role="status">
        Loading {label} data…
      </p>
    )
  }

  if (seriesState.status === 'not-found') {
    return (
      <p className="status-message" role="status">
        The requested {label} series could not be found.
      </p>
    )
  }

  if (seriesState.status === 'error') {
    return (
      <p className="status-message status-message--error" role="alert">
        The {label} data could not be loaded.
      </p>
    )
  }

  return <EconomicSeriesSummary series={seriesState.series} />
}
