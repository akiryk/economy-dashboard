import { lazy, Suspense, useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import type { TimeRange } from '../utils/chartData'
import {
  alignInflationObservations,
  filterInflationComparisonByTimeRange,
} from '../utils/inflationComparisonData'
import {
  formatDate,
  formatObservationPeriod,
  formatPercentage,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  createRecentInflationMomentumAccessibleSummary,
  deriveRecentInflationMomentumModel,
} from '../utils/recentInflationMomentum'
import { compactReferenceLineTheme } from '../charts/compactChartTheme'
import { CompactChartHelp } from './CompactChartHelp'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { InflationComparisonTable } from './InflationComparisonTable'
import { TimeRangeControl } from './TimeRangeControl'
import { useHistoricalZoom } from './useHistoricalZoom'
import './recentInflationMomentum.css'

const EconomicTimeSeriesChart = lazy(
  () => import('../charts/EconomicTimeSeriesChart'),
)

const keepPrimaryMomentumRange = () => undefined

interface RecentInflationMomentumSummaryProps {
  twelveMonthHeadline: EconomicSeries
  threeMonthHeadline: EconomicSeries
  twelveMonthCore: EconomicSeries
  threeMonthCore: EconomicSeries
  headlineNsaLevels: EconomicSeries
  headlineSaLevels: EconomicSeries
}

export function RecentInflationMomentumSummary({
  twelveMonthHeadline,
  threeMonthHeadline,
  twelveMonthCore,
  threeMonthCore,
  headlineNsaLevels,
  headlineSaLevels,
}: RecentInflationMomentumSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const model = useMemo(() => deriveRecentInflationMomentumModel({
    twelveMonthHeadline,
    threeMonthHeadline,
    headlineNsaLevels,
    headlineSaLevels,
  }), [headlineNsaLevels, headlineSaLevels, threeMonthHeadline, twelveMonthHeadline])
  const yearOverYearAligned = useMemo(
    () => alignInflationObservations(twelveMonthHeadline, twelveMonthCore),
    [twelveMonthCore, twelveMonthHeadline],
  )
  const momentumAligned = useMemo(
    () => alignInflationObservations(threeMonthHeadline, threeMonthCore),
    [threeMonthCore, threeMonthHeadline],
  )
  const primaryMomentum = useMemo(() => {
    const end = momentumAligned.at(-1)?.date
    if (!end) return []
    const start = new Date(`${end}T00:00:00Z`)
    start.setUTCMonth(start.getUTCMonth() - 23)
    const startDate = start.toISOString().slice(0, 10)
    return momentumAligned.filter(({ date }) => date >= startDate && date <= end)
  }, [momentumAligned])
  const selectedMomentum = useMemo(
    () => filterInflationComparisonByTimeRange(momentumAligned, selectedRange),
    [momentumAligned, selectedRange],
  )
  const zoom = useHistoricalZoom(
    selectedMomentum,
    selectedRange,
    'monthly',
    setSelectedRange,
  )
  const visibleMomentum = zoom.visibleItems
  const visibleStart = visibleMomentum[0]?.date
  const visibleEnd = visibleMomentum.at(-1)?.date
  const selectedYearOverYear = useMemo(
    () => filterInflationComparisonByTimeRange(
      yearOverYearAligned,
      selectedRange,
    ),
    [selectedRange, yearOverYearAligned],
  )
  const visibleYearOverYear = selectedYearOverYear.filter(({ date }) =>
    (!visibleStart || date >= visibleStart) && (!visibleEnd || date <= visibleEnd))
  const accessibleSummary = createRecentInflationMomentumAccessibleSummary(model)

  const comparison = (
    <figure
      className="recent-inflation-momentum"
      aria-labelledby="recent-inflation-momentum-summary"
    >
      <div className="recent-inflation-momentum__heading">
        <h4>Headline CPI momentum</h4>
        <CompactChartHelp
          buttonLabel="Explain recent inflation momentum"
          dialogLabel="Recent inflation momentum explanation"
          heading="How to read this comparison"
        >
          <p>
            The comparison uses two adjacent, non-overlapping three-month
            windows. Each rate expresses its observed three-month price change
            as a yearly pace.
          </p>
          <p>
            The latest window ends in the current observation month. The
            previous window ends three months earlier. Complete consecutive
            monthly CPI observations are required; missing months remain gaps.
          </p>
          <p>
            The comparison remains separate from the two headline values. Its
            percentage-point difference is supporting context, not the card’s
            primary inflation-rate measure. Differences smaller than 0.1
            percentage point are described as little changed; differences of
            at least 1 percentage point are described as sharp. Unrounded
            values determine the answer.
          </p>
          <p>
            Both compact values use overall, or headline, CPI including food
            and energy. Core CPI, which excludes food and energy, is supporting
            evidence under More and does not override the compact answer.
          </p>
        </CompactChartHelp>
      </div>
      {model.status === 'available' ? (
        <>
          <div className="recent-inflation-momentum__slope">
            <div className="recent-inflation-momentum__endpoints">
              {model.items.map((item) => (
                <div
                  className={`recent-inflation-momentum__endpoint recent-inflation-momentum__endpoint--${item.id}`}
                  key={item.id}
                >
                  <span className="recent-inflation-momentum__label">
                    {item.label}
                  </span>
                  <span className="recent-inflation-momentum__value">
                    {formatSignedPercentage(item.value)}
                  </span>
                  <span className="recent-inflation-momentum__period">
                    {formatObservationPeriod(item.period, 'monthly')}
                  </span>
                </div>
              ))}
            </div>
            <svg
              className="recent-inflation-momentum__slope-plot"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              data-direction={model.slopeDirection}
              aria-hidden="true"
            >
              <line
                className="recent-inflation-momentum__reference"
                x1="4"
                y1={model.slopeReferenceY ?? 34}
                x2="96"
                y2={model.slopeReferenceY ?? 34}
                stroke={compactReferenceLineTheme.color}
                strokeWidth={compactReferenceLineTheme.width}
                strokeDasharray={compactReferenceLineTheme.svgDashArray}
                opacity={compactReferenceLineTheme.opacity}
              />
              <line
                className="recent-inflation-momentum__connector"
                x1="10"
                y1={model.items[0]?.slopeYPercent}
                x2="90"
                y2={model.items[1]?.slopeYPercent}
              />
              <line
                className="recent-inflation-momentum__point"
                x1="10"
                y1={model.items[0]?.slopeYPercent}
                x2="10.001"
                y2={model.items[0]?.slopeYPercent}
              />
              <line
                className="recent-inflation-momentum__point recent-inflation-momentum__point--recent"
                x1="90"
                y1={model.items[1]?.slopeYPercent}
                x2="90.001"
                y2={model.items[1]?.slopeYPercent}
              />
            </svg>
          </div>
          <p className="recent-inflation-momentum__difference">
            <strong>{model.differenceLabel}</strong>
          </p>
        </>
      ) : (
        <p className="chart-state">
          The required latest overall CPI observations are unavailable.
        </p>
      )}
      <figcaption
        className="visually-hidden"
        id="recent-inflation-momentum-summary"
      >
        {accessibleSummary}
      </figcaption>
    </figure>
  )

  return (
    <CompactMetricCardLayout
      cardId="recent-inflation-momentum"
      eyebrow="Inflation comparison"
      question="What is inflation doing recently?"
      measureLabel="Recent inflation momentum"
      latestValue={(
        <div className="recent-inflation-momentum__answer">
          <div className="recent-inflation-momentum__rates">
            <div>
              <p className="recent-inflation-momentum__hero">
                {formatPercentage(model.twelveMonthRate)}
              </p>
              <p className="recent-inflation-momentum__hero-label">
                12-month inflation
              </p>
            </div>
            <div className="recent-inflation-momentum__conditional">
              <p className="recent-inflation-momentum__conditional-value">
                {formatPercentage(model.conditionalRate)}
              </p>
              <p className="recent-inflation-momentum__hero-label">
                In 3 months if the recent pace continues
              </p>
            </div>
          </div>
          <p className="recent-inflation-momentum__answer-text">
            {model.answer}
          </p>
        </div>
      )}
      compactVisual={comparison}
      expandedContent={(
        <div className="recent-inflation-momentum__expanded">
          <p>
            Headline means overall CPI, including food and energy. Core CPI
            excludes food and energy. The compact answer compares headline with
            headline; core is supporting evidence and does not change that
            classification.
          </p>
          <p>
            Three-month annualized rates describe observed paces as yearly
            rates. The compact answer compares the latest three months with the
            immediately preceding non-overlapping three months. A rate such as
            0.5% annualized does not mean the actual inflation rate is 0.5% or
            that inflation will be 0.5%.
          </p>
          <section>
            <h4>Conditional 12-month rate</h4>
            {model.conditionalRate !== null && model.conditionalPeriod &&
            model.recentThreeMonthGrowth !== null && model.conditionalCpiNsa !== null &&
            model.baseObservation ? (
              <>
                <p>
                  Seasonally adjusted headline CPI increased by{' '}
                  {formatPercentage(model.recentThreeMonthGrowth * 100)} over
                  the latest three months. Applying that exact cumulative
                  increase once to the current not-seasonally-adjusted CPI
                  produces a conditional {formatObservationPeriod(model.conditionalPeriod, 'monthly')}{' '}
                  index of {model.conditionalCpiNsa.toFixed(3)}. Compared with
                  the {formatObservationPeriod(model.baseObservation.date, 'monthly')}{' '}
                  NSA base of {model.baseObservation.value.toFixed(3)}, the
                  conditional 12-month rate is {formatPercentage(model.conditionalRate)}.
                </p>
                {model.baseObservation.kind === 'interpolated' && (
                  <p>
                    The official {formatObservationPeriod(model.baseObservation.date, 'monthly')}{' '}
                    CPI index was unavailable. For this derived scenario only,
                    the missing NSA index is estimated as the geometric mean of
                    the official {formatObservationPeriod(model.baseObservation.previousDate, 'monthly')}{' '}
                    index ({model.baseObservation.previousValue.toFixed(3)}) and{' '}
                    {formatObservationPeriod(model.baseObservation.nextDate, 'monthly')}{' '}
                    index ({model.baseObservation.nextValue.toFixed(3)}), following
                    BLS’s published approximation approach for an isolated gap.
                    BLS did not publish the estimated value.
                  </p>
                )}
              </>
            ) : (
              <p>{model.conditionalUnavailableReason}</p>
            )}
            <p>
              The conditional rate is not a forecast. It repeats the latest
              three-month seasonally adjusted price increase once, applies it
              to the current NSA index, and calculates the ordinary 12-month
              CPI rate three months later.
            </p>
            <p>
              Short-window momentum uses seasonally adjusted CPI to remove
              ordinary seasonal patterns. The standard reported 12-month
              headline rate uses not-seasonally-adjusted CPI.
            </p>
            <p>
              The 12-month rate can rise or fall even when recent momentum is
              unchanged because older months continually drop out. This
              conditional rate incorporates those base effects by replacing
              the three months that roll out with one repetition of the latest
              three-month increase.
            </p>
          </section>
          <p>
            The percentage-point change between the momentum windows is{' '}
            {model.differenceLabel?.toLowerCase() ?? 'unavailable'}.
          </p>
          <section>
            <h4>Rolling 3-month annualized headline and core CPI</h4>
            <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
              <EconomicTimeSeriesChart
                kind="inflation-comparison"
                variant="momentum"
                headlineObservations={primaryMomentum.map(({ date, headline }) => ({
                  date, value: headline,
                }))}
                coreObservations={primaryMomentum.map(({ date, core }) => ({
                  date, value: core,
                }))}
                frequency="monthly"
                zoomStartDate={primaryMomentum.at(0)?.date ?? ''}
                zoomEndDate={primaryMomentum.at(-1)?.date ?? ''}
                onZoomChange={keepPrimaryMomentumRange}
              />
            </Suspense>
          </section>
          <TimeRangeControl
            selectedRange={selectedRange}
            onRangeChange={zoom.selectPreset}
            contextLabel="Recent Inflation Momentum"
          />
          <HistoricalZoomControls
            active={zoom.active}
            visiblePeriod={zoom.visiblePeriod}
            onMove={zoom.move}
            onResize={zoom.resize}
            onReset={zoom.reset}
          />
          <section>
            <h4>12-month headline and core CPI</h4>
            <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
              <EconomicTimeSeriesChart
                kind="inflation-comparison"
                variant="year-over-year"
                headlineObservations={selectedYearOverYear.map(({ date, headline }) => ({
                  date, value: headline,
                }))}
                coreObservations={selectedYearOverYear.map(({ date, core }) => ({
                  date, value: core,
                }))}
                frequency="monthly"
                zoomStartDate={visibleStart ?? ''}
                zoomEndDate={visibleEnd ?? ''}
                onZoomChange={zoom.onChartZoom}
              />
            </Suspense>
          </section>
          <p className="chart-summary">
            Headline and core can diverge because core excludes food and energy.
            Both charts use one shared percent axis within their panel, retain
            actual publication gaps, and provide exact hover details.
          </p>
          <footer className="series-supporting">
            <p className="series-source">
              Sources:{' '}
              <a href={twelveMonthHeadline.sourceUrl} rel="noreferrer" target="_blank">
                Headline CPI via FRED
              </a>
              {'; '}
              <a href={twelveMonthCore.sourceUrl} rel="noreferrer" target="_blank">
                Core CPI via FRED
              </a>
            </p>
            <details className="supporting-disclosure">
              <summary>Series details</summary>
              <dl className="series-metadata">
                <div><dt>12-month headline series</dt><dd>{twelveMonthHeadline.providerSeriesId} · {twelveMonthHeadline.seasonalAdjustment}</dd></div>
                <div><dt>3-month headline series</dt><dd>{threeMonthHeadline.providerSeriesId} · {threeMonthHeadline.seasonalAdjustment}</dd></div>
                <div><dt>Core series</dt><dd>{twelveMonthCore.providerSeriesId} · {twelveMonthCore.seasonalAdjustment}</dd></div>
                <div><dt>Frequency</dt><dd>Monthly</dd></div>
                <div>
                  <dt>Retrieved</dt>
                  <dd>{formatDate(twelveMonthHeadline.retrievedAt)}</dd>
                </div>
              </dl>
            </details>
            <details className="supporting-disclosure">
              <summary>Recent 12-month observations</summary>
              <InflationComparisonTable
                observations={visibleYearOverYear}
                variant="year-over-year"
              />
            </details>
            <details className="supporting-disclosure">
              <summary>Recent three-month observations</summary>
              <InflationComparisonTable
                observations={visibleMomentum}
                variant="momentum"
              />
            </details>
          </footer>
        </div>
      )}
    />
  )
}
