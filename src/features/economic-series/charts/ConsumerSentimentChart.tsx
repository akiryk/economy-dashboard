import { useId, useMemo, useRef, useState } from 'react'
import { formatObservationPeriod } from '../utils/economicSeries'
import { adjacentFiniteObservationIndex, nearestFiniteObservationIndex } from '../utils/inflationCategoryTrendInteraction'
import { createConsumerSentimentPlot, type ConsumerSentimentContext } from '../utils/consumerSentiment'

export function ConsumerSentimentChart({ context }: { context: ConsumerSentimentContext }) {
  const plot = useMemo(() => createConsumerSentimentPlot(context), [context])
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const descriptionId = useId()
  const activeIndex = context.observations.findIndex(({ date }) => date === activeDate)
  const selected = context.observations[activeIndex]
  function select(index: number | null) {
    setActiveDate(index === null ? null : context.observations[index]!.date)
  }
  function selectAtPointer(clientX: number) {
    const bounds = ref.current?.getBoundingClientRect()
    if (!bounds || !bounds.width) return
    const ratio = (clientX - bounds.left - bounds.width * 50 / 700) / (bounds.width * 620 / 700)
    select(nearestFiniteObservationIndex(context.observations, ratio))
  }
  const decadeLabels = context.observations.flatMap(({ date }, index) =>
    date.endsWith('-01-01') && Number(date.slice(0, 4)) % 10 === 0
      ? [{ date, index }] : [])

  return <figure className="consumer-sentiment__chart">
    <figcaption id={descriptionId} className="visually-hidden">
      Consumer sentiment from {formatObservationPeriod(context.first.date, 'monthly')} through {formatObservationPeriod(context.latest.date, 'monthly')}.
      Higher readings mean more optimism. Index, not percent. Missing months remain gaps.
      Use left and right arrow keys for exact monthly values; Home and End go to the first and latest readings.
    </figcaption>
    <div ref={ref} className="consumer-sentiment__plot" role="group" tabIndex={0}
      aria-label="Consumer sentiment historical chart" aria-describedby={descriptionId}
      onFocus={() => { if (activeIndex < 0) setActiveDate(context.latest.date) }}
      onBlur={() => setActiveDate(null)}
      onPointerMove={(event) => { if (event.pointerType !== 'touch') selectAtPointer(event.clientX) }}
      onPointerLeave={() => { if (document.activeElement !== ref.current) setActiveDate(null) }}
      onPointerDown={(event) => { if (event.pointerType === 'touch') selectAtPointer(event.clientX) }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setActiveDate(null); return }
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
        event.preventDefault()
        if (event.key === 'Home') select(nearestFiniteObservationIndex(context.observations, 0))
        else if (event.key === 'End') select(nearestFiniteObservationIndex(context.observations, 1))
        else select(adjacentFiniteObservationIndex(context.observations, activeIndex < 0 ? null : activeIndex, event.key === 'ArrowLeft' ? -1 : 1))
      }}>
      <svg viewBox="0 0 700 235" aria-hidden="true">
        {plot.ticks.map((value) => <g key={value}>
          <line x1="50" x2="670" y1={plot.y(value)} y2={plot.y(value)} className="consumer-sentiment__grid" />
          <text x="40" y={plot.y(value) + 4} textAnchor="end">{value.toFixed(0)}</text>
        </g>)}
        {decadeLabels.map(({ date, index }) => <text key={date} x={plot.x(index)} y="224" textAnchor="middle">{date.slice(0, 4)}</text>)}
        {plot.paths.map((path, index) => <path key={index} d={path} className="consumer-sentiment__line" />)}
        <circle cx={plot.x(context.observations.length - 1)} cy={plot.y(context.latest.value)} r="3.5" className="consumer-sentiment__point" />
        {selected?.value !== null && selected && <circle cx={plot.x(activeIndex)} cy={plot.y(selected.value)} r="5" className="consumer-sentiment__point" />}
      </svg>
    </div>
    <p className="consumer-sentiment__selection" role="status" aria-live="polite">
      {selected?.value !== null && selected
        ? `${formatObservationPeriod(selected.date, 'monthly')}: ${selected.value.toFixed(1)}`
        : 'Hover, tap, or focus the chart to inspect a month.'}
    </p>
  </figure>
}
