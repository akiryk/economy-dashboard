import { lazy, Suspense, useEffect, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { localEconomicSeriesRepository } from '../repositories/localEconomicSeriesRepository'
import { EconomicSeriesSummary } from './EconomicSeriesSummary'
import { WagesComparisonSummary } from './WagesComparisonSummary'
import { InflationComparisonSummary } from './InflationComparisonSummary'
import { HouseholdComparisonSummary } from './HouseholdComparisonSummary'
import { ProductivityLevelSummary } from './ProductivityLevelSummary'
import { ManufacturingComparisonSummary } from './ManufacturingComparisonSummary'
import { RateComparisonSummary } from './RateComparisonSummary'
import { InflationDriversSummary } from './InflationDriversSummary'
import { RecentInflationMomentumSummary } from './RecentInflationMomentumSummary'
import { MortgageRateSummary } from './MortgageRateSummary'
import { PolicyRateSummary } from './PolicyRateSummary'

const noSupportingSlugs: readonly string[] = []
const ClaimsComparisonSummary = lazy(() =>
  import('./ClaimsComparisonSummary').then((module) => ({
    default: module.ClaimsComparisonSummary,
  })),
)

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
  collapsible?: boolean
  slug: string
  label: string
  onSeriesLoaded?: (slug: string, series: EconomicSeries | null) => void
  supportingSlugs?: readonly string[]
  variant?:
    | 'inflation-momentum'
    | 'manufacturing-comparison'
    | 'mortgage-rate'
    | 'policy-rate'
    | 'household-comparison'
    | 'productivity-level'
    | 'rate-comparison'
    | 'claims-comparison'
    | 'headline-core-comparison'
    | 'inflation-drivers'
    | 'single'
    | 'wages-comparison'
}

export function EconomicSeriesCard({
  collapsible = false,
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
          [slug, ...supportingSlugs].map((seriesSlug, index) =>
            localEconomicSeriesRepository.getBySlug(seriesSlug).catch(
              (error: unknown) => {
                if (variant !== 'inflation-drivers' || index === 0) throw error
                console.error(
                  `Failed to load optional supporting series: ${seriesSlug}`,
                  error,
                )
                return null
              },
            ),
          ),
        )
        if (!isActive) return

        setSeriesState(
          series && (
            variant === 'inflation-drivers' ||
            supportingSeries.every((supporting) => supporting !== null)
          )
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
  }, [onSeriesLoaded, slug, supportingSlugs, variant])

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

  if (variant === 'rate-comparison') {
    return <RateComparisonSummary tenYear={seriesState.series} threeMonth={seriesState.supportingSeries[0]!} federalFunds={seriesState.supportingSeries[1]!} />
  }

  if (variant === 'mortgage-rate') {
    return <MortgageRateSummary series={seriesState.series} />
  }

  if (variant === 'policy-rate') {
    return <PolicyRateSummary lower={seriesState.series} upper={seriesState.supportingSeries[0]!} historicalTarget={seriesState.supportingSeries[1]!} prime={seriesState.supportingSeries[2]!} effective={seriesState.supportingSeries[3]!} />
  }

  if (variant === 'claims-comparison') {
    return (
      <Suspense fallback={<p className="status-message">Loading layoffs card…</p>}>
        <ClaimsComparisonSummary
          joltsLayoffRate={seriesState.series}
          movingAverage={seriesState.supportingSeries[0]!}
          weeklyClaims={seriesState.supportingSeries[1]!}
        />
      </Suspense>
    )
  }

  if (variant === 'inflation-momentum') {
    return (
      <RecentInflationMomentumSummary
        threeMonthHeadline={seriesState.series}
        twelveMonthHeadline={seriesState.supportingSeries[0]!}
        twelveMonthCore={seriesState.supportingSeries[1]!}
        threeMonthCore={seriesState.supportingSeries[2]!}
      />
    )
  }

  if (variant === 'headline-core-comparison') {
    return (
      <InflationComparisonSummary
        core={seriesState.series}
        headline={seriesState.supportingSeries[0]!}
        variant="year-over-year"
      />
    )
  }

  if (variant === 'inflation-drivers') {
    return (
      <InflationDriversSummary
        headline={seriesState.series}
        supportingSeries={seriesState.supportingSeries}
      />
    )
  }

  return (
    <EconomicSeriesSummary
      collapsible={collapsible}
      series={seriesState.series}
      supportingSeries={seriesState.supportingSeries}
    />
  )
}
