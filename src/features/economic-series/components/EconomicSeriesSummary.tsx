import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  findLatestNonNullObservation,
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  selectMostRecentObservations,
} from '../utils/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import { RecentObservationsTable } from './RecentObservationsTable'
import { TimeRangeControl } from './TimeRangeControl'
import { getEconomicSeriesPresentation } from './seriesPresentation'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

interface EconomicSeriesSummaryProps {
  series: EconomicSeries
}

export function EconomicSeriesSummary({ series }: EconomicSeriesSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const presentation = getEconomicSeriesPresentation(series.slug)
  const latestObservation = findLatestNonNullObservation(series.observations)
  const recentObservations = selectMostRecentObservations(
    series.observations,
    presentation.recentObservationCount,
  )
  const visibleObservations = useMemo(
    () => filterObservationsByTimeRange(series.observations, selectedRange),
    [selectedRange, series.observations],
  )
  const chartSummary = useMemo(
    () => calculateChartSummary(visibleObservations),
    [visibleObservations],
  )

  return (
    <article
      className="series-card"
      aria-labelledby={`${series.slug}-question`}
    >
      <header className="series-card__header">
        <p className="series-card__eyebrow">{presentation.topicLabel}</p>
        <h2 id={`${series.slug}-question`}>{series.question}</h2>
        <p className="series-card__title">{series.title}</p>
      </header>

      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
      />

      {chartSummary.observationCount > 0 ? (
        <>
          <Suspense
            fallback={
              <p className="chart-state" role="status">
                Loading chart visualization…
              </p>
            }
          >
            <EconomicTimeSeriesChart
              observations={visibleObservations}
              seriesName={series.shortTitle}
              frequency={series.frequency}
            />
          </Suspense>
          <p className="chart-summary" aria-live="polite">
            For the selected period, {series.shortTitle} ranged from{' '}
            {formatPercentage(chartSummary.minimum?.value ?? null)} in{' '}
            {chartSummary.minimum
              ? formatObservationPeriod(
                  chartSummary.minimum.date,
                  series.frequency,
                )
              : 'an unavailable period'}{' '}
            to {formatPercentage(chartSummary.maximum?.value ?? null)} in{' '}
            {chartSummary.maximum
              ? formatObservationPeriod(
                  chartSummary.maximum.date,
                  series.frequency,
                )
              : 'an unavailable period'}. The latest value is{' '}
            {formatPercentage(chartSummary.latest?.value ?? null)} in{' '}
            {chartSummary.latest
              ? formatObservationPeriod(
                  chartSummary.latest.date,
                  series.frequency,
                )
              : 'an unavailable period'}.{' '}
            {chartSummary.hasBelowZero
              ? 'At least one observation was below zero.'
              : 'No observations were below zero.'}
          </p>
        </>
      ) : (
        <p className="chart-state" role="status">
          No {series.shortTitle} observations are available for the selected
          period.
        </p>
      )}

      <dl className="series-metadata">
        <div className="series-metadata__featured">
          <dt>Latest value</dt>
          <dd>{formatPercentage(latestObservation?.value ?? null)}</dd>
        </div>
        <div>
          <dt>Latest observation period</dt>
          <dd>
            {latestObservation
              ? formatObservationPeriod(
                  latestObservation.date,
                  series.frequency,
                )
              : 'Not available'}
          </dd>
        </div>
        <div>
          <dt>Units</dt>
          <dd>{series.units}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>
            {series.frequency.charAt(0).toUpperCase() + series.frequency.slice(1)}
          </dd>
        </div>
        <div>
          <dt>Seasonal adjustment</dt>
          <dd>{series.seasonalAdjustment ?? 'Not seasonally adjusted'}</dd>
        </div>
        <div>
          <dt>Transformation</dt>
          <dd>{series.transformation}</dd>
        </div>
        <div>
          <dt>Retrieved</dt>
          <dd>{formatDate(series.retrievedAt)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>
            <a href={series.sourceUrl} rel="noreferrer" target="_blank">
              {series.sourceName}
            </a>
          </dd>
        </div>
      </dl>

      <div className="series-explanations">
        <section>
          <h3>What this tells you</h3>
          <p>
            {presentation.whatThisTellsYou}
          </p>
        </section>
        <section>
          <h3>What this does not tell you</h3>
          <p>
            {presentation.whatThisDoesNotTellYou}
          </p>
        </section>
      </div>

      <RecentObservationsTable
        observations={recentObservations}
        frequency={series.frequency}
        caption={presentation.recentObservationsCaption}
        valueColumnLabel={presentation.valueColumnLabel}
      />
    </article>
  )
}
