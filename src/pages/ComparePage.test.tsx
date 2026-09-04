import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FreshnessProvider } from '../features/data-freshness/FreshnessContext'
import { DashboardFreshnessAlert } from '../features/data-freshness/DashboardFreshnessAlert'
import { ComparePage } from './ComparePage'

afterEach(cleanup)

describe('ComparePage', () => {
  it('introduces the international comparison purpose', () => {
    render(<ComparePage />)
    expect(screen.getByRole('heading', { name: 'Compare economies' })).toBeVisible()
    expect(screen.getByText(/compares with other wealthy economies/i)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'What share of prime-age adults are employed?' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'How high is unemployment?' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'How quickly are consumer prices rising?' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'How quickly is real economic output growing?' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'What are governments paying to borrow for about ten years?' })).toBeVisible()
    expect(screen.getAllByText('Spain')).toHaveLength(5)
    expect(screen.getByText('No observation')).toBeVisible()
    expect(screen.getAllByText(/higher or lower is not inherently better/i)).toHaveLength(3)
    expect(screen.getAllByRole('article')).toHaveLength(5)
    expect(screen.getAllByRole('listitem')).toHaveLength(50)
    expect(screen.getAllByText('U.S. focus')).toHaveLength(5)
    expect(screen.getAllByRole('link', { name: 'OECD Data Explorer source' })).toHaveLength(5)
  })

  it('shows one scoped OECD failure without creating a dashboard warning', () => {
    render(
      <FreshnessProvider initialStates={[{
        datasetId: 'international-comparisons',
        state: 'failure',
        message: 'International comparison data could not be refreshed; last-known-good data are shown.',
      }]}
      >
        <ComparePage />
        <DashboardFreshnessAlert />
      </FreshnessProvider>,
    )

    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Data update failed: International comparison data could not be refreshed; last-known-good data are shown.',
    )
    expect(document.querySelector('.dashboard-refresh-alert')).not.toBeInTheDocument()
  })
})
