import { useEffect, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { localEconomicSeriesRepository } from '../repositories/localEconomicSeriesRepository'
import { EconomicSeriesSummary } from './EconomicSeriesSummary'

type SeriesState =
  | { status: 'loading' }
  | {
      status: 'loaded'
      series: EconomicSeries
      supportingSeries: EconomicSeries | null
    }
  | { status: 'not-found' }
  | { status: 'error' }

interface EconomicSeriesCardProps {
  slug: string
  label: string
  onSeriesLoaded?: (slug: string, series: EconomicSeries | null) => void
  supportingSlug?: string
}

export function EconomicSeriesCard({
  slug,
  label,
  onSeriesLoaded,
  supportingSlug,
}: EconomicSeriesCardProps) {
  const [seriesState, setSeriesState] = useState<SeriesState>({
    status: 'loading',
  })

  useEffect(() => {
    let isActive = true

    async function loadSeries() {
      try {
        const [series, supportingSeries] = await Promise.all([
          localEconomicSeriesRepository.getBySlug(slug),
          supportingSlug
            ? localEconomicSeriesRepository.getBySlug(supportingSlug)
            : Promise.resolve(null),
        ])
        if (!isActive) return

        setSeriesState(
          series && (!supportingSlug || supportingSeries)
            ? { status: 'loaded', series, supportingSeries }
            : { status: 'not-found' },
        )
        onSeriesLoaded?.(slug, series)
      } catch (error: unknown) {
        console.error(`Failed to load economic series: ${slug}`, error)
        if (isActive) {
          setSeriesState({ status: 'error' })
          onSeriesLoaded?.(slug, null)
        }
      }
    }

    void loadSeries()
    return () => {
      isActive = false
    }
  }, [onSeriesLoaded, slug, supportingSlug])

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

  return (
    <EconomicSeriesSummary
      series={seriesState.series}
      supportingSeries={seriesState.supportingSeries}
    />
  )
}
