import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import data from '../data/jolts-layoffs-and-discharges-rate.json'
import { validateEconomicSeries } from '../models/validateEconomicSeries'
import { deriveJoltsHistoricalContext } from '../utils/joltsLayoffsContext'
import { formatObservationPeriod } from '../utils/economicSeries'
import { JoltsLayoffsChart } from './JoltsLayoffsChart'

vi.mock('./HistoricalBandChart', () => ({
  HistoricalBandChart: (props: {
    caption: string
    accessibleSummary: string
    showZeroLine: boolean
    showLatestMarker: boolean
    interactiveDetails: boolean
  }) => (
    <figure
      data-testid="historical-band-chart"
      data-caption={props.caption}
      data-summary={props.accessibleSummary}
      data-zero-line={props.showZeroLine}
      data-latest-marker={props.showLatestMarker}
      data-interactive={props.interactiveDetails}
    />
  ),
}))

describe('JoltsLayoffsChart', () => {
  it('shows five continuous years, historical bands, interaction, and no zero line', () => {
    const series = validateEconomicSeries(data)
    const model = deriveJoltsHistoricalContext(series.observations)
    const firstPeriod = formatObservationPeriod(
      model.recentObservations[0]?.date ?? '',
      'monthly',
    )
    const latestPeriod = formatObservationPeriod(
      model.recentObservations.at(-1)?.date ?? '',
      'monthly',
    )
    render(<JoltsLayoffsChart model={model} />)

    const chart = screen.getByTestId('historical-band-chart')
    expect(chart).toHaveAttribute(
      'data-caption',
      `JOLTS layoffs rate · ${firstPeriod}–${latestPeriod}`,
    )
    expect(chart).toHaveAttribute('data-zero-line', 'false')
    expect(chart).toHaveAttribute('data-latest-marker', 'true')
    expect(chart).toHaveAttribute('data-interactive', 'true')
    expect(chart).toHaveAttribute(
      'data-summary',
      expect.stringContaining('The trailing 25-year middle 50%'),
    )
  })
})
