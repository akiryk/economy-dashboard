import { DashboardTile } from './DashboardTile'
import { CpiSparkline } from './CpiSparkline'
import { HistoricalRangeStrip } from './HistoricalRangeStrip'
import type { CpiTileModel } from './cpiTileModel'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatMonth(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

function formatYear(date: string): string {
  return date.slice(0, 4)
}

interface CpiTileProps {
  model: CpiTileModel
  theme: 'light' | 'dark'
}

export function CpiTile({ model, theme }: CpiTileProps) {
  const firstSparkline = model.sparkline.find(({ value }) => value !== null)
  const sparklineSummary = firstSparkline
    ? `Headline CPI inflation over five years, from ${formatPercent(firstSparkline.value!)} in ${formatMonth(firstSparkline.date)} to ${formatPercent(model.headline.value)} in ${formatMonth(model.headline.date)}. Missing months remain gaps.`
    : 'Headline CPI five-year trend is unavailable.'

  return (
    <DashboardTile label="Inflation" state={model.state}>
      <div className="status-tile__hero-row">
        <p className="status-tile__hero">{formatPercent(model.headline.value)}</p>
        <p className="status-tile__state">{model.stateLabel}</p>
      </div>
      <p className="status-tile__secondary">
        {model.core ? `Core ${formatPercent(model.core.value)}` : 'Core unavailable'}
      </p>
      <CpiSparkline
        observations={model.sparkline}
        state={model.state}
        summary={sparklineSummary}
        theme={theme}
      />
      <HistoricalRangeStrip
        historical={model.historical}
        state={model.state}
        valueFormatter={formatPercent}
        dateFormatter={formatYear}
      />
      <p className="status-tile__meta">As of {formatMonth(model.headline.date)}</p>
    </DashboardTile>
  )
}
