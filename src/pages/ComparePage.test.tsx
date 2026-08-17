import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ComparePage } from './ComparePage'

afterEach(cleanup)

describe('ComparePage', () => {
  it('introduces the international comparison purpose', () => {
    render(<ComparePage />)
    expect(screen.getByRole('heading', { name: 'Compare economies' })).toBeVisible()
    expect(screen.getByText(/compares with other wealthy economies/i)).toBeVisible()
    expect(screen.getByRole('heading', { name: 'What share of prime-age adults are employed?' })).toBeVisible()
  })
})
