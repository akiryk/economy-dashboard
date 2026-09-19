import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import {
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  selectMostRecentObservations,
} from '../utils/economicSeries'
import { deriveHomeConstructionCostContext } from '../utils/homeConstructionCost'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { RecentObservationsTable } from './RecentObservationsTable'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(() => import('../charts/EconomicTimeSeriesChart'))

interface HomeConstructionCostSummaryProps {
  nominal: EconomicSeries
  annualDollars: EconomicSeries
}

function changeSentence(label: string, value: number | null): string {
  if (value === null) return `${label} comparison unavailable.`
  if (Math.abs(value) < 0.05) return `${label} costs were essentially unchanged.`
  return `${label} costs ${value > 0 ? 'rose' : 'fell'} ${formatPercentage(Math.abs(value))}.`
}

function comparisonPhrase(years: number, value: number): string {
  if (Math.abs(value) < 0.05) return `Costs are essentially unchanged from ${years} years earlier.`
  return `Costs are ${formatPercentage(Math.abs(value))} ${value > 0 ? 'higher' : 'lower'} than ${years} years earlier.`
}

function baseComparison(value: number): string {
  if (Math.abs(value) < 0.5) return 'About the same as the 2005 base-year cost level.'
  return `About ${Math.round(Math.abs(value))}% ${value > 0 ? 'higher' : 'lower'} than the 2005 base-year cost level.`
}

export function HomeConstructionCostSummary({
  nominal,
  annualDollars,
}: HomeConstructionCostSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const context = deriveHomeConstructionCostContext(nominal.observations)
  const compactObservations = useMemo(
    () => filterObservationsByTimeRange(nominal.observations, '20y'),
    [nominal.observations],
  )
  const presetObservations = useMemo(
    () => filterObservationsByTimeRange(nominal.observations, selectedRange),
    [nominal.observations, selectedRange],
  )
  const zoom = useHistoricalZoom(
    presetObservations,
    selectedRange,
    'monthly',
    setSelectedRange,
  )
  const visible = zoom.visibleItems
  const summary = calculateChartSummary(visible)
  const compactFirst = compactObservations.find(({ value }) => value !== null)
  const annualLatest = [...annualDollars.observations]
    .reverse()
    .find(({ value }) => value !== null)
  const annualFirst = annualDollars.observations.find(({ value }) => value !== null)
  const compactSummary = context && compactFirst?.value !== null && compactFirst?.value !== undefined
    ? `Monthly constant-quality construction-cost index from ${formatObservationPeriod(compactFirst.date, 'monthly')} through ${formatObservationPeriod(context.latestDate, 'monthly')}. The index moved from ${compactFirst.value.toFixed(1)} to ${context.latestIndex.toFixed(1)}. The source base is 2005 equals 100; the line shows published index levels and is not a dollar-per-square-foot series.`
    : 'Monthly constant-quality construction-cost index is unavailable.'

  return (
    <CompactMetricCardLayout
      cardId="single-family-construction-cost-index"
      eyebrow="Home-building costs"
      question="How much has the cost of building a comparable home risen?"
      measureLabel="Census constant-quality cost index for new single-family houses"
      latestValue={(
        <div className="series-current">
          <p className="series-current__value">
            {context ? context.latestIndex.toFixed(1) : 'Unavailable'}
          </p>
          <p className="series-current__label">Construction-cost index · 2005 = 100</p>
          <p className="series-current__period">
            {context
              ? formatObservationPeriod(context.latestDate, 'monthly')
              : 'Observation date unavailable'}
          </p>
          {context && (
            <>
              <p className="series-current__answer">
                {baseComparison(context.cumulativeSinceBase)}
              </p>
              <p className="series-current__comparison">
                {changeSentence('From a year earlier,', context.yearChange)}{' '}
                {changeSentence('From the prior month,', context.monthChange)}
              </p>
              {(context.tenYearChange !== null || context.twentyYearChange !== null) && (
                <p className="series-current__comparison">
                  {context.tenYearChange !== null && comparisonPhrase(10, context.tenYearChange)}{' '}
                  {context.twentyYearChange !== null && comparisonPhrase(20, context.twentyYearChange)}
                </p>
              )}
            </>
          )}
        </div>
      )}
      compactVisual={compactObservations.length > 1 ? (
        <div className="home-construction-cost__compact-chart">
          <p className="visually-hidden">{compactSummary}</p>
          <Suspense fallback={<p className="chart-state chart-state--compact">Loading construction-cost level chart…</p>}>
            <EconomicTimeSeriesChart
              kind="single"
              observations={compactObservations}
              seriesName="Construction-cost index"
              frequency="monthly"
              units="Index, 2005=100"
              transformation={nominal.transformation}
              includeZero={false}
              valueFormat="index"
              zoomStartDate={compactObservations[0]!.date}
              zoomEndDate={compactObservations.at(-1)!.date}
              onZoomChange={() => undefined}
            />
          </Suspense>
        </div>
      ) : undefined}
      expandedContent={(
        <>
          <section className="series-context" aria-labelledby="construction-cost-chart-heading">
            <h4 id="construction-cost-chart-heading">Constant-quality construction-cost level</h4>
            <TimeRangeControl
              selectedRange={selectedRange}
              onRangeChange={zoom.selectPreset}
              contextLabel="Construction-cost index"
            />
            <HistoricalZoomControls
              active={zoom.active}
              visiblePeriod={zoom.visiblePeriod}
              onMove={zoom.move}
              onResize={zoom.resize}
              onReset={zoom.reset}
            />
            <Suspense fallback={<p className="chart-state">Loading construction-cost chart…</p>}>
              <EconomicTimeSeriesChart
                key={selectedRange}
                kind="single"
                observations={presetObservations}
                seriesName="Construction-cost index"
                frequency="monthly"
                units="Index, 2005=100"
                transformation={nominal.transformation}
                includeZero={false}
                valueFormat="index"
                zoomStartDate={visible[0]?.date ?? ''}
                zoomEndDate={visible.at(-1)?.date ?? ''}
                onZoomChange={zoom.onChartZoom}
              />
            </Suspense>
            <p className="chart-summary" aria-live="polite">
              The visible period contains {summary.observationCount} monthly observations. The index moved from {visible.find(({ value }) => value !== null)?.value?.toFixed(1) ?? 'an unavailable starting level'} to {summary.latest?.value?.toFixed(1) ?? 'an unavailable latest level'}. Missing observations remain gaps; the series is not smoothed or carried forward.
            </p>
          </section>

          <section className="series-context" aria-labelledby="contractor-price-heading">
            <h4 id="contractor-price-heading">What does this mean in dollars?</h4>
            <p className="series-current__value">
              {annualLatest?.value === null || annualLatest?.value === undefined
                ? 'Unavailable'
                : `$${annualLatest.value.toFixed(2)}`}
            </p>
            <p className="series-current__label">Contractor-built homes: median contract price per square foot</p>
            <p className="series-current__period">
              {annualLatest ? formatObservationPeriod(annualLatest.date, 'annual') : 'Observation year unavailable'} · nominal dollars
            </p>
            {annualFirst && annualLatest && (
              <Suspense fallback={<p className="chart-state">Loading annual contractor-price chart…</p>}>
                <EconomicTimeSeriesChart
                  kind="single"
                  observations={annualDollars.observations}
                  seriesName="Median contract price per square foot"
                  frequency="annual"
                  units="Nominal dollars per square foot"
                  transformation={annualDollars.transformation}
                  includeZero={false}
                  valueFormat="dollars-per-square-foot"
                  zoomStartDate={annualFirst.date}
                  zoomEndDate={annualLatest.date}
                  onZoomChange={() => undefined}
                />
              </Suspense>
            )}
            <p>
              This annual Census measure reports the median contract price per square foot for contractor-built single-family homes and excludes the value of the improved lot. Unlike the constant-quality index above, the homes included each year are not identical, so changes can reflect differences in the mix and characteristics of homes as well as construction costs.
            </p>
            <RecentObservationsTable
              observations={selectMostRecentObservations(annualDollars.observations, 12)}
              frequency="annual"
              caption="Twelve most recent annual contractor-built price-per-square-foot observations"
              valueColumnLabel="Median contract price per square foot"
              valueFormat="dollars-per-square-foot"
            />
          </section>

          <section className="series-context" aria-labelledby="construction-cost-meaning-heading">
            <h4 id="construction-cost-meaning-heading">What this measure means</h4>
            <p>
              The monthly national index attempts to hold housing characteristics constant so changes more closely represent construction-cost change. An index value of 100 is the 2005 base-year cost level—not $100 per square foot. An index of 180 would mean the measured construction-cost level is approximately 80% above that base.
            </p>
            <p>
              Construction cost excludes land, financing and selling expenses, builder or developer profit, and other nonconstruction costs. National results can differ substantially from a specific project because labor, materials, site conditions, permitting, utilities, architecture, finishes, and local market conditions vary.
            </p>
            <p>
              The monthly index and annual dollar benchmark are separate statistical measures. The dashboard never advances an annual dollar value with the monthly index or presents a synthetic monthly dollar-per-square-foot estimate.
            </p>
          </section>

          <footer className="series-supporting">
            <p className="series-source">
              Sources:{' '}
              <a href={nominal.sourceUrl} rel="noreferrer" target="_blank">Monthly construction-cost index</a>
              {' · '}
              <a href={annualDollars.sourceUrl} rel="noreferrer" target="_blank">Annual contractor-built price per square foot</a>
            </p>
            <details className="supporting-disclosure">
              <summary>Series details</summary>
              <dl className="series-metadata">
                <div><dt>Monthly index</dt><dd>Laspeyres constant-quality index, 2005=100; not seasonally adjusted</dd></div>
                <div><dt>Annual benchmark</dt><dd>National median contract price per square foot in nominal dollars; improved lot excluded</dd></div>
                <div><dt>Monthly coverage</dt><dd>{formatObservationPeriod(nominal.observations[0]!.date, 'monthly')} to {context ? formatObservationPeriod(context.latestDate, 'monthly') : 'unavailable'}</dd></div>
                <div><dt>Retrieved</dt><dd>Monthly: {formatDate(nominal.retrievedAt)}; annual: {formatDate(annualDollars.retrievedAt)}</dd></div>
              </dl>
            </details>
            <details className="supporting-disclosure">
              <summary>Recent monthly observations</summary>
              <RecentObservationsTable
                observations={selectMostRecentObservations(nominal.observations, 12)}
                frequency="monthly"
                caption="Twelve most recent construction-cost index observations"
                valueColumnLabel="Index, 2005=100"
                valueFormat="index"
              />
            </details>
          </footer>
        </>
      )}
    />
  )
}
