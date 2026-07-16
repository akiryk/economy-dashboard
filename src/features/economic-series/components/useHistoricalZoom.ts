import { useCallback, useMemo, useState } from 'react'
import type { EconomicFrequency } from '../models/economicSeries'
import type { TimeRange } from '../utils/chartData'
import {
  formatHistoricalZoomPeriod,
  fullHistoricalZoomRange,
  historicalZoomRangeFromPercentages,
  isHistoricalZoomActive,
  moveHistoricalZoom,
  resizeHistoricalZoom,
  selectHistoricalZoomItems,
  type DatedObservation,
  type HistoricalZoomRange,
} from '../utils/historicalZoom'

export function useHistoricalZoom<T extends DatedObservation>(
  items: readonly T[],
  selectedRange: TimeRange,
  frequency: EconomicFrequency,
  onPresetChange: (range: TimeRange) => void,
) {
  const zoomKey = `${selectedRange}:${items.length}:${items[0]?.date ?? ''}:${items.at(-1)?.date ?? ''}`
  const [state, setState] = useState<{
    key: string
    range: HistoricalZoomRange
  }>(() => ({
    key: zoomKey,
    range: fullHistoricalZoomRange(items.length),
  }))
  const range =
    state.key === zoomKey
      ? state.range
      : fullHistoricalZoomRange(items.length)
  const setRange = useCallback(
    (
      update:
        | HistoricalZoomRange
        | ((current: HistoricalZoomRange) => HistoricalZoomRange),
    ) => {
      setState((current) => {
        const currentRange =
          current.key === zoomKey
            ? current.range
            : fullHistoricalZoomRange(items.length)
        const nextRange =
          typeof update === 'function' ? update(currentRange) : update
        return { key: zoomKey, range: nextRange }
      })
    },
    [items.length, zoomKey],
  )

  const onChartZoom = useCallback((start: number, end: number) => {
    const next = historicalZoomRangeFromPercentages(start, end, items.length)
    setRange((current) =>
      current.startIndex === next.startIndex && current.endIndex === next.endIndex
        ? current
        : next,
    )
  }, [items.length, setRange])
  const reset = useCallback(
    () => setRange(fullHistoricalZoomRange(items.length)),
    [items.length, setRange],
  )
  const selectPreset = useCallback(
    (nextRange: TimeRange) => {
      reset()
      onPresetChange(nextRange)
    },
    [onPresetChange, reset],
  )
  const move = useCallback((direction: 'earlier' | 'later') => {
    setRange((current) => moveHistoricalZoom(current, direction, items.length))
  }, [items.length, setRange])
  const resize = useCallback((direction: 'in' | 'out') => {
    setRange((current) => resizeHistoricalZoom(current, direction, items.length))
  }, [items.length, setRange])

  return {
    visibleItems: useMemo(
      () => selectHistoricalZoomItems(items, range),
      [items, range],
    ),
    range,
    active: isHistoricalZoomActive(range, items.length),
    visiblePeriod: formatHistoricalZoomPeriod(items, range, frequency),
    onChartZoom,
    reset,
    move,
    resize,
    selectPreset,
  }
}
