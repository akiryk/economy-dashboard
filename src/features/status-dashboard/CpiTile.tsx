import { EconomicStatusTile } from './EconomicStatusTile'
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
    <EconomicStatusTile
      label="Inflation"
      seriesLabel="CPI inflation"
      hero={formatPercent(model.headline.value)}
      state={model.state}
      stateLabel={model.stateLabel}
      secondary={model.core ? `Core ${formatPercent(model.core.value)}` : 'Core unavailable'}
      observations={model.sparkline}
      sparklineSummary={sparklineSummary}
      theme={theme}
      asOf={formatMonth(model.headline.date)}
      historical={model.historical}
      historicalValueFormatter={formatPercent}
      dateFormatter={formatYear}
    />
  )
}
