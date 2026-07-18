import type { LaborSparklineModel } from './laborBriefing'

interface BriefingSparklineProps { model: LaborSparklineModel }

export function BriefingSparkline({ model }: BriefingSparklineProps) {
  const width = 640
  const height = 190
  const padding = 18
  const range = model.maximum - model.minimum || 1
  const x = (index: number) => padding + index * ((width - padding * 2) / (model.observations.length - 1))
  const y = (value: number) => height - padding - ((value - model.minimum) / range) * (height - padding * 2)
  const points = model.observations.map(({ value }, index) => `${x(index)},${y(value)}`).join(' ')
  const summary = `Unemployment over the trailing 10 years ranges from ${model.minimum.toFixed(1)}% to ${model.maximum.toFixed(1)}%. The latest value is ${model.latest.value.toFixed(1)}%. The ${model.comparisonStart} to ${model.comparisonEnd} comparison median is ${model.median.toFixed(1)}%, and the interquartile band runs from ${model.lowerQuartile.toFixed(1)}% to ${model.upperQuartile.toFixed(1)}%.`
  return (
    <figure className="briefing-sparkline">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
        <rect className="briefing-sparkline__band" x={padding} y={y(model.upperQuartile)} width={width - padding * 2} height={Math.max(1, y(model.lowerQuartile) - y(model.upperQuartile))} />
        <line className="briefing-sparkline__median" x1={padding} x2={width - padding} y1={y(model.median)} y2={y(model.median)} />
        <polyline className="briefing-sparkline__line" points={points} />
        <circle className="briefing-sparkline__latest" cx={x(model.observations.length - 1)} cy={y(model.latest.value)} r="5" />
      </svg>
      <figcaption>{summary} The band describes a historical distribution, not a confidence interval.</figcaption>
      <dl className="briefing-sparkline__labels">
        <div><dt>10-year minimum</dt><dd>{model.minimum.toFixed(1)}%</dd></div>
        <div><dt>Latest</dt><dd>{model.latest.value.toFixed(1)}%</dd></div>
        <div><dt>10-year maximum</dt><dd>{model.maximum.toFixed(1)}%</dd></div>
      </dl>
    </figure>
  )
}
