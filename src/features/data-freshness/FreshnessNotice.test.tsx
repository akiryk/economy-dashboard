import { render, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FreshnessProvider, FreshnessScope, type PublicFreshnessState } from './FreshnessContext'
import { FreshnessNotice } from './FreshnessNotice'
import { DashboardFreshnessAlert } from './DashboardFreshnessAlert'

function renderNotice(states: readonly PublicFreshnessState[], keys = ['shared-series']) {
  return render(
    <FreshnessProvider initialStates={states}>
      <FreshnessScope datasetKeys={keys}>
        <FreshnessNotice />
        <p>As of July 2026</p>
      </FreshnessScope>
    </FreshnessProvider>,
  )
}

describe('FreshnessNotice', () => {
  it('adds no visual clutter for healthy data and preserves the observation period', () => {
    const view = renderNotice([{ datasetId: 'shared-series', state: 'healthy', message: 'Current.' }])
    expect(within(view.container).queryByRole('status')).not.toBeInTheDocument()
    expect(within(view.container).getByText('As of July 2026')).toBeVisible()
  })

  it.each([
    ['late-provider', 'Source update delayed', 'status'],
    ['warning', 'Update requires review', 'status'],
    ['unexpectedly-stale', 'Data update overdue', 'alert'],
    ['failure', 'Data update failed', 'alert'],
  ] as const)('renders %s with accessible textual semantics', (state, label, role) => {
    const view = renderNotice([{ datasetId: 'shared-series', state, message: 'Controlled explanation.' }])
    expect(within(view.container).getByRole(role)).toHaveTextContent(`${label}: Controlled explanation.`)
  })

  it('uses the strongest shared-dataset state consistently', () => {
    const view = renderNotice([
      { datasetId: 'primary', state: 'healthy', message: 'Current.' },
      { datasetId: 'supporting', state: 'unexpectedly-stale', message: 'Supporting data overdue.' },
    ], ['primary', 'supporting'])
    expect(within(view.container).getByRole('alert')).toHaveTextContent('Supporting data overdue.')
  })
})

describe('DashboardFreshnessAlert', () => {
  it('renders the global refresh failure prominently', () => {
    const view = render(
      <FreshnessProvider initialStates={[{
        datasetId: 'dashboard-refresh',
        state: 'failure',
        message: 'Data is possibly out of date.',
      }]}
      >
        <DashboardFreshnessAlert />
      </FreshnessProvider>,
    )
    const alert = within(view.container).getByRole('alert')
    expect(alert).toHaveClass('dashboard-refresh-alert')
    expect(within(alert).getByText('Data is possibly out of date.', { selector: 'strong' }))
      .toBeVisible()
  })

  it('stays absent without a refresh failure', () => {
    const view = render(
      <FreshnessProvider initialStates={[]}>
        <DashboardFreshnessAlert />
      </FreshnessProvider>,
    )
    expect(within(view.container).queryByRole('alert')).not.toBeInTheDocument()
  })
})
