import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('links only to the two dashboard presentations', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Research dashboard' }))
      .toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Status dashboard' }))
      .toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Secondary indicators' }))
      .not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Labor briefing preview' }))
      .not.toBeInTheDocument()
  })
})
