import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  formatObservationPeriod,
  formatSignedPercentage,
} from '../utils/economicSeries'
import {
  adjacentFiniteObservationIndex,
  nearestFiniteObservationIndex,
} from '../utils/inflationCategoryTrendInteraction'
import type {
  CategoryInflationTrend,
  InflationDriversSupportingTrendsModel,
} from '../utils/inflationCategoryTrends'
import {
  createInflationCategoryTrendChartOptions,
  formatCategoryInflationTooltip,
} from './inflationCategoryTrendChartOptions'
import './inflationCategoryTrendCharts.css'

echarts.use([
  CanvasRenderer,
  GridComponent,
  LineChart,
  MarkLineComponent,
  MarkPointComponent,
])

function TrendCanvas({ trend }: { trend: CategoryInflationTrend }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ReturnType<typeof echarts.init> | null>(null)
  const interactionRef = useRef<HTMLDivElement>(null)
  const [chartError, setChartError] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const tooltipId = useId()
  const activeObservation = activeIndex === null
    ? null
    : trend.observations[activeIndex] ?? null
  const options = useMemo(
    () => createInflationCategoryTrendChartOptions(trend, activeObservation),
    [activeObservation, trend],
  )

  useEffect(() => {
    const container = chartRef.current
    if (!container) return
    try {
      const chart = echarts.init(container)
      chartInstanceRef.current = chart
      const resize = () => chart.resize()
      const observer = typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(resize)
      if (observer) observer.observe(container)
      else window.addEventListener('resize', resize)
      return () => {
        observer?.disconnect()
        if (!observer) window.removeEventListener('resize', resize)
        chart.dispose()
        chartInstanceRef.current = null
      }
    } catch (error: unknown) {
      console.error(`Failed to initialize the ${trend.label} inflation trend`, error)
      queueMicrotask(() => setChartError(true))
    }
  }, [trend.label])

  useEffect(() => {
    chartInstanceRef.current?.setOption(options, { notMerge: true })
  }, [options])

  useEffect(() => {
    if (!pinned) return
    const dismiss = (event: PointerEvent) => {
      if (!interactionRef.current?.contains(event.target as Node)) {
        setPinned(false)
        setActiveIndex(null)
      }
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [pinned])

  const indexFromPointer = (clientX: number): number | null => {
    const bounds = interactionRef.current?.getBoundingClientRect()
    if (!bounds || bounds.width === 0) return null
    return nearestFiniteObservationIndex(
      trend.observations,
      (clientX - bounds.left) / bounds.width,
    )
  }
  const activePosition = activeIndex === null || trend.observations.length < 2
    ? 100
    : activeIndex / (trend.observations.length - 1) * 100

  return (
    <div
      ref={interactionRef}
      className="inflation-category-trends__interaction"
      tabIndex={0}
      aria-label={`${trend.label} inflation chart. Use left and right arrow keys for exact monthly values.`}
      aria-describedby={activeObservation ? tooltipId : undefined}
      onFocus={() => {
        if (activeIndex === null) {
          setActiveIndex(nearestFiniteObservationIndex(trend.observations, 1))
        }
      }}
      onBlur={() => {
        if (!pinned) setActiveIndex(null)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setPinned(false)
          setActiveIndex(null)
          interactionRef.current?.focus()
          return
        }
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        setActiveIndex((current) => adjacentFiniteObservationIndex(
          trend.observations,
          current,
          event.key === 'ArrowLeft' ? -1 : 1,
        ))
      }}
      onPointerMove={(event) => {
        if (!pinned && event.pointerType !== 'touch') {
          setActiveIndex(indexFromPointer(event.clientX))
        }
      }}
      onPointerLeave={(event) => {
        if (!pinned && event.pointerType !== 'touch') setActiveIndex(null)
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== 'touch') return
        const index = indexFromPointer(event.clientX)
        if (pinned && index === activeIndex) {
          setPinned(false)
          setActiveIndex(null)
        } else {
          setActiveIndex(index)
          setPinned(true)
        }
      }}
    >
      {chartError
        ? <span className="inflation-category-trends__unavailable">Chart unavailable</span>
        : <div ref={chartRef} className="inflation-category-trends__canvas" aria-hidden="true" />}
      {activeObservation?.value !== null && activeObservation && (
        <div
          className="inflation-category-trends__tooltip"
          id={tooltipId}
          role="status"
          style={{ left: `clamp(5rem, ${activePosition}%, calc(100% - 5rem))` }}
        >
          {formatCategoryInflationTooltip(trend, activeObservation)
            .split('\n').map((line) => <span key={line}>{line}</span>)}
        </div>
      )}
    </div>
  )
}

export function InflationCategoryTrendCharts({
  model,
}: {
  model: InflationDriversSupportingTrendsModel
}) {
  if (!model.trends.length) {
    return (
      <p className="inflation-category-trends__unavailable" role="status">
        No directly comparable category inflation trends are available.
      </p>
    )
  }
  return (
    <div className="inflation-category-trends__rows">
      {model.unavailableLabels.length > 0 && (
        <p className="inflation-category-trends__unavailable" role="status">
          Some directly comparable series are temporarily unavailable.
        </p>
      )}
      {model.trends.map((trend) => (
        <div className="inflation-category-trends__row" key={trend.contributionCategoryId}>
          <span className="inflation-category-trends__label">{trend.label}</span>
          <span className="inflation-category-trends__value">
            {formatSignedPercentage(trend.currentInflationRate)}
          </span>
          <span className="inflation-category-trends__period">
            {formatObservationPeriod(trend.currentPeriod, 'monthly')}
          </span>
          <TrendCanvas trend={trend} />
          <span className="inflation-category-trends__range">
            Scale {trend.displayRangeLabel}
          </span>
        </div>
      ))}
    </div>
  )
}
