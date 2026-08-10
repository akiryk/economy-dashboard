import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { HistoricalRangeStrip } from './HistoricalRangeStrip'

afterEach(cleanup)

const historical = {
  percentile: 40,
  historyStart: '1948-01-01', historyEnd: '2026-06-01',
  minimum: { date: '1955-05-01', value: -0.7 },
  maximum: { date: '1980-03-01', value: 14.6 },
  record: null,
} as const

describe('HistoricalRangeStrip', () => {
  it('positions the marker in percentile space and exposes the fixed center-half reference', () => {
    const { container } = render(
      <HistoricalRangeStrip historical={historical} state="normal" valueFormatter={(value) => `${value}%`} dateFormatter={(date) => date.slice(0, 4)} />,
    )
    expect(container.querySelector('.historical-range__middle')).toBeInTheDocument()
    expect(container.querySelector('.historical-range__marker')).toHaveStyle({ left: '40%' })
  })

  it('reveals the same details by pointer, keyboard, touch click, Escape, and outside interaction', async () => {
    const user = userEvent.setup()
    render(
      <HistoricalRangeStrip historical={historical} state="normal" valueFormatter={(value) => `${value}%`} dateFormatter={(date) => date.slice(0, 4)} />,
    )
    const trigger = screen.getByRole('button', { name: /40th percentile.*1948 through 2026/i })
    await user.hover(trigger)
    expect(screen.getByRole('status')).toHaveTextContent('40th percentile')
    await user.unhover(trigger)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.focus(trigger)
    expect(screen.getByRole('status')).toHaveTextContent('Low: -0.7% · 1955')
    fireEvent.keyDown(trigger, { key: 'Escape' })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    expect(screen.getByRole('status')).toHaveTextContent('Sparkline: 5 years')
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('names record status without relying on color', () => {
    render(
      <HistoricalRangeStrip historical={{ ...historical, percentile: 100, record: 'high' }} state="notable-bad" valueFormatter={(value) => `${value}%`} dateFormatter={(date) => date.slice(0, 4)} />,
    )
    expect(screen.getByRole('button', { name: /Record high in the available history/i }))
      .toBeVisible()
  })
})
