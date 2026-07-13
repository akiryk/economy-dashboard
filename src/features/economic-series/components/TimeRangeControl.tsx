import { timeRanges, type TimeRange } from '../utils/chartData'

const rangeLabels: Record<TimeRange, string> = {
  '5y': '5 years',
  '10y': '10 years',
  '20y': '20 years',
  max: 'Maximum',
}

interface TimeRangeControlProps {
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
  contextLabel: string
}

export function TimeRangeControl({
  selectedRange,
  onRangeChange,
  contextLabel,
}: TimeRangeControlProps) {
  return (
    <fieldset
      className="time-range-control"
      aria-label={`${contextLabel} displayed time range`}
    >
      <legend>Displayed time range</legend>
      <div className="time-range-control__buttons">
        {timeRanges.map((range) => (
          <button
            key={range}
            type="button"
            aria-pressed={selectedRange === range}
            onClick={() => onRangeChange(range)}
          >
            {rangeLabels[range]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
