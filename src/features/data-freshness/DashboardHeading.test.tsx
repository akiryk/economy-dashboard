import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardHeading } from './DashboardHeading'

describe('DashboardHeading', () => {
  it('follows successive controlled ingestion dates without a code change', () => {
    const view = render(<DashboardHeading metadata={{
      schemaVersion: 1,
      lastSuccessfulDataRefreshDate: '2030-02-03',
    }} />)
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'U.S. Economy, February 3, 2030',
    })).toBeVisible()

    view.rerender(<DashboardHeading metadata={{
      schemaVersion: 1,
      lastSuccessfulDataRefreshDate: '2030-03-04',
    }} />)
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'U.S. Economy, March 4, 2030',
    })).toBeVisible()
  })

  it('uses the neutral heading when metadata are malformed', () => {
    render(<DashboardHeading metadata={{ schemaVersion: 1 }} />)
    expect(screen.getByRole('heading', {
      level: 1,
      name: 'U.S. Economy',
    })).toBeVisible()
  })
})
