import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { formatDate } from '../utils/economicSeries'
import { formatTargetRange, policyChangePoints, type PolicyRateObservation } from '../utils/policyRateData'

interface PolicyRateChartProps {
  observations: readonly PolicyRateObservation[]
  compact?: boolean
  effectiveObservations?: readonly { date: string; value: number | null }[]
}

export function PolicyRateChart({ observations, compact = false, effectiveObservations = [] }: PolicyRateChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const display = useMemo(() => {
    const changes = policyChangePoints(observations)
    const latest = observations.at(-1)
    return latest && changes.at(-1)?.date !== latest.date ? [...changes, latest] : changes
  }, [observations])
  const finite = display.filter((item) => item.lower !== null && item.upper !== null)
  if (finite.length === 0) return <p className="chart-state">Target-range history unavailable.</p>

  const start = new Date(`${observations[0]!.date}T00:00:00Z`).getTime()
  const end = new Date(`${observations.at(-1)!.date}T00:00:00Z`).getTime()
  const values = finite.flatMap((item) => [item.lower!, item.upper!])
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const padding = Math.max((maximum - minimum) * .08, .15)
  const low = minimum - padding
  const high = maximum + padding
  const x = (date: string) => 4 + ((new Date(`${date}T00:00:00Z`).getTime() - start) / Math.max(end - start, 1)) * 92
  const y = (value: number) => 6 + ((high - value) / (high - low)) * 76
  const stepPath = (bound: 'lower' | 'upper') => finite.map((item, index) => {
    if (index === 0) return `M ${x(item.date)} ${y(item[bound]!)}`
    return `L ${x(item.date)} ${y(finite[index - 1]![bound]!)} L ${x(item.date)} ${y(item[bound]!)}`
  }).join(' ')
  const selected = active === null ? null : finite[active]
  const effectiveByDate = new Map(effectiveObservations.map((item) => [item.date, item.value]))
  const effective = selected ? effectiveByDate.get(selected.date) : null
  const indexFromPointer = (clientX: number): number | null => {
    const bounds = plotRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return null
    const chartX = 4 + Math.max(0, Math.min(1, (clientX - bounds.left) / bounds.width)) * 92
    let nearest = 0
    for (let index = 1; index < finite.length; index += 1) {
      if (Math.abs(x(finite[index]!.date) - chartX) < Math.abs(x(finite[nearest]!.date) - chartX)) nearest = index
    }
    return nearest
  }

  return <figure className={`policy-rate-chart${compact ? ' policy-rate-chart--compact' : ''}`}>
    <figcaption className="visually-hidden">Federal funds policy path from {formatDate(observations[0]!.date)} through {formatDate(observations.at(-1)!.date)}. The shaded area is the target range; before December 16, 2008, the line is the single target rate.</figcaption>
    <div ref={plotRef} className="policy-rate-chart__plot" tabIndex={0} aria-label="Federal funds target history. Hover, tap, or use left and right arrow keys to inspect policy changes."
      onFocus={() => setActive((current) => current ?? finite.length - 1)}
      onBlur={() => { setPinned(false); setActive(null) }}
      onPointerMove={(event) => { if (!pinned && event.pointerType !== 'touch') setActive(indexFromPointer(event.clientX)) }}
      onPointerLeave={(event) => { if (!pinned && event.pointerType !== 'touch') setActive(null) }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return
        const index = indexFromPointer(event.clientX)
        if (pinned && index === active) { setPinned(false); setActive(null) } else { setPinned(true); setActive(index) }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setPinned(false); setActive(null); return }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        setActive((current) => Math.max(0, Math.min(finite.length - 1, (current ?? finite.length - 1) + (event.key === 'ArrowLeft' ? -1 : 1))))
      }}>
      <svg viewBox="0 0 100 88" role="img" aria-hidden="true" preserveAspectRatio="none">
        {finite.slice(0, -1).map((item, index) => {
          const nextX = x(finite[index + 1]!.date)
          return <rect key={item.date} x={x(item.date)} y={y(item.upper!)} width={Math.max(0, nextX - x(item.date))} height={Math.max(0, y(item.lower!) - y(item.upper!))} className="policy-rate-chart__band" />
        })}
        <path d={stepPath('upper')} className="policy-rate-chart__bound" />
        <path d={stepPath('lower')} className="policy-rate-chart__bound" />
        {selected?.midpoint !== null && selected && <circle cx={x(selected.date)} cy={y(selected.midpoint!)} r="1.2" className="policy-rate-chart__marker" />}
      </svg>
      {selected && <div className="policy-rate-chart__tooltip" role="status" style={{ '--policy-rate-tooltip-x': `${x(selected.date)}%` } as CSSProperties}><strong>{formatDate(selected.date)}</strong><span>{selected.regime === 'single-target' ? `Single target: ${selected.lower?.toFixed(2)}%` : `Target range: ${formatTargetRange(selected)}`}</span>{selected.midpoint !== null && <span>Derived midpoint: {selected.midpoint.toFixed(3)}%</span>}{effective !== undefined && effective !== null && <span>Effective rate: {effective.toFixed(2)}%</span>}</div>}
    </div>
    <div className="policy-rate-chart__dates"><span>{formatDate(observations[0]!.date)}</span><span>{formatDate(observations.at(-1)!.date)}</span></div>
  </figure>
}
