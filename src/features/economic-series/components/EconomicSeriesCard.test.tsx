import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localEconomicSeriesRepository } from '../repositories/localEconomicSeriesRepository'
import { EconomicSeriesCard } from './EconomicSeriesCard'

vi.mock('./EconomicSeriesSummary', () => ({
  EconomicSeriesSummary: () => <article>Loaded economic series</article>,
}))
vi.mock('./InflationDriversSummary', () => ({
  InflationDriversSummary: ({
    supportingSeries,
  }: {
    supportingSeries: Array<{ slug: string }>
  }) => (
    <article>
      Inflation drivers with {supportingSeries.map(({ slug }) => slug).join(', ')}
    </article>
  ),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('EconomicSeriesCard', () => {
  it('does not reload a series without supporting data after rerendering', async () => {
    const getBySlug = vi.spyOn(localEconomicSeriesRepository, 'getBySlug')
    const { rerender } = render(
      <EconomicSeriesCard slug="headline-cpi-inflation" label="CPI" />,
    )

    expect(await screen.findByText('Loaded economic series')).toBeVisible()
    await waitFor(() => expect(getBySlug).toHaveBeenCalledTimes(1))

    rerender(<EconomicSeriesCard slug="headline-cpi-inflation" label="CPI" />)

    await waitFor(() => expect(getBySlug).toHaveBeenCalledTimes(1))
  })

  it('keeps inflation drivers available when one optional series fails', async () => {
    const original = localEconomicSeriesRepository.getBySlug.bind(
      localEconomicSeriesRepository,
    )
    vi.spyOn(localEconomicSeriesRepository, 'getBySlug')
      .mockImplementation((slug) => slug === 'energy-cpi-inflation'
        ? Promise.reject(new Error('fixture failure'))
        : original(slug))
    render(
      <EconomicSeriesCard
        slug="headline-cpi-inflation"
        label="inflation drivers"
        variant="inflation-drivers"
        supportingSlugs={[
          'shelter-cpi-inflation',
          'energy-cpi-inflation',
          'food-cpi-inflation',
        ]}
      />,
    )
    expect(await screen.findByText(
      'Inflation drivers with shelter-cpi-inflation, food-cpi-inflation',
    )).toBeVisible()
  })
})
