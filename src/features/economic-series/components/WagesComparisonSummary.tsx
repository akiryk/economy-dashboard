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
  filterWageComparisonByTimeRange,
} from '../utils/comparisonData'
import {
  calculateVisibleRealWageGrowthSummary,
  createRealWageGrowthAccessibleSummary,
  createRealWageGrowthRangeModel,
  createVisibleRealWageGrowthAccessibleSummary,
  deriveRealWageGrowthModel,
  formatRealWageGrowthHistoricalPosition,
  formatVisibleRealWageGrowthSummary,
} from '../utils/realWageGrowth'
import type { TimeRange } from '../utils/chartData'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { TimeRangeControl } from './TimeRangeControl'
import { WageComparisonTable } from './WageComparisonTable'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { useHistoricalZoom } from './useHistoricalZoom'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)
const RealWageGrowthChart = lazy(
  () => import('../charts/RealWageGrowthChart').then(
    ({ RealWageGrowthChart: Chart }) => ({ default: Chart }),
  ),
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
  const compactModel = useMemo(
    () => deriveRealWageGrowthModel({
      realWageGrowth,
      nominalWageGrowth,
      cpiInflation,
    }),
    [cpiInflation, nominalWageGrowth, realWageGrowth],
  )
  const accessibleSummary = createRealWageGrowthAccessibleSummary(compactModel)
  const aligned = useMemo(
    () =>
      alignWageComparisonObservations(
        realWageGrowth,
        nominalWageGrowth,
        cpiInflation,
      ),
    [cpiInflation, nominalWageGrowth, realWageGrowth],
  )
  const selected = useMemo(
    () => filterWageComparisonByTimeRange(aligned, selectedRange),
    [aligned, selectedRange],
  )
  const zoom = useHistoricalZoom(selected, selectedRange, 'monthly', setSelectedRange)
  const visible = zoom.visibleItems
  const compactRealByDate = useMemo(
    () => new Map(
      compactModel.observations.map(({ date, value }) => [date, value]),
    ),
    [compactModel.observations],
  )
  const visibleRealObservations = useMemo(
    () => visible.map(({ date }) => ({
      date,
      value: compactRealByDate.get(date) ?? null,
    })),
    [compactRealByDate, visible],
  )
  const expandedRealWageModel = useMemo(
    () => createRealWageGrowthRangeModel(visibleRealObservations),
    [visibleRealObservations],
  )
  const visibleSummary = useMemo(
    () => calculateVisibleRealWageGrowthSummary(visibleRealObservations),
    [visibleRealObservations],
  )
  const expandedAccessibleSummary =
    createVisibleRealWageGrowthAccessibleSummary(visibleSummary)
  const latestComponents = [...visible]
    .reverse()
    .find((item) =>
      item.realWageGrowth !== null &&
      item.nominalWageGrowth !== null &&
      item.cpiInflation !== null)
  const coverageStart = aligned[0]
  const coverageEnd = aligned.at(-1)
  const latestRealDisplay = formatSignedPercentage(
    latestComponents?.realWageGrowth ?? null,
  )
  const historicalPosition = formatRealWageGrowthHistoricalPosition(
    compactModel.historicalBands,
  )

  const expandedContent = (
    <>
      <p>
        Nominal wages are pay before adjusting for inflation. Real wage growth
        adjusts that wage growth for consumer-price growth. The compact answer
        is determined by the derived real-wage series. Positive values mean
        wages rose faster than consumer prices. Negative values mean prices
        rose faster than wages.
      </p>
      <section>
        <h4>Real wage growth</h4>
        <p>
          Positive values mean average wages gained purchasing power relative
          to CPI. Negative values mean they lost purchasing power.
        </p>
      </section>
      <TimeRangeControl
        selectedRange={selectedRange}
        onRangeChange={zoom.selectPreset}
        contextLabel="Wages versus inflation"
      />
      <HistoricalZoomControls
        active={zoom.active}
        visiblePeriod={zoom.visiblePeriod}
        onMove={zoom.move}
        onResize={zoom.resize}
        onReset={zoom.reset}
      />

      {visibleSummary.validObservationCount > 0 ? (
        <>
          <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
            <RealWageGrowthChart
              model={expandedRealWageModel}
              accessibleSummary={expandedAccessibleSummary}
              variant="expanded"
            />
          </Suspense>
          <p className="chart-summary" aria-live="polite">
            {formatVisibleRealWageGrowthSummary(visibleSummary)}
          </p>
        </>
      ) : (
        <p className="chart-state">No aligned wage and inflation observations are available.</p>
      )}

      <details className="supporting-disclosure wages-comparison__components">
        <summary>How wage growth and inflation compare</summary>
        <p>
          The two components use one shared percent axis. The real-wage series
          used for the compact answer and primary chart applies their exact
          multiplicative relationship; simple subtraction is only an approximation.
        </p>
        <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
          <EconomicTimeSeriesChart
            key={selectedRange}
            kind="comparison"
            nominalObservations={selected.map((item) => ({
              date: item.date,
              value: item.nominalWageGrowth,
            }))}
            inflationObservations={selected.map((item) => ({
              date: item.date,
              value: item.cpiInflation,
            }))}
            realObservations={selected.map((item) => ({
              date: item.date,
              value: item.realWageGrowth,
            }))}
            frequency="monthly"
            zoomStartDate={visible[0]?.date ?? ''}
            zoomEndDate={visible.at(-1)?.date ?? ''}
            onZoomChange={zoom.onChartZoom}
          />
        </Suspense>
        {latestComponents && (
          <p className="chart-summary">
            In {formatObservationPeriod(latestComponents.date, 'monthly')},
            nominal wages grew{' '}
            {formatPercentage(latestComponents.nominalWageGrowth)} while
            consumer prices rose{' '}
            {formatPercentage(latestComponents.cpiInflation)}
            {latestRealDisplay === '0%'
              ? ', so wages and prices rose at approximately the same rate, producing real wage growth of about 0%.'
              : `, producing real wage growth of ${latestRealDisplay}.`}
          </p>
        )}
      </details>

      <div className="series-explanations">
        <section>
          <h4>What this tells you</h4>
          <p>
            This chart shows whether average hourly earnings for all private-sector
            employees rose faster or slower than
            consumer prices. Positive real wage growth means average wages
            gained purchasing power relative to CPI; negative real wage growth
            means they lost purchasing power.
          </p>
        </section>
        <section>
          <h4>What this leaves out</h4>
          <p>
            Average hourly earnings are not a median and can change when the mix
            of jobs changes. The measure excludes government workers, benefits,
            irregular bonuses, and self-employed workers. Headline CPI
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
          <a href="https://fred.stlouisfed.org/series/CES0500000003" rel="noreferrer" target="_blank">BLS wage data via FRED</a>
          {'; '}
          <a href="https://fred.stlouisfed.org/series/CPIAUCSL" rel="noreferrer" target="_blank">Seasonally adjusted BLS CPI data via FRED</a>
        </p>
        <details className="supporting-disclosure">
          <summary>Series details</summary>
          <dl className="series-metadata">
            <div><dt>Wage series</dt><dd>CES0500000003 · All private employees</dd></div>
            <div><dt>Inflation deflator</dt><dd>CPIAUCSL · Seasonally adjusted</dd></div>
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
          <WageComparisonTable observations={visible} />
        </details>
      </footer>
    </>
  )

  return (
    <CompactMetricCardLayout
      cardId="wages-versus-inflation"
      eyebrow="Prices and purchasing power"
      question="Are workers’ wages keeping up with prices?"
      measureLabel="Real wage growth"
      latestValue={(
        <div className="series-current" aria-label="Latest real wage growth">
          <p className="series-current__value">
            {formatSignedPercentage(compactModel.latestObservation?.value ?? null)}
          </p>
          <p className="series-current__label">
            Year-over-year wage growth after adjusting for inflation
          </p>
          <p className="series-current__period">
            {compactModel.latestObservation
              ? formatObservationPeriod(
                  compactModel.latestObservation.date,
                  'monthly',
                )
              : 'Observation period unavailable'}
          </p>
          <p className="series-current__answer">{compactModel.answer}</p>
          {historicalPosition && (
            <p className="series-current__comparison">{historicalPosition}</p>
          )}
        </div>
      )}
      compactVisual={(
        <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
          <RealWageGrowthChart
            model={compactModel}
            accessibleSummary={accessibleSummary}
          />
        </Suspense>
      )}
      expandedContent={expandedContent}
    />
  )
}
