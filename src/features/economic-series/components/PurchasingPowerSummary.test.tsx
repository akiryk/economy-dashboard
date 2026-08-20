import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { PurchasingPowerSummary } from './PurchasingPowerSummary'

vi.mock('../charts/PurchasingPowerChart', () => ({
  PurchasingPowerChart: ({ years, observations }: { years: number; observations: unknown[] }) => <div data-testid={`chart-${years}`}>{observations.length} observations</div>,
}))

afterEach(cleanup)

const series = (id: string, values: [string, number | null][]): EconomicSeries => ({
  id, slug: id, provider: 'FRED', providerSeriesId: id, title: id, shortTitle: id,
  description: id, question: id, units: id, frequency: 'monthly', seasonalAdjustment: 'Seasonally adjusted',
  transformation: 'Exact ratio transformation', sourceName: id, sourceUrl: 'https://example.com', retrievedAt: '2026-08-20',
  observations: values.map(([date, value]) => ({ date, value })),
})

function renderSummary(tenYearValue: number | null = 6.04) {
  render(<PurchasingPowerSummary
    tenYear={series('10-year', [['2026-07-01', tenYearValue]])}
    fourYear={series('4-year', [['2026-07-01', -2]])}
    twentyYear={series('20-year', [['2026-07-01', 12]])}
    wages={series('AHETPI', [['2016-07-01', 20], ['2022-07-01', 24], ['2006-07-01', 15], ['2026-07-01', 30]])}
    cpi={series('CWSR0000SA0', [['2016-07-01', 100], ['2022-07-01', 110], ['2006-07-01', 80], ['2026-07-01', 125]])}
  />)
}

describe('PurchasingPowerSummary', () => {
  it('shows the stable 10-year compact hero and interpretation', async () => {
    renderSummary()
    expect(screen.getByRole('heading', { name: 'How has workers’ purchasing power changed over time?' })).toBeInTheDocument()
    expect(screen.getByLabelText('Latest 10-year purchasing-power change')).toHaveTextContent('+6.0%')
    expect(screen.getByLabelText('Latest 10-year purchasing-power change')).toHaveTextContent('over the past 10 years')
    expect(await screen.findAllByTestId('chart-10')).toHaveLength(1)
  })

  it.each([[6.04, 'more'], [-2.04, 'less'], [0.049, 'about the same'], [null, 'unavailable']] as const)(
    'handles compact value %s with neutral wording',
    (value, wording) => { renderSummary(value); expect(screen.getByLabelText('Latest 10-year purchasing-power change')).toHaveTextContent(wording) },
  )

  it('switches expanded intervals while leaving the compact 10-year hero unchanged', async () => {
    renderSummary()
    fireEvent.click(screen.getByRole('button', { name: /More/ }))
    expect(await screen.findAllByTestId('chart-10')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: '4 years' }))
    expect(await screen.findByTestId('chart-4')).toBeInTheDocument()
    expect(screen.getByLabelText('Latest 10-year purchasing-power change')).toHaveTextContent('+6.0%')
    fireEvent.click(screen.getByRole('button', { name: '20 years' }))
    expect(await screen.findByTestId('chart-20')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '20 years' })).toHaveAttribute('aria-pressed', 'true')
  })
})
