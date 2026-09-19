import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EconomicSeries } from '../models/economicSeries'
import { CpiCoreComparison } from './CpiCoreComparison'

vi.mock('../charts/EconomicTimeSeriesChart', () => ({
  default: () => <div data-testid="economic-chart" />,
}))

function series(slug: string, value: number): EconomicSeries {
  return {
    id: slug,
    slug,
    provider: 'fixture',
    providerSeriesId: slug,
    title: slug,
    shortTitle: slug,
    description: 'Controlled CPI fixture.',
    question: 'Controlled question?',
    units: 'Percent',
    frequency: 'monthly',
    seasonalAdjustment: null,
    transformation: '12-month percent change',
    sourceName: 'Controlled source',
    sourceUrl: 'https://example.com',
    retrievedAt: '2031-02-01T00:00:00.000Z',
    observations: [{ date: '2031-01-01', value }],
  }
}

afterEach(cleanup)

describe('CpiCoreComparison', () => {
  it.each([
    [3.4, 2.4, '+1.0 percentage point.'],
    [3.5, 2.4, '+1.1 percentage points.'],
  ])('formats a mutable headline-core gap without brittle grammar', async (
    headline,
    coreValue,
    expected,
  ) => {
    const cpi = series('headline-cpi', headline)
    const core = series('core-cpi', coreValue)

    render(
      <CpiCoreComparison
        cpi={cpi}
        core={core}
        cpiObservations={cpi.observations}
        coreObservations={core.observations}
        zoomStartDate="2030-01-01"
        zoomEndDate="2031-01-01"
        onZoomChange={vi.fn()}
      />,
    )

    const summary = screen.getByText(/Core CPI was/)
    expect(summary).toHaveTextContent(expected)
    expect(await screen.findByTestId('economic-chart')).toBeVisible()
  })
})
