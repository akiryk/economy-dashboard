import { useMemo, useState } from 'react'
import { formatObservationPeriod, selectMostRecentObservations, sortObservationsChronologically } from '../utils/economicSeries'
import { classifyYieldCurve, formatYieldCurveSpread, type YieldCurveObservation } from '../utils/yieldCurveData'
import { CompactChartHelp } from '../components/CompactChartHelp'

export function YieldCurveCompactChart({ observations }: { observations: readonly YieldCurveObservation[] }) {
  const recent = useMemo(() => sortObservationsChronologically(selectMostRecentObservations(observations, 61)) as YieldCurveObservation[], [observations])
  const valid = recent.filter((item): item is YieldCurveObservation & { value: number } => item.value !== null)
  const [active, setActive] = useState(valid.length - 1)
  const values = valid.map(({ value }) => value)
  const minimum = Math.min(...values, 0)
  const maximum = Math.max(...values, 0)
  const range = maximum - minimum || 1
  const x = (index: number) => 4 + index / Math.max(recent.length - 1, 1) * 92
  const y = (value: number) => 8 + (maximum - value) / range * 70
  const paths: string[] = []
  let path = ''
  recent.forEach((item, index) => {
    if (item.value === null) { if (path) paths.push(path); path = ''; return }
    path += `${path ? ' L' : 'M'} ${x(index)} ${y(item.value)}`
  })
  if (path) paths.push(path)
  const selected = valid[active]
  const first = recent[0]
  const last = recent.at(-1)
  const state = selected ? classifyYieldCurve(selected.value).replace('-', ' ') : 'unavailable'
  return <figure className="yield-curve-compact-chart">
    <CompactChartHelp buttonLabel="Explain the yield curve spread" dialogLabel="Yield curve spread explanation" heading="10-year minus 3-month Treasury spread"><p>This card compares the 10-year Treasury yield with the 3-month Treasury bill rate. Normally, longer-term Treasury yields are higher because investors commit money for longer. When the 3-month rate rises above the 10-year yield, the curve is inverted. Inversions often occur when short-term monetary policy is tight and investors expect slower growth, lower inflation, or future rate cuts. They have historically preceded many U.S. recessions, but the signal is probabilistic and its lead time varies.</p><p>Other yield-curve measures, such as the 10-year yield minus the 2-year yield, are also widely followed. This card uses the 10-year-minus-3-month spread because it is the conventional spread used in the New York Fed’s recession-probability framework.</p></CompactChartHelp>
    <figcaption className="visually-hidden">Three-month-average 10-year minus 3-month Treasury spread from {first ? formatObservationPeriod(first.date, 'monthly') : 'unavailable'} through {last ? formatObservationPeriod(last.date, 'monthly') : 'unavailable'}. Negative values indicate inversion.</figcaption>
    <div className="yield-curve-compact-chart__plot" tabIndex={0} aria-label="Yield curve spread chart. Use left and right arrow keys for exact monthly values." onPointerMove={(event) => {
      if (event.pointerType === 'touch') return
      const bounds = event.currentTarget.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(bounds.width, 1)))
      setActive(Math.round(ratio * Math.max(valid.length - 1, 0)))
    }} onPointerDown={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / Math.max(bounds.width, 1)))
      setActive(Math.round(ratio * Math.max(valid.length - 1, 0)))
    }} onKeyDown={(event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      setActive((current) => Math.max(0, Math.min(valid.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1))))
    }}>
      <svg viewBox="0 0 100 92" role="img" aria-hidden="true" preserveAspectRatio="none">
        <rect x="4" y="8" width="92" height={Math.max(0, y(0) - 8)} className="yield-curve-compact-chart__positive" />
        <rect x="4" y={y(0)} width="92" height={Math.max(0, 78 - y(0))} className="yield-curve-compact-chart__negative" />
        <line x1="4" x2="96" y1={y(0)} y2={y(0)} className="yield-curve-compact-chart__zero" />
        {paths.map((value, index) => <path key={index} d={value} className="yield-curve-compact-chart__line" />)}
        {last?.value !== null && last?.value !== undefined && <circle cx={x(recent.length - 1)} cy={y(last.value)} r="2" className="yield-curve-compact-chart__latest" />}
      </svg>
      <span className="yield-curve-compact-chart__positive-label">10-year yield higher</span>
      <span className="yield-curve-compact-chart__negative-label">Inverted</span>
      <span className="yield-curve-compact-chart__zero-label">Zero = 10-year and 3-month rates are equal</span>
      {selected && <div className="yield-curve-compact-chart__tooltip"><strong>{formatObservationPeriod(selected.date, 'monthly')}</strong><span>Three-month-average spread: {formatYieldCurveSpread(selected.value)}</span><span>10-year Treasury yield: {selected.tenYearYield?.toFixed(2) ?? 'Unavailable'}%</span><span>3-month Treasury rate: {selected.threeMonthRate?.toFixed(2) ?? 'Unavailable'}%</span><span>State: {state}</span></div>}
    </div>
    <div className="yield-curve-compact-chart__dates"><span>{first ? formatObservationPeriod(first.date, 'monthly') : ''}</span><span>{last ? formatObservationPeriod(last.date, 'monthly') : ''}</span></div>
  </figure>
}
