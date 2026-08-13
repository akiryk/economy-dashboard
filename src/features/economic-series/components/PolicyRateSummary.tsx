import { useMemo, useState } from 'react'
import type { EconomicSeries } from '../models/economicSeries'
import { PolicyRateChart } from '../charts/PolicyRateChart'
import { CompactChartHelp } from './CompactChartHelp'
import { CompactContextDisclosure } from './CompactContextDisclosure'
import { CompactMetricCardLayout } from './CompactMetricCardLayout'
import { TimeRangeControl } from './TimeRangeControl'
import { HistoricalZoomControls } from './HistoricalZoomControls'
import { useHistoricalZoom } from './useHistoricalZoom'
import type { TimeRange } from '../utils/chartData'
import { formatDate, selectMostRecentObservations } from '../utils/economicSeries'
import {
  alignTargetRange,
  buildPolicyHistory,
  classifyPolicyMove,
  formatPolicyMove,
  formatTargetRange,
  policyChangePoints,
} from '../utils/policyRateData'

interface Props {
  lower: EconomicSeries
  upper: EconomicSeries
  historicalTarget: EconomicSeries
  prime: EconomicSeries
  effective: EconomicSeries
}

function selectRange<T extends { date: string }>(items: readonly T[], range: TimeRange): T[] {
  if (range === 'max' || items.length === 0) return [...items]
  const years = Number(range.slice(0, -1))
  const cutoff = new Date(`${items.at(-1)!.date}T00:00:00Z`)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - years)
  const cutoffDate = cutoff.toISOString().slice(0, 10)
  return items.filter(({ date }) => date >= cutoffDate)
}

export function PolicyRateSummary({ lower, upper, historicalTarget, prime, effective }: Props) {
  const [range, setRange] = useState<TimeRange>('5y')
  const aligned = useMemo(() => alignTargetRange(lower.observations, upper.observations), [lower.observations, upper.observations])
  const history = useMemo(() => buildPolicyHistory(historicalTarget.observations, aligned), [historicalTarget.observations, aligned])
  const changes = useMemo(() => policyChangePoints(aligned.filter((item) => item.midpoint !== null)), [aligned])
  const latest = [...aligned].reverse().find((item) => item.midpoint !== null)
  const previousChange = changes.length > 1 ? changes.at(-2)! : undefined
  const move = latest && previousChange ? classifyPolicyMove(latest, previousChange) : null
  const compact = selectRange(aligned, '5y')
  const preset = useMemo(() => selectRange(history, range), [history, range])
  const zoom = useHistoricalZoom(preset, range, 'daily', setRange)
  const visible = zoom.visibleItems
  const latestPrime = [...prime.observations].reverse().find(({ value }) => value !== null)
  const alignedPrime = latest && latestPrime ? latestPrime.value! - latest.midpoint! : null
  const summary = latest
    ? `The Federal Reserve is targeting a federal funds rate between ${latest.lower!.toFixed(2)}% and ${latest.upper!.toFixed(2)}%, effective ${formatDate(latest.date)}. ${formatPolicyMove(move)} The compact chart runs from ${formatDate(compact[0]!.date)} through ${formatDate(compact.at(-1)!.date)}.`
    : 'The current federal funds target range is unavailable.'

  return <CompactMetricCardLayout
    cardId="federal-funds-target-range"
    eyebrow="Monetary policy"
    question="Where has the Fed set short-term interest rates?"
    measureLabel={<span>Federal funds target range <CompactChartHelp buttonLabel="Explain the federal funds target range" dialogLabel="Federal funds target range explanation"><p>The Federal Open Market Committee sets a target range for the federal funds rate, an overnight interest rate in the banking system. This card shows the lower and upper limits of that range.</p><p>The target range is a policy setting, not a consumer borrowing rate. Other interest rates may move with Fed policy but are set in financial markets or by lenders.</p><p>The chart uses step-like changes because the target changes at discrete policy decisions rather than continuously.</p></CompactChartHelp></span>}
    latestValue={<div className="series-current" aria-label={summary}>
      <p className="series-current__value policy-rate-range">{latest ? formatTargetRange(latest) : 'Unavailable'}</p>
      <p className="series-current__label">The Federal Reserve is targeting a federal funds rate between {latest?.lower?.toFixed(2) ?? '—'}% and {latest?.upper?.toFixed(2) ?? '—'}%.</p>
      <p className="series-current__period">{latest ? `Effective ${formatDate(latest.date)}` : 'Effective date unavailable'}</p>
      <p className="series-current__answer">{formatPolicyMove(move)}</p>
      <CompactContextDisclosure accessibleSubject="Federal Reserve policy rates"><p>The federal funds target range is the Federal Reserve’s primary short-term interest-rate policy setting. Changes in the target influence other short-term market rates and can feed through to borrowing costs, saving returns, financial conditions, spending, investment, employment, and inflation.</p><p>The Fed does not directly set most consumer or business borrowing rates. Mortgage rates, credit-card rates, business-loan rates, and other borrowing costs also depend on market expectations, longer-term Treasury yields, credit risk, competition, and other financial conditions.</p><p>A lower policy rate is not automatically better for the economy, and a higher rate is not automatically worse. The Federal Reserve changes rates in pursuit of its employment and price-stability objectives, and the appropriate policy setting depends on economic conditions.</p></CompactContextDisclosure>
    </div>}
    compactVisual={<PolicyRateChart observations={compact} compact />}
    expandedContent={<>
      <TimeRangeControl selectedRange={range} onRangeChange={zoom.selectPreset} contextLabel="Federal funds policy rate" />
      <HistoricalZoomControls active={zoom.active} visiblePeriod={zoom.visiblePeriod} onMove={zoom.move} onResize={zoom.resize} onReset={zoom.reset} />
      <PolicyRateChart observations={visible} effectiveObservations={effective.observations} />
      <p className="chart-summary">Showing {formatDate(visible[0]!.date)} through {formatDate(visible.at(-1)!.date)}. Before December 16, 2008, the chart shows the discontinued single federal funds target; from that date forward it shows the FOMC target range. No range is fabricated for the earlier regime.</p>
      {latest && previousChange && <section className="series-context"><h4>Most recent target change</h4><p>Current: {formatTargetRange(latest)} · Previous: {formatTargetRange(previousChange)} · Effective {formatDate(latest.date)}</p><p>{formatPolicyMove(move)}</p><p>The effective federal funds rate is the market rate observed in overnight federal funds transactions; the target range is the policy range established by the FOMC.</p></section>}
      <section className="series-context" aria-labelledby="prime-rate-heading"><h4 id="prime-rate-heading">How does the bank prime rate compare?</h4><p className="series-current__value">{latestPrime ? `${latestPrime.value!.toFixed(2)}%` : 'Unavailable'}</p><p>The prime rate is a benchmark rate posted by banks and used in pricing some business and consumer loans. The Federal Reserve reports the rate posted by a majority of the largest U.S. commercial banks.</p><p>The Federal Reserve does not set the prime rate. Some credit products are priced as prime rate plus a borrower- or product-specific margin; not every borrower receives prime and mortgage rates are a separate measure.</p>{alignedPrime !== null && <p>Relative to the latest target-range midpoint, the latest prime rate is {alignedPrime.toFixed(2)} percentage points higher. This spread is calculated from current data, not assumed to be fixed.</p>}</section>
      <div className="series-explanations"><section><h4>What this tells you</h4><p>The federal funds target range shows the short-term interest-rate setting chosen by the Federal Reserve. Its changes are one of the main tools the Fed uses to influence financial conditions and the broader economy.</p></section><section><h4>Why it matters</h4><p>Federal Reserve policy affects the economy through borrowing costs, saving incentives, asset prices, exchange rates, and financial conditions. Changes in short-term policy rates can influence consumer spending and business investment, although the size and timing of those effects vary.</p></section><section><h4>What this leaves out</h4><p>The target range does not show the borrowing rate faced by a particular household or business, determine longer-term interest rates by itself, measure the full stance of monetary policy, or indicate whether current policy is appropriate. Inflation expectations, bond-market conditions, credit risk, Federal Reserve balance-sheet policy, and other factors also affect financial conditions.</p></section></div>
      <section className="related-indicators"><h4>Consider alongside</h4><ul><li>30-year mortgage rate</li><li>Yield curve and long-term Treasury yields</li><li>Inflation</li><li>Unemployment and labor-market conditions</li><li>Bank prime rate</li></ul></section>
      <footer className="series-supporting"><p className="series-source">Sources: <a href={lower.sourceUrl} target="_blank" rel="noreferrer">DFEDTARL</a>; <a href={upper.sourceUrl} target="_blank" rel="noreferrer">DFEDTARU</a>; <a href={historicalTarget.sourceUrl} target="_blank" rel="noreferrer">DFEDTAR</a>; <a href={effective.sourceUrl} target="_blank" rel="noreferrer">DFF</a>; <a href={prime.sourceUrl} target="_blank" rel="noreferrer">DPRIME</a>, via FRED.</p><details className="supporting-disclosure"><summary>Series details</summary><dl className="series-metadata"><div><dt>Units and frequency</dt><dd>Percent · Daily effective policy states · Not seasonally adjusted</dd></div><div><dt>Alignment</dt><dd>Lower and upper bounds must share the exact effective date; partial ranges remain unavailable.</dd></div><div><dt>Historical transition</dt><dd>DFEDTAR is a reconstructed/discontinued single-target series from September 27, 1982 through December 15, 2008. DFEDTARL and DFEDTARU begin with the range regime on December 16, 2008.</dd></div><div><dt>Retrieved</dt><dd>{formatDate(lower.retrievedAt)}</dd></div></dl></details><details className="supporting-disclosure"><summary>Recent observations</summary><div className="table-scroll"><table><caption>Recent federal funds target-range policy changes</caption><thead><tr><th>Date</th><th>Lower</th><th>Upper</th><th>Derived midpoint</th></tr></thead><tbody>{selectMostRecentObservations(changes.map((item) => ({ date: item.date, value: item.midpoint })), 12).map((item) => { const target = changes.find(({ date }) => date === item.date)!; return <tr key={item.date}><th>{formatDate(item.date)}</th><td>{target.lower?.toFixed(2)}%</td><td>{target.upper?.toFixed(2)}%</td><td>{target.midpoint?.toFixed(3)}%</td></tr> })}</tbody></table></div></details></footer>
    </>}
  />
}
