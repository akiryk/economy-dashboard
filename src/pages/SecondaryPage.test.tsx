import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SecondaryPage } from './SecondaryPage'

vi.mock('../features/economic-series/charts/EconomicTimeSeriesChart', () => ({
  default: () => <div data-testid="productivity-level-chart" />,
}))

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
})
