import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LineChart } from 'echarts/charts'
import { GridComponent, MarkLineComponent, MarkPointComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { EconomicObservation } from '../models/economicSeries'
import { CompactChartHelp } from '../components/CompactChartHelp'
import { formatObservationPeriod, formatSignedPercentage } from '../utils/economicSeries'
import { adjacentFiniteObservationIndex, nearestFiniteObservationIndex } from '../utils/inflationCategoryTrendInteraction'
import { createPurchasingPowerChartOptions } from './purchasingPowerChartOptions'
import './purchasingPowerChart.css'

echarts.use([CanvasRenderer, GridComponent, LineChart, MarkLineComponent, MarkPointComponent, TooltipComponent])

export function PurchasingPowerChart({
  observations, years, variant = 'compact', onActiveObservation,
}: {
  observations: readonly EconomicObservation[]
  years: number
  variant?: 'compact' | 'expanded'
  onActiveObservation?: (observation: EconomicObservation | null) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const interactionRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ReturnType<typeof echarts.init> | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState(false)
  const summaryId = useId()
  const tooltipId = useId()
  const latestIndex = useMemo(() => {
    for (let index = observations.length - 1; index >= 0; index -= 1) {
      if (observations[index]!.value !== null) return index
    }
    return null
  }, [observations])
  const active = activeIndex === null ? null : observations[activeIndex] ?? null
  const options = useMemo(() => createPurchasingPowerChartOptions(observations, active), [active, observations])

  useEffect(() => {
    const container = canvasRef.current
    if (!container) return
    try {
      const chart = echarts.init(container)
      chartRef.current = chart
      const resize = () => chart.resize()
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
      observer?.observe(container)
      if (!observer) window.addEventListener('resize', resize)
      return () => {
        observer?.disconnect()
        if (!observer) window.removeEventListener('resize', resize)
        chart.dispose()
        chartRef.current = null
      }
    } catch (chartError: unknown) {
      console.error('Failed to initialize purchasing-power chart', chartError)
      queueMicrotask(() => setError(true))
    }
  }, [])

  useEffect(() => { chartRef.current?.setOption(options, { notMerge: true }) }, [options])
  useEffect(() => { onActiveObservation?.(active) }, [active, onActiveObservation])
  useEffect(() => {
    if (!pinned) return
    const dismiss = (event: PointerEvent) => {
      if (!interactionRef.current?.contains(event.target as Node)) {
        setPinned(false); setActiveIndex(null)
      }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [pinned])

  if (latestIndex === null) return <p className="chart-state" role="status">Purchasing-power history is unavailable.</p>
  const indexFromPointer = (x: number) => {
    const bounds = interactionRef.current?.getBoundingClientRect()
    return !bounds || bounds.width === 0 ? null : nearestFiniteObservationIndex(observations, (x - bounds.left) / bounds.width)
  }
  const shown = active ?? observations[latestIndex]!
  const position = activeIndex === null || observations.length < 2 ? 100 : activeIndex / (observations.length - 1) * 100
  const first = observations[0]!
  const last = observations.at(-1)!

  return <figure className={`purchasing-power-chart purchasing-power-chart--${variant}`} aria-labelledby={summaryId}>
    <div ref={interactionRef} className="purchasing-power-chart__interaction" tabIndex={0}
      aria-label={`${years}-year purchasing-power change chart. Use left and right arrow keys for exact monthly values.`}
      aria-describedby={active ? tooltipId : undefined}
      onFocus={() => { if (activeIndex === null) setActiveIndex(latestIndex) }}
      onBlur={() => { if (!pinned) setActiveIndex(null) }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setPinned(false); setActiveIndex(null); interactionRef.current?.focus(); return }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        setActiveIndex((current) => adjacentFiniteObservationIndex(observations, current, event.key === 'ArrowLeft' ? -1 : 1))
      }}
      onPointerMove={(event) => { if (!pinned && event.pointerType !== 'touch') setActiveIndex(indexFromPointer(event.clientX)) }}
      onPointerLeave={(event) => { if (!pinned && event.pointerType !== 'touch') setActiveIndex(null) }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return
        const index = indexFromPointer(event.clientX)
        if (pinned && index === activeIndex) { setPinned(false); setActiveIndex(null) } else { setActiveIndex(index); setPinned(true) }
      }}>
      {error ? <span className="chart-state">Chart unavailable</span> : <div ref={canvasRef} className="purchasing-power-chart__canvas" aria-hidden="true" />}
      {active?.value !== null && active && <div id={tooltipId} role="status" className="purchasing-power-chart__tooltip" style={{ left: `clamp(5rem, ${position}%, calc(100% - 5rem))` }}>
        <span>{years}-year change</span><span>{formatObservationPeriod(active.date, 'monthly')}</span><span>{formatSignedPercentage(active.value)}</span>
      </div>}
    </div>
    <div className="purchasing-power-chart__periods"><span>{formatObservationPeriod(first.date, 'monthly')}</span><span>{formatObservationPeriod(last.date, 'monthly')}</span></div>
    <div className="purchasing-power-chart__footer">
      <p>Zero = no purchasing-power change over {years} years</p>
      {variant === 'compact' && <CompactChartHelp buttonLabel="Explain the purchasing-power chart" dialogLabel="Purchasing-power chart explanation">
        <p>Every point compares that month’s real hourly earnings with the same month {years} years earlier.</p>
        <p>Neighboring points overlap heavily: adjacent 10-year readings share 119 of their 120 monthly intervals. The dot marks the latest reading.</p>
      </CompactChartHelp>}
    </div>
    <figcaption className="visually-hidden" id={summaryId}>The latest point is {formatSignedPercentage(shown.value)} in {formatObservationPeriod(shown.date, 'monthly')}. Positive values mean average hourly earnings buy more of the CPI-W basket than {years} years earlier; negative values mean they buy less.</figcaption>
  </figure>
}
