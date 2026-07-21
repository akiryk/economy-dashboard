import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppHeader } from './AppHeader'

describe('AppHeader', () => {
  it('links to the secondary indicators page from the primary navigation', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Secondary indicators' }),
    ).toHaveAttribute('href', '/secondary')
  })
})
