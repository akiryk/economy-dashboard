import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('links to both dashboard presentations and the existing supporting routes', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Secondary indicators' }),
    ).toHaveAttribute('href', '/secondary')
    expect(screen.getByRole('link', { name: 'Research dashboard' }))
      .toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Status dashboard' }))
      .toHaveAttribute('href', '/dashboard')
    expect(screen.getByRole('link', { name: 'Labor briefing preview' }))
      .toHaveAttribute('href', '/briefing')
  })
})
