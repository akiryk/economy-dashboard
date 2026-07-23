import { lazy, Suspense } from 'react'
import type {
  EconomicObservation,
  EconomicSeries,
} from '../models/economicSeries'
import {
  findLatestNonNullObservation,
  formatObservationPeriod,
  formatPercentage,
} from '../utils/economicSeries'
import { formatPceTargetComparison } from '../utils/cpiData'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

interface CpiPceComparisonProps {
  cpi: EconomicSeries
  pce: EconomicSeries
  cpiObservations: readonly EconomicObservation[]
  pceObservations: readonly EconomicObservation[]
  zoomStartDate: string
  zoomEndDate: string
  onZoomChange: (start: number, end: number) => void
}

export function CpiPceComparison({
  cpi,
  pce,
  cpiObservations,
  pceObservations,
  zoomStartDate,
  zoomEndDate,
  onZoomChange,
}: CpiPceComparisonProps) {
  const latestCpi = findLatestNonNullObservation(cpi.observations)
  const latestPce = findLatestNonNullObservation(pce.observations)
  const pceTargetComparison = formatPceTargetComparison(latestPce?.value ?? null)
  const releaseTiming = latestCpi && latestPce && latestCpi.date !== latestPce.date
    ? `The latest releases differ: CPI currently ends in ${formatObservationPeriod(latestCpi.date, 'monthly')}, while PCE currently ends in ${formatObservationPeriod(latestPce.date, 'monthly')}. No value is carried forward.`
    : 'The latest CPI and PCE observations cover the same month.'

  return (
    <section
      className="cpi-expanded-comparison"
      aria-labelledby="cpi-pce-comparison-heading"
    >
      <h4 id="cpi-pce-comparison-heading">
        How does CPI compare with the Fed’s preferred inflation measure?
      </h4>
      <p>
        CPI measures changes in prices paid directly by consumers and is the
        primary measure shown on this card. PCE covers a broader range of
        household spending, including spending made on households’ behalf, and
        is the inflation measure the Federal Reserve uses for its 2% longer-run
        goal.
      </p>
      <Suspense fallback={<p className="chart-state">Loading CPI and PCE comparison…</p>}>
        <EconomicTimeSeriesChart
          kind="inflation-comparison"
          variant="cpi-pce"
          headlineObservations={cpiObservations}
          coreObservations={pceObservations}
          frequency="monthly"
          zoomStartDate={zoomStartDate}
          zoomEndDate={zoomEndDate}
          onZoomChange={onZoomChange}
        />
      </Suspense>
      <p className="chart-summary">
        CPI inflation was {formatPercentage(latestCpi?.value ?? null)} in{' '}
        {latestCpi
          ? formatObservationPeriod(latestCpi.date, 'monthly')
          : 'an unavailable month'}. PCE inflation was{' '}
        {formatPercentage(latestPce?.value ?? null)} in{' '}
        {latestPce
          ? formatObservationPeriod(latestPce.date, 'monthly')
          : 'an unavailable month'}. {pceTargetComparison} {releaseTiming}
      </p>
      <p>
        CPI and PCE usually move in the same broad direction, but they can
        differ because they use different scopes, weights, and formulas.
      </p>
      <p className="series-source">
        Additional source:{' '}
        <a href={pce.sourceUrl} rel="noreferrer" target="_blank">
          PCEPI — {pce.sourceName}
        </a>
      </p>
      <dl className="series-metadata">
        <div>
          <dt>PCE series</dt>
          <dd>{pce.providerSeriesId} · Headline PCE price index</dd>
        </div>
        <div>
          <dt>PCE transformation</dt>
          <dd>{pce.transformation}</dd>
        </div>
        <div>
          <dt>Alignment</dt>
          <dd>Exact calendar months; missing values remain gaps</dd>
        </div>
      </dl>
    </section>
  )
}
