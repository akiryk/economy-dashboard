import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type {
  EconomicFrequency,
  EconomicObservation,
} from '../models/economicSeries'
import { adaptObservationsToChartData } from './chartAdapters'
import { createEconomicTimeSeriesChartOptions } from './economicTimeSeriesChartOptions'

echarts.use([
  AriaComponent,
  GridComponent,
  LineChart,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
])

export interface EconomicTimeSeriesChartProps {
  observations: readonly EconomicObservation[]
  seriesName: string
  frequency: EconomicFrequency
  units: string
  transformation: string
  includeZero: boolean
}

export default function EconomicTimeSeriesChart({
  observations,
  seriesName,
  frequency,
  units,
  transformation,
  includeZero,
}: EconomicTimeSeriesChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [initializationError, setInitializationError] = useState(false)
  const chartData = useMemo(
    () => adaptObservationsToChartData(observations),
    [observations],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    try {
      const chart = echarts.init(container)
      chartRef.current = chart

      const resize = () => chart.resize()
      const resizeObserver =
        typeof ResizeObserver === 'undefined'
          ? null
          : new ResizeObserver(resize)

      if (resizeObserver) resizeObserver.observe(container)
      else window.addEventListener('resize', resize)

      return () => {
        resizeObserver?.disconnect()
        if (!resizeObserver) window.removeEventListener('resize', resize)
        chart.dispose()
        chartRef.current = null
      }
    } catch (error: unknown) {
      console.error('Failed to initialize the economic time-series chart', error)
      queueMicrotask(() => setInitializationError(true))
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    try {
      chart.setOption(
        createEconomicTimeSeriesChartOptions({
          data: chartData,
          seriesName,
          frequency,
          units,
          transformation,
          includeZero,
        }),
        { notMerge: true },
      )
    } catch (error: unknown) {
      console.error('Failed to update the economic time-series chart', error)
      queueMicrotask(() => setInitializationError(true))
    }
  }, [chartData, frequency, includeZero, seriesName, transformation, units])

  if (initializationError) {
    return (
      <p className="chart-state" role="alert">
        The chart could not be displayed. The observations remain available in
        the table below.
      </p>
    )
  }

  return (
    <div
      ref={containerRef}
      className="economic-chart"
      aria-label={`${seriesName} ${frequency} time-series chart`}
    />
  )
}
