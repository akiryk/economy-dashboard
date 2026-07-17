import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import {
  calculateChartSummary,
  filterObservationsByTimeRange,
  type TimeRange,
} from '../utils/chartData'
import {
  alignClaimsObservations,
  claimsSeries,
  formatClaims,
  medianClaims,
} from '../utils/claimsData'
import { formatDate, formatObservationPeriod } from '../utils/economicSeries'
import { ClaimsComparisonTable } from './ClaimsComparisonTable'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

function weekEnding(date: string): string {
  return formatObservationPeriod(date, 'weekly').replace('Week of ', '')
}

function describeDirection(start: number | null, end: number | null): string {
  if (start === null || end === null) return 'could not be compared'
  if (end > start) return 'rose'
  if (end < start) return 'fell'
  return 'was unchanged'
}

export function ClaimsComparisonSummary({
  movingAverage,
  weeklyClaims,
}: {
  movingAverage: EconomicSeries
  weeklyClaims: EconomicSeries
}) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const aligned = useMemo(
    () =>
      alignClaimsObservations(
        movingAverage.observations,
        weeklyClaims.observations,
      ),
    [movingAverage.observations, weeklyClaims.observations],
  )
  const selected = useMemo(() => {
    const selectedDates = new Set(
      filterObservationsByTimeRange(
        claimsSeries(aligned, 'movingAverage'),
        selectedRange,
      ).map((observation) => observation.date),
    )
    return aligned.filter((observation) => selectedDates.has(observation.date))
  }, [aligned, selectedRange])
  const zoom = useHistoricalZoom(
    selected,
    selectedRange,
    'weekly',
    setSelectedRange,
  )
  const visible = zoom.visibleItems
  const latest = [...aligned]
    .reverse()
    .find((observation) => observation.movingAverage !== null)
  const visibleAverage = claimsSeries(visible, 'movingAverage')
  const summary = calculateChartSummary(visibleAverage)
  const median = medianClaims(
    visible.map((observation) => observation.movingAverage),
  )
  const first = visible.find((observation) => observation.movingAverage !== null)
  const visibleLatest = [...visible]
    .reverse()
    .find((observation) => observation.movingAverage !== null)
  const weeklyDifference =
    latest?.weeklyClaims !== null &&
    latest?.weeklyClaims !== undefined &&
    latest.movingAverage !== null
      ? latest.weeklyClaims - latest.movingAverage
      : null
  const coverageStart = aligned[0]
  const coverageEnd = aligned.at(-1)

  return (
    <article
      id="initial-unemployment-claims-card"
      className="series-card"
      aria-labelledby="initial-unemployment-claims-question"
    >
      <header className="series-card__header">
        <p className="series-card__eyebrow">Layoff activity</p>
        <h3 id="initial-unemployment-claims-question">
          Are layoffs beginning to rise?
        </h3>
        <p className="series-card__title">
          Initial unemployment claims and official four-week average
        </p>
      </header>

      <div className="series-current" aria-label="Latest four-week average of initial claims">
        <p className="series-current__value">
          {formatClaims(latest?.movingAverage ?? null)} claims
        </p>
        <p className="series-current__label">
          Four-week average, week ending{' '}
          {latest ? weekEnding(latest.date) : 'unavailable'}
        </p>
        <p className="series-current__period">
          Latest weekly claims: {formatClaims(latest?.weeklyClaims ?? null)}
        </p>
      </div>

      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={zoom.selectPreset}
        contextLabel="Initial unemployment claims"
      />
      <HistoricalZoomControls
        active={zoom.active}
        visiblePeriod={zoom.visiblePeriod}
        onMove={zoom.move}
        onResize={zoom.resize}
        onReset={zoom.reset}
      />

      <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
        <EconomicTimeSeriesChart
          kind="claims-comparison"
          movingAverageObservations={claimsSeries(selected, 'movingAverage')}
          weeklyClaimsObservations={claimsSeries(selected, 'weeklyClaims')}
          frequency="weekly"
          zoomStartDate={visible[0]?.date ?? ''}
          zoomEndDate={visible.at(-1)?.date ?? ''}
          onZoomChange={zoom.onChartZoom}
        />
      </Suspense>

      <p className="chart-summary" aria-live="polite">
        From {first ? weekEnding(first.date) : 'an unavailable week'} to{' '}
        {visibleLatest ? weekEnding(visibleLatest.date) : 'an unavailable week'},
        the four-week average {describeDirection(
          first?.movingAverage ?? null,
          visibleLatest?.movingAverage ?? null,
        )} from{' '}
        {formatClaims(first?.movingAverage ?? null)} to{' '}
        {formatClaims(visibleLatest?.movingAverage ?? null)} claims. Its visible
        low was {formatClaims(summary.minimum?.value ?? null)} and its visible
        high was {formatClaims(summary.maximum?.value ?? null)}. The latest
        average is {median !== null && latest?.movingAverage !== null && latest?.movingAverage !== undefined && latest.movingAverage >= median ? 'at or above' : 'below'} the visible-range median. Latest weekly claims were{' '}
        {weeklyDifference === null
          ? 'unavailable relative to the average'
          : `${formatClaims(Math.abs(weeklyDifference))} ${weeklyDifference >= 0 ? 'above' : 'below'} the four-week average`}.
      </p>

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>
            Initial claims count new applications for unemployment-insurance
            eligibility following separation from an employer. The official
            four-week average reduces weekly noise and is emphasized here.
            Rising claims can indicate increasing labor-market stress, while
            falling claims can indicate fewer new insurance filings.
          </p>
        </section>
        <section>
          <h4>What this leaves out</h4>
          <p>
            Claims do not include every laid-off worker and do not prove a
            recession or permanent job loss. Eligibility, filing behavior,
            revisions, administrative disruptions, weather, strikes,
            disasters, unusual events, and seasonal-adjustment difficulties
            can affect the weekly figures.
          </p>
        </section>
      </div>

      <section className="related-indicators" aria-labelledby="claims-related-heading">
        <h4 id="claims-related-heading">Consider alongside</h4>
        <ul>
          <li>Unemployment</li>
          <li>Payroll growth</li>
          <li>Prime-age employment</li>
        </ul>
      </section>

      <footer className="series-supporting">
        <p className="series-source">
          Sources:{' '}
          <a href={movingAverage.sourceUrl} target="_blank" rel="noreferrer">
            Official four-week average via FRED
          </a>
          ;{' '}
          <a href={weeklyClaims.sourceUrl} target="_blank" rel="noreferrer">
            Weekly initial claims via FRED
          </a>
        </p>
        <details className="supporting-disclosure">
          <summary>Series details</summary>
          <dl className="series-metadata">
            <div><dt>Series identifiers</dt><dd>IC4WSA and ICSA</dd></div>
            <div><dt>Frequency and units</dt><dd>Weekly, week ending Saturday · Number of claims</dd></div>
            <div><dt>Seasonal adjustment</dt><dd>Seasonally adjusted</dd></div>
            <div><dt>Transformation</dt><dd>Provider-published levels aligned by exact weekly date; no local moving-average calculation</dd></div>
            <div><dt>Retrieved</dt><dd>{formatDate(movingAverage.retrievedAt)}</dd></div>
            <div><dt>Shared coverage</dt><dd>{coverageStart && coverageEnd ? `${weekEnding(coverageStart.date)} to ${weekEnding(coverageEnd.date)}` : 'Not available'}</dd></div>
          </dl>
        </details>
        <details className="supporting-disclosure">
          <summary>Recent observations</summary>
          <ClaimsComparisonTable observations={visible} />
        </details>
      </footer>
    </article>
  )
}
