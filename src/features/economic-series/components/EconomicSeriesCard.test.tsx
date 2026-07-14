import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { localEconomicSeriesRepository } from '../repositories/localEconomicSeriesRepository'
import { EconomicSeriesCard } from './EconomicSeriesCard'

vi.mock('./EconomicSeriesSummary', () => ({
  EconomicSeriesSummary: () => <article>Loaded economic series</article>,
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
})
