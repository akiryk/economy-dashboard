import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import type { EconomicObservation, EconomicSeries } from '../models/economicSeries'
import { formatDate, formatObservationPeriod, formatSignedPercentage } from '../utils/economicSeries'
import {
  lastYears,
  latestValidObservation,
  purchasingPowerAnswer,
  purchasingPowerEvidence,
  type PurchasingPowerYears,
} from '../utils/purchasingPowerPresentation'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'

const PurchasingPowerChart = lazy(() => import('../charts/PurchasingPowerChart').then(({ PurchasingPowerChart: Chart }) => ({ default: Chart })))

interface PurchasingPowerSummaryProps {
  tenYear: EconomicSeries
  fourYear: EconomicSeries
  twentyYear: EconomicSeries
  wages: EconomicSeries
  cpi: EconomicSeries
}

const intervals: readonly PurchasingPowerYears[] = [4, 10, 20]

export function PurchasingPowerSummary({ tenYear, fourYear, twentyYear, wages, cpi }: PurchasingPowerSummaryProps) {
  const [years, setYears] = useState<PurchasingPowerYears>(10)
  const [active, setActive] = useState<EconomicObservation | null>(null)
  const seriesByYears = useMemo(() => ({ 4: fourYear, 10: tenYear, 20: twentyYear }), [fourYear, tenYear, twentyYear])
  const selectedSeries = seriesByYears[years]
  const compactLatest = latestValidObservation(tenYear.observations)
  const compactObservations = useMemo(() => lastYears(tenYear.observations, 40), [tenYear.observations])
  const selectedLatest = latestValidObservation(selectedSeries.observations)
  const displayed = active ?? selectedLatest
  const evidence = useMemo(() => purchasingPowerEvidence(displayed, years, wages, cpi), [cpi, displayed, wages, years])
  const onActiveObservation = useCallback((observation: EconomicObservation | null) => setActive(observation), [])
  const selectYears = (next: PurchasingPowerYears) => { setYears(next); setActive(null) }

  return <CompactMetricCardLayout
    cardId="worker-purchasing-power-history"
    eyebrow="Prices and purchasing power"
    question="How has workers’ purchasing power changed over time?"
    measureLabel="Real hourly earnings · production and nonsupervisory private-sector employees"
    latestValue={<div className="series-current" aria-label="Latest 10-year purchasing-power change">
      <p className="series-current__value">{formatSignedPercentage(compactLatest?.value ?? null)}</p>
      <p className="series-current__label"><strong>over the past 10 years</strong></p>
      <p className="series-current__period">{compactLatest ? formatObservationPeriod(compactLatest.date, 'monthly') : 'Latest comparison unavailable'}</p>
      <p className="series-current__answer">{purchasingPowerAnswer(compactLatest?.value ?? null, 10)}</p>
    </div>}
    compactVisual={<Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
      <PurchasingPowerChart observations={compactObservations} years={10} />
    </Suspense>}
    expandedContent={<>
      <p>This longer-run measure is distinct from the preceding card’s year-over-year all-private real-wage growth. It asks how much the purchasing power of average hourly earnings changed over an exact multi-year interval.</p>
      <fieldset className="time-range-control" aria-label="Purchasing-power comparison interval">
        <legend>Comparison interval</legend>
        <div className="time-range-control__buttons">{intervals.map((interval) => <button key={interval} type="button" aria-pressed={years === interval} onClick={() => selectYears(interval)}>{interval} years</button>)}</div>
      </fieldset>
      <h4>{years}-year purchasing-power history</h4>
      <Suspense fallback={<p className="chart-state">Loading chart visualization…</p>}>
        <PurchasingPowerChart key={years} observations={selectedSeries.observations} years={years} variant="expanded" onActiveObservation={onActiveObservation} />
      </Suspense>
      {evidence ? <section aria-live="polite">
        <h4>{years}-year purchasing-power change: {formatSignedPercentage(evidence.realChange)}</h4>
        <p>{formatObservationPeriod(evidence.startDate, 'monthly')} to {formatObservationPeriod(evidence.endDate, 'monthly')}. The real change uses the exact wage/CPI-W ratio, not nominal wage growth minus inflation.</p>
        <dl className="series-metadata">
          <div><dt>Hourly earnings at start</dt><dd>${evidence.wageStart.toFixed(2)}</dd></div>
          <div><dt>Hourly earnings at end</dt><dd>${evidence.wageEnd.toFixed(2)}</dd></div>
          <div><dt>CPI-W at start</dt><dd>{evidence.cpiStart.toFixed(3)}</dd></div>
          <div><dt>CPI-W at end</dt><dd>{evidence.cpiEnd.toFixed(3)}</dd></div>
          <div><dt>Nominal wage change</dt><dd>{formatSignedPercentage(evidence.nominalChange)}</dd></div>
          <div><dt>Consumer-price change</dt><dd>{formatSignedPercentage(evidence.priceChange)}</dd></div>
          <div><dt>Real purchasing-power change</dt><dd>{formatSignedPercentage(evidence.realChange)}</dd></div>
        </dl>
      </section> : <p className="chart-state">The exact wage and CPI-W comparison is unavailable for this observation.</p>}
      <div className="series-explanations">
        <section><h4>What this tells you</h4><p>A positive reading means average hourly earnings for production and nonsupervisory private-sector employees buy more of the CPI-W basket than they did {years} years earlier. A negative reading means they buy less.</p></section>
        <section><h4>What this leaves out</h4><p>This BLS worker group represents roughly four-fifths of private nonfarm payroll employment, not every worker. The measure uses average hourly earnings, not a median; workforce composition can affect it, and benefits are excluded.</p><p>CPI-W is the broad consumer-price basket BLS uses to deflate this group’s earnings, including categories such as housing and medical care. It does not describe every household’s inflation experience. Rolling observations overlap heavily, and the chart describes outcomes without establishing causes.</p></section>
      </div>
      <footer className="series-supporting">
        <p className="series-source">Sources: <a href="https://fred.stlouisfed.org/series/AHETPI" target="_blank" rel="noreferrer">BLS hourly earnings via FRED</a>; <a href="https://fred.stlouisfed.org/series/CWSR0000SA0" target="_blank" rel="noreferrer">BLS CPI-W via FRED</a>.</p>
        <details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata">
          <div><dt>Wage series</dt><dd>AHETPI · BLS CES0500000008 · seasonally adjusted</dd></div>
          <div><dt>Inflation deflator</dt><dd>CWSR0000SA0 · CPI-W · seasonally adjusted</dd></div>
          <div><dt>Transformation</dt><dd>{selectedSeries.transformation}</dd></div>
          <div><dt>Coverage</dt><dd>{formatObservationPeriod(selectedSeries.observations[0]!.date, 'monthly')} to {formatObservationPeriod(selectedSeries.observations.at(-1)!.date, 'monthly')}</dd></div>
          <div><dt>Retrieved</dt><dd>{formatDate(selectedSeries.retrievedAt)}</dd></div>
        </dl></details>
        <details className="supporting-disclosure"><summary>Recent observations</summary><table><thead><tr><th scope="col">Month</th><th scope="col">{years}-year change</th></tr></thead><tbody>{selectedSeries.observations.slice(-12).reverse().map((observation) => <tr key={observation.date}><th scope="row">{formatObservationPeriod(observation.date, 'monthly')}</th><td>{formatSignedPercentage(observation.value)}</td></tr>)}</tbody></table></details>
      </footer>
    </>}
  />
}
