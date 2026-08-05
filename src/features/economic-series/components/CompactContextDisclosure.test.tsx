import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CompactContextDisclosure } from './CompactContextDisclosure'

describe('CompactContextDisclosure', () => {
  it('exposes independent collapsed and expanded states with unique naming', async () => {
    const user = userEvent.setup()
    render(
      <CompactContextDisclosure accessibleSubject="business investment">
        <p>Longer interpretation</p>
      </CompactContextDisclosure>,
    )
    const toggle = screen.getByRole('button', {
      name: 'Why this matters for business investment',
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls')
    expect(screen.queryByText('Longer interpretation')).not.toBeInTheDocument()

    await user.tab()
    expect(toggle).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Longer interpretation')).toBeVisible()
    expect(screen.getByRole('button', {
      name: 'Hide context for business investment',
    })).toHaveAttribute('aria-expanded', 'true')
  })
})
