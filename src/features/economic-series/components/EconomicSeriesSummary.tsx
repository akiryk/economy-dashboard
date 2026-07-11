import { useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { EconomicTimeSeriesChart } from '../charts/EconomicTimeSeriesChart'
import {
  findLatestNonNullObservation,
  formatDate,
  formatPercentage,
  formatQuarterlyObservationDate,
  selectMostRecentObservations,
} from '../utils/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import { RecentObservationsTable } from './RecentObservationsTable'
import { TimeRangeControl } from './TimeRangeControl'

interface EconomicSeriesSummaryProps {
  series: EconomicSeries
}

export function EconomicSeriesSummary({ series }: EconomicSeriesSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const latestObservation = findLatestNonNullObservation(series.observations)
  const recentObservations = selectMostRecentObservations(series.observations, 8)
  const visibleObservations = useMemo(
    () => filterObservationsByTimeRange(series.observations, selectedRange),
    [selectedRange, series.observations],
  )
  const chartSummary = useMemo(
    () => calculateChartSummary(visibleObservations),
    [visibleObservations],
  )

  return (
    <article className="series-card" aria-labelledby="series-question">
      <header className="series-card__header">
        <p className="series-card__eyebrow">Economic growth</p>
        <h2 id="series-question">{series.question}</h2>
        <p className="series-card__title">{series.title}</p>
      </header>

      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
      />

      {chartSummary.observationCount > 0 ? (
        <>
          <EconomicTimeSeriesChart
            observations={visibleObservations}
            seriesName={series.shortTitle}
          />
          <p className="chart-summary" aria-live="polite">
            For the selected period, real GDP growth ranged from{' '}
            {formatPercentage(chartSummary.minimum?.value ?? null)} in{' '}
            {chartSummary.minimum
              ? formatQuarterlyObservationDate(chartSummary.minimum.date)
              : 'an unavailable period'}{' '}
            to {formatPercentage(chartSummary.maximum?.value ?? null)} in{' '}
            {chartSummary.maximum
              ? formatQuarterlyObservationDate(chartSummary.maximum.date)
              : 'an unavailable period'}. The latest value is{' '}
            {formatPercentage(chartSummary.latest?.value ?? null)} in{' '}
            {chartSummary.latest
              ? formatQuarterlyObservationDate(chartSummary.latest.date)
              : 'an unavailable period'}.{' '}
            {chartSummary.hasBelowZero
              ? 'At least one observation was below zero.'
              : 'No observations were below zero.'}
          </p>
        </>
      ) : (
        <p className="chart-state" role="status">
          No GDP growth observations are available for the selected period.
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
              ? formatQuarterlyObservationDate(latestObservation.date)
              : 'Not available'}
          </dd>
        </div>
        <div>
          <dt>Units</dt>
          <dd>{series.units}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>Quarterly</dd>
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
            Real GDP measures the inflation-adjusted value of goods and services
            produced in the United States. Year-over-year growth compares output
            with the same period one year earlier.
          </p>
        </section>
        <section>
          <h3>What this does not tell you</h3>
          <p>
            Total GDP growth does not show how gains are distributed, whether GDP
            per person is rising, or whether typical households are financially
            better off.
          </p>
        </section>
      </div>

      <RecentObservationsTable observations={recentObservations} />
    </article>
  )
}
