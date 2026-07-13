import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  AriaComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type {
  EconomicFrequency,
  EconomicObservation,
} from '../models/economicSeries'
import { adaptObservationsToChartData } from './chartAdapters'
import {
  createEconomicComparisonChartOptions,
  createEconomicTimeSeriesChartOptions,
} from './economicTimeSeriesChartOptions'
import type { EconomicValueFormat } from '../utils/economicSeries'

echarts.use([
  AriaComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
])

interface SingleSeriesChartProps {
  kind: 'single'
  observations: readonly EconomicObservation[]
  seriesName: string
  frequency: EconomicFrequency
  units: string
  transformation: string
  includeZero: boolean
  valueFormat: EconomicValueFormat
}

interface ComparisonChartProps {
  kind: 'comparison'
  nominalObservations: readonly EconomicObservation[]
  inflationObservations: readonly EconomicObservation[]
  realObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
}

export type EconomicTimeSeriesChartProps =
  | SingleSeriesChartProps
  | ComparisonChartProps

export default function EconomicTimeSeriesChart(
  props: EconomicTimeSeriesChartProps,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const [initializationError, setInitializationError] = useState(false)
  const chartData = useMemo(() => {
    if (props.kind === 'single') {
      return {
        kind: 'single' as const,
        data: adaptObservationsToChartData(props.observations),
      }
    }
    return {
      kind: 'comparison' as const,
      nominal: adaptObservationsToChartData(props.nominalObservations),
      inflation: adaptObservationsToChartData(props.inflationObservations),
      real: adaptObservationsToChartData(props.realObservations),
    }
  }, [props])

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
      const options =
        props.kind === 'single' && chartData.kind === 'single'
          ? createEconomicTimeSeriesChartOptions({
              data: chartData.data,
              seriesName: props.seriesName,
              frequency: props.frequency,
              units: props.units,
              transformation: props.transformation,
              includeZero: props.includeZero,
              valueFormat: props.valueFormat,
            })
          : props.kind === 'comparison' && chartData.kind === 'comparison'
            ? createEconomicComparisonChartOptions({
                nominalData: chartData.nominal,
                inflationData: chartData.inflation,
                realData: chartData.real,
                frequency: props.frequency,
              })
            : null
      if (options) chart.setOption(options, { notMerge: true })
    } catch (error: unknown) {
      console.error('Failed to update the economic time-series chart', error)
      queueMicrotask(() => setInitializationError(true))
    }
  }, [chartData, props])

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
      aria-label={
        props.kind === 'single'
          ? `${props.seriesName} ${props.frequency} time-series chart`
          : 'Nominal wage growth and headline CPI inflation comparison chart'
      }
    />
  )
}
