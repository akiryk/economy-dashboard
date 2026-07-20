export interface MetricSummary {
  median: number | null
  min: number | null
  max: number | null
  noiseFloor: number | null
  noiseFloorPercent: number | null
}

export interface ComparisonRow {
  metric: string
  baseline: number | null
  comparison: number | null
  delta: number | null
  percentDelta: number | null
  noiseFloor: number | null
  significant: boolean | null
}

export function summarize(values: Array<number | null>): MetricSummary {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value)).sort((a, b) => a - b)
  if (finite.length === 0) {
    return { median: null, min: null, max: null, noiseFloor: null, noiseFloorPercent: null }
  }

  const middle = Math.floor(finite.length / 2)
  const median = finite.length % 2 === 0 ? (finite[middle - 1] + finite[middle]) / 2 : finite[middle]
  const min = finite[0]
  const max = finite[finite.length - 1]
  const noiseFloor = (max - min) / 2
  return {
    median,
    min,
    max,
    noiseFloor,
    noiseFloorPercent: median === 0 ? null : (noiseFloor / Math.abs(median)) * 100,
  }
}

export function compareSummaries(
  baseline: Record<string, MetricSummary>,
  comparison: Record<string, MetricSummary>,
): ComparisonRow[] {
  return Object.keys(baseline).map((metric) => {
    const baselineMetric = baseline[metric]
    const comparisonMetric = comparison[metric]
    const canCompare = baselineMetric.median !== null && comparisonMetric?.median !== null
    const delta = canCompare ? comparisonMetric.median! - baselineMetric.median! : null
    const percentDelta = delta !== null && baselineMetric.median !== 0
      ? (delta / Math.abs(baselineMetric.median!)) * 100
      : null
    return {
      metric,
      baseline: baselineMetric.median,
      comparison: comparisonMetric?.median ?? null,
      delta,
      percentDelta,
      noiseFloor: baselineMetric.noiseFloor,
      significant: delta === null || baselineMetric.noiseFloor === null
        ? null
        : Math.abs(delta) > baselineMetric.noiseFloor,
    }
  })
}
