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
import {
  classifyJoltsLevel,
  deriveJoltsDirection,
  deriveJoltsHistoricalContext,
  joltsDirectionStatement,
  joltsLevelStatement,
} from '../utils/joltsLayoffsContext'
import {
  formatDate,
  formatObservationPeriod,
  formatPercentage,
} from '../utils/economicSeries'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { ClaimsComparisonTable } from './ClaimsComparisonTable'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)
const JoltsLayoffsChart = lazy(
  () => import('../charts/JoltsLayoffsChart'),
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

function RecentJoltsTable({
  series,
}: {
  series: EconomicSeries
}) {
  return (
    <table className="series-table">
      <thead>
        <tr><th scope="col">Month</th><th scope="col">Layoff rate</th></tr>
      </thead>
      <tbody>
        {series.observations.slice(-12).reverse().map((observation) => (
          <tr key={observation.date}>
            <th scope="row">
              {formatObservationPeriod(observation.date, 'monthly')}
            </th>
            <td>{formatPercentage(observation.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function JoltsResearchSection({ series }: { series: EconomicSeries }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const selected = useMemo(
    () => filterObservationsByTimeRange(series.observations, selectedRange),
    [selectedRange, series.observations],
  )
  const zoom = useHistoricalZoom(
    selected,
    selectedRange,
    'monthly',
    setSelectedRange,
  )
  const visible = zoom.visibleItems
  const summary = calculateChartSummary(visible)
  const first = visible.find(({ value }) => value !== null)
  const latest = [...visible].reverse().find(({ value }) => value !== null)

  return (
    <section aria-labelledby="jolts-research-heading">
      <h4 id="jolts-research-heading">
        Layoffs and discharges rate — monthly JOLTS measure
      </h4>
      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={zoom.selectPreset}
        contextLabel="JOLTS layoffs and discharges rate"
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
          key={selectedRange}
          kind="single"
          observations={selected}
          seriesName="Layoffs and discharges rate"
          frequency="monthly"
          units="Percent"
          transformation="Provider-published monthly rate"
          includeZero={false}
          valueFormat="percentage"
          zoomStartDate={visible[0]?.date ?? ''}
          zoomEndDate={visible.at(-1)?.date ?? ''}
          onZoomChange={zoom.onChartZoom}
        />
      </Suspense>
      <p className="chart-summary" aria-live="polite">
        From {first ? formatObservationPeriod(first.date, 'monthly') : 'an unavailable month'} to{' '}
        {latest ? formatObservationPeriod(latest.date, 'monthly') : 'an unavailable month'},
        the rate {describeDirection(first?.value ?? null, latest?.value ?? null)} from{' '}
        {formatPercentage(first?.value ?? null)} to{' '}
        {formatPercentage(latest?.value ?? null)}. Its visible low was{' '}
        {formatPercentage(summary.minimum?.value ?? null)} and its visible high
        was {formatPercentage(summary.maximum?.value ?? null)}.
      </p>
      <details className="supporting-disclosure">
        <summary>Recent JOLTS observations</summary>
        <RecentJoltsTable series={series} />
      </details>
    </section>
  )
}

function ClaimsResearchSection({
  movingAverage,
  weeklyClaims,
}: {
  movingAverage: EconomicSeries
  weeklyClaims: EconomicSeries
}) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const aligned = useMemo(
    () => alignClaimsObservations(
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
      ).map(({ date }) => date),
    )
    return aligned.filter(({ date }) => selectedDates.has(date))
  }, [aligned, selectedRange])
  const zoom = useHistoricalZoom(
    selected,
    selectedRange,
    'weekly',
    setSelectedRange,
  )
  const visible = zoom.visibleItems
  const latest = [...aligned].reverse().find(({ movingAverage: value }) => value !== null)
  const visibleAverage = claimsSeries(visible, 'movingAverage')
  const summary = calculateChartSummary(visibleAverage)
  const median = medianClaims(visible.map(({ movingAverage: value }) => value))
  const first = visible.find(({ movingAverage: value }) => value !== null)
  const visibleLatest = [...visible].reverse().find(({ movingAverage: value }) => value !== null)
  const weeklyDifference =
    latest?.weeklyClaims !== null &&
    latest?.weeklyClaims !== undefined &&
    latest.movingAverage !== null
      ? latest.weeklyClaims - latest.movingAverage
      : null

  return (
    <section aria-labelledby="claims-research-heading">
      <h4 id="claims-research-heading">
        Initial unemployment claims — weekly early-warning measure
      </h4>
      <p>
        Latest official four-week average: <strong>
          {formatClaims(latest?.movingAverage ?? null)} claims
        </strong>{' '}
        for the week ending {latest ? weekEnding(latest.date) : 'unavailable'}.
        Latest weekly claims: {formatClaims(latest?.weeklyClaims ?? null)}.
      </p>
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
        )} from {formatClaims(first?.movingAverage ?? null)} to{' '}
        {formatClaims(visibleLatest?.movingAverage ?? null)} claims. Its visible
        low was {formatClaims(summary.minimum?.value ?? null)} and its visible
        high was {formatClaims(summary.maximum?.value ?? null)}. The latest
        average is {median !== null && latest?.movingAverage !== null &&
        latest?.movingAverage !== undefined && latest.movingAverage >= median
          ? 'at or above'
          : 'below'} the visible-range median. Latest weekly claims were{' '}
        {weeklyDifference === null
          ? 'unavailable relative to the average'
          : `${formatClaims(Math.abs(weeklyDifference))} ${
            weeklyDifference >= 0 ? 'above' : 'below'
          } the four-week average`}.
      </p>
      <details className="supporting-disclosure">
        <summary>Recent claims observations</summary>
        <ClaimsComparisonTable observations={visible} />
      </details>
    </section>
  )
}

export function ClaimsComparisonSummary({
  joltsLayoffRate,
  movingAverage,
  weeklyClaims,
}: {
  joltsLayoffRate: EconomicSeries
  movingAverage: EconomicSeries
  weeklyClaims: EconomicSeries
}) {
  const historical = useMemo(
    () => deriveJoltsHistoricalContext(joltsLayoffRate.observations),
    [joltsLayoffRate.observations],
  )
  const direction = useMemo(
    () => deriveJoltsDirection(joltsLayoffRate.observations),
    [joltsLayoffRate.observations],
  )
  const level = classifyJoltsLevel(historical)
  const latest = historical.status === 'ready'
    ? historical.latestObservation
    : [...joltsLayoffRate.observations].reverse().find(({ value }) => value !== null)
  const accessibleSummary = `${joltsDirectionStatement(direction.state)} ${joltsLevelStatement(level)} ${
    latest
      ? `The latest JOLTS layoff rate was ${formatPercentage(latest.value)} in ${formatObservationPeriod(latest.date, 'monthly')}.`
      : 'The latest JOLTS layoff rate is unavailable.'
  } Direction compares the latest three-month average with the preceding three-month average.`

  return (
    <CompactMetricCardLayout
      cardId="initial-unemployment-claims"
      eyebrow="Layoff activity"
      question="Are layoffs beginning to rise?"
      measureLabel="Monthly layoffs and discharges as a share of employment"
      latestValue={(
        <div className="series-current">
          <p className="series-current__value">
            {formatPercentage(latest?.value ?? null)}
          </p>
          <p className="series-current__period">
            {latest
              ? formatObservationPeriod(latest.date, 'monthly')
              : 'Latest month unavailable'}
          </p>
          <p className="series-current__answer">
            {joltsDirectionStatement(direction.state)}
          </p>
          <p className="series-current__comparison">
            {joltsLevelStatement(level)}
          </p>
          <p className="visually-hidden">{accessibleSummary}</p>
        </div>
      )}
      compactVisual={(
        <Suspense fallback={<p className="chart-state chart-state--compact">Loading compact historical chart…</p>}>
          <JoltsLayoffsChart model={historical} />
        </Suspense>
      )}
      expandedContent={(
        <>
          <JoltsResearchSection series={joltsLayoffRate} />
          <ClaimsResearchSection
            movingAverage={movingAverage}
            weeklyClaims={weeklyClaims}
          />
          <div className="series-explanations">
            <section>
              <h4>How to read these measures</h4>
              <p>
                JOLTS layoffs and discharges are employer-initiated
                separations. The monthly rate compares those separations with
                employment. The direction statement requires six consecutive
                observations and compares the latest three-month average with
                the preceding three-month average; a difference of at least
                0.10 percentage point is rising or falling.
              </p>
              <p>
                Historical bands show where valid monthly rates commonly fell
                during the trailing 25 years. Lower is better for this
                classification. The bands describe frequency, not a target or
                forecast.
              </p>
            </section>
            <section>
              <h4>Limitations</h4>
              <p>
                JOLTS is monthly and reported with a lag. Initial claims are
                timelier weekly evidence, but do not capture every layoff.
                Eligibility, filing behavior, revisions, administrative
                disruptions, seasonal adjustment, and differences in
                definitions and coverage can affect comparisons. The two
                sources are shown separately rather than overlaid.
              </p>
            </section>
          </div>
          <footer className="series-supporting">
            <p className="series-source">
              Sources:{' '}
              <a href={joltsLayoffRate.sourceUrl} target="_blank" rel="noreferrer">
                BLS JOLTS layoffs and discharges rate via FRED
              </a>
              ;{' '}
              <a href={movingAverage.sourceUrl} target="_blank" rel="noreferrer">
                official four-week claims average via FRED
              </a>
              ;{' '}
              <a href={weeklyClaims.sourceUrl} target="_blank" rel="noreferrer">
                weekly initial claims via FRED
              </a>
            </p>
            <details className="supporting-disclosure">
              <summary>Series details</summary>
              <dl className="series-metadata">
                <div><dt>Series identifiers</dt><dd>JTSLDR, IC4WSA, and ICSA</dd></div>
                <div><dt>JOLTS frequency and units</dt><dd>Monthly · Percent of employment</dd></div>
                <div><dt>Claims frequency and units</dt><dd>Weekly, week ending Saturday · Number of claims</dd></div>
                <div><dt>Seasonal adjustment</dt><dd>Seasonally adjusted</dd></div>
                <div><dt>JOLTS transformation</dt><dd>Provider-published rate; no further normalization or interpolation</dd></div>
                <div><dt>Retrieved</dt><dd>{formatDate(joltsLayoffRate.retrievedAt)}</dd></div>
              </dl>
            </details>
          </footer>
        </>
      )}
    />
  )
}
