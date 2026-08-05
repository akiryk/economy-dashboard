import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SecondaryPage } from './SecondaryPage'

vi.mock('../features/economic-series/charts/EconomicTimeSeriesChart', () => ({
  default: () => <div data-testid="productivity-level-chart" />,
}))

afterEach(cleanup)

describe('SecondaryPage', () => {
  it('retains the productivity-level card outside the main dashboard', async () => {
    const user = userEvent.setup()
    render(<SecondaryPage />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Secondary indicators' }),
    ).toBeVisible()
    const growth = screen.getByRole('region', { name: 'Growth' })
    const card = await within(growth).findByRole('article', {
      name: 'How much more productive is the economy than in the past?',
    })

    expect(card).toHaveAttribute('id', 'labor-productivity-level-card')
    expect(within(card).getByLabelText('Cumulative productivity change')).toBeVisible()
    expect(within(card).getByRole('group', {
      name: 'Productivity over time displayed time range',
    })).toBeVisible()

    await user.click(within(card).getByRole('button', { name: '5 years' }))
    expect(within(card).getByText(/start of the selected 5-year period/)).toBeVisible()
    await user.click(within(card).getByText('Recent observations'))
    const table = within(card).getByRole('table', {
      name: 'Eight most recent normalized productivity-level observations',
    })
    expect(within(table).getAllByRole('row')).toHaveLength(9)
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
  })

  it('retains the household-resources card outside the main dashboard', async () => {
    render(<SecondaryPage />)

    const households = screen.getByRole('region', { name: 'Households' })
    const card = await within(households).findByRole('article', {
      name: 'Are real household incomes and spending growing per person?',
    })

    expect(card).toHaveAttribute('id', 'real-income-versus-spending-card')
    expect(within(card).getByText(/Latest shared quarter: \d{4} Q[1-4]/)).toBeVisible()
    expect(within(card).getByRole('button', { name: 'Maximum' })).toBeVisible()
  })

  it('retains the household debt-burden card outside the main dashboard', async () => {
    render(<SecondaryPage />)

    const households = screen.getByRole('region', { name: 'Households' })
    const card = await within(households).findByRole('article', {
      name: 'How much of household income is going toward required debt payments?',
    })

    expect(card).toHaveAttribute('id', 'household-debt-service-ratio-card')
    expect(within(card).getByLabelText('Latest household debt-service ratio'))
      .toHaveTextContent('11.2%')
  })

  it('retains the manufacturing output-versus-employment research card', async () => {
    const user = userEvent.setup()
    render(<SecondaryPage />)
    const section = screen.getByRole('region', { name: 'Business and manufacturing' })
    const card = await within(section).findByRole('article', {
      name: 'Are manufacturing output and jobs moving together?',
    })
    expect(within(card).getByText(/Both lines begin at 100/)).toBeVisible()
    expect(within(card).getByRole('button', { name: '20 years' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(within(card).getByRole('button', { name: 'Maximum' }))
    expect(within(card).getByText(/Since January 1972/)).toBeVisible()
    await user.click(within(card).getByText('Recent observations'))
    expect(within(card).getByRole('table', { name: /Twelve most recent aligned manufacturing observations/ })).toBeVisible()
  })

  it('moves capacity utilization into Industrial Activity with its research controls', async () => {
    const user = userEvent.setup()
    render(<SecondaryPage />)
    const section = screen.getByRole('region', { name: 'Industrial Activity' })
    const card = await within(section).findByRole('article', {
      name: 'How much spare industrial capacity is there?',
    })

    expect(within(card).getByLabelText('Latest industrial capacity utilization')).toHaveTextContent('76.1%')
    expect(within(card).getByText('Industrial capacity currently in use')).toBeVisible()
    expect(within(card).getByText(/leaving more spare capacity than normal/)).toBeVisible()
    expect(within(card).getByText('76.1% in use, about 3.3 percentage points below the 1972–2025 long-run average of 79.4%.')).toBeVisible()
    expect(within(card).getByRole('button', { name: 'Maximum' })).toBeVisible()
    await user.click(within(card).getByText('Series details'))
    expect(within(card).getByRole('link', { name: /79.4%/ })).toHaveAttribute('href', 'https://www.federalreserve.gov/releases/g17/current/table0.htm')
    expect(within(card).getByRole('link', { name: /Board of Governors/ })).toHaveAttribute('href', 'https://fred.stlouisfed.org/series/TCU')
  })

  it('retains broad credit and bank lending standards under Financial conditions', async () => {
    render(<SecondaryPage />)
    const section = screen.getByRole('region', { name: 'Financial conditions' })
    const credit = await within(section).findByRole('article', {
      name: 'Are credit conditions tighter or looser than usual?',
    })
    const lending = await within(section).findByRole('article', {
      name: 'Are banks making it harder to borrow?',
    })

    expect(within(section).getAllByRole('article')).toHaveLength(2)
    expect(within(credit).getByLabelText('Latest broad credit-conditions index'))
      .toHaveTextContent(/-?\d+\.\d+/)
    expect(within(credit).getByText(/not a percentage/)).toBeVisible()
    expect(within(lending).getByLabelText('Latest bank lending standards'))
      .toBeVisible()
    expect(within(lending).getByText(/not a denial rate/)).toBeVisible()
  })
})
