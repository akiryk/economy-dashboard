import { useEffect, useId, useRef, useState } from 'react'
import type { HistoricalPercentile } from './cpiTileModel'
import type { DashboardThresholdState } from './cpiTileModel'

interface HistoricalRangeStripProps {
  seriesLabel: string
  historical: HistoricalPercentile
  state: DashboardThresholdState
  valueFormatter: (value: number) => string
  dateFormatter: (date: string) => string
}

function formatOrdinal(value: number): string {
  const tens = value % 100
  if (tens >= 11 && tens <= 13) return `${value}th`
  if (value % 10 === 1) return `${value}st`
  if (value % 10 === 2) return `${value}nd`
  if (value % 10 === 3) return `${value}rd`
  return `${value}th`
}

function historicalRangeDescription(
  historical: HistoricalPercentile,
): string {
  const percentile = Math.round(historical.percentile)
  const window = `${historical.historyStart.slice(0, 4)} through ${historical.historyEnd.slice(0, 4)}`
  if (historical.record === 'high') {
    return `Record high in the available history, ${window}`
  }
  if (historical.record === 'low') {
    return `Record low in the available history, ${window}`
  }
  return `${formatOrdinal(percentile)} percentile in the available history, ${window}`
}

export function HistoricalRangeStrip({
  seriesLabel,
  historical,
  state,
  valueFormatter,
  dateFormatter,
}: HistoricalRangeStripProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const roundedPercentile = Math.round(historical.percentile)
  const accessibleDescription = historicalRangeDescription(historical)

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])

  return (
    <div
      className="historical-range"
      ref={rootRef}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="historical-range__trigger"
        aria-label={`Historical ${seriesLabel} details: ${accessibleDescription}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
      >
        <span className="historical-range__track" aria-hidden="true">
          <span className="historical-range__middle" />
          <span
            className="historical-range__marker"
            data-state={state}
            data-record={historical.record ?? undefined}
            style={{ left: `${historical.percentile}%` }}
          />
        </span>
      </button>
      {open && (
        <div className="historical-range__panel" id={panelId} role="status">
          <strong>{historical.record
            ? `Record ${historical.record}`
            : `${formatOrdinal(roundedPercentile)} percentile`}</strong>
          <span>History: {dateFormatter(historical.historyStart)}–{dateFormatter(historical.historyEnd)}</span>
          <span>Low: {valueFormatter(historical.minimum.value)} · {dateFormatter(historical.minimum.date)}</span>
          <span>High: {valueFormatter(historical.maximum.value)} · {dateFormatter(historical.maximum.date)}</span>
          <span>Sparkline: 5 years</span>
        </div>
      )}
    </div>
  )
}
