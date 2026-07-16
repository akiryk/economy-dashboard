import type { EconomicFrequency } from '../models/economicSeries'
import { formatObservationPeriod } from './economicSeries'

export interface DatedObservation {
  date: string
}

export interface HistoricalZoomRange {
  startIndex: number
  endIndex: number
}

export function fullHistoricalZoomRange(length: number): HistoricalZoomRange {
  return { startIndex: 0, endIndex: Math.max(0, length - 1) }
}

export function clampHistoricalZoomRange(
  range: HistoricalZoomRange,
  length: number,
): HistoricalZoomRange {
  const lastIndex = Math.max(0, length - 1)
  const startIndex = Math.min(Math.max(0, range.startIndex), lastIndex)
  const endIndex = Math.min(Math.max(startIndex, range.endIndex), lastIndex)
  return { startIndex, endIndex }
}

export function historicalZoomRangeFromPercentages(
  start: number,
  end: number,
  length: number,
): HistoricalZoomRange {
  const lastIndex = Math.max(0, length - 1)
  return clampHistoricalZoomRange(
    {
      startIndex: Math.round((Math.min(start, end) / 100) * lastIndex),
      endIndex: Math.round((Math.max(start, end) / 100) * lastIndex),
    },
    length,
  )
}

export function selectHistoricalZoomItems<T extends DatedObservation>(
  items: readonly T[],
  range: HistoricalZoomRange,
): T[] {
  if (items.length === 0) return []
  const clamped = clampHistoricalZoomRange(range, items.length)
  return items.slice(clamped.startIndex, clamped.endIndex + 1)
}

export function isHistoricalZoomActive(
  range: HistoricalZoomRange,
  length: number,
): boolean {
  const full = fullHistoricalZoomRange(length)
  const clamped = clampHistoricalZoomRange(range, length)
  return clamped.startIndex !== full.startIndex || clamped.endIndex !== full.endIndex
}

export function moveHistoricalZoom(
  range: HistoricalZoomRange,
  direction: 'earlier' | 'later',
  length: number,
): HistoricalZoomRange {
  const clamped = clampHistoricalZoomRange(range, length)
  const width = clamped.endIndex - clamped.startIndex
  const step = Math.max(1, Math.round((width + 1) / 4))
  const startIndex = direction === 'earlier'
    ? Math.max(0, clamped.startIndex - step)
    : Math.min(Math.max(0, length - 1 - width), clamped.startIndex + step)
  return { startIndex, endIndex: startIndex + width }
}

export function resizeHistoricalZoom(
  range: HistoricalZoomRange,
  direction: 'in' | 'out',
  length: number,
): HistoricalZoomRange {
  const clamped = clampHistoricalZoomRange(range, length)
  const currentWidth = clamped.endIndex - clamped.startIndex + 1
  const change = Math.max(1, Math.round(currentWidth / 4))
  const targetWidth = direction === 'in'
    ? Math.max(2, currentWidth - change)
    : Math.min(length, currentWidth + change)
  const center = (clamped.startIndex + clamped.endIndex) / 2
  const startIndex = Math.min(
    Math.max(0, Math.round(center - (targetWidth - 1) / 2)),
    Math.max(0, length - targetWidth),
  )
  return { startIndex, endIndex: Math.min(length - 1, startIndex + targetWidth - 1) }
}

export function formatHistoricalZoomPeriod(
  items: readonly DatedObservation[],
  range: HistoricalZoomRange,
  frequency: EconomicFrequency,
): string {
  const visible = selectHistoricalZoomItems(items, range)
  const first = visible[0]
  const last = visible.at(-1)
  if (!first || !last) return 'Visible period unavailable'
  return `Visible period: ${formatObservationPeriod(first.date, frequency)}–${formatObservationPeriod(last.date, frequency)}`
}
