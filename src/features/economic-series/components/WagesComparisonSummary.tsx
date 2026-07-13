import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  alignWageComparisonObservations,
  calculateWageComparisonSummary,
  filterWageComparisonByTimeRange,
} from '../utils/comparisonData'
import type { TimeRange } from '../utils/chartData'
import { TimeRangeControl } from './TimeRangeControl'
import { WageComparisonTable } from './WageComparisonTable'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

interface WagesComparisonSummaryProps {
  realWageGrowth: EconomicSeries
  nominalWageGrowth: EconomicSeries
  cpiInflation: EconomicSeries
}

export function WagesComparisonSummary({
  realWageGrowth,
  nominalWageGrowth,
  cpiInflation,
}: WagesComparisonSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const aligned = useMemo(
    () =>
      alignWageComparisonObservations(
        realWageGrowth,
        nominalWageGrowth,
        cpiInflation,
      ),
    [cpiInflation, nominalWageGrowth, realWageGrowth],
  )
  const visible = useMemo(
    () => filterWageComparisonByTimeRange(aligned, selectedRange),
    [aligned, selectedRange],
  )
  const summary = useMemo(
    () => calculateWageComparisonSummary(visible),
    [visible],
  )
  const latest = [...visible]
    .reverse()
    .find((item) => item.realWageGrowth !== null)
  const coverageStart = aligned[0]
  const coverageEnd = aligned.at(-1)
  const direction =
    latest?.realWageGrowth === null || latest?.realWageGrowth === undefined
      ? 'unavailable'
      : latest.realWageGrowth > 0
        ? 'positive'
        : latest.realWageGrowth < 0
          ? 'negative'
          : 'zero'

  return (
    <article className="series-card" aria-labelledby="wages-versus-inflation-question">
      <header className="series-card__header">
        <p className="series-card__eyebrow">Labor market relationship</p>
        <h3 id="wages-versus-inflation-question">
          Are workers’ wages keeping up with prices?
        </h3>
        <p className="series-card__title">Wages Versus Inflation</p>
      </header>

      <div className="series-current" aria-label="Latest real wage growth">
        <p className="series-current__value">
          <span
            aria-label={`${direction} real wage growth, ${formatPercentage(
              latest?.realWageGrowth ?? null,
            )}`}
          >
            {formatSignedPercentage(latest?.realWageGrowth ?? null)}
          </span>
        </p>
        <p className="series-current__label">Latest real wage growth</p>
        <p className="series-current__period">
          {latest
            ? formatObservationPeriod(latest.date, 'monthly')
            : 'Observation period unavailable'}{' '}
          · Percent change from year ago
        </p>
      </div>

      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        contextLabel="Wages versus inflation"
      />

      {summary.observationCount > 0 ? (
        <>
          <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
            <EconomicTimeSeriesChart
              kind="comparison"
              nominalObservations={visible.map((item) => ({
                date: item.date,
                value: item.nominalWageGrowth,
              }))}
              inflationObservations={visible.map((item) => ({
                date: item.date,
                value: item.cpiInflation,
              }))}
              realObservations={visible.map((item) => ({
                date: item.date,
                value: item.realWageGrowth,
              }))}
              frequency="monthly"
            />
          </Suspense>
          <p className="chart-summary" aria-live="polite">
            In {latest ? formatObservationPeriod(latest.date, 'monthly') : 'an unavailable month'}, nominal wages grew{' '}
            {formatPercentage(latest?.nominalWageGrowth ?? null)} from a year
            earlier while consumer prices rose{' '}
            {formatPercentage(latest?.cpiInflation ?? null)}, producing{' '}
            {direction} real wage growth of{' '}
            {formatSignedPercentage(latest?.realWageGrowth ?? null)}. Over the
            selected period, real wage growth ranged from{' '}
            {formatSignedPercentage(summary.minimum?.value ?? null)} in{' '}
            {summary.minimum
              ? formatObservationPeriod(summary.minimum.date, 'monthly')
              : 'an unavailable month'}{' '}
            to {formatSignedPercentage(summary.maximum?.value ?? null)} in{' '}
            {summary.maximum
              ? formatObservationPeriod(summary.maximum.date, 'monthly')
              : 'an unavailable month'}.
          </p>
        </>
      ) : (
        <p className="chart-state">No aligned wage and inflation observations are available.</p>
      )}

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>
            This comparison shows whether average hourly earnings for
            private-sector production and nonsupervisory employees are rising
            faster or slower than consumer prices. Real wage growth is positive
            when inflation-adjusted hourly earnings increase from a year earlier.
          </p>
        </section>
        <section>
          <h4>What this leaves out</h4>
          <p>
            Average hourly earnings are not a median and can change when the mix
            of jobs changes. The measure excludes supervisory employees,
            government workers, benefits, and self-employed workers. Headline CPI
            is a national average and may not match an individual household’s
            expenses.
          </p>
        </section>
      </div>

      <section className="related-indicators" aria-labelledby="wages-related-heading">
        <h4 id="wages-related-heading">Consider alongside</h4>
        <ul>
          <li>Payroll growth</li>
          <li>Productivity</li>
          <li>Labor share</li>
        </ul>
      </section>

      <footer className="series-supporting">
        <p className="series-source">
          Sources:{' '}
          <a href="https://fred.stlouisfed.org/series/AHETPI" rel="noreferrer" target="_blank">BLS wage data via FRED</a>
          {'; '}
          <a href="https://fred.stlouisfed.org/series/CPIAUCSL" rel="noreferrer" target="_blank">BLS CPI data via FRED</a>
        </p>
        <details className="supporting-disclosure">
          <summary>Series details</summary>
          <dl className="series-metadata">
            <div><dt>Wage series</dt><dd>AHETPI</dd></div>
            <div><dt>Inflation deflator</dt><dd>CPIAUCSL</dd></div>
            <div><dt>Frequency</dt><dd>Monthly</dd></div>
            <div><dt>Transformation</dt><dd>{realWageGrowth.transformation}</dd></div>
            <div><dt>Retrieved</dt><dd>{formatDate(realWageGrowth.retrievedAt)}</dd></div>
            <div>
              <dt>Observation coverage</dt>
              <dd>
                {coverageStart && coverageEnd
                  ? `${formatObservationPeriod(coverageStart.date, 'monthly')} to ${formatObservationPeriod(coverageEnd.date, 'monthly')}`
                  : 'Not available'}
              </dd>
            </div>
          </dl>
        </details>
        <details className="supporting-disclosure">
          <summary>Recent observations</summary>
          <WageComparisonTable observations={aligned} />
        </details>
      </footer>
    </article>
  )
}
