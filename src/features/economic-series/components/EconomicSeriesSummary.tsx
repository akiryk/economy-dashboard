import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  findLatestNonNullObservation,
  formatEconomicValue,
  formatJobChangeProse,
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
  selectMostRecentObservations,
  sortObservationsChronologically,
} from '../utils/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import { RecentObservationsTable } from './RecentObservationsTable'
import { PayrollObservationsTable } from './PayrollObservationsTable'
import { TimeRangeControl } from './TimeRangeControl'
import { getEconomicSeriesPresentation } from './seriesPresentation'
import { SavingRateTable } from './SavingRateTable'
import { savingRateChanges } from '../utils/savingRateData'
import { calculateProductivityMomentum } from '../utils/productivityData'
import { ProductivityMomentumTable } from './ProductivityMomentumTable'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

interface EconomicSeriesSummaryProps {
  series: EconomicSeries
  supportingSeries?: EconomicSeries | null
}

export function EconomicSeriesSummary({
  series,
  supportingSeries,
}: EconomicSeriesSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const presentation = getEconomicSeriesPresentation(series.slug)
  const latestObservation = findLatestNonNullObservation(series.observations)
  const chronologicalObservations = sortObservationsChronologically(
    series.observations,
  )
  const coverageStart = chronologicalObservations[0]
  const coverageEnd = chronologicalObservations.at(-1)
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
  const formatValue = (value: number | null) =>
    formatEconomicValue(value, presentation.valueFormat)
  const savingRateChange =
    series.slug === 'personal-saving-rate'
      ? savingRateChanges(series.observations).find(
          (item) => item.date === latestObservation?.date,
        )?.change ?? null
      : null
  const productivityMomentum =
    series.slug === 'labor-productivity-growth'
      ? calculateProductivityMomentum(series.observations).find(
          (item) => item.date === latestObservation?.date,
        )?.momentumChange ?? null
      : null

  return (
    <article
      id={`${series.slug}-card`}
      className="series-card"
      aria-labelledby={`${series.slug}-question`}
    >
      <header className="series-card__header">
        <p className="series-card__eyebrow">{presentation.topicLabel}</p>
        <h3 id={`${series.slug}-question`}>{series.question}</h3>
        <p className="series-card__title">{series.title}</p>
      </header>

      <div className="series-current" aria-label={presentation.latestValueLabel}>
        <p className="series-current__value">
          <span
            aria-label={
              presentation.valueFormat === 'signed-thousands'
                ? formatJobChangeProse(latestObservation?.value ?? null)
                : undefined
            }
          >
            {formatValue(latestObservation?.value ?? null)}
          </span>
        </p>
        <p className="series-current__label">
          {series.slug === 'labor-productivity-growth'
            ? latestObservation?.value === null || latestObservation?.value === undefined
              ? 'Productivity change from a year ago is unavailable'
              : latestObservation.value < 0
                ? 'Productivity is lower than a year ago'
                : latestObservation.value === 0
                  ? 'Productivity is unchanged from a year ago'
                  : 'Productivity is higher than a year ago'
            : presentation.latestValueLabel}
        </p>
        <p className="series-current__period">
          {latestObservation
            ? formatObservationPeriod(
                latestObservation.date,
                series.frequency,
              )
            : 'Observation period unavailable'}
          {' · '}
          {series.units}
        </p>
        {series.slug === 'labor-productivity-growth' &&
          productivityMomentum !== null && (
            <p className="series-current__comparison">
              The pace of productivity growth has{' '}
              {productivityMomentum > 0
                ? 'accelerated'
                : productivityMomentum < 0
                  ? 'slowed'
                  : 'remained unchanged'}{' '}
              {productivityMomentum === 0
                ? 'from a year earlier.'
                : `by ${formatPercentage(Math.abs(productivityMomentum))} percentage points from a year earlier.`}
            </p>
          )}
      </div>

      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        contextLabel={series.shortTitle}
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
              kind="single"
              observations={visibleObservations}
              seriesName={series.shortTitle}
              frequency={series.frequency}
              units={series.units}
              transformation={series.transformation}
              includeZero={presentation.includeZeroInChart}
              valueFormat={presentation.valueFormat}
            />
          </Suspense>
          {presentation.summaryFormat === 'job-change' ? (
            <p className="chart-summary" aria-live="polite">
              For the selected period, the three-month average monthly payroll
              change ranged from{' '}
              {formatJobChangeProse(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(
                    chartSummary.minimum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}{' '}
              to {formatJobChangeProse(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(
                    chartSummary.maximum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}. The latest value is{' '}
              {formatJobChangeProse(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(
                    chartSummary.latest.date,
                    series.frequency,
                  )
                : 'an unavailable period'}.
            </p>
          ) : (
            <p className="chart-summary" aria-live="polite">
              For the selected period, {series.shortTitle} ranged from{' '}
              {formatValue(chartSummary.minimum?.value ?? null)} in{' '}
              {chartSummary.minimum
                ? formatObservationPeriod(
                    chartSummary.minimum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}{' '}
              to {formatValue(chartSummary.maximum?.value ?? null)} in{' '}
              {chartSummary.maximum
                ? formatObservationPeriod(
                    chartSummary.maximum.date,
                    series.frequency,
                  )
                : 'an unavailable period'}. The latest value is{' '}
              {formatValue(chartSummary.latest?.value ?? null)} in{' '}
              {chartSummary.latest
                ? formatObservationPeriod(
                    chartSummary.latest.date,
                    series.frequency,
                  )
                : 'an unavailable period'}.{' '}
              {presentation.reportBelowZero &&
                (chartSummary.hasBelowZero
                  ? 'At least one observation was below zero.'
                  : 'No observations were below zero.')}
              {series.slug === 'personal-saving-rate' && (
                <> The change from 12 months earlier was {formatSignedPercentage(savingRateChange)} percentage points.</>
              )}
              {series.slug === 'labor-productivity-growth' &&
                productivityMomentum !== null && (
                  <> The growth rate {productivityMomentum > 0 ? 'accelerated' : productivityMomentum < 0 ? 'slowed' : 'was unchanged'} by {formatPercentage(Math.abs(productivityMomentum))} percentage points compared with four quarters earlier.</>
                )}
            </p>
          )}
        </>
      ) : (
        <p className="chart-state" role="status">
          No {series.shortTitle} observations are available for the selected
          period.
        </p>
      )}

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>{presentation.whatThisTellsYou}</p>
        </section>
        <section>
          <h4>What this leaves out</h4>
          <p>{presentation.whatThisLeavesOut}</p>
        </section>
      </div>

      <section
        className="related-indicators"
        aria-labelledby={`${series.slug}-related-heading`}
      >
        <h4 id={`${series.slug}-related-heading`}>Consider alongside</h4>
        <ul>
          {presentation.relatedIndicators.map((indicator) => (
            <li key={indicator}>{indicator}</li>
          ))}
        </ul>
      </section>

      <footer className="series-supporting">
        <p className="series-source">
          Source:{' '}
          <a href={series.sourceUrl} rel="noreferrer" target="_blank">
            {series.sourceName}
          </a>
        </p>

        <details className="supporting-disclosure">
          <summary>Series details</summary>
          <dl className="series-metadata">
            <div>
              <dt>Provider series identifier</dt>
              <dd>{series.providerSeriesId}</dd>
            </div>
            <div>
              <dt>Frequency</dt>
              <dd>
                {series.frequency.charAt(0).toUpperCase() +
                  series.frequency.slice(1)}
              </dd>
            </div>
            <div>
              <dt>Units</dt>
              <dd>{series.units}</dd>
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
              <dt>Observation coverage</dt>
              <dd>
                {coverageStart && coverageEnd
                  ? `${formatObservationPeriod(coverageStart.date, series.frequency)} to ${formatObservationPeriod(coverageEnd.date, series.frequency)}`
                  : 'Not available'}
              </dd>
            </div>
          </dl>
        </details>

        <details className="supporting-disclosure">
          <summary>Recent observations</summary>
          {series.slug === 'labor-productivity-growth' ? (
            <ProductivityMomentumTable observations={series.observations} />
          ) : series.slug === 'personal-saving-rate' ? (
            <SavingRateTable observations={series.observations} />
          ) : presentation.recentTable === 'payroll-changes' && supportingSeries ? (
            <PayrollObservationsTable
              averages={series.observations}
              monthlyChanges={supportingSeries.observations}
              caption={presentation.recentObservationsCaption}
              count={presentation.recentObservationCount}
            />
          ) : (
            <RecentObservationsTable
              observations={recentObservations}
              frequency={series.frequency}
              caption={presentation.recentObservationsCaption}
              valueColumnLabel={presentation.valueColumnLabel}
              valueFormat={presentation.valueFormat}
            />
          )}
        </details>
      </footer>
    </article>
  )
}
