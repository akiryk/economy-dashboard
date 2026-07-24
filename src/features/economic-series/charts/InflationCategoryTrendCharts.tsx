import { useEffect, useMemo, useRef, useState } from 'react'
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
import type {
  CategoryInflationTrend,
  InflationDriversSupportingTrendsModel,
} from '../utils/inflationCategoryTrends'
import { createInflationCategoryTrendChartOptions } from './inflationCategoryTrendChartOptions'
import './inflationCategoryTrendCharts.css'

echarts.use([
  CanvasRenderer,
  GridComponent,
  LineChart,
  MarkLineComponent,
  MarkPointComponent,
])

function TrendCanvas({
  trend,
  sharedDomain,
}: {
  trend: CategoryInflationTrend
  sharedDomain: readonly [number, number]
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [chartError, setChartError] = useState(false)
  const options = useMemo(
    () => createInflationCategoryTrendChartOptions(trend, sharedDomain),
    [sharedDomain, trend],
  )
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    try {
      const chart = echarts.init(container)
      chart.setOption(options, { notMerge: true })
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
      }
    } catch (error: unknown) {
      console.error(`Failed to initialize the ${trend.label} inflation trend`, error)
      queueMicrotask(() => setChartError(true))
    }
  }, [options, trend.label])
  return chartError
    ? <span className="inflation-category-trends__unavailable">Chart unavailable</span>
    : <div ref={containerRef} className="inflation-category-trends__canvas" aria-hidden="true" />
}

export function InflationCategoryTrendCharts({
  model,
}: {
  model: InflationDriversSupportingTrendsModel
}) {
  if (!model.trends.length || !model.sharedDomain) {
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
          <TrendCanvas trend={trend} sharedDomain={model.sharedDomain!} />
        </div>
      ))}
    </div>
  )
}
