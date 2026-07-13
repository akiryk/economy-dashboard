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
  createInflationComparisonChartOptions,
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

interface InflationComparisonChartProps {
  kind: 'inflation-comparison'
  headlineObservations: readonly EconomicObservation[]
  coreObservations: readonly EconomicObservation[]
  frequency: EconomicFrequency
  variant: 'momentum' | 'year-over-year'
}

export type EconomicTimeSeriesChartProps =
  | SingleSeriesChartProps
  | ComparisonChartProps
  | InflationComparisonChartProps

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
    if (props.kind === 'comparison') return {
      kind: 'comparison' as const,
      nominal: adaptObservationsToChartData(props.nominalObservations),
      inflation: adaptObservationsToChartData(props.inflationObservations),
      real: adaptObservationsToChartData(props.realObservations),
    }
    return {
      kind: 'inflation-comparison' as const,
      headline: adaptObservationsToChartData(props.headlineObservations),
      core: adaptObservationsToChartData(props.coreObservations),
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
            : props.kind === 'inflation-comparison' &&
                chartData.kind === 'inflation-comparison'
              ? createInflationComparisonChartOptions({
                  headlineData: chartData.headline,
                  coreData: chartData.core,
                  frequency: props.frequency,
                  variant: props.variant,
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
          : props.kind === 'comparison'
            ? 'Nominal wage growth and headline CPI inflation comparison chart'
            : props.variant === 'momentum'
              ? 'Headline and core CPI three-month annualized inflation comparison chart'
              : 'Headline and core CPI year-over-year inflation comparison chart'
      }
    />
  )
}
