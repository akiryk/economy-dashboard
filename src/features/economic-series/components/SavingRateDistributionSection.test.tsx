import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SavingRateDistributionSection } from './SavingRateDistributionSection'

afterEach(cleanup)

describe('SavingRateDistributionSection', () => {
  it('renders the heat map, accessible values, defaults, and latest-year ordering', () => {
    render(<SavingRateDistributionSection />)
    expect(screen.getByRole('heading', { name: 'How saving differs by income' })).toBeInTheDocument()
    const grid = screen.getByRole('grid', { name: /personal saving rate by income decile/i })
    expect(within(grid).getAllByRole('gridcell')).toHaveLength(240)
    const first = within(grid).getByRole('gridcell', { name: /Bottom 10%, 2000: -152.1%/ })
    fireEvent.focus(first)
    expect(screen.getAllByText(/Bottom 10%, 2000: -152.1%.*outlays exceeded/i)).not.toHaveLength(0)
    expect(screen.getByText(/BEA saving-rate distribution coverage.*Bottom 10%: -134.2%/)).toHaveClass('visually-hidden')
    expect(screen.getByRole('heading', { name: 'Saving rates in the latest available year' })).toBeInTheDocument()
  })

  it('enforces the three-selection maximum and permits a replacement', () => {
    render(<SavingRateDistributionSection />)
    const selected = screen.getByRole('checkbox', { name: 'Bottom 10%' })
    const unavailable = screen.getByRole('checkbox', { name: '10th–20th percentile' })
    expect(selected).toBeChecked()
    expect(unavailable).toBeDisabled()
    fireEvent.click(selected)
    expect(unavailable).toBeEnabled()
    fireEvent.click(unavailable)
    expect(unavailable).toBeChecked()
  })
})
