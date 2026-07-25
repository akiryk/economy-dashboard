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
  formatSignedPercentage,
  formatSignedPercentagePoints,
} from '../utils/economicSeries'
import {
  createRecentInflationMomentumAccessibleSummary,
  deriveRecentInflationMomentumModel,
} from '../utils/recentInflationMomentum'
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

interface RecentInflationMomentumSummaryProps {
  twelveMonthHeadline: EconomicSeries
  threeMonthHeadline: EconomicSeries
  twelveMonthCore: EconomicSeries
  threeMonthCore: EconomicSeries
}

export function RecentInflationMomentumSummary({
  twelveMonthHeadline,
  threeMonthHeadline,
  twelveMonthCore,
  threeMonthCore,
}: RecentInflationMomentumSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('20y')
  const model = useMemo(() => deriveRecentInflationMomentumModel({
    twelveMonthHeadline,
    threeMonthHeadline,
  }), [threeMonthHeadline, twelveMonthHeadline])
  const yearOverYearAligned = useMemo(
    () => alignInflationObservations(twelveMonthHeadline, twelveMonthCore),
    [twelveMonthCore, twelveMonthHeadline],
  )
  const momentumAligned = useMemo(
    () => alignInflationObservations(threeMonthHeadline, threeMonthCore),
    [threeMonthCore, threeMonthHeadline],
  )
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
        <h4>Overall CPI pace</h4>
        <CompactChartHelp
          buttonLabel="Explain recent inflation momentum"
          dialogLabel="Recent inflation momentum explanation"
          heading="How to read this comparison"
        >
          <p>
            The 12-month rate compares prices with one year earlier. The recent
            rate takes price changes over the latest three months and expresses
            them as a yearly pace.
          </p>
          <p>
            Annualizing makes the periods directly comparable. The recent rate
            reacts faster than the 12-month rate, but it is noisier and does not
            predict what inflation will be next year.
          </p>
          <p>
            Both compact values use overall, or headline, CPI including food
            and energy. Core CPI, which excludes food and energy, is supporting
            evidence under More and does not override the compact answer.
          </p>
        </CompactChartHelp>
      </div>
      {model.status === 'available' && model.scale &&
      model.zeroPositionPercent !== null ? (
        <>
          <div className="recent-inflation-momentum__rows">
            {model.items.map((item) => (
              <div className="recent-inflation-momentum__row" key={item.id}>
                <span className="recent-inflation-momentum__label">
                  {item.label}
                </span>
                <span className="recent-inflation-momentum__value">
                  {formatSignedPercentage(item.value)}
                </span>
                <span className="recent-inflation-momentum__period">
                  {formatObservationPeriod(item.period, 'monthly')}
                </span>
                <span
                  className="recent-inflation-momentum__track"
                  aria-hidden="true"
                >
                  <span
                    className="recent-inflation-momentum__zero"
                    style={{ left: `${model.zeroPositionPercent}%` }}
                  />
                  <span
                    className={`recent-inflation-momentum__marker recent-inflation-momentum__marker--${item.id}`}
                    style={{ left: `${item.positionPercent}%` }}
                  />
                </span>
              </div>
            ))}
          </div>
          <p className="recent-inflation-momentum__difference">
            Recent pace minus past-year rate:{' '}
            <strong>
              {formatSignedPercentagePoints(model.difference)} percentage points
            </strong>
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
      question="Has inflation picked up in recent months?"
      measureLabel="Recent inflation momentum"
      latestValue={(
        <div className="recent-inflation-momentum__answer">
          <p>{model.answer}</p>
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
            Three-month annualized rates describe the observed latest pace as a
            yearly rate. They are responsive and noisy, and are not forecasts.
          </p>
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
          <section>
            <h4>Three-month annualized headline and core CPI</h4>
            <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
              <EconomicTimeSeriesChart
                kind="inflation-comparison"
                variant="momentum"
                headlineObservations={selectedMomentum.map(({ date, headline }) => ({
                  date, value: headline,
                }))}
                coreObservations={selectedMomentum.map(({ date, core }) => ({
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
                <div><dt>Headline series</dt><dd>CPIAUCSL</dd></div>
                <div><dt>Core series</dt><dd>CPILFESL</dd></div>
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
