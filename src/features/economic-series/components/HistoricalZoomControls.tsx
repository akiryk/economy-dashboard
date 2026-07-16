interface HistoricalZoomControlsProps {
  active: boolean
  visiblePeriod: string
  onMove: (direction: 'earlier' | 'later') => void
  onResize: (direction: 'in' | 'out') => void
  onReset: () => void
}

export function HistoricalZoomControls({
  active,
  visiblePeriod,
  onMove,
  onResize,
  onReset,
}: HistoricalZoomControlsProps) {
  return (
    <div className="historical-zoom-controls">
      <p className="historical-zoom-controls__period" aria-live="polite">
        {visiblePeriod}
      </p>
      <div
        className="historical-zoom-controls__buttons"
        aria-label="Historical zoom controls"
      >
        <button type="button" onClick={() => onMove('earlier')} disabled={!active}>
          Move earlier
        </button>
        <button type="button" onClick={() => onMove('later')} disabled={!active}>
          Move later
        </button>
        <button type="button" onClick={() => onResize('in')}>
          Zoom in
        </button>
        <button type="button" onClick={() => onResize('out')} disabled={!active}>
          Zoom out
        </button>
        {active && (
          <button type="button" onClick={onReset}>
            Reset zoom
          </button>
        )}
      </div>
    </div>
  )
}
