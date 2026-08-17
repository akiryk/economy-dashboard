import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppRouterProvider } from './AppRouterProvider'
import { appRoutes } from './router'

vi.mock('../pages/DashboardPage', () => ({
  DashboardPage: () => <h1>Research route</h1>,
}))
vi.mock('../pages/StatusDashboardPage', () => ({
  StatusDashboardPage: () => <h1>Status route</h1>,
}))
vi.mock('../pages/ComparePage', () => ({
  ComparePage: () => <h1>Compare route</h1>,
}))
vi.mock('../pages/SecondaryPage', () => ({
  SecondaryPage: () => <h1>Secondary route</h1>,
}))

afterEach(cleanup)

describe('AppRouterProvider', () => {
  it('commits every header navigation immediately without a page reload', async () => {
    const user = userEvent.setup()
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/'] })
    render(<AppRouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: 'Research route' })).toBeVisible()

    await user.click(screen.getByRole('link', { name: 'Status dashboard' }))
    expect(screen.getByRole('heading', { name: 'Status route' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/dashboard')

    await user.click(screen.getByRole('link', { name: 'Compare' }))
    expect(screen.getByRole('heading', { name: 'Compare route' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/compare')

    await user.click(screen.getByRole('link', { name: 'Research dashboard' }))
    expect(screen.getByRole('heading', { name: 'Research route' })).toBeVisible()
    expect(router.state.location.pathname).toBe('/')
  })

  it('keeps the secondary page available as an unlinked route', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/secondary'] })
    render(<AppRouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: 'Secondary route' })).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Secondary indicators' }))
      .not.toBeInTheDocument()
  })

  it('does not expose the removed Labor briefing route', async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ['/briefing'] })
    render(<AppRouterProvider router={router} />)

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible()
  })
})
