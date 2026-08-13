import { useMemo, useState } from 'react'
import { formatDate } from '../utils/economicSeries'
import { formatTargetRange, policyChangePoints, type PolicyRateObservation } from '../utils/policyRateData'

interface PolicyRateChartProps {
  observations: readonly PolicyRateObservation[]
  compact?: boolean
  effectiveObservations?: readonly { date: string; value: number | null }[]
}

export function PolicyRateChart({ observations, compact = false, effectiveObservations = [] }: PolicyRateChartProps) {
  const points = useMemo(() => policyChangePoints(observations), [observations])
  const [active, setActive] = useState(Math.max(points.length - 1, 0))
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
  const stepPath = (items: readonly PolicyRateObservation[], bound: 'lower' | 'upper') => items.map((item, index) => {
    const value = item[bound]!
    if (index === 0) return `M ${x(item.date)} ${y(value)}`
    return `L ${x(item.date)} ${y(items[index - 1]![bound]!)} L ${x(item.date)} ${y(value)}`
  }).join(' ')
  const upperPath = stepPath(finite, 'upper')
  const lowerPath = stepPath(finite, 'lower')
  const lowerReverse = [...finite].reverse().map((item) => `L ${x(item.date)} ${y(item.lower!)}`).join(' ')
  const band = `${upperPath} ${lowerReverse} Z`
  const selected = points[active]
  const effectiveByDate = new Map(effectiveObservations.map((item) => [item.date, item.value]))
  const effective = selected ? effectiveByDate.get(selected.date) : null
  return <figure className={`policy-rate-chart${compact ? ' policy-rate-chart--compact' : ''}`}>
    <figcaption className="visually-hidden">Federal funds policy path from {formatDate(observations[0]!.date)} through {formatDate(observations.at(-1)!.date)}. The shaded area is the target range; before December 16, 2008, the line is the single target rate.</figcaption>
    <div className="policy-rate-chart__plot" tabIndex={0} aria-label="Federal funds target history. Use left and right arrow keys to inspect policy changes." onKeyDown={(event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      setActive((current) => Math.max(0, Math.min(points.length - 1, current + (event.key === 'ArrowLeft' ? -1 : 1))))
    }}>
      <svg viewBox="0 0 100 88" role="img" aria-hidden="true" preserveAspectRatio="none">
        <path d={band} className="policy-rate-chart__band" />
        <path d={upperPath} className="policy-rate-chart__bound" />
        <path d={lowerPath} className="policy-rate-chart__bound" />
        {selected?.midpoint !== null && selected && <circle cx={x(selected.date)} cy={y(selected.midpoint!)} r="1.2" className="policy-rate-chart__marker" />}
      </svg>
      {selected && <div className="policy-rate-chart__tooltip" role="status"><strong>{formatDate(selected.date)}</strong><span>{selected.regime === 'single-target' ? `Single target: ${selected.lower?.toFixed(2)}%` : `Target range: ${formatTargetRange(selected)}`}</span>{selected.midpoint !== null && <span>Derived midpoint: {selected.midpoint.toFixed(3)}%</span>}{effective !== undefined && effective !== null && <span>Effective rate: {effective.toFixed(2)}%</span>}</div>}
    </div>
    <div className="policy-rate-chart__dates"><span>{formatDate(observations[0]!.date)}</span><span>{formatDate(observations.at(-1)!.date)}</span></div>
  </figure>
}
