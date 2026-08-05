import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { formatObservationPeriod, selectMostRecentObservations, sortObservationsChronologically } from '../utils/economicSeries'
import { formatYieldCurveSpread, type YieldCurveObservation } from '../utils/yieldCurveData'
import { adjacentFiniteObservationIndex, nearestFiniteObservationIndex } from '../utils/inflationCategoryTrendInteraction'
import { CompactChartHelp } from '../components/CompactChartHelp'

export function YieldCurveCompactChart({ observations }: { observations: readonly YieldCurveObservation[] }) {
  const recent = useMemo(() => sortObservationsChronologically(selectMostRecentObservations(observations, 61)) as YieldCurveObservation[], [observations])
  const valid = recent.filter((item): item is YieldCurveObservation & { value: number } => item.value !== null)
  const [active, setActive] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const plotRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()
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
  const selected = active === null ? null : recent[active]
  const first = recent[0]
  const last = recent.at(-1)
  const indexFromPointer = (clientX: number): number | null => {
    const bounds = plotRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return null
    return nearestFiniteObservationIndex(
      recent,
      (clientX - bounds.left) / bounds.width,
    )
  }
  useEffect(() => {
    if (!pinned) return
    const dismiss = (event: PointerEvent) => {
      if (!plotRef.current?.contains(event.target as Node)) {
        setPinned(false)
        setActive(null)
      }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [pinned])
  return <figure className="yield-curve-compact-chart">
    <CompactChartHelp buttonLabel="Explain the yield curve spread" dialogLabel="Yield curve spread explanation" heading="10-year minus 3-month Treasury spread"><p>This card compares the 10-year Treasury yield with the 3-month Treasury bill rate. Positive values mean the 10-year yield is higher, negative values mean the curve is inverted, and zero means the two component rates are equal. Inversions often occur when short-term monetary policy is tight and investors expect slower growth, lower inflation, or future rate cuts. They have historically preceded many U.S. recessions, but the signal is probabilistic and its lead time varies.</p><p>Other yield-curve measures, such as the 10-year yield minus the 2-year yield, are also widely followed. This card uses the 10-year-minus-3-month spread because it is the conventional spread used in the New York Fed’s recession-probability framework.</p></CompactChartHelp>
    <figcaption className="visually-hidden">Three-month-average 10-year minus 3-month Treasury spread from {first ? formatObservationPeriod(first.date, 'monthly') : 'unavailable'} through {last ? formatObservationPeriod(last.date, 'monthly') : 'unavailable'}. Positive values mean the 10-year yield is higher, negative values mean the curve is inverted, and zero means the component rates are equal.</figcaption>
    <span className="yield-curve-compact-chart__region-label">10-year yield higher</span>
    <div ref={plotRef} className="yield-curve-compact-chart__plot" tabIndex={0} aria-label="Yield curve spread chart. Use left and right arrow keys for exact monthly values." aria-describedby={selected ? tooltipId : undefined} onFocus={() => {
      if (active === null) setActive(nearestFiniteObservationIndex(recent, 1))
    }} onBlur={() => {
      if (!pinned) setActive(null)
    }} onPointerMove={(event) => {
      if (!pinned && event.pointerType !== 'touch') {
        setActive(indexFromPointer(event.clientX))
      }
    }} onPointerLeave={(event) => {
      if (!pinned && event.pointerType !== 'touch') setActive(null)
    }} onPointerDown={(event) => {
      if (event.pointerType !== 'touch') return
      const index = indexFromPointer(event.clientX)
      if (pinned && index === active) {
        setPinned(false)
        setActive(null)
      } else {
        setActive(index)
        setPinned(true)
      }
    }} onKeyDown={(event) => {
      if (event.key === 'Escape') {
        setPinned(false)
        setActive(null)
        return
      }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      setActive((current) => adjacentFiniteObservationIndex(
        recent,
        current,
        event.key === 'ArrowLeft' ? -1 : 1,
      ))
    }}>
      <svg viewBox="0 0 100 92" role="img" aria-hidden="true" preserveAspectRatio="none">
        <rect x="4" y="8" width="92" height={Math.max(0, y(0) - 8)} className="yield-curve-compact-chart__positive" />
        <rect x="4" y={y(0)} width="92" height={Math.max(0, 78 - y(0))} className="yield-curve-compact-chart__negative" />
        <line x1="4" x2="96" y1={y(0)} y2={y(0)} className="yield-curve-compact-chart__zero" />
        {paths.map((value, index) => <path key={index} d={value} className="yield-curve-compact-chart__line" />)}
        {last?.value !== null && last?.value !== undefined && <circle cx={x(recent.length - 1)} cy={y(last.value)} r="2" className="yield-curve-compact-chart__latest" />}
      </svg>
      {selected?.value !== null && selected && <div
        className={`yield-curve-compact-chart__tooltip${y(selected.value) < 32 ? ' yield-curve-compact-chart__tooltip--below' : ''}`}
        id={tooltipId}
        role="status"
        style={{
          '--yield-curve-tooltip-position': `${x(active!)}%`,
          top: `${y(selected.value) / 92 * 100}%`,
        } as CSSProperties}
      ><strong className="yield-curve-compact-chart__tooltip-date">{formatObservationPeriod(selected.date, 'monthly')}</strong><span className="yield-curve-compact-chart__tooltip-spread"><span>Spread</span> <strong>{formatYieldCurveSpread(selected.value)}</strong></span><span className="yield-curve-compact-chart__tooltip-rates"><span><span>10Y</span> {selected.tenYearYield?.toFixed(2) ?? 'Unavailable'}%</span><span aria-hidden="true"> · </span><span><span>3M</span> {selected.threeMonthRate?.toFixed(2) ?? 'Unavailable'}%</span></span></div>}
    </div>
    <span className="yield-curve-compact-chart__region-label">Inverted</span>
    <div className="yield-curve-compact-chart__dates"><span>{first ? formatObservationPeriod(first.date, 'monthly') : ''}</span><span>{last ? formatObservationPeriod(last.date, 'monthly') : ''}</span></div>
  </figure>
}
