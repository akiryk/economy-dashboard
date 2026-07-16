import { useEffect, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { localEconomicSeriesRepository } from '../repositories/localEconomicSeriesRepository'
import { EconomicSeriesSummary } from './EconomicSeriesSummary'
import { WagesComparisonSummary } from './WagesComparisonSummary'
import { InflationComparisonSummary } from './InflationComparisonSummary'
import { HouseholdComparisonSummary } from './HouseholdComparisonSummary'
import { ProductivityLevelSummary } from './ProductivityLevelSummary'
import { ManufacturingComparisonSummary } from './ManufacturingComparisonSummary'

const noSupportingSlugs: readonly string[] = []

type SeriesState =
  | { status: 'loading' }
  | {
      status: 'loaded'
      series: EconomicSeries
      supportingSeries: EconomicSeries[]
    }
  | { status: 'not-found' }
  | { status: 'error' }

interface EconomicSeriesCardProps {
  slug: string
  label: string
  onSeriesLoaded?: (slug: string, series: EconomicSeries | null) => void
  supportingSlugs?: readonly string[]
  variant?:
    | 'inflation-momentum'
    | 'manufacturing-comparison'
    | 'household-comparison'
    | 'productivity-level'
    | 'headline-core-comparison'
    | 'single'
    | 'wages-comparison'
}

export function EconomicSeriesCard({
  slug,
  label,
  onSeriesLoaded,
  supportingSlugs = noSupportingSlugs,
  variant = 'single',
}: EconomicSeriesCardProps) {
  const [seriesState, setSeriesState] = useState<SeriesState>({
    status: 'loading',
  })

  useEffect(() => {
    let isActive = true

    async function loadSeries() {
      try {
        const [series, ...supportingSeries] = await Promise.all(
          [slug, ...supportingSlugs].map((seriesSlug) =>
            localEconomicSeriesRepository.getBySlug(seriesSlug),
          ),
        )
        if (!isActive) return

        setSeriesState(
          series && supportingSeries.every((supporting) => supporting !== null)
            ? {
                status: 'loaded',
                series,
                supportingSeries: supportingSeries.filter(
                  (supporting): supporting is EconomicSeries =>
                    supporting !== null,
                ),
              }
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
  }, [onSeriesLoaded, slug, supportingSlugs])

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

  if (variant === 'wages-comparison') {
    return (
      <WagesComparisonSummary
        realWageGrowth={seriesState.series}
        nominalWageGrowth={seriesState.supportingSeries[0]!}
        cpiInflation={seriesState.supportingSeries[1]!}
      />
    )
  }

  if (variant === 'household-comparison') {
    return (
      <HouseholdComparisonSummary
        income={seriesState.series}
        spending={seriesState.supportingSeries[0]!}
      />
    )
  }

  if (variant === 'productivity-level') {
    return <ProductivityLevelSummary series={seriesState.series} />
  }

  if (variant === 'manufacturing-comparison') {
    return <ManufacturingComparisonSummary output={seriesState.series} employment={seriesState.supportingSeries[0]!} />
  }

  if (
    variant === 'headline-core-comparison' ||
    variant === 'inflation-momentum'
  ) {
    return (
      <InflationComparisonSummary
        core={seriesState.series}
        headline={seriesState.supportingSeries[0]!}
        variant={
          variant === 'inflation-momentum' ? 'momentum' : 'year-over-year'
        }
      />
    )
  }

  return (
    <EconomicSeriesSummary
      series={seriesState.series}
      supportingSeries={seriesState.supportingSeries[0]}
    />
  )
}
