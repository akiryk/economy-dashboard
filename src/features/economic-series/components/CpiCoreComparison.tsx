import { lazy, Suspense } from 'react'
import type { EconomicObservation, EconomicSeries } from '../models/economicSeries'
import {
  findLatestNonNullObservation,
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentagePoints,
} from '../utils/economicSeries'
import { formatHeadlineCoreComparison } from '../utils/cpiData'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

interface CpiCoreComparisonProps {
  cpi: EconomicSeries
  core: EconomicSeries
  cpiObservations: readonly EconomicObservation[]
  coreObservations: readonly EconomicObservation[]
  zoomStartDate: string
  zoomEndDate: string
  onZoomChange: (start: number, end: number) => void
}

export function CpiCoreComparison({
  cpi,
  core,
  cpiObservations,
  coreObservations,
  zoomStartDate,
  zoomEndDate,
  onZoomChange,
}: CpiCoreComparisonProps) {
  const latestCpi = findLatestNonNullObservation(cpi.observations)
  const latestCore = findLatestNonNullObservation(core.observations)
  const gap = latestCpi?.value !== null && latestCpi?.value !== undefined &&
      latestCore?.value !== null && latestCore?.value !== undefined
    ? latestCpi.value - latestCore.value
    : null

  return (
    <section
      className="cpi-expanded-comparison"
      aria-labelledby="cpi-core-comparison-heading"
    >
      <h4 id="cpi-core-comparison-heading">What is the underlying inflation trend?</h4>
      <p>
        Headline CPI includes food and energy. Core CPI excludes them because
        their prices can move sharply from month to month and obscure the
        broader inflation trend. Food and energy still matter to households;
        core CPI is a diagnostic measure, not a replacement for headline
        inflation.
      </p>
      <Suspense fallback={<p className="chart-state">Loading headline and core CPI comparison…</p>}>
        <EconomicTimeSeriesChart
          kind="inflation-comparison"
          variant="year-over-year"
          headlineObservations={cpiObservations}
          coreObservations={coreObservations}
          frequency="monthly"
          zoomStartDate={zoomStartDate}
          zoomEndDate={zoomEndDate}
          onZoomChange={onZoomChange}
        />
      </Suspense>
      <p className="chart-summary">
        Core CPI was {formatPercentage(latestCore?.value ?? null)} in{' '}
        {latestCore
          ? formatObservationPeriod(latestCore.date, 'monthly')
          : 'an unavailable month'}, compared with headline CPI at{' '}
        {formatPercentage(latestCpi?.value ?? null)} in{' '}
        {latestCpi
          ? formatObservationPeriod(latestCpi.date, 'monthly')
          : 'an unavailable month'}. The headline-core gap was{' '}
        {formatSignedPercentagePoints(gap)}{' '}
        {gap !== null && Number(Math.abs(gap).toFixed(1)) === 1
          ? 'percentage point'
          : 'percentage points'}.{' '}
        {formatHeadlineCoreComparison(
          latestCpi?.value ?? null,
          latestCore?.value ?? null,
        )}
      </p>
      <p>
        To see which categories are contributing most to current CPI inflation,
        see <a href="#inflation-drivers-card">What is driving inflation?</a>
      </p>
      <p className="series-source">
        Additional source:{' '}
        <a href={core.sourceUrl} rel="noreferrer" target="_blank">
          {core.providerSeriesId} — {core.sourceName}
        </a>
      </p>
      <dl className="series-metadata">
        <div>
          <dt>Core CPI transformation</dt>
          <dd>{core.transformation}</dd>
        </div>
        <div>
          <dt>Alignment</dt>
          <dd>Exact calendar months; missing values remain gaps</dd>
        </div>
        <div>
          <dt>“Close” threshold</dt>
          <dd>Less than 0.1 percentage point</dd>
        </div>
      </dl>
    </section>
  )
}
