import { lazy, Suspense } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  deriveHomeConstructionCostContext,
  deriveYearOverYearChanges,
} from '../utils/homeConstructionCost'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

interface HomeConstructionCostSummaryProps {
  nominal: EconomicSeries
  real: EconomicSeries
}

function direction(value: number): string {
  if (Math.abs(value) < 0.05) return 'were essentially unchanged'
  return value > 0 ? 'rose' : 'fell'
}

export function HomeConstructionCostSummary({
  nominal,
  real,
}: HomeConstructionCostSummaryProps) {
  const context = deriveHomeConstructionCostContext(
    nominal.observations,
    real.observations,
  )
  const annualChanges = deriveYearOverYearChanges(nominal.observations)
  const recentChanges = annualChanges.slice(-121)
  const latestDate = recentChanges.at(-1)?.date ?? nominal.observations.at(-1)?.date

  return (
    <CompactMetricCardLayout
      cardId="single-family-construction-cost-index"
      eyebrow="Home-building costs"
      question="How quickly is the cost of building a comparable home changing?"
      measureLabel="Census constant-quality cost index for new single-family houses"
      latestValue={(
        <div className="series-current">
          <p className="series-current__value">
            {formatSignedPercentage(context?.yearChange ?? null)}
          </p>
          <p className="series-current__label">change from a year ago</p>
          <p className="series-current__period">
            {context
              ? `${formatObservationPeriod(context.latestDate, 'monthly')} · monthly national index`
              : 'Latest comparison unavailable'}
          </p>
          {context && (
            <>
              <p className="series-current__answer">
                Costs {direction(context.monthChange)} {formatPercentage(Math.abs(context.monthChange))} from the prior month.
              </p>
              <p className="series-current__comparison">
                After adjusting for consumer prices, comparable building costs {direction(context.realYearChange)} {formatPercentage(Math.abs(context.realYearChange))} from a year ago.
              </p>
            </>
          )}
        </div>
      )}
      expandedContent={(
        <>
          <section className="series-context" aria-labelledby="construction-cost-chart-heading">
            <h4 id="construction-cost-chart-heading">Monthly year-over-year construction-cost change</h4>
            {latestDate && recentChanges.length > 1 && (
              <Suspense fallback={<p className="status-message">Loading construction-cost chart…</p>}>
                <EconomicTimeSeriesChart
                  kind="single"
                  observations={recentChanges}
                  seriesName="Change from a year ago"
                  frequency="monthly"
                  units="Percent"
                  transformation="Percent change from the same month one year earlier"
                  includeZero
                  valueFormat="signed-percentage"
                  zoomStartDate={recentChanges[0]!.date}
                  zoomEndDate={latestDate}
                  onZoomChange={() => undefined}
                />
              </Suspense>
            )}
          </section>
          <section className="series-context" aria-labelledby="construction-cost-meaning-heading">
            <h4 id="construction-cost-meaning-heading">What this measure means</h4>
            <p>
              Census compares houses with fixed characteristics, so the index is designed to track construction-cost change without treating larger or higher-specification houses as pure inflation. It covers new single-family houses under construction and excludes land and other nonconstruction costs.
            </p>
            <p>
              This is not a monthly dollar-per-square-foot estimate. Census publishes observed contractor-built price-per-square-foot figures annually; converting that annual benchmark into monthly dollars would imply precision the source does not provide.
            </p>
            <p>
              <a href="https://www.census.gov/construction/chars/xls/contractpricesqft_cust.xls">Annual contractor-built price per square foot</a>
              {' · '}
              <a href={nominal.sourceUrl}>Source and methodology</a>
            </p>
          </section>
        </>
      )}
    />
  )
}
